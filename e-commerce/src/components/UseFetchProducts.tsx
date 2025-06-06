import axios from 'axios';
import { useState, useCallback } from 'react';
import type { AxiosError } from 'axios';

// Define the Category type
type Category = {
  id: number;
  name: string;
  description: string | null;
};

// Define the Product type
export type Product = {
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

// Define the PaginatedProductResponse type
type PaginatedProductResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export const useFetchProducts = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(
    async (page: number = 1, limit: number = 8, search: string = '') => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get<PaginatedProductResponse>(
          'http://localhost:8000/public/products',
          {
            params: { page, limit, search },
          }
        );

        setProducts(response.data.items);
        setTotalPages(response.data.pages);
        setTotalItems(response.data.total);
      } catch (error) {
        const axiosError = error as AxiosError<{ detail?: string }>;
        const errorMessage =
          axiosError.response?.data.detail ||
          'Failed to fetch products. Please try again.';
        setError(errorMessage);
        console.error('Error fetching products:', axiosError);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isLoading, products, totalPages, totalItems, error, fetchProducts };
};