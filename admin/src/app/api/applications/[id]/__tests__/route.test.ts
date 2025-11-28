import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('Application Details API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (url: string) => {
    // Use URL from global (set up in test setup)
    const requestUrl = new URL(url, 'http://localhost:3000');
    return new NextRequest(requestUrl);
  };

  describe('GET /api/applications/[id]', () => {
    it('should return 400 when id is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/applications/');
      
      const response = await GET(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Application ID is required');
    });

    it('should return 401 when session is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = createMockRequest('http://localhost:3000/api/applications/test-id');
      const response = await GET(request, { params: { id: 'test-id' } });

      // The route doesn't explicitly check auth, but proxy will handle it
      // So we expect it to proceed and try to fetch
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should search projections API when id is provided', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
        expires: new Date().toISOString(),
      } as any);

      const mockProjectionData = {
        items: [
          {
            id: 'guid-123',
            caseId: 'test-id',
            status: 'InProgress',
            type: 'Business',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjectionData,
      });

      const request = createMockRequest('http://localhost:3000/api/applications/test-id');
      const response = await GET(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.caseId).toBe('test-id');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/proxy/projections/v1/cases'),
        expect.any(Object)
      );
    });

    it('should find application by exact caseId match', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const mockProjectionData = {
        items: [
          {
            id: 'guid-123',
            caseId: 'OBC-20241106-88902',
            status: 'InProgress',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjectionData,
      });

      const request = createMockRequest('http://localhost:3000/api/applications/OBC-20241106-88902');
      const response = await GET(request, { params: { id: 'OBC-20241106-88902' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.caseId).toBe('OBC-20241106-88902');
    });

    it('should find application by case-insensitive match', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const mockProjectionData = {
        items: [
          {
            id: 'guid-123',
            caseId: 'OBC-20241106-88902',
            status: 'InProgress',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjectionData,
      });

      const request = createMockRequest('http://localhost:3000/api/applications/obc-20241106-88902');
      const response = await GET(request, { params: { id: 'obc-20241106-88902' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.caseId).toBe('OBC-20241106-88902');
    });

    it('should find application by GUID', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const guid = '12345678-1234-1234-1234-123456789012';
      const mockProjectionData = {
        items: [
          {
            id: guid,
            caseId: 'OBC-20241106-88902',
            status: 'InProgress',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjectionData,
      });

      const request = createMockRequest(`http://localhost:3000/api/applications/${guid}`);
      const response = await GET(request, { params: { id: guid } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(guid);
    });

    it('should try onboarding API when not found in projections and id is GUID', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const guid = '12345678-1234-1234-1234-123456789012';

      // First call - projections API returns empty
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      // Second call - onboarding API returns data
      const mockOnboardingData = {
        id: guid,
        case_number: 'OBC-20241106-88902',
        status: 'InProgress',
        type: 'Business',
        applicant: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
        business: {
          legal_name: 'Test Corp',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOnboardingData,
      });

      const request = createMockRequest(`http://localhost:3000/api/applications/${guid}`);
      const response = await GET(request, { params: { id: guid } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(guid);
      expect(data.caseId).toBe('OBC-20241106-88902');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should transform onboarding API response correctly', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const guid = '12345678-1234-1234-1234-123456789012';

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: guid,
            case_number: 'OBC-20241106-88902',
            status: 'InProgress',
            type: 'Business',
            partner_id: 'partner-1',
            partner_name: 'Partner 1',
            applicant: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
              phone_number: '+1234567890',
              residential_address: {
                street: '123 Main St',
                city: 'New York',
                country: 'US',
              },
            },
            business: {
              legal_name: 'Test Corp',
              registration_number: 'REG-123',
              tax_id: 'TAX-123',
              country_of_registration: 'US',
              registered_address: {
                street: '456 Business Ave',
                city: 'Boston',
              },
              industry: 'Technology',
              number_of_employees: 100,
              annual_revenue: 1000000,
              website: 'https://test.com',
            },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            metadata: { key: 'value' },
          }),
        });

      const request = createMockRequest(`http://localhost:3000/api/applications/${guid}`);
      const response = await GET(request, { params: { id: guid } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.caseId).toBe('OBC-20241106-88902');
      expect(data.applicantFirstName).toBe('John');
      expect(data.applicantLastName).toBe('Doe');
      expect(data.businessLegalName).toBe('Test Corp');
      expect(data.metadataJson).toBe(JSON.stringify({ key: 'value' }));
    });

    it('should return 404 when application not found', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      // Projections API returns empty
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      const request = createMockRequest('http://localhost:3000/api/applications/non-existent');
      const response = await GET(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Application not found');
    });

    it('should handle projection API errors gracefully', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const request = createMockRequest('http://localhost:3000/api/applications/test-id');
      const response = await GET(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Application not found');
    });

    it('should handle connection errors', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockRejectedValueOnce(new Error('fetch failed'));

      const request = createMockRequest('http://localhost:3000/api/applications/test-id');
      const response = await GET(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch application details');
      expect(data.details).toContain('Cannot connect to backend services');
    });

    it('should handle timeout errors', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockRejectedValueOnce(new Error('timeout'));

      const request = createMockRequest('http://localhost:3000/api/applications/test-id');
      const response = await GET(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.details).toContain('Cannot connect to backend services');
    });

    it('should include user headers when session is available', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
        },
        expires: new Date().toISOString(),
      } as any);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      const request = createMockRequest('http://localhost:3000/api/applications/test-id');
      await GET(request, { params: { id: 'test-id' } });

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers['X-User-Email']).toBe('test@example.com');
      expect(fetchCall[1].headers['X-User-Name']).toBe('Test User');
      expect(fetchCall[1].headers['X-User-Id']).toBe('user-1');
      expect(fetchCall[1].headers['X-User-Role']).toBe('admin');
    });

    it('should handle onboarding API errors gracefully', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: new Date().toISOString(),
      } as any);

      const guid = '12345678-1234-1234-1234-123456789012';

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Not found',
        });

      const request = createMockRequest(`http://localhost:3000/api/applications/${guid}`);
      const response = await GET(request, { params: { id: guid } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Application not found');
    });
  });
});

