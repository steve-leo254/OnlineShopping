import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { X, Upload, Package, Save, Trash2, Star, Heart } from "lucide-react";

// Define types based on your Pydantic models
type Category = {
  id: number;
  name: string;
  description: string | null;
};

type Product = {
  id: number;
  name: string;
  cost: number;
  price: number;
  original_price: number;
  img_url: string | null;
  stock_quantity: number;
  description: string | null;
  barcode: number;
  category_id: number | null;
  brand: string | null;
  category: Category | null;
  rating: number;
  reviews: number;
  discount: number;
  is_new: boolean;
  is_favorite: boolean;
};

type ProductForm = {
  name: string;
  cost: number;
  price: number;
  original_price: number;
  img_url: string;
  stock_quantity: number;
  barcode: number;
  category_id: number | null;
  brand: string;
  description: string;
  rating: number;
  reviews: number;
  discount: number;
  is_new: boolean;
  is_favorite: boolean;
};

interface UpdateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
}

const UpdateProductModal: React.FC<UpdateProductModalProps> = ({ 
  isOpen, 
  onClose, 
  productToEdit 
}) => {
  const imgEndpoint = "http://localhost:8000";
  const { token, role } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductForm>({
    name: "",
    cost: 0,
    price: 0,
    original_price: 0,
    img_url: "",
    stock_quantity: 0,
    barcode: 0,
    category_id: null,
    brand: "",
    description: "",
    rating: 0,
    reviews: 0,
    discount: 0,
    is_new: false,
    is_favorite: false,
  });
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch categories and set initial form data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<Category[]>("http://localhost:8000/public/categories");
        setCategories(response.data);
      } catch (err) {
        toast.error("Failed to fetch categories");
        console.error("Error fetching categories:", err);
      }
    };
    
    if (isOpen) {
      fetchCategories();
      
      // Set form data when productToEdit changes
      if (productToEdit) {
        setFormData({
          name: productToEdit.name,
          cost: productToEdit.cost,
          price: productToEdit.price,
          original_price: productToEdit.original_price,
          img_url: productToEdit.img_url || "",
          stock_quantity: productToEdit.stock_quantity,
          barcode: productToEdit.barcode,
          category_id: productToEdit.category_id,
          brand: productToEdit.brand || "",
          description: productToEdit.description || "",
          rating: productToEdit.rating,
          reviews: productToEdit.reviews,
          discount: productToEdit.discount,
          is_new: productToEdit.is_new,
          is_favorite: productToEdit.is_favorite,
        });
        setImagePreview(productToEdit.img_url);
        setError(null);
      }
    }
  }, [isOpen, productToEdit]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "cost" ||
            name === "price" ||
            name === "original_price" ||
            name === "stock_quantity" ||
            name === "barcode" ||
            name === "rating" ||
            name === "reviews" ||
            name === "discount"
          ? Number(value) || 0
          : name === "category_id"
          ? value
            ? Number(value)
            : null
          : value,
    }));
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file (jpg, png, gif)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || role !== "admin") {
      toast.error("Admin access required");
      return;
    }

    if (!productToEdit) {
      toast.error("No product selected for update");
      return;
    }

    // Client-side validation
    if (!formData.name) {
      toast.error("Product name is required");
      return;
    }
    if (formData.cost <= 0) {
      toast.error("Cost must be greater than 0");
      return;
    }
    if (formData.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    if (formData.original_price <= 0) {
      toast.error("Original price must be greater than 0");
      return;
    }
    if (formData.stock_quantity < 0) {
      toast.error("Stock quantity cannot be negative");
      return;
    }
    if (formData.barcode <= 0) {
      toast.error("Barcode must be a positive number");
      return;
    }
    if (formData.rating < 0 || formData.rating > 5) {
      toast.error("Rating must be between 0 and 5");
      return;
    }
    if (formData.reviews < 0) {
      toast.error("Reviews cannot be negative");
      return;
    }
    if (formData.discount < 0 || formData.discount > 100) {
      toast.error("Discount must be between 0 and 100");
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      let img_url = formData.img_url;
      if (imageFile) {
        // Upload image
        const formDataImage = new FormData();
        formDataImage.append("file", imageFile);
        const imageResponse = await axios.post(
          "http://localhost:8000/upload-image",
          formDataImage,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        img_url = imageResponse.data.img_url;
      }

      // Update product
      const productData = { ...formData, img_url };
      await axios.put(
        `http://localhost:8000/update-product/${productToEdit.id}`,
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Product updated successfully");
      onClose();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        "Failed to update product. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error updating product:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!token || role !== "admin") {
      toast.error("Admin access required");
      return;
    }

    if (!productToEdit) {
      toast.error("No product selected for deletion");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      await axios.delete(
        `http://localhost:8000/delete-product/${productToEdit.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Product deleted successfully");
      onClose();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        "Failed to delete product. Please try again.";
      toast.error(errorMessage);
      console.error("Error deleting product:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
                <p className="text-sm text-gray-600">
                  {productToEdit?.name || "Update product information"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Basic Information
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter product name"
                    required
                  />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter brand name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id ?? ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter barcode"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-green-600">$</span>
                Pricing Information
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                    required
                  />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                    required
                  />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="0"
                  />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Reviews & Ratings */}
            <div className="bg-yellow-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                Reviews & Ratings
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating (0-5)
                  </label>
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    min="0"
                    max="5"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="4.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Reviews
                  </label>
                  <input
                    type="number"
                    name="reviews"
                    value={formData.reviews}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Product Image */}
            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" />
                Product Image
              </h3>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
                />
                {imagePreview && (
                  <div className="flex justify-center">
                    <img
                      src={imagePreview.startsWith('data:') ? imagePreview : `${imgEndpoint}${imagePreview}`}
                      alt="Product preview"
                      className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Product Flags */}
            <div className="bg-blue-50 rounded-xl p-6">
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
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    New Product
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_favorite"
                    checked={formData.is_favorite}
                    onChange={handleChange}
                    className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Featured Product
                  </span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Write a detailed product description..."
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isUpdating}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isUpdating ? "Updating..." : "Update Product"}
              </button>
              
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
                {isDeleting ? "Deleting..." : "Delete Product"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 focus:ring-4 focus:ring-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProductModal;