import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, Package, TrendingUp, Plus, Calendar, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SalesRecord {
  id: string;
  date: string;
  amount: number;
  quantity: number;
  productType: string;
}

interface Shop {
  id: number;
  name: string;
  location: string;
}

const ShopManagerDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [shop, setShop] = useState<Shop | null>(null);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false);
  const [saleForm, setSaleForm] = useState({
    productType: '',
    quantity: '',
    amount: ''
  });

  const [prices, setPrices] = useState<Record<string, number>>({});
  const [priceForm, setPriceForm] = useState({ productType: '', price: '' });

  const loadPrices = async (shopId: number) => {
    const { data, error } = await supabase
      .from('product_prices')
      .select('product_type, price')
      .eq('shop_id', shopId);
    if (!error) {
      const map: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        map[row.product_type] = parseFloat(row.price?.toString() || '0');
      });
      setPrices(map);
    }
  };

  useEffect(() => {
    const fetchShopData = async () => {
      if (!profile?.shop_id) return;

      try {
        // Fetch shop details
        const { data: shopData, error: shopError } = await supabase
          .from('shops')
          .select('*')
          .eq('id', profile.shop_id)
          .single();
        
        if (shopError) throw shopError;
        setShop(shopData);

        // Fetch sales records for this shop
        const { data: salesData, error: salesError } = await supabase
          .from('sales_records')
          .select('*')
          .eq('shop_id', profile.shop_id)
          .order('date', { ascending: false });
        
        if (salesError) throw salesError;
        setSalesRecords(salesData?.map(record => ({
          id: record.id,
          date: record.date,
          amount: parseFloat(record.amount?.toString() || '0'),
          quantity: parseFloat(record.quantity?.toString() || '0'),
          productType: record.product_type || 'Unknown'
        })) || []);

        // Load product prices
        await loadPrices(profile.shop_id);

      } catch (error) {
        console.error('Error fetching shop data:', error);
        toast({
          title: "Error",
          description: "Failed to load shop data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [profile, toast]);

  const handleRecordSale = async () => {
    if (!saleForm.productType || !saleForm.quantity || !saleForm.amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('sales_records')
        .insert({
          shop_id: profile?.shop_id,
          product_type: saleForm.productType,
          quantity: parseFloat(saleForm.quantity),
          amount: parseFloat(saleForm.amount),
          date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sale recorded successfully",
      });

      // Refresh sales data
      const { data: salesData } = await supabase
        .from('sales_records')
        .select('*')
        .eq('shop_id', profile?.shop_id)
        .order('date', { ascending: false });

      setSalesRecords(salesData?.map(record => ({
        id: record.id,
        date: record.date,
        amount: parseFloat(record.amount?.toString() || '0'),
        quantity: parseFloat(record.quantity?.toString() || '0'),
        productType: record.product_type || 'Unknown'
      })) || []);

      setSaleForm({ productType: '', quantity: '', amount: '' });
      setIsRecordSaleOpen(false);
    } catch (error) {
      console.error('Error recording sale:', error);
      toast({
        title: "Error",
        description: "Failed to record sale",
        variant: "destructive",
      });
    }
  };

  const calculateProductAmount = (productType: string, quantity: string) => {
    const price = prices[productType];
    if (price && quantity) {
      return (price * parseFloat(quantity)).toString();
    }
    return '';
  };

  // Calculate statistics
  const today = new Date().toISOString().split('T')[0];
  const todaySales = salesRecords
    .filter(record => record.date === today)
    .reduce((total, record) => total + record.amount, 0);

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlySales = salesRecords
    .filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear;
    })
    .reduce((total, record) => total + record.amount, 0);

  const monthlyTarget = 64000;
  const targetProgress = (monthlySales / monthlyTarget) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {shop && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">{shop.name}</h2>
          <p className="text-muted-foreground">{shop.location}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {salesRecords.filter(r => r.date === today).length} transactions today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {monthlySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              This month's total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Target</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targetProgress.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              KES {monthlySales.toFixed(0)} / {monthlyTarget.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={isRecordSaleOpen} onOpenChange={setIsRecordSaleOpen}>
              <DialogTrigger asChild>
                <Button className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Sales
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Sale</DialogTitle>
                  <DialogDescription>
                    Enter the details of the sale you want to record.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="product">Product Type</Label>
                    <Select
                      value={saleForm.productType}
                      onValueChange={(value) => {
                        setSaleForm(prev => ({ 
                          ...prev, 
                          productType: value,
                          amount: calculateProductAmount(value, prev.quantity)
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="milk">Milk (per liter)</SelectItem>
                        <SelectItem value="mala">Mala (per liter)</SelectItem>
                        <SelectItem value="yogurt">Yogurt (per liter)</SelectItem>
                        <SelectItem value="eggs">Eggs (per tray)</SelectItem>
                        <SelectItem value="chicken">Chicken (whole)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Enter quantity"
                      value={saleForm.quantity}
                      onChange={(e) => {
                        const quantity = e.target.value;
                        setSaleForm(prev => ({ 
                          ...prev, 
                          quantity,
                          amount: calculateProductAmount(prev.productType, quantity)
                        }));
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Total Amount (KES)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={saleForm.amount}
                      onChange={(e) => setSaleForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleRecordSale}>Record Sale</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button className="w-full justify-start" variant="outline" disabled>
              <Package className="mr-2 h-4 w-4" />
              Check Stock Levels (Coming Soon)
            </Button>
            
            <Button className="w-full justify-start" variant="outline" disabled>
              <Calendar className="mr-2 h-4 w-4" />
              View Sales History (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Prices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.keys(prices).length === 0 ? (
                <p className="text-sm text-muted-foreground">No prices set yet.</p>
              ) : (
                Object.entries(prices).map(([product, price]) => (
                  <div className="flex justify-between items-center" key={product}>
                    <span className="text-sm font-medium capitalize">{product}</span>
                    <span className="text-sm text-muted-foreground">KES {price}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Select
                value={priceForm.productType}
                onValueChange={(v) => setPriceForm(prev => ({ ...prev, productType: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="milk">Milk</SelectItem>
                  <SelectItem value="mala">Mala</SelectItem>
                  <SelectItem value="yogurt">Yogurt</SelectItem>
                  <SelectItem value="eggs">Eggs</SelectItem>
                  <SelectItem value="chicken">Chicken</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Price (KES)"
                value={priceForm.price}
                onChange={(e) => setPriceForm(prev => ({ ...prev, price: e.target.value }))}
              />
              <Button onClick={async () => {
                if (!priceForm.productType || !priceForm.price || !profile?.shop_id) return;
                const { error } = await supabase.from('product_prices').upsert({
                  shop_id: profile.shop_id,
                  product_type: priceForm.productType,
                  price: parseFloat(priceForm.price)
                });
                if (error) {
                  toast({ title: 'Error', description: 'Failed to save price', variant: 'destructive' });
                  return;
                }
                toast({ title: 'Saved', description: 'Price updated' });
                setPriceForm({ productType: '', price: '' });
                await loadPrices(profile.shop_id);
              }}>Save Price</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {salesRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {salesRecords.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="text-sm font-medium capitalize">{sale.productType}</p>
                    <p className="text-xs text-muted-foreground">{sale.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">KES {sale.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{sale.quantity} units</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShopManagerDashboard;