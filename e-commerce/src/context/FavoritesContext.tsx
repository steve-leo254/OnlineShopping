import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

interface FavoritesContextType {
  favorites: Set<string>;
  isFavorite: (productId: string) => boolean;
  addFavorite: (productId: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: new Set(),
  isFavorite: () => false,
  addFavorite: async () => {},
  removeFavorite: async () => {},
  refreshFavorites: async () => {},
});

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, token } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setFavorites(new Set());
      return;
    }
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/favorites`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const ids = res.data.map((fav: any) => fav.product_id.toString());
      setFavorites(new Set(ids));
    } catch {
      setFavorites(new Set());
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = (productId: string) => favorites.has(productId);

  const addFavorite = async (productId: string) => {
    setFavorites((prev) => new Set(prev).add(productId));
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/favorites`,
        { product_id: parseInt(productId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchFavorites();
    } catch {
      setFavorites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const removeFavorite = async (productId: string) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/favorites`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const fav = res.data.find(
        (f: any) => f.product_id === parseInt(productId)
      );
      if (fav) {
        await axios.delete(
          `${import.meta.env.VITE_API_BASE_URL}/favorites/${fav.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      fetchFavorites();
    } catch {
      setFavorites((prev) => new Set(prev).add(productId));
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        addFavorite,
        removeFavorite,
        refreshFavorites: fetchFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
