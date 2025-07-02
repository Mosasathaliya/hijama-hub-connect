import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Doctor {
  id: string;
  name: string;
}

interface Payment {
  id: string;
  amount: number;
  paid_at: string;
  patient_form_id: string;
  patient_forms: {
    patient_name: string;
    patient_phone: string;
  };
}

interface ManagementSectionProps {
  onBack: () => void;
}

const ManagementSection = ({ onBack }: ManagementSectionProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [commission, setCommission] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة الأطباء",
        variant: "destructive",
      });
    }
  };

  const fetchTreatments = async () => {
    if (!selectedDoctor) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار طبيب أولاً",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, let's check all payments for debugging
      const { data: allPayments, error: debugError } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          paid_at,
          doctor_id,
          payment_status,
          patient_form_id,
          patient_forms (
            patient_name,
            patient_phone
          )
        `)
        .order('created_at', { ascending: false });

      console.log('All payments:', allPayments);
      console.log('Selected doctor ID:', selectedDoctor);

      let query = supabase
        .from('payments')
        .select(`
          id,
          amount,
          paid_at,
          doctor_id,
          payment_status,
          patient_form_id,
          patient_forms (
            patient_name,
            patient_phone
          )
        `)
        .eq('doctor_id', selectedDoctor)
        .order('paid_at', { ascending: false });

      // Remove payment_status filter for now to see all payments for the doctor
      // .eq('payment_status', 'paid')

      if (fromDate) {
        query = query.gte('paid_at', format(fromDate, 'yyyy-MM-dd') + 'T00:00:00.000Z');
      }
      if (toDate) {
        query = query.lte('paid_at', format(toDate, 'yyyy-MM-dd') + 'T23:59:59.999Z');
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('Filtered payments for doctor:', data);
      setPayments(data || []);
      
      // Calculate totals
      const total = (data || []).reduce((sum, payment) => sum + Number(payment.amount), 0);
      setTotalAmount(total);
      setCommission(total * 0.03); // 3% commission

    } catch (error) {
      console.error('Error fetching treatments:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات العلاجات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-healing p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة
          </Button>
          <h1 className="text-3xl font-bold text-primary">الإدارة - تقارير الأطباء</h1>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>فلترة العلاجات</CardTitle>
            <CardDescription>اختر الطبيب والتاريخ لعرض التقارير</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Doctor Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">اختر الطبيب</label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طبيب..." />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* From Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">من تاريخ</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "dd/MM/yyyy") : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* To Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">إلى تاريخ</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "dd/MM/yyyy") : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search Button */}
              <div className="space-y-2">
                <label className="text-sm font-medium invisible">بحث</label>
                <Button 
                  onClick={fetchTreatments} 
                  disabled={loading || !selectedDoctor}
                  className="w-full"
                  variant="healing"
                >
                  {loading ? "جاري البحث..." : "بحث"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {payments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border-primary/10">
              <CardHeader className="text-center">
                <CardTitle className="text-primary">إجمالي المبلغ</CardTitle>
                <div className="text-3xl font-bold text-accent">{totalAmount.toFixed(2)} ر.س</div>
              </CardHeader>
            </Card>
            <Card className="border-primary/10">
              <CardHeader className="text-center">
                <CardTitle className="text-primary">عمولة الطبيب (3%)</CardTitle>
                <div className="text-3xl font-bold text-accent">{commission.toFixed(2)} ر.س</div>
              </CardHeader>
            </Card>
            <Card className="border-primary/10">
              <CardHeader className="text-center">
                <CardTitle className="text-primary">عدد العلاجات</CardTitle>
                <div className="text-3xl font-bold text-accent">{payments.length}</div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Treatments List */}
        {payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>قائمة العلاجات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-primary/10">
                      <th className="text-right p-3 font-semibold">اسم المريض</th>
                      <th className="text-right p-3 font-semibold">رقم الهاتف</th>
                      <th className="text-right p-3 font-semibold">المبلغ</th>
                      <th className="text-right p-3 font-semibold">تاريخ الدفع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-primary/5 hover:bg-primary/5">
                        <td className="p-3">{payment.patient_forms?.patient_name}</td>
                        <td className="p-3">{payment.patient_forms?.patient_phone}</td>
                        <td className="p-3 font-semibold">{Number(payment.amount).toFixed(2)} ر.س</td>
                        <td className="p-3">
                          {payment.paid_at ? format(new Date(payment.paid_at), 'dd/MM/yyyy HH:mm') : 'غير محدد'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Data Message */}
        {payments.length === 0 && selectedDoctor && !loading && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">لا توجد علاجات للطبيب المحدد في الفترة المختارة</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ManagementSection;