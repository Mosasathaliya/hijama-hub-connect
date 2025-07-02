import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Calendar, Hospital } from "lucide-react";

const ContactSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-primary mb-4">تواصل معنا</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            احجز موعدك اليوم واحصل على أفضل خدمات العلاج بالحجامة
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center p-6 hover:shadow-soft transition-all duration-300 bg-gradient-card border-primary/10">
            <CardHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-primary">اتصل بنا</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary mb-2" dir="ltr">+966 50 123 4567</p>
              <p className="text-muted-foreground">متاح 24/7 للطوارئ</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-soft transition-all duration-300 bg-gradient-card border-primary/10">
            <CardHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-accent rounded-2xl flex items-center justify-center">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-primary">ساعات العمل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-muted-foreground">
                <p>السبت - الخميس: 8:00 - 22:00</p>
                <p>الجمعة: 14:00 - 22:00</p>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-soft transition-all duration-300 bg-gradient-card border-primary/10">
            <CardHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-primary-glow rounded-2xl flex items-center justify-center">
                <Hospital className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-primary">الموقع</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">الرياض، المملكة العربية السعودية</p>
              <p className="text-sm text-muted-foreground mt-2">حي الملك فهد، شارع الأمير محمد</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-md mx-auto p-8 bg-gradient-primary text-white">
            <CardContent className="space-y-6">
              <h3 className="text-2xl font-bold">احجز موعدك الآن</h3>
              <p className="text-white/90">
                استشارة مجانية لتحديد أفضل برنامج علاجي مناسب لحالتك
              </p>
              <div className="space-y-3">
                <Button variant="healing" size="lg" className="w-full">
                  <Phone className="w-5 h-5" />
                  اتصل للحجز
                </Button>
                <Button variant="medical" size="lg" className="w-full">
                  <Calendar className="w-5 h-5" />
                  احجز عبر الإنترنت
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;