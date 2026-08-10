import { useEffect, useState } from "react";
import ThemeContext from "./ThemeContext";
import type { Theme } from "./ThemeContext";

interface ThemeProviderProps {
    children: React.ReactNode;
}

const STORAGE_KEY = "devboard-theme";

function getInitialTheme(): Theme {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === "light" || stored === "dark") {
        return stored;
    }

    const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
    ).matches;

    return prefersDark ? "dark" : "light";
}

function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;

        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    function toggleTheme() {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export default ThemeProvider;
