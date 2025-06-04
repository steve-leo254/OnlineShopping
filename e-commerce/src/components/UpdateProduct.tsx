import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import PopupContainer from "./PopUp";

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
  img_url: string | null;
  stock_quantity: number;
  description: string | null;
  barcode: number;
  category_id: number | null;
  brand: string | null;
  category: Category | null;
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

const UpdateProductModal: React.FC = () => {
  const { token, role } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [formData, setFormData] = useState<ProductForm>({
    name: "",
    cost: 0,
    price: 0,
    img_url: "",
    stock_quantity: 0,
    barcode: 0,
    category_id: null,
    brand: "",
    description: "",
  });
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // Fetch products and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get<{ items: Product[] }>(
            "http://localhost:8000/public/products",
            {
              params: { page: 1, limit: 100 },
            }
          ),
          axios.get<Category[]>("http://localhost:8000/public/categories"),
        ]);
        setProducts(productsResponse.data.items);
        setCategories(categoriesResponse.data);
      } catch (err) {
        toast.error("Failed to fetch data");
        console.error("Error fetching data:", err);
      }
    };
    fetchData();

    // Initialize Flowbite
    if (typeof window.initFlowbite === "function") {
      window.initFlowbite();
    }
  }, []);

  // Handle product selection
  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = Number(e.target.value);
    setSelectedProductId(productId);
    const product = products.find((p) => p.id === productId);
    if (product) {
      setFormData({
        name: product.name,
        cost: product.cost,
        price: product.price,
        img_url: product.img_url || "",
        stock_quantity: product.stock_quantity,
        barcode: product.barcode,
        category_id: product.category_id,
        brand: product.brand || "",
        description: product.description || "",
      });
      setError(null);
    } else {
      setFormData({
        name: "",
        cost: 0,
        price: 0,
        img_url: "",
        stock_quantity: 0,
        barcode: 0,
        category_id: null,
        brand: "",
        description: "",
      });
    }
  };

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "cost" ||
        name === "price" ||
        name === "stock_quantity" ||
        name === "barcode"
          ? Number(value) || 0
          : name === "category_id"
          ? value
            ? Number(value)
            : null
          : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || role !== "admin") {
      toast.error("Admin access required");
      return;
    }

    if (!selectedProductId) {
      toast.error("Please select a product to update");
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
    if (formData.stock_quantity < 0) {
      toast.error("Stock quantity cannot be negative");
      return;
    }
    if (formData.barcode <= 0) {
      toast.error("Barcode must be a positive number");
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      await axios.put(
        `http://localhost:8000/update-product/${selectedProductId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Product updated successfully");
      // Update local products list
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProductId
            ? {
                ...p,
                ...formData,
                category:
                  categories.find((c) => c.id === formData.category_id) || null,
              }
            : p
        )
      );
      // Close modal
      const modal = document.getElementById(
        "updateProductModal"
      ) as HTMLDivElement;
      if (modal) {
        modal.classList.add("hidden");
      }
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

    if (!selectedProductId) {
      toast.error("Please select a product to delete");
      return;
    }

    setIsDeleting(true);

    try {
      await axios.delete(
        `http://localhost:8000/delete-product/${selectedProductId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Product deleted successfully");
      // Remove from local products list
      setProducts((prev) => prev.filter((p) => p.id !== selectedProductId));
      setSelectedProductId(null);
      setFormData({
        name: "",
        cost: 0,
        price: 0,
        img_url: "",
        stock_quantity: 0,
        barcode: 0,
        category_id: null,
        brand: "",
        description: "",
      });
      // Show success modal
      setShowSuccessModal(true);
      // Close main modal
      const modal = document.getElementById(
        "updateProductModal"
      ) as HTMLDivElement;
      if (modal) {
        modal.classList.add("hidden");
      }
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

  return (
    <>
      {/* Update modal */}
      <div
        id="updateProductModal"
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
                Update Product
              </h3>
              <button
                type="button"
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                data-modal-toggle="updateProductModal"
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
                    htmlFor="product_select"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Select product to edit
                  </label>
                  <select
                    id="product_select"
                    value={selectedProductId ?? ""}
                    onChange={handleProductSelect}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (${product.price})
                      </option>
                    ))}
                  </select>
                </div>
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
                    placeholder="Product name"
                    required
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
                    step="0.01"
                    min="0"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Product price"
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
                    step="0.01"
                    min="0"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Product cost"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="stock_quantity"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    id="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    min="0"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Stock quantity"
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
                    placeholder="Barcode"
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
                    value={formData.category_id ?? ""}
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
                <div className="sm:col-span-2">
                  <label
                    htmlFor="img_url"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Image URL
                  </label>
                  <input
                    type="text"
                    name="img_url"
                    id="img_url"
                    value={formData.img_url}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="https://example.com/image.jpg"
                  />
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

              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  className={`bg-blue-600 text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 ${
                    isUpdating ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Update product"}
                </button>
                <button
                  id="successButton"
                  data-modal-target="successModal"
                  data-modal-toggle="successModal"
                  type="button"
                  className="text-red-600 inline-flex items-center hover:text-white border border-red-600 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900"
                >
                  <svg
                    className="mr-1 -ml-1 w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Delete
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <PopupContainer products={products} />
    </>
  );
};

export default UpdateProductModal;
