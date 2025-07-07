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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const patientFormSchema = z.object({
  patient_name: z.string().min(2, "الاسم مطلوب"),
  patient_phone: z.string().min(8, "رقم الهاتف مطلوب"),
  id_number: z.string().min(10, "رقم الهوية مطلوب"),
  age: z.number().min(1, "العمر مطلوب").max(120, "عمر غير صحيح"),
  gender: z.string().min(1, "الجنس مطلوب"),
  appointment_date: z.date({ required_error: "تاريخ الموعد المطلوب" }),
  appointment_time: z.string().min(1, "وقت الموعد مطلوب"),
  medical_notes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientFormSchema>;

const PatientForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
  });

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    try {
      const formData = {
        patient_name: data.patient_name,
        patient_phone: data.patient_phone,
        patient_email: null,
        date_of_birth: new Date(new Date().getFullYear() - data.age, 0, 1).toISOString().split('T')[0],
        medical_history: data.medical_notes || null,
        current_medications: null,
        allergies: null,
        chief_complaint: `طلب موعد - العمر: ${data.age} سنة، رقم الهوية: ${data.id_number}`,
        preferred_appointment_date: format(data.appointment_date, 'yyyy-MM-dd'),
        preferred_appointment_time: data.appointment_time,
        additional_notes: data.medical_notes || null,
        gender: data.gender,
        form_token: crypto.randomUUID(),
      };

      const { error } = await supabase
        .from("patient_forms")
        .insert([formData]);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال طلب الموعد بنجاح. سيتم التواصل معك قريباً",
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
              شكراً لك! تم إرسال طلب الموعد بنجاح. سيتم التواصل معك قريباً لتأكيد الموعد.
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
                <CardDescription>طلب موعد جديد</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">معلومات المريض</h3>
                
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
                  <Label htmlFor="age">العمر *</Label>
                  <Input
                    id="age"
                    type="number"
                    {...form.register("age", { valueAsNumber: true })}
                    placeholder="أدخل عمرك"
                  />
                  {form.formState.errors.age && (
                    <p className="text-sm text-destructive">{form.formState.errors.age.message}</p>
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
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">تفاصيل الموعد</h3>
                
                <div className="space-y-2">
                  <Label>تاريخ الموعد المطلوب *</Label>
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
                  <Label htmlFor="appointment_time">وقت الموعد المطلوب *</Label>
                  <Input
                    id="appointment_time"
                    type="time"
                    {...form.register("appointment_time")}
                  />
                  {form.formState.errors.appointment_time && (
                    <p className="text-sm text-destructive">{form.formState.errors.appointment_time.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_notes">ملاحظات طبية (اختياري)</Label>
                  <Textarea
                    id="medical_notes"
                    {...form.register("medical_notes")}
                    placeholder="اذكر أي معلومات طبية مهمة أو ملاحظات خاصة"
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
                {loading ? "جاري الإرسال..." : "إرسال طلب الموعد"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientForm;