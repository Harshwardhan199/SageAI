import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const ACCENT_COLORS = {
  blue: { primary: "#155dfc", hover: "#1d4ed8" },
  purple: { primary: "#8b5cf6", hover: "#7c3aed" },
  emerald: { primary: "#10b981", hover: "#059669" },
  orange: { primary: "#f97316", hover: "#ea580c" },
};

export const ThemeProvider = ({ children }) => {
  // Theme State
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("sage_theme") || "system";
  });

  // Accent Color State
  const [accentColor, setAccentColorState] = useState(() => {
    return localStorage.getItem("sage_accent") || "blue";
  });

  // Chat Settings States
  const [autoScroll, setAutoScrollState] = useState(() => {
    const val = localStorage.getItem("sage_auto_scroll");
    return val !== null ? JSON.parse(val) : true;
  });

  const [showTimestamps, setShowTimestampsState] = useState(() => {
    const val = localStorage.getItem("sage_show_timestamps");
    return val !== null ? JSON.parse(val) : false;
  });

  const [enableMarkdown, setEnableMarkdownState] = useState(() => {
    const val = localStorage.getItem("sage_enable_markdown");
    return val !== null ? JSON.parse(val) : true;
  });

  const [animateAI, setAnimateAIState] = useState(() => {
    const val = localStorage.getItem("sage_animate_ai");
    return val !== null ? JSON.parse(val) : true;
  });

  // Setters that persist and update states
  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("sage_theme", newTheme);
  };

  const setAccentColor = (newAccent) => {
    if (ACCENT_COLORS[newAccent]) {
      setAccentColorState(newAccent);
      localStorage.setItem("sage_accent", newAccent);
    }
  };

  const setAutoScroll = (val) => {
    setAutoScrollState(val);
    localStorage.setItem("sage_auto_scroll", JSON.stringify(val));
  };

  const setShowTimestamps = (val) => {
    setShowTimestampsState(val);
    localStorage.setItem("sage_show_timestamps", JSON.stringify(val));
  };

  const setEnableMarkdown = (val) => {
    setEnableMarkdownState(val);
    localStorage.setItem("sage_enable_markdown", JSON.stringify(val));
  };

  const setAnimateAI = (val) => {
    setAnimateAIState(val);
    localStorage.setItem("sage_animate_ai", JSON.stringify(val));
  };

  // Apply Theme & Accent Color Changes
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let isDark = false;
      if (theme === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = theme === "dark";
      }

      if (isDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    };

    applyTheme();

    // Listen for system theme changes if using system
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const colors = ACCENT_COLORS[accentColor] || ACCENT_COLORS.blue;
    root.style.setProperty("--accent", colors.primary);
    root.style.setProperty("--accent-hover", colors.hover);
  }, [accentColor]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        accentColor,
        setAccentColor,
        autoScroll,
        setAutoScroll,
        showTimestamps,
        setShowTimestamps,
        enableMarkdown,
        setEnableMarkdown,
        animateAI,
        setAnimateAI,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
