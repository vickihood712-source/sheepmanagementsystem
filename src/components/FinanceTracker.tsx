import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Calendar, Download, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface FinanceTrackerProps {
  user: any;
  onUpdate: () => void;
}

interface FinancialRecord {
  id: string;
  type: 'revenue' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

const FinanceTracker: React.FC<FinanceTrackerProps> = ({ user, onUpdate }) => {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debtCreditData, setDebtCreditData] = useState<any>({
    summary: { totalDebt: 0, totalCredit: 0, netPosition: 0 },
    statusBreakdown: [],
    monthlyTrends: []
  });
  const [formData, setFormData] = useState({
    type: 'expense' as 'revenue' | 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [dateRange, setDateRange] = useState('current_month');
  
  const expenseCategories = [
    'feed', 'medical', 'equipment', 'maintenance', 'labour', 'other'
  ];
  
  const revenueCategories = [
    'livestock sales'
  ];

  useEffect(() => {
    loadFinancialRecords();
  }, [dateRange]);

  const loadFinancialRecords = async () => {
    try {
      // Load from sales_records and expenses tables
      const { data: salesData } = await supabase
        .from('sales_records')
        .select('id, amount, date, buyer_seller, created_at')
        .order('date', { ascending: false });
      
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('id, amount, date, description, category, created_at')
        .order('date', { ascending: false });

      // Apply date filter
      const now = new Date();
      let startDate = '';
      
      switch (dateRange) {
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          break;
        case 'current_year':
          startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
          break;
      }

      // Transform and combine data
      const salesRecords = (salesData || []).map(record => ({
        ...record,
        description: record.buyer_seller,
        type: 'revenue' as const,
        category: 'sale'
      }));
      
      const expenseRecords = (expensesData || []).map(record => ({
        ...record,
        type: 'expense' as const
      }));
      
      let allRecords = [...salesRecords, ...expenseRecords];
      
      // Apply date filter
      if (startDate) {
        allRecords = allRecords.filter(record => 
          new Date(record.date) >= new Date(startDate)
        );
      }

      setRecords(allRecords);
      
      // Load debt/credit data for visualization
      await loadDebtCreditData();
    } catch (error) {
      console.error('Error loading financial records:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDebtCreditData = async () => {
    try {
      const { data: debtCreditRecords } = await supabase
        .from('debts_credits')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (debtCreditRecords) {
        const currentDebts = debtCreditRecords.filter(dc => dc.type === 'debt' && dc.status !== 'paid');
        const currentCredits = debtCreditRecords.filter(dc => dc.type === 'credit' && dc.status !== 'paid');
        
        const totalDebt = currentDebts.reduce((sum, d) => sum + (d.amount - d.paid_amount), 0);
        const totalCredit = currentCredits.reduce((sum, c) => sum + (c.amount - c.paid_amount), 0);
        
        const statusBreakdown = [
          { name: 'Outstanding Debts', value: totalDebt, color: '#EF4444' },
          { name: 'Outstanding Credits', value: totalCredit, color: '#10B981' }
        ].filter(item => item.value > 0);
        
        // Monthly trends for last 6 months
        const monthlyTrends = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = date.toISOString().slice(0, 7);
          const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          
          const monthDebts = debtCreditRecords
            .filter(dc => dc.type === 'debt' && dc.created_at.startsWith(monthKey))
            .reduce((sum, dc) => sum + dc.amount, 0);
          
          const monthCredits = debtCreditRecords
            .filter(dc => dc.type === 'credit' && dc.created_at.startsWith(monthKey))
            .reduce((sum, dc) => sum + dc.amount, 0);
          
          monthlyTrends.push({
            month: monthName,
            debts: monthDebts,
            credits: monthCredits
          });
        }
        
        setDebtCreditData({
          summary: {
            totalDebt,
            totalCredit,
            netPosition: totalCredit - totalDebt
          },
          statusBreakdown,
          monthlyTrends
        });
      }
    } catch (error) {
      console.error('Error loading debt/credit data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (formData.type === 'expense') {
        const { error } = await supabase
          .from('expenses')
          .insert([{
            category: formData.category,
            amount: parseFloat(formData.amount),
            description: formData.description,
            date: formData.date,
            created_by: user.id
          }]);
        
        if (error) throw error;
      } else {
        // For revenue, we'll add to sales_records
        const { error } = await supabase
          .from('sales_records')
          .insert([{
            sheep_id: null, // We'll need to handle this properly later
            transaction_type: 'sale',
            amount: parseFloat(formData.amount),
            buyer_seller: formData.description || 'Revenue',
            date: formData.date,
            created_by: user.id
          }]);
        
        if (error) throw error;
      }
      
      setFormData({
        type: 'expense',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      loadFinancialRecords();
      onUpdate();
      loadDebtCreditData();
    } catch (error) {
      console.error('Error adding financial record:', error);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      // Try to delete from both tables since we don't know which one it came from
      await supabase.from('expenses').delete().eq('id', id);
      await supabase.from('sales_records').delete().eq('id', id);
      
      loadFinancialRecords();
      onUpdate();
      loadDebtCreditData();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const calculateTotals = () => {
    const revenue = records.filter(r => r.type === 'revenue').reduce((sum, r) => sum + r.amount, 0);
    const expenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const profit = revenue - expenses;
    
    return { revenue, expenses, profit };
  };

  const getCategoryBreakdown = (type: 'revenue' | 'expense') => {
    const categoryRecords = records.filter(r => r.type === type);
    const breakdown: { [key: string]: number } = {};
    
    categoryRecords.forEach(record => {
      breakdown[record.category] = (breakdown[record.category] || 0) + record.amount;
    });
    
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  };

  if (loading) {
    return <div className="text-center py-8">Loading financial data...</div>;
  }

  const { revenue, expenses, profit } = calculateTotals();
  const revenueBreakdown = getCategoryBreakdown('revenue');
  const expenseBreakdown = getCategoryBreakdown('expense');

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Finance Tracker</h1>
          <p className="mt-1 text-sm text-gray-600">Track expenses, revenue, and profitability</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-400 hover:bg-green-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6">
        <select
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="current_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="current_year">This Year</option>
          <option value="all_time">All Time</option>
        </select>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="liquid-glass p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-green-600">Ksh {revenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="liquid-glass p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-semibold text-red-600">Ksh {expenses.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="liquid-glass p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className={`h-8 w-8 ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Ksh {profit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Category</h3>
          <div className="space-y-3">
            {revenueBreakdown.map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{category}</span>
                <span className="text-sm font-medium text-green-600">Ksh {amount.toLocaleString()}</span>
              </div>
            ))}
            {revenueBreakdown.length === 0 && (
              <p className="text-sm text-gray-500">No revenue recorded yet</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses by Category</h3>
          <div className="space-y-3">
            {expenseBreakdown.map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{category}</span>
                <span className="text-sm font-medium text-red-600">Ksh {amount.toLocaleString()}</span>
              </div>
            ))}
            {expenseBreakdown.length === 0 && (
              <p className="text-sm text-gray-500">No expenses recorded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Debt & Credit Visualization */}
      {(debtCreditData.summary.totalDebt > 0 || debtCreditData.summary.totalCredit > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Debt/Credit Status Pie Chart */}
          <div className="liquid-glass p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Outstanding Debt & Credit</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={debtCreditData.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {debtCreditData.statusBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`Ksh ${value.toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Debt/Credit Trends */}
          <div className="liquid-glass p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Debt & Credit Activity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={debtCreditData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={(value) => `Ksh ${(value / 1000).toFixed(0)}K`} />
                <Tooltip 
                  formatter={(value: number) => [`Ksh ${value.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="debts" fill="#EF4444" name="New Debts" radius={[2, 2, 0, 0]} />
                <Bar dataKey="credits" fill="#10B981" name="New Credits" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Net Position Summary */}
      {(debtCreditData.summary.totalDebt > 0 || debtCreditData.summary.totalCredit > 0) && (
        <div className="liquid-glass p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Debt & Credit Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">Ksh {debtCreditData.summary.totalDebt.toLocaleString()}</p>
              <p className="text-sm text-red-700">Outstanding Debts</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">Ksh {debtCreditData.summary.totalCredit.toLocaleString()}</p>
              <p className="text-sm text-green-700">Outstanding Credits</p>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              debtCreditData.summary.netPosition >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <DollarSign className={`h-8 w-8 mx-auto mb-2 ${
                debtCreditData.summary.netPosition >= 0 ? 'text-green-500' : 'text-red-500'
              }`} />
              <p className={`text-2xl font-bold ${
                debtCreditData.summary.netPosition >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                Ksh {debtCreditData.summary.netPosition.toLocaleString()}
              </p>
              <p className={`text-sm ${
                debtCreditData.summary.netPosition >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                Net Position
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Form */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add Financial Record</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'revenue' | 'expense',
                      category: '' 
                    }))}
                  >
                    <option value="expense">Expense</option>
                    <option value="revenue">Revenue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    required
                  >
                    <option value="">Select category</option>
                    {(formData.type === 'expense' ? expenseCategories : revenueCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (Ksh)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-400 text-white rounded-md hover:bg-green-500"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.type === 'revenue' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {record.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={record.type === 'revenue' ? 'text-green-600' : 'text-red-600'}>
                      {record.type === 'revenue' ? '+' : '-'}Ksh {record.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {(user.role === 'admin' || user.role === 'farmer') && (
                      <button
                        onClick={() => deleteRecord(record.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No financial records found for the selected period
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceTracker;