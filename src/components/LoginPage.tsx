import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (code === "1234") {
        localStorage.setItem("hijama_logged_in", "true");
        onLogin();
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في مركز الخير تداوي للحجامة",
        });
      } else {
        toast({
          title: "خطأ في الكود",
          description: "الرجاء إدخال الكود الصحيح",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            مركز الخير تداوي للحجامة
          </CardTitle>
          <CardDescription>
            أدخل كود الدخول للوصول إلى النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="أدخل كود الدخول"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-center text-lg"
                dir="ltr"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              variant="healing"
              disabled={isLoading || !code}
            >
              {isLoading ? "جاري التحقق..." : "دخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;