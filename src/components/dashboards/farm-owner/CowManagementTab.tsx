import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, Plus, Eye, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Cow {
  id: string;
  name?: string;
  breed?: string;
  healthStatus?: string;
  lastMilkingAmount?: number;
}

interface CowManagementTabProps {
  cows: Cow[];
  onCowAdded: () => void;
}

const CowManagementTab = ({ cows, onCowAdded }: CowManagementTabProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isHealthDialogOpen, setIsHealthDialogOpen] = useState(false);
  const [selectedCow, setSelectedCow] = useState<Cow | null>(null);
  const [cowDetails, setCowDetails] = useState<any>(null);
  const [milkingHistory, setMilkingHistory] = useState<any[]>([]);
  const [newHealthStatus, setNewHealthStatus] = useState('');
  const [newCow, setNewCow] = useState({
    name: '',
    breed: '',
    health_status: 'healthy',
    birth_date: ''
  });
  const { toast } = useToast();

  const handleAddCow = async () => {
    try {
      const { error } = await supabase
        .from('cows')
        .insert([{
          name: newCow.name,
          breed: newCow.breed,
          health_status: newCow.health_status,
          birth_date: newCow.birth_date || null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cow added successfully!"
      });

      setNewCow({ name: '', breed: '', health_status: 'healthy', birth_date: '' });
      setIsAddDialogOpen(false);
      onCowAdded();
    } catch (error) {
      console.error('Error adding cow:', error);
      toast({
        title: "Error",
        description: "Failed to add cow. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = async (cow: Cow) => {
    setSelectedCow(cow);
    setIsDetailsDialogOpen(true);
    
    try {
      // Fetch full cow details
      const { data: cowData, error: cowError } = await supabase
        .from('cows')
        .select('*')
        .eq('id', cow.id)
        .single();

      if (cowError) throw cowError;
      setCowDetails(cowData);

      // Fetch milking history for past 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const { data: milkingData, error: milkingError } = await supabase
        .from('milk_records')
        .select('*')
        .eq('cow_id', cow.id)
        .gte('date', threeDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (milkingError) throw milkingError;
      setMilkingHistory(milkingData || []);
    } catch (error) {
      console.error('Error fetching cow details:', error);
      toast({
        title: "Error",
        description: "Failed to load cow details.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateHealth = (cow: Cow) => {
    setSelectedCow(cow);
    setNewHealthStatus(cow.healthStatus || 'healthy');
    setIsHealthDialogOpen(true);
  };

  const saveHealthUpdate = async () => {
    if (!selectedCow) return;

    try {
      const { error } = await supabase
        .from('cows')
        .update({ health_status: newHealthStatus })
        .eq('id', selectedCow.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Health status updated successfully!"
      });

      setIsHealthDialogOpen(false);
      onCowAdded(); // Refresh the data
    } catch (error) {
      console.error('Error updating health status:', error);
      toast({
        title: "Error",
        description: "Failed to update health status.",
        variant: "destructive"
      });
    }
  };
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
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Cow
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Cow</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cow-name">Name</Label>
                      <Input
                        id="cow-name"
                        value={newCow.name}
                        onChange={(e) => setNewCow({ ...newCow, name: e.target.value })}
                        placeholder="Enter cow name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cow-breed">Breed</Label>
                      <Input
                        id="cow-breed"
                        value={newCow.breed}
                        onChange={(e) => setNewCow({ ...newCow, breed: e.target.value })}
                        placeholder="Enter cow breed"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cow-health">Health Status</Label>
                      <Select value={newCow.health_status} onValueChange={(value) => setNewCow({ ...newCow, health_status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="healthy">Healthy</SelectItem>
                          <SelectItem value="sick">Sick</SelectItem>
                          <SelectItem value="recovering">Recovering</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cow-birth-date">Birth Date (Optional)</Label>
                      <Input
                        id="cow-birth-date"
                        type="date"
                        value={newCow.birth_date}
                        onChange={(e) => setNewCow({ ...newCow, birth_date: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddCow} className="w-full">
                      Add Cow
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewDetails(cow)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateHealth(cow)}
                            >
                              <Heart className="w-3 h-3 mr-1" />
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
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Cow
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Cow</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cow-name">Name</Label>
                        <Input
                          id="cow-name"
                          value={newCow.name}
                          onChange={(e) => setNewCow({ ...newCow, name: e.target.value })}
                          placeholder="Enter cow name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cow-breed">Breed</Label>
                        <Input
                          id="cow-breed"
                          value={newCow.breed}
                          onChange={(e) => setNewCow({ ...newCow, breed: e.target.value })}
                          placeholder="Enter cow breed"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cow-health">Health Status</Label>
                        <Select value={newCow.health_status} onValueChange={(value) => setNewCow({ ...newCow, health_status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="healthy">Healthy</SelectItem>
                            <SelectItem value="sick">Sick</SelectItem>
                            <SelectItem value="recovering">Recovering</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="cow-birth-date">Birth Date (Optional)</Label>
                        <Input
                          id="cow-birth-date"
                          type="date"
                          value={newCow.birth_date}
                          onChange={(e) => setNewCow({ ...newCow, birth_date: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleAddCow} className="w-full">
                        Add Cow
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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

      {/* View Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cow Details - {selectedCow?.name || 'Unnamed'}</DialogTitle>
          </DialogHeader>
          {cowDetails && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{cowDetails.name || 'Unnamed'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Breed</Label>
                  <p className="text-sm text-muted-foreground">{cowDetails.breed || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Health Status</Label>
                  <Badge variant={cowDetails.health_status === 'healthy' ? 'default' : 'destructive'}>
                    {cowDetails.health_status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Birth Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {cowDetails.birth_date ? new Date(cowDetails.birth_date).toLocaleDateString() : 'Not recorded'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Milking Amount</Label>
                  <p className="text-sm text-muted-foreground">
                    {cowDetails.last_milking_amount ? `${cowDetails.last_milking_amount}L` : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Age</Label>
                  <p className="text-sm text-muted-foreground">
                    {cowDetails.birth_date 
                      ? `${Math.floor((new Date().getTime() - new Date(cowDetails.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} years`
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>

              {/* Milking History for Past 3 Days */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Milking History (Past 3 Days)</h3>
                {milkingHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount (L)</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Quality Grade</TableHead>
                        <TableHead>Period</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {milkingHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>{record.amount}L</TableCell>
                          <TableCell>{record.milking_time || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.quality_grade || 'Not graded'}</Badge>
                          </TableCell>
                          <TableCell>{record.milking_period || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No milking records found for the past 3 days.</p>
                )}

                {/* Summary Stats */}
                {milkingHistory.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">
                          {milkingHistory.reduce((sum, record) => sum + Number(record.amount), 0).toFixed(1)}L
                        </div>
                        <p className="text-xs text-muted-foreground">Total (3 days)</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">
                          {(milkingHistory.reduce((sum, record) => sum + Number(record.amount), 0) / 3).toFixed(1)}L
                        </div>
                        <p className="text-xs text-muted-foreground">Daily Average</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{milkingHistory.length}</div>
                        <p className="text-xs text-muted-foreground">Sessions</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Health Dialog */}
      <Dialog open={isHealthDialogOpen} onOpenChange={setIsHealthDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Health Status - {selectedCow?.name || 'Unnamed'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="health-status">Health Status</Label>
              <Select value={newHealthStatus} onValueChange={setNewHealthStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="recovering">Recovering</SelectItem>
                  <SelectItem value="pregnant">Pregnant</SelectItem>
                  <SelectItem value="calving">Calving</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveHealthUpdate} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsHealthDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CowManagementTab;