import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SheepFormProps {
  sheep?: any;
  onSubmit: () => void;
  onCancel: () => void;
}

const SheepForm: React.FC<SheepFormProps> = ({ sheep, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    ear_tag: '',
    breed: '',
    birth_date: '',
    gender: 'female',
    weight: '',
    health_status: 'healthy',
    vaccination_status: 'up_to_date',
    estimated_value: '',
    notes: '',
    mother_id: '',
    father_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sheep) {
      setFormData({
        ear_tag: sheep.ear_tag || '',
        breed: sheep.breed || '',
        birth_date: sheep.birth_date || '',
        gender: sheep.gender || 'female',
        weight: sheep.weight?.toString() || '',
        health_status: sheep.health_status || 'healthy',
        vaccination_status: sheep.vaccination_status || 'up_to_date',
        estimated_value: sheep.estimated_value?.toString() || '',
        notes: sheep.notes || '',
        mother_id: sheep.mother_id || '',
        father_id: sheep.father_id || ''
      });
    }
  }, [sheep]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submissionData = {
        ear_tag: formData.ear_tag,
        breed: formData.breed,
        birth_date: formData.birth_date,
        gender: formData.gender,
        weight: parseFloat(formData.weight) || null,
        health_status: formData.health_status,
        vaccination_status: formData.vaccination_status,
        estimated_value: parseFloat(formData.estimated_value) || null,
        notes: formData.notes,
        mother_id: formData.mother_id || null,
        father_id: formData.father_id || null
      };

      if (sheep) {
        const { error: updateError } = await supabase
          .from('sheep')
          .update(submissionData)
          .eq('id', sheep.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('sheep')
          .insert([submissionData]);
        
        if (insertError) throw insertError;
      }

      onSubmit();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-glass shadow-lg rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {sheep ? 'Edit Sheep' : 'Add New Sheep'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="ear_tag" className="block text-sm font-medium text-gray-700 mb-2">
              Ear Tag ID *
            </label>
            <input
              type="text"
              id="ear_tag"
              name="ear_tag"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              value={formData.ear_tag}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-2">
              Breed
            </label>
            <input
              type="text"
              id="breed"
              name="breed"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              value={formData.breed}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-2">
              Birth Date
            </label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              value={formData.birth_date}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              value={formData.gender}
              onChange={handleInputChange}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>

          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              value={formData.weight}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="health_status" className="block text-sm font-medium text-gray-700 mb-2">
              Health Status
            </label>
            <select
              id="health_status"
              name="health_status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              value={formData.health_status}
              onChange={handleInputChange}
            >
              <option value="healthy">Healthy</option>
              <option value="sick">Sick</option>
              <option value="recovering">Recovering</option>
              <option value="pregnant">Pregnant</option>
            </select>
          </div>

          <div>
            <label htmlFor="vaccination_status" className="block text-sm font-medium text-gray-700 mb-2">
              Vaccination Status
            </label>
            <select
              id="vaccination_status"
              name="vaccination_status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              value={formData.vaccination_status}
              onChange={handleInputChange}
            >
              <option value="up_to_date">Up to Date</option>
              <option value="due">Due</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label htmlFor="estimated_value" className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Value (Ksh)
            </label>
            <input
              type="number"
              id="estimated_value"
              name="estimated_value"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              value={formData.estimated_value}
              onChange={handleInputChange}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              value={formData.notes}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50 transition-all"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (sheep ? 'Update Sheep' : 'Add Sheep')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SheepForm;