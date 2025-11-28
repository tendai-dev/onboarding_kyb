import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '@/test/testUtils';
import { ClientOnlyMukuruLogo, ClientOnlyMukuruButton, ClientOnlyMukuruTypography } from '../MukuruComponents';

vi.mock('@mukuru/mukuru-react-components', () => ({
  MukuruLogo: ({ height }: { height?: number }) => <div data-testid="mukuru-logo">Logo {height}</div>,
  Button: ({ children }: { children: React.ReactNode }) => <button data-testid="mukuru-button">{children}</button>,
  Typography: ({ children }: { children: React.ReactNode }) => <p data-testid="mukuru-typography">{children}</p>,
}));

describe('MukuruComponents', () => {
  it('should render ClientOnlyMukuruLogo', () => {
    renderWithProviders(<ClientOnlyMukuruLogo height={60} />);
    expect(document.body).toBeInTheDocument();
  });

  it('should render ClientOnlyMukuruButton', () => {
    renderWithProviders(<ClientOnlyMukuruButton>Click me</ClientOnlyMukuruButton>);
    expect(document.body).toBeInTheDocument();
  });

  it('should render ClientOnlyMukuruTypography', () => {
    renderWithProviders(<ClientOnlyMukuruTypography>Test text</ClientOnlyMukuruTypography>);
    expect(document.body).toBeInTheDocument();
  });
});

