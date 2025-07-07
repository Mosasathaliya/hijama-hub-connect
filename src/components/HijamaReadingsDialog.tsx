import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Weight, MapPin } from "lucide-react";
import PaymentDialog from "./PaymentDialog";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HijamaPoint {
  id: string;
  x: number;
  y: number;
  view: 'front' | 'back';
}

interface HijamaReadingsDialogProps {
  patientId: string;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  treatmentConditions: string[];
  patientGender?: string;
  onNavigateToPayment?: (paymentData: any) => void;
}

const HijamaReadingsDialog = ({ 
  patientId, 
  patientName, 
  patientPhone, 
  appointmentDate, 
  appointmentTime, 
  treatmentConditions,
  patientGender,
  onNavigateToPayment
}: HijamaReadingsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [bloodPressure, setBloodPressure] = useState({ systolic: "", diastolic: "" });
  const [weight, setWeight] = useState("");
  const [hijamaPoints, setHijamaPoints] = useState<HijamaPoint[]>([]);
  const [cupPrices, setCupPrices] = useState<any[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchCupPrices();
  }, []);

  useEffect(() => {
    calculatePrice();
  }, [hijamaPoints, cupPrices]);

  const fetchCupPrices = async () => {
    try {
      const { data, error } = await supabase
        .from("hijama_cup_prices")
        .select("*")
        .eq("is_active", true)
        .order("number_of_cups", { ascending: true });

      if (error) throw error;
      setCupPrices(data || []);
    } catch (error) {
      console.error("Error fetching cup prices:", error);
      toast({
        title: "خطأ في جلب الأسعار",
        description: "حدث خطأ أثناء جلب أسعار الكؤوس",
        variant: "destructive",
      });
    }
  };

  const calculatePrice = () => {
    const pointsCount = hijamaPoints.length;
    
    if (pointsCount === 0 || cupPrices.length === 0) {
      setCalculatedPrice(0);
      return;
    }

    // Find the appropriate price tier
    let selectedPrice = cupPrices.find(price => price.number_of_cups === pointsCount);
    
    // If exact match not found, find the closest higher tier
    if (!selectedPrice) {
      selectedPrice = cupPrices
        .filter(price => price.number_of_cups >= pointsCount)
        .sort((a, b) => a.number_of_cups - b.number_of_cups)[0];
    }
    
    // If still no match, use the highest tier
    if (!selectedPrice && cupPrices.length > 0) {
      selectedPrice = cupPrices[cupPrices.length - 1];
    }

    setCalculatedPrice(selectedPrice ? Number(selectedPrice.price) : 0);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, view: 'front' | 'back') => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPoint: HijamaPoint = {
      id: `${Date.now()}-${Math.random()}`,
      x,
      y,
      view
    };
    
    setHijamaPoints(prev => [...prev, newPoint]);
  };

  const removePoint = (pointId: string) => {
    setHijamaPoints(prev => prev.filter(p => p.id !== pointId));
  };

  const saveReadings = async () => {
    try {
      console.log("Starting to save readings...");
      console.log("Patient ID:", patientId);
      console.log("Patient Gender:", patientGender);
      console.log("Hijama points count:", hijamaPoints.length);
      console.log("Calculated price:", calculatedPrice);

      // Determine the patient table based on gender
      const patientTable = patientGender === 'male' ? 'male_patients' : 
                          patientGender === 'female' ? 'female_patients' : 
                          'patient_forms';

      // Save hijama readings to database
      const { error: readingsError } = await supabase
        .from("hijama_readings")
        .insert({
          patient_id: patientId,
          patient_table: patientTable,
          blood_pressure_systolic: bloodPressure.systolic ? parseInt(bloodPressure.systolic) : null,
          blood_pressure_diastolic: bloodPressure.diastolic ? parseInt(bloodPressure.diastolic) : null,
          weight: weight ? parseFloat(weight) : null,
          hijama_points: JSON.parse(JSON.stringify(hijamaPoints))
        });

      if (readingsError) {
        console.error("Error saving hijama readings:", readingsError);
        throw readingsError;
      }

      console.log("Hijama readings saved successfully");

      // Create payment record with calculated price and hijama points count
      console.log("Creating payment record...");
      const paymentData = {
        patient_id: patientId,
        patient_table: patientTable,
        amount: calculatedPrice,
        hijama_points_count: hijamaPoints.length,
        payment_status: "pending"
      };
      console.log("Payment data:", paymentData);

      const { error: paymentError, data: paymentResult } = await supabase
        .from("payments")
        .insert(paymentData);

      if (paymentError) {
        console.error("Error creating payment record:", paymentError);
        throw paymentError;
      }

      console.log("Payment record created successfully:", paymentResult);

      // Update patient status to payment_pending in the correct table
      const { error: statusError } = await supabase
        .from(patientTable)
        .update({ status: "payment_pending" })
        .eq("id", patientId);

      if (statusError) {
        console.error("Error updating patient status:", statusError);
        throw statusError;
      }

      console.log("Patient status updated successfully");

      toast({
        title: "تم حفظ القراءات",
        description: "تم حفظ قراءات الحجامة بنجاح",
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Error saving readings:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ القراءات",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="medical" size="sm" className="flex items-center gap-2">
          <Activity className="w-3 h-3" />
          قراءات الحجامة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">قراءات الحجامة - {patientName}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vital Signs */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  العلامات الحيوية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>ضغط الدم</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="الانقباضي"
                      value={bloodPressure.systolic}
                      onChange={(e) => setBloodPressure(prev => ({ ...prev, systolic: e.target.value }))}
                    />
                    <Input
                      placeholder="الانبساطي"
                      value={bloodPressure.diastolic}
                      onChange={(e) => setBloodPressure(prev => ({ ...prev, diastolic: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Weight className="w-4 h-4" />
                    الوزن (كيلو)
                  </Label>
                  <Input
                    placeholder="الوزن"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hijama Points List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  نقاط الحجامة ({hijamaPoints.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {hijamaPoints.map((point, index) => (
                    <div key={point.id} className="flex items-center justify-between text-sm">
                      <Badge variant="secondary" className="text-xs">
                        نقطة {index + 1} - {point.view === 'front' ? 'أمامي' : 'خلفي'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePoint(point.id)}
                        className="text-xs h-6 px-2"
                      >
                        حذف
                      </Button>
                    </div>
                  ))}
                  {hijamaPoints.length === 0 && (
                    <p className="text-muted-foreground text-xs">اضغط على الصور لتحديد نقاط الحجامة</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Body Images */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Front View */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-center">المنظر الأمامي</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="relative cursor-crosshair bg-gray-50 rounded-lg overflow-hidden"
                  onClick={(e) => handleImageClick(e, 'front')}
                >
                  <img 
                    src="/lovable-uploads/40643aa0-304f-42ac-b70a-18984ee48124.png"
                    alt="Front view anatomy"
                    className="w-full h-auto"
                    draggable={false}
                  />
                  {hijamaPoints
                    .filter(point => point.view === 'front')
                    .map((point, index) => (
                      <div
                        key={point.id}
                        className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                      >
                        <span className="text-white text-xs font-bold">
                          {hijamaPoints.filter(p => p.view === 'front').indexOf(point) + 1}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Back View */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-center">المنظر الخلفي</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="relative cursor-crosshair bg-gray-50 rounded-lg overflow-hidden"
                  onClick={(e) => handleImageClick(e, 'back')}
                >
                  <img 
                    src="/lovable-uploads/a6b525e1-e522-4581-9977-0712dc854683.png"
                    alt="Back view anatomy"
                    className="w-full h-auto"
                    draggable={false}
                  />
                  {hijamaPoints
                    .filter(point => point.view === 'back')
                    .map((point, index) => (
                      <div
                        key={point.id}
                        className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                      >
                        <span className="text-white text-xs font-bold">
                          {hijamaPoints.filter(p => p.view === 'back').indexOf(point) + 1}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            إلغاء
          </Button>
          <Button variant="healing" onClick={saveReadings}>
            حفظ القراءات
          </Button>
        </div>
      </DialogContent>
      
      {/* Payment Dialog - separate from main dialog to avoid nesting issues */}
      {showPayment && (
        <PaymentDialog
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          patientName={patientName}
          patientPhone={patientPhone}
          appointmentDate={appointmentDate}
          appointmentTime={appointmentTime}
          treatmentConditions={treatmentConditions}
          hijamaPointsCount={hijamaPoints.length}
          calculatedPrice={calculatedPrice}
        />
      )}
    </Dialog>
  );
};

export default HijamaReadingsDialog;