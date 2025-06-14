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