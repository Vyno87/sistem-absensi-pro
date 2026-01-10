import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
    theme: 'dark' | 'light' | 'emerald';
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<'dark' | 'light' | 'emerald'>('dark');

    useEffect(() => {
        // Load theme from localStorage
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | 'emerald' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            // Default to dark theme
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    const toggleTheme = () => {
        let newTheme: 'dark' | 'light' | 'emerald';
        if (theme === 'dark') newTheme = 'light';
        else if (theme === 'light') newTheme = 'emerald';
        else newTheme = 'dark';

        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};
