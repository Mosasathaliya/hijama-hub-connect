import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PatientFormPage from "./pages/PatientFormPage";
import LoginPage from "@/components/LoginPage";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isLoggedIn, login } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/patient-form/:token" element={<PatientFormPage />} />
        <Route path="/" element={isLoggedIn ? <Index /> : <LoginPage onLogin={login} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
