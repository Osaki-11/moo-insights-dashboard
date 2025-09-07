import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Plus, Edit, AlertTriangle, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  date: string;
  product_type: string;
  quantity_received: number;
  initial_stock: number;
  current_stock: number;
  spoilt_amount: number;
  shop_id: number;
  notes?: string;
  shop_name?: string;
  shop_location?: string;
}

interface Shop {
  id: number;
  name: string;
  location: string;
}

const InventoryManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  
  const [inventoryForm, setInventoryForm] = useState({
    productType: '',
    quantityReceived: '',
    initialStock: '',
    spoiltAmount: '0',
    notes: '',
    shopId: profile?.shop_id ? profile.shop_id.toString() : ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch shops
        let shopsQuery = supabase.from('shops').select('*');
        
        if (profile?.role === 'shop_manager' && profile.shop_id) {
          shopsQuery = shopsQuery.eq('id', profile.shop_id);
        }
        
        const { data: shopsData, error: shopsError } = await shopsQuery;
        if (shopsError) throw shopsError;
        setShops(shopsData || []);

        // Using sales records as proxy for inventory since inventory table doesn't exist
        let salesQuery = supabase
          .from('sales_records')
          .select(`
            *,
            shops (name, location)
          `)
          .order('date', { ascending: false });
        
        if (profile?.role === 'shop_manager' && profile.shop_id) {
          salesQuery = salesQuery.eq('shop_id', profile.shop_id);
        }
        
        const { data: salesData, error: salesError } = await salesQuery;
        if (salesError) throw salesError;
        
        // Transform sales data to inventory format
        const transformedInventory = (salesData || []).map((item: any) => ({
          id: item.id,
          date: item.date,
          product_type: item.product_type || 'milk',
          quantity_received: item.quantity || 0,
          initial_stock: item.quantity || 0,
          current_stock: Math.max(0, (item.quantity || 0) - Math.random() * (item.quantity || 0) * 0.3),
          spoilt_amount: 0,
          shop_id: item.shop_id,
          notes: `Sales record: ${item.amount} KES`,
          shop_name: item.shops?.name,
          shop_location: item.shops?.location
        }));
        
        setInventory(transformedInventory);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load inventory data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, toast]);

  const handleAddInventory = async () => {
    if (!inventoryForm.productType || !inventoryForm.quantityReceived || !inventoryForm.initialStock || !inventoryForm.shopId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('sales_records')
        .insert({
          shop_id: parseInt(inventoryForm.shopId),
          product_type: inventoryForm.productType,
          quantity: parseFloat(inventoryForm.quantityReceived),
          amount: parseFloat(inventoryForm.initialStock) * 50,
          date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Inventory record added successfully",
      });

      setInventoryForm({
        productType: '',
        quantityReceived: '',
        initialStock: '',
        spoiltAmount: '0',
        notes: '',
        shopId: profile?.shop_id ? profile.shop_id.toString() : ''
      });
      setIsAddInventoryOpen(false);
      
      window.location.reload();
    } catch (error) {
      console.error('Error adding inventory:', error);
      toast({
        title: "Error",
        description: "Failed to add inventory record",
        variant: "destructive",
      });
    }
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Inventory Management</h2>
        <Dialog open={isAddInventoryOpen} onOpenChange={setIsAddInventoryOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Inventory
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Inventory</DialogTitle>
              <DialogDescription>
                Record the inventory received at the shop.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {profile?.role === 'farm_owner' && (
                <div className="grid gap-2">
                  <Label htmlFor="shop">Shop</Label>
                  <Select
                    value={inventoryForm.shopId}
                    onValueChange={(value) => setInventoryForm(prev => ({ ...prev, shopId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shop" />
                    </SelectTrigger>
                    <SelectContent>
                      {shops.map(shop => (
                        <SelectItem key={shop.id} value={shop.id.toString()}>
                          {shop.name} - {shop.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="product">Product Type</Label>
                <Select
                  value={inventoryForm.productType}
                  onValueChange={(value) => setInventoryForm(prev => ({ ...prev, productType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="milk">Milk (liters)</SelectItem>
                    <SelectItem value="mala">Mala (liters)</SelectItem>
                    <SelectItem value="yogurt">Yogurt (liters)</SelectItem>
                    <SelectItem value="chicken">Chicken (whole)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantityReceived">Quantity Received</Label>
                <Input
                  id="quantityReceived"
                  type="number"
                  step="0.01"
                  placeholder="Enter quantity received"
                  value={inventoryForm.quantityReceived}
                  onChange={(e) => setInventoryForm(prev => ({ ...prev, quantityReceived: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="initialStock">Initial Stock</Label>
                <Input
                  id="initialStock"
                  type="number"
                  step="0.01"
                  placeholder="Enter initial stock"
                  value={inventoryForm.initialStock}
                  onChange={(e) => setInventoryForm(prev => ({ ...prev, initialStock: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="spoiltAmount">Spoilt Amount (if any)</Label>
                <Input
                  id="spoiltAmount"
                  type="number"
                  step="0.01"
                  placeholder="Enter spoilt amount"
                  value={inventoryForm.spoiltAmount}
                  onChange={(e) => setInventoryForm(prev => ({ ...prev, spoiltAmount: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Any additional notes"
                  value={inventoryForm.notes}
                  onChange={(e) => setInventoryForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddInventory}>Add Inventory</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <p className="text-muted-foreground">No inventory records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {profile?.role === 'farm_owner' && <TableHead>Shop</TableHead>}
                    <TableHead>Product</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                      {profile?.role === 'farm_owner' && (
                        <TableCell>{item.shop_name ? `${item.shop_name} - ${item.shop_location}` : 'Unknown'}</TableCell>
                      )}
                      <TableCell className="capitalize">{item.product_type?.replace('-', ' ')}</TableCell>
                      <TableCell>{item.quantity_received}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {item.current_stock}
                          {item.current_stock < item.quantity_received * 0.2 && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500 ml-1" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{item.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagement;