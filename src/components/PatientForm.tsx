import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const patientFormSchema = z.object({
  patient_name: z.string().min(2, "الاسم مطلوب"),
  patient_phone: z.string().min(8, "رقم الهاتف مطلوب"),
  patient_email: z.string().email("بريد إلكتروني صحيح مطلوب").optional().or(z.literal("")),
  date_of_birth: z.date({ required_error: "تاريخ الميلاد مطلوب" }),
  medical_history: z.string().optional(),
  current_medications: z.string().optional(),
  allergies: z.string().optional(),
  chief_complaint: z.string().min(10, "وصف الحالة مطلوب (10 أحرف على الأقل)"),
  preferred_appointment_date: z.date().optional(),
  preferred_appointment_time: z.string().optional(),
  additional_notes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
  token?: string;
}

const PatientForm = ({ token }: PatientFormProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
  });

  const onSubmit = async (data: PatientFormData) => {
    if (!token) {
      toast({
        title: "خطأ",
        description: "رمز النموذج غير صحيح",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = {
        patient_name: data.patient_name,
        patient_phone: data.patient_phone,
        patient_email: data.patient_email || null,
        date_of_birth: data.date_of_birth.toISOString().split('T')[0],
        medical_history: data.medical_history || null,
        current_medications: data.current_medications || null,
        allergies: data.allergies || null,
        chief_complaint: data.chief_complaint,
        preferred_appointment_date: data.preferred_appointment_date?.toISOString().split('T')[0] || null,
        preferred_appointment_time: data.preferred_appointment_time || null,
        additional_notes: data.additional_notes || null,
        form_token: token,
      };

      const { error } = await supabase
        .from("patient_forms")
        .insert([formData]);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال النموذج بنجاح. سيتم التواصل معك قريباً",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-healing flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">تم الإرسال بنجاح</h2>
            <p className="text-muted-foreground">
              شكراً لك! تم إرسال النموذج بنجاح. سيتم التواصل معك قريباً لتحديد موعد.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-healing py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img 
                src="/lovable-uploads/71e101ef-25e8-4d86-8d58-98dc2069ebba.png"
                alt="شعار مركز الخير تداوي للحجامة"
                className="w-12 h-12 object-contain"
              />
              <div>
                <CardTitle className="text-2xl text-primary">مركز الخير تداوي للحجامة</CardTitle>
                <CardDescription>نموذج معلومات المريض</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">المعلومات الشخصية</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="patient_name">الاسم الكامل *</Label>
                  <Input
                    id="patient_name"
                    {...form.register("patient_name")}
                    placeholder="أدخل اسمك الكامل"
                  />
                  {form.formState.errors.patient_name && (
                    <p className="text-sm text-destructive">{form.formState.errors.patient_name.message}</p>
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
                  <Label htmlFor="patient_email">البريد الإلكتروني</Label>
                  <Input
                    id="patient_email"
                    type="email"
                    {...form.register("patient_email")}
                    placeholder="example@email.com"
                  />
                  {form.formState.errors.patient_email && (
                    <p className="text-sm text-destructive">{form.formState.errors.patient_email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>تاريخ الميلاد *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("date_of_birth") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("date_of_birth") ? (
                          format(form.watch("date_of_birth"), "dd/MM/yyyy")
                        ) : (
                          <span>اختر تاريخ الميلاد</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch("date_of_birth")}
                        onSelect={(date) => form.setValue("date_of_birth", date as Date)}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.date_of_birth && (
                    <p className="text-sm text-destructive">{form.formState.errors.date_of_birth.message}</p>
                  )}
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">المعلومات الطبية</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="chief_complaint">وصف الحالة أو الشكوى الرئيسية *</Label>
                  <Textarea
                    id="chief_complaint"
                    {...form.register("chief_complaint")}
                    placeholder="صف حالتك أو الأعراض التي تعاني منها بالتفصيل"
                    rows={3}
                  />
                  {form.formState.errors.chief_complaint && (
                    <p className="text-sm text-destructive">{form.formState.errors.chief_complaint.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_history">التاريخ المرضي</Label>
                  <Textarea
                    id="medical_history"
                    {...form.register("medical_history")}
                    placeholder="أي أمراض سابقة أو عمليات جراحية"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_medications">الأدوية الحالية</Label>
                  <Textarea
                    id="current_medications"
                    {...form.register("current_medications")}
                    placeholder="اذكر الأدوية التي تتناولها حالياً"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">الحساسية</Label>
                  <Textarea
                    id="allergies"
                    {...form.register("allergies")}
                    placeholder="أي حساسية من أدوية أو مواد معينة"
                    rows={2}
                  />
                </div>
              </div>

              {/* Appointment Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">تفضيلات الموعد</h3>
                
                <div className="space-y-2">
                  <Label>التاريخ المفضل للموعد</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("preferred_appointment_date") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("preferred_appointment_date") ? (
                          format(form.watch("preferred_appointment_date"), "dd/MM/yyyy")
                        ) : (
                          <span>اختر التاريخ المفضل</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch("preferred_appointment_date")}
                        onSelect={(date) => form.setValue("preferred_appointment_date", date as Date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_appointment_time">الوقت المفضل</Label>
                  <Input
                    id="preferred_appointment_time"
                    type="time"
                    {...form.register("preferred_appointment_time")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_notes">ملاحظات إضافية</Label>
                  <Textarea
                    id="additional_notes"
                    {...form.register("additional_notes")}
                    placeholder="أي ملاحظات أو طلبات خاصة"
                    rows={3}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                variant="healing"
                disabled={loading}
              >
                {loading ? "جاري الإرسال..." : "إرسال النموذج"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientForm;