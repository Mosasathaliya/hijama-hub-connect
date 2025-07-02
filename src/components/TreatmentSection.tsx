import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Stethoscope, 
  User,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
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

interface TreatmentCondition {
  id: string;
  patient_form_id: string;
  condition_name: string;
  is_checked: boolean;
}

interface TreatmentSectionProps {
  onBack?: () => void;
}

const TREATMENT_CONDITIONS = [
  "العصب السابع",
  "ضعف المناعة",
  "الروماتويد",
  "حساسية الدم",
  "الكوليسترول والدهون العالية",
  "أملاح القدم",
  "تنميل الأطراف",
  "عرق النساء",
  "الضعف الجنسي",
  "مشاكل الإنجاب",
  "البروستاتا / البواسير / الناسور",
  "آلام أسفل الظهر",
  "الكلى",
  "القولون",
  "المعدة",
  "الأبهر",
  "طنين الأذن",
  "الصداع",
  "فقر الدم",
  "سيولة الدم",
  "الضغط",
  "القلب",
  "التهاب الكبد",
  "السكري"
];

const TreatmentSection = ({ onBack }: TreatmentSectionProps) => {
  const [patientsInTreatment, setPatientsInTreatment] = useState<Patient[]>([]);
  const [treatmentConditions, setTreatmentConditions] = useState<{[patientId: string]: TreatmentCondition[]}>({});
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
      
      // Fetch treatment conditions for all patients
      if (data && data.length > 0) {
        await fetchTreatmentConditions(data.map(p => p.id));
      }
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

  const fetchTreatmentConditions = async (patientIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from("treatment_conditions")
        .select("*")
        .in("patient_form_id", patientIds);

      if (error) throw error;

      const conditionsByPatient: {[patientId: string]: TreatmentCondition[]} = {};
      
      // Group conditions by patient
      patientIds.forEach(patientId => {
        conditionsByPatient[patientId] = TREATMENT_CONDITIONS.map(conditionName => {
          const existing = data?.find(c => 
            c.patient_form_id === patientId && c.condition_name === conditionName
          );
          return existing || {
            id: "",
            patient_form_id: patientId,
            condition_name: conditionName,
            is_checked: false
          };
        });
      });

      setTreatmentConditions(conditionsByPatient);
    } catch (error) {
      console.error("Error fetching treatment conditions:", error);
    }
  };

  const saveTreatmentConditions = async (patientId: string) => {
    try {
      const conditions = treatmentConditions[patientId] || [];
      const checkedConditions = conditions.filter(c => c.is_checked);
      
      // Delete existing conditions for this patient
      await supabase
        .from("treatment_conditions")
        .delete()
        .eq("patient_form_id", patientId);

      // Insert checked conditions
      if (checkedConditions.length > 0) {
        const { error } = await supabase
          .from("treatment_conditions")
          .insert(
            checkedConditions.map(c => ({
              patient_form_id: patientId,
              condition_name: c.condition_name,
              is_checked: true
            }))
          );

        if (error) throw error;
      }

      toast({
        title: "تم حفظ حالات العلاج",
        description: "تم حفظ حالات العلاج بنجاح",
      });
    } catch (error) {
      console.error("Error saving treatment conditions:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ حالات العلاج",
        variant: "destructive",
      });
    }
  };

  const toggleCondition = (patientId: string, conditionName: string) => {
    setTreatmentConditions(prev => ({
      ...prev,
      [patientId]: prev[patientId]?.map(condition =>
        condition.condition_name === conditionName
          ? { ...condition, is_checked: !condition.is_checked }
          : condition
      ) || []
    }));
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
              {/* Treatment Forms with Conditions */}
              <div className="space-y-6">
                {patientsInTreatment.map((patient) => (
                  <Card key={patient.id} className="border-purple-200">
                    <CardHeader className="bg-purple-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{patient.patient_name}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {patient.patient_phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(patient.preferred_appointment_date), "dd/MM/yyyy")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {patient.preferred_appointment_time}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          تحت العلاج
                        </Badge>
                      </div>
                      <div className="bg-white p-3 rounded-md mt-3">
                        <strong>الشكوى الرئيسية:</strong> {patient.chief_complaint}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          حالات العلاج المطلوبة
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {TREATMENT_CONDITIONS.map((condition, index) => {
                            const isChecked = treatmentConditions[patient.id]?.find(
                              c => c.condition_name === condition
                            )?.is_checked || false;
                            
                            return (
                              <div key={condition} className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                  id={`${patient.id}-${index}`}
                                  checked={isChecked}
                                  onCheckedChange={() => toggleCondition(patient.id, condition)}
                                />
                                <label
                                  htmlFor={`${patient.id}-${index}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {index + 1}. {condition}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          variant="healing"
                          size="sm"
                          onClick={() => saveTreatmentConditions(patient.id)}
                          className="flex items-center gap-2"
                        >
                          <Save className="w-3 h-3" />
                          حفظ حالات العلاج
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => completePatientTreatment(patient.id)}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="w-3 h-3" />
                          إكمال العلاج
                        </Button>
                      </div>
                    </CardContent>
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