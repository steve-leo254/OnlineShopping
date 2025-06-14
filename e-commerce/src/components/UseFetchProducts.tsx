// Updated useFetchProducts hook to support category filtering

import { useState, useCallback } from 'react';
import axios from 'axios';

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
  barcode?: string;
  created_at: string;
}

export const useFetchProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (page = 1, limit = 8, search = "", categoryId: string | null | undefined = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(categoryId && { category_id: categoryId })
      };

      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/public/products`, { params });
      
      if (response.data) {
        setProducts(response.data.items || []);
        setTotalPages(response.data.pages || 0);
        setTotalItems(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(axios.isAxiosError(error) ? error.response?.data?.detail || 'Failed to fetch products' : 'Failed to fetch products');
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