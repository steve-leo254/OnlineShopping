import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { X, Save, Loader2, Tag, DollarSign, Package, Star, Image as ImageIcon, PlusCircle } from 'lucide-react';
import CategoryForm from './AddCategory'; // Import the CategoryForm component

// Define types based on your Pydantic models
type Category = {
  id: number;
  name: string;
  description: string | null;
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

interface AddProductProps {
  onClose: () => void;
}

const AddProduct: React.FC<AddProductProps> = ({ onClose }) => {
  const { token, role } = useAuth();
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    cost: 0,
    price: 0,
    original_price: 0,
    img_url: '',
    stock_quantity: 0,
    barcode: 0,
    category_id: null,
    brand: '',
    description: '',
    rating: 0,
    reviews: 0,
    discount: 0,
    is_new: false,
    is_favorite: false,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false); // State for category modal

  // Fetch categories on mount and when a new category is added
  const fetchCategories = async () => {
    try {
      const response = await axios.get<Category[]>(`${import.meta.env.VITE_API_BASE_URL}/public/categories`);
      setCategories(response.data);
    } catch (err) {
      toast.error('Failed to fetch categories');
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Calculate selling price whenever original_price or discount changes
  useEffect(() => {
    if (formData.original_price > 0) {
      const discountAmount = (formData.original_price * formData.discount) / 100;
      const calculatedPrice = formData.original_price - discountAmount;
      
      setFormData(prev => ({
        ...prev,
        price: Math.round(calculatedPrice * 100) / 100 // Round to 2 decimal places
      }));
    }
  }, [formData.original_price, formData.discount]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : name === 'cost' || name === 'price' || name === 'original_price' || name === 'stock_quantity' || name === 'barcode' || name === 'rating' || name === 'reviews' || name === 'discount'
          ? Number(value) || 0
          : name === 'category_id'
          ? value ? Number(value) : null
          : value,
    }));
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (jpg, png, gif)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
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


    if (!token || (role !== 'admin' && role !== 'SUPERADMIN')) {
     toast.error('Admin access required');
     return;
   }

   
    // Client-side validation
    if (!formData.name) {
      toast.error('Product name is required');
      return;
    }
    if (formData.cost <= 0) {
      toast.error('Cost must be greater than 0');
      return;
    }
    if (formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    if (formData.original_price <= 0) {
      toast.error('Original price must be greater than 0');
      return;
    }
    if (formData.stock_quantity < 0) {
      toast.error('Stock quantity cannot be negative');
      return;
    }
    if (formData.barcode <= 0) {
      toast.error('Barcode must be a positive number');
      return;
    }
    if (formData.rating < 0 || formData.rating > 5) {
      toast.error('Rating must be between 0 and 5');
      return;
    }
    if (formData.reviews < 0) {
      toast.error('Reviews cannot be negative');
      return;
    }
    if (formData.discount < 0 || formData.discount > 100) {
      toast.error('Discount must be between 0 and 100');
      return;
    }

    setIsLoading(true);

    try {
      let img_url = formData.img_url;
      if (imageFile) {
        // Upload image
        const formDataImage = new FormData();
        formDataImage.append('file', imageFile);
        const imageResponse = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/upload-image`, formDataImage, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        img_url = imageResponse.data.img_url;
      }

      // Create product
      const productData = { ...formData, img_url };
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/products`, productData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Product added successfully');
      onClose();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || 'Failed to add product. Please try again.';
      toast.error(errorMessage);
      console.error('Error adding product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryAdded = () => {
    fetchCategories(); // Re-fetch categories to update the dropdown
    setShowCategoryModal(false); // Close the modal
  };

  return (
    <div className="relative bg-white rounded-2xl max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add New Product</h2>
              <p className="text-blue-100 text-sm">Fill in the details to create a new product</p>
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
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
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
                  className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Product brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="flex items-center gap-2"> {/* Added for button next to select */}
                  <select
                    name="category_id"
                    value={formData.category_id ?? ''}
                    onChange={handleChange}
                    className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter barcode"
                  required
                />
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
                  className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Product description..."
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-green-50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Pricing & Stock</h3>
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
                  className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
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
                  className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
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
                  className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="0"
                />
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
                  className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed"
                  placeholder="0.00"
                  readOnly
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Calculated as: Original Price - (Original Price × Discount %)
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
                  className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-purple-50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Product Image</h3>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Max file size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>
              {imagePreview && (
                <div className="lg:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-32 lg:h-40 object-cover rounded-xl border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rating & Reviews */}
          <div className="bg-yellow-50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">Rating & Reviews</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
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
                  className="text-gray-500 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                  placeholder="150"
                />
              </div>
            </div>
          </div>

          {/* Product Status */}
          <div className="bg-blue-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Status</h3>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_new"
                  checked={formData.is_new}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">New Product</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_favorite"
                  checked={formData.is_favorite}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">Featured Product</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding Product...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
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

export default AddProduct;