import React, { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Home, Building, Star } from 'lucide-react';

const AddressBook = () => {
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      user_id: 4,
      first_name: 'Eric',
      last_name: 'Omondi',
      phone_number: '+254706532882',
      address: 'Nairobi,CBD',
      additional_info: 'Opposite Imenti House',
      region: 'Nairobi',
      city: 'Nairobi',
      is_default: true,
      created_at: '2025-06-12T10:19:38',
      type: 'home',
      title: 'Home'
    },
    {
      id: 2,
      user_id: 4,
      first_name: 'Eric',
      last_name: 'Omondi',
      phone_number: '+254723456789',
      address: 'Karen, Nairobi',
      additional_info: 'Near Karen Shopping Centre',
      region: 'Nairobi',
      city: 'Karen',
      is_default: false,
      created_at: '2025-06-11T15:30:22',
      type: 'work',
      title: 'Office'
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    type: 'home',
    title: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    additional_info: '',
    region: '',
    city: ''
  });

  const addressTypes = {
    home: { icon: Home, label: 'Home', color: 'text-blue-600' },
    work: { icon: Building, label: 'Work', color: 'text-purple-600' },
    other: { icon: MapPin, label: 'Other', color: 'text-green-600' }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.first_name || !formData.last_name || !formData.phone_number || !formData.address || !formData.region || !formData.city) {
      return;
    }
    
    if (editingAddress) {
      setAddresses(addresses.map(addr => 
        addr.id === editingAddress.id 
          ? { ...formData, id: editingAddress.id, is_default: editingAddress.is_default, user_id: editingAddress.user_id, created_at: editingAddress.created_at }
          : addr
      ));
    } else {
      const newAddress = {
        ...formData,
        id: Date.now(),
        user_id: 4, // You can make this dynamic based on logged-in user
        is_default: addresses.length === 0,
        created_at: new Date().toISOString()
      };
      setAddresses([...addresses, newAddress]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: 'home',
      title: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      address: '',
      additional_info: '',
      region: '',
      city: ''
    });
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleEdit = (address) => {
    setFormData({ ...address });
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    const deletedAddress = addresses.find(addr => addr.id === id);
    
    if (deletedAddress?.is_default && updatedAddresses.length > 0) {
      updatedAddresses[0].is_default = true;
    }
    
    setAddresses(updatedAddresses);
  };

  const setDefault = (id) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      is_default: addr.id === id
    })));
  };

  const getTypeIcon = (type) => {
    const TypeIcon = addressTypes[type]?.icon || MapPin;
    return <TypeIcon className={`w-5 h-5 ${addressTypes[type]?.color || 'text-gray-600'}`} />;
  };

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
          {/* Address Form */}
          {showForm && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8 border border-blue-200 animate-in slide-in-from-top duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      {Object.entries(addressTypes).map(([key, value]) => (
                        <option key={key} value={key}>{value.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Home, Office"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="+254XXXXXXXXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g., Nairobi, CBD"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                    placeholder="e.g., Opposite Imenti House, Apartment 2B"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      placeholder="e.g., Nairobi"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g., Nairobi, Karen"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 font-medium"
                  >
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-100 text-gray-600 px-8 py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
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
                    address.isDefault 
                      ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50' 
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getTypeIcon(address.type)}
                        <h3 className="text-lg font-semibold text-gray-800">{address.title}</h3>
                        {address.is_default && (
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-gray-600 space-y-1">
                        <p className="font-medium text-gray-800 text-lg">{address.first_name} {address.last_name}</p>
                        <p className="text-blue-600 font-medium">{address.phone_number}</p>
                        <p className="text-gray-700">{address.address}</p>
                        {address.additional_info && (
                          <p className="text-sm text-gray-500 italic">{address.additional_info}</p>
                        )}
                      </div>
                      
                      {/* Set Default Button - More Prominent */}
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