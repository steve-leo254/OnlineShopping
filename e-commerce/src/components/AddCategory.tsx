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
} from "lucide-react";

// Define the category type to match your API
type CategoryForm = {
  name: string;
  description: string;
};

// Types for specification
type Specification = {
  id: number;
  name: string;
  value_type: string;
};

type SpecForm = {
  name: string;
  value_type: string;
};

interface CategoryFormProps {
  onClose: () => void;
  onCategoryAdded: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  onClose,
  onCategoryAdded,
}) => {
  const { token, role } = useAuth();
  const [formData, setFormData] = useState<CategoryForm>({
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>(
    {}
  );
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [specs, setSpecs] = useState<Specification[]>([]);
  const [specForm, setSpecForm] = useState<SpecForm>({
    name: "",
    value_type: "string",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string; description?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Category name must be at least 2 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch specifications for a subcategory
  const fetchSpecifications = async (subcatId: number) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/subcategories/${subcatId}/specifications`
      );
      setSpecs(response.data || []);
    } catch (err) {
      setSpecs([]);
    }
  };

  // After category is created, fetch its specs
  useEffect(() => {
    if (categoryId) fetchSpecifications(categoryId);
  }, [categoryId]);

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
      // Send category data to API - following the same pattern as AddProduct
      const categoryData = { ...formData };
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/categories`,
        categoryData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Category created successfully!");
      setCategoryId(res.data.id);
      setFormData({ name: "", description: "" });
      setErrors({});
      onCategoryAdded();
      // Don't close modal, show spec management
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        "Failed to create category. Please try again.";
      toast.error(errorMessage);
      console.error("Error creating category:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ name: "", description: "" });
    setErrors({});
  };

  // Add specification
  const handleSpecInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSpecForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    if (!specForm.name.trim()) {
      toast.error("Specification name required");
      return;
    }
    try {
      await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/subcategories/${categoryId}/specifications`,
        { ...specForm, subcategory_id: categoryId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSpecForm({ name: "", value_type: "string" });
      fetchSpecifications(categoryId);
      toast.success("Specification added");
    } catch (err) {
      toast.error("Failed to add specification");
    }
  };

  // Delete specification
  const handleDeleteSpec = async (specId: number) => {
    if (!categoryId) {
      toast.error("No category selected");
      return;
    }

    try {
      await axios.delete(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/subcategories/${categoryId}/specifications/${specId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSpecs((prev) => prev.filter((s) => s.id !== specId));
      toast.success("Specification deleted successfully");
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail || "Failed to delete specification"
      );
    }
  };

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
    <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 sm:p-8 rounded-lg shadow-2xl antialiased relative overflow-hidden">
      {/* Enhanced Background Animation */}
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-gradient-to-r from-blue-300 to-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-indigo-300 to-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 space-y-8">
        {/* Category Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Add New Category</h3>
                <p className="text-sm text-blue-100">
                  Create a new product category with custom specifications
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
              {/* Category Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block mb-2 text-sm font-medium text-gray-800"
                >
                  Category Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`pl-10 pr-4 py-2.5 bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full transition-all duration-200 ${
                      errors.name
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300"
                    }`}
                    placeholder="e.g., Electronics, Fashion, Home Goods"
                    maxLength={50}
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
                  {formData.name.length}/50
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
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`pl-10 pr-4 py-2.5 bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full transition-all duration-200 resize-none ${
                      errors.description
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300"
                    }`}
                    placeholder="Briefly describe the category, e.g., 'A collection of high-quality electronic gadgets and accessories.'"
                    maxLength={500}
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
                  {formData.description.length}/500
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center transition-all duration-200 ${
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
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Create Category
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Enhanced Specification Management Section */}
        {categoryId && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold flex items-center gap-2">
                    Specifications Manager
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                  </h4>
                  <p className="text-sm text-indigo-100">
                    Add custom specifications for your category
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {specs.length} specs
              </div>
            </div>

            {/* Add Specification Form */}
            <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
              <form onSubmit={handleAddSpec} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specification Name
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={specForm.name}
                        onChange={handleSpecInputChange}
                        className="pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-all duration-200"
                        placeholder="e.g., Screen Size, Weight, Color"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Value Type
                    </label>
                    <select
                      name="value_type"
                      value={specForm.value_type}
                      onChange={handleSpecInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    >
                      <option value="string">String (Text)</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean (Yes/No)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add Specification
                  </button>
                </div>
              </form>
            </div>

            {/* Specifications List */}
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-sm font-medium text-gray-700">
                    Added Specifications ({specs.length})
                  </h5>
                </div>
                <div className="grid gap-3">
                  {specs.map((spec, index) => (
                    <div
                      key={spec.id}
                      className="group flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-indigo-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full text-xs font-medium text-indigo-700">
                          {index + 1}
                        </div>
                        <div>
                          <h6 className="font-medium text-gray-900">
                            {spec.name}
                          </h6>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getValueTypeColor(
                                spec.value_type
                              )}`}
                            >
                              <span className="text-xs font-mono">
                                {getValueTypeIcon(spec.value_type)}
                              </span>
                              {spec.value_type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSpec(spec.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                        title="Delete specification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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

export default CategoryForm;
