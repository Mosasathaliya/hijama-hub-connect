import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, 
  Calendar,
  Search,
  DollarSign,
  User,
  Stethoscope,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
}

interface PaymentsSectionProps {
  onBack?: () => void;
}

const PaymentsSection = ({ onBack }: PaymentsSectionProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const { toast } = useToast();

  const getPaymentMethodInArabic = (method: string) => {
    switch (method) {
      case 'card':
        return 'بطاقة ائتمانية';
      case 'cash':
        return 'نقداً';
      case 'bank_transfer':
        return 'تحويل بنكي';
      default:
        return 'نقداً';
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [payments, selectedPaymentMethod]);

  // Filter payments based on selected payment method
  const filteredPayments = selectedPaymentMethod === "all" 
    ? payments 
    : payments.filter(payment => payment.payment_method === selectedPaymentMethod);

  const fetchPayments = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      
      const start = startDate || fromDate;
      const end = endDate || toDate;
      
      // Create start and end timestamps for the date range
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch payments
      const { data: paymentData, error } = await supabase
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
        (paymentData || []).map(async (payment) => {
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
            id: payment.id,
            amount: payment.amount,
            hijama_points_count: payment.hijama_points_count,
            paid_at: payment.paid_at,
            payment_method: payment.payment_method || "نقدي",
            payment_status: payment.payment_status,
            patient_name: patientData?.patient_name || 'غير متوفر',
            patient_phone: patientData?.patient_phone || 'غير متوفر',
            doctor_name: payment.doctors?.name || 'غير محدد'
          };
        })
      );

      const formattedPayments = paymentsWithPatients || [];

      setPayments(formattedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات المدفوعات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const total = filteredPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    setTotalAmount(total);
  };

  const handleDateFilter = () => {
    fetchPayments(fromDate, toDate);
  };

  const handleTodayFilter = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setFromDate(today);
    setToDate(today);
    fetchPayments(today, today);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button onClick={onBack} variant="outline">
              العودة للوحة التحكم
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-primary">إدارة المدفوعات</h2>
            <p className="text-muted-foreground">عرض وإدارة جميع المدفوعات</p>
          </div>
        </div>
        <Button onClick={() => fetchPayments()} variant="outline">
          تحديث
        </Button>
      </div>

      {/* Date Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            تصفية حسب التاريخ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-40">
              <Label htmlFor="from-date">من تاريخ</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-40">
              <Label htmlFor="to-date">إلى تاريخ</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-40">
              <Label htmlFor="payment-method">طريقة الدفع</Label>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الطرق</SelectItem>
                  <SelectItem value="card">بطاقة ائتمانية</SelectItem>
                  <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleDateFilter} className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              بحث
            </Button>
            <Button onClick={handleTodayFilter} variant="outline" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              اليوم
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-primary">عدد المدفوعات</CardTitle>
            <div className="text-3xl font-bold text-accent">{filteredPayments.length}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-primary">إجمالي المبلغ</CardTitle>
            <div className="text-3xl font-bold text-accent">{totalAmount.toFixed(2)} ر.س</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-primary">متوسط المبلغ</CardTitle>
            <div className="text-3xl font-bold text-accent">
              {filteredPayments.length > 0 ? (totalAmount / filteredPayments.length).toFixed(2) : "0"} ر.س
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            المدفوعات ({filteredPayments.length})
          </CardTitle>
          <CardDescription>
            عرض المدفوعات من {format(new Date(fromDate), "dd/MM/yyyy")} إلى {format(new Date(toDate), "dd/MM/yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا يوجد مدفوعات في هذه الفترة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم المريض</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>الطبيب</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>عدد النقاط</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>تاريخ الدفع</TableHead>
                    <TableHead>الوقت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {payment.patient_name}
                        </div>
                      </TableCell>
                      <TableCell>{payment.patient_phone}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-muted-foreground" />
                          {payment.doctor_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {Number(payment.amount).toFixed(2)} ريال
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.hijama_points_count} نقطة
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getPaymentMethodInArabic(payment.payment_method)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.paid_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.paid_at), "HH:mm")}
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
  );
};

export default PaymentsSection;