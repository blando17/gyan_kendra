import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext = createContext(null);

const KEY = "gyankendra.dark";

function initial() {
  try {
    const stored = localStorage.getItem(KEY);

    if (stored !== null) return stored === "true";
  } catch {
    // fall through to the system preference
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(initial);

  // Tailwind is configured with darkMode: 'class'.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);

    try {
      localStorage.setItem(KEY, String(darkMode));
    } catch {
      // Remembering the choice is optional.
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode((value) => !value), []);

  const value = useMemo(
    () => ({ darkMode, toggleDarkMode }),
    [darkMode, toggleDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) throw new Error("useTheme must be used inside ThemeProvider");

  return context;
}
