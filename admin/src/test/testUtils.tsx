import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import { MukuruComponentProvider } from '@mukuru/mukuru-react-components';
import { SidebarProvider } from '@/contexts/SidebarContext';

/**
 * Test wrapper that matches the actual app provider setup
 * Uses the same providers as the application (ChakraProvider + MukuruComponentProvider + SidebarProvider)
 */
function TestProviders({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={createSystem(defaultConfig)}>
      <MukuruComponentProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </MukuruComponentProvider>
    </ChakraProvider>
  );
}

/**
 * Custom render function that wraps components with Mukuru providers
 * Use this instead of the default render from @testing-library/react
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: TestProviders,
    ...options,
  });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

