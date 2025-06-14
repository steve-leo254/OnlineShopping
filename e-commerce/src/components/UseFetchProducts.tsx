
import { useState, useCallback } from "react";
import axios from "axios";

interface ApiProduct {
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

interface ApiResponse {
  items: ApiProduct[];
  pages: number;
  total: number;
}

export const useFetchProducts = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(
    async (
      page: number = 1,
      limit: number = 8,
      search: string = "",
      categoryId: string | null = null
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = {
          page,
          limit,
          ...(search && { search }),
          ...(categoryId && { category_id: categoryId }),
        };

        const response = await axios.get<ApiResponse>(
          `${import.meta.env.VITE_API_BASE_URL}/public/products`,
          { params }
        );

        if (response.data) {
          setProducts(response.data.items || []);
          setTotalPages(response.data.pages || 0);
          setTotalItems(response.data.total || 0);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch products"
        );
        setProducts([]);
        setTotalPages(0);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    products,
    totalPages,
    totalItems,
    error,
    fetchProducts,
  };
};