

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { translations } from '../i18n/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, ...args: (string | number)[]) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): string => {
  if (typeof navigator === "undefined") {
    return 'en';
  }
  const browserLang = navigator.language.split(/[-_]/)[0];
  return Object.keys(translations).includes(browserLang) ? browserLang : 'en';
};


export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage);

  const t = useCallback((key: string, ...args: (string | number)[]): any => {
    const langTranslations = translations[language as keyof typeof translations] || translations['en'];
    
    let value = key.split('.').reduce((obj, k) => (obj as any)?.[k], langTranslations);

    if (value === undefined) {
        // Fallback to English if key not found in current language
        value = key.split('.').reduce((obj, k) => (obj as any)?.[k], translations['en']);
    }

    if (value === undefined) {
        console.warn(`Translation key '${key}' not found in '${language}' or fallback 'en'.`);
        return key;
    }

    if (typeof value === 'string' && args.length > 0) {
        let strValue = value;
        args.forEach((arg, index) => {
            const placeholder = `{${index}}`;
            strValue = strValue.replace(new RegExp(placeholder.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g'), String(arg));
        });
        return strValue;
    }

    return value;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};