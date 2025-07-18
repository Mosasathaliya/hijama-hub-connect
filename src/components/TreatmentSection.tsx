import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Stethoscope, 
  User,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  Save,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import HijamaReadingsDialog from "./HijamaReadingsDialog";

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
  gender?: string;
}

interface TreatmentCondition {
  id: string;
  patient_form_id: string;
  condition_name: string;
  is_checked: boolean;
}

interface TreatmentSectionProps {
  onBack?: () => void;
  onNavigateToPayment?: (paymentData: any) => void;
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

const TreatmentSection = ({ onBack, onNavigateToPayment }: TreatmentSectionProps) => {
  const [patientsInTreatment, setPatientsInTreatment] = useState<Patient[]>([]);
  const [treatmentConditions, setTreatmentConditions] = useState<{[patientId: string]: TreatmentCondition[]}>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { userPermissions } = useAuth();

  useEffect(() => {
    fetchPatientsInTreatment();
  }, [userPermissions]);

  const fetchPatientsInTreatment = async () => {
    try {
      const hasAccessToMales = userPermissions.includes("الوصول للذكور");
      const hasAccessToFemales = userPermissions.includes("الوصول للإناث");

      console.log("Treatment - User permissions:", userPermissions);
      console.log("Treatment - Access to males:", hasAccessToMales);
      console.log("Treatment - Access to females:", hasAccessToFemales);
      
      // If user has no gender permissions, don't show any patients
      if (!hasAccessToMales && !hasAccessToFemales) {
        console.log("Treatment - No gender permissions, showing no patients");
        setPatientsInTreatment([]);
        return;
      }

      let allPatientsInTreatment: Patient[] = [];

      // Fetch male patients in treatment if user has access
      if (hasAccessToMales) {
        const { data: maleData, error: maleError } = await supabase
          .from("male_patients")
          .select("*")
          .eq("status", "in_treatment")
          .order("preferred_appointment_date", { ascending: true });

        if (maleError) throw maleError;
        
        // Add gender field to identify the source
        const malePatientsInTreatment = (maleData || []).map(patient => ({
          ...patient,
          gender: 'male'
        }));
        allPatientsInTreatment = [...allPatientsInTreatment, ...malePatientsInTreatment];
      }

      // Fetch female patients in treatment if user has access
      if (hasAccessToFemales) {
        const { data: femaleData, error: femaleError } = await supabase
          .from("female_patients")
          .select("*")
          .eq("status", "in_treatment")
          .order("preferred_appointment_date", { ascending: true });

        if (femaleError) throw femaleError;
        
        // Add gender field to identify the source
        const femalePatientsInTreatment = (femaleData || []).map(patient => ({
          ...patient,
          gender: 'female'
        }));
        allPatientsInTreatment = [...allPatientsInTreatment, ...femalePatientsInTreatment];
      }

      // Sort all patients by preferred_appointment_date
      allPatientsInTreatment.sort((a, b) => 
        new Date(a.preferred_appointment_date).getTime() - new Date(b.preferred_appointment_date).getTime()
      );

      setPatientsInTreatment(allPatientsInTreatment);
      
      // Fetch treatment conditions for all patients
      if (allPatientsInTreatment.length > 0) {
        await fetchTreatmentConditions(allPatientsInTreatment.map(p => p.id));
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
      const patient = patientsInTreatment.find(p => p.id === patientId);
      if (!patient) return;

      const tableName = patient.gender === 'male' ? 'male_patients' : 'female_patients';
      
      const { error } = await supabase
        .from(tableName)
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
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between bg-white border-gray-300">
                              <span>اختر حالات العلاج المطلوبة</span>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            className="w-full max-w-md bg-white border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto"
                            align="start"
                          >
                            {TREATMENT_CONDITIONS.map((condition, index) => {
                              const isChecked = treatmentConditions[patient.id]?.find(
                                c => c.condition_name === condition
                              )?.is_checked || false;
                              
                              return (
                                <DropdownMenuItem 
                                  key={condition} 
                                  className="flex items-center space-x-2 space-x-reverse p-3 hover:bg-gray-50 cursor-pointer"
                                  onSelect={(e) => e.preventDefault()}
                                  onClick={() => toggleCondition(patient.id, condition)}
                                >
                                  <Checkbox
                                    id={`${patient.id}-${index}`}
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="pointer-events-none"
                                  />
                                  <label
                                    htmlFor={`${patient.id}-${index}`}
                                    className="text-sm font-medium leading-none cursor-pointer flex-1"
                                  >
                                    {index + 1}. {condition}
                                  </label>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {/* Display selected conditions */}
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">الحالات المختارة:</p>
                          <div className="flex flex-wrap gap-2">
                            {treatmentConditions[patient.id]?.filter(c => c.is_checked).map((condition, index) => (
                              <Badge key={condition.condition_name} variant="secondary" className="bg-purple-100 text-purple-800">
                                {condition.condition_name}
                              </Badge>
                            ))}
                            {(!treatmentConditions[patient.id]?.some(c => c.is_checked)) && (
                              <span className="text-sm text-muted-foreground">لم يتم اختيار أي حالات بعد</span>
                            )}
                          </div>
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
                        
                        <HijamaReadingsDialog 
                          patientId={patient.id}
                          patientName={patient.patient_name}
                          patientPhone={patient.patient_phone}
                          appointmentDate={format(new Date(patient.preferred_appointment_date), "dd/MM/yyyy")}
                          appointmentTime={patient.preferred_appointment_time}
                          treatmentConditions={treatmentConditions[patient.id]?.filter(c => c.is_checked).map(c => c.condition_name) || []}
                          patientGender={patient.gender}
                          onNavigateToPayment={onNavigateToPayment}
                        />
                        
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