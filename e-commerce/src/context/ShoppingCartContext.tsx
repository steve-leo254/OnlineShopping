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
  img_url: string | string[] | null;
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

// Delivery fee configuration based on individual counties
const DELIVERY_FEES: Record<string, number> = {
  Nairobi: 300,
  Kiambu: 350,
  Machakos: 450,
  Kajiado: 400,
  Nyeri: 600,
  "Murang'a": 550,
  Kirinyaga: 500,
  Nyandarua: 800,
  Mombasa: 800,
  Kilifi: 1000,
  Kwale: 1200,
  "Tana River": 1500,
  Lamu: 1800,
  "Taita Taveta": 1400,
  Garissa: 1500,
  Wajir: 1800,
  Mandera: 2000,
  Marsabit: 1900,
  Isiolo: 1600,
  Meru: 900,
  "Tharaka Nithi": 750,
  Embu: 650,
  Kitui: 600,
  Makueni: 650,
  Nakuru: 500,
  Narok: 800,
  Kericho: 750,
  Bomet: 750,
  Kakamega: 1000,
  Vihiga: 950,
  Bungoma: 1100,
  Busia: 1000,
  Siaya: 950,
  Kisumu: 900,
  "Homa Bay": 1000,
  Migori: 1100,
  Kisii: 900,
  Nyamira: 900,
  Turkana: 2200,
  "West Pokot": 2000,
  Samburu: 2100,
  "Trans Nzoia": 1200,
  "Uasin Gishu": 800,
  "Elgeyo Marakwet": 1100,
  Nandi: 900,
  Baringo: 1300,
  Laikipia: 1000,
  default: 1000,
};

// Function to calculate delivery fee based on county
const calculateDeliveryFee = (county: string): number => {
  const normalizedCounty = county.trim();
  return DELIVERY_FEES[normalizedCounty] || DELIVERY_FEES["default"];
};

type ShoppingCartContext = {
  addToCart: (product: {
    id: number;
    name: string;
    price: number;
    img_url: string | string[] | null;
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
  getDeliveryFeeForLocation: (county: string) => number;
};

const ShoppingCartContext = createContext({} as ShoppingCartContext);

export function useShoppingCart() {
  return useContext(ShoppingCartContext);
}

export function ShoppingCartProvider({ children }: ShoppingCartProviderProps) {
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>(
    "shopping-cart",
    []
  );
  const [deliveryMethod, setDeliveryMethod] = useLocalStorage<DeliveryMethod>(
    "delivery-method",
    null
  );
  const [paymentMethod, setPaymentMethod] = useLocalStorage<PaymentMethod>(
    "payment-method",
    null
  );
  const [mpesaPhone, setMpesaPhone] = useLocalStorage<string | null>(
    "mpesa-phone",
    null
  );
  const [selectedAddress, setSelectedAddress] = useLocalStorage<Address | null>(
    "selected-address",
    null
  );

  const cartQuantity = cartItems.reduce(
    (quantity, item) => item.quantity + quantity,
    0
  );

  // Calculate subtotal from cartItems
  const subtotal = cartItems.reduce(
    (total, item) => total + item.quantity * item.price,
    0
  );

  // Calculate delivery fee based on delivery method and selected address
  const deliveryFee = (() => {
    if (deliveryMethod === "pickup") {
      return 0;
    }

    if (deliveryMethod === "delivery" && selectedAddress) {
      return calculateDeliveryFee(selectedAddress.region);
    }

    // Default delivery fee if delivery method is selected but no address
    return deliveryMethod === "delivery" ? 500 : 0;
  })();

  // Calculate total
  const total = subtotal + deliveryFee;

  function getItemQuantity(id: number) {
    return cartItems.find((item) => item.id === id)?.quantity || 0;
  }

  function addToCart(product: {
    id: number;
    name: string;
    price: number;
    img_url: string | string[] | null;
    stockQuantity: number;
  }) {
    setCartItems((currItems) => {
      if (currItems.find((item) => item.id === product.id) == null) {
        return [...currItems, { ...product, quantity: 1 }];
      } else {
        return currItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
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
  const getDeliveryFeeForLocation = (county: string): number => {
    return calculateDeliveryFee(county);
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
