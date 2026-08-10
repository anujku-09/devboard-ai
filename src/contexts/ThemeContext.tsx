import { createContext } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export default ThemeContext;
