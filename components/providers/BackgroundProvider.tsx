import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/store';

const STORAGE_KEY = '@nmlflow/background_id';
const CUSTOM_BG_KEY = '@nmlflow/custom_background';
const OVERLAY_KEY = '@nmlflow/background_overlay';

export interface BackgroundOption {
  id: string;
  name: string;
  type: 'gradient' | 'solid';
  colors: string[];
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: 'default', name: 'Тёмный', type: 'solid', colors: ['#0f0a1e', '#0f0a1e'] },
  { id: 'purple', name: 'Фиолетовый', type: 'gradient', colors: ['#1a0a2e', '#2d1b4e'] },
  { id: 'blue', name: 'Синий', type: 'gradient', colors: ['#0a1628', '#1a2d4e'] },
  { id: 'green', name: 'Зелёный', type: 'gradient', colors: ['#0a1e14', '#1b3d2f'] },
  { id: 'sunset', name: 'Закат', type: 'gradient', colors: ['#1a0a1e', '#2e1a1a'] },
  { id: 'ocean', name: 'Океан', type: 'gradient', colors: ['#0a1a2e', '#1a3a4e'] },
  { id: 'forest', name: 'Лес', type: 'gradient', colors: ['#0a1e0a', '#1a3e1a'] },
];

interface BackgroundContextValue {
  backgroundId: string;
  setBackground: (id: string) => Promise<void>;
  backgrounds: BackgroundOption[];
  isLoading: boolean;
}

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within BackgroundProvider');
  }
  return context;
}

interface BackgroundProviderProps {
  children: React.ReactNode;
}

export function BackgroundProvider({ children }: BackgroundProviderProps) {
  const { backgroundId, setBackgroundId, setCustomBackgroundUri, setBackgroundOverlay } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  // Load saved background on mount
  useEffect(() => {
    loadBackground();
  }, []);

  const loadBackground = async () => {
    try {
      const [savedId, savedCustomUri, savedOverlay] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(CUSTOM_BG_KEY),
        AsyncStorage.getItem(OVERLAY_KEY),
      ]);
      
      if (savedId && (BACKGROUND_OPTIONS.find(b => b.id === savedId) || savedId === 'custom' || savedId.startsWith('preset-'))) {
        setBackgroundId(savedId);
      }
      
      if (savedCustomUri) {
        setCustomBackgroundUri(savedCustomUri);
      }
      
      if (savedOverlay) {
        const overlayValue = parseFloat(savedOverlay);
        if (!isNaN(overlayValue)) {
          setBackgroundOverlay(overlayValue);
        }
      }
    } catch (error) {
      console.error('Failed to load background:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setBackground = async (id: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, id);
      setBackgroundId(id);
    } catch (error) {
      console.error('Failed to save background:', error);
      throw error;
    }
  };

  return (
    <BackgroundContext.Provider
      value={{
        backgroundId,
        setBackground,
        backgrounds: BACKGROUND_OPTIONS,
        isLoading,
      }}
    >
      {children}
    </BackgroundContext.Provider>
  );
}

export default BackgroundProvider;
