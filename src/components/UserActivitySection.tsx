import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Activity, Users, Clock, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface UserActivity {
  id: string;
  user_id: string;
  username: string;
  activity_type: string;
  section_name: string;
  description: string;
  metadata: any;
  created_at: string;
}

interface UserActivitySectionProps {
  onBack: () => void;
}

const UserActivitySection = ({ onBack }: UserActivitySectionProps) => {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Available sections from the dashboard
  const dashboardSections = [
    "الإدارة", "النماذج", "المواعيد", "إضافة طبيب جديد", "أسعار كؤوس الحجامة",
    "العلاج", "دفع وتعيين طبيب", "نقاط الحجامة المحددة", "المدفوعات", 
    "تاريخ المرضى", "إضافة مستخدم جديد", "الفواتير", "كوبون", "عمولة الإحالة"
  ];

  useEffect(() => {
    fetchActivities();
    
    // Real-time subscription for activities
    const channel = supabase
      .channel('user-activities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_activities'
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSection, selectedUser]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('user_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedSection) {
        query = query.eq('section_name', selectedSection);
      }

      if (selectedUser) {
        query = query.eq('user_id', selectedUser);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }

      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (activityType: string, sectionName: string, description: string, metadata?: any) => {
    if (!currentUser) return;

    try {
      await supabase
        .from('user_activities')
        .insert({
          user_id: currentUser.id,
          username: currentUser.username,
          activity_type: activityType,
          section_name: sectionName,
          description,
          metadata
        });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const getActivityColor = (activityType: string) => {
    const colors = {
      'visit': 'bg-blue-500',
      'create': 'bg-green-500',
      'update': 'bg-yellow-500',
      'delete': 'bg-red-500',
      'view': 'bg-purple-500',
      'login': 'bg-indigo-500',
      'logout': 'bg-gray-500'
    };
    return colors[activityType as keyof typeof colors] || 'bg-gray-500';
  };

  const getUniqueUsers = () => {
    const users = Array.from(new Set(activities.map(a => a.user_id)))
      .map(userId => {
        const activity = activities.find(a => a.user_id === userId);
        return { id: userId, username: activity?.username || 'Unknown' };
      });
    return users;
  };

  const getSectionStats = () => {
    const stats = dashboardSections.map(section => {
      const sectionActivities = activities.filter(a => a.section_name === section);
      const uniqueUsers = new Set(sectionActivities.map(a => a.user_id)).size;
      return {
        section,
        totalActivities: sectionActivities.length,
        uniqueUsers,
        lastActivity: sectionActivities[0]?.created_at
      };
    });
    return stats.sort((a, b) => b.totalActivities - a.totalActivities);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-healing p-8">
        <div className="container mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">جاري تحميل أنشطة المستخدمين...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-healing p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للوحة التحكم
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">أنشطة المستخدمين</h1>
            <p className="text-muted-foreground">مراقبة أنشطة المستخدمين في النظام</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الأنشطة</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{activities.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمين النشطين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{getUniqueUsers().length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الأقسام المستخدمة</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {new Set(activities.map(a => a.section_name)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">فلتر حسب القسم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={selectedSection === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSection(null)}
                >
                  الكل
                </Button>
                {dashboardSections.map(section => (
                  <Button
                    key={section}
                    variant={selectedSection === section ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSection(section)}
                  >
                    {section}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">فلتر حسب المستخدم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={selectedUser === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  الكل
                </Button>
                {getUniqueUsers().map(user => (
                  <Button
                    key={user.id}
                    variant={selectedUser === user.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedUser(user.id)}
                  >
                    {user.username}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">إحصائيات الأقسام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getSectionStats().map(stat => (
                <div key={stat.section} className="p-4 border rounded-lg">
                  <h4 className="font-medium text-primary mb-2">{stat.section}</h4>
                  <div className="space-y-1 text-sm">
                    <div>الأنشطة: {stat.totalActivities}</div>
                    <div>المستخدمين: {stat.uniqueUsers}</div>
                    {stat.lastActivity && (
                      <div className="text-muted-foreground">
                        آخر نشاط: {format(new Date(stat.lastActivity), 'PPpp', { locale: ar })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activities Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">سجل الأنشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>القسم</TableHead>
                  <TableHead>نوع النشاط</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>التوقيت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.username}</TableCell>
                    <TableCell>{activity.section_name}</TableCell>
                    <TableCell>
                      <Badge className={`${getActivityColor(activity.activity_type)} text-white`}>
                        {activity.activity_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(activity.created_at), 'PPpp', { locale: ar })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {activities.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">لا توجد أنشطة للعرض</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserActivitySection;