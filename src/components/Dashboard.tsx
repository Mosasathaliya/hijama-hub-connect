import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LogOut, 
  Settings, 
  Calendar, 
  Stethoscope, 
  CreditCard, 
  History, 
  UserPlus, 
  Receipt, 
  FileText,
  UserCog,
  DollarSign,
  MapPin
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import FormsManagement from "@/components/FormsManagement";
import AppointmentsSection from "@/components/AppointmentsSection";
import AddDoctorSection from "@/components/AddDoctorSection";
import HijamaCupPricingSection from "@/components/HijamaCupPricingSection";
import TreatmentSection from "@/components/TreatmentSection";
import HijamaPointsViewSection from "@/components/HijamaPointsViewSection";
import PaymentAndAssignDoctorSection from "@/components/PaymentAndAssignDoctorSection";
import PaymentsSection from "@/components/PaymentsSection";
import PatientHistorySection from "@/components/PatientHistorySection";
import ManagementSection from "@/components/ManagementSection";
import UserManagementSection from "@/components/UserManagementSection";
import InvoiceSection from "@/components/InvoiceSection";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { logout, userPermissions, currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Real-time subscription for user permissions changes
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel('user-permissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_permissions',
          filter: `user_id=eq.${currentUser.id}`
        },
        () => {
          // Force refresh the component when permissions change
          setRefreshKey(prev => prev + 1);
          // Force a page reload to refresh permissions
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  if (activeSection === "الإدارة") {
    return <ManagementSection onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "النماذج") {
    return <FormsManagement onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "المواعيد") {
    return <AppointmentsSection onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "إضافة طبيب جديد") {
    return <AddDoctorSection onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "أسعار كؤوس الحجامة") {
    return <HijamaCupPricingSection onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "العلاج") {
    return <TreatmentSection onBack={() => setActiveSection(null)} onNavigateToPayment={(data) => {
      setPaymentData(data);
      setActiveSection("دفع وتعيين طبيب");
    }} />;
  }

  if (activeSection === "دفع وتعيين طبيب") {
    return <PaymentAndAssignDoctorSection onBack={() => setActiveSection(null)} paymentData={paymentData} />;
  }

  if (activeSection === "نقاط الحجامة المحددة") {
    return <HijamaPointsViewSection onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "المدفوعات") {
    return <PaymentsSection onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "تاريخ المرضى") {
    return <PatientHistorySection onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "إضافة مستخدم جديد") {
    return <UserManagementSection onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "الفواتير") {
    return <InvoiceSection onBack={() => setActiveSection(null)} />;
  }

  const menuItems = [
    {
      title: "الإدارة",
      description: "إعدادات المركز والإدارة العامة",
      icon: Settings,
      color: "bg-blue-500",
    },
    {
      title: "الفواتير",
      description: "إدارة الفواتير والحسابات",
      icon: Receipt,
      color: "bg-violet-500",
    },
    {
      title: "المواعيد",
      description: "إدارة مواعيد المرضى",
      icon: Calendar,
      color: "bg-green-500",
    },
    {
      title: "العلاج",
      description: "متابعة جلسات العلاج",
      icon: Stethoscope,
      color: "bg-purple-500",
    },
    {
      title: "دفع وتعيين طبيب",
      description: "الدفع وتعيين طبيب للمرضى",
      icon: UserCog,
      color: "bg-blue-600",
    },
    {
      title: "نقاط الحجامة المحددة",
      description: "عرض جميع نقاط الحجامة المحددة للمرضى",
      icon: MapPin,
      color: "bg-red-500",
    },
    {
      title: "المدفوعات",
      description: "إدارة المدفوعات والفواتير",
      icon: CreditCard,
      color: "bg-orange-500",
    },
    {
      title: "تاريخ المرضى",
      description: "سجلات وتاريخ المرضى",
      icon: History,
      color: "bg-teal-500",
    },
    {
      title: "إضافة مستخدم جديد",
      description: "إدارة المستخدمين وصلاحياتهم",
      icon: UserPlus,
      color: "bg-indigo-500",
    },
    {
      title: "إضافة طبيب جديد",
      description: "تسجيل طبيب جديد في النظام",
      icon: UserCog,
      color: "bg-emerald-500",
    },
    {
      title: "النماذج",
      description: "النماذج والاستمارات",
      icon: FileText,
      color: "bg-yellow-500",
    },
    {
      title: "أسعار كؤوس الحجامة",
      description: "إدارة أسعار كؤوس الحجامة",
      icon: DollarSign,
      color: "bg-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-healing">
      {/* Header */}
      <div className="bg-card shadow-soft border-b border-primary/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/lovable-uploads/71e101ef-25e8-4d86-8d58-98dc2069ebba.png"
              alt="شعار مركز الخير تداوي للحجامة"
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-primary">مركز الخير تداوي للحجامة</h1>
              <p className="text-sm text-muted-foreground">لوحة التحكم الإدارية</p>
            </div>
          </div>
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
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">مرحباً بك في لوحة التحكم</h2>
          <p className="text-muted-foreground">اختر القسم الذي تريد الوصول إليه</p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems
            .filter(item => userPermissions.length === 0 || userPermissions.includes(item.title))
            .map((item, index) => (
            <Card 
              key={index} 
              className="hover:shadow-glow transition-all duration-300 cursor-pointer group hover:scale-105 border-primary/10"
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg text-primary">{item.title}</CardTitle>
                <CardDescription className="text-sm">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant="healing" 
                  className="w-full"
                  size="sm"
                  onClick={() => setActiveSection(item.title)}
                >
                  دخول
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;