import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Link, Copy } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const patientFormSchema = z.object({
  patient_name: z.string().min(2, "الاسم مطلوب"),
  age: z.number().min(1, "العمر مطلوب").max(120, "عمر غير صحيح"),
  patient_phone: z.string().min(8, "رقم الهاتف مطلوب"),
  id_number: z.string().min(10, "رقم الهوية مطلوب"),
  gender: z.string().min(1, "الجنس مطلوب"),
  appointment_date: z.date({ required_error: "تاريخ الموعد مطلوب" }),
  appointment_time: z.string().min(1, "وقت الموعد مطلوب"),
});

type PatientFormData = z.infer<typeof patientFormSchema>;

interface FormsManagementProps {
  onBack?: () => void;
}

const FormsManagement = ({ onBack }: FormsManagementProps) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
  });

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    try {
      const tableName = data.gender === 'male' ? 'male_patients' : 'female_patients';
      
      const formData = {
        patient_name: data.patient_name,
        patient_phone: data.patient_phone,
        patient_email: null,
        date_of_birth: new Date(new Date().getFullYear() - data.age, 0, 1).toISOString().split('T')[0],
        medical_history: null,
        current_medications: null,
        allergies: null,
        chief_complaint: `موعد جديد - العمر: ${data.age}, رقم الهوية: ${data.id_number}`,
        preferred_appointment_date: format(data.appointment_date, 'yyyy-MM-dd'),
        preferred_appointment_time: data.appointment_time,
        additional_notes: null,
        status: 'scheduled'
      };

      const { error } = await supabase
        .from(tableName)
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم إضافة موعد المريض بنجاح",
      });
      
      form.reset();
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPatientLink = async () => {
    try {
      const link = `${window.location.origin}/patient-form`;
      
      navigator.clipboard.writeText(link);
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط النموذج إلى الحافظة. شاركه مع المرضى",
      });
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "خطأ في نسخ الرابط",
        description: "حدث خطأ أثناء نسخ الرابط",
        variant: "destructive",
      });
    }
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={() => setShowForm(false)} variant="outline">
            العودة
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>نموذج موعد مريض جديد</CardTitle>
            <CardDescription>أدخل بيانات المريض وموعده</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patient_name">اسم المريض *</Label>
                <Input
                  id="patient_name"
                  {...form.register("patient_name")}
                  placeholder="أدخل اسم المريض"
                />
                {form.formState.errors.patient_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.patient_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">العمر *</Label>
                <Input
                  id="age"
                  type="number"
                  {...form.register("age", { valueAsNumber: true })}
                  placeholder="أدخل العمر"
                />
                {form.formState.errors.age && (
                  <p className="text-sm text-destructive">{form.formState.errors.age.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient_phone">رقم الهاتف *</Label>
                <Input
                  id="patient_phone"
                  {...form.register("patient_phone")}
                  placeholder="05xxxxxxxx"
                />
                {form.formState.errors.patient_phone && (
                  <p className="text-sm text-destructive">{form.formState.errors.patient_phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_number">رقم الهوية *</Label>
                <Input
                  id="id_number"
                  {...form.register("id_number")}
                  placeholder="أدخل رقم الهوية"
                />
                {form.formState.errors.id_number && (
                  <p className="text-sm text-destructive">{form.formState.errors.id_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">الجنس *</Label>
                <Select onValueChange={(value) => form.setValue("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الجنس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.gender && (
                  <p className="text-sm text-destructive">{form.formState.errors.gender.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>تاريخ الموعد *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("appointment_date") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("appointment_date") ? (
                        format(form.watch("appointment_date"), "dd/MM/yyyy")
                      ) : (
                        <span>اختر تاريخ الموعد</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch("appointment_date")}
                        onSelect={(date) => form.setValue("appointment_date", date as Date)}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const checkDate = new Date(date);
                          checkDate.setHours(0, 0, 0, 0);
                          return checkDate < today;
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.appointment_date && (
                  <p className="text-sm text-destructive">{form.formState.errors.appointment_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment_time">وقت الموعد *</Label>
                <Input
                  id="appointment_time"
                  type="time"
                  {...form.register("appointment_time")}
                />
                {form.formState.errors.appointment_time && (
                  <p className="text-sm text-destructive">{form.formState.errors.appointment_time.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                variant="healing"
                disabled={loading}
              >
                {loading ? "جاري الحفظ..." : "حفظ الموعد"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h2 className="text-2xl font-bold text-primary">النماذج</h2>
            <p className="text-muted-foreground">إضافة مواعيد المرضى وإنشاء روابط للمرضى</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={copyPatientLink} variant="outline" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            نسخ رابط للمرضى
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            إضافة موعد جديد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              إضافة موعد مريض
            </CardTitle>
            <CardDescription>إضافة موعد مباشرة من لوحة التحكم</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowForm(true)} variant="healing" className="w-full">
              إضافة موعد جديد
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              رابط للمرضى
            </CardTitle>
            <CardDescription>رابط ثابت يمكن للمرضى استخدامه لحجز مواعيدهم</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={copyPatientLink} variant="outline" className="w-full">
              نسخ الرابط
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormsManagement;