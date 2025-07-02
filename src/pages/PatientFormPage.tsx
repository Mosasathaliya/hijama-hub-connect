import { useParams } from "react-router-dom";
import PatientForm from "@/components/PatientForm";

const PatientFormPage = () => {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-healing flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">رابط غير صالح</h1>
          <p className="text-muted-foreground">الرابط المستخدم غير صحيح أو منتهي الصلاحية</p>
        </div>
      </div>
    );
  }

  return <PatientForm token={token} />;
};

export default PatientFormPage;