import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import {
  X,
  Tag,
  Plus,
  Trash2,
  Settings,
  FolderOpen,
  Edit3,
  Search,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// Define the types
type Category = {
  id: number;
  name: string;
  title?: string;
  subtitle?: string;
  description: string;
  features?: string[];
};

type Subcategory = {
  id: number;
  name: string;
  description: string;
  category_id: number;
  category?: Category;
};

type Specification = {
  id: number;
  name: string;
  value_type: string;
  category_id: number;
};

type CategoryForm = {
  name: string;
  title?: string;
  subtitle?: string;
  description: string;
  features: string[];
};

type SpecForm = {
  name: string;
  value_type: string;
};

const CategoryManagement: React.FC = () => {
  const { token, role } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "categories" | "subcategories" | "specifications"
  >("categories");

  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [showSpecForm, setShowSpecForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] =
    useState<Subcategory | null>(null);
  const [editingSpec, setEditingSpec] = useState<Specification | null>(null);

  // Form data
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    name: "",
    title: "",
    subtitle: "",
    description: "",
    features: [],
  });
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: "",
    description: "",
    category_id: 0,
  });
  const [specForm, setSpecForm] = useState<SpecForm>({
    name: "",
    value_type: "string",
  });

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check admin access
  const isAdmin = role === "admin" || role === "SUPERADMIN";

  useEffect(() => {
    if (isAdmin && token) {
      fetchCategories();
    }
  }, [isAdmin, token]);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory);
      fetchSpecifications(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedSubcategory) {
      fetchSpecifications(selectedSubcategory);
    }
  }, [selectedSubcategory]);

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
    }
  };

  const fetchSpecifications = async (subcategoryId: number) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/subcategories/${subcategoryId}/specifications`
      );
      setSpecifications(response.data || []);
    } catch (error) {
      setSpecifications([]);
    }
  };

  // Category Management
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCategoryForm()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/categories/${
            editingCategory.id
          }`,
          categoryForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Category updated successfully!");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/categories`,
          categoryForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Category created successfully!");
      }

      resetCategoryForm();
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This will also delete all its subcategories and specifications."
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/categories/${categoryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Category deleted successfully!");
      fetchCategories();
      if (selectedCategory === categoryId) {
        setSelectedCategory(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete category");
    }
  };

  // Subcategory Management
  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSubcategoryForm()) return;

    setIsSubmitting(true);
    try {
      if (editingSubcategory) {
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/subcategories/${
            editingSubcategory.id
          }`,
          subcategoryForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Subcategory updated successfully!");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/subcategories`,
          subcategoryForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Subcategory created successfully!");
      }

      resetSubcategoryForm();
      if (selectedCategory) {
        fetchSubcategories(selectedCategory);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save subcategory");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: number) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/subcategories/${subcategoryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Subcategory deleted successfully!");
      if (selectedCategory) {
        fetchSubcategories(selectedCategory);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete subcategory");
    }
  };

  // Specification Management
  const handleSpecSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSpecForm()) return;

    setIsSubmitting(true);
    try {
      if (editingSpec) {
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/specifications/${
            editingSpec.id
          }`,
          { ...specForm, subcategory_id: selectedSubcategory },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Specification updated successfully!");
      } else {
        await axios.post(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/subcategories/${selectedSubcategory}/specifications`,
          { ...specForm, subcategory_id: selectedSubcategory },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Specification created successfully!");
      }

      resetSpecForm();
      if (selectedSubcategory) {
        fetchSpecifications(selectedSubcategory);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save specification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSpec = async (specId: number) => {
    if (!confirm("Are you sure you want to delete this specification?")) {
      return;
    }

    if (!selectedSubcategory) {
      toast.error("Please select a subcategory first");
      return;
    }

    try {
      await axios.delete(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/subcategories/${selectedSubcategory}/specifications/${specId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Specification deleted successfully!");
      if (selectedSubcategory) {
        fetchSpecifications(selectedSubcategory);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail || "Failed to delete specification"
      );
    }
  };

  // Form validation
  const validateCategoryForm = () => {
    const newErrors: Record<string, string> = {};
    if (!categoryForm.name.trim()) newErrors.name = "Category name is required";
    if (!categoryForm.description.trim())
      newErrors.description = "Description is required";
    return Object.keys(newErrors).length === 0;
  };

  const validateSubcategoryForm = () => {
    const newErrors: Record<string, string> = {};
    if (!subcategoryForm.category_id)
      newErrors.category_id = "Please select a category";
    if (!subcategoryForm.name.trim())
      newErrors.name = "Subcategory name is required";
    if (!subcategoryForm.description.trim())
      newErrors.description = "Description is required";
    return Object.keys(newErrors).length === 0;
  };

  const validateSpecForm = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedSubcategory)
      newErrors.category = "Please select a subcategory";
    if (!specForm.name.trim())
      newErrors.name = "Specification name is required";
    if (!specForm.value_type) newErrors.value_type = "Value type is required";
    return Object.keys(newErrors).length === 0;
  };

  // Form reset functions
  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      title: "",
      subtitle: "",
      description: "",
      features: [],
    });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const resetSubcategoryForm = () => {
    setSubcategoryForm({
      name: "",
      description: "",
      category_id: selectedCategory || 0,
    });
    setEditingSubcategory(null);
    setShowSubcategoryForm(false);
  };

  const resetSpecForm = () => {
    setSpecForm({ name: "", value_type: "string" });
    setEditingSpec(null);
    setShowSpecForm(false);
  };

  // Edit functions
  const handleEditCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      title: category.title || "",
      subtitle: category.subtitle || "",
      description: category.description,
      features: Array.isArray(category.features) ? category.features : [],
    });
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setSubcategoryForm({
      name: subcategory.name,
      description: subcategory.description,
      category_id: subcategory.category_id,
    });
    setEditingSubcategory(subcategory);
    setSelectedSubcategory(subcategory.id);
    setShowSubcategoryForm(true);
  };

  const handleEditSpec = (spec: Specification) => {
    setSpecForm({ name: spec.name, value_type: spec.value_type });
    setEditingSpec(spec);
    setSelectedSubcategory(spec.category_id);
    setShowSpecForm(true);
  };

  // Filter functions
  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubcategories = subcategories.filter(
    (sub) =>
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSpecifications = specifications.filter(
    (spec) =>
      spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spec.value_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle category selection for subcategories and specifications
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    if (categoryId) {
      fetchSubcategories(categoryId);
      fetchSpecifications(categoryId);
    } else {
      setSubcategories([]);
      setSpecifications([]);
    }
  };

  // Update spec form when category is selected
  const handleSpecCategoryChange = (subcategoryId: number) => {
    setSelectedSubcategory(subcategoryId);
    if (subcategoryId) {
      fetchSpecifications(subcategoryId);
    } else {
      setSpecifications([]);
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...categoryForm.features];
    newFeatures[index] = value;
    setCategoryForm({ ...categoryForm, features: newFeatures });
  };

  const handleAddFeature = () => {
    setCategoryForm({
      ...categoryForm,
      features: [...categoryForm.features, ""],
    });
  };

  const handleRemoveFeature = (index: number) => {
    const newFeatures = [...categoryForm.features];
    newFeatures.splice(index, 1);
    setCategoryForm({ ...categoryForm, features: newFeatures });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
                <Settings className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Category Management
                </h1>
                <p className="text-gray-600">
                  Manage categories, subcategories, and specifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchCategories}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("categories")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "categories"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setActiveTab("subcategories")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "subcategories"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Subcategories
              </button>
              <button
                onClick={() => setActiveTab("specifications")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "specifications"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Specifications
              </button>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="space-y-8">
          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <h2 className="text-xl font-bold">Categories</h2>
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </div>

              <div className="p-6">
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No categories found.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {category.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subcategories Tab */}
          {activeTab === "subcategories" && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-600 to-teal-600 text-white">
                <h2 className="text-xl font-bold">Subcategories</h2>
                <button
                  onClick={() => setShowSubcategoryForm(true)}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Subcategory
                </button>
              </div>

              {/* Category Selection for Subcategories */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">
                    Select Category:
                  </label>
                  <select
                    value={selectedCategory || ""}
                    onChange={(e) =>
                      handleCategorySelect(parseInt(e.target.value) || 0)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="">Choose a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {selectedCategory && (
                    <span className="text-sm text-gray-600">
                      Showing subcategories for:{" "}
                      {categories.find((c) => c.id === selectedCategory)?.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                {!selectedCategory ? (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Please select a category to view its subcategories.
                    </p>
                  </div>
                ) : filteredSubcategories.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No subcategories found for this category.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredSubcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {subcategory.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {subcategory.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            Category:{" "}
                            {
                              categories.find(
                                (c) => c.id === subcategory.category_id
                              )?.name
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditSubcategory(subcategory)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteSubcategory(subcategory.id)
                            }
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Specifications Tab */}
          {activeTab === "specifications" && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <h2 className="text-xl font-bold">Specifications</h2>
                <button
                  onClick={() => setShowSpecForm(true)}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Specification
                </button>
              </div>

              {/* Category Selection for Specifications */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">
                    Select Category:
                  </label>
                  <select
                    value={selectedSubcategory || ""}
                    onChange={(e) =>
                      handleSpecCategoryChange(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a subcategory</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                  {selectedSubcategory && (
                    <span className="text-sm text-gray-600">
                      Showing specifications for:{" "}
                      {
                        subcategories.find((s) => s.id === selectedSubcategory)
                          ?.name
                      }
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                {!selectedSubcategory ? (
                  <div className="text-center py-8">
                    <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Please select a subcategory to view its specifications.
                    </p>
                  </div>
                ) : filteredSpecifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No specifications found for this subcategory.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredSpecifications.map((spec) => (
                      <div
                        key={spec.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {spec.name}
                          </h3>
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {spec.value_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditSpec(spec)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSpec(spec.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Category Form Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold">
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h3>
                <button
                  onClick={resetCategoryForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={categoryForm.title}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Laptops & Notebooks"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={categoryForm.subtitle}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        subtitle: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Powerful computing for work and play"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features
                  </label>
                  <div className="space-y-2">
                    {categoryForm.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) =>
                            handleFeatureChange(idx, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Feature #${idx + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-red-500 hover:text-red-700 px-2 py-1 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      + Add Feature
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingCategory
                      ? "Update"
                      : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Subcategory Form Modal */}
        {showSubcategoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold">
                  {editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}
                </h3>
                <button
                  onClick={resetSubcategoryForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubcategorySubmit}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Category
                  </label>
                  <select
                    value={subcategoryForm.category_id}
                    onChange={(e) =>
                      setSubcategoryForm({
                        ...subcategoryForm,
                        category_id: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory Name
                  </label>
                  <input
                    type="text"
                    value={subcategoryForm.name}
                    onChange={(e) =>
                      setSubcategoryForm({
                        ...subcategoryForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={subcategoryForm.description}
                    onChange={(e) =>
                      setSubcategoryForm({
                        ...subcategoryForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetSubcategoryForm}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingSubcategory
                      ? "Update"
                      : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Specification Form Modal */}
        {showSpecForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold">
                  {editingSpec ? "Edit Specification" : "Add Specification"}
                </h3>
                <button
                  onClick={resetSpecForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSpecSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedSubcategory || ""}
                    onChange={(e) =>
                      handleSpecCategoryChange(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a subcategory</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specification Name
                  </label>
                  <input
                    type="text"
                    value={specForm.name}
                    onChange={(e) =>
                      setSpecForm({ ...specForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value Type
                  </label>
                  <select
                    value={specForm.value_type}
                    onChange={(e) =>
                      setSpecForm({ ...specForm, value_type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="string">String (Text)</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean (Yes/No)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetSpecForm}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedSubcategory}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingSpec
                      ? "Update"
                      : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;
