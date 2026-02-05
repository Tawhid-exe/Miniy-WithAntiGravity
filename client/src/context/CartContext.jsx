import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (product) => {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems((prev) => prev.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    const checkout = async (shippingInfo, paymentInfo = { id: "sample_payment_id", status: "succeeded" }) => {
        try {
            // Transform cart items to match backend Order schema
            // Assuming item has: _id, name, price, images (array) or image (string)
            const orderItems = cartItems.map((item) => ({
                product: item._id || item.id,
                name: item.name,
                price: item.price,
                image: item.images?.[0]?.url || item.image || "https://placeholder.com/img.jpg",
                quantity: item.quantity,
                costPrice: item.costPrice || 0 // Snapshot cost price
            }));

            const itemsPrice = getCartTotal();
            const taxPrice = 0; // consistent with current logic
            const shippingPrice = 0; // consistent with current logic
            const totalPrice = itemsPrice + taxPrice + shippingPrice;

            const orderData = {
                shippingInfo,
                orderItems,
                paymentInfo,
                itemsPrice,
                taxPrice,
                shippingPrice,
                totalPrice,
            };

            const { data } = await api.post('/order/new', orderData);
            clearCart(); // Clear cart on successful order
            return data;
        } catch (error) {
            console.error("Checkout failed:", error);
            throw error; // Let component handle UI feedback
        }
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getCartTotal,
                getCartCount,
                checkout, // Expose checkout
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
