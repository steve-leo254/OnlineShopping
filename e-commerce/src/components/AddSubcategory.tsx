import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import {
  X,
  Tag,
  BookOpen,
  Plus,
  Trash2,
  Settings,
  Sparkles,
  FolderOpen,
} from "lucide-react";

// Define the types
type Category = {
  id: number;
  name: string;
  description: string;
};

type SubcategoryForm = {
  name: string;
  description: string;
  category_id: number;
};

type Subcategory = {
  id: number;
  name: string;
  description: string;
  category_id: number;
  category?: Category;
};

interface AddSubcategoryProps {
  onClose: () => void;
  onSubcategoryAdded: () => void;
}

const AddSubcategory: React.FC<AddSubcategoryProps> = ({
  onClose,
  onSubcategoryAdded,
}) => {
  const { token, role } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [formData, setFormData] = useState<SubcategoryForm>({
    name: "",
    description: "",
    category_id: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    category_id?: string;
  }>({});

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch subcategories when category is selected
  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/public/categories`
      );
      setCategories(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
      setIsLoading(false);
    }
  };

  const fetchSubcategories = async (categoryId: number) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/categories/${categoryId}/subcategories`
      );
      setSubcategories(response.data || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategories([]);
      // Don't show error toast for this, just log it
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "category_id" ? parseInt(value) : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // Update selected category when category is changed
    if (name === "category_id") {
      setSelectedCategory(parseInt(value));
    }
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      description?: string;
      category_id?: string;
    } = {};

    if (!formData.category_id) {
      newErrors.category_id = "Please select a category";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Subcategory name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Subcategory name must be at least 2 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || (role !== "admin" && role !== "SUPERADMIN")) {
      toast.error("Admin access required");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/subcategories`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Subcategory created successfully!");

      // Reset form but keep the selected category
      setFormData({
        name: "",
        description: "",
        category_id: formData.category_id, // Keep the same category selected
      });
      setErrors({});

      // Refresh subcategories list immediately
      if (selectedCategory) {
        await fetchSubcategories(selectedCategory);
      }

      // Call the callback without triggering additional toasts
      if (onSubcategoryAdded) {
        onSubcategoryAdded();
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        "Failed to create subcategory. Please try again.";
      toast.error(errorMessage);
      console.error("Error creating subcategory:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: number) => {
    if (!token || (role !== "admin" && role !== "SUPERADMIN")) {
      toast.error("Admin access required");
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/subcategories/${subcategoryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Subcategory deleted successfully!");
      if (selectedCategory) {
        fetchSubcategories(selectedCategory);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to delete subcategory";
      toast.error(errorMessage);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
      category_id: formData.category_id, // Keep the selected category
    });
    setErrors({});
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 sm:p-8 rounded-lg shadow-2xl antialiased relative overflow-hidden">
      {/* Enhanced Background Animation */}
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-gradient-to-r from-green-300 to-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-gradient-to-r from-teal-300 to-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-emerald-300 to-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 space-y-8">
        {/* Subcategory Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Add New Subcategory</h3>
                <p className="text-sm text-green-100">
                  Create subcategories under existing categories
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Category Selection */}
              <div>
                <label
                  htmlFor="category_id"
                  className="block mb-2 text-sm font-medium text-gray-800"
                >
                  Parent Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className={`pl-10 pr-4 py-2.5 bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 block w-full transition-all duration-200 ${
                      errors.category_id
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300"
                    }`}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.category_id && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1 inline"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.category_id}
                  </p>
                )}
              </div>

              {/* Subcategory Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block mb-2 text-sm font-medium text-gray-800"
                >
                  Subcategory Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`pl-10 pr-4 py-2.5 bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 block w-full transition-all duration-200 ${
                      errors.name
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300"
                    }`}
                    placeholder="e.g., Laptops, Smartphones, Gaming"
                    maxLength={100}
                    required
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1 inline"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.name}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 text-right">
                  {formData.name.length}/100
                </p>
              </div>

              {/* Description Field */}
              <div>
                <label
                  htmlFor="description"
                  className="block mb-2 text-sm font-medium text-gray-800"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`pl-10 pr-4 py-2.5 bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 block w-full transition-all duration-200 resize-none ${
                      errors.description
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300"
                    }`}
                    placeholder="Briefly describe the subcategory..."
                    maxLength={200}
                    required
                  />
                </div>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1 inline"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 text-right">
                  {formData.description.length}/200
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-green-700 focus:z-10 focus:ring-4 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center transition-all duration-200 ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "shadow-md hover:shadow-lg"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Subcategory
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Subcategories List */}
        {selectedCategory && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold flex items-center gap-2">
                    Existing Subcategories
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                  </h4>
                  <p className="text-sm text-teal-100">
                    Manage subcategories for{" "}
                    {categories.find((c) => c.id === selectedCategory)?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {subcategories.length} subcategories
              </div>
            </div>

            {/* Subcategories List */}
            <div className="p-6">
              {subcategories.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    No subcategories found for this category.
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Create your first subcategory using the form above.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-medium text-gray-700">
                      Subcategories ({subcategories.length})
                    </h5>
                  </div>
                  <div className="grid gap-3">
                    {subcategories.map((subcategory, index) => (
                      <div
                        key={subcategory.id}
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-teal-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full text-xs font-medium text-teal-700">
                            {index + 1}
                          </div>
                          <div>
                            <h6 className="font-medium text-gray-900">
                              {subcategory.name}
                            </h6>
                            <p className="text-sm text-gray-600 mt-1">
                              {subcategory.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleDeleteSubcategory(subcategory.id)
                          }
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                          title="Delete subcategory"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
      `}</style>
    </section>
  );
};

export default AddSubcategory;
