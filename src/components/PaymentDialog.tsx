
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreditCard, Receipt, User, Phone, Calendar, Clock, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  treatmentConditions: string[];
  hijamaPointsCount: number;
  calculatedPrice: number;
}

const PaymentDialog = ({ 
  isOpen, 
  onClose, 
  patientName,
  patientPhone,
  appointmentDate,
  appointmentTime,
  treatmentConditions = [], // Add default empty array
  hijamaPointsCount,
  calculatedPrice
}: PaymentDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [doctors, setDoctors] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast({
        title: "خطأ في جلب الأطباء",
        description: "حدث خطأ أثناء جلب قائمة الأطباء",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    if (!selectedDoctorId) {
      toast({
        title: "يرجى اختيار طبيب",
        description: "يجب اختيار طبيب قبل إتمام عملية الدفع",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
      // Here you would integrate with actual payment gateway
      console.log("Payment processed for:", {
        patient: patientName,
        amount: calculatedPrice,
        points: hijamaPointsCount,
        conditions: treatmentConditions,
        doctorId: selectedDoctorId
      });
      
      toast({
        title: "تم الدفع بنجاح",
        description: "تم إتمام عملية الدفع وتحديد الطبيب المختص",
      });
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            فاتورة العلاج والدفع
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                معلومات المريض
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">اسم المريض:</span>
                <span className="font-medium">{patientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">رقم الهاتف:</span>
                <span className="font-medium">{patientPhone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">تاريخ الموعد:</span>
                <span className="font-medium">{appointmentDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">وقت الموعد:</span>
                <span className="font-medium">{appointmentTime}</span>
              </div>
            </CardContent>
          </Card>

          {/* Treatment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ملخص العلاج</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">الحالات المعالجة:</h4>
                <div className="flex flex-wrap gap-2">
                  {treatmentConditions && treatmentConditions.length > 0 ? (
                    treatmentConditions.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                        {condition}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">لم يتم تحديد حالات العلاج</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">عدد نقاط الحجامة:</span>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {hijamaPointsCount} نقطة
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                تحديد الطبيب المعالج
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>اختر الطبيب:</Label>
                <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طبيب من القائمة" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <div className="flex items-center gap-2">
                          <span>{doctor.name}</span>
                          {doctor.specialization && (
                            <Badge variant="outline" className="text-xs">
                              {doctor.specialization}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                تفاصيل الفاتورة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>جلسة الحجامة ({hijamaPointsCount} نقطة)</span>
                <span>{calculatedPrice} ريال</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between text-lg font-bold">
                <span>المجموع الكلي</span>
                <span className="text-primary">{calculatedPrice} ريال</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              إلغاء
            </Button>
            <Button 
              variant="healing" 
              onClick={handlePayment}
              className="flex-1 flex items-center gap-2"
              disabled={isProcessing}
            >
              <CreditCard className="w-4 h-4" />
              {isProcessing ? "جاري المعالجة..." : "الدفع الآن"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
