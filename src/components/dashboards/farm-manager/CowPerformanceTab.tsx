import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Activity, TrendingUp, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Cow {
  id: string;
  name: string;
  breed: string;
  health_status: string;
  last_milking_amount: number;
  birth_date?: string;
}

interface MilkRecord {
  id: string;
  date: string;
  amount: number;
  milking_time: string;
  milking_period: string;
}

const CowPerformanceTab = () => {
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCow, setSelectedCow] = useState<Cow | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [milkingHistory, setMilkingHistory] = useState<MilkRecord[]>([]);
  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [newHealthStatus, setNewHealthStatus] = useState('');
  const { toast } = useToast();

  const fetchCows = async () => {
    try {
      const { data, error } = await supabase
        .from('cows')
        .select('*')
        .order('name');

      if (error) throw error;
      setCows(data || []);
    } catch (error) {
      console.error('Error fetching cows:', error);
      toast({
        title: "Error",
        description: "Failed to load cow data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (cow: Cow) => {
    setSelectedCow(cow);
    setNewHealthStatus(cow.health_status);
    setIsDetailsDialogOpen(true);
    setIsEditingHealth(false);
    
    try {
      // Fetch milking history for past 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: milkingData, error } = await supabase
        .from('milk_records')
        .select('*')
        .eq('cow_id', cow.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      setMilkingHistory(milkingData || []);
    } catch (error) {
      console.error('Error fetching cow details:', error);
      toast({
        title: "Error",
        description: "Failed to load cow performance data",
        variant: "destructive"
      });
    }
  };

  const handleUpdateHealthStatus = async () => {
    if (!selectedCow) return;

    try {
      const { error } = await supabase
        .from('cows')
        .update({ health_status: newHealthStatus })
        .eq('id', selectedCow.id);

      if (error) throw error;

      // Update local state
      setSelectedCow({ ...selectedCow, health_status: newHealthStatus });
      setCows(cows.map(cow => 
        cow.id === selectedCow.id 
          ? { ...cow, health_status: newHealthStatus }
          : cow
      ));
      setIsEditingHealth(false);

      toast({
        title: "Success",
        description: "Health status updated successfully",
      });
    } catch (error) {
      console.error('Error updating health status:', error);
      toast({
        title: "Error",
        description: "Failed to update health status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchCows();
  }, []);

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'sick':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'recovering':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const calculateAverageProduction = (records: MilkRecord[]) => {
    if (records.length === 0) return 0;
    const total = records.reduce((sum, record) => sum + record.amount, 0);
    return total / records.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <span>Individual Cow Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No cows found in the system</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Breed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Health</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Milking (L)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {cows.map((cow) => (
                    <tr key={cow.id} className="hover:bg-muted/50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {cow.name || 'Unnamed'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {cow.breed || 'Unknown'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getHealthStatusColor(cow.health_status)}`}>
                          {cow.health_status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {cow.last_milking_amount ? cow.last_milking_amount.toFixed(1) + 'L' : 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetails(cow)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Performance
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cows.length > 0 ? (
              <div>
                <div className="text-xl font-bold">
                  {cows.reduce((prev, current) => 
                    (prev.last_milking_amount || 0) > (current.last_milking_amount || 0) ? prev : current
                  ).name}
                </div>
                <p className="text-sm text-muted-foreground">
                  {Math.max(...cows.map(cow => cow.last_milking_amount || 0)).toFixed(1)}L last milking
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Healthy Cows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cows.filter(cow => cow.health_status === 'healthy').length}
            </div>
            <p className="text-sm text-muted-foreground">
              of {cows.length} total cows
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cows.length > 0 ? 
                (cows.reduce((sum, cow) => sum + (cow.last_milking_amount || 0), 0) / cows.length).toFixed(1) + 'L'
                : '0L'
              }
            </div>
            <p className="text-sm text-muted-foreground">
              per cow last milking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cow Performance Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Performance Details - {selectedCow?.name || 'Unnamed'}</DialogTitle>
          </DialogHeader>
          {selectedCow && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedCow.name || 'Unnamed'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Breed</Label>
                  <p className="text-sm text-muted-foreground">{selectedCow.breed || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Health Status</Label>
                  <div className="flex items-center gap-2">
                    {isEditingHealth ? (
                      <div className="flex items-center gap-2">
                        <Select value={newHealthStatus} onValueChange={setNewHealthStatus}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="healthy">Healthy</SelectItem>
                            <SelectItem value="sick">Sick</SelectItem>
                            <SelectItem value="recovering">Recovering</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleUpdateHealthStatus}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditingHealth(false)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className={getHealthStatusColor(selectedCow.health_status)}>
                          {selectedCow.health_status}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setIsEditingHealth(true)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Update
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Milking Amount</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCow.last_milking_amount ? `${selectedCow.last_milking_amount}L` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* 7-Day Performance Summary */}
              {milkingHistory.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">7-Day Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">
                        {calculateAverageProduction(milkingHistory).toFixed(1)}L
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Production</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">
                        {milkingHistory.reduce((sum, record) => sum + record.amount, 0).toFixed(1)}L
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Milking Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">
                        {milkingHistory.length}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Milking History */}
              <div>
                <Label className="text-lg font-semibold">Recent Milking History (Last 7 Days)</Label>
                {milkingHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">No milking records found for the past 7 days.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Time</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Period</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Amount (L)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-border">
                        {milkingHistory.map((record) => (
                          <tr key={record.id}>
                            <td className="px-4 py-2 text-sm">
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {record.milking_time || 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-sm capitalize">
                              {record.milking_period || 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium">
                              {record.amount.toFixed(1)}L
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CowPerformanceTab;