import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useShoppingCart } from '../context/ShoppingCartContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Address {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  additional_info?: string;
  city: string;
  region: string;
  is_default: boolean;
  user_id: number;
  created_at: string;
}

const DeliveryDetails: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const { selectedAddress, setSelectedAddress } = useShoppingCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAddresses();
    }
  }, [isAuthenticated, token]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setAddresses(response.data);
      
      // Set default address if no address is currently selected
      if (!selectedAddress) {
        const defaultAddress = response.data.find((addr: Address) => addr.is_default);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        } else if (response.data.length > 0) {
          // If no default, select the first address
          setSelectedAddress(response.data[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to fetch addresses', {
        style: { border: '1px solid #ef4444', color: '#111827' },
        progressStyle: { background: '#ef4444' },
      });
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addressId: number) => {
    if (!isAuthenticated || !token) {
      toast.error('You must be logged in to delete an address', {
        style: { border: '1px solid #ef4444', color: '#111827' },
        progressStyle: { background: '#ef4444' },
      });
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://localhost:8000/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Address deleted successfully', {
        style: { border: '1px solid #10b981', color: '#111827' },
        progressStyle: { background: '#10b981' },
      });
      
      // Remove from local state
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
      setAddresses(updatedAddresses);
      
      // If deleted address was selected, clear selection or select another
      if (selectedAddress?.id === addressId) {
        if (updatedAddresses.length > 0) {
          const newDefault = updatedAddresses.find(addr => addr.is_default) || updatedAddresses[0];
          setSelectedAddress(newDefault);
        } else {
          setSelectedAddress(null);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete address', {
        style: { border: '1px solid #ef4444', color: '#111827' },
        progressStyle: { background: '#ef4444' },
      });
      console.error('Error deleting address:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (addressId: number) => {
    // Placeholder: Trigger edit action (e.g., open modal or navigate to edit form)
    toast.info(`Edit address with ID: ${addressId}`, {
      style: { border: '1px solid #3b82f6', color: '#111827' },
      progressStyle: { background: '#3b82f6' },
    });
  };

  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
    toast.success('Address selected', {
      style: { border: '1px solid #10b981', color: '#111827' },
      progressStyle: { background: '#10b981' },
    });
  };

  // Format address for display
  const formatAddress = (address: Address) => {
    let addr = address.address;
    if (address.additional_info) {
      addr += `, ${address.additional_info}`;
    }
    addr += `, ${address.city}, ${address.region}`;
    return `${addr} | Phone: ${address.phone_number}`;
  };

  if (loading) {
    return (
      <div className="group bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Loading addresses...
          </p>
        </div>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xl font-bold text-gray-900 mb-2">No delivery addresses found</p>
          <p className="text-gray-500">Please add a delivery address to continue with your order.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
        Delivery Addresses
      </h3>
      {addresses.map((address) => (
        <div
          key={address.id}
          className={`group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border transform hover:-translate-y-1 ${
            selectedAddress?.id === address.id
              ? 'border-blue-200 ring-2 ring-blue-100'
              : 'border-gray-100 hover:border-blue-200'
          }`}
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="flex items-center mt-1">
                  <input
                    type="radio"
                    id={`address-${address.id}`}
                    name="selected-address"
                    checked={selectedAddress?.id === address.id}
                    onChange={() => handleSelectAddress(address)}
                    className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <label
                      htmlFor={`address-${address.id}`}
                      className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {address.first_name} {address.last_name}
                    </label>
                    {address.is_default && (
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1 text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent border border-blue-200">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {formatAddress(address)}
                  </p>
                </div>
              </div>
            </div>
            
            {selectedAddress?.id === address.id && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleEdit(address.id)}
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <svg className="me-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Address
                  </button>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <button
                    type="button"
                    onClick={() => handleDelete(address.id)}
                    className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <svg className="me-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeliveryDetails;