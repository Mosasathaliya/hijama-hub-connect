import { Card, CardContent } from "@/components/ui/card";
import { Heart, Bell, Syringe } from "lucide-react";

const benefits = [
  {
    icon: Heart,
    title: "تحسين الصحة العامة",
    description: "تعزز الحجامة من تدفق الدم وتحسن الوظائف الحيوية للجسم"
  },
  {
    icon: Bell,
    title: "تخفيف الألم الطبيعي",
    description: "علاج فعال لآلام الظهر والرقبة والصداع دون أدوية"
  },
  {
    icon: Syringe,
    title: "تقوية المناعة",
    description: "تساعد في تنشيط جهاز المناعة ومقاومة الأمراض"
  }
];

const AboutSection = () => {
  return (
    <section className="py-20 bg-gradient-healing">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-primary mb-6">
                لماذا تختار العلاج بالحجامة؟
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                الحجامة هي طريقة علاج تقليدية آمنة وفعالة، تعتمد على استخدام الكؤوس لتحفيز تدفق الدم 
                وإزالة السموم من الجسم. هذا العلاج الطبيعي له تاريخ طويل في الطب التقليدي ويُستخدم 
                لعلاج مجموعة واسعة من الحالات الصحية.
              </p>
            </div>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-primary mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <Card className="p-8 bg-card shadow-soft border-primary/20">
              <CardContent className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-primary mb-4">فوائد مؤكدة علمياً</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary/5 rounded-xl">
                    <div className="text-3xl font-bold text-primary">95%</div>
                    <div className="text-sm text-muted-foreground">تحسن في آلام الظهر</div>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-xl">
                    <div className="text-3xl font-bold text-accent">90%</div>
                    <div className="text-sm text-muted-foreground">تخفيف الصداع</div>
                  </div>
                  <div className="text-center p-4 bg-primary/5 rounded-xl">
                    <div className="text-3xl font-bold text-primary">85%</div>
                    <div className="text-sm text-muted-foreground">تحسن الدورة الدموية</div>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-xl">
                    <div className="text-3xl font-bold text-accent">92%</div>
                    <div className="text-sm text-muted-foreground">تقليل التوتر</div>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  *نتائج مبنية على دراسات طبية معتمدة
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;