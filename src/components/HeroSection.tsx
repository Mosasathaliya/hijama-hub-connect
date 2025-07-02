import { Button } from "@/components/ui/button";
import { Heart, Calendar, Phone, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const { logout } = useAuth();

  return (
    <section className="relative min-h-screen bg-gradient-healing flex items-center justify-center px-4">
      {/* Logout Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={logout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          تسجيل خروج
        </Button>
      </div>
      <div className="container max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <img 
                src="/lovable-uploads/71e101ef-25e8-4d86-8d58-98dc2069ebba.png"
                alt="شعار مركز الخير تداوي للحجامة"
                className="w-32 h-32 md:w-40 md:h-40 object-contain"
              />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-primary leading-tight">
              مركز الخير تداوي
              <span className="block text-primary-glow">للحجامة</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              العلاج الطبيعي بالحجامة وفق الطرق التقليدية المعتمدة للشفاء والعافية
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="group">
              <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
              احجز موعد
            </Button>
            <Button variant="healing" size="lg" className="group">
              <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
              اتصل بنا
            </Button>
          </div>

          <div className="flex items-center gap-3 text-primary">
            <Heart className="w-6 h-6 text-accent" />
            <span className="text-lg font-medium">أكثر من 10 سنوات من الخبرة في العلاج بالحجامة</span>
          </div>
        </div>

        <div className="relative">
          <div className="bg-card rounded-3xl p-8 shadow-soft border border-primary/10">
            <img 
              src="/lovable-uploads/953bf037-9883-45c1-94d2-3c35e10580ab.png"
              alt="مركز التداوي للحجامة"
              className="w-full max-w-md mx-auto"
            />
          </div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-primary rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary-glow/20 rounded-full opacity-30 animate-pulse delay-1000"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;