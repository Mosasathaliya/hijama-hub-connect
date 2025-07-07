import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  History, 
  User,
  Phone,
  Calendar,
  ArrowLeft,
  Search,
  Eye,
  CreditCard,
  Stethoscope,
  MapPin,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Patient {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  date_of_birth?: string;
  chief_complaint: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  status: string;
  submitted_at: string;
  doctor_name?: string;
  total_payments?: number;
  total_visits?: number;
}

interface PaymentHistory {
  id: string;
  amount: number;
  hijama_points_count: number;
  paid_at: string;
  payment_method: string;
  doctor_name: string;
}

interface HijamaReading {
  id: string;
  weight?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  hijama_points: any;
  created_at: string;
}

interface PatientHistorySectionProps {
  onBack?: () => void;
}

const PatientHistorySection = ({ onBack }: PatientHistorySectionProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [hijamaReadings, setHijamaReadings] = useState<HijamaReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { userPermissions } = useAuth();

  useEffect(() => {
    fetchPatients();
  }, [userPermissions]);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      const hasAccessToMales = userPermissions.includes("الوصول للذكور");
      const hasAccessToFemales = userPermissions.includes("الوصول للإناث");

      console.log("PatientHistory - User permissions:", userPermissions);
      console.log("PatientHistory - Access to males:", hasAccessToMales);
      console.log("PatientHistory - Access to females:", hasAccessToFemales);
      
      // If user has no gender permissions, don't show any patients
      if (!hasAccessToMales && !hasAccessToFemales) {
        console.log("PatientHistory - No gender permissions, showing no patients");
        setPatients([]);
        setLoading(false);
        return;
      }

      let allPatients: Patient[] = [];

      // Fetch male patients if user has access
      if (hasAccessToMales) {
        const { data: maleData, error: maleError } = await supabase
          .from("male_patients")
          .select("*")
          .order("submitted_at", { ascending: false });

        if (maleError) throw maleError;

        if (maleData) {
          const malePatients = await Promise.all(
            maleData.map(async (patient) => {
              const { data: payments } = await supabase
                .from("payments")
                .select("amount")
                .eq("patient_id", patient.id)
                .eq("patient_table", "male_patients")
                .eq("payment_status", "completed");

              const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
              const totalVisits = payments?.length || 0;

              return {
                ...patient,
                doctor_name: "",
                total_payments: totalPayments,
                total_visits: totalVisits
              };
            })
          );
          allPatients = [...allPatients, ...malePatients];
        }
      }

      // Fetch female patients if user has access
      if (hasAccessToFemales) {
        const { data: femaleData, error: femaleError } = await supabase
          .from("female_patients")
          .select("*")
          .order("submitted_at", { ascending: false });

        if (femaleError) throw femaleError;

        if (femaleData) {
          const femalePatients = await Promise.all(
            femaleData.map(async (patient) => {
              const { data: payments } = await supabase
                .from("payments")
                .select("amount")
                .eq("patient_id", patient.id)
                .eq("patient_table", "female_patients")
                .eq("payment_status", "completed");

              const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
              const totalVisits = payments?.length || 0;

              return {
                ...patient,
                doctor_name: "",
                total_payments: totalPayments,
                total_visits: totalVisits
              };
            })
          );
          allPatients = [...allPatients, ...femalePatients];
        }
      }

      // Sort all patients by submission date
      allPatients.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

      console.log("Fetched patients based on permissions:", allPatients);
      setPatients(allPatients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات المرضى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (!searchTerm) {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient =>
        patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient_phone.includes(searchTerm) ||
        (patient.patient_email && patient.patient_email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPatients(filtered);
    }
  };

  const fetchPatientDetails = async (patient: Patient) => {
    try {
      setSelectedPatient(patient);
      
      // Determine patient table based on available permissions and patient context
      const hasAccessToMales = userPermissions.includes("الوصول للذكور");
      const hasAccessToFemales = userPermissions.includes("الوصول للإناث");
      
      let patientTable = "";
      if (hasAccessToMales && hasAccessToFemales) {
        // If admin has access to both, we need to determine based on the patient data
        // We'll check both tables to find where this patient exists
        const maleCheck = await supabase.from("male_patients").select("id").eq("id", patient.id).single();
        const femaleCheck = await supabase.from("female_patients").select("id").eq("id", patient.id).single();
        
        if (maleCheck.data) {
          patientTable = "male_patients";
        } else if (femaleCheck.data) {
          patientTable = "female_patients";
        }
      } else if (hasAccessToMales) {
        patientTable = "male_patients";
      } else if (hasAccessToFemales) {
        patientTable = "female_patients";
      }
      
      // Fetch payment history
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          hijama_points_count,
          paid_at,
          payment_method,
          doctors(name)
        `)
        .eq("patient_id", patient.id)
        .eq("patient_table", patientTable)
        .eq("payment_status", "completed")
        .order("paid_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      const formattedPayments = payments?.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        hijama_points_count: payment.hijama_points_count,
        paid_at: payment.paid_at,
        payment_method: payment.payment_method || "نقدي",
        doctor_name: payment.doctors?.name || "غير محدد"
      })) || [];

      setPaymentHistory(formattedPayments);

      // Fetch hijama readings
      const { data: readings, error: readingsError } = await supabase
        .from("hijama_readings")
        .select("*")
        .eq("patient_id", patient.id)
        .eq("patient_table", patientTable)
        .order("created_at", { ascending: false });

      if (readingsError) throw readingsError;
      setHijamaReadings(readings || []);

    } catch (error) {
      console.error("Error fetching patient details:", error);
      toast({
        title: "خطأ في جلب التفاصيل",
        description: "حدث خطأ أثناء جلب تفاصيل المريض",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { text: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800' },
      'payment_pending': { text: 'في انتظار الدفع', color: 'bg-orange-100 text-orange-800' },
      'paid_and_assigned': { text: 'تم الدفع والتعيين', color: 'bg-blue-100 text-blue-800' },
      'completed': { text: 'مكتمل', color: 'bg-green-100 text-green-800' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge variant="secondary" className={statusInfo.color}>
        {statusInfo.text}
      </Badge>
    );
  };

  if (selectedPatient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => setSelectedPatient(null)} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            العودة لقائمة المرضى
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-primary">تفاصيل المريض: {selectedPatient.patient_name}</h2>
            <p className="text-muted-foreground">السجل الطبي والعلاجي الكامل</p>
          </div>
        </div>

        {/* Patient Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">الاسم الكامل:</span>
              <p className="font-medium">{selectedPatient.patient_name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">رقم الهاتف:</span>
              <p className="font-medium">{selectedPatient.patient_phone}</p>
            </div>
            {selectedPatient.patient_email && (
              <div>
                <span className="text-sm text-muted-foreground">البريد الإلكتروني:</span>
                <p className="font-medium">{selectedPatient.patient_email}</p>
              </div>
            )}
            {selectedPatient.date_of_birth && (
              <div>
                <span className="text-sm text-muted-foreground">تاريخ الميلاد:</span>
                <p className="font-medium">{format(new Date(selectedPatient.date_of_birth), "dd/MM/yyyy")}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">الحالة:</span>
              <div className="mt-1">{getStatusBadge(selectedPatient.status)}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">تاريخ التسجيل:</span>
              <p className="font-medium">{format(new Date(selectedPatient.submitted_at), "dd/MM/yyyy")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              المعلومات الطبية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">الشكوى الرئيسية:</span>
              <p className="font-medium">{selectedPatient.chief_complaint}</p>
            </div>
            {selectedPatient.medical_history && (
              <div>
                <span className="text-sm text-muted-foreground">التاريخ المرضي:</span>
                <p className="font-medium">{selectedPatient.medical_history}</p>
              </div>
            )}
            {selectedPatient.allergies && (
              <div>
                <span className="text-sm text-muted-foreground">الحساسيات:</span>
                <p className="font-medium">{selectedPatient.allergies}</p>
              </div>
            )}
            {selectedPatient.current_medications && (
              <div>
                <span className="text-sm text-muted-foreground">الأدوية الحالية:</span>
                <p className="font-medium">{selectedPatient.current_medications}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-primary">عدد الزيارات</CardTitle>
              <div className="text-3xl font-bold text-accent">{selectedPatient.total_visits}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-primary">إجمالي المدفوعات</CardTitle>
              <div className="text-3xl font-bold text-accent">{selectedPatient.total_payments?.toFixed(2)} ر.س</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-primary">عدد قراءات الحجامة</CardTitle>
              <div className="text-3xl font-bold text-accent">{hijamaReadings.length}</div>
            </CardHeader>
          </Card>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              تاريخ المدفوعات ({paymentHistory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentHistory.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا يوجد مدفوعات مسجلة</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>عدد النقاط</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>الطبيب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.paid_at), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {Number(payment.amount).toFixed(2)} ريال
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.hijama_points_count} نقطة</Badge>
                      </TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell>{payment.doctor_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Hijama Readings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              قراءات الحجامة ({hijamaReadings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hijamaReadings.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا يوجد قراءات حجامة مسجلة</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الوزن</TableHead>
                    <TableHead>ضغط الدم</TableHead>
                    <TableHead>نقاط الحجامة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hijamaReadings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>{format(new Date(reading.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>{reading.weight ? `${reading.weight} كج` : "غير محدد"}</TableCell>
                      <TableCell>
                        {reading.blood_pressure_systolic && reading.blood_pressure_diastolic
                          ? `${reading.blood_pressure_systolic}/${reading.blood_pressure_diastolic}`
                          : "غير محدد"
                        }
                      </TableCell>
                      <TableCell>
                        {reading.hijama_points 
                          ? (
                            <Badge variant="outline">
                              {Array.isArray(reading.hijama_points) ? reading.hijama_points.length : Object.keys(reading.hijama_points).length} نقطة
                            </Badge>
                          )
                          : "غير محدد"
                        }
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
            <h2 className="text-2xl font-bold text-primary">تاريخ المرضى</h2>
            <p className="text-muted-foreground">عرض جميع المرضى المسجلين وسجلاتهم الطبية</p>
          </div>
        </div>
        <Button onClick={fetchPatients} variant="outline">
          تحديث
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            البحث في المرضى
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="ابحث بالاسم أو رقم الهاتف أو البريد الإلكتروني..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            قائمة المرضى ({filteredPatients.length})
          </CardTitle>
          <CardDescription>انقر على أي مريض لعرض تفاصيله الكاملة</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "لا يوجد مرضى مطابقين للبحث" : "لا يوجد مرضى مسجلين"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم المريض</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>الشكوى الرئيسية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>عدد الزيارات</TableHead>
                    <TableHead>إجمالي المدفوعات</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {patient.patient_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {patient.patient_phone}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {patient.chief_complaint}
                      </TableCell>
                      <TableCell>{getStatusBadge(patient.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{patient.total_visits} زيارة</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {patient.total_payments?.toFixed(2)} ر.س
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(patient.submitted_at), "dd/MM/yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchPatientDetails(patient)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          عرض التفاصيل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientHistorySection;