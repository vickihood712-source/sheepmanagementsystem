import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Calendar, CheckCircle, Clock, AlertCircle, Trash2, CreditCard as Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DebtCreditTrackerProps {
  user: any;
  onUpdate?: () => void;
}

interface DebtCreditRecord {
  id: string;
  type: 'debt' | 'credit';
  amount: number;
  description: string;
  counterparty: string;
  due_date: string | null;
  status: 'pending' | 'partial' | 'paid';
  paid_amount: number;
  created_at: string;
  updated_at: string;
}

const DebtCreditTracker: React.FC<DebtCreditTrackerProps> = ({ user, onUpdate }) => {
  const [records, setRecords] = useState<DebtCreditRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DebtCreditRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'debt' as 'debt' | 'credit',
    amount: '',
    description: '',
    counterparty: '',
    due_date: '',
    status: 'pending' as 'pending' | 'partial' | 'paid',
    paid_amount: '0'
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('debts_credits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading debt/credit records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const recordData = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        counterparty: formData.counterparty,
        due_date: formData.due_date || null,
        status: formData.status,
        paid_amount: parseFloat(formData.paid_amount) || 0,
        created_by: user.id
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('debts_credits')
          .update(recordData)
          .eq('id', editingRecord.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('debts_credits')
          .insert([recordData]);
        
        if (error) throw error;
      }
      
      resetForm();
      loadRecords();
      onUpdate?.();
    } catch (error) {
      console.error('Error saving record:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'debt',
      amount: '',
      description: '',
      counterparty: '',
      due_date: '',
      status: 'pending',
      paid_amount: '0'
    });
    setShowForm(false);
    setEditingRecord(null);
  };

  const editRecord = (record: DebtCreditRecord) => {
    setEditingRecord(record);
    setFormData({
      type: record.type,
      amount: record.amount.toString(),
      description: record.description,
      counterparty: record.counterparty,
      due_date: record.due_date || '',
      status: record.status,
      paid_amount: record.paid_amount.toString()
    });
    setShowForm(true);
  };

  const deleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const { error } = await supabase
        .from('debts_credits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      loadRecords();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const calculateTotals = () => {
    const debts = records.filter(r => r.type === 'debt');
    const credits = records.filter(r => r.type === 'credit');
    
    const totalDebt = debts.reduce((sum, r) => sum + (r.amount - r.paid_amount), 0);
    const totalCredit = credits.reduce((sum, r) => sum + (r.amount - r.paid_amount), 0);
    const netPosition = totalCredit - totalDebt;
    
    return { totalDebt, totalCredit, netPosition };
  };

  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true;
    if (filter === 'debts') return record.type === 'debt';
    if (filter === 'credits') return record.type === 'credit';
    if (filter === 'pending') return record.status === 'pending';
    if (filter === 'overdue') {
      return record.status !== 'paid' && record.due_date && new Date(record.due_date) < new Date();
    }
    return true;
  });

  if (loading) {
    return <div className="text-center py-8">Loading debt/credit records...</div>;
  }

  const { totalDebt, totalCredit, netPosition } = calculateTotals();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Debt & Credit Tracker</h1>
          <p className="mt-1 text-sm text-gray-600">Track money owed and money you're owed</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-400 hover:bg-green-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Record
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="liquid-glass p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Debt (You Owe)</p>
              <p className="text-2xl font-semibold text-red-600">Ksh {totalDebt.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="liquid-glass p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Credit (Owed to You)</p>
              <p className="text-2xl font-semibold text-green-600">Ksh {totalCredit.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="liquid-glass p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CreditCard className={`h-8 w-8 ${netPosition >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Position</p>
              <p className={`text-2xl font-semibold ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Ksh {netPosition.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All Records' },
            { key: 'debts', label: 'Debts' },
            { key: 'credits', label: 'Credits' },
            { key: 'pending', label: 'Pending' },
            { key: 'overdue', label: 'Overdue' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                filter === filterOption.key
                  ? 'bg-green-400 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="liquid-glass shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Counterparty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    record.type === 'debt' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {record.type === 'debt' ? 'You Owe' : 'Owed to You'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.counterparty}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {record.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">Ksh {record.amount.toLocaleString()}</div>
                    {record.paid_amount > 0 && (
                      <div className="text-xs text-gray-500">
                        Paid: Ksh {record.paid_amount.toLocaleString()}
                      </div>
                    )}
                    <div className="text-xs font-medium text-gray-700">
                      Remaining: Ksh {(record.amount - record.paid_amount).toLocaleString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(record.status)}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.due_date ? (
                    <div className={`${new Date(record.due_date) < new Date() && record.status !== 'paid' ? 'text-red-600 font-medium' : ''}`}>
                      {new Date(record.due_date).toLocaleDateString()}
                      {new Date(record.due_date) < new Date() && record.status !== 'paid' && (
                        <div className="text-xs text-red-500">Overdue</div>
                      )}
                    </div>
                  ) : (
                    'No due date'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editRecord(record)}
                      className="text-green-400 hover:text-green-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRecords.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No records found for the selected filter
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingRecord ? 'Edit Record' : 'Add Debt/Credit Record'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'debt' | 'credit' }))}
                    required
                  >
                    <option value="debt">Debt (You Owe)</option>
                    <option value="credit">Credit (Owed to You)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Counterparty</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    value={formData.counterparty}
                    onChange={(e) => setFormData(prev => ({ ...prev, counterparty: e.target.value }))}
                    placeholder="Who owes or is owed money"
                    required
                  />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What is this debt/credit for?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (Optional)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'pending' | 'partial' | 'paid' }))}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partially Paid</option>
                    <option value="paid">Fully Paid</option>
                  </select>
                </div>

                {formData.status !== 'pending' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid (Ksh)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                      value={formData.paid_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, paid_amount: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-400 text-white rounded-md hover:bg-green-500"
                >
                  {editingRecord ? 'Update Record' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtCreditTracker;