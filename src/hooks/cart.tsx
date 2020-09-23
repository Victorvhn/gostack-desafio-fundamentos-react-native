import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:cart',
      );

      if (!storagedProducts) {
        return;
      }

      const convertedProducts: Product[] = JSON.parse(storagedProducts);

      setProducts([...convertedProducts]);
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const existentProduct = products.find(prdt => prdt.id === id);

      if (!existentProduct) {
        return;
      }

      const updatedProduct = {
        ...existentProduct,
        quantity: existentProduct.quantity + 1,
      };

      const filteredProducts = products.filter(prdt => prdt.id !== id);

      const newProducts = [...filteredProducts, updatedProduct];

      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const existentProduct = products.find(prdt => prdt.id === product.id);

      if (existentProduct) {
        await increment(product.id);
        return;
      }

      const newProduct = {
        ...product,
        quantity: 1,
      };

      const newProducts = [...products, newProduct];

      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(newProducts),
      );
    },
    [increment, products],
  );

  const decrement = useCallback(
    async id => {
      const existentProduct = products.find(prdt => prdt.id === id);

      if (!existentProduct) {
        return;
      }

      const filteredProducts = products.filter(prdt => prdt.id !== id);

      if (existentProduct.quantity - 1 <= 0) {
        const newProducts = [...filteredProducts];
        setProducts(newProducts);
        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify(newProducts),
        );
        return;
      }

      const updatedProduct = {
        ...existentProduct,
        quantity: existentProduct.quantity - 1,
      };

      const newProducts = [...filteredProducts, updatedProduct];

      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(newProducts),
      );
    },
    [setProducts, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
