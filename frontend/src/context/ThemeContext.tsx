import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
    theme: 'dark' | 'light' | 'emerald' | 'neon';
    uiStyle: 'glass' | 'neumorph';
    toggleTheme: () => void;
    toggleUIStyle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<'dark' | 'light' | 'emerald' | 'neon'>('dark');
    const [uiStyle, setUiStyle] = useState<'glass' | 'neumorph'>('glass');

    useEffect(() => {
        // Load theme and UI style from localStorage
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | 'emerald' | 'neon' | null;
        const savedUiStyle = localStorage.getItem('uiStyle') as 'glass' | 'neumorph' | null;

        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        if (savedUiStyle) {
            setUiStyle(savedUiStyle);
            document.documentElement.setAttribute('data-ui-style', savedUiStyle);
        } else {
            document.documentElement.setAttribute('data-ui-style', 'glass');
        }
    }, []);

    const toggleTheme = () => {
        let newTheme: 'dark' | 'light' | 'emerald' | 'neon';
        if (theme === 'dark') newTheme = 'light';
        else if (theme === 'light') newTheme = 'emerald';
        else if (theme === 'emerald') newTheme = 'neon';
        else newTheme = 'dark';

        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const toggleUIStyle = () => {
        const newStyle = uiStyle === 'glass' ? 'neumorph' : 'glass';
        setUiStyle(newStyle);
        localStorage.setItem('uiStyle', newStyle);
        document.documentElement.setAttribute('data-ui-style', newStyle);
    };

    return (
        <ThemeContext.Provider value={{ theme, uiStyle, toggleTheme, toggleUIStyle }}>
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
