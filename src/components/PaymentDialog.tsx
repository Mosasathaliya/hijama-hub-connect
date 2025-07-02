import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Receipt, User, Phone, Calendar, Clock } from "lucide-react";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  treatmentConditions: string[];
  hijamaPointsCount: number;
}

const PaymentDialog = ({ 
  isOpen, 
  onClose, 
  patientName,
  patientPhone,
  appointmentDate,
  appointmentTime,
  treatmentConditions,
  hijamaPointsCount
}: PaymentDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate price based on hijama points (example pricing)
  const pricePerPoint = 50; // SAR per point
  const consultationFee = 100; // SAR
  const totalPrice = (hijamaPointsCount * pricePerPoint) + consultationFee;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
      // Here you would integrate with actual payment gateway
      console.log("Payment processed for:", {
        patient: patientName,
        amount: totalPrice,
        points: hijamaPointsCount,
        conditions: treatmentConditions
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
                  {treatmentConditions.map((condition, index) => (
                    <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                      {condition}
                    </Badge>
                  ))}
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
                <span>رسوم الاستشارة</span>
                <span>{consultationFee} ريال</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>نقاط الحجامة ({hijamaPointsCount} × {pricePerPoint})</span>
                <span>{hijamaPointsCount * pricePerPoint} ريال</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between text-lg font-bold">
                <span>المجموع الكلي</span>
                <span className="text-primary">{totalPrice} ريال</span>
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