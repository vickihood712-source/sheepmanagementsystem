import React, { useState, useEffect } from 'react';
import { Search, Filter, CreditCard as Edit, Trash2, Eye, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SheepListProps {
  user: any;
  onEdit: (sheep: any) => void;
}

const SheepList: React.FC<SheepListProps> = ({ user, onEdit }) => {
  const [sheep, setSheep] = useState<any[]>([]);
  const [filteredSheep, setFilteredSheep] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('ear_tag');

  useEffect(() => {
    loadSheep();
  }, []);

  useEffect(() => {
    filterAndSortSheep();
  }, [sheep, searchTerm, filterStatus, sortBy]);

  const loadSheep = async () => {
    setLoading(true);
    try {
      let query = supabase.from('sheep').select('*').limit(200); // Add reasonable limit
      
      // Role-based filtering - farmers only see their own sheep
      if (user.role === 'farmer') {
        // In a real implementation, you'd have a farmer_id field
        // For now, we'll show all sheep but this is where you'd filter
        query = query.eq('created_by', user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setSheep(data || []);
    } catch (error) {
      console.error('Error loading sheep:', error);
      setSheep([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSheep = () => {
    let filtered = [...sheep];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(s => 
        String(s.ear_tag || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(s.breed || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.health_status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'ear_tag':
          return String(a.ear_tag || '').localeCompare(String(b.ear_tag || ''));
        case 'birth_date':
          return new Date(a.birth_date || 0).getTime() - new Date(b.birth_date || 0).getTime();
        case 'weight':
          return (b.weight || 0) - (a.weight || 0);
        case 'health_status':
          return String(a.health_status || '').localeCompare(String(b.health_status || ''));
        default:
          return 0;
      }
    });

    setFilteredSheep(filtered);
  };

  const deleteSheep = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sheep record?')) return;

    try {
      const { error } = await supabase
        .from('sheep')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      loadSheep();
    } catch (error) {
      console.error('Error deleting sheep:', error);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'sick': return 'text-red-600 bg-red-100';
      case 'recovering': return 'text-yellow-600 bg-yellow-100';
      case 'pregnant': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'Unknown';
    const birth = new Date(birthDate);
    const now = new Date();
    const ageMonths = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    
    if (ageMonths < 12) {
      return `${ageMonths} months`;
    } else {
      const years = Math.floor(ageMonths / 12);
      const months = ageMonths % 12;
      return months > 0 ? `${years}y ${months}m` : `${years} years`;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading sheep records...</div>;
  }

  return (
    <div className="liquid-glass shadow-sm rounded-lg">
      {/* Search and Filter Bar */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ear tag or breed..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-3">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="healthy">Healthy</option>
              <option value="sick">Sick</option>
              <option value="recovering">Recovering</option>
              <option value="pregnant">Pregnant</option>
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="ear_tag">Sort by Ear Tag</option>
              <option value="birth_date">Sort by Age</option>
              <option value="weight">Sort by Weight</option>
              <option value="health_status">Sort by Health</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sheep List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sheep Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Health Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Physical Stats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSheep.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">#{s.ear_tag}</div>
                    <div className="text-sm text-gray-500">
                      {s.breed} • {s.gender} • {calculateAge(s.birth_date)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthStatusColor(s.health_status)}`}>
                    <Heart className="w-3 h-3 mr-1" />
                    {s.health_status}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    Vaccines: {s.vaccination_status}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>Weight: {s.weight ? `${s.weight} kg` : 'Not recorded'}</div>
                  <div className="text-xs text-gray-500">
                    Born: {s.birth_date ? new Date(s.birth_date).toLocaleDateString() : 'Unknown'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {s.estimated_value ? `$${s.estimated_value.toLocaleString()}` : 'Not set'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(s)}
                      className="text-green-400 hover:text-green-600 p-1 rounded"
                      title="Edit sheep"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {(user.role === 'admin') && (
                      <button
                        onClick={() => deleteSheep(s.id)}
                        className="text-red-400 hover:text-red-600 p-1 rounded"
                        title="Delete sheep"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSheep.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">No sheep records found</div>
          <div className="text-sm text-gray-400">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Add your first sheep to get started'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default SheepList;