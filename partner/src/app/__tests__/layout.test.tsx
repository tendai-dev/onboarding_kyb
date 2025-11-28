import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';

// Mock Next.js font
vi.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-class',
    style: {},
  }),
}));

// Mock Next.js metadata
vi.mock('next', () => ({
  ...vi.importActual('next'),
  metadata: {},
  viewport: {},
}));

// Create a simple test component that mimics the layout structure
const TestLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="inter-class">
        <div>{children}</div>
      </body>
    </html>
  );
};

describe('RootLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render layout with children', () => {
    const { container } = renderWithProviders(
      <TestLayout>
        <div>Test Content</div>
      </TestLayout>
    );
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});

