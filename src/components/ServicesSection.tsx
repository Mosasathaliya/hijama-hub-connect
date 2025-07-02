import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Bell, Hospital } from "lucide-react";

const services = [
  {
    icon: Heart,
    title: "الحجامة الجافة",
    description: "علاج تقليدي فعال لتحسين الدورة الدموية وتخفيف الآلام المزمنة",
    benefits: ["تحسين الدورة الدموية", "تخفيف آلام العضلات", "تقوية المناعة"]
  },
  {
    icon: Bell,
    title: "الحجامة الرطبة",
    description: "إزالة السموم من الجسم وتنقية الدم بطريقة طبيعية وآمنة",
    benefits: ["تنقية الدم", "إزالة السموم", "علاج الصداع النصفي"]
  },
  {
    icon: Hospital,
    title: "الحجامة التجميلية",
    description: "تحسين نضارة البشرة وتقليل علامات التقدم في السن",
    benefits: ["تجديد خلايا البشرة", "تقليل التجاعيد", "تحسين نضارة الوجه"]
  }
];

const ServicesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-primary mb-4">خدماتنا المتخصصة</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            نقدم أفضل خدمات الحجامة العلاجية بأحدث الطرق وأعلى معايير السلامة
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="group hover:shadow-glow transition-all duration-300 border-primary/10 hover:border-primary/30 bg-gradient-card">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-primary">{service.title}</CardTitle>
                <CardDescription className="text-base">{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;