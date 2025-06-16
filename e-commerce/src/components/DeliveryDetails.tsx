import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

// Import your AddressBook component
import AddressBook from "./AddressBook";

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
  const [showAddressBook, setShowAddressBook] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAddresses();
    }
  }, [isAuthenticated, token]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/addresses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Filter to only show default addresses
      const defaultAddresses = response.data.filter(
        (addr: Address) => addr.is_default
      );
      setAddresses(defaultAddresses);

      // Set default address if no address is currently selected
      if (!selectedAddress && defaultAddresses.length > 0) {
        setSelectedAddress(defaultAddresses[0]);
      }
    } catch (err) {
      toast.error("Failed to fetch addresses", {
        style: { border: "1px solid #ef4444", color: "#111827" },
      });
      console.error("Error fetching addresses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowAddressBook(true);
  };

  const handleCloseAddressBook = () => {
    setShowAddressBook(false);
    // Refresh addresses after closing the address book
    fetchAddresses();
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
      <>
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-xl font-bold text-gray-900 mb-2">
              No default delivery address found
            </p>
            <p className="text-gray-500 mb-4">
              Please set a default delivery address to continue with your order.
            </p>
            <button
              onClick={handleEdit}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 font-medium"
            >
              Manage Addresses
            </button>
          </div>
        </div>

        {/* Address Book Popup */}
        {showAddressBook && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseAddressBook();
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden relative transform transition-all duration-300 animate-slideIn"
              style={{ animation: "fadeIn 0.2s, slideIn 0.2s" }}
            >
              <button
                onClick={handleCloseAddressBook}
                className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 rounded-full p-2 transition-all duration-200 hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="overflow-y-auto max-h-[90vh]">
                <AddressBook
                  mode="modal"
                  onAddressChange={handleCloseAddressBook}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          Default Delivery Address
        </h3>
        {addresses.map((address) => (
          <div
            key={address.id}
            className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-200 ring-2 ring-blue-100 transform hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex items-center mt-1">
                    {/* Checkmark icon to indicate default selection */}
                    <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {address.first_name} {address.last_name}
                      </div>
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-xs font-bold bg-clip-text text-transparent border border-blue-200">
                        Default
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {formatAddress(address)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <svg
                      className="me-1.5 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Manage Addresses
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Address Book Popup */}
      {showAddressBook && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseAddressBook();
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden relative transform transition-all duration-300 animate-slideIn"
            style={{ animation: "fadeIn 0.2s, slideIn 0.2s" }}
          >
            <button
              onClick={handleCloseAddressBook}
              className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 rounded-full p-2 transition-all duration-200 hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="overflow-y-auto max-h-[90vh]">
              <AddressBook
                mode="modal"
                onAddressChange={handleCloseAddressBook}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeliveryDetails;
