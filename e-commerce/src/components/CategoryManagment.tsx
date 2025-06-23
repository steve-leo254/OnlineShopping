import React, { useState, useEffect } from "react";
import {
  X,
  Trash2,
  AlertTriangle,
  Package,
  Tag,
  Search,
  Filter,
  MoreVertical,
  Settings,
  Sparkles,
  Eye,
  Edit,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import axios from "axios";

// Define types
type Category = {
  id: number;
  name: string;
  description: string | null;
  product_count?: number;
};

type Specification = {
  id: number;
  name: string;
  value_type: string;
  category_id: number;
};

interface CategoryManagementProps {
  onClose: () => void;
  onCategoryDeleted?: () => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ 
  onClose, 
  onCategoryDeleted 
}) => {
  const { token, role } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [categorySpecs, setCategorySpecs] = useState<{ [key: number]: Specification[] }>({});
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch categories from API - Fixed to match CategoryForm pattern
  const fetchCategories = async (): Promise<void> => {
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    if (!token || (role !== "admin" && role !== "SUPERADMIN")) {
      toast.error("Admin access required");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/public/categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Transform data to match Category type
      const transformedCategories: Category[] = response.data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        product_count: cat.product_count || 0
      }));
      
      setCategories(transformedCategories);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to fetch categories";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch specifications for a category
  const fetchCategorySpecs = async (categoryId: number): Promise<void> => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/categories/${categoryId}/specifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setCategorySpecs(prev => ({
        ...prev,
        [categoryId]: response.data
      }));
    } catch (err: any) {
      console.error(`Error fetching specs for category ${categoryId}:`, err);
      setCategorySpecs(prev => ({
        ...prev,
        [categoryId]: []
      }));
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token, role]);

  // Fetch specs for all categories when categories are loaded
  useEffect(() => {
    if (categories.length > 0) {
      categories.forEach(category => {
        fetchCategorySpecs(category.id);
      });
    }
  }, [categories]);

  // Handle delete category
  const handleDeleteCategory = async (): Promise<void> => {
    if (!selectedCategory || !token) return;

    if (role !== "admin" && role !== "SUPERADMIN") {
      toast.error("Admin access required to delete categories");
      return;
    }

    setIsDeletingCategory(true);
    setError("");

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/categories/${selectedCategory.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setCategories((prev) => prev.filter((cat) => cat.id !== selectedCategory.id));
      toast.success(`Category "${selectedCategory.name}" deleted successfully`);
      setShowDeleteModal(false);
      setSelectedCategory(null);
      if (onCategoryDeleted) onCategoryDeleted();
    } catch (err: any) {
      let errorMessage = "Failed to delete category";
      if (err.response?.status === 400) {
        errorMessage = err.response?.data?.detail || "Cannot delete category with associated products or specifications";
      } else if (err.response?.status === 404) {
        errorMessage = "Category not found";
      } else if (err.response?.status === 401) {
        errorMessage = "Unauthorized access. Please login again.";
      } else if (err.response?.status === 403) {
        errorMessage = "Admin access required";
      } else {
        errorMessage = err.response?.data?.detail || errorMessage;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // Handle delete specification
  const handleDeleteSpec = async (categoryId: number, specId: number): Promise<void> => {
    if (!token || (role !== "admin" && role !== "SUPERADMIN")) {
      toast.error("Admin access required");
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/categories/${categoryId}/specifications/${specId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setCategorySpecs(prev => ({
        ...prev,
        [categoryId]: prev[categoryId]?.filter(spec => spec.id !== specId) || []
      }));
      
      toast.success("Specification deleted successfully");
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to delete specification";
      toast.error(errorMessage);
    }
  };

  // Refresh categories (useful for external calls)
  const refreshCategories = (): void => {
    fetchCategories();
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDropdownToggle = (categoryId: number): void => {
    setActiveDropdown(activeDropdown === categoryId ? null : categoryId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (): void => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getValueTypeColor = (valueType: string) => {
    switch (valueType) {
      case "string":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "number":
        return "bg-green-100 text-green-700 border-green-200";
      case "boolean":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getValueTypeIcon = (valueType: string) => {
    switch (valueType) {
      case "string":
        return "Aa";
      case "number":
        return "123";
      case "boolean":
        return "T/F";
      default:
        return "?";
    }
  };

  return (
    <>
      <section className="bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-2xl antialiased relative overflow-hidden max-h-[95vh] flex flex-col">
        {/* Enhanced Background Animation */}
        <div className="absolute -top-10 -left-10 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-r from-red-300 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-10 -right-10 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-r from-purple-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-r from-pink-300 to-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 mb-6">
            <div className="bg-gradient-to-r from-red-500 via-pink-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-6 rounded-t-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      Category Management
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                    </h2>
                    <p className="text-red-100 text-xs sm:text-sm">
                      Manage and delete product categories
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm bg-white/20 px-3 py-1 rounded-full text-white">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    {categories.length} total
                  </div>
                  <button
                    onClick={refreshCategories}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200 text-white"
                    title="Refresh categories"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mx-4 sm:mx-6 mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                  <span className="text-red-800 font-medium text-sm sm:text-base">Error</span>
                </div>
                <p className="text-red-700 text-xs sm:text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Search and Filter */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                <div className="relative flex-1 max-w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{filteredCategories.length} categories found</span>
                </div>
              </div>
            </div>
          </div>

          {/* Categories List - Scrollable */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 flex-1 overflow-hidden">
            <div className="p-4 sm:p-6 overflow-y-auto h-full">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-red-500"></div>
                  <span className="ml-3 text-gray-600 text-sm sm:text-base">Loading categories...</span>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-base sm:text-lg">No categories found</p>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {searchTerm ? "Try adjusting your search terms" : "No categories available"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {filteredCategories.map((category, index) => (
                    <div
                      key={category.id}
                      className="group bg-gradient-to-r from-white to-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-lg hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="flex flex-col gap-4">
                        {/* Category Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-100 to-pink-100 rounded-full text-xs sm:text-sm font-medium text-red-700 flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-lg truncate">
                                {category.name}
                              </h4>
                              {category.description && (
                                <p className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2">
                                  {category.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  <Package className="w-3 h-3" />
                                  <span>{category.product_count || 0} products</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  <Settings className="w-3 h-3" />
                                  <span>{categorySpecs[category.id]?.length || 0} specs</span>
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  ID: {category.id}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            {/* Quick Action Buttons (visible on larger screens) */}
                            <div className="hidden sm:flex items-center gap-2">
                              <button
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="View details"
                                onClick={() => {
                                  console.log('View category:', category);
                                  // Add your view functionality here
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200"
                                title="Edit category"
                                onClick={() => {
                                  setEditingCategory(category);
                                  setEditForm({ name: category.name, description: category.description || "" });
                                  setActiveDropdown(null);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Actions Dropdown */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDropdownToggle(category.id);
                                }}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200 group-hover:bg-gray-100"
                              >
                                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                              </button>

                              {activeDropdown === category.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                  <div className="py-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('View category:', category);
                                        // Add view functionality here
                                        setActiveDropdown(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Details
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Edit category:', category);
                                        // Add edit functionality here
                                        setActiveDropdown(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit Category
                                    </button>
                                    <div className="border-t border-gray-100"></div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Delete category clicked:', category);
                                        setSelectedCategory(category);
                                        setShowDeleteModal(true);
                                        setActiveDropdown(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete Category
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Specifications Section */}
                        {categorySpecs[category.id] && categorySpecs[category.id].length > 0 && (
                          <div className="border-t border-gray-100 pt-3">
                            <h5 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                              <Settings className="w-3 h-3" />
                              Specifications ({categorySpecs[category.id].length})
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {categorySpecs[category.id].map((spec) => (
                                <div
                                  key={spec.id}
                                  className="group/spec flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getValueTypeColor(spec.value_type)}`}>
                                      <span className="text-xs font-mono">
                                        {getValueTypeIcon(spec.value_type)}
                                      </span>
                                    </span>
                                    <span className="text-xs text-gray-700 truncate">{spec.name}</span>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteSpec(category.id, spec.id)}
                                    className="opacity-0 group-hover/spec:opacity-100 p-1 text-red-500 hover:text-red-700 rounded transition-all duration-200"
                                    title="Delete specification"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced CSS Animations */}
        <style>{`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </section>

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden">
            {/* Modal background animation */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500"></div>
            
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Category
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete the category{" "}
                  <span className="font-semibold text-red-600">
                    "{selectedCategory.name}"
                  </span>
                  ?
                </p>
                
                <div className="space-y-2">
                  {selectedCategory.product_count && selectedCategory.product_count > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-yellow-800">
                          Warning: This category has {selectedCategory.product_count} associated products
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {categorySpecs[selectedCategory.id] && categorySpecs[selectedCategory.id].length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-blue-800">
                          This category has {categorySpecs[selectedCategory.id].length} custom specifications
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-700">
                      The API will prevent deletion if there are associated products or specifications.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedCategory(null);
                    setError("");
                  }}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 font-medium"
                  disabled={isDeletingCategory}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCategory}
                  disabled={isDeletingCategory}
                  className={`flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium ${
                    isDeletingCategory ? "opacity-50 cursor-not-allowed" : "shadow-md hover:shadow-lg"
                  }`}
                >
                  {isDeletingCategory ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Category</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsEditing(true);
                try {
                  await axios.put(
                    `${import.meta.env.VITE_API_BASE_URL}/categories/${editingCategory.id}`,
                    editForm,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );
                  toast.success("Category updated successfully!");
                  setEditingCategory(null);
                  fetchCategories();
                } catch (err: any) {
                  toast.error(
                    err.response?.data?.detail || "Failed to update category"
                  );
                } finally {
                  setIsEditing(false);
                }
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  disabled={isEditing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  disabled={isEditing}
                >
                  {isEditing ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryManagement;