import { createContext, useContext, useState, useEffect } from 'react';
import { loginCustomer, registerCustomer, updateCustomerProfile, signOutAuth } from '../services/supabase-api';
import { supabase } from '../services/supabase';

const CustomerContext = createContext();

const STORAGE_KEY = 'miniy_customer';

export const CustomerProvider = ({ children }) => {
    const [customer, setCustomer] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
        catch { return null; }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isLoggedIn = Boolean(customer?.id);

    const saveCustomer = (data) => {
        setCustomer(data);
        if (data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    useEffect(() => {
        // Listen to Supabase Auth state changes for OAuth and OTP users
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                try {
                    const { data } = await supabase
                        .from('customers')
                        .select('*')
                        .eq('email', session.user.email)
                        .maybeSingle();

                    if (data) {
                        saveCustomer(data);
                    } else if (session.user.email) {
                        // Create profile for new OAuth / OTP user
                        const { data: newProfile } = await supabase
                            .from('customers')
                            .insert({
                                email: session.user.email,
                                name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                                password_hash: 'oauth_or_otp'
                            })
                            .select()
                            .single();
                        
                        if (newProfile) saveCustomer(newProfile);
                    }
                } catch (err) {
                    console.error('Error handling auth state change:', err);
                }
            } else if (event === 'SIGNED_OUT') {
                saveCustomer(null);
            }
            setLoading(false);
        });

        // Ensure loading state resolves
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

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

    const logout = async () => {
        setLoading(true);
        try {
            await signOutAuth();
        } catch (e) {
            console.error('Sign out error', e);
        }
        saveCustomer(null);
        setLoading(false);
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
