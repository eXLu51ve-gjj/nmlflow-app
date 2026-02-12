import React, { createContext, useContext, useState, useCallback } from 'react';
import { SlideMenu } from '@/components/navigation/SlideMenu';

interface MenuContextType {
  openMenu: () => void;
  closeMenu: () => void;
  isMenuOpen: boolean;
}

const MenuContext = createContext<MenuContextType | null>(null);

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider');
  }
  return context;
}

interface MenuProviderProps {
  children: React.ReactNode;
}

export function MenuProvider({ children }: MenuProviderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openMenu = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <MenuContext.Provider value={{ openMenu, closeMenu, isMenuOpen }}>
      {children}
      <SlideMenu visible={isMenuOpen} onClose={closeMenu} />
    </MenuContext.Provider>
  );
}
