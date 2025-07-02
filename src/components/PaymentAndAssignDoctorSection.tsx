import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  CreditCard, 
  User,
  Phone,
  Calendar,
  Clock,
  UserCheck,
  DollarSign,
  Stethoscope,
  CheckCircle2,
  Edit,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Patient {
  id: string;
  patient_name: string;
  patient_phone: string;
  preferred_appointment_date: string;
  preferred_appointment_time: string;
  chief_complaint: string;
  status: string;
  submitted_at: string;
  medical_history?: string;
  additional_notes?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}

interface PaymentData {
  patientId: string;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  treatmentConditions: string[];
  hijamaPointsCount: number;
  calculatedPrice: number;
}

interface TodayPayment {
  id: string;
  patient_name: string;
  patient_phone: string;
  doctor_name: string;
  doctor_id: string;
  amount: number;
  paid_at: string;
  hijama_points_count: number;
  patient_form_id: string;
}

interface PaymentAndAssignDoctorSectionProps {
  onBack?: () => void;
  paymentData?: PaymentData;
}

const PaymentAndAssignDoctorSection = ({ onBack, paymentData }: PaymentAndAssignDoctorSectionProps) => {
  const [pendingPayments, setPendingPayments] = useState<Patient[]>([]);
  const [todayPayments, setTodayPayments] = useState<TodayPayment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<TodayPayment | null>(null);
  const [editCupsCount, setEditCupsCount] = useState("");
  const [editDoctor, setEditDoctor] = useState("");
  const [cupPrices, setCupPrices] = useState<any[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPayments();
    fetchTodayPayments();
    fetchDoctors();
    fetchCupPrices();
  }, []);

  // Calculate price when cups count changes
  useEffect(() => {
    if (editCupsCount && cupPrices.length > 0) {
      calculatePrice();
    }
  }, [editCupsCount, cupPrices]);

  const fetchCupPrices = async () => {
    try {
      const { data, error } = await supabase
        .from("hijama_cup_prices")
        .select("*")
        .eq("is_active", true)
        .order("number_of_cups", { ascending: true });

      if (error) throw error;
      setCupPrices(data || []);
    } catch (error) {
      console.error("Error fetching cup prices:", error);
    }
  };

  const calculatePrice = () => {
    const cupsCount = parseInt(editCupsCount);
    
    if (!cupsCount || cupPrices.length === 0) {
      setCalculatedPrice(0);
      return;
    }

    // Find the appropriate price tier
    let selectedPrice = cupPrices.find(price => price.number_of_cups === cupsCount);
    
    // If exact match not found, find the closest higher tier
    if (!selectedPrice) {
      selectedPrice = cupPrices
        .filter(price => price.number_of_cups >= cupsCount)
        .sort((a, b) => a.number_of_cups - b.number_of_cups)[0];
    }
    
    // If still no match, use the highest tier
    if (!selectedPrice && cupPrices.length > 0) {
      selectedPrice = cupPrices[cupPrices.length - 1];
    }

    setCalculatedPrice(selectedPrice ? Number(selectedPrice.price) : 0);
  };

  // If payment data is passed from treatment section, add it to the list
  useEffect(() => {
    if (paymentData) {
      // Auto-show assign dialog for the new payment
      setSelectedPatient({
        id: paymentData.patientId,
        patient_name: paymentData.patientName,
        patient_phone: paymentData.patientPhone,
        preferred_appointment_date: paymentData.appointmentDate,
        preferred_appointment_time: paymentData.appointmentTime,
        chief_complaint: "",
        status: "payment_pending",
        submitted_at: new Date().toISOString()
      });
      setShowAssignDialog(true);
    }
  }, [paymentData]);

  const fetchTodayPayments = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          hijama_points_count,
          paid_at,
          patient_form_id,
          doctor_id,
          patient_forms!inner(
            patient_name,
            patient_phone
          ),
          doctors!inner(
            name
          )
        `)
        .eq("payment_status", "completed")
        .gte("paid_at", startOfDay.toISOString())
        .lt("paid_at", endOfDay.toISOString())
        .order("paid_at", { ascending: false });

      if (error) throw error;

      const formattedPayments = data?.map(payment => ({
        id: payment.id,
        patient_name: payment.patient_forms.patient_name,
        patient_phone: payment.patient_forms.patient_phone,
        doctor_name: payment.doctors.name,
        doctor_id: payment.doctor_id,
        amount: payment.amount,
        paid_at: payment.paid_at,
        hijama_points_count: payment.hijama_points_count,
        patient_form_id: payment.patient_form_id
      })) || [];

      setTodayPayments(formattedPayments);
    } catch (error) {
      console.error("Error fetching today's payments:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات المدفوعات اليوم",
        variant: "destructive",
      });
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("patient_forms")
        .select("*")
        .eq("status", "payment_pending")
        .order("preferred_appointment_date", { ascending: true });

      if (error) throw error;
      setPendingPayments(data || []);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات المدفوعات المعلقة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast({
        title: "خطأ في جلب الأطباء",
        description: "حدث خطأ أثناء جلب قائمة الأطباء",
        variant: "destructive",
      });
    }
  };

  const handleEditPayment = (payment: TodayPayment) => {
    setEditingPayment(payment);
    setEditCupsCount(payment.hijama_points_count.toString());
    setEditDoctor(payment.doctor_id);
    setCalculatedPrice(payment.amount);
    setShowEditDialog(true);
  };

  const saveEditedPayment = async () => {
    if (!editingPayment) return;

    try {
      // Update payment amount and hijama points count
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          amount: calculatedPrice,
          hijama_points_count: parseInt(editCupsCount),
          doctor_id: editDoctor
        })
        .eq("id", editingPayment.id);

      if (paymentError) throw paymentError;

      // Update patient form doctor assignment
      const { error: patientError } = await supabase
        .from("patient_forms")
        .update({
          doctor_id: editDoctor
        })
        .eq("id", editingPayment.patient_form_id);

      if (patientError) throw patientError;

      toast({
        title: "تم تحديث البيانات",
        description: `تم تحديث عدد الكؤوس إلى ${editCupsCount} والمبلغ إلى ${calculatedPrice} ريال`,
      });

      fetchTodayPayments();
      setShowEditDialog(false);
      setEditingPayment(null);
    } catch (error) {
      console.error("Error updating payment:", error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive",
      });
    }
  };

  const handlePayment = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowAssignDialog(true);
  };

  const processPaymentAndAssignDoctor = async () => {
    if (!selectedPatient || !selectedDoctor) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى اختيار طبيب قبل المتابعة",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update patient status and assign doctor
      const { error: updateError } = await supabase
        .from("patient_forms")
        .update({ 
          status: "paid_and_assigned",
          doctor_id: selectedDoctor
        })
        .eq("id", selectedPatient.id);

      if (updateError) throw updateError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          patient_form_id: selectedPatient.id,
          doctor_id: selectedDoctor,
          amount: paymentData?.calculatedPrice || 0,
          hijama_points_count: paymentData?.hijamaPointsCount || 0,
          payment_status: "completed",
          payment_method: "cash", // Default to cash, could be made selectable
          paid_at: new Date().toISOString()
        });

      if (paymentError) throw paymentError;

      toast({
        title: "تم الدفع وتعيين الطبيب",
        description: `تم الدفع بنجاح وتعيين الطبيب ${doctors.find(d => d.id === selectedDoctor)?.name}`,
      });

      // Refresh the lists
      fetchPendingPayments();
      fetchTodayPayments();
      setShowAssignDialog(false);
      setSelectedPatient(null);
      setSelectedDoctor("");

    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "خطأ في المعالجة",
        description: "حدث خطأ أثناء معالجة الدفع وتعيين الطبيب",
        variant: "destructive",
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
            <h2 className="text-2xl font-bold text-primary">الدفع وتعيين الأطباء</h2>
            <p className="text-muted-foreground">إدارة المدفوعات وتعيين الأطباء للمرضى</p>
          </div>
        </div>
        <Button onClick={() => { fetchPendingPayments(); fetchTodayPayments(); }} variant="outline">
          تحديث
        </Button>
      </div>

      {/* Today's Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            المدفوعات اليوم ({todayPayments.length})
          </CardTitle>
          <CardDescription>المرضى الذين تم دفعهم وتعيين طبيب لهم اليوم</CardDescription>
        </CardHeader>
        <CardContent>
          {todayPayments.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا يوجد مدفوعات اليوم</p>
            </div>
          ) : (
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
                {todayPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.patient_name}</TableCell>
                    <TableCell>{payment.patient_phone}</TableCell>
                    <TableCell>{payment.doctor_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {payment.amount} ريال
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.hijama_points_count} نقطة
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(payment.paid_at), "HH:mm")}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPayment(payment)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        تعديل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-600" />
            المدفوعات المعلقة ({pendingPayments.length})
          </CardTitle>
          <CardDescription>المرضى الذين ينتظرون الدفع وتعيين طبيب</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : pendingPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا يوجد مدفوعات معلقة حالياً</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المريض</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>تاريخ الموعد</TableHead>
                  <TableHead>الوقت</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.patient_name}</TableCell>
                    <TableCell>{patient.patient_phone}</TableCell>
                    <TableCell>{format(new Date(patient.preferred_appointment_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{patient.preferred_appointment_time}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        في انتظار الدفع
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="healing"
                        size="sm"
                        onClick={() => handlePayment(patient)}
                        className="flex items-center gap-1"
                      >
                        <DollarSign className="w-3 h-3" />
                        دفع وتعيين طبيب
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment and Doctor Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              الدفع وتعيين طبيب
            </DialogTitle>
            <DialogDescription className="text-right">
              قم بالدفع وتعيين طبيب للمريض
            </DialogDescription>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-6">
              {/* Patient Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    معلومات المريض
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">اسم المريض:</span>
                    <span className="font-medium">{selectedPatient.patient_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">رقم الهاتف:</span>
                    <span className="font-medium">{selectedPatient.patient_phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">تاريخ الموعد:</span>
                    <span className="font-medium">{format(new Date(selectedPatient.preferred_appointment_date), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">وقت الموعد:</span>
                    <span className="font-medium">{selectedPatient.preferred_appointment_time}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Doctor Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    اختيار الطبيب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر الطبيب المناسب" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{doctor.name}</span>
                            {doctor.specialization && (
                              <span className="text-sm text-muted-foreground">{doctor.specialization}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    معلومات الدفع
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>المبلغ المطلوب:</span>
                    <span className="text-primary">
                      {paymentData ? `${paymentData.calculatedPrice} ريال` : "يتم تحديد المبلغ من العلاج"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAssignDialog(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button 
                  variant="healing" 
                  onClick={processPaymentAndAssignDoctor}
                  className="flex-1 flex items-center gap-2"
                  disabled={!selectedDoctor}
                >
                  <CreditCard className="w-4 h-4" />
                  تأكيد الدفع وتعيين الطبيب
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Edit className="w-5 h-5" />
              تعديل بيانات الدفع
            </DialogTitle>
            <DialogDescription className="text-right">
              تعديل مبلغ الدفع والطبيب المخصص
            </DialogDescription>
          </DialogHeader>
          
          {editingPayment && (
            <div className="space-y-6">
              {/* Patient Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{editingPayment.patient_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">عدد كؤوس الحجامة</label>
                    <Input
                      type="number"
                      value={editCupsCount}
                      onChange={(e) => setEditCupsCount(e.target.value)}
                      placeholder="عدد الكؤوس"
                      min="1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">المبلغ المحسوب</label>
                    <div className="p-2 bg-muted rounded-md">
                      <span className="text-lg font-bold text-primary">
                        {calculatedPrice} ريال
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الطبيب المخصص</label>
                    <Select value={editDoctor} onValueChange={setEditDoctor}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الطبيب" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{doctor.name}</span>
                              {doctor.specialization && (
                                <span className="text-sm text-muted-foreground">{doctor.specialization}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button 
                  variant="healing" 
                  onClick={saveEditedPayment}
                  className="flex-1 flex items-center gap-2"
                  disabled={!editCupsCount || !editDoctor || calculatedPrice === 0}
                >
                  <Save className="w-4 h-4" />
                  حفظ التعديلات
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentAndAssignDoctorSection;