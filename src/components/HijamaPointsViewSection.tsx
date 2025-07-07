import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  MapPin, 
  User,
  Phone,
  Calendar,
  Activity,
  Weight,
  Eye,
  Filter,
  CalendarIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface HijamaPoint {
  id: string;
  x: number;
  y: number;
  view: 'front' | 'back';
}

interface HijamaReading {
  id: string;
  patient_name: string;
  patient_phone: string;
  preferred_appointment_date: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  weight: number | null;
  hijama_points: HijamaPoint[];
  created_at: string;
}

interface HijamaPointsViewSectionProps {
  onBack?: () => void;
}

const HijamaPointsViewSection = ({ onBack }: HijamaPointsViewSectionProps) => {
  const [hijamaReadings, setHijamaReadings] = useState<HijamaReading[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<HijamaReading[]>([]);
  const [selectedReading, setSelectedReading] = useState<HijamaReading | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const { toast } = useToast();
  const { userPermissions } = useAuth();

  useEffect(() => {
    fetchHijamaReadings();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('hijama-readings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hijama_readings'
        },
        () => {
          console.log('Hijama readings data changed, refetching...');
          fetchHijamaReadings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userPermissions]);

  useEffect(() => {
    filterReadings();
  }, [hijamaReadings, filterDate, showTodayOnly]);

  const filterReadings = () => {
    let filtered = [...hijamaReadings];
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    if (showTodayOnly && !filterDate) {
      // Show only today's readings based on reading creation date (local timezone)
      filtered = filtered.filter(reading => {
        const readingDate = new Date(reading.created_at);
        return readingDate >= todayStart && readingDate < todayEnd;
      });
    } else if (filterDate) {
      // Show readings for the selected date (local timezone)
      const selectedStart = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
      const selectedEnd = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate() + 1);
      filtered = filtered.filter(reading => {
        const readingDate = new Date(reading.created_at);
        return readingDate >= selectedStart && readingDate < selectedEnd;
      });
    }
    
    setFilteredReadings(filtered);
  };

  const fetchHijamaReadings = async () => {
    try {
      const hasAccessToMales = userPermissions.includes("الوصول للذكور");
      const hasAccessToFemales = userPermissions.includes("الوصول للإناث");

      console.log("HijamaPoints - User permissions:", userPermissions);
      console.log("HijamaPoints - Access to males:", hasAccessToMales);
      console.log("HijamaPoints - Access to females:", hasAccessToFemales);
      
      // If user has no gender permissions, don't show any readings
      if (!hasAccessToMales && !hasAccessToFemales) {
        console.log("HijamaPoints - No gender permissions, showing no readings");
        setHijamaReadings([]);
        setLoading(false);
        return;
      }

      // First fetch all hijama readings with patient_table filter
      let readingsQuery = supabase
        .from("hijama_readings")
        .select(`
          id,
          patient_id,
          patient_table,
          blood_pressure_systolic,
          blood_pressure_diastolic,
          weight,
          hijama_points,
          created_at
        `)
        .order("created_at", { ascending: false });

      // Apply gender-based filtering
      const allowedTables = [];
      if (hasAccessToMales) allowedTables.push('male_patients');
      if (hasAccessToFemales) allowedTables.push('female_patients');
      
      if (allowedTables.length > 0) {
        readingsQuery = readingsQuery.in('patient_table', allowedTables);
      }

      const { data: readingsData, error } = await readingsQuery;

      if (error) throw error;

      if (!readingsData || readingsData.length === 0) {
        setHijamaReadings([]);
        return;
      }

      // Group readings by table
      const readingsByTable = readingsData.reduce((acc, reading) => {
        const table = reading.patient_table || 'patient_forms';
        if (!acc[table]) acc[table] = [];
        acc[table].push(reading);
        return acc;
      }, {} as Record<string, any[]>);

      // Fetch patient data for each allowed table only
      const formattedReadings = [];
      
      for (const [tableName, tableReadings] of Object.entries(readingsByTable)) {
        // Only process tables the user has access to
        if ((tableName === 'male_patients' && hasAccessToMales) || 
            (tableName === 'female_patients' && hasAccessToFemales)) {
          const patientIds = tableReadings.map(r => r.patient_id);
          
          const { data: patientsData } = await supabase
            .from(tableName)
            .select('id, patient_name, patient_phone, preferred_appointment_date')
            .in('id', patientIds);

          // Merge reading data with patient data
          for (const reading of tableReadings) {
            const patient = patientsData?.find(p => p.id === reading.patient_id);
            if (patient) {
              formattedReadings.push({
                id: reading.id,
                patient_name: patient.patient_name,
                patient_phone: patient.patient_phone,
                preferred_appointment_date: patient.preferred_appointment_date,
                blood_pressure_systolic: reading.blood_pressure_systolic,
                blood_pressure_diastolic: reading.blood_pressure_diastolic,
                weight: reading.weight,
                hijama_points: Array.isArray(reading.hijama_points) ? (reading.hijama_points as unknown as HijamaPoint[]) : [],
                created_at: reading.created_at
              });
            }
          }
        }
      }

      // Sort by created_at
      formattedReadings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log("HijamaPoints - Formatted readings based on permissions:", formattedReadings);
      setHijamaReadings(formattedReadings);
    } catch (error) {
      console.error("Error fetching hijama readings:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات نقاط الحجامة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (reading: HijamaReading) => {
    setSelectedReading(reading);
    setShowDetailsDialog(true);
  };

  const getFrontPoints = (points: HijamaPoint[]) => {
    return points.filter(point => point.view === 'front');
  };

  const getBackPoints = (points: HijamaPoint[]) => {
    return points.filter(point => point.view === 'back');
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
            <h2 className="text-2xl font-bold text-primary">نقاط الحجامة المحددة</h2>
            <p className="text-muted-foreground">عرض جميع نقاط الحجامة المحددة للمرضى</p>
          </div>
        </div>
        <Button onClick={fetchHijamaReadings} variant="outline">
          تحديث
        </Button>
      </div>

      {/* Date Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            تصفية القراءات
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
              قراءات اليوم فقط
            </Button>
            
            <Button
              variant={!showTodayOnly && !filterDate ? "default" : "outline"}
              onClick={() => {
                setShowTodayOnly(false);
                setFilterDate(undefined);
              }}
              className="flex items-center gap-2"
            >
              جميع القراءات
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
                  setShowTodayOnly(false);
                }}
                className="text-muted-foreground"
              >
                إزالة التصفية
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hijama Readings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              {showTodayOnly && !filterDate 
                ? `قراءات اليوم (${filteredReadings.length})`
                : filterDate 
                  ? `قراءات ${format(filterDate, "dd/MM/yyyy")} (${filteredReadings.length})`
                  : `جميع قراءات نقاط الحجامة (${filteredReadings.length})`
              }
            </span>
          </CardTitle>
          <CardDescription>
            {showTodayOnly && !filterDate 
              ? "قراءات الحجامة المسجلة اليوم مرتبة من الأحدث للأقدم"
              : "قراءات الحجامة مع النقاط المحددة مرتبة من الأحدث للأقدم"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : filteredReadings.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {showTodayOnly && !filterDate 
                  ? "لا توجد قراءات حجامة لليوم" 
                  : filterDate 
                    ? "لا توجد قراءات حجامة في التاريخ المحدد"
                    : "لا توجد قراءات حجامة محفوظة"
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
                  <TableHead>عدد النقاط</TableHead>
                  <TableHead>النقاط الأمامية</TableHead>
                  <TableHead>النقاط الخلفية</TableHead>
                  <TableHead>تاريخ القراءة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReadings.map((reading) => (
                  <TableRow key={reading.id}>
                    <TableCell className="font-medium">{reading.patient_name}</TableCell>
                    <TableCell>{reading.patient_phone}</TableCell>
                    <TableCell>{format(new Date(reading.preferred_appointment_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {reading.hijama_points.length} نقطة
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getFrontPoints(reading.hijama_points).length} نقطة أمامية
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getBackPoints(reading.hijama_points).length} نقطة خلفية
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(reading.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(reading)}
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
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              تفاصيل نقاط الحجامة - {selectedReading?.patient_name}
            </DialogTitle>
            <DialogDescription className="text-right">
              عرض النقاط المحددة والعلامات الحيوية
            </DialogDescription>
          </DialogHeader>
          
          {selectedReading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient Info & Vital Signs */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      معلومات المريض
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">الاسم:</span>
                      <span className="font-medium">{selectedReading.patient_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">الهاتف:</span>
                      <span className="font-medium">{selectedReading.patient_phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">تاريخ الموعد:</span>
                      <span className="font-medium">{format(new Date(selectedReading.preferred_appointment_date), "dd/MM/yyyy")}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      العلامات الحيوية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">ضغط الدم:</span>
                      <span className="font-medium">
                        {selectedReading.blood_pressure_systolic && selectedReading.blood_pressure_diastolic
                          ? `${selectedReading.blood_pressure_systolic}/${selectedReading.blood_pressure_diastolic}`
                          : "غير محدد"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">الوزن:</span>
                      <span className="font-medium">
                        {selectedReading.weight ? `${selectedReading.weight} كيلو` : "غير محدد"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">عدد النقاط:</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {selectedReading.hijama_points.length} نقطة
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Body Images with Points */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Front View */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-center">المنظر الأمامي ({getFrontPoints(selectedReading.hijama_points).length} نقطة)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                      <img 
                        src="/lovable-uploads/40643aa0-304f-42ac-b70a-18984ee48124.png"
                        alt="Front view anatomy"
                        className="w-full h-auto"
                        draggable={false}
                      />
                      {getFrontPoints(selectedReading.hijama_points).map((point, index) => (
                        <div
                          key={point.id}
                          className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                          style={{ left: `${point.x}%`, top: `${point.y}%` }}
                        >
                          <span className="text-white text-xs font-bold">
                            {index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Back View */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-center">المنظر الخلفي ({getBackPoints(selectedReading.hijama_points).length} نقطة)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                      <img 
                        src="/lovable-uploads/a6b525e1-e522-4581-9977-0712dc854683.png"
                        alt="Back view anatomy"
                        className="w-full h-auto"
                        draggable={false}
                      />
                      {getBackPoints(selectedReading.hijama_points).map((point, index) => (
                        <div
                          key={point.id}
                          className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                          style={{ left: `${point.x}%`, top: `${point.y}%` }}
                        >
                          <span className="text-white text-xs font-bold">
                            {index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HijamaPointsViewSection;