// Contract Tests using Pact
// Ensures API contract compatibility between services
// Run with: npm test

const { Pact } = require('@pact-foundation/pact');
const { like, iso8601DateTime, uuid } = require('@pact-foundation/pact/dsl/matchers');
const axios = require('axios');
const path = require('path');

// Provider: onboarding-api
// Consumer: partner-portal

describe('Onboarding API Contract Tests', () => {
  const provider = new Pact({
    consumer: 'partner-portal',
    provider: 'onboarding-api',
    port: 9001,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'info',
  });

  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());
  afterEach(() => provider.verify());

  describe('POST /onboarding/v1/cases', () => {
    beforeEach(() => {
      return provider.addInteraction({
        state: 'partner exists with valid token',
        uponReceiving: 'a request to create an onboarding case',
        withRequest: {
          method: 'POST',
          path: '/onboarding/v1/cases',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token',
            'Idempotency-Key': like('550e8400-e29b-41d4-a716-446655440000'),
          },
          body: {
            type: 'Individual',
            partner_id: uuid('00000000-0000-0000-0000-000000000001'),
            partner_reference_id: like('PART-12345'),
            applicant: {
              first_name: like('John'),
              last_name: like('Doe'),
              date_of_birth: iso8601DateTime('1990-01-01'),
              email: like('john.doe@example.com'),
              phone_number: like('+1234567890'),
              residential_address: {
                street: like('123 Main St'),
                city: like('New York'),
                state: like('NY'),
                postal_code: like('10001'),
                country: like('US'),
              },
              nationality: like('US'),
            },
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': like('req-uuid'),
            'Location': like('/onboarding/v1/cases/uuid'),
          },
          body: {
            data: {
              id: uuid(),
              case_number: like('OBC-20251021-12345'),
            },
            meta: {
              request_id: uuid(),
              timestamp: iso8601DateTime(),
            },
          },
        },
      });
    });

    it('creates an onboarding case', async () => {
      const response = await axios.post(
        'http://localhost:9001/onboarding/v1/cases',
        {
          type: 'Individual',
          partner_id: '00000000-0000-0000-0000-000000000001',
          partner_reference_id: 'PART-12345',
          applicant: {
            first_name: 'John',
            last_name: 'Doe',
            date_of_birth: '1990-01-01',
            email: 'john.doe@example.com',
            phone_number: '+1234567890',
            residential_address: {
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              postal_code: '10001',
              country: 'US',
            },
            nationality: 'US',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token',
            'Idempotency-Key': '550e8400-e29b-41d4-a716-446655440000',
          },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.data.id).toBeDefined();
      expect(response.data.data.case_number).toMatch(/^OBC-/);
    });
  });

  describe('GET /onboarding/v1/cases/{id}', () => {
    const caseId = '550e8400-e29b-41d4-a716-446655440000';

    beforeEach(() => {
      return provider.addInteraction({
        state: 'case exists with given id',
        uponReceiving: 'a request to get an onboarding case',
        withRequest: {
          method: 'GET',
          path: `/onboarding/v1/cases/${caseId}`,
          headers: {
            'Authorization': 'Bearer valid-token',
            'Accept': 'application/json',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'ETag': like('"v1-abc123"'),
            'X-Request-Id': like('req-uuid'),
          },
          body: {
            data: {
              id: uuid(caseId),
              case_number: like('OBC-20251021-12345'),
              type: like('Individual'),
              status: like('Draft'),
              partner_id: uuid(),
              created_at: iso8601DateTime(),
              updated_at: iso8601DateTime(),
            },
            meta: {
              request_id: uuid(),
              timestamp: iso8601DateTime(),
            },
          },
        },
      });
    });

    it('retrieves an onboarding case', async () => {
      const response = await axios.get(
        `http://localhost:9001/onboarding/v1/cases/${caseId}`,
        {
          headers: {
            'Authorization': 'Bearer valid-token',
            'Accept': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.data.id).toBe(caseId);
      expect(response.headers['etag']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      return provider.addInteraction({
        state: 'partner exists with valid token',
        uponReceiving: 'a request with missing idempotency key',
        withRequest: {
          method: 'POST',
          path: '/onboarding/v1/cases',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token',
            // No Idempotency-Key header
          },
          body: like({
            type: 'Individual',
            partner_id: uuid(),
          }),
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            name: 'MissingIdempotencyKey',
            message: like("Header 'Idempotency-Key' is required"),
            debug_id: uuid(),
          },
        },
      });
    });

    it('returns 400 when idempotency key is missing', async () => {
      try {
        await axios.post(
          'http://localhost:9001/onboarding/v1/cases',
          {
            type: 'Individual',
            partner_id: '00000000-0000-0000-0000-000000000001',
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer valid-token',
            },
          }
        );
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.name).toBe('MissingIdempotencyKey');
      }
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      return provider.addInteraction({
        state: 'rate limit exceeded',
        uponReceiving: 'a request that exceeds rate limit',
        withRequest: {
          method: 'POST',
          path: '/onboarding/v1/cases',
          headers: {
            'Authorization': 'Bearer valid-token',
          },
        },
        willRespondWith: {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': like('1640000000'),
          },
          body: {
            name: 'RateLimitExceeded',
            message: like('Rate limit exceeded'),
            debug_id: uuid(),
          },
        },
      });
    });

    it('returns 429 with rate limit headers', async () => {
      try {
        await axios.post('http://localhost:9001/onboarding/v1/cases', {}, {
          headers: { 'Authorization': 'Bearer valid-token' },
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response.status).toBe(429);
        expect(error.response.headers['retry-after']).toBe('60');
        expect(error.response.headers['x-ratelimit-remaining']).toBe('0');
      }
    });
  });
});

// Provider verification (run by onboarding-api service)
describe('Onboarding API Provider Verification', () => {
  it('verifies provider against published contracts', () => {
    const opts = {
      provider: 'onboarding-api',
      providerBaseUrl: 'http://localhost:8080',
      pactUrls: [path.resolve(process.cwd(), 'pacts', 'partner-portal-onboarding-api.json')],
      stateHandlers: {
        'partner exists with valid token': async () => {
          // Setup database state
          // Create test partner and token
        },
        'case exists with given id': async () => {
          // Create test case in database
        },
        'rate limit exceeded': async () => {
          // Set rate limit counter in Redis
        },
      },
    };

    return new Verifier(opts).verifyProvider();
  });
});

