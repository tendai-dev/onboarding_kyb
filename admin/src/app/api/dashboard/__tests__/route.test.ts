import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { auth } from '@/lib/auth';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('Dashboard API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: {
        email: 'test@example.com',
        name: 'Test User',
        id: 'user-123',
        role: 'admin',
      },
    });
  });

  it('should handle GET request successfully', async () => {
    const mockResponse = {
      generated_at: '2024-01-01T00:00:00Z',
      partner_id: 'partner-123',
      partner_name: 'Test Partner',
      cases: {
        total_cases: 100,
        active_cases: 50,
        completed_cases: 40,
        rejected_cases: 10,
      },
      performance: {
        average_completion_time_hours: 24,
        completion_rate: 0.95,
      },
      risk: {
        high_risk_cases: 5,
        medium_risk_cases: 20,
        low_risk_cases: 75,
      },
      compliance: {
        aml_screenings_pending: 3,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
    });

    const request = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.cases.totalCases).toBe(100);
  });

  it('should handle authentication failure', async () => {
    (auth as any).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(request);

    expect([401, 500]).toContain(response.status);
  });

  it('should handle backend error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => JSON.stringify({ error: 'Backend error' }),
      headers: new Headers(),
    });

    const request = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest('http://localhost:3000/api/dashboard');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});

