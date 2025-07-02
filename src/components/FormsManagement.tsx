import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Plus, 
  Eye, 
  Calendar,
  Clock,
  Phone,
  Mail,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PatientFormData {
  id: string;
  form_token: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  date_of_birth: string;
  medical_history: string | null;
  current_medications: string | null;
  allergies: string | null;
  chief_complaint: string;
  preferred_appointment_date: string | null;
  preferred_appointment_time: string | null;
  additional_notes: string | null;
  status: string;
  submitted_at: string;
}

const FormsManagement = () => {
  const [forms, setForms] = useState<PatientFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<PatientFormData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase
        .from("patient_forms")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب النماذج",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateShareableLink = async () => {
    try {
      // Create a new form token
      const { data, error } = await supabase
        .from("patient_forms")
        .insert([{
          patient_name: "temp",
          patient_phone: "temp",
          chief_complaint: "temp",
          status: "draft"
        }])
        .select("form_token")
        .single();

      if (error) throw error;

      // Delete the temporary record but keep the token
      await supabase
        .from("patient_forms")
        .delete()
        .eq("form_token", data.form_token);

      const link = `${window.location.origin}/patient-form/${data.form_token}`;
      
      navigator.clipboard.writeText(link);
      toast({
        title: "تم إنشاء الرابط",
        description: "تم نسخ الرابط إلى الحافظة",
      });
    } catch (error) {
      console.error("Error generating link:", error);
      toast({
        title: "خطأ في إنشاء الرابط",
        description: "حدث خطأ أثناء إنشاء الرابط",
        variant: "destructive",
      });
    }
  };

  const updateFormStatus = async (formId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("patient_forms")
        .update({ status })
        .eq("id", formId);

      if (error) throw error;

      setForms(forms.map(form => 
        form.id === formId ? { ...form, status } : form
      ));

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة النموذج بنجاح",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">في الانتظار</Badge>;
      case "reviewed":
        return <Badge variant="outline">تم المراجعة</Badge>;
      case "scheduled":
        return <Badge variant="default">تم الجدولة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (selectedForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={() => setSelectedForm(null)} variant="outline">
            العودة للقائمة
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={() => updateFormStatus(selectedForm.id, "reviewed")}
              variant="outline"
              disabled={selectedForm.status === "reviewed"}
            >
              تم المراجعة
            </Button>
            <Button 
              onClick={() => updateFormStatus(selectedForm.id, "scheduled")}
              variant="healing"
              disabled={selectedForm.status === "scheduled"}
            >
              جدولة موعد
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              تفاصيل النموذج - {selectedForm.patient_name}
            </CardTitle>
            <CardDescription>
              تم الإرسال في {format(new Date(selectedForm.submitted_at), "dd/MM/yyyy - HH:mm")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">المعلومات الشخصية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <strong>الاسم:</strong> {selectedForm.patient_name}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <strong>الهاتف:</strong> {selectedForm.patient_phone}
                </div>
                {selectedForm.patient_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <strong>البريد:</strong> {selectedForm.patient_email}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <strong>تاريخ الميلاد:</strong> {format(new Date(selectedForm.date_of_birth), "dd/MM/yyyy")}
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">المعلومات الطبية</h3>
              <div className="space-y-3">
                <div>
                  <strong>الحالة الرئيسية:</strong>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedForm.chief_complaint}</p>
                </div>
                {selectedForm.medical_history && (
                  <div>
                    <strong>التاريخ المرضي:</strong>
                    <p className="mt-1 p-3 bg-muted rounded-md">{selectedForm.medical_history}</p>
                  </div>
                )}
                {selectedForm.current_medications && (
                  <div>
                    <strong>الأدوية الحالية:</strong>
                    <p className="mt-1 p-3 bg-muted rounded-md">{selectedForm.current_medications}</p>
                  </div>
                )}
                {selectedForm.allergies && (
                  <div>
                    <strong>الحساسية:</strong>
                    <p className="mt-1 p-3 bg-muted rounded-md">{selectedForm.allergies}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Preferences */}
            {(selectedForm.preferred_appointment_date || selectedForm.preferred_appointment_time) && (
              <div>
                <h3 className="text-lg font-semibold mb-3">تفضيلات الموعد</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedForm.preferred_appointment_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <strong>التاريخ المفضل:</strong> {format(new Date(selectedForm.preferred_appointment_date), "dd/MM/yyyy")}
                    </div>
                  )}
                  {selectedForm.preferred_appointment_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <strong>الوقت المفضل:</strong> {selectedForm.preferred_appointment_time}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Notes */}
            {selectedForm.additional_notes && (
              <div>
                <strong>ملاحظات إضافية:</strong>
                <p className="mt-1 p-3 bg-muted rounded-md">{selectedForm.additional_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">إدارة النماذج</h2>
          <p className="text-muted-foreground">إدارة نماذج المرضى والمواعيد</p>
        </div>
        <Button onClick={generateShareableLink} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إنشاء رابط نموذج جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>النماذج المرسلة</CardTitle>
          <CardDescription>قائمة بجميع النماذج التي تم إرسالها من المرضى</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : forms.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد نماذج مرسلة حتى الآن</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المريض</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>الحالة الرئيسية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإرسال</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.patient_name}</TableCell>
                    <TableCell>{form.patient_phone}</TableCell>
                    <TableCell className="max-w-xs truncate">{form.chief_complaint}</TableCell>
                    <TableCell>{getStatusBadge(form.status)}</TableCell>
                    <TableCell>{format(new Date(form.submitted_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedForm(form)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FormsManagement;
