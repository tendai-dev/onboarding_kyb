// k6 Load Testing Suite for Onboarding Platform
// Run with: k6 run k6-load-tests.js
// Or with specific scenario: k6 run k6-load-tests.js --env SCENARIO=smoke

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const createCaseDuration = new Trend('create_case_duration');
const getCaseDuration = new Trend('get_case_duration');
const casesCreated = new Counter('cases_created');

// Configuration
const BASE_URL = __ENV.API_BASE_URL || 'https://api.yourdomain.tld';
const KEYCLOAK_URL = __ENV.KEYCLOAK_URL || 'https://keycloak.yourdomain.tld';

// Test scenarios
export const options = {
  scenarios: {
    // Smoke test - verify basic functionality
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { test_type: 'smoke' },
      env: { SCENARIO: 'smoke' },
    },
    
    // Load test - normal expected load
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },   // Ramp up
        { duration: '5m', target: 10 },   // Steady state
        { duration: '2m', target: 0 },    // Ramp down
      ],
      tags: { test_type: 'load' },
      env: { SCENARIO: 'load' },
    },
    
    // Stress test - find breaking point
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '5m', target: 0 },
      ],
      tags: { test_type: 'stress' },
      env: { SCENARIO: 'stress' },
    },
    
    // Spike test - sudden traffic surge
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },  // Rapid spike
        { duration: '1m', target: 100 },
        { duration: '10s', target: 0 },
      ],
      tags: { test_type: 'spike' },
      env: { SCENARIO: 'spike' },
    },
    
    // Soak test - sustained load over time
    soak: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30m',
      tags: { test_type: 'soak' },
      env: { SCENARIO: 'soak' },
    },
  },
  
  thresholds: {
    // SLO: P95 latency < 500ms
    'http_req_duration{scenario:smoke}': ['p(95)<500'],
    'http_req_duration{scenario:load}': ['p(95)<500'],
    'http_req_duration{scenario:stress}': ['p(95)<1000'],  // Relaxed for stress
    
    // SLO: Error rate < 1%
    'errors': ['rate<0.01'],
    
    // Success rate > 99%
    'http_req_failed': ['rate<0.01'],
    
    // Specific endpoint thresholds
    'create_case_duration': ['p(95)<500', 'p(99)<1000'],
    'get_case_duration': ['p(95)<200', 'p(99)<500'],
  },
};

