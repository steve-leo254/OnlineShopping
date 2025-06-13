import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Home, Building, Star, AlertCircle } from 'lucide-react';

const AddressBook = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    additional_info: '',
    region: '',
    city: '',
    is_default: false
  });

  // You'll need to replace this with your actual API base URL
  const API_BASE_URL = 'http://localhost:8000'; // Adjust this to your FastAPI server

  // Function to get auth headers (adjust based on your auth implementation)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); // Adjust based on how you store auth token
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Fetch addresses from API
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAddresses(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError('Failed to load addresses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create new address
  const createAddress = async (addressData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(addressData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newAddress = await response.json();
      setAddresses(prev => [...prev, newAddress]);
      return newAddress;
    } catch (err) {
      console.error('Error creating address:', err);
      throw new Error('Failed to create address. Please try again.');
    }
  };

  // Update address
  const updateAddress = async (addressId, addressData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(addressData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedAddress = await response.json();
      setAddresses(prev => prev.map(addr => 
        addr.id === addressId ? updatedAddress : addr
      ));
      return updatedAddress;
    } catch (err) {
      console.error('Error updating address:', err);
      throw new Error('Failed to update address. Please try again.');
    }
  };

  // Delete address
  const deleteAddress = async (addressId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Cannot delete address used in orders');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
    } catch (err) {
      console.error('Error deleting address:', err);
      throw new Error(err.message || 'Failed to delete address. Please try again.');
    }
  };

  // Load addresses on component mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.phone_number || 
        !formData.address || !formData.city || !formData.region) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingAddress) {
        await updateAddress(editingAddress.id, formData);
      } else {
        await createAddress(formData);
      }
      
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      phone_number: '',
      address: '',
      additional_info: '',
      region: '',
      city: '',
      is_default: false
    });
    setShowForm(false);
    setEditingAddress(null);
    setError(null);
  };

  const handleEdit = (address) => {
    setFormData({
      first_name: address.first_name,
      last_name: address.last_name,
      phone_number: address.phone_number,
      address: address.address,
      additional_info: address.additional_info || '',
      region: address.region,
      city: address.city,
      is_default: address.is_default
    });
    setEditingAddress(address);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        setError(null);
        await deleteAddress(id);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const setDefault = async (id) => {
    const addressToUpdate = addresses.find(addr => addr.id === id);
    if (addressToUpdate) {
      try {
        setError(null);
        await updateAddress(id, { ...addressToUpdate, is_default: true });
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Format address display
  const formatAddress = (address) => {
    const parts = [address.address];
    if (address.additional_info) parts.push(address.additional_info);
    parts.push(`${address.city}, ${address.region}`);
    return parts;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-300 rounded"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Address Book</h1>
              <p className="text-blue-100">Manage your delivery addresses</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
            >
              <Plus className="w-5 h-5" />
              Add Address
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          )}

          {/* Address Form */}
          {showForm && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8 border border-blue-200 animate-in slide-in-from-top duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Info</label>
                  <input
                    type="text"
                    name="additional_info"
                    value={formData.additional_info}
                    onChange={handleInputChange}
                    placeholder="Apartment, suite, unit, building, floor, etc."
                    className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Region <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_default"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={handleInputChange}
                    className="text-blue-500 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="is_default" className="ml-2 text-sm font-medium text-gray-700">
                    Set as default address
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting 
                      ? (editingAddress ? 'Updating...' : 'Saving...') 
                      : (editingAddress ? 'Update Address' : 'Save Address')
                    }
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={submitting}
                    className="bg-gray-100 text-gray-600 px-8 py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Address List */}
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-500 mb-2">No addresses yet</h3>
                <p className="text-gray-400">Add your first address to get started</p>
              </div>
            ) : (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className={`bg-white border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${
                    address.is_default 
                      ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50' 
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Home className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                          {address.first_name} {address.last_name}
                        </h3>
                        {address.is_default && (
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-gray-600 space-y-1">
                        {formatAddress(address).map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                        <p className="text-blue-600 font-medium">{address.phone_number}</p>
                      </div>
                      
                      {/* Set Default Button */}
                      {!address.is_default && (
                        <div className="mt-4">
                          <button
                            onClick={() => setDefault(address.id)}
                            className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 hover:scale-105 font-medium text-sm flex items-center gap-2"
                          >
                            <Star className="w-4 h-4" />
                            Set as Default
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(address)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105"
                        title="Edit address"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105"
                        title="Delete address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressBook;