import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SchoolInfo } from '../types';

interface ThemeContextType {
  schoolInfo: SchoolInfo | null;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  const fetchTheme = async () => {
    try {
      const { data, error } = await supabase
        .from('school_info')
        .select('id, name, logo, mission, vision, contact, type, level, primary_color, secondary_color')
        .single();
      
      if (data) {
        setSchoolInfo(data);
        applyTheme(data);
      }
    } catch (error) {
      console.error('Error fetching theme:', error);
    }
  };

  const applyTheme = (info: SchoolInfo) => {
    const root = document.documentElement;
    if (info.primary_color) {
      root.style.setProperty('--primary-color', info.primary_color);
    }
    if (info.secondary_color) {
      root.style.setProperty('--secondary-color', info.secondary_color);
    }
  };

  useEffect(() => {
    fetchTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ schoolInfo, refreshTheme: fetchTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
