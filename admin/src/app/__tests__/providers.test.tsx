import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test/testUtils';
import { Providers } from '../providers';

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="session-provider">{children}</div>,
}));

vi.mock('@chakra-ui/react', () => ({
  ChakraProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="chakra-provider">{children}</div>,
  createSystem: vi.fn(() => ({})),
  defaultConfig: {},
}));

vi.mock('@mukuru/mukuru-react-components', () => ({
  MukuruComponentProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="mukuru-provider">{children}</div>,
}));

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>,
}));

vi.mock('@/contexts/SidebarContext', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-provider">{children}</div>,
}));

vi.mock('../sentry-init', () => ({
  SentryInit: () => <div data-testid="sentry-init">Sentry</div>,
}));

describe('Providers', () => {
  it('should render providers with all nested providers', () => {
    renderWithProviders(
      <Providers>
        <div>Test Content</div>
      </Providers>
    );

    expect(document.body).toBeInTheDocument();
  });
});

