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
  Download,
  Edit,
  Clock
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
  onNavigateToPayment?: (data: any) => void;
}

const PaymentsSection = ({ onBack, onNavigateToPayment }: PaymentsSectionProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
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
    fetchPendingPayments();
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

  const fetchPendingPayments = async () => {
    try {
      // Fetch pending payments
      const { data: paymentData, error } = await supabase
        .from("payments")
        .select(`
          *,
          doctors (
            name
          )
        `)
        .eq("payment_status", "pending");

      if (error) throw error;

      // Fetch patients from both gender tables
      const [maleResults, femaleResults] = await Promise.all([
        supabase
          .from('male_patients')
          .select('id, patient_name, patient_phone, preferred_appointment_date, preferred_appointment_time, chief_complaint')
          .eq('status', 'payment_pending'),
        supabase
          .from('female_patients')
          .select('id, patient_name, patient_phone, preferred_appointment_date, preferred_appointment_time, chief_complaint')
          .eq('status', 'payment_pending')
      ]);

      const allPatients = [
        ...(maleResults.data || []).map(p => ({ ...p, gender: 'male', table: 'male_patients' })),
        ...(femaleResults.data || []).map(p => ({ ...p, gender: 'female', table: 'female_patients' }))
      ];

      // Match patients with their payment records
      const paymentsWithPatients = [];
      
      for (const payment of paymentData || []) {
        const patient = allPatients.find(p => 
          p.id === payment.patient_id && 
          (payment.patient_table === p.table)
        );
        
        if (patient) {
          paymentsWithPatients.push({
            id: payment.patient_id,
            patient_name: patient.patient_name,
            patient_phone: patient.patient_phone,
            preferred_appointment_date: patient.preferred_appointment_date,
            preferred_appointment_time: patient.preferred_appointment_time,
            chief_complaint: patient.chief_complaint,
            hijama_points_count: payment.hijama_points_count,
            calculated_price: payment.amount,
            payment_id: payment.id,
            patient_table: patient.table
          });
        }
      }

      setPendingPayments(paymentsWithPatients);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات المدفوعات المعلقة",
        variant: "destructive",
      });
    }
  };

  const handlePaymentNavigation = (patient: any) => {
    if (onNavigateToPayment) {
      onNavigateToPayment({
        patientId: patient.id,
        patientName: patient.patient_name,
        patientPhone: patient.patient_phone,
        appointmentDate: patient.preferred_appointment_date,
        appointmentTime: patient.preferred_appointment_time,
        hijamaPointsCount: patient.hijama_points_count,
        calculatedPrice: patient.calculated_price
      });
    }
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
        <Button onClick={() => {
          fetchPayments();
          fetchPendingPayments();
        }} variant="outline">
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

      {/* Today's Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            المدفوعات اليوم ({filteredPayments.length})
          </CardTitle>
          <CardDescription>
            المرضى الذين تم دفعهم وتعيين طبيب لهم اليوم
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا يوجد مدفوعات اليوم</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم المريض</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>الطبيب المخصص</TableHead>
                    <TableHead>المبلغ المدفوع</TableHead>
                    <TableHead>عدد النقاط</TableHead>
                    <TableHead>وقت الدفع</TableHead>
                    <TableHead>الإجراءات</TableHead>
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
                        {format(new Date(payment.paid_at), "HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                          تعديل
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

      {/* Pending Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            المدفوعات المعلقة ({pendingPayments.length})
          </CardTitle>
          <CardDescription>
            المرضى الذين ينتظرون الدفع وتعيين طبيب
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : pendingPayments.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مدفوعات معلقة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم المريض</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>تاريخ الموعد</TableHead>
                    <TableHead>الوقت</TableHead>
                    <TableHead>نقاط الحجامة</TableHead>
                    <TableHead>المبلغ المتوقع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {patient.patient_name}
                        </div>
                      </TableCell>
                      <TableCell>{patient.patient_phone}</TableCell>
                      <TableCell>
                        {patient.preferred_appointment_date ? 
                          format(new Date(patient.preferred_appointment_date), "dd/MM/yyyy") 
                          : 'غير محدد'
                        }
                      </TableCell>
                      <TableCell>{patient.preferred_appointment_time || 'غير محدد'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {patient.hijama_points_count || 0} نقطة
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {Number(patient.calculated_price || 0).toFixed(2)} ريال
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-orange-600">
                          في انتظار الدفع
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="healing" 
                          size="sm"
                          onClick={() => handlePaymentNavigation(patient)}
                        >
                          دفع وتعيين طبيب
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
  );
};

export default PaymentsSection;