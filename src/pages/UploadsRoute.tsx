import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/DashboardLayout';
import UploadsPage from '@/pages/UploadsPage';
import Auth from '@/pages/Auth';

export default function UploadsRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Auth />;
  return <DashboardLayout><UploadsPage /></DashboardLayout>;
}
