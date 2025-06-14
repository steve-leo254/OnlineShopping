import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';

// Define the AddressResponse type based on your backend model
interface AddressResponse {
  id: number;
  phone_number: string;
  user_id: number;
  street: string;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
}

// Define the error response type based on your backend's error format
interface ErrorResponse {
  detail: string | { type: string; loc: string[]; msg: string; input: string }[];
}

// Define the hook's return type
interface FetchAddressesResult {
  addresses: AddressResponse[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Custom hook to fetch addresses
export const useFetchAddresses = (): FetchAddressesResult => {
  const [addresses, setAddresses] = useState<AddressResponse[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const {token} = useAuth();

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);


    try {
      const response = await axios.get<AddressResponse[]>(
        `${import.meta.env.VITE_API_BASE_URL}/addresses/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAddresses(response.data);
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      let errorMessage = 'Failed to fetch addresses';
      if (axiosError.response?.data?.detail) {
        const detail = axiosError.response.data.detail;
        errorMessage =
          typeof detail === 'string'
            ? detail
            : detail.map((e) => e.msg).join(', ');
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  return { addresses, loading, error, refetch: fetchAddresses };
};

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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProducts = async (page: number = 1, limit: number = 10, search?: string, categoryId?: string | null) => {
    setIsLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/products?page=${page}&limit=${limit}`;
      if (search) url += `&search=${search}`;
      if (categoryId) url += `&category_id=${categoryId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.items || []);
      setTotalPages(data.pages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  return { products, isLoading, error, totalPages, fetchProducts };
};