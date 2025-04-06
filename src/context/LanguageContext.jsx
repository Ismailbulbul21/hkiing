import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const LanguageContext = createContext();

// Create a custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

// Create the provider component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Change language function
  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  // Create the value object
  const value = {
    language,
    changeLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 