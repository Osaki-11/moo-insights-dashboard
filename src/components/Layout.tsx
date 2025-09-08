import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Sprout, User } from 'lucide-react';
import { OfflineIndicator } from './OfflineIndicator';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

const Layout = ({ children, title }: LayoutProps) => {
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'farm_owner':
        return 'Farm Owner';
      case 'farm_manager':
        return 'Farm Manager';
      case 'shop_manager':
        return 'Shop Manager';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/20">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/116f37a2-86fb-4d55-b336-c0013fbefcf8.png" alt="Udderly Moolicious Logo" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-primary">Udderly Moolicious</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <OfflineIndicator />
              
              {profile && (
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{profile.full_name}</span>
                  <span className="text-muted-foreground">
                    ({getRoleDisplay(profile.role)})
                  </span>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Layout;