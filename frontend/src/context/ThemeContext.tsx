import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
    mode: 'dark' | 'light';
    vibe: 'standard' | 'emerald' | 'neon' | 'ocean' | 'sunset';
    uiStyle: 'glass' | 'neumorph';
    toggleMode: () => void;
    toggleVibe: () => void;
    toggleUIStyle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<'dark' | 'light'>('dark');
    const [vibe, setVibe] = useState<'standard' | 'emerald' | 'neon' | 'ocean' | 'sunset'>('standard');
    const [uiStyle, setUiStyle] = useState<'glass' | 'neumorph'>('glass');

    useEffect(() => {
        const savedMode = localStorage.getItem('theme_mode') as 'dark' | 'light' | null;
        const savedVibe = localStorage.getItem('theme_vibe') as 'standard' | 'emerald' | 'neon' | 'ocean' | 'sunset' | null;
        const savedUiStyle = localStorage.getItem('uiStyle') as 'glass' | 'neumorph' | null;

        if (savedMode) {
            setMode(savedMode);
            document.documentElement.setAttribute('data-theme', savedMode);
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        if (savedVibe) {
            setVibe(savedVibe);
            document.documentElement.setAttribute('data-vibe', savedVibe);
        } else {
            document.documentElement.setAttribute('data-vibe', 'standard');
        }

        if (savedUiStyle) {
            setUiStyle(savedUiStyle);
            document.documentElement.setAttribute('data-ui-style', savedUiStyle);
        } else {
            document.documentElement.setAttribute('data-ui-style', 'glass');
        }
    }, []);

    const toggleMode = () => {
        const newMode = mode === 'dark' ? 'light' : 'dark';
        setMode(newMode);
        localStorage.setItem('theme_mode', newMode);
        document.documentElement.setAttribute('data-theme', newMode);
    };

    const toggleVibe = () => {
        const vibes: ('standard' | 'emerald' | 'neon' | 'ocean' | 'sunset')[] = ['standard', 'emerald', 'neon', 'ocean', 'sunset'];
        const currentIndex = vibes.indexOf(vibe);
        const nextIndex = (currentIndex + 1) % vibes.length;
        const newVibe = vibes[nextIndex];

        setVibe(newVibe);
        localStorage.setItem('theme_vibe', newVibe);
        document.documentElement.setAttribute('data-vibe', newVibe);
    };

    const toggleUIStyle = () => {
        const newStyle = uiStyle === 'glass' ? 'neumorph' : 'glass';
        setUiStyle(newStyle);
        localStorage.setItem('uiStyle', newStyle);
        document.documentElement.setAttribute('data-ui-style', newStyle);
    };

    return (
        <ThemeContext.Provider value={{ mode, vibe, uiStyle, toggleMode, toggleVibe, toggleUIStyle }}>
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
