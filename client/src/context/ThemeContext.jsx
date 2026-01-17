import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const root = window.document.documentElement;
        // Remove old class
        root.classList.remove(isDark ? 'light' : 'dark');
        // Add new class
        root.classList.add(isDark ? 'dark' : 'light');

        // Save to localStorage
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    useEffect(() => {
        // Check localStorage for saved theme preference on mount
        const saved = localStorage.getItem('theme');
        if (saved) {
            setIsDark(saved === 'dark');
        }
    }, []);

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