// Setup - Get auth token
export function setup() {
  const params = {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  };

  const body = {
    grant_type: 'password',
    client_id: 'partner-portal',
    username: 'test-partner@example.com',
    password: __ENV.TEST_USER_PASSWORD || 'test-password',
  };

  const formBody = Object.keys(body)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`)
    .join('&');

  const tokenResponse = http.post(
    `${KEYCLOAK_URL}/realms/partners/protocol/openid-connect/token`,
    formBody,
    params
  );

  if (tokenResponse.status !== 200) {
    console.error('Failed to get auth token:', tokenResponse.body);
    return { token: null };
  }

  const tokenData = JSON.parse(tokenResponse.body);
  return { token: tokenData.access_token };
}

// Main test scenario
export default function(data) {
  if (!data.token) {
    console.error('No auth token available, skipping tests');
    return;
  }

  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Idempotency-Key': `${__VU}-${__ITER}-${Date.now()}`,
      'X-Request-Id': `k6-${__VU}-${__ITER}`,
    },
  };

  group('Onboarding API - Create and Retrieve Case', () => {
    // Test 1: Create onboarding case
    const createPayload = JSON.stringify({
      type: 'Individual',
      partner_id: '00000000-0000-0000-0000-000000000001',
      partner_reference_id: `K6-TEST-${__VU}-${__ITER}`,
      applicant: {
        first_name: `User${__VU}`,
        last_name: `Test${__ITER}`,
        date_of_birth: '1990-01-01',
        email: `user${__VU}.${__ITER}@example.com`,
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
    });

    const createStart = Date.now();
    const createResponse = http.post(
      `${BASE_URL}/onboarding/v1/cases`,
      createPayload,
      params
    );
    createCaseDuration.add(Date.now() - createStart);

    const createSuccess = check(createResponse, {
      'create case: status is 201': (r) => r.status === 201,
      'create case: has case_id': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.id;
        } catch {
          return false;
        }
      },
      'create case: has case_number': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.case_number;
        } catch {
          return false;
        }
      },
      'create case: has request_id header': (r) => r.headers['X-Request-Id'] !== undefined,
      'create case: latency < 1s': (r) => r.timings.duration < 1000,
    });

    errorRate.add(!createSuccess);
    if (createSuccess) casesCreated.add(1);

    // Extract case ID for subsequent requests
    let caseId;
    try {
      const createBody = JSON.parse(createResponse.body);
      caseId = createBody.data.id;
    } catch (e) {
      console.error('Failed to parse create response:', e);
      return;
    }

    sleep(1);

    // Test 2: Retrieve case
    params.headers['Idempotency-Key'] = undefined;  // Not needed for GET
    
    const getStart = Date.now();
    const getResponse = http.get(
      `${BASE_URL}/onboarding/v1/cases/${caseId}`,
      params
    );
    getCaseDuration.add(Date.now() - getStart);

    const getSuccess = check(getResponse, {
      'get case: status is 200': (r) => r.status === 200,
      'get case: has case data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.id === caseId;
        } catch {
          return false;
        }
      },
      'get case: has ETag header': (r) => r.headers['Etag'] !== undefined,
      'get case: latency < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!getSuccess);

    sleep(0.5);
  });

  group('Health Checks', () => {
    const healthResponse = http.get(`${BASE_URL}/onboarding/v1/health/live`);
    
    check(healthResponse, {
      'health: status is 200': (r) => r.status === 200,
      'health: response contains healthy': (r) => r.body.includes('healthy'),
    });
  });

  sleep(Math.random() * 2);  // Random think time 0-2s
}

// Teardown - cleanup
export function teardown(data) {
  console.log(`Test completed. Created ${casesCreated.count} cases.`);
}

// Handle different scenarios
export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const summary = `
╔═══════════════════════════════════════════════════════════╗
║            K6 Load Test Summary                           ║
╚═══════════════════════════════════════════════════════════╝

Scenario: ${__ENV.SCENARIO || 'default'}
Duration: ${data.state.testRunDurationMs / 1000}s

Metrics:
  - Total Requests: ${data.metrics.http_reqs.values.count}
  - Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%
  - Error Rate: ${data.metrics.errors.values.rate * 100}%
  
  HTTP Duration:
    - Avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
    - P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    - P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
    - Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
  
  Create Case:
    - Avg: ${data.metrics.create_case_duration?.values.avg.toFixed(2) || 'N/A'}ms
    - P95: ${data.metrics.create_case_duration?.values['p(95)'].toFixed(2) || 'N/A'}ms
    - P99: ${data.metrics.create_case_duration?.values['p(99)'].toFixed(2) || 'N/A'}ms
  
  Get Case:
    - Avg: ${data.metrics.get_case_duration?.values.avg.toFixed(2) || 'N/A'}ms
    - P95: ${data.metrics.get_case_duration?.values['p(95)'].toFixed(2) || 'N/A'}ms
  
  Virtual Users:
    - Max: ${data.metrics.vus_max.values.max}
  
  Cases Created: ${data.metrics.cases_created?.values.count || 0}

SLO Status:
  ✓ P95 < 500ms: ${data.metrics.http_req_duration.values['p(95)'] < 500 ? 'PASS' : 'FAIL'}
  ✓ Error rate < 1%: ${data.metrics.errors.values.rate < 0.01 ? 'PASS' : 'FAIL'}

`;

  return summary;
}

