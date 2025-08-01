import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';

interface Cow {
  id: string;
  name?: string;
  breed?: string;
  healthStatus?: string;
  lastMilkingAmount?: number;
}

interface CowManagementTabProps {
  cows: Cow[];
}

const CowManagementTab = ({ cows }: CowManagementTabProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <span>Cow Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No cows found in the system</p>
              <Button className="mt-4">Add First Cow</Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Breed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Milking (L)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {cows.slice(0, 10).map((cow) => (
                      <tr key={cow.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          #{cow.id.substring(0, 6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {cow.name || 'Unnamed'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {cow.breed || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${cow.healthStatus === 'healthy' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>
                            {cow.healthStatus || 'unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {cow.lastMilkingAmount ? cow.lastMilkingAmount.toFixed(1) + 'L' : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            <Button size="sm" variant="outline">
                              Update Health
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {cows.length > 10 && (
                <div className="mt-4 text-center">
                  <Button variant="outline">
                    View All Cows ({cows.length})
                  </Button>
                </div>
              )}
              
              <div className="mt-6 flex gap-4">
                <Button>Add New Cow</Button>
                <Button variant="outline">Import Cows</Button>
                <Button variant="outline">Export Data</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cow Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Healthy Cows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cows.filter(cow => cow.healthStatus === 'healthy').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cows Need Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {cows.filter(cow => cow.healthStatus === 'sick').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Daily Milk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cows.length > 0 ? 
                (cows.reduce((sum, cow) => sum + (cow.lastMilkingAmount || 0), 0) / cows.length).toFixed(1) + 'L'
                : '0L'
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CowManagementTab;