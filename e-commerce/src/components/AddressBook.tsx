import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Home,
  Star,
  AlertCircle,
  MapPin,
  Navigation,
} from "lucide-react";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { useAuth } from "../context/AuthContext";
import countiesData from "../context/kenyan_counties.json";

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

type AddressFormData = Omit<Address, "id">;

interface AddressBookProps {
  onAddressChange?: () => void;
  mode?: "page" | "modal";
}

const AddressBook: React.FC<AddressBookProps> = ({
  onAddressChange,
  mode = "page",
}) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>({
    first_name: "",
    last_name: "",
    phone_number: "",
    address: "",
    additional_info: "",
    region: "",
    city: "",
    is_default: false,
  });
  const [selectedCounty, setSelectedCounty] = useState("");
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);

  const { selectedAddress, setSelectedAddress } = useShoppingCart();
  const { token } = useAuth();

  const getAuthHeaders = () => {
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/addresses`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Address[] = await response.json();
      setAddresses(data);

      const defaultAddress = data.find((addr) => addr.is_default);
      if (
        defaultAddress &&
        (!selectedAddress || selectedAddress.id !== defaultAddress.id)
      ) {
        setSelectedAddress(defaultAddress);
      }

      setError(null);
    } catch (err: any) {
      console.error("Error fetching addresses:", err);
      setError("Failed to load addresses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const createAddress = async (addressData: AddressFormData) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/addresses`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(addressData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newAddress: Address = await response.json();

      setAddresses((prev) => {
        let updatedAddresses = [...prev, newAddress];

        if (newAddress.is_default) {
          updatedAddresses = updatedAddresses.map((addr) =>
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
      console.error("Error creating address:", err);
      throw new Error("Failed to create address. Please try again.");
    }
  };

  const updateAddress = async (
    addressId: number,
    addressData: AddressFormData
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/addresses/${addressId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(addressData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedAddress = await response.json();

      // Update local state
      setAddresses((prev) => {
        let updatedAddresses = prev.map((addr) =>
          addr.id === addressId ? updatedAddress : addr
        );

        if (updatedAddress.is_default) {
          updatedAddresses = updatedAddresses.map((addr) =>
            addr.id !== updatedAddress.id
              ? { ...addr, is_default: false }
              : addr
          );
        }

        return updatedAddresses;
      });

      if (
        updatedAddress.is_default ||
        (selectedAddress && selectedAddress.id === addressId)
      ) {
        setSelectedAddress(
          updatedAddress.is_default
            ? updatedAddress
            : selectedAddress && selectedAddress.id === addressId
            ? updatedAddress
            : selectedAddress
        );
      }

      if (onAddressChange) {
        onAddressChange();
      }

      return updatedAddress;
    } catch (err) {
      console.error("Error updating address:", err);
      throw new Error("Failed to update address. Please try again.");
    }
  };

  const deleteAddress = async (addressId: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/addresses/${addressId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Cannot delete address used in orders");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setAddresses((prev) => {
        const updatedAddresses = prev.filter((addr) => addr.id !== addressId);

        if (selectedAddress && selectedAddress.id === addressId) {
          const newDefaultAddress = updatedAddresses.find(
            (addr) => addr.is_default
          );
          setSelectedAddress(newDefaultAddress || null);
        }

        return updatedAddresses;
      });

      if (onAddressChange) {
        onAddressChange();
      }
    } catch (err: any) {
      console.error("Error deleting address:", err);
      throw new Error(
        (err as Error).message || "Failed to delete address. Please try again."
      );
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (selectedCounty) {
      const county = countiesData.counties.find(
        (c) => c.name === selectedCounty
      );
      setAvailableTowns(county?.towns || []);
    } else {
      setAvailableTowns([]);
    }
  }, [selectedCounty]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (name === "region") {
      setSelectedCounty(value);
      setFormData((prev) => ({
        ...prev,
        region: value,
        city: "", // Reset city when county changes
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.phone_number ||
      !formData.address ||
      !formData.city ||
      !formData.region
    ) {
      setError("Please fill in all required fields");
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
      first_name: "",
      last_name: "",
      phone_number: "",
      address: "",
      additional_info: "",
      region: "",
      city: "",
      is_default: false,
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
      additional_info: address.additional_info || "",
      region: address.region,
      city: address.city,
      is_default: address.is_default,
    });
    setEditingAddress(address);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (addressId: number) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        setError(null);
        await deleteAddress(addressId);
      } catch (err: any) {
        setError((err as Error).message);
      }
    }
  };

  const setDefault = async (id: number) => {
    const addressToUpdate = addresses.find((addr) => addr.id === id);
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

  // In modal mode, call onAddressChange when an address is selected/changed
  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
    if (mode === "modal" && onAddressChange) {
      onAddressChange();
    }
  };

  // Empty State Component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
          <MapPin className="w-10 h-10 text-blue-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
          <Navigation className="w-4 h-4 text-white" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-2">No Addresses Yet</h3>

      <p className="text-gray-600 mb-8 max-w-sm leading-relaxed">
        You haven't added any delivery addresses yet. Add your first address to
        get started with seamless deliveries.
      </p>

      <button
        onClick={() => setShowForm(true)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg font-medium text-base"
      >
        <Plus className="w-5 h-5" />
        Add Your First Address
      </button>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg">
        <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
          <Home className="w-6 h-6 text-blue-600 mb-2" />
          <span className="text-xs text-gray-600 text-center">
            Home & Office
          </span>
        </div>
        <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
          <Star className="w-6 h-6 text-purple-600 mb-2" />
          <span className="text-xs text-gray-600 text-center">Set Default</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
          <Navigation className="w-6 h-6 text-green-600 mb-2" />
          <span className="text-xs text-gray-600 text-center">
            Quick Delivery
          </span>
        </div>
      </div>
    </div>
  );

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
    <div
      className={`bg-white h-full flex flex-col relative min-h-screen ${
        mode === "modal"
          ? "max-w-lg mx-auto rounded-2xl shadow-lg border border-blue-100"
          : ""
      }`}
    >
      {/* Header: Only show in page mode */}
      {mode === "page" && (
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800  px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Address Book
              </h1>
              <p className="text-blue-100 text-sm">
                Manage your delivery addresses
              </p>
              {selectedAddress && (
                <p className="text-blue-200 text-xs mt-1">
                  Current default: {selectedAddress.first_name}{" "}
                  {selectedAddress.last_name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Content */}
      <div
        className={`flex-1 overflow-y-auto ${mode === "modal" ? "p-4" : "p-6"}`}
      >
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
              {editingAddress ? "Edit Address" : "Add New Address"}
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
                  placeholder="123 Kilimani Road, Kilimani"
                  onChange={handleInputChange}
                  className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Additional Info
                </label>
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
                    Region/County <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    required
                  >
                    <option value="">Select County</option>
                    {countiesData.counties.map((county) => (
                      <option key={county.code} value={county.name}>
                        {county.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    City/Town <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    required
                    disabled={!selectedCounty}
                  >
                    <option value="">Select Town</option>
                    {availableTowns.map((town) => (
                      <option key={town} value={town}>
                        {town}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_default"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label
                  htmlFor="is_default"
                  className="ml-2 text-xs font-medium text-gray-700"
                >
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
                    ? editingAddress
                      ? "Updating..."
                      : "Saving..."
                    : editingAddress
                    ? "Update Address"
                    : "Save Address"}
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

        {/* Show Empty State when no addresses and no form */}
        {addresses.length === 0 && !showForm && <EmptyState />}

        {/* Address List */}
        {addresses.length > 0 && (
          <div className="space-y-4 pb-8">
            {addresses.map((address) => (
              <div
                key={address.id}
                onClick={() => handleSelectAddress(address)}
                className={`relative p-4 rounded-lg border cursor-pointer ${
                  selectedAddress?.id === address.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                } transition-all duration-200`}
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
                      {selectedAddress &&
                        selectedAddress.id === address.id &&
                        !address.is_default && (
                          <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                            Selected
                          </span>
                        )}
                    </div>
                    <div className="text-gray-600 space-y-0.5 text-sm">
                      {formatAddress(address).map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                      <p className="text-blue-600 font-medium">
                        {address.phone_number}
                      </p>
                    </div>

                    {/* Set Default Button */}
                    {!address.is_default && (
                      <div className="mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDefault(address.id);
                          }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(address);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Edit address"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(address.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Address Button - Only show when there are existing addresses */}
        {addresses.length > 0 && (
          <div className="sticky bottom-4 left-6 z-50">
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 text-sm font-medium shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add New Address
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressBook;
