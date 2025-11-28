import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, render } from '@testing-library/react';
import { ClientOnlyMukuruLogo, ClientOnlyMukuruButton, ClientOnlyMukuruTypography } from '../MukuruComponents';

// Mock mukuruImports
vi.mock('@/lib/mukuruImports', () => ({
  MukuruLogo: ({ ...props }: any) => <div data-testid="mukuru-logo" {...props}>Logo</div>,
  Button: ({ children, ...props }: any) => <button data-testid="mukuru-button" {...props}>{children}</button>,
  Typography: ({ children, ...props }: any) => <p data-testid="mukuru-typography" {...props}>{children}</p>,
}));

describe('MukuruComponents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ClientOnlyMukuruLogo', () => {
    it('should render MukuruLogo component', () => {
      const { getByTestId } = render(<ClientOnlyMukuruLogo />);
      expect(getByTestId('mukuru-logo')).toBeInTheDocument();
    });

    it('should pass props to MukuruLogo', () => {
      const { getByTestId } = render(<ClientOnlyMukuruLogo className="test-class" />);
      const logo = getByTestId('mukuru-logo');
      expect(logo).toHaveAttribute('class', 'test-class');
    });
  });

  describe('ClientOnlyMukuruButton', () => {
    it('should render Button component with children', () => {
      const { getByTestId, getByText } = render(<ClientOnlyMukuruButton>Click me</ClientOnlyMukuruButton>);
      expect(getByTestId('mukuru-button')).toBeInTheDocument();
      expect(getByText('Click me')).toBeInTheDocument();
    });

    it('should pass props to Button', () => {
      const { getByTestId } = render(<ClientOnlyMukuruButton onClick={() => {}} disabled>Button</ClientOnlyMukuruButton>);
      const button = getByTestId('mukuru-button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('ClientOnlyMukuruTypography', () => {
    it('should render Typography component with children', () => {
      const { getByTestId, getByText } = render(<ClientOnlyMukuruTypography>Hello World</ClientOnlyMukuruTypography>);
      expect(getByTestId('mukuru-typography')).toBeInTheDocument();
      expect(getByText('Hello World')).toBeInTheDocument();
    });

    it('should pass props to Typography', () => {
      const { getByTestId } = render(<ClientOnlyMukuruTypography variant="h1">Title</ClientOnlyMukuruTypography>);
      const typography = getByTestId('mukuru-typography');
      expect(typography).toBeInTheDocument();
    });
  });
});

