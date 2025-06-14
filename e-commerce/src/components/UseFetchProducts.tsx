// Updated useFetchProducts hook to support category filtering

import { useState, useCallback } from 'react';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  price: number;
  img_url: string;
}

interface PaginatedProductsResponse {
  items: Product[];
  pages: number;
  total: number;
}

export const useFetchProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (page = 1, limit = 8, search = "", categoryId: number | null = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(categoryId && { category_id: categoryId })
      };

      const response = await axios.get<PaginatedProductsResponse>(`${import.meta.env.VITE_API_BASE_URL}/public/products`, { params });
      
      if (response.data) {
        setProducts(response.data.items || []);
        setTotalPages(response.data.pages || 0);
        setTotalItems(response.data.total || 0);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(error.response?.data?.detail || 'Failed to fetch products');
      setProducts([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    products,
    totalPages,
    totalItems,
    error,
    fetchProducts
  };
};