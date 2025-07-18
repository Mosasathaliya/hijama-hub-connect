import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  Phone, 
  User,
  CheckCircle,
  XCircle,
  Eye,
  Stethoscope,
  Filter,
  CalendarIcon,
  UserPlus,
  ExternalLink,
  Search,
  UserCheck,
  Activity,
  CheckSquare,
  Hourglass,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  patient_email?: string;
  allergies?: string;
  current_medications?: string;
  gender?: string;
}

interface AppointmentsSectionProps {
  onBack?: () => void;
}

const AppointmentsSection = ({ onBack }: AppointmentsSectionProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [showTodayOnly, setShowTodayOnly] = useState(false); // Changed to false to show all appointments by default
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Appointment[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Appointment | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined);
  const [appointmentTime, setAppointmentTime] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  
  // New appointment form state
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    patient_name: "",
    patient_phone: "",
    patient_id: "",
    age: "",
    gender: "",
    preferred_appointment_date: undefined as Date | undefined,
    preferred_appointment_time: "",
    chief_complaint: ""
  });
  
  const { toast } = useToast();
  const { userPermissions } = useAuth();

  useEffect(() => {
    fetchAppointments();
    
    // Set up real-time subscription for both male and female tables
    const maleChannel = supabase
      .channel('male-patients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'male_patients'
        },
        (payload) => {
          console.log('Male patient data changed:', payload);
          fetchAppointments();
        }
      )
      .subscribe();

    const femaleChannel = supabase
      .channel('female-patients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'female_patients'
        },
        (payload) => {
          console.log('Female patient data changed:', payload);
          fetchAppointments();
        }
      )
      .subscribe();

    // Also set up real-time subscription for patient_forms table
    const patientFormsChannel = supabase
      .channel('patient-forms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_forms'
        },
        (payload) => {
          console.log('Patient forms data changed:', payload);
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(maleChannel);
      supabase.removeChannel(femaleChannel);
      supabase.removeChannel(patientFormsChannel);
    };
  }, [userPermissions]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filterDate, showTodayOnly, statusFilter]);

  const filterAppointments = () => {
    let filtered = [...appointments];
    
    // Filter out payment_pending status
    filtered = filtered.filter(apt => apt.status !== 'payment_pending');
    
    // Filter by status if selected
    if (statusFilter) {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    const today = format(new Date(), 'yyyy-MM-dd');
    console.log('Today\'s date:', today);
    console.log('All appointments:', appointments.map(apt => ({ name: apt.patient_name, date: apt.preferred_appointment_date })));
    
    if (showTodayOnly && !filterDate) {
      // Show only today's appointments
      filtered = filtered.filter(apt => apt.preferred_appointment_date === today);
      console.log('Today\'s appointments after filter:', filtered.map(apt => ({ name: apt.patient_name, date: apt.preferred_appointment_date })));
    } else if (filterDate) {
      // Show appointments for the selected date
      const selectedDate = format(filterDate, 'yyyy-MM-dd');
      filtered = filtered.filter(apt => apt.preferred_appointment_date === selectedDate);
    }
    
    // Sort by latest first (newest at top)
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.preferred_appointment_date} ${a.preferred_appointment_time}`);
      const dateB = new Date(`${b.preferred_appointment_date} ${b.preferred_appointment_time}`);
      return dateB.getTime() - dateA.getTime();
    });
    
    setFilteredAppointments(filtered);
  };

  const fetchAppointments = async () => {
    try {
      const hasAccessToMales = userPermissions.includes("الوصول للذكور");
      const hasAccessToFemales = userPermissions.includes("الوصول للإناث");

      console.log("Appointments - User permissions:", userPermissions);
      console.log("Appointments - Access to males:", hasAccessToMales);
      console.log("Appointments - Access to females:", hasAccessToFemales);
      
      // If user has no gender permissions, don't show any patients
      if (!hasAccessToMales && !hasAccessToFemales) {
        console.log("Appointments - No gender permissions, showing no patients");
        setAppointments([]);
        return;
      }

      let allAppointments: Appointment[] = [];

      // Fetch male patients if user has access
      if (hasAccessToMales) {
        const { data: maleData, error: maleError } = await supabase
          .from("male_patients")
          .select("*")
          .not("preferred_appointment_date", "is", null)
          .order("submitted_at", { ascending: false });

        if (maleError) throw maleError;
        
        // Add gender field to identify the source
        const maleAppointments = (maleData || []).map(apt => ({
          ...apt,
          gender: 'male'
        }));
        allAppointments = [...allAppointments, ...maleAppointments];
      }

      // Fetch female patients if user has access
      if (hasAccessToFemales) {
        const { data: femaleData, error: femaleError } = await supabase
          .from("female_patients")
          .select("*")
          .not("preferred_appointment_date", "is", null)
          .order("submitted_at", { ascending: false });

        if (femaleError) throw femaleError;
        
        // Add gender field to identify the source
        const femaleAppointments = (femaleData || []).map(apt => ({
          ...apt,
          gender: 'female'
        }));
        allAppointments = [...allAppointments, ...femaleAppointments];
      }

      // Sort all appointments by submitted_at
      allAppointments.sort((a, b) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );

      setAppointments(allAppointments);
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
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (!appointment) return;

      const tableName = appointment.gender === 'male' ? 'male_patients' : 'female_patients';
      
      const { error } = await supabase
        .from(tableName)
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

  const sendToTreatment = async (appointmentId: string) => {
    try {
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (!appointment) return;

      const tableName = appointment.gender === 'male' ? 'male_patients' : 'female_patients';
      
      const { error } = await supabase
        .from(tableName)
        .update({ status: "in_treatment" })
        .eq("id", appointmentId);

      if (error) throw error;

      setAppointments(appointments.map(appointment => 
        appointment.id === appointmentId ? { ...appointment, status: "in_treatment" } : appointment
      ));

      toast({
        title: "تم إرسال المريض للعلاج",
        description: "تم بدء جلسة العلاج بنجاح",
      });
    } catch (error) {
      console.error("Error sending to treatment:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال المريض للعلاج",
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
      case "in_treatment":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">تحت العلاج</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAppointmentsByDate = () => {
    const today = new Date();
    const todayAppointments = appointments.filter(apt => 
      apt.preferred_appointment_date === format(today, 'yyyy-MM-dd') && apt.status !== 'payment_pending'
    );
    const upcomingAppointments = appointments.filter(apt => 
      new Date(apt.preferred_appointment_date) > today && apt.status !== 'payment_pending'
    );
    const pastAppointments = appointments.filter(apt => 
      new Date(apt.preferred_appointment_date) < today && apt.status !== 'payment_pending'
    );

    return { todayAppointments, upcomingAppointments, pastAppointments };
  };

  const searchExistingCustomers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const hasAccessToMales = userPermissions.includes("الوصول للذكور");
      const hasAccessToFemales = userPermissions.includes("الوصول للإناث");

      let allSearchResults: Appointment[] = [];

      // Search male patients if user has access
      if (hasAccessToMales) {
        const { data: maleResults, error: maleError } = await supabase
          .from("male_patients")
          .select("*")
          .or(`patient_name.ilike.%${query}%,patient_phone.ilike.%${query}%,chief_complaint.ilike.%${query}%`)
          .order("submitted_at", { ascending: false })
          .limit(5);

        if (maleError) throw maleError;
        
        const maleSearchResults = (maleResults || []).map(result => ({
          ...result,
          gender: 'male'
        }));
        allSearchResults = [...allSearchResults, ...maleSearchResults];
      }

      // Search female patients if user has access  
      if (hasAccessToFemales) {
        const { data: femaleResults, error: femaleError } = await supabase
          .from("female_patients")
          .select("*")
          .or(`patient_name.ilike.%${query}%,patient_phone.ilike.%${query}%,chief_complaint.ilike.%${query}%`)
          .order("submitted_at", { ascending: false })
          .limit(5);

        if (femaleError) throw femaleError;
        
        const femaleSearchResults = (femaleResults || []).map(result => ({
          ...result,
          gender: 'female'
        }));
        allSearchResults = [...allSearchResults, ...femaleSearchResults];
      }

      // Sort all results by submitted_at
      allSearchResults.sort((a, b) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );

      // Limit to 10 total results
      setSearchResults(allSearchResults.slice(0, 10));
    } catch (error) {
      console.error("Error searching customers:", error);
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث عن العملاء",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const openAppointmentDialog = (customer: Appointment) => {
    setSelectedCustomer(customer);
    setChiefComplaint(customer.chief_complaint);
    setAppointmentDate(undefined);
    setAppointmentTime("");
    setShowAppointmentDialog(true);
  };

  const createScheduledAppointment = async () => {
    if (!selectedCustomer || !appointmentDate || !appointmentTime || !chiefComplaint.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى تعبئة جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const tableName = selectedCustomer.gender === 'male' ? 'male_patients' : 'female_patients';
      
      const { error } = await supabase
        .from(tableName)
        .insert({
          patient_name: selectedCustomer.patient_name,
          patient_phone: selectedCustomer.patient_phone,
          patient_email: selectedCustomer.patient_email,
          chief_complaint: chiefComplaint,
          medical_history: selectedCustomer.medical_history,
          allergies: selectedCustomer.allergies,
          current_medications: selectedCustomer.current_medications,
          additional_notes: selectedCustomer.additional_notes,
          preferred_appointment_date: format(appointmentDate, 'yyyy-MM-dd'),
          preferred_appointment_time: appointmentTime,
          status: "scheduled"
        });

      if (error) throw error;

      toast({
        title: "تم إنشاء الموعد",
        description: `تم إنشاء موعد جديد للمريض ${selectedCustomer.patient_name} في ${format(appointmentDate, 'dd/MM/yyyy')} الساعة ${appointmentTime}`,
      });

      fetchAppointments();
      setShowAppointmentDialog(false);
      setSelectedCustomer(null);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        title: "خطأ في إنشاء الموعد",
        description: "حدث خطأ أثناء إنشاء الموعد",
        variant: "destructive",
      });
    }
  };

  const createNewAppointment = async () => {
    if (!newPatient.patient_name || !newPatient.patient_phone || !newPatient.patient_id || 
        !newPatient.age || !newPatient.gender || !newPatient.preferred_appointment_date || 
        !newPatient.preferred_appointment_time || !newPatient.chief_complaint.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى تعبئة جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const tableName = newPatient.gender === 'male' ? 'male_patients' : 'female_patients';
      
      const { error } = await supabase
        .from(tableName)
        .insert({
          patient_name: newPatient.patient_name,
          patient_phone: newPatient.patient_phone,
          chief_complaint: newPatient.chief_complaint,
          preferred_appointment_date: format(newPatient.preferred_appointment_date, 'yyyy-MM-dd'),
          preferred_appointment_time: newPatient.preferred_appointment_time,
          status: "pending",
          date_of_birth: newPatient.age ? `${new Date().getFullYear() - parseInt(newPatient.age)}-01-01` : null
        });

      if (error) throw error;

      toast({
        title: "تم إنشاء الموعد",
        description: `تم إنشاء موعد جديد للمريض ${newPatient.patient_name}`,
      });

      // Reset form
      setNewPatient({
        patient_name: "",
        patient_phone: "",
        patient_id: "",
        age: "",
        gender: "",
        preferred_appointment_date: undefined,
        preferred_appointment_time: "",
        chief_complaint: ""
      });

      fetchAppointments();
      setShowNewAppointmentForm(false);
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        title: "خطأ في إنشاء الموعد",
        description: "حدث خطأ أثناء إنشاء الموعد",
        variant: "destructive",
      });
    }
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
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="healing" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                عميل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">عميل جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-center text-muted-foreground">
                  انقر على الرابط أدناه لفتح نموذج المريض الجديد
                </p>
                <div className="flex justify-center">
                  <Button
                    onClick={() => window.open('https://id-preview--39c13c12-3933-4066-a696-5ece93ec3a36.lovable.app/patient-form', '_blank')}
                    className="flex items-center gap-2"
                    variant="healing"
                  >
                    <ExternalLink className="w-4 h-4" />
                    فتح نموذج المريض
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => setShowNewAppointmentForm(true)}
            variant="default"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            طلب موعد جديد
          </Button>
          <Button onClick={fetchAppointments} variant="outline">
            تحديث
          </Button>
        </div>
      </div>

      {/* Date Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            تصفية المواعيد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant={showTodayOnly && !filterDate ? "default" : "outline"}
              onClick={() => {
                setShowTodayOnly(true);
                setFilterDate(undefined);
              }}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              مواعيد اليوم فقط
            </Button>
            
            <Button
              variant={!showTodayOnly && !filterDate ? "default" : "outline"}
              onClick={() => {
                setShowTodayOnly(false);
                setFilterDate(undefined);
              }}
              className="flex items-center gap-2"
            >
              جميع المواعيد
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={filterDate ? "default" : "outline"}
                  className={cn(
                    "justify-start text-left font-normal",
                    !filterDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDate ? format(filterDate, "dd/MM/yyyy") : "اختر تاريخ محدد"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filterDate}
                  onSelect={(date) => {
                    setFilterDate(date);
                    setShowTodayOnly(false);
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {filterDate && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFilterDate(undefined);
                  setShowTodayOnly(true);
                }}
                className="text-muted-foreground"
              >
                إزالة التصفية
              </Button>
            )}
          </div>
          
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
            <p className="text-sm text-muted-foreground">حالة الموعد:</p>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter(statusFilter === "pending" ? "" : "pending")}
              className="flex items-center gap-2"
            >
              <Hourglass className="w-4 h-4" />
              في الانتظار
            </Button>
            
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              onClick={() => setStatusFilter(statusFilter === "completed" ? "" : "completed")}
              className="flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              مكتمل
            </Button>
            
            <Button
              variant={statusFilter === "in_treatment" ? "default" : "outline"}
              onClick={() => setStatusFilter(statusFilter === "in_treatment" ? "" : "in_treatment")}
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              تحت العلاج
            </Button>
            
            {statusFilter && (
              <Button
                variant="ghost"
                onClick={() => setStatusFilter("")}
                className="text-muted-foreground"
              >
                إزالة تصفية الحالة
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Existing Customer Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            إنشاء موعد للعملاء الحاليين
          </CardTitle>
          <CardDescription>
            ابحث عن العميل باستخدام الاسم أو رقم الهاتف أو المعرف وأنشئ موعداً جديداً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو رقم الهاتف أو المعرف..."
                value={searchQuery}
                onChange={(e) => {
                  const query = e.target.value;
                  setSearchQuery(query);
                  searchExistingCustomers(query);
                }}
                className="pl-10"
              />
            </div>
            
            {isSearching && (
              <div className="text-center py-2 text-muted-foreground">
                جاري البحث...
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  العملاء الموجودون ({searchResults.length})
                </p>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {searchResults.map((customer) => (
                    <Card key={customer.id} className="p-3 border">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{customer.patient_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {customer.patient_phone}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            آخر زيارة: {format(new Date(customer.submitted_at), "dd/MM/yyyy")}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="healing"
                          onClick={() => openAppointmentDialog(customer)}
                          className="flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3" />
                          إنشاء موعد
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {searchQuery && !isSearching && searchResults.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                لا توجد نتائج للبحث "{searchQuery}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filtered Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {showTodayOnly && !filterDate 
                ? `مواعيد اليوم (${filteredAppointments.length})`
                : filterDate 
                  ? `مواعيد ${format(filterDate, "dd/MM/yyyy")} (${filteredAppointments.length})`
                  : `جميع المواعيد (${filteredAppointments.length})`
              }
            </span>
          </CardTitle>
          <CardDescription>
            {showTodayOnly && !filterDate 
              ? "المواعيد المحددة لليوم الحالي مرتبة من الأحدث للأقدم"
              : "المواعيد مرتبة من الأحدث للأقدم"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {showTodayOnly && !filterDate 
                  ? "لا توجد مواعيد لليوم" 
                  : filterDate 
                    ? "لا توجد مواعيد في التاريخ المحدد"
                    : "لا توجد مواعيد محجوزة حتى الآن"
                }
              </p>
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
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.patient_name}</TableCell>
                    <TableCell>{appointment.patient_phone}</TableCell>
                    <TableCell>{format(new Date(appointment.preferred_appointment_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{appointment.preferred_appointment_time}</TableCell>
                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                     <TableCell>
                       <div className="flex gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setSelectedAppointment(appointment)}
                           className="flex items-center gap-1"
                         >
                           <Eye className="w-3 h-3" />
                           عرض
                         </Button>
                         {(appointment.status === "scheduled" || appointment.status === "pending") && (
                           <Button
                             variant="healing"
                             size="sm"
                             onClick={() => sendToTreatment(appointment.id)}
                             className="flex items-center gap-1"
                           >
                             <Stethoscope className="w-3 h-3" />
                             إرسال للعلاج
                           </Button>
                         )}
                         {appointment.status === "in_treatment" && (
                           <Button
                             variant="secondary"
                             size="sm"
                             disabled
                             className="flex items-center gap-1 opacity-50 cursor-not-allowed"
                           >
                             <Stethoscope className="w-3 h-3" />
                             تم الإرسال للعلاج
                           </Button>
                         )}
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Appointment Scheduling Dialog */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">حجز موعد جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCustomer && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">العميل:</p>
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{selectedCustomer.patient_name}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">تاريخ الموعد *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !appointmentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {appointmentDate ? format(appointmentDate, "dd/MM/yyyy") : "اختر التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={appointmentDate}
                    onSelect={setAppointmentDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">وقت الموعد *</label>
              <Input
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الشكوى الرئيسية *</label>
              <Textarea
                placeholder="اكتب الشكوى الرئيسية..."
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setShowAppointmentDialog(false)}
                variant="outline"
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={createScheduledAppointment}
                variant="healing"
                className="flex-1"
                disabled={!appointmentDate || !appointmentTime || !chiefComplaint.trim()}
              >
                حجز الموعد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Appointment Form Dialog */}
      <Dialog open={showNewAppointmentForm} onOpenChange={setShowNewAppointmentForm}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">طلب موعد جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Patient Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">معلومات المريض</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">الاسم الكامل *</label>
                <Input
                  placeholder="أدخل اسمك الكامل"
                  value={newPatient.patient_name}
                  onChange={(e) => setNewPatient({...newPatient, patient_name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">رقم الهاتف *</label>
                <Input
                  placeholder="05xxxxxxxx"
                  value={newPatient.patient_phone}
                  onChange={(e) => setNewPatient({...newPatient, patient_phone: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">رقم الهوية *</label>
                <Input
                  placeholder="أدخل رقم الهوية"
                  value={newPatient.patient_id}
                  onChange={(e) => setNewPatient({...newPatient, patient_id: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">العمر *</label>
                <Input
                  type="number"
                  placeholder="أدخل عمرك"
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">الجنس *</label>
                <Select
                  value={newPatient.gender}
                  onValueChange={(value) => setNewPatient({...newPatient, gender: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الجنس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">تفاصيل الموعد</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">تاريخ الموعد المطلوب *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newPatient.preferred_appointment_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newPatient.preferred_appointment_date ? format(newPatient.preferred_appointment_date, "dd/MM/yyyy") : "اختر تاريخ الموعد"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={newPatient.preferred_appointment_date}
                      onSelect={(date) => setNewPatient({...newPatient, preferred_appointment_date: date})}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">وقت الموعد المطلوب *</label>
                <Input
                  type="time"
                  value={newPatient.preferred_appointment_time}
                  onChange={(e) => setNewPatient({...newPatient, preferred_appointment_time: e.target.value})}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">ملاحظات طبية (اختياري)</label>
                <Textarea
                  placeholder="اذكر أي معلومات طبية مهمة أو ملاحظات خاصة"
                  value={newPatient.chief_complaint}
                  onChange={(e) => setNewPatient({...newPatient, chief_complaint: e.target.value})}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setShowNewAppointmentForm(false)}
                variant="outline"
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={createNewAppointment}
                variant="healing"
                className="flex-1"
                disabled={!newPatient.patient_name || !newPatient.patient_phone || !newPatient.patient_id || 
                         !newPatient.age || !newPatient.gender || !newPatient.preferred_appointment_date || 
                         !newPatient.preferred_appointment_time || !newPatient.chief_complaint.trim()}
              >
                إنشاء الموعد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentsSection;