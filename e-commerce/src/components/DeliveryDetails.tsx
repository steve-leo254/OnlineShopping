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
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading addresses...</p>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No addresses found. Please add a delivery address.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <div
          key={address.id}
          className={`rounded-lg border p-4 ${
            selectedAddress?.id === address.id
              ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
              : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  id={`address-${address.id}`}
                  name="selected-address"
                  checked={selectedAddress?.id === address.id}
                  onChange={() => handleSelectAddress(address)}
                  className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
                />
                <label
                  htmlFor={`address-${address.id}`}
                  className="font-medium text-gray-900 dark:text-white cursor-pointer"
                >
                  {address.first_name} {address.last_name}
                  {address.is_default && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                      Default
                    </span>
                  )}
                </label>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatAddress(address)}
              </p>
            </div>
          </div>
          {selectedAddress?.id === address.id && (
            <div className="mt-4 flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => handleDelete(address.id)}
                className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Delete
              </button>
              <div className="h-3 w-px shrink-0 bg-gray-200 dark:bg-gray-700"></div>
              <button
                type="button"
                onClick={() => handleEdit(address.id)}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DeliveryDetails;