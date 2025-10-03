import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Calendar, Trash2, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DebtCreditTracker from './DebtCreditTracker';

interface ExpenseTrackerProps {
  user: any;
  onUpdate: () => void;
}

interface ExpenseRecord {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ user, onUpdate }) => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [dateRange, setDateRange] = useState('current_month');
  const [activeTab, setActiveTab] = useState('expenses');
  
  const expenseCategories = [
    'feed', 'medical', 'equipment', 'maintenance', 'labour', 'other'
  ];

  useEffect(() => {
    loadExpenses();
  }, [dateRange]);

  const loadExpenses = async () => {
    try {
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
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

      let filteredExpenses = expensesData || [];
      
      if (startDate) {
        filteredExpenses = filteredExpenses.filter(expense => 
          new Date(expense.date) >= new Date(startDate)
        );
      }

      setExpenses(filteredExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
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
      
      setFormData({
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      loadExpenses();
      onUpdate();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      loadExpenses();
      onUpdate();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const calculateTotal = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getCategoryBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    
    expenses.forEach(expense => {
      breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount;
    });
    
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  };

  if (loading) {
    return <div className="text-center py-8">Loading expense data...</div>;
  }

  const totalExpenses = calculateTotal();
  const categoryBreakdown = getCategoryBreakdown();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Financial Management</h1>
          <p className="mt-1 text-sm text-gray-600">Track expenses and manage debts & credits</p>
        </div>
        {activeTab === 'expenses' && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-400 hover:bg-green-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'expenses'
                  ? 'border-green-400 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="h-4 w-4 inline mr-2" />
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('debts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'debts'
                  ? 'border-green-400 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="h-4 w-4 inline mr-2" />
              Debts & Credits
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'debts' ? (
        <DebtCreditTracker user={user} onUpdate={onUpdate} />
      ) : (
        <>
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

      {/* Expense Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="liquid-glass p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-red-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-semibold text-red-600">Ksh {totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="liquid-glass p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses by Category</h3>
          <div className="space-y-3">
            {categoryBreakdown.map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{category}</span>
                <span className="text-sm font-medium text-red-600">Ksh {amount.toLocaleString()}</span>
              </div>
            ))}
            {categoryBreakdown.length === 0 && (
              <p className="text-sm text-gray-500">No expenses recorded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add Expense</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    required
                  >
                    <option value="">Select category</option>
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
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
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Expenses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {expense.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    Ksh {expense.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {expenses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No expenses recorded for the selected period
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default ExpenseTracker;