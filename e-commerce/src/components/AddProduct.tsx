import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

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
  img_url: string;
  stock_quantity: number;
  barcode: number;
  category_id: number | null;
  brand: string;
  description: string;
};

const AddProduct: React.FC = () => {
  const { token, role } = useAuth();
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    cost: 0,
    price: 0,
    img_url: '',
    stock_quantity: 0,
    barcode: 0,
    category_id: null,
    brand: '',
    description: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<Category[]>('http://localhost:8000/public/categories');
        setCategories(response.data);
      } catch (err) {
        toast.error('Failed to fetch categories');
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();

    // Initialize Flowbite
    if (typeof window.initFlowbite === 'function') {
      window.initFlowbite();
    }
  }, []);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'cost' || name === 'price' || name === 'stock_quantity' || name === 'barcode'
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

    if (!token || role !== 'admin') {
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
    if (formData.stock_quantity < 0) {
      toast.error('Stock quantity cannot be negative');
      return;
    }
    if (formData.barcode <= 0) {
      toast.error('Barcode must be a positive number');
      return;
    }

    setIsLoading(true);

    try {
      let img_url = formData.img_url;
      if (imageFile) {
        // Upload image
        const formDataImage = new FormData();
        formDataImage.append('file', imageFile);
        const imageResponse = await axios.post('http://localhost:8000/upload-image', formDataImage, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        img_url = imageResponse.data.img_url;
      }

      // Create product
      const productData = { ...formData, img_url };
      await axios.post('http://localhost:8000/products', productData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Product added successfully');
      window.location.reload(); 
      // Reset form
      setFormData({
        name: '',
        cost: 0,
        price: 0,
        img_url: '',
        stock_quantity: 0,
        barcode: 0,
        category_id: null,
        brand: '',
        description: '',
      });
      setImageFile(null);
      setImagePreview(null);
      // Close modal
      const modal = document.getElementById('createProductModal') as HTMLDivElement;
      if (modal) {
        modal.classList.add('hidden');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || 'Failed to add product. Please try again.';
      toast.error(errorMessage);
      console.error('Error adding product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
  
      {/* Create modal */}
      <div
        id="createProductModal"
        tabIndex={-1}
        aria-hidden="true"
        className="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
      >
        <div className="relative p-4 w-full max-w-2xl max-h-full">
          {/* Modal content */}
          <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
            {/* Modal header */}
            <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Product
              </h3>
              <button
                type="button"
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                data-modal-target="createProductModal"
                data-modal-toggle="createProductModal"
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            {/* Modal body */}
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 mb-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Type product name"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="brand"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    id="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Product brand"
                  />
                </div>
                <div>
                  <label
                    htmlFor="price"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="$2999"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="cost"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Cost
                  </label>
                  <input
                    type="number"
                    name="cost"
                    id="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="$1999"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="stock_quantity"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Stock
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    id="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    min="0"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="200"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="barcode"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Barcode
                  </label>
                  <input
                    type="number"
                    name="barcode"
                    id="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    min="0"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Enter barcode"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="category_id"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Category
                  </label>
                  <select
                    name="category_id"
                    id="category_id"
                    value={formData.category_id ?? ''}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="image"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Product Image
                  </label>
                  <input
                    type="file"
                    name="image"
                    id="image"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  />
                  {imagePreview && (
                    <div className="mt-4">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="description"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Write product description here"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`bg-blue-600 text-white inline-flex items-center bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg
                  className="mr-1 -ml-1 w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {isLoading ? 'Adding Product...' : 'Add new product'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddProduct;