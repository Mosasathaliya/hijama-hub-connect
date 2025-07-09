import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Printer, Eye, Calendar, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import QRCode from "qrcode";

interface Payment {
  id: string;
  amount: number;
  hijama_points_count: number;
  paid_at: string;
  payment_method: string;
  payment_status: string;
  patient_name: string;
  patient_phone: string;
  doctor_name: string;
  is_taxable?: boolean;
}

interface Invoice {
  id: string;
  invoice_number: string;
  payment: Payment;
  issue_date: string;
  due_date: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  qr_code: string;
}

interface InvoiceSectionProps {
  onBack: () => void;
}

const InvoiceSection = ({ onBack }: InvoiceSectionProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Real-time subscription for payments
  useEffect(() => {
    const channel = supabase
      .channel('payments-invoice-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          console.log('Payment changed, refreshing invoices:', payload);
          fetchTodayInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date]);

  // Company Information (ZATCA compliant)
  const COMPANY_INFO = {
    name: "مركز الخير تداوي للحجامة",
    nameEn: "Markaz AlKhair Tadawi Lal Hijama",
    taxNumber: "310940369500003",
    address: "المملكة العربية السعودية",
    addressEn: "Kingdom of Saudi Arabia",
    phone: "+966-XXX-XXXXXX",
    email: "info@alkhair-hijama.com"
  };

  useEffect(() => {
    fetchTodayInvoices();
  }, [date]);

  const generateInvoiceNumber = (paymentId: string, paymentDate: string) => {
    const dateStr = format(new Date(paymentDate), "yyyyMMdd");
    const shortId = paymentId.slice(-6).toUpperCase();
    return `INV-${dateStr}-${shortId}`;
  };

  const generateQRCode = async (invoice: Invoice): Promise<string> => {
    try {
      // Only generate ZATCA QR Code for taxable invoices
      if (!invoice.payment.is_taxable) {
        // Simple QR code for non-taxable invoices
        const qrData = `Invoice: ${invoice.invoice_number}\nPatient: ${invoice.payment.patient_name}\nAmount: ${invoice.total_amount.toFixed(2)} SAR\nDate: ${invoice.issue_date}`;
        
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 150,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        
        return qrCodeDataURL;
      }

      // ZATCA QR Code format for taxable invoices (Base64 encoded TLV)
      const sellerName = COMPANY_INFO.name;
      const vatNumber = COMPANY_INFO.taxNumber;
      const timestamp = invoice.issue_date;
      const totalAmount = invoice.total_amount.toFixed(2);
      const vatAmount = invoice.vat_amount.toFixed(2);

      // ZATCA compliant QR data format
      const qrData = `Invoice: ${invoice.invoice_number}\nSeller: ${sellerName}\nVAT: ${vatNumber}\nDate: ${timestamp}\nTotal: ${totalAmount} SAR\nVAT Amount: ${vatAmount} SAR`;
      
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const fetchTodayInvoices = async () => {
    try {
      setLoading(true);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: paymentsData, error } = await supabase
        .from("payments")
        .select(`
          *,
          doctors (
            name
          )
        `)
        .eq("payment_status", "completed")
        .gte("paid_at", startOfDay.toISOString())
        .lte("paid_at", endOfDay.toISOString())
        .order("paid_at", { ascending: false });

      if (error) throw error;

      // For each payment, fetch patient data from the appropriate table
      const paymentsWithPatients = await Promise.all(
        (paymentsData || []).map(async (payment) => {
          let patientData = null;
          
          if (payment.patient_table === 'male_patients') {
            const { data } = await supabase
              .from('male_patients')
              .select('patient_name, patient_phone')
              .eq('id', payment.patient_id)
              .single();
            patientData = data;
          } else if (payment.patient_table === 'female_patients') {
            const { data } = await supabase
              .from('female_patients')
              .select('patient_name, patient_phone')
              .eq('id', payment.patient_id)
              .single();
            patientData = data;
          } else {
            const { data } = await supabase
              .from('patient_forms')
              .select('patient_name, patient_phone')
              .eq('id', payment.patient_id)
              .single();
            patientData = data;
          }

          return {
            ...payment,
            patient_data: patientData
          };
        })
      );

      // Convert payments to invoices
      const invoicePromises = paymentsWithPatients?.map(async (payment) => {
        const invoiceNumber = generateInvoiceNumber(payment.id, payment.paid_at);
        const isTaxable = payment.is_taxable || false;
        
        // Calculate amounts based on taxable status
        let subtotal, vatAmount, totalAmount;
        if (isTaxable) {
          subtotal = Number(payment.amount); // Base amount before tax
          vatAmount = subtotal * 0.15; // 15% VAT on subtotal
          totalAmount = subtotal + vatAmount; // Total including VAT
        } else {
          subtotal = Number(payment.amount); // No VAT calculation
          vatAmount = 0; // No VAT for non-taxable
          totalAmount = Number(payment.amount); // Total is same as subtotal
        }
        
        const invoice: Invoice = {
          id: payment.id,
          invoice_number: invoiceNumber,
          payment: {
            id: payment.id,
            amount: Number(payment.amount),
            hijama_points_count: payment.hijama_points_count,
            paid_at: payment.paid_at,
            payment_method: payment.payment_method || "نقدي",
            payment_status: payment.payment_status,
            patient_name: payment.patient_data?.patient_name || 'غير متوفر',
            patient_phone: payment.patient_data?.patient_phone || 'غير متوفر',
            doctor_name: payment.doctors?.name || 'غير محدد',
            is_taxable: isTaxable
          },
          issue_date: payment.paid_at,
          due_date: payment.paid_at, // Same day for immediate payment
          subtotal: subtotal,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          qr_code: ""
        };

        // Generate QR code
        invoice.qr_code = await generateQRCode(invoice);
        return invoice;
      }) || [];

      const invoicesWithQR = await Promise.all(invoicePromises);
      setInvoices(invoicesWithQR);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات الفواتير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      
      document.body.innerHTML = `
        <div style="font-family: Arial, sans-serif; direction: rtl;">
          ${printContent}
        </div>
      `;
      
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Restore React state
    }
  };

  const InvoicePreview = ({ invoice }: { invoice: Invoice }) => (
    <div ref={printRef} className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-2 border-gray-300 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="text-right">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">{COMPANY_INFO.name}</h1>
            <p className="text-lg text-gray-600 mb-1">{COMPANY_INFO.nameEn}</p>
            <p className="text-sm text-gray-600">{COMPANY_INFO.address}</p>
            <p className="text-sm text-gray-600">{COMPANY_INFO.addressEn}</p>
            <p className="text-sm text-gray-600">الرقم الضريبي: {COMPANY_INFO.taxNumber}</p>
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              {invoice.payment.is_taxable ? "فاتورة ضريبية" : "فاتورة"}
            </h2>
            <p className="text-lg font-bold">
              {invoice.payment.is_taxable ? "Tax Invoice" : "Invoice"}
            </p>
            <div className="mt-4">
              <p className="text-sm"><strong>رقم الفاتورة:</strong> {invoice.invoice_number}</p>
              <p className="text-sm"><strong>تاريخ الإصدار:</strong> {format(new Date(invoice.issue_date), "dd/MM/yyyy")}</p>
              <p className="text-sm"><strong>تاريخ الاستحقاق:</strong> {format(new Date(invoice.due_date), "dd/MM/yyyy")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3 text-blue-800">بيانات العميل - Customer Information</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p><strong>اسم العميل:</strong> {invoice.payment.patient_name}</p>
          <p><strong>رقم الهاتف:</strong> {invoice.payment.patient_phone}</p>
          <p><strong>الطبيب المعالج:</strong> {invoice.payment.doctor_name}</p>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="border border-gray-300 p-3 text-right">#</th>
              <th className="border border-gray-300 p-3 text-right">وصف الخدمة - Service Description</th>
              <th className="border border-gray-300 p-3 text-center">الكمية - Qty</th>
              <th className="border border-gray-300 p-3 text-center">السعر - Price</th>
              <th className="border border-gray-300 p-3 text-center">الإجمالي - Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-3">1</td>
              <td className="border border-gray-300 p-3">
                جلسة حجامة علاجية ({invoice.payment.hijama_points_count} نقطة)
                <br />
                <span className="text-sm text-gray-600">Therapeutic Hijama Session ({invoice.payment.hijama_points_count} points)</span>
              </td>
              <td className="border border-gray-300 p-3 text-center">1</td>
              <td className="border border-gray-300 p-3 text-center">{invoice.subtotal.toFixed(2)} ر.س</td>
              <td className="border border-gray-300 p-3 text-center">{invoice.subtotal.toFixed(2)} ر.س</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="border border-gray-300">
            <div className="flex justify-between p-3 border-b border-gray-300">
              <span>المجموع الفرعي - Subtotal:</span>
              <span>{invoice.subtotal.toFixed(2)} ر.س</span>
            </div>
            {invoice.payment.is_taxable && (
              <div className="flex justify-between p-3 border-b border-gray-300">
                <span>ضريبة القيمة المضافة (15%) - VAT (15%):</span>
                <span>{invoice.vat_amount.toFixed(2)} ر.س</span>
              </div>
            )}
            <div className="flex justify-between p-3 bg-blue-800 text-white font-bold">
              <span>المجموع الكلي - Total Amount:</span>
              <span>{invoice.total_amount.toFixed(2)} ر.س</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-6">
        <p><strong>طريقة الدفع - Payment Method:</strong> {invoice.payment.payment_method}</p>
        <p><strong>حالة الدفع - Payment Status:</strong> مدفوع - Paid</p>
      </div>

      {/* QR Code */}
      <div className="flex justify-between items-end">
        <div className="text-sm text-gray-600">
          <p>شكراً لثقتكم بنا - Thank you for your trust</p>
          <p>هذه فاتورة معتمدة إلكترونياً وفقاً لمتطلبات هيئة الزكاة والضريبة والجمارك</p>
          <p>This is an electronically approved invoice according to ZATCA requirements</p>
        </div>
        <div className="text-center">
          {invoice.qr_code && (
            <img src={invoice.qr_code} alt="QR Code" className="w-32 h-32" />
          )}
          <p className="text-xs text-gray-600 mt-2">رمز الاستجابة السريعة - QR Code</p>
        </div>
      </div>
    </div>
  );

  if (selectedInvoice) {
    return (
      <div className="min-h-screen bg-gradient-healing">
        <div className="bg-card shadow-soft border-b border-primary/10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-primary">معاينة الفاتورة</h1>
                <p className="text-sm text-muted-foreground">فاتورة رقم: {selectedInvoice.invoice_number}</p>
              </div>
            </div>
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <InvoicePreview invoice={selectedInvoice} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-healing">
      <div className="bg-card shadow-soft border-b border-primary/10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">الفواتير الضريبية</h1>
            <p className="text-sm text-muted-foreground">فواتير معتمدة وفقاً لمتطلبات هيئة الزكاة والضريبة والجمارك</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Date Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              تصفية حسب التاريخ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1 max-w-xs">
                <Label htmlFor="invoice-date">التاريخ</Label>
                <Input
                  id="invoice-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <Button onClick={fetchTodayInvoices} className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                عرض الفواتير
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-primary">عدد الفواتير</CardTitle>
              <div className="text-3xl font-bold text-accent">{invoices.length}</div>
            </CardHeader>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-green-600" />
              الفواتير الضريبية ({invoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8">
                <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا يوجد فواتير في هذا التاريخ</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>الطبيب</TableHead>
                      <TableHead>المبلغ الفرعي</TableHead>
                      <TableHead>الضريبة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{invoice.invoice_number}</Badge>
                        </TableCell>
                        <TableCell>{invoice.payment.patient_name}</TableCell>
                        <TableCell>{invoice.payment.doctor_name}</TableCell>
                        <TableCell>{invoice.subtotal.toFixed(2)} ر.س</TableCell>
                        <TableCell>{invoice.vat_amount.toFixed(2)} ر.س</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {invoice.total_amount.toFixed(2)} ر.س
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.issue_date), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoice(invoice)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            عرض
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceSection;