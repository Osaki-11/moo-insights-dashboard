import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, Milk, Egg, Store } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Sprout className="h-16 w-16 text-primary mr-4" />
            <h1 className="text-5xl font-bold text-primary">Udderly Moolicious</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Complete Farm Management System for Modern Dairy Operations
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="px-8 py-3"
          >
            Get Started
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Milk className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Farm Management</CardTitle>
              <CardDescription>
                Track milk production, chicken management, and feed inventory
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Store className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Shop Operations</CardTitle>
              <CardDescription>
                Manage inventory, sales, and shop performance across multiple locations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Egg className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Real-time Insights</CardTitle>
              <CardDescription>
                Get comprehensive reports and analytics for informed decision making
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">About Our Farm</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Udderly Moolicious is a locally owned farm specializing in dairy and poultry products. 
              We manage 7 cows for milk production, process mala and yogurt, and maintain a chicken 
              operation for eggs and meat. Our products are distributed through 2 retail shops, 
              providing fresh, quality products to our community.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
