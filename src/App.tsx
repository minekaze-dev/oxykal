import React, { useState, useEffect } from 'react';
import { RevenueCalculatorMain } from './components/RevenueCalculatorMain';

export default function App() {
  // Dark mode state persisted in localStorage
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isp_crm_theme');
    if (saved !== null) return saved === 'dark';
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('isp_crm_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('isp_crm_theme', 'light');
    }
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <RevenueCalculatorMain
      darkMode={darkMode}
      onToggleDarkMode={handleToggleDarkMode}
    />
  );
}
