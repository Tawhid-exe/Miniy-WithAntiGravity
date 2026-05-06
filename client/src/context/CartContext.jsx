import { createContext, useContext, useState, useEffect } from 'react';
import { submitOrder } from '../services/appsScript';

const CartContext = createContext();

const CART_KEY = 'miniy_cart';

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
        catch { return []; }
    });

    // Persist cart to localStorage on every change
    useEffect(() => {
        localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    alert(`Sorry, only ${product.stock} items are available in stock.`);
                    return prev;
                }
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            if (product.stock <= 0) {
                alert('Sorry, this item is out of stock.');
                return prev;
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) { removeFromCart(productId); return; }
        setCartItems(prev =>
            prev.map(item => {
                if (item.id === productId) {
                    if (quantity > item.stock) {
                        alert(`Sorry, only ${item.stock} items are available in stock.`);
                        return item;
                    }
                    return { ...item, quantity };
                }
                return item;
            })
        );
    };

    const clearCart = () => setCartItems([]);

    const getCartTotal = () =>
        cartItems.reduce((total, item) => {
            const price = item.isOnSale ? (item.salePrice || item.price) : item.price;
            return total + price * item.quantity;
        }, 0);

    const getCartCount = () =>
        cartItems.reduce((count, item) => count + item.quantity, 0);

    // Called from Checkout page
    const checkout = async ({ customerId, customerName, phone, address, notes }) => {
        const items = cartItems.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            price: item.isOnSale ? (item.salePrice || item.price) : item.price,
            quantity: item.quantity,
            image: item.images?.[0] || '',
        }));
        const totalPrice = getCartTotal();

        const result = await submitOrder({
            customerId: customerId || '',
            customerName,
            phone,
            address,
            items,
            totalPrice,
            notes: notes || '',
        });

        clearCart();
        return result;
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartCount,
            checkout,
        }}>
            {children}
        </CartContext.Provider>
    );
};
