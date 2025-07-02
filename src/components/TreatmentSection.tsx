import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, 
  User,
  Phone,
  Calendar,
  Clock,
  CheckCircle
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

interface TreatmentSectionProps {
  onBack?: () => void;
}

const TreatmentSection = ({ onBack }: TreatmentSectionProps) => {
  const [patientsInTreatment, setPatientsInTreatment] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatientsInTreatment();
  }, []);

  const fetchPatientsInTreatment = async () => {
    try {
      const { data, error } = await supabase
        .from("patient_forms")
        .select("*")
        .eq("status", "in_treatment")
        .order("preferred_appointment_date", { ascending: true });

      if (error) throw error;
      setPatientsInTreatment(data || []);
    } catch (error) {
      console.error("Error fetching patients in treatment:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات المرضى تحت العلاج",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const completePatientTreatment = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from("patient_forms")
        .update({ status: "completed" })
        .eq("id", patientId);

      if (error) throw error;

      setPatientsInTreatment(patientsInTreatment.filter(patient => 
        patient.id !== patientId
      ));

      toast({
        title: "تم إكمال العلاج",
        description: "تم إكمال جلسة العلاج بنجاح",
      });
    } catch (error) {
      console.error("Error completing treatment:", error);
      toast({
        title: "خطأ في الإكمال",
        description: "حدث خطأ أثناء إكمال العلاج",
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
            <h2 className="text-2xl font-bold text-primary">المرضى تحت العلاج</h2>
            <p className="text-muted-foreground">إدارة المرضى الذين يتلقون العلاج حالياً</p>
          </div>
        </div>
        <Button onClick={fetchPatientsInTreatment} variant="outline">
          تحديث
        </Button>
      </div>

      {/* Current Patients in Treatment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-purple-600" />
            المرضى تحت العلاج ({patientsInTreatment.length})
          </CardTitle>
          <CardDescription>قائمة المرضى الذين تم إرسالهم للعلاج</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : patientsInTreatment.length === 0 ? (
            <div className="text-center py-8">
              <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا يوجد مرضى تحت العلاج حالياً</p>
            </div>
          ) : (
            <>
              {/* Cards View for better display */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {patientsInTreatment.map((patient) => (
                  <Card key={patient.id} className="p-4 border-purple-200 bg-purple-50">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{patient.patient_name}</h4>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          تحت العلاج
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {patient.patient_phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(patient.preferred_appointment_date), "dd/MM/yyyy")}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {patient.preferred_appointment_time}
                        </div>
                      </div>
                      
                      <div className="bg-white p-2 rounded text-sm">
                        <strong>الشكوى:</strong> {patient.chief_complaint}
                      </div>
                      
                      <Button
                        variant="healing"
                        size="sm"
                        onClick={() => completePatientTreatment(patient.id)}
                        className="w-full flex items-center gap-2"
                      >
                        <CheckCircle className="w-3 h-3" />
                        إكمال العلاج
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Table View */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">تفاصيل المرضى</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المريض</TableHead>
                      <TableHead>رقم الهاتف</TableHead>
                      <TableHead>تاريخ الموعد</TableHead>
                      <TableHead>الوقت</TableHead>
                      <TableHead>الشكوى</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientsInTreatment.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.patient_name}</TableCell>
                        <TableCell>{patient.patient_phone}</TableCell>
                        <TableCell>{format(new Date(patient.preferred_appointment_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{patient.preferred_appointment_time}</TableCell>
                        <TableCell className="max-w-xs truncate">{patient.chief_complaint}</TableCell>
                        <TableCell>
                          <Button
                            variant="healing"
                            size="sm"
                            onClick={() => completePatientTreatment(patient.id)}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            إكمال
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TreatmentSection;