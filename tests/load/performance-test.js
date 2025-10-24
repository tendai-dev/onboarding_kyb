// K6 Performance and Load Testing Script
// Tests the complete onboarding platform under load

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const documentUploadDuration = new Trend('document_upload_duration');
const applicationCreateDuration = new Trend('application_create_duration');
const workQueueQueryDuration = new Trend('work_queue_query_duration');
const messagingSendDuration = new Trend('messaging_send_duration');
const successCounter = new Counter('successful_requests');

// Load test configuration
export const options = {
  scenarios: {
    // Scenario 1: Steady load
    steady_load: {
      executor: 'constant-vus',
      vus: 50, // 50 virtual users
      duration: '5m',
    },
    
    // Scenario 2: Spike test
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },  // Ramp to 100 users
        { duration: '3m', target: 100 },  // Stay at 100
        { duration: '1m', target: 0 },    // Ramp down
      ],
      startTime: '6m', // Start after steady load
    },
    
    // Scenario 3: Stress test
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 200 },  // Ramp to 200
        { duration: '5m', target: 200 },  // Stay at 200
        { duration: '2m', target: 500 },  // Push to 500
        { duration: '3m', target: 500 },  // Hold at 500
        { duration: '2m', target: 0 },    // Ramp down
      ],
      startTime: '11m', // Start after spike test
    },
  },
  
  thresholds: {
    // Performance SLOs
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
    'http_req_failed': ['rate<0.01'],                   // Error rate < 1%
    'errors': ['rate<0.05'],                            // Custom error rate < 5%
    
    // Specific operation thresholds
    'document_upload_duration': ['p(95)<3000'],         // Document upload 95% under 3s
    'application_create_duration': ['p(95)<1000'],      // App creation 95% under 1s
    'work_queue_query_duration': ['p(95)<500'],         // Queue query 95% under 500ms
    'messaging_send_duration': ['p(95)<200'],           // Message send 95% under 200ms
  },
};

// Base URLs (configure for your environment)
const BASE_URL = __ENV.BASE_URL || 'http://localhost';
const ONBOARDING_API = `${BASE_URL}:8080`;
const DOCUMENT_SERVICE = `${BASE_URL}:8081`;
const WORK_QUEUE_SERVICE = `${BASE_URL}:8088`;
const MESSAGING_SERVICE = `${BASE_URL}:8089`;
const ENTITY_CONFIG_SERVICE = `${BASE_URL}:8084`;

// Test data
const AUTH_TOKEN = __ENV.TEST_AUTH_TOKEN || 'test-token';

export function setup() {
  console.log('🔧 Setting up load test...');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Auth token configured: ${AUTH_TOKEN ? 'Yes' : 'No'}`);
  
  return {
    baseUrl: BASE_URL,
    authToken: AUTH_TOKEN,
  };
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.authToken}`,
    'Content-Type': 'application/json',
  };
  
  // ═══════════════════════════════════════════════════════════════
  // TEST 1: Complete Application Creation Flow
  // ═══════════════════════════════════════════════════════════════
  group('Application Creation Flow', () => {
    // Step 1: Get dynamic form configuration
    let formResponse = http.get(
      `${ENTITY_CONFIG_SERVICE}/api/v1/FormConfiguration?entityType=PRIVATE_COMPANY&country=UK`,
      { headers, tags: { name: 'GetFormConfig' } }
    );
    
    check(formResponse, {
      'form config retrieved': (r) => r.status === 200,
      'form has sections': (r) => JSON.parse(r.body).sections.length > 0,
    });
    
    sleep(0.5);
    
    // Step 2: Create application
    const applicationPayload = JSON.stringify({
      applicantName: `Test Company ${__VU}-${__ITER}`,
      entityType: 'PRIVATE_COMPANY',
      country: 'UK',
      email: `test-${__VU}-${__ITER}@example.com`,
      phoneNumber: '+447700900000',
    });
    
    const startTime = Date.now();
    let createResponse = http.post(
      `${ONBOARDING_API}/api/v1/applications`,
      applicationPayload,
      { headers, tags: { name: 'CreateApplication' } }
    );
    
    const duration = Date.now() - startTime;
    applicationCreateDuration.add(duration);
    
    const success = check(createResponse, {
      'application created': (r) => r.status === 200 || r.status === 201,
      'has application ID': (r) => JSON.parse(r.body).applicationId !== undefined,
    });
    
    if (success) {
      successCounter.add(1);
      const applicationId = JSON.parse(createResponse.body).applicationId;
      
      sleep(1);
      
      // Step 3: Verify application accessible
      let getResponse = http.get(
        `${ONBOARDING_API}/api/v1/applications/${applicationId}`,
        { headers, tags: { name: 'GetApplication' } }
      );
      
      check(getResponse, {
        'application retrieved': (r) => r.status === 200,
      });
    } else {
      errorRate.add(1);
    }
  });
  
  // ═══════════════════════════════════════════════════════════════
  // TEST 2: Document Upload with Virus Scanning
  // ═══════════════════════════════════════════════════════════════
  group('Document Upload Flow', () => {
    // Create simple PDF content
    const pdfContent = '%PDF-1.4\nTest Document\n%%EOF';
    
    const formData = {
      file: http.file(pdfContent, 'test-document.pdf', 'application/pdf'),
      caseId: '00000000-0000-0000-0000-000000000000',
      documentType: 'PassportCopy',
    };
    
    const startTime = Date.now();
    let uploadResponse = http.post(
      `${DOCUMENT_SERVICE}/api/v1/documents/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${data.authToken}`,
        },
        tags: { name: 'UploadDocument' },
      }
    );
    
    const duration = Date.now() - startTime;
    documentUploadDuration.add(duration);
    
    const success = check(uploadResponse, {
      'document uploaded': (r) => r.status === 200 || r.status === 201,
      'upload under 3s': (r) => duration < 3000,
    });
    
    if (!success) {
      errorRate.add(1);
    } else {
      successCounter.add(1);
    }
    
    sleep(0.5);
  });
  
  // ═══════════════════════════════════════════════════════════════
  // TEST 3: Work Queue Operations
  // ═══════════════════════════════════════════════════════════════
  group('Work Queue Operations', () => {
    const startTime = Date.now();
    let queueResponse = http.get(
      `${WORK_QUEUE_SERVICE}/api/v1/WorkQueue?page=1&pageSize=20`,
      { headers, tags: { name: 'GetWorkQueue' } }
    );
    
    const duration = Date.now() - startTime;
    workQueueQueryDuration.add(duration);
    
    const success = check(queueResponse, {
      'work queue retrieved': (r) => r.status === 200,
      'query under 500ms': (r) => duration < 500,
      'has items': (r) => JSON.parse(r.body).items !== undefined,
    });
    
    if (!success) {
      errorRate.add(1);
    } else {
      successCounter.add(1);
    }
    
    sleep(0.3);
  });
  
  // ═══════════════════════════════════════════════════════════════
  // TEST 4: Messaging Operations
  // ═══════════════════════════════════════════════════════════════
  group('Messaging Operations', () => {
    const messagePayload = JSON.stringify({
      applicationId: '00000000-0000-0000-0000-000000000000',
      content: `Load test message from VU ${__VU} iteration ${__ITER}`,
    });
    
    const startTime = Date.now();
    let messageResponse = http.post(
      `${MESSAGING_SERVICE}/api/v1/messages`,
      messagePayload,
      { headers, tags: { name: 'SendMessage' } }
    );
    
    const duration = Date.now() - startTime;
    messagingSendDuration.add(duration);
    
    const success = check(messageResponse, {
      'message sent': (r) => r.status === 200 || r.status === 201,
      'send under 200ms': (r) => duration < 200,
    });
    
    if (!success) {
      errorRate.add(1);
    } else {
      successCounter.add(1);
    }
    
    sleep(0.2);
  });
  
  // ═══════════════════════════════════════════════════════════════
  // TEST 5: Health Check Monitoring
  // ═══════════════════════════════════════════════════════════════
  if (__ITER % 10 === 0) {
    group('Health Checks', () => {
      const services = [
        { name: 'onboarding-api', url: `${ONBOARDING_API}/health` },
        { name: 'document-service', url: `${DOCUMENT_SERVICE}/health` },
        { name: 'work-queue-service', url: `${WORK_QUEUE_SERVICE}/health` },
        { name: 'messaging-service', url: `${MESSAGING_SERVICE}/health` },
      ];
      
      services.forEach((service) => {
        let healthResponse = http.get(service.url, {
          tags: { name: `Health_${service.name}` },
        });
        
        check(healthResponse, {
          [`${service.name} healthy`]: (r) => r.status === 200,
        });
      });
    });
  }
  
  // Random sleep between iterations
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

export function teardown(data) {
  console.log('🏁 Load test completed');
  console.log(`Total successful requests: ${successCounter.value || 0}`);
  console.log(`Error rate: ${(errorRate.value || 0) * 100}%`);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options?.indent || '';
  const enableColors = options?.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}📊 Load Test Summary\n`;
  summary += `${indent}${'='.repeat(50)}\n\n`;
  
  // Request statistics
  const httpReqDuration = data.metrics['http_req_duration'];
  if (httpReqDuration) {
    summary += `${indent}HTTP Request Duration:\n`;
    summary += `${indent}  Avg: ${httpReqDuration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  P95: ${httpReqDuration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  P99: ${httpReqDuration.values['p(99)'].toFixed(2)}ms\n`;
    summary += `${indent}  Max: ${httpReqDuration.values.max.toFixed(2)}ms\n\n`;
  }
  
  // Request rate
  const httpReqs = data.metrics['http_reqs'];
  if (httpReqs) {
    summary += `${indent}Total Requests: ${httpReqs.values.count}\n`;
    summary += `${indent}Request Rate: ${httpReqs.values.rate.toFixed(2)}/s\n\n`;
  }
  
  // Error rate
  const httpReqFailed = data.metrics['http_req_failed'];
  if (httpReqFailed) {
    const errorPct = (httpReqFailed.values.rate * 100).toFixed(2);
    summary += `${indent}Error Rate: ${errorPct}%\n\n`;
  }
  
  // Custom metrics
  summary += `${indent}Operation-Specific Metrics:\n`;
  
  const customMetrics = [
    'application_create_duration',
    'document_upload_duration',
    'work_queue_query_duration',
    'messaging_send_duration',
  ];
  
  customMetrics.forEach((metricName) => {
    const metric = data.metrics[metricName];
    if (metric) {
      summary += `${indent}  ${metricName}:\n`;
      summary += `${indent}    P95: ${metric.values['p(95)'].toFixed(2)}ms\n`;
    }
  });
  
  summary += `\n${indent}${'='.repeat(50)}\n`;
  
  return summary;
}

