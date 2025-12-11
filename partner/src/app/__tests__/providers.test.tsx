import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/testUtils';
import { Providers } from '../providers';

describe('Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render providers with children', () => {
    const { container } = renderWithProviders(
      <Providers>
        <div>Test Content</div>
      </Providers>
    );
    expect(container).toBeInTheDocument();
  });
});
