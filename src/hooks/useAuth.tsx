import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  isLoggedIn: boolean;
  currentUser: any;
  userPermissions: string[];
  login: (code: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    const loggedIn = localStorage.getItem("hijama_logged_in") === "true";
    const userData = localStorage.getItem("hijama_user_data");
    const permissions = localStorage.getItem("hijama_user_permissions");
    
    if (loggedIn && userData) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(userData));
      setUserPermissions(permissions ? JSON.parse(permissions) : []);
    }
  }, []);

  const login = async (code: string): Promise<boolean> => {
    try {
      // Check for admin code first (fallback)
      if (code === "1234") {
        const adminUser = {
          id: "admin",
          username: "Admin",
          access_code: "1234",
          is_active: true
        };
        
        // Admin has all permissions including gender access
        const allPermissions = [
          "الإدارة", "المواعيد", "العلاج", "دفع وتعيين طبيب", 
          "نقاط الحجامة المحددة", "المدفوعات", "تاريخ المرضى", 
          "إضافة طبيب جديد", "النماذج", "أسعار كؤوس الحجامة", 
          "إضافة مستخدم جديد", "الفواتير", "كوبون", "عمولة الإحالة",
          "الوصول للذكور", "الوصول للإناث"
        ];

        setIsLoggedIn(true);
        setCurrentUser(adminUser);
        setUserPermissions(allPermissions);
        
        localStorage.setItem("hijama_logged_in", "true");
        localStorage.setItem("hijama_user_data", JSON.stringify(adminUser));
        localStorage.setItem("hijama_user_permissions", JSON.stringify(allPermissions));
        
        return true;
      }

      // Check against database users
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('access_code', code)
        .eq('is_active', true)
        .single();

      if (error || !userData) {
        return false;
      }

      // Get user permissions
      const { data: permissionsData } = await supabase
        .from('user_permissions')
        .select('permission_key')
        .eq('user_id', userData.id);

      const permissions = permissionsData?.map(p => p.permission_key) || [];

      console.log("Auth Hook - User ID:", userData.id);
      console.log("Auth Hook - Raw permissions data:", permissionsData);
      console.log("Auth Hook - Processed permissions:", permissions);

      setIsLoggedIn(true);
      setCurrentUser(userData);
      setUserPermissions(permissions);
      
      localStorage.setItem("hijama_logged_in", "true");
      localStorage.setItem("hijama_user_data", JSON.stringify(userData));
      localStorage.setItem("hijama_user_permissions", JSON.stringify(permissions));
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserPermissions([]);
    localStorage.removeItem("hijama_logged_in");
    localStorage.removeItem("hijama_user_data");
    localStorage.removeItem("hijama_user_permissions");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, currentUser, userPermissions, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};