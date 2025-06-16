// ShoppingCartContext.tsx
import { createContext, useContext } from "react";
import { useLocalStorage } from "../cart/useLocalStorage"; // Adjust path as needed
import type { ReactNode } from "react";

type ShoppingCartProviderProps = {
  children: ReactNode;
};

type CartItem = {
  id: number;
  name: string;
  price: number;
  img_url: string | null;
  quantity: number;
  stockQuantity: number;
};

type Address = {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  city: string;
  region: string;
  is_default: boolean;
};

type DeliveryMethod = "pickup" | "delivery" | null;
type PaymentMethod = "pay-online" | "pay-later" | null;

// Delivery fee configuration based on region and city
const DELIVERY_FEES: Record<string, Record<string, number>> = {
  "Nairobi": {
    "Nairobi": 200, // KSh 200 within Nairobi city
    "Kiambu": 300,
    "Machakos": 400,
    "Kajiado": 350,
    "default": 500 // Default for other areas in Nairobi region
  },
  "Central": {
    "Nyeri": 600,
    "Murang'a": 550,
    "Kirinyaga": 700,
    "Nyandarua": 800,
    "Kiambu": 300,
    "default": 750
  },
  "Coast": {
    "Mombasa": 800,
    "Kilifi": 1000,
    "Kwale": 1200,
    "Malindi": 1100,
    "default": 1300
  },
  "Western": {
    "Kisumu": 900,
    "Kakamega": 1000,
    "Bungoma": 1100,
    "Vihiga": 950,
    "default": 1200
  },
  "Rift Valley": {
    "Nakuru": 500,
    "Eldoret": 800,
    "Naivasha": 400,
    "Kericho": 700,
    "default": 900
  },
  "Eastern": {
    "Machakos": 400,
    "Kitui": 600,
    "Makueni": 650,
    "Embu": 550,
    "default": 700
  },
  "Nyanza": {
    "Kisumu": 900,
    "Homa Bay": 1000,
    "Migori": 1100,
    "Siaya": 950,
    "default": 1200
  },
  "North Eastern": {
    "Garissa": 1500,
    "Wajir": 1800,
    "Mandera": 2000,
    "default": 1700
  },
  // Default for regions not listed
  "default": {
    "default": 1000
  }
};

// Function to calculate delivery fee based on region and city
const calculateDeliveryFee = (region: string, city: string): number => {
  const normalizedRegion = region.trim();
  const normalizedCity = city.trim();
  
  // Get region fees or default
  const regionFees = DELIVERY_FEES[normalizedRegion] || DELIVERY_FEES["default"];
  
  // Get city fee or region default
  return regionFees[normalizedCity] || regionFees["default"] || 1000;
};

type ShoppingCartContext = {
  addToCart: (product: {
    id: number;
    name: string;
    price: number;
    img_url: string | null;
    stockQuantity: number;
  }) => void;
  increaseCartQuantity: (id: number) => void;
  decreaseCartQuantity: (id: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  getItemQuantity: (id: number) => number;
  cartQuantity: number;
  cartItems: CartItem[];
  deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  mpesaPhone: string | null;
  setMpesaPhone: (phone: string | null) => void;
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
  deliveryFee: number;
  subtotal: number;
  total: number;
  getDeliveryFeeForLocation: (region: string, city: string) => number;
};

const ShoppingCartContext = createContext({} as ShoppingCartContext);

export function useShoppingCart() {
  return useContext(ShoppingCartContext);
}

export function ShoppingCartProvider({ children }: ShoppingCartProviderProps) {
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>("shopping-cart", []);
  const [deliveryMethod, setDeliveryMethod] = useLocalStorage<DeliveryMethod>("delivery-method", null);
  const [paymentMethod, setPaymentMethod] = useLocalStorage<PaymentMethod>("payment-method", null);
  const [mpesaPhone, setMpesaPhone] = useLocalStorage<string | null>("mpesa-phone", null);
  const [selectedAddress, setSelectedAddress] = useLocalStorage<Address | null>("selected-address", null);

  const cartQuantity = cartItems.reduce((quantity, item) => item.quantity + quantity, 0);

  // Calculate subtotal from cartItems
  const subtotal = cartItems.reduce((total, item) => total + item.quantity * item.price, 0);

  // Calculate delivery fee based on delivery method and selected address
  const deliveryFee = (() => {
    if (deliveryMethod === "pickup") {
      return 0;
    }
    
    if (deliveryMethod === "delivery" && selectedAddress) {
      return calculateDeliveryFee(selectedAddress.region, selectedAddress.city);
    }
    
    // Default delivery fee if delivery method is selected but no address
    return deliveryMethod === "delivery" ? 500 : 0;
  })();

  // Calculate total
  const total = subtotal + deliveryFee;

  function getItemQuantity(id: number) {
    return cartItems.find((item) => item.id === id)?.quantity || 0;
  }

  function addToCart(product: { id: number; name: string; price: number; img_url: string | null; stockQuantity: number }) {
    setCartItems((currItems) => {
      if (currItems.find((item) => item.id === product.id) == null) {
        return [...currItems, { ...product, quantity: 1 }];
      } else {
        return currItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
    });
  }

  function increaseCartQuantity(id: number) {
    setCartItems((currItems) =>
      currItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  function decreaseCartQuantity(id: number) {
    setCartItems((currItems) => {
      if (currItems.find((item) => item.id === id)?.quantity === 1) {
        return currItems.filter((item) => item.id !== id);
      } else {
        return currItems.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
    });
  }

  function removeFromCart(id: number) {
    setCartItems((currItems) => currItems.filter((item) => item.id !== id));
  }

  const clearCart = () => {
    setCartItems([]);
  };

  // Function to get delivery fee for any location (useful for preview)
  const getDeliveryFeeForLocation = (region: string, city: string): number => {
    return calculateDeliveryFee(region, city);
  };

  return (
    <ShoppingCartContext.Provider
      value={{
        addToCart,
        increaseCartQuantity,
        decreaseCartQuantity,
        removeFromCart,
        clearCart,
        getItemQuantity,
        cartItems,
        cartQuantity,
        deliveryMethod,
        setDeliveryMethod,
        paymentMethod,
        setPaymentMethod,
        mpesaPhone,
        setMpesaPhone,
        selectedAddress,
        setSelectedAddress,
        deliveryFee,
        subtotal,
        total,
        getDeliveryFeeForLocation,
      }}
    >
      {children}
    </ShoppingCartContext.Provider>
  );
}