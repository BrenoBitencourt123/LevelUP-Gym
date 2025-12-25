import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isOnboardingComplete } from '@/lib/appState';
import { getActiveObjective, hasActiveObjective } from "@/lib/objectiveState";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, isConfigured } = useAuth();
  const location = useLocation();
  const onboardingComplete = isOnboardingComplete();
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  const isObjectiveRoute = location.pathname.startsWith('/objetivo');
  const isObjectiveCompletionRoute = location.pathname.startsWith('/objetivo/concluido');
  const activeObjective = getActiveObjective();

  // Sem Firebase configurado, ainda exigimos login (mostrará aviso no login)
  if (!isConfigured) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Mostra loading enquanto verifica autenticaÇõÇœo
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redireciona para login se nÇœo autenticado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!onboardingComplete && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboardingComplete) {
    if (activeObjective?.status === "concluido" && !activeObjective.rewardClaimed && !isObjectiveCompletionRoute) {
      return <Navigate to="/objetivo/concluido" replace />;
    }

    if (!hasActiveObjective() && !isObjectiveRoute) {
      return <Navigate to="/objetivo" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
