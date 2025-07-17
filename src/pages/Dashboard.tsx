import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import FarmOwnerDashboard from '@/components/dashboards/FarmOwnerDashboard';
import FarmManagerDashboard from '@/components/dashboards/FarmManagerDashboard';
import ShopManagerDashboard from '@/components/dashboards/ShopManagerDashboard';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { profile, loading } = useAuth();

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getDashboardTitle = () => {
    switch (profile.role) {
      case 'farm_owner':
        return 'Farm Owner Dashboard';
      case 'farm_manager':
        return 'Farm Manager Dashboard';
      case 'shop_manager':
        return 'Shop Manager Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const renderDashboard = () => {
    switch (profile.role) {
      case 'farm_owner':
        return <FarmOwnerDashboard />;
      case 'farm_manager':
        return <FarmManagerDashboard />;
      case 'shop_manager':
        return <ShopManagerDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <Layout title={getDashboardTitle()}>
      {renderDashboard()}
    </Layout>
  );
};

export default Dashboard;