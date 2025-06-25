import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  Eye,
} from "lucide-react";
import { useFetchProducts } from "./UseFetchProducts";
import UpdateProductModal from "./UpdateProductModal";
import AddProduct from "./AddProduct";
import { formatCurrency } from "../cart/formatCurrency";
import { useAuth } from "../context/AuthContext";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  cost?: number;
  rating?: number;
  reviews?: number;
  img_url?: string;
  category?: { id: string; name: string };
  brand?: string;
  stock_quantity: number;
  discount?: number;
  is_new?: boolean;
  is_favorite?: boolean;
  description?: string;
  created_at: string;
}

interface StockStatus {
  text: string;
  color: string;
}

const ProductsTable: React.FC = () => {
  const { isLoading, products, totalPages, totalItems, error, fetchProducts } =
    useFetchProducts();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedStockLevel, setSelectedStockLevel] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [selectedProductForEdit, setSelectedProductForEdit] =
    useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const { token } = useAuth();

  const limit = 10;

  useEffect(() => {
    fetchProducts(currentPage, limit, searchQuery, selectedCategory);
  }, [currentPage, searchQuery, selectedCategory, fetchProducts]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/public/categories`
      );
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleAddModalClose = () => {
    setShowAddModal(false);
    fetchProducts(currentPage, limit, searchQuery, selectedCategory);
  };

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  const getPaginationItems = () => {
    const items: React.ReactNode[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      items.push(
        <button
          key="1"
          onClick={() => handlePageChange(1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          1
        </button>
      );
      if (startPage > 2) {
        items.push(
          <span key="start-ellipsis" className="px-3 py-2 text-gray-500">
            ...
          </span>
        );
      }
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            page === currentPage
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          {page}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <span key="end-ellipsis" className="px-3 py-2 text-gray-500">
            ...
          </span>
        );
      }
      items.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          {totalPages}
        </button>
      );
    }

    return items;
  };

  const getStockStatus = (stock: number): StockStatus => {
    if (stock > 20)
      return { text: "In Stock", color: "bg-emerald-100 text-emerald-800" };
    if (stock > 5)
      return { text: "Low Stock", color: "bg-amber-100 text-amber-800" };
    return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
  };

  const toggleDropdown = (productId: string) => {
    setOpenDropdown(openDropdown === productId ? null : productId);
  };

  const handleEdit = (product: Product) => {
    setSelectedProductForEdit(product);
    setShowUpdateModal(true);
    setOpenDropdown(null);
  };

  const handleModalClose = () => {
    setShowUpdateModal(false);
    setSelectedProductForEdit(null);
    fetchProducts(currentPage, limit, searchQuery, selectedCategory);
  };

  const handleDelete = async (product: Product) => {
    if (
      !confirm(
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/delete-product/${product.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      // Refresh the products list
      fetchProducts(currentPage, limit, searchQuery, selectedCategory);
      setOpenDropdown(null);

      // Show success message
      alert("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
    }
  };

  // Get unique brands from current products
  const uniqueBrands = [...new Set(products.map((product) => product.brand))];

  // Filter products based on local filters (brand, stock level, price range)
  const filteredProducts = products.filter((product) => {
    if (selectedBrand && product.brand !== selectedBrand) return false;
    if (selectedStockLevel) {
      const stock = product.stock_quantity;
      if (selectedStockLevel === "In Stock" && stock <= 20) return false;
      if (selectedStockLevel === "Low Stock" && (stock <= 5 || stock > 20))
        return false;
      if (selectedStockLevel === "Out of Stock" && stock > 0) return false;
    }
    if (minPrice && product.price < parseFloat(minPrice)) return false;
    if (maxPrice && product.price > parseFloat(maxPrice)) return false;
    return true;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest(".dropdown-container")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Calculate stats based on all products
  const inStockCount = products.filter((p) => p.stock_quantity > 0).length;
  const lowStockCount = products.filter((p) => p.stock_quantity <= 5).length;

  // Type mapping function to convert Product to UpdateProductModal's Product type
  const mapToUpdateProduct = (product: Product) => {
    const mappedProduct = {
      ...product,
      id: Number(product.id),
      barcode: 0,
      category_id: product.category ? Number(product.category.id) : null,
      category: product.category
        ? {
            id: Number(product.category.id),
            name: product.category.name,
            description: null,
          }
        : null,
      cost: product.cost ?? 0,
      original_price: product.original_price ?? product.price,
      rating: product.rating ?? 0,
      reviews: product.reviews ?? 0,
      discount: product.discount ?? 0,
      is_new: product.is_new ?? false,
      is_favorite: product.is_favorite ?? false,
      description: product.description ?? null,
      brand: product.brand ?? null,
      img_url: product.img_url ?? null,
    };
    return mappedProduct;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          </div>
          <p className="text-gray-600">
            Manage your product inventory and track performance
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inStockCount}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lowStockCount}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Eye className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Table Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="text-gray-500 w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    showFilters
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </button>

                <button
                  onClick={handleAddProduct}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <select
                    className="text-gray-500 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                  >
                    <option value="">All Brands</option>
                    {uniqueBrands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                  <select
                    className="text-gray-500 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedStockLevel}
                    onChange={(e) => setSelectedStockLevel(e.target.value)}
                  >
                    <option value="">All Stock Levels</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                  <select
                    className="text-gray-500 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedCategory || ""}
                    onChange={(e) =>
                      handleCategoryFilter(
                        e.target.value ? e.target.value : null
                      )
                    }
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Product
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Price
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Original Price
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Stock
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Brand
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Category
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Rating
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">
                          Loading products...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stock_quantity);
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {product.img_url && (
                              <img
                                src={`${import.meta.env.VITE_API_BASE_URL}${
                                  product.img_url
                                }`}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {product.name}
                              </h3>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(product.price)}
                          </span>
                          {product.discount !== undefined &&
                            product.discount > 0 && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                -{product.discount}%
                              </span>
                            )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-500 line-through">
                            {formatCurrency(product.original_price ?? 0)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-900">
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            {product.brand}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-600">
                            {product.category?.name || "No category"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-0.5">
                            {Array.isArray(product.reviews) &&
                            product.reviews.length > 0 ? (
                              (() => {
                                const count = product.reviews.length;
                                const avg =
                                  product.reviews.reduce(
                                    (sum, r) => sum + (r.rating || 0),
                                    0
                                  ) / count;
                                return (
                                  <span className="text-sm text-gray-800">
                                    {avg.toFixed(1)}{" "}
                                    <span className="text-yellow-400">★</span>{" "}
                                    from {count} review{count > 1 ? "s" : ""}
                                  </span>
                                );
                              })()
                            ) : typeof product.rating === "number" &&
                              typeof product.reviews === "number" &&
                              product.reviews > 0 ? (
                              <span className="text-sm text-gray-800">
                                {product.rating.toFixed(1)}{" "}
                                <span className="text-yellow-400">★</span> from{" "}
                                {product.reviews} review
                                {product.reviews > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">
                                No reviews
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}
                          >
                            {stockStatus.text}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="relative dropdown-container">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleDropdown(product.id);
                              }}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openDropdown === product.id && (
                              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleEdit(product);
                                  }}
                                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                  Edit Product
                                </button>
                                <hr className="my-1 border-gray-100" />
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete(product);
                                  }}
                                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Product
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {startItem}-{endItem}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {totalItems}
                </span>{" "}
                products
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-200 bg-white border border-gray-300"
                  }`}
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {getPaginationItems()}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-200 bg-white border border-gray-300"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showUpdateModal && (
        <UpdateProductModal
          isOpen={showUpdateModal}
          onClose={handleModalClose}
          productToEdit={
            selectedProductForEdit
              ? mapToUpdateProduct(selectedProductForEdit)
              : null
          }
        />
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto overflow-hidden">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={handleAddModalClose}
            ></div>
            <div className="relative inline-block w-full max-w-4xl overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-xl sm:align-middle">
              <AddProduct onClose={handleAddModalClose} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
