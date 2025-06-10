import React, { useState, useEffect } from 'react';
import { Plus, Users, Search, Eye, EyeOff, Trash2, Edit, Shield, UserCheck, AlertCircle, CheckCircle, X } from 'lucide-react';

const SuperAdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '', show: false });
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({});

  // Mock admin data - replace with actual API call
  const mockAdmins = [
    {
      id: 1,
      username: 'admin_john',
      email: 'john@company.com',
      created_at: '2024-01-15T10:30:00Z',
      last_login: '2024-06-08T14:22:00Z',
      status: 'active'
    },
    {
      id: 2,
      username: 'admin_sarah',
      email: 'sarah@company.com',
      created_at: '2024-02-20T09:15:00Z',
      last_login: '2024-06-07T11:45:00Z',
      status: 'active'
    }
  ];

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call to fetch admin users
      // const response = await fetch('/api/admin/users?role=admin', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setAdmins(data);
      
      // For now, using mock data
      setTimeout(() => {
        setAdmins(mockAdmins);
        setLoading(false);
      }, 1000);
    } catch (error) {
      showNotification('error', 'Failed to fetch admins');
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // API call to register admin
      const response = await fetch('/auth/register/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });
      
      if (response.ok) {
        const newAdmin = {
          id: Date.now(),
          username: formData.username,
          email: formData.email,
          created_at: new Date().toISOString(),
          last_login: null,
          status: 'active'
        };
        
        setAdmins([...admins, newAdmin]);
        setFormData({ username: '', email: '', password: '', confirmPassword: '' });
        setShowAddForm(false);
        showNotification('success', 'Admin added successfully!');
      } else {
        const errorData = await response.json();
        showNotification('error', errorData.detail || 'Failed to add admin');
      }
    } catch (error) {
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    
    try {
      // API call to delete admin
      // await fetch(`/api/admin/users/${adminId}`, {
      //   method: 'DELETE',
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      
      setAdmins(admins.filter(admin => admin.id !== adminId));
      showNotification('success', 'Admin deleted successfully');
    } catch (error) {
      showNotification('error', 'Failed to delete admin');
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification({ type: '', message: '', show: false });
    }, 4000);
  };

  const filteredAdmins = admins.filter(admin =>
    admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
          </div>
          <p className="text-gray-300">Manage system administrators and their permissions</p>
        </div>

        {/* Notification */}
        {notification.show && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            notification.type === 'success' 
              ? 'bg-green-900/50 border-green-500 text-green-100' 
              : 'bg-red-900/50 border-red-500 text-red-100'
          } backdrop-blur-sm`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{notification.message}</span>
              <button 
                onClick={() => setNotification({ ...notification, show: false })}
                className="ml-auto text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Total Admins</p>
                <p className="text-2xl font-bold text-white">{admins.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-lg">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Active Admins</p>
                <p className="text-2xl font-bold text-white">{admins.filter(a => a.status === 'active').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">This Month</p>
                <p className="text-2xl font-bold text-white">2</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Add New Admin
            </button>
          </div>
        </div>

        {/* Add Admin Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Add New Admin</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className={`w-full px-3 py-2 bg-slate-700 border ${formErrors.username ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    placeholder="Enter username"
                  />
                  {formErrors.username && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.username}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-3 py-2 bg-slate-700 border ${formErrors.email ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    placeholder="Enter email"
                  />
                  {formErrors.email && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className={`w-full px-3 py-2 pr-10 bg-slate-700 border ${formErrors.password ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.password}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className={`w-full px-3 py-2 bg-slate-700 border ${formErrors.confirmPassword ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    placeholder="Confirm password"
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleAddAdmin}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Admin'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admins Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Admin Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        Loading admins...
                      </div>
                    </td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                      No admins found
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {admin.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{admin.username}</p>
                            <p className="text-gray-400 text-sm">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {formatDate(admin.created_at)}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {formatDate(admin.last_login)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          admin.status === 'active' 
                            ? 'bg-green-900/50 text-green-400 border border-green-700'
                            : 'bg-red-900/50 text-red-400 border border-red-700'
                        }`}>
                          {admin.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;