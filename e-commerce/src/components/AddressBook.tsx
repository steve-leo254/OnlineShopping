import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Home, Star, AlertCircle } from 'lucide-react';
import { useShoppingCart } from '../context/ShoppingCartContext';
import { useAuth } from '../context/AuthContext';

interface Address {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  additional_info: string;
  region: string;
  city: string;
  is_default: boolean;
}

type AddressFormData = Omit<Address, 'id'>;

interface AddressBookProps {
  onAddressChange?: () => void; 
}

const AddressBook: React.FC<AddressBookProps> = ({ onAddressChange }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    additional_info: '',
    region: '',
    city: '',
    is_default: false
  });

  const { selectedAddress, setSelectedAddress } = useShoppingCart();
  const { token } = useAuth();

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/addresses`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Address[] = await response.json();
      setAddresses(data);
      
      const defaultAddress = data.find(addr => addr.is_default);
      if (defaultAddress && (!selectedAddress || selectedAddress.id !== defaultAddress.id)) {
        setSelectedAddress(defaultAddress);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching addresses:', err);
      setError('Failed to load addresses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createAddress = async (addressData: AddressFormData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/addresses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(addressData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newAddress: Address = await response.json();
      
      setAddresses(prev => {
        let updatedAddresses = [...prev, newAddress];
        
        if (newAddress.is_default) {
          updatedAddresses = updatedAddresses.map(addr => 
            addr.id !== newAddress.id ? { ...addr, is_default: false } : addr
          );
        }
        
        return updatedAddresses;
      });
      
      if (newAddress.is_default) {
        setSelectedAddress(newAddress);
      }
      
      if (onAddressChange) {
        onAddressChange();
      }
      
      return newAddress;
    } catch (err: any) {
      console.error('Error creating address:', err);
      throw new Error('Failed to create address. Please try again.');
    }
  };

  const updateAddress = async (addressId: number, addressData: AddressFormData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/addresses/${addressId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(addressData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedAddress = await response.json();
      
      // Update local state
      setAddresses(prev => {
        let updatedAddresses = prev.map(addr => 
          addr.id === addressId ? updatedAddress : addr
        );
        
        if (updatedAddress.is_default) {
          updatedAddresses = updatedAddresses.map(addr => 
            addr.id !== updatedAddress.id ? { ...addr, is_default: false } : addr
          );
        }
        
        return updatedAddresses;
      });
      
      if (updatedAddress.is_default || (selectedAddress && selectedAddress.id === addressId)) {
        setSelectedAddress(updatedAddress.is_default ? updatedAddress : 
          (selectedAddress && selectedAddress.id === addressId ? updatedAddress : selectedAddress));
      }
      
      if (onAddressChange) {
        onAddressChange();
      }
      
      return updatedAddress;
    } catch (err) {
      console.error('Error updating address:', err);
      throw new Error('Failed to update address. Please try again.');
    }
  };

  const deleteAddress = async (addressId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/addresses/${addressId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Cannot delete address used in orders');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setAddresses(prev => {
        const updatedAddresses = prev.filter(addr => addr.id !== addressId);
        
        if (selectedAddress && selectedAddress.id === addressId) {
          const newDefaultAddress = updatedAddresses.find(addr => addr.is_default);
          setSelectedAddress(newDefaultAddress || null);
        }
        
        return updatedAddresses;
      });
      
      if (onAddressChange) {
        onAddressChange();
      }
      
    } catch (err: any) {
      console.error('Error deleting address:', err);
      throw new Error((err as Error).message || 'Failed to delete address. Please try again.');
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async () => {
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
    } catch (err: any) {
      setError((err as Error).message);
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

  const handleEdit = (address: Address) => {
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

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        setError(null);
        await deleteAddress(id);
      } catch (err: any) {
        setError((err as Error).message);
      }
    }
  };

  const setDefault = async (id: number) => {
    const addressToUpdate = addresses.find(addr => addr.id === id);
    if (addressToUpdate) {
      try {
        setError(null);
        await updateAddress(id, { ...addressToUpdate, is_default: true });
      } catch (err: any) {
        setError((err as Error).message);
      }
    }
  };

  const formatAddress = (address: Address) => {
    const parts = [address.address];
    if (address.additional_info) parts.push(address.additional_info);
    parts.push(`${address.city}, ${address.region}`);
    return parts;
  };

  if (loading) {
    return (
      <div className="bg-white h-full">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-24 bg-gray-300 rounded"></div>
              <div className="h-24 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Address Book</h1>
            <p className="text-blue-100 text-sm">Manage your delivery addresses</p>
            {selectedAddress && (
              <p className="text-blue-200 text-xs mt-1">
                Current default: {selectedAddress.first_name} {selectedAddress.last_name}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 backdrop-blur-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Address Form */}
        {showForm && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-200 animate-in slide-in-from-top duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Additional Info</label>
                <input
                  type="text"
                  name="additional_info"
                  value={formData.additional_info}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
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
                <label htmlFor="is_default" className="ml-2 text-xs font-medium text-gray-700">
                  Set as default address
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                  className="bg-gray-100 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium disabled:opacity-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Address List */}
        <div className="space-y-3">
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No addresses yet</h3>
              <p className="text-gray-400 text-sm">Add your first address to get started</p>
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white border-2 rounded-lg p-4 transition-all duration-300 hover:shadow-md ${
                  address.is_default 
                    ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50' 
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="w-4 h-4 text-blue-600" />
                      <h3 className="text-base font-semibold text-gray-800">
                        {address.first_name} {address.last_name}
                      </h3>
                      {address.is_default && (
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                          <Star className="w-2.5 h-2.5" />
                          Default
                        </span>
                      )}
                      {selectedAddress && selectedAddress.id === address.id && !address.is_default && (
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-gray-600 space-y-0.5 text-sm">
                      {formatAddress(address).map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                      <p className="text-blue-600 font-medium">{address.phone_number}</p>
                    </div>
                    
                    {/* Set Default Button */}
                    {!address.is_default && (
                      <div className="mt-3">
                        <button
                          onClick={() => setDefault(address.id)}
                          className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1.5 rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 hover:scale-105 font-medium text-xs flex items-center gap-1"
                        >
                          <Star className="w-3 h-3" />
                          Set as Default
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 ml-3">
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Edit address"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
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
  );
};

export default AddressBook;