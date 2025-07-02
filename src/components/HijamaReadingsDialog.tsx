import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Weight, MapPin } from "lucide-react";
import PaymentDialog from "./PaymentDialog";
import { format } from "date-fns";

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
}

const HijamaReadingsDialog = ({ 
  patientId, 
  patientName, 
  patientPhone, 
  appointmentDate, 
  appointmentTime, 
  treatmentConditions 
}: HijamaReadingsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [bloodPressure, setBloodPressure] = useState({ systolic: "", diastolic: "" });
  const [weight, setWeight] = useState("");
  const [hijamaPoints, setHijamaPoints] = useState<HijamaPoint[]>([]);

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

  const saveReadings = () => {
    // Here you would save to database
    console.log("Saving readings:", {
      patientId,
      bloodPressure,
      weight,
      hijamaPoints
    });
    setIsOpen(false);
    // Show payment dialog after saving readings
    setShowPayment(true);
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
      
      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        patientName={patientName}
        patientPhone={patientPhone}
        appointmentDate={appointmentDate}
        appointmentTime={appointmentTime}
        treatmentConditions={treatmentConditions}
        hijamaPointsCount={hijamaPoints.length}
      />
    </Dialog>
  );
};

export default HijamaReadingsDialog;