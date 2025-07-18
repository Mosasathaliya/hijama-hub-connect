import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calculator, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReferralCommissionSectionProps {
  onBack: () => void;
}

interface Coupon {
  id: string;
  referrer_name: string;
  discount_type: string;
  discount_value: number;
  referral_percentage: number;
  used_count: number;
  created_at: string;
}

interface PaymentWithCoupon {
  id: string;
  amount: number;
  paid_at: string;
  patient_form: {
    patient_name: string;
  };
}

const ReferralCommissionSection = ({ onBack }: ReferralCommissionSectionProps) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [commissionData, setCommissionData] = useState<any[]>([]);
  const [totalCommission, setTotalCommission] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Real-time subscription for payments
  useEffect(() => {
    const channel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          console.log('Payment changed:', payload);
          // If commission calculation is active, recalculate
          if (selectedCoupon && fromDate && toDate) {
            calculateCommission();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCoupon, fromDate, toDate]);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('حدث خطأ في تحميل الكوبونات');
    }
  };

  const calculateCommission = async () => {
    if (!selectedCoupon || !fromDate || !toDate) {
      toast.error('يرجى تحديد الكوبون وتواريخ البداية والنهاية');
      return;
    }

    setLoading(true);
    try {
      // Get selected coupon details
      const selectedCouponData = coupons.find(c => c.id === selectedCoupon);
      if (!selectedCouponData) {
        toast.error('الكوبون المحدد غير صحيح');
        return;
      }

      // Get only payments that used the selected coupon
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_status', 'completed')
        .eq('coupon_id', selectedCoupon)
        .gte('paid_at', fromDate)
        .lte('paid_at', toDate + 'T23:59:59');

      if (error) throw error;

      // For now, since existing payments don't have coupon_id, 
      // we'll show payments from the date range and calculate commission
      // In future, only payments with actual coupon_id will be shown
      let paymentsToShow = payments || [];
      
      // If no payments found with coupon_id, show a message about tracking limitation
      if (paymentsToShow.length === 0) {
        // Check if there are any payments in the date range at all
        const { data: allPayments } = await supabase
          .from('payments')
          .select('*')
          .eq('payment_status', 'completed')
          .gte('paid_at', fromDate)
          .lte('paid_at', toDate + 'T23:59:59');
          
        if ((allPayments || []).length > 0) {
          toast.error('لم يتم العثور على مدفوعات تم ربطها بهذا الكوبون. سيتم تتبع الكوبونات في المدفوعات الجديدة فقط.');
        }
      }

      // For each payment, fetch patient data from the appropriate table
      const paymentsWithPatients = await Promise.all(
        (payments || []).map(async (payment) => {
          let patientData = null;
          
          if (payment.patient_table === 'male_patients') {
            const { data } = await supabase
              .from('male_patients')
              .select('patient_name')
              .eq('id', payment.patient_id)
              .single();
            patientData = data;
          } else if (payment.patient_table === 'female_patients') {
            const { data } = await supabase
              .from('female_patients')
              .select('patient_name')
              .eq('id', payment.patient_id)
              .single();
            patientData = data;
          } else {
            const { data } = await supabase
              .from('patient_forms')
              .select('patient_name')
              .eq('id', payment.patient_id)
              .single();
            patientData = data;
          }

          return {
            ...payment,
            patient_name: patientData?.patient_name || 'غير محدد'
          };
        })
      );

      // Calculate commission (this is a simplified version)
      const commissionRate = selectedCouponData.referral_percentage / 100;
      const calculatedCommissions = paymentsWithPatients.map(payment => ({
        id: payment.id,
        patient_name: payment.patient_name,
        amount: payment.amount,
        commission_amount: payment.amount * commissionRate,
        date: payment.paid_at,
      }));

      const total = calculatedCommissions.reduce((sum, item) => sum + item.commission_amount, 0);

      setCommissionData(calculatedCommissions);
      setTotalCommission(total);
      
      toast.success('تم حساب العمولة بنجاح');
    } catch (error) {
      console.error('Error calculating commission:', error);
      toast.error('حدث خطأ في حساب العمولة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-healing p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">عمولة الإحالة</h1>
          <p className="text-muted-foreground">حساب عمولات المندوبين والإحالات</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            فلترة وحساب العمولة
          </CardTitle>
          <CardDescription>اختر الكوبون والفترة الزمنية لحساب العمولة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon">اختر الكوبون</Label>
              <Select value={selectedCoupon} onValueChange={setSelectedCoupon}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر كوبون..." />
                </SelectTrigger>
                <SelectContent>
                  {coupons.map((coupon) => (
                    <SelectItem key={coupon.id} value={coupon.id}>
                      {coupon.referrer_name} - {coupon.referral_percentage}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-date">من تاريخ</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-date">إلى تاريخ</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={calculateCommission}
            disabled={loading || !selectedCoupon || !fromDate || !toDate}
            className="w-full md:w-auto"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {loading ? 'جاري الحساب...' : 'حساب العمولة'}
          </Button>
        </CardContent>
      </Card>

      {/* Commission Results */}
      {commissionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>نتائج العمولة</CardTitle>
            <CardDescription>
              إجمالي العمولة: <span className="font-bold text-primary">{totalCommission.toFixed(2)} ريال</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المريض</TableHead>
                  <TableHead>مبلغ الدفع</TableHead>
                  <TableHead>مبلغ العمولة</TableHead>
                  <TableHead>تاريخ الدفع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.patient_name}</TableCell>
                    <TableCell>{item.amount.toFixed(2)} ريال</TableCell>
                    <TableCell className="font-medium text-primary">
                      {item.commission_amount.toFixed(2)} ريال
                    </TableCell>
                    <TableCell>
                      {item.date ? format(new Date(item.date), 'yyyy-MM-dd') : 'غير محدد'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {commissionData.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد مدفوعات</h3>
            <p className="text-muted-foreground">
              لم يتم العثور على مدفوعات تم استخدام هذا الكوبون فيها خلال الفترة المحددة.<br/>
              تأكد من اختيار الكوبون الصحيح والفترة الزمنية المناسبة.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReferralCommissionSection;