import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Phone, 
  User,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Appointment {
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

interface AppointmentsSectionProps {
  onBack?: () => void;
}

const AppointmentsSection = ({ onBack }: AppointmentsSectionProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("patient_forms")
        .select("*")
        .not("preferred_appointment_date", "is", null)
        .order("preferred_appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب المواعيد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("patient_forms")
        .update({ status })
        .eq("id", appointmentId);

      if (error) throw error;

      setAppointments(appointments.map(appointment => 
        appointment.id === appointmentId ? { ...appointment, status } : appointment
      ));

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الموعد بنجاح",
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
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">في الانتظار</Badge>;
      case "scheduled":
        return <Badge variant="default" className="bg-green-100 text-green-800">مجدول</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">مكتمل</Badge>;
      case "cancelled":
        return <Badge variant="destructive">ملغي</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAppointmentsByDate = () => {
    const today = new Date();
    const todayAppointments = appointments.filter(apt => 
      apt.preferred_appointment_date === format(today, 'yyyy-MM-dd')
    );
    const upcomingAppointments = appointments.filter(apt => 
      new Date(apt.preferred_appointment_date) > today
    );
    const pastAppointments = appointments.filter(apt => 
      new Date(apt.preferred_appointment_date) < today
    );

    return { todayAppointments, upcomingAppointments, pastAppointments };
  };

  if (selectedAppointment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={() => setSelectedAppointment(null)} variant="outline">
            العودة للمواعيد
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={() => updateAppointmentStatus(selectedAppointment.id, "scheduled")}
              variant="outline"
              disabled={selectedAppointment.status === "scheduled"}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              تأكيد الموعد
            </Button>
            <Button 
              onClick={() => updateAppointmentStatus(selectedAppointment.id, "completed")}
              variant="healing"
              disabled={selectedAppointment.status === "completed"}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              إكمال الموعد
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              تفاصيل الموعد - {selectedAppointment.patient_name}
            </CardTitle>
            <CardDescription>
              تم الطلب في {format(new Date(selectedAppointment.submitted_at), "dd/MM/yyyy - HH:mm")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">معلومات المريض</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <strong>الاسم:</strong> {selectedAppointment.patient_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <strong>الهاتف:</strong> {selectedAppointment.patient_phone}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">تفاصيل الموعد</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <strong>التاريخ:</strong> {format(new Date(selectedAppointment.preferred_appointment_date), "dd/MM/yyyy")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <strong>الوقت:</strong> {selectedAppointment.preferred_appointment_time}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>الحالة:</strong> {getStatusBadge(selectedAppointment.status)}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">تفاصيل الحالة</h3>
              <p className="p-3 bg-muted rounded-md">{selectedAppointment.chief_complaint}</p>
            </div>

            {selectedAppointment.additional_notes && (
              <div>
                <h3 className="text-lg font-semibold mb-3">ملاحظات إضافية</h3>
                <p className="p-3 bg-muted rounded-md">{selectedAppointment.additional_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { todayAppointments, upcomingAppointments, pastAppointments } = getAppointmentsByDate();

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
            <h2 className="text-2xl font-bold text-primary">المواعيد</h2>
            <p className="text-muted-foreground">إدارة مواعيد المرضى</p>
          </div>
        </div>
        <Button onClick={fetchAppointments} variant="outline">
          تحديث
        </Button>
      </div>

      {/* Today's Appointments */}
      {todayAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Calendar className="w-5 h-5" />
              مواعيد اليوم ({todayAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayAppointments.map((appointment) => (
                <Card key={appointment.id} className="p-4 border-green-200">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{appointment.patient_name}</h4>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {appointment.preferred_appointment_time}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {appointment.patient_phone}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setSelectedAppointment(appointment)}
                      className="w-full mt-2"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      عرض التفاصيل
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>جميع المواعيد</CardTitle>
          <CardDescription>قائمة شاملة بجميع المواعيد</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مواعيد محجوزة حتى الآن</p>
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
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.patient_name}</TableCell>
                    <TableCell>{appointment.patient_phone}</TableCell>
                    <TableCell>{format(new Date(appointment.preferred_appointment_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{appointment.preferred_appointment_time}</TableCell>
                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAppointment(appointment)}
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

export default AppointmentsSection;