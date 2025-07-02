import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, 
  User,
  Phone,
  Calendar,
  Clock,
  UserCheck,
  DollarSign,
  Stethoscope
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

interface PaymentAndAssignDoctorSectionProps {
  onBack?: () => void;
  paymentData?: PaymentData;
}

const PaymentAndAssignDoctorSection = ({ onBack, paymentData }: PaymentAndAssignDoctorSectionProps) => {
  const [pendingPayments, setPendingPayments] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPayments();
    fetchDoctors();
  }, []);

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
      // Update patient status to paid and assign doctor
      const { error: updateError } = await supabase
        .from("patient_forms")
        .update({ 
          status: "paid_and_assigned",
          // We would need to add a doctor_id field to patient_forms table
          // For now, we'll store it in additional_notes
          additional_notes: `طبيب مخصص: ${doctors.find(d => d.id === selectedDoctor)?.name || 'غير محدد'}`
        })
        .eq("id", selectedPatient.id);

      if (updateError) throw updateError;

      // Here you would integrate with actual payment gateway
      // For now, we'll simulate payment processing
      
      toast({
        title: "تم الدفع وتعيين الطبيب",
        description: `تم الدفع بنجاح وتعيين الطبيب ${doctors.find(d => d.id === selectedDoctor)?.name}`,
      });

      // Refresh the list
      fetchPendingPayments();
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
        <Button onClick={fetchPendingPayments} variant="outline">
          تحديث
        </Button>
      </div>

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
    </div>
  );
};

export default PaymentAndAssignDoctorSection;