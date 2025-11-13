import { ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Menu, Moon, Sun } from 'lucide-react';
import { OfflineIndicator } from './OfflineIndicator';
import { useTheme } from 'next-themes';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

const Layout = ({ children, title }: LayoutProps) => {
  const { signOut, profile } = useAuth();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
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
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/116f37a2-86fb-4d55-b336-c0013fbefcf8.png" alt="Udderly Moolicious Logo" className="h-7 w-7 md:h-8 md:w-8" />
              <h1 className="text-lg md:text-2xl font-bold text-primary">Udderly Moolicious</h1>
            </div>
            
            {isMobile ? (
              <div className="flex items-center gap-2">
                <OfflineIndicator />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72">
                    <SheetHeader>
                      <SheetTitle>Profile Menu</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {profile && (
                        <div className="space-y-3 pb-4 border-b border-border">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{profile.full_name}</p>
                              <p className="text-sm text-muted-foreground">{getRoleDisplay(profile.role)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <Button
                        variant="destructive"
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <OfflineIndicator />
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
                
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
            )}
          </div>
        </div>
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container mx-auto px-4 py-1.5">
            <p className="text-xs text-primary font-medium text-center">
              Welcome back, {profile?.full_name || 'User'}! 👋
            </p>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-2 md:px-4 py-4 md:py-8">
        <Card className="border-0 md:border">
          <CardHeader className="px-3 py-4 md:px-6">
            <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            {children}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Layout;