import axios from 'axios';
import { useState, useCallback } from 'react';
import type { AxiosError } from 'axios';

// Same Category and Product types as above
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
  created_at: string;
  barcode: number;
  user_id: number;
  category_id: number | null;
  brand: string | null;
  category: Category | null;
};

type PaginatedProductResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export const useFetchAdminProducts = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('token'); // Assumes token is stored

  const fetchProducts = useCallback(
    async (page: number = 1, limit: number = 10, search: string = '') => {
      if (!token) {
        setError('Please log in to view products.');
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get<PaginatedProductResponse>(
          `${import.meta.env.VITE_API_BASE_URL}/products`,
          {
            params: { page, limit, search },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setProducts(response.data.items);
        setTotalPages(response.data.pages);
        setTotalItems(response.data.total);
      } catch (error) {
        const axiosError = error as AxiosError<{ detail?: string }>;
        let errorMessage = 'Failed to fetch products. Please try again.';
        if (axiosError.response?.status === 403) {
          errorMessage = 'Admin access required.';
        } else if (axiosError.response?.status === 401) {
          errorMessage = 'Please log in again.';
        } else {
          errorMessage = axiosError.response?.data.detail || errorMessage;
        }
        setError(errorMessage);
        console.error('Error fetching products:', axiosError);
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  return { isLoading, products, totalPages, totalItems, error, fetchProducts };
};