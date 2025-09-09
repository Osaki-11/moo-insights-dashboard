import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  Target,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SalesRecord {
  date: Date | string;
  amount: number;
  shopId: string;
  productType: string;
  quantity: number;
  paymentStatus?: string;
  dueDate?: Date | string;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  date: Date | string;
}

interface FinancialDashboardProps {
  salesRecords: SalesRecord[];
}

const FinancialDashboard = ({ salesRecords }: FinancialDashboardProps) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('farm_expenses')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      if (error) throw error;
      
      setExpenses(data?.map(expense => ({
        id: expense.id,
        category: expense.category,
        amount: parseFloat(expense.amount?.toString() || '0'),
        description: expense.description,
        date: new Date(expense.date)
      })) || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async () => {
    if (!expenseForm.category || !expenseForm.amount) return;
    
    try {
      const { error } = await supabase
        .from('farm_expenses')
        .insert({
          category: expenseForm.category,
          amount: parseFloat(expenseForm.amount),
          description: expenseForm.description || null
        });
      
      if (error) throw error;
      
      toast({
        title: "Expense Added",
        description: "Farm expense recorded successfully.",
      });
      
      setExpenseForm({ category: '', amount: '', description: '' });
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense.",
        variant: "destructive"
      });
    }
  };

  // Calculate financial metrics
  const today = new Date();
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const weeklyRevenue = salesRecords
    .filter(record => new Date(record.date) >= thisWeek)
    .reduce((total, record) => total + record.amount, 0);

  const monthlyRevenue = salesRecords
    .filter(record => new Date(record.date) >= thisMonth)
    .reduce((total, record) => total + record.amount, 0);

  const weeklyExpenses = expenses
    .filter(expense => new Date(expense.date) >= thisWeek)
    .reduce((total, expense) => total + expense.amount, 0);

  const monthlyExpenses = expenses
    .filter(expense => new Date(expense.date) >= thisMonth)
    .reduce((total, expense) => total + expense.amount, 0);

  const weeklyProfit = weeklyRevenue - weeklyExpenses;
  const monthlyProfit = monthlyRevenue - monthlyExpenses;
  const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

  // Overdue payments
  const overduePayments = salesRecords.filter(record => {
    if (!record.dueDate || record.paymentStatus === 'paid') return false;
    return new Date(record.dueDate) < today && record.paymentStatus === 'pending';
  });

  const overdueAmount = overduePayments.reduce((total, record) => total + record.amount, 0);

  // Product profitability analysis
  const productProfitability = salesRecords.reduce((acc, record) => {
    if (!acc[record.productType]) {
      acc[record.productType] = { revenue: 0, quantity: 0 };
    }
    acc[record.productType].revenue += record.amount;
    acc[record.productType].quantity += record.quantity;
    return acc;
  }, {} as Record<string, {revenue: number, quantity: number}>);

  // Expense breakdown for pie chart
  const expenseBreakdown = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const expenseChartData = Object.entries(expenseBreakdown).map(([category, amount]) => ({
    name: category,
    value: amount,
    percentage: ((amount / monthlyExpenses) * 100).toFixed(1)
  }));

  // Revenue trend for chart
  const revenueTrend = Array.from({length: 7}, (_, i) => {
    const date = new Date(today.getTime() - (6-i) * 24 * 60 * 60 * 1000);
    const dayRevenue = salesRecords
      .filter(record => new Date(record.date).toDateString() === date.toDateString())
      .reduce((total, record) => total + record.amount, 0);
    const dayExpenses = expenses
      .filter(expense => new Date(expense.date).toDateString() === date.toDateString())
      .reduce((total, expense) => total + expense.amount, 0);
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: dayRevenue,
      expenses: dayExpenses,
      profit: dayRevenue - dayExpenses
    };
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Critical alerts
  const alerts = [
    ...(overduePayments.length > 0 ? [{
      type: 'payment',
      message: `${overduePayments.length} overdue payments (KES ${overdueAmount.toFixed(2)})`,
      severity: 'high'
    }] : []),
    ...(profitMargin < 20 ? [{
      type: 'profit',
      message: `Low profit margin: ${profitMargin.toFixed(1)}% (Target: >20%)`,
      severity: 'medium'
    }] : []),
    ...(weeklyExpenses > weeklyRevenue ? [{
      type: 'loss',
      message: 'Weekly expenses exceed revenue',
      severity: 'high'
    }] : [])
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Critical Business Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <span className="text-sm">{alert.message}</span>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Profit</CardTitle>
            {weeklyProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${weeklyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              KES {weeklyProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue: KES {weeklyRevenue.toFixed(2)} | Costs: KES {weeklyExpenses.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              KES {monthlyProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Margin: {profitMargin.toFixed(1)}% {profitMargin >= 20 ? '✅' : '⚠️'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              KES {overdueAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overduePayments.length} payment{overduePayments.length !== 1 ? 's' : ''} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {monthlyRevenue.toFixed(2)}</div>
            <div className="mt-2">
              <Progress value={(monthlyRevenue / 50000) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Target: KES 50,000 ({((monthlyRevenue / 50000) * 100).toFixed(1)}%)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Expenses Trend */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Financial Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`KES ${value}`, '']} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stackId="2"
                  stroke="#ff4444" 
                  fill="#ff4444" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Profitability */}
        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(productProfitability)
                .sort(([,a], [,b]) => b.revenue - a.revenue)
                .map(([product, data]) => {
                  const avgPrice = data.quantity > 0 ? data.revenue / data.quantity : 0;
                  return (
                    <div key={product} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{product}</span>
                          <span className="text-sm font-bold">KES {data.revenue.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {data.quantity} units • Avg: KES {avgPrice.toFixed(2)}/unit
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expense Breakdown</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Farm Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={expenseForm.category} onValueChange={(value) => 
                      setExpenseForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feed">Feed</SelectItem>
                        <SelectItem value="labor">Labor</SelectItem>
                        <SelectItem value="veterinary">Veterinary</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description..."
                    />
                  </div>
                  <Button onClick={addExpense} className="w-full">
                    Add Expense
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {expenseChartData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`KES ${value}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No expenses recorded this month
              </div>
            )}
            
            {expenseChartData.length > 0 && (
              <div className="mt-4 space-y-2">
                {expenseChartData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="capitalize">{entry.name}</span>
                    </div>
                    <span>KES {entry.value.toFixed(2)} ({entry.percentage}%)</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actionable Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Business Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyProfit < 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>URGENT:</strong> Your weekly expenses (KES {weeklyExpenses.toFixed(2)}) exceed revenue. 
                  Review costs immediately and optimize operations.
                </p>
              </div>
            )}
            
            {overduePayments.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>ACTION REQUIRED:</strong> Follow up on {overduePayments.length} overdue payment{overduePayments.length !== 1 ? 's' : ''} 
                  totaling KES {overdueAmount.toFixed(2)}.
                </p>
              </div>
            )}
            
            {profitMargin < 20 && profitMargin > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>OPTIMIZE:</strong> Your profit margin ({profitMargin.toFixed(1)}%) is below target (20%). 
                  Consider increasing prices or reducing costs.
                </p>
              </div>
            )}

            {Object.entries(productProfitability).length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>BEST PERFORMER:</strong> {
                    Object.entries(productProfitability)
                      .sort(([,a], [,b]) => (b.revenue/b.quantity) - (a.revenue/a.quantity))[0][0]
                  } has the highest profit per unit. Consider focusing more on this product.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;