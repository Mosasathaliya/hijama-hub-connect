import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  UserCog, 
  Phone, 
  Mail,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const doctorSchema = z.object({
  name: z.string().min(2, "اسم الطبيب مطلوب"),
  specialization: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("بريد إلكتروني صحيح").optional().or(z.literal("")),
});

type DoctorFormData = z.infer<typeof doctorSchema>;

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
}

interface AddDoctorSectionProps {
  onBack?: () => void;
}

const AddDoctorSection = ({ onBack }: AddDoctorSectionProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const { toast } = useToast();

  const form = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات الأطباء",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: DoctorFormData) => {
    try {
      const doctorData = {
        name: data.name,
        specialization: data.specialization || null,
        phone: data.phone || null,
        email: data.email || null,
      };

      let error;

      if (editingDoctor) {
        // Update existing doctor
        const { error: updateError } = await supabase
          .from("doctors")
          .update(doctorData)
          .eq("id", editingDoctor.id);
        error = updateError;
      } else {
        // Insert new doctor
        const { error: insertError } = await supabase
          .from("doctors")
          .insert([doctorData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "تم الحفظ بنجاح",
        description: editingDoctor ? "تم تحديث بيانات الطبيب" : "تم إضافة الطبيب الجديد",
      });

      form.reset();
      setShowForm(false);
      setEditingDoctor(null);
      fetchDoctors();
    } catch (error) {
      console.error("Error saving doctor:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ بيانات الطبيب",
        variant: "destructive",
      });
    }
  };

  const toggleDoctorStatus = async (doctorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("doctors")
        .update({ is_active: !currentStatus })
        .eq("id", doctorId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: !currentStatus ? "تم تفعيل الطبيب" : "تم إلغاء تفعيل الطبيب",
      });

      fetchDoctors();
    } catch (error) {
      console.error("Error updating doctor status:", error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث حالة الطبيب",
        variant: "destructive",
      });
    }
  };

  const deleteDoctor = async (doctorId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطبيب؟")) return;

    try {
      const { error } = await supabase
        .from("doctors")
        .delete()
        .eq("id", doctorId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الطبيب بنجاح",
      });

      fetchDoctors();
    } catch (error) {
      console.error("Error deleting doctor:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الطبيب",
        variant: "destructive",
      });
    }
  };

  const startEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    form.setValue("name", doctor.name);
    form.setValue("specialization", doctor.specialization || "");
    form.setValue("phone", doctor.phone || "");
    form.setValue("email", doctor.email || "");
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingDoctor(null);
    form.reset();
    setShowForm(false);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={cancelEdit} variant="outline">
            العودة
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              {editingDoctor ? "تعديل بيانات الطبيب" : "إضافة طبيب جديد"}
            </CardTitle>
            <CardDescription>
              {editingDoctor ? "تحديث معلومات الطبيب" : "أدخل بيانات الطبيب الجديد"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الطبيب *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="أدخل اسم الطبيب"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">التخصص</Label>
                <Input
                  id="specialization"
                  {...form.register("specialization")}
                  placeholder="مثال: طب عام، جراحة، إلخ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="05xxxxxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="doctor@example.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" variant="healing">
                {editingDoctor ? "تحديث البيانات" : "إضافة الطبيب"}
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
            <h2 className="text-2xl font-bold text-primary">إدارة الأطباء</h2>
            <p className="text-muted-foreground">إضافة وإدارة الأطباء في المركز</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إضافة طبيب جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الأطباء ({doctors.length})</CardTitle>
          <CardDescription>جميع الأطباء المسجلين في المركز</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-8">
              <UserCog className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا يوجد أطباء مسجلين حتى الآن</p>
              <Button onClick={() => setShowForm(true)} variant="outline" className="mt-4">
                إضافة أول طبيب
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الطبيب</TableHead>
                  <TableHead>التخصص</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">{doctor.name}</TableCell>
                    <TableCell>{doctor.specialization || "غير محدد"}</TableCell>
                    <TableCell>{doctor.phone || "-"}</TableCell>
                    <TableCell>{doctor.email || "-"}</TableCell>
                    <TableCell>
                      {doctor.is_active ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">نشط</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">غير نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(doctor)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleDoctorStatus(doctor.id, doctor.is_active)}
                        >
                          {doctor.is_active ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDoctor(doctor.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
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

export default AddDoctorSection;