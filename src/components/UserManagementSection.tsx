import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, UserPlus, Edit, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  username: string;
  access_code: string;
  is_active: boolean;
  created_at: string;
}

interface UserPermission {
  permission_key: string;
}

interface UserManagementSectionProps {
  onBack: () => void;
}

const AVAILABLE_PERMISSIONS = [
  { key: "الإدارة", label: "الإدارة" },
  { key: "المواعيد", label: "المواعيد" },
  { key: "العلاج", label: "العلاج" },
  { key: "دفع وتعيين طبيب", label: "دفع وتعيين طبيب" },
  { key: "نقاط الحجامة المحددة", label: "نقاط الحجامة المحددة" },
  { key: "المدفوعات", label: "المدفوعات" },
  { key: "تاريخ المرضى", label: "تاريخ المرضى" },
  { key: "إضافة طبيب جديد", label: "إضافة طبيب جديد" },
  { key: "النماذج", label: "النماذج" },
  { key: "أسعار كؤوس الحجامة", label: "أسعار كؤوس الحجامة" },
];

const UserManagementSection = ({ onBack }: UserManagementSectionProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", access_code: "" });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<string, string[]>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: usersData, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "خطأ في جلب المستخدمين",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setUsers(usersData || []);

    // Fetch permissions for all users
    const { data: permissionsData } = await supabase
      .from('user_permissions')
      .select('user_id, permission_key');

    if (permissionsData) {
      const permissionsMap: Record<string, string[]> = {};
      permissionsData.forEach(p => {
        if (!permissionsMap[p.user_id]) {
          permissionsMap[p.user_id] = [];
        }
        permissionsMap[p.user_id].push(p.permission_key);
      });
      setUserPermissions(permissionsMap);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.access_code) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        username: newUser.username,
        access_code: newUser.access_code,
      }])
      .select()
      .single();

    if (userError) {
      toast({
        title: "خطأ في إضافة المستخدم",
        description: userError.message,
        variant: "destructive",
      });
      return;
    }

    // Add permissions
    if (selectedPermissions.length > 0) {
      const permissionsToInsert = selectedPermissions.map(permission => ({
        user_id: userData.id,
        permission_key: permission,
      }));

      const { error: permError } = await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);

      if (permError) {
        toast({
          title: "خطأ في إضافة الصلاحيات",
          description: permError.message,
          variant: "destructive",
        });
      }
    }

    toast({
      title: "تم إضافة المستخدم بنجاح",
      description: `المستخدم ${newUser.username} تم إضافته بكود ${newUser.access_code}`,
    });

    setNewUser({ username: "", access_code: "" });
    setSelectedPermissions([]);
    setShowAddForm(false);
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      toast({
        title: "خطأ في حذف المستخدم",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "تم حذف المستخدم بنجاح",
    });
    fetchUsers();
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permission]);
    } else {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
    }
  };

  const generateRandomCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setNewUser({ ...newUser, access_code: code });
  };

  return (
    <div className="min-h-screen bg-gradient-healing">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            العودة
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">إدارة المستخدمين</h1>
            <p className="text-muted-foreground">إضافة وإدارة المستخدمين وصلاحياتهم</p>
          </div>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <Card className="mb-8 border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                إضافة مستخدم جديد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>
                <div>
                  <Label htmlFor="access_code">كود الدخول</Label>
                  <div className="flex gap-2">
                    <Input
                      id="access_code"
                      value={newUser.access_code}
                      onChange={(e) => setNewUser({ ...newUser, access_code: e.target.value })}
                      placeholder="أدخل كود الدخول"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateRandomCode}
                    >
                      عشوائي
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>الصلاحيات</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.key} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={permission.key}
                        checked={selectedPermissions.includes(permission.key)}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.key, checked as boolean)
                        }
                      />
                      <Label htmlFor={permission.key} className="text-sm">
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddUser} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  حفظ المستخدم
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedPermissions([]);
                    setNewUser({ username: "", access_code: "" });
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add User Button */}
        {!showAddForm && (
          <div className="mb-8">
            <Button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              إضافة مستخدم جديد
            </Button>
          </div>
        )}

        {/* Users List */}
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} className="border-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{user.username}</CardTitle>
                    <CardDescription>
                      كود الدخول: {user.access_code} | 
                      {user.is_active ? " نشط" : " غير نشط"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-sm font-medium">الصلاحيات الحالية:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {userPermissions[user.id]?.map((permission) => (
                      <span
                        key={permission}
                        className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                      >
                        {permission}
                      </span>
                    )) || <span className="text-muted-foreground text-sm">لا توجد صلاحيات</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManagementSection;