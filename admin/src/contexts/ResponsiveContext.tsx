"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useBreakpointValue } from '@chakra-ui/react';

interface ResponsiveContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation: 'portrait' | 'landscape';
  touchDevice: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

export function ResponsiveProvider({ children }: { children: React.ReactNode }) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [touchDevice, setTouchDevice] = useState(false);
  
  const screenSize = useBreakpointValue({ 
    base: 'xs', 
    sm: 'sm', 
    md: 'md', 
    lg: 'lg', 
    xl: 'xl', 
    '2xl': '2xl' 
  }) as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false }) ?? false;
  const isDesktop = useBreakpointValue({ base: false, lg: true }) ?? false;

  useEffect(() => {
    // Detect touch device
    setTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // Detect orientation
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };
    
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  const value: ResponsiveContextType = {
    isMobile,
    isTablet,
    isDesktop,
    screenSize,
    orientation,
    touchDevice
  };

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
}

export function useResponsive() {
  const context = useContext(ResponsiveContext);
  if (context === undefined) {
    throw new Error('useResponsive must be used within a ResponsiveProvider');
  }
  return context;
}

// Mobile-specific utilities
export const mobileUtils = {
  // Touch-friendly button sizes
  getButtonSize: (isMobile: boolean) => isMobile ? 'lg' : 'md',
  
  // Mobile-optimized spacing
  getSpacing: (isMobile: boolean, mobile: string, desktop: string) => 
    isMobile ? mobile : desktop,
  
  // Mobile-friendly font sizes
  getFontSize: (isMobile: boolean, mobile: string, desktop: string) => 
    isMobile ? mobile : desktop,
  
  // Touch-friendly input sizes
  getInputSize: (isMobile: boolean) => isMobile ? 'lg' : 'md',
  
  // Mobile-optimized grid columns
  getGridColumns: (isMobile: boolean, mobile: number, desktop: number) => 
    isMobile ? mobile : desktop,
  
  // Mobile-friendly modal sizes
  getModalSize: (isMobile: boolean) => isMobile ? 'full' : 'xl',
  
  // Mobile-optimized padding
  getPadding: (isMobile: boolean, mobile: string, desktop: string) => 
    isMobile ? mobile : desktop,
  
  // Mobile-friendly margins
  getMargin: (isMobile: boolean, mobile: string, desktop: string) => 
    isMobile ? mobile : desktop
};
