import { createContext, useContext, useState, useEffect } from 'react';
import { loginCustomer, registerCustomer, updateCustomerProfile } from '../services/appsScript';

const CustomerContext = createContext();

const STORAGE_KEY = 'miniy_customer';

export const CustomerProvider = ({ children }) => {
    const [customer, setCustomer] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
        catch { return null; }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isLoggedIn = Boolean(customer?.id);

    const saveCustomer = (data) => {
        setCustomer(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    const login = async ({ email, password }) => {
        setLoading(true); setError(null);
        try {
            const data = await loginCustomer({ email, password });
            saveCustomer(data.customer);
            return data.customer;
        } catch (err) {
            setError(err.message || 'Login failed');
            throw err;
        } finally { setLoading(false); }
    };

    const register = async ({ name, email, password, phone, address }) => {
        setLoading(true); setError(null);
        try {
            const data = await registerCustomer({ name, email, password, phone, address });
            saveCustomer(data.customer);
            return data.customer;
        } catch (err) {
            setError(err.message || 'Registration failed');
            throw err;
        } finally { setLoading(false); }
    };

    const logout = () => {
        setCustomer(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    const updateProfile = async (updates) => {
        if (!customer?.id) return;
        setLoading(true);
        try {
            const data = await updateCustomerProfile(customer.id, updates);
            const updated = { ...customer, ...updates };
            saveCustomer(updated);
            return updated;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally { setLoading(false); }
    };

    const clearError = () => setError(null);

    return (
        <CustomerContext.Provider value={{
            customer, isLoggedIn, loading, error,
            login, register, logout, updateProfile, clearError,
        }}>
            {children}
        </CustomerContext.Provider>
    );
};

export const useCustomer = () => {
    const ctx = useContext(CustomerContext);
    if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
    return ctx;
};
