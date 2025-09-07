import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Milk, Egg, Wheat, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CowPerformanceTab from './farm-manager/CowPerformanceTab';

interface Cow {
  id: string;
  name: string;
  last_milking_amount: number;
  health_status: string;
}

interface FeedItem {
  id: string;
  feed_type: string;
  current_stock: number;
  reorder_level: number;
}

const FarmManagerDashboard = () => {
  const [todaysMilk, setTodaysMilk] = useState(0);
  const [todaysEggs, setTodaysEggs] = useState(0);
  const [cows, setCows] = useState<Cow[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Form states
  const [milkAmount, setMilkAmount] = useState('');
  const [selectedCow, setSelectedCow] = useState('');
  const [milkingPeriod, setMilkingPeriod] = useState('');
  const [eggCount, setEggCount] = useState('');
  const [slaughterCount, setSlaughterCount] = useState('');
  const [feedType, setFeedType] = useState('');
  const [feedAmount, setFeedAmount] = useState('');
  
  // Milk processing form states
  const [totalMilkUsed, setTotalMilkUsed] = useState('');
  const [malaAmount, setMalaAmount] = useState('');
  const [yoghurtAmount, setYoghurtAmount] = useState('');

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's milk
      const { data: milkData } = await supabase
        .from('milk_records')
        .select('amount')
        .eq('date', today);
      
      const totalMilk = milkData?.reduce((sum, record) => sum + parseFloat(record.amount?.toString() || '0'), 0) || 0;
      setTodaysMilk(totalMilk);

      // Fetch today's eggs
      const { data: eggData } = await supabase
        .from('egg_records')
        .select('count')
        .eq('date', today);
      
      const totalEggs = eggData?.reduce((sum, record) => sum + (record.count || 0), 0) || 0;
      setTodaysEggs(totalEggs);

      // Fetch cows
      const { data: cowsData } = await supabase
        .from('cows')
        .select('*');
      setCows(cowsData || []);

      // Fetch feed inventory
      const { data: feedData } = await supabase
        .from('feed_inventory')
        .select('*');
      setFeedItems(feedData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const recordMilk = async () => {
    try {
      const { error } = await supabase
        .from('milk_records')
        .insert({
          cow_id: selectedCow,
          amount: parseFloat(milkAmount),
          milking_time: new Date().toTimeString().split(' ')[0],
          milking_period: milkingPeriod
        });

      if (error) throw error;

      // Update cow's last milking amount
      await supabase
        .from('cows')
        .update({ last_milking_amount: parseFloat(milkAmount) })
        .eq('id', selectedCow);

      toast({ title: "Success", description: "Milk production recorded successfully" });
      setMilkAmount('');
      setSelectedCow('');
      setMilkingPeriod('');
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to record milk production", variant: "destructive" });
    }
  };

  const recordEggs = async () => {
    try {
      const { error } = await supabase
        .from('egg_records')
        .insert({
          count: parseInt(eggCount)
        });

      if (error) throw error;

      toast({ title: "Success", description: "Egg collection recorded successfully" });
      setEggCount('');
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to record egg collection", variant: "destructive" });
    }
  };

  const recordSlaughter = async () => {
    try {
      const { error } = await supabase
        .from('slaughter_records')
        .insert({
          count: parseInt(slaughterCount),
          animal_type: 'chicken'
        });

      if (error) throw error;

      toast({ title: "Success", description: "Slaughter record added successfully" });
      setSlaughterCount('');
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to record slaughter", variant: "destructive" });
    }
  };

  const updateFeedInventory = async () => {
    try {
      const selectedFeed = feedItems.find(item => item.id === feedType);
      if (!selectedFeed) return;

      const newStock = selectedFeed.current_stock + parseFloat(feedAmount);
      
      const { error } = await supabase
        .from('feed_inventory')
        .update({ current_stock: newStock })
        .eq('id', feedType);

      if (error) throw error;

      toast({ title: "Success", description: "Feed inventory updated successfully" });
      setFeedType('');
      setFeedAmount('');
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update feed inventory", variant: "destructive" });
    }
  };

  const recordMilkProcessing = async () => {
    try {
      const { error } = await supabase
        .from('milk_processing_records')
        .insert({
          total_milk_used: parseFloat(totalMilkUsed),
          mala_amount: parseFloat(malaAmount) || 0,
          yoghurt_amount: parseFloat(yoghurtAmount) || 0
        });

      if (error) throw error;

      toast({ title: "Success", description: "Milk processing recorded successfully" });
      setTotalMilkUsed('');
      setMalaAmount('');
      setYoghurtAmount('');
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to record milk processing", variant: "destructive" });
    }
  };

  const lowStockItems = feedItems.filter(item => item.current_stock <= item.reorder_level);
  const feedStatus = lowStockItems.length > 0 ? 'Low' : 'Good';
  const feedStatusColor = lowStockItems.length > 0 ? 'text-yellow-600' : 'text-green-600';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Milk</CardTitle>
            <Milk className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysMilk.toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground">
              From {cows.length} cows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eggs Collected</CardTitle>
            <Egg className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysEggs}</div>
            <p className="text-xs text-muted-foreground">
              Today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feed Stock</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${feedStatusColor}`}>{feedStatus}</div>
            <p className="text-xs text-muted-foreground">
              {lowStockItems.length} items need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activities">Daily Activities</TabsTrigger>
          <TabsTrigger value="cows">Cow Performance</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activities" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Recording</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      Record Milk Production
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Milk Production</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cow">Select Cow</Label>
                        <Select value={selectedCow} onValueChange={setSelectedCow}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a cow" />
                          </SelectTrigger>
                          <SelectContent>
                            {cows.map((cow) => (
                              <SelectItem key={cow.id} value={cow.id}>
                                {cow.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="amount">Milk Amount (L)</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={milkAmount}
                          onChange={(e) => setMilkAmount(e.target.value)}
                          placeholder="Enter amount in liters"
                        />
                      </div>
                      <div>
                        <Label htmlFor="milkingPeriod">Milking Period</Label>
                        <Select value={milkingPeriod} onValueChange={setMilkingPeriod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select milking time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="morning">Morning</SelectItem>
                            <SelectItem value="afternoon">Afternoon</SelectItem>
                            <SelectItem value="evening">Evening</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={recordMilk} className="w-full">
                        Record Milk
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Record Egg Collection
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Egg Collection</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="eggs">Number of Eggs</Label>
                        <Input
                          id="eggs"
                          type="number"
                          value={eggCount}
                          onChange={(e) => setEggCount(e.target.value)}
                          placeholder="Enter number of eggs"
                        />
                      </div>
                      <Button onClick={recordEggs} className="w-full">
                        Record Eggs
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Record Chicken Slaughter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Chicken Slaughter</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="slaughter">Number of Chickens</Label>
                        <Input
                          id="slaughter"
                          type="number"
                          value={slaughterCount}
                          onChange={(e) => setSlaughterCount(e.target.value)}
                          placeholder="Enter number of chickens"
                        />
                      </div>
                      <Button onClick={recordSlaughter} className="w-full">
                        Record Slaughter
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Update Feed Inventory
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Feed Inventory</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="feedType">Feed Type</Label>
                        <Select value={feedType} onValueChange={setFeedType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose feed type" />
                          </SelectTrigger>
                          <SelectContent>
                            {feedItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.feed_type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="feedAmount">Amount to Add (kg)</Label>
                        <Input
                          id="feedAmount"
                          type="number"
                          value={feedAmount}
                          onChange={(e) => setFeedAmount(e.target.value)}
                          placeholder="Enter amount in kg"
                        />
                      </div>
                      <Button onClick={updateFeedInventory} className="w-full">
                        Update Inventory
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Record Milk Processing
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Milk Processing</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="totalMilkUsed">Total Milk Used (L)</Label>
                        <Input
                          id="totalMilkUsed"
                          type="number"
                          value={totalMilkUsed}
                          onChange={(e) => setTotalMilkUsed(e.target.value)}
                          placeholder="Enter total milk used in liters"
                        />
                      </div>
                      <div>
                        <Label htmlFor="malaAmount">Mala Produced (L)</Label>
                        <Input
                          id="malaAmount"
                          type="number"
                          value={malaAmount}
                          onChange={(e) => setMalaAmount(e.target.value)}
                          placeholder="Enter mala amount in liters"
                        />
                      </div>
                      <div>
                        <Label htmlFor="yoghurtAmount">Yoghurt Produced (L)</Label>
                        <Input
                          id="yoghurtAmount"
                          type="number"
                          value={yoghurtAmount}
                          onChange={(e) => setYoghurtAmount(e.target.value)}
                          placeholder="Enter yoghurt amount in liters"
                        />
                      </div>
                      <Button onClick={recordMilkProcessing} className="w-full">
                        Record Processing
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cow Performance Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cows.length > 0 ? (
                    cows.map((cow) => (
                      <div key={cow.id} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{cow.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {cow.last_milking_amount ? `${cow.last_milking_amount}L` : 'No data'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No cows found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="cows" className="space-y-6">
          <CowPerformanceTab />
        </TabsContent>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Feed Inventory Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feedItems.length > 0 ? (
                    feedItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.feed_type}</span>
                        <span className={`text-sm ${item.current_stock <= item.reorder_level ? 'text-red-600' : 'text-green-600'}`}>
                          {item.current_stock}kg
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No feed inventory data</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Cows</span>
                    <span className="text-sm text-muted-foreground">{cows.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Healthy Cows</span>
                    <span className="text-sm text-green-600">
                      {cows.filter(cow => cow.health_status === 'healthy').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Need Attention</span>
                    <span className="text-sm text-yellow-600">
                      {cows.filter(cow => cow.health_status !== 'healthy').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FarmManagerDashboard;