import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import {
  X,
  Save,
  Loader2,
  Tag,
  DollarSign,
  Package,
  Image as ImageIcon,
  PlusCircle,
  Settings,
  List,
  AlertCircle,
  Info,
} from "lucide-react";
import CategoryForm from "./AddCategory";

// Define types based on your database models
type Category = {
  id: number;
  name: string;
  description: string | null;
};

type Subcategory = {
  id: number;
  name: string;
  description: string | null;
  category_id: number;
};

type Specification = {
  id: number;
  name: string;
  value_type: string;
  category_id: number;
};

type ProductForm = {
  name: string;
  cost: number;
  price: number;
  original_price: number;
  stock_quantity: number;
  barcode: number;
  category_id: number | null;
  subcategory_id: number | null;
  brand: string;
  description: string;
  discount: number;
  is_new: boolean;
};

interface UpdateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: any | null;
}

const UpdateProductModal: React.FC<UpdateProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { token, role } = useAuth();
  const [formData, setFormData] = useState<ProductForm>({
    name: "",
    cost: 0,
    price: 0,
    original_price: 0,
    stock_quantity: 0,
    barcode: 0,
    category_id: null,
    subcategory_id: null,
    brand: "",
    description: "",
    discount: 0,
    is_new: false,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<
    { id: number; img_url: string }[]
  >([]);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [specValues, setSpecValues] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories on mount
  const fetchCategories = async () => {
    try {
      const response = await axios.get<Category[]>(
        `${import.meta.env.VITE_API_BASE_URL}/public/categories`
      );
      setCategories(response.data);
    } catch (err) {
      toast.error("Failed to fetch categories");
      console.error("Error fetching categories:", err);
    }
  };

  // Fetch subcategories when category changes
  const fetchSubcategories = async (categoryId: number) => {
    try {
      const response = await axios.get<Subcategory[]>(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/categories/${categoryId}/subcategories`
      );
      setSubcategories(response.data || []);
    } catch (err) {
      setSubcategories([]);
    }
  };

  // Fetch specifications when subcategory changes
  const fetchSpecifications = async (subcategoryId: number) => {
    try {
      const response = await axios.get<Specification[]>(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/subcategories/${subcategoryId}/specifications`
      );
      setSpecifications(response.data || []);
    } catch (err) {
      setSpecifications([]);
    }
  };

  // Fetch categories, images, and specifications on open
  useEffect(() => {
    const fetchImages = async (productId: number) => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/products/${productId}/images`
        );
        setExistingImages(res.data);
      } catch {}
    };
    const fetchProductSpecs = async (productId: number) => {
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/products/${productId}/specifications`
        );
        const values: Record<number, string> = {};
        res.data.forEach((spec: any) => {
          values[spec.specification_id] = spec.value;
        });
        setSpecValues(values);
      } catch {}
    };

    if (isOpen && productToEdit) {
      fetchCategories();
      fetchImages(productToEdit.id);
      fetchProductSpecs(productToEdit.id);
      setFormData({
        name: productToEdit.name,
        cost: productToEdit.cost,
        price: productToEdit.price,
        original_price: productToEdit.original_price,
        stock_quantity: productToEdit.stock_quantity,
        barcode: productToEdit.barcode,
        category_id: productToEdit.category_id,
        subcategory_id: productToEdit.subcategory_id,
        brand: productToEdit.brand || "",
        description: productToEdit.description || "",
        discount: productToEdit.discount,
        is_new: productToEdit.is_new,
      });
      if (productToEdit.category_id) {
        fetchSubcategories(productToEdit.category_id);
        fetchSpecifications(productToEdit.subcategory_id || 0);
      }
      setImageFiles([]);
      setImagePreviews([]);
      setErrors({});
    }
  }, [isOpen, productToEdit]);

  // Handle category change
  useEffect(() => {
    if (formData.category_id) {
      fetchSubcategories(formData.category_id);
      // Reset subcategory when category changes
      setFormData((prev) => ({ ...prev, subcategory_id: null }));
    } else {
      setSubcategories([]);
      setSpecifications([]);
      setFormData((prev) => ({ ...prev, subcategory_id: null }));
    }
  }, [formData.category_id]);

  // Calculate selling price whenever original_price or discount changes
  useEffect(() => {
    if (formData.original_price > 0) {
      const discountAmount =
        (formData.original_price * formData.discount) / 100;
      const calculatedPrice = formData.original_price - discountAmount;
      setFormData((prev) => ({
        ...prev,
        price: Math.round(calculatedPrice * 100) / 100,
      }));
    }
  }, [formData.original_price, formData.discount]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : name === "cost" ||
          name === "price" ||
          name === "original_price" ||
          name === "stock_quantity" ||
          name === "barcode" ||
          name === "discount"
        ? Number(value) || 0
        : name === "category_id" || name === "subcategory_id"
        ? value
          ? Number(value)
          : null
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Product name must be at least 3 characters";
    }

    if (formData.cost <= 0) {
      newErrors.cost = "Cost must be greater than 0";
    }

    if (formData.original_price <= 0) {
      newErrors.original_price = "Original price must be greater than 0";
    }

    if (formData.price <= 0) {
      newErrors.price = "Selling price must be greater than 0";
    }

    if (formData.stock_quantity < 0) {
      newErrors.stock_quantity = "Stock quantity cannot be negative";
    }

    if (formData.barcode <= 0) {
      newErrors.barcode = "Barcode must be a positive number";
    }

    if (formData.discount < 0 || formData.discount > 100) {
      newErrors.discount = "Discount must be between 0 and 100";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Please select a category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file (jpg, png, gif)");
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Image size must be less than 20MB");
        return false;
      }
      return true;
    });

    if (imageFiles.length + validFiles.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    setImageFiles((prev) => [...prev, ...validFiles]);
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImageFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove existing image visually (cannot delete from backend)
  const handleRemoveExistingImage = async (id: number) => {
    if (!productToEdit) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/products/${
          productToEdit.id
        }/images/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExistingImages((prev) => prev.filter((img) => img.id !== id));
      toast.success("Image removed from product");
    } catch (err) {
      toast.error("Failed to remove image");
    }
  };

  // Handle specification value changes
  const handleSpecChange = (specId: number, value: string) => {
    setSpecValues((prev) => ({ ...prev, [specId]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || (role !== "admin" && role !== "SUPERADMIN")) {
      toast.error("Admin access required");
      return;
    }

    if (!productToEdit) {
      toast.error("No product selected for update");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload all selected image files
      let uploadedImageUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const formDataImage = new FormData();
        formDataImage.append("file", imageFiles[i]);
        const imageResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/upload-image`,
          formDataImage,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        uploadedImageUrls.push(imageResponse.data.img_url);
        // Add to backend images table
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/products/${
            productToEdit.id
          }/images`,
          { img_url: imageResponse.data.img_url },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Update product (main fields)
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/update-product/${
          productToEdit.id
        }`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Add/update specifications
      const specificationsArr = Object.entries(specValues)
        .filter(([_, value]) => value.trim() !== "")
        .map(([specification_id, value]) => ({
          specification_id: Number(specification_id),
          value: value.trim(),
        }));

      for (const spec of specificationsArr) {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/products/${
            productToEdit.id
          }/specifications`,
          spec,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success("Product updated successfully!");
      onClose();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        "Failed to update product. Please try again.";
      toast.error(errorMessage);
      console.error("Error updating product:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryAdded = () => {
    fetchCategories();
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

  const completedSpecs = Object.values(specValues).filter(
    (val) => val.trim() !== ""
  ).length;
  const totalSpecs = specifications.length;
  const completionPercentage =
    totalSpecs > 0 ? (completedSpecs / totalSpecs) * 100 : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Edit Product</h2>
                <p className="text-blue-100 text-sm">
                  Update the product details and specifications
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Basic Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.name
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter product name"
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Product brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      name="category_id"
                      value={formData.category_id ?? ""}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.category_id
                          ? "border-red-500 ring-red-200"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center"
                      title="Add new category"
                    >
                      <PlusCircle className="w-5 h-5" />
                    </button>
                  </div>
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.category_id}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory
                  </label>
                  <select
                    name="subcategory_id"
                    value={formData.subcategory_id ?? ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={!formData.category_id}
                  >
                    <option value="">Select subcategory</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                  {!formData.category_id && (
                    <p className="mt-1 text-sm text-gray-500 flex items-center">
                      <Info className="w-4 h-4 mr-1" />
                      Select a category first
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barcode *
                  </label>
                  <input
                    type="number"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.barcode
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter barcode"
                    required
                  />
                  {errors.barcode && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.barcode}
                    </p>
                  )}
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Product description..."
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="bg-green-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Pricing & Stock
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Price *
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.cost
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300"
                    }`}
                    placeholder="0.00"
                    required
                  />
                  {errors.cost && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.cost}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price *
                  </label>
                  <input
                    type="number"
                    name="original_price"
                    value={formData.original_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.original_price
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300"
                    }`}
                    placeholder="0.00"
                    required
                  />
                  {errors.original_price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.original_price}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.discount
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300"
                    }`}
                    placeholder="0"
                  />
                  {errors.discount && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.discount}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price (Auto-calculated)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-3 border rounded-xl bg-gray-100 cursor-not-allowed ${
                      errors.price ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0.00"
                    readOnly
                    disabled
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.price}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Calculated as: Original Price - (Original Price × Discount
                    %)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.stock_quantity
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300"
                    }`}
                    placeholder="0"
                    required
                  />
                  {errors.stock_quantity && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.stock_quantity}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-purple-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Product Images
                </h3>
              </div>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Images (Max 5)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      multiple
                      onChange={handleImageChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Max file size: 20MB per image. Supported formats: JPG, PNG,
                    GIF
                  </p>
                </div>
                {(imagePreviews.length > 0 || existingImages.length > 0) && (
                  <div className="lg:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview ({imagePreviews.length + existingImages.length}/5)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((img, idx) => (
                        <div key={img.id} className="relative inline-block">
                          <img
                            src={
                              img.img_url.startsWith("http")
                                ? img.img_url
                                : `${import.meta.env.VITE_API_BASE_URL}${
                                    img.img_url
                                  }`
                            }
                            alt={`Product preview ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(img.id)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative inline-block">
                          <img
                            src={preview}
                            alt={`Product preview ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImageFile(idx)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Specifications Section */}
            {specifications.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-2xl p-6 border border-indigo-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <Settings className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Product Specifications
                    </h3>
                    <p className="text-sm text-gray-600">
                      Define the technical details and attributes for this
                      product
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {specifications.map((spec) => (
                    <div
                      key={spec.id}
                      className="group relative bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-lg flex items-center justify-center">
                            <List className="w-4 h-4 text-indigo-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            {spec.name}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={specValues[spec.id] || ""}
                              onChange={(e) =>
                                handleSpecChange(spec.id, e.target.value)
                              }
                              className="w-full px-4 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all duration-200 placeholder-gray-400"
                              placeholder={`Enter ${spec.name.toLowerCase()}...`}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <div
                                className={`text-xs px-2 py-1 rounded-md border ${getValueTypeColor(
                                  spec.value_type
                                )}`}
                              >
                                {spec.value_type}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subtle animation indicator */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </div>
                  ))}
                </div>

                {/* Specifications Summary */}
                <div className="mt-6 p-4 bg-white/70 rounded-xl border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <span>
                        {completedSpecs} of {totalSpecs} specifications
                        completed
                      </span>
                    </div>
                    <span className="text-sm font-medium text-indigo-600">
                      {Math.round(completionPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Status */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Product Status
              </h3>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_new"
                    checked={formData.is_new}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    New Product
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${
                  isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:from-blue-700 hover:to-purple-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Updating Product...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Update Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <CategoryForm
              onClose={() => setShowCategoryModal(false)}
              onCategoryAdded={handleCategoryAdded}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateProductModal;
