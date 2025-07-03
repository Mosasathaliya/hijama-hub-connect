import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface InvoiceSectionProps {
  onBack: () => void;
}

const InvoiceSection = ({ onBack }: InvoiceSectionProps) => {
  return (
    <div className="min-h-screen bg-gradient-healing">
      <div className="bg-card shadow-soft border-b border-primary/10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">الفواتير</h1>
            <p className="text-sm text-muted-foreground">إدارة الفواتير والحسابات</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-primary">قسم الفواتير</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              سيتم تطوير هذا القسم قريباً لإدارة الفواتير والحسابات
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceSection;