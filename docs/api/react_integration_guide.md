# React Frontend Integration Guide

## 🚀 Complete API Reference for React Integration

This guide provides all the API endpoints and data models needed to integrate your React frontend with the onboarding platform.

## 🔗 Base URLs

```bash
# Local Development
API_BASE_URL=https://api.yourdomain.tld

# Service Endpoints
ONBOARDING_API=/onboarding/v1
CHECKLIST_API=/checklist/v1
RISK_API=/risk/v1
PROJECTIONS_API=/projections/v1
NOTIFICATIONS_API=/notifications/v1
AUDIT_API=/audit/v1
DOCUMENTS_API=/documents/v1
WEBHOOKS_API=/webhooks/v1
```

## 🔐 Authentication

All APIs use OAuth 2.1 Bearer tokens from Keycloak:

```typescript
// Get token from Keycloak
const token = await getKeycloakToken();

// Use in API calls
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Idempotency-Key': uuidv4() // For POST requests
};
```

## 📊 Main Dashboard API (projections-api)

### Get Dashboard Data
```typescript
// GET /api/v1/dashboard?partnerId=optional
interface DashboardData {
  generatedAt: string;
  partnerId: string;
  cases: {
    totalCases: number;
    activeCases: number;
    completedCases: number;
    rejectedCases: number;
    pendingReviewCases: number;
    overdueCases: number;
    // Growth metrics
    newCasesThisMonth: number;
    newCasesLastMonth: number;
    newCasesGrowthPercentage: number;
  };
  performance: {
    averageCompletionTimeHours: number;
    completionRate: number;
    approvalRate: number;
  };
  risk: {
    highRiskCases: number;
    mediumRiskCases: number;
    lowRiskCases: number;
    averageRiskScore: number;
    casesRequiringManualReview: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    caseId: string;
    timestamp: string;
    severity: string;
    icon: string;
    color: string;
  }>;
  dailyTrends: Array<{
    date: string;
    newCases: number;
    completedCases: number;
    averageRiskScore: number;
    completionRate: number;
  }>;
}
```

### Get Cases List (Paginated)
```typescript
// GET /api/v1/cases?skip=0&take=50&status=InProgress&sortBy=createdAt&sortDirection=desc
interface CasesList {
  items: OnboardingCase[];
  totalCount: number;
  skip: number;
  take: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPages: number;
  currentPage: number;
}

interface OnboardingCase {
  id: string;
  caseId: string;
  type: 'Individual' | 'Corporate' | 'Trust' | 'Partnership';
  status: 'Draft' | 'InProgress' | 'PendingReview' | 'Approved' | 'Rejected';
  partnerId: string;
  partnerName: string;
  
  // Applicant info
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone: string;
  
  // Progress
  progressPercentage: number;
  totalSteps: number;
  completedSteps: number;
  
  // Risk info
  riskLevel: 'Low' | 'MediumLow' | 'Medium' | 'MediumHigh' | 'High';
  riskScore: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // UI helpers (pre-calculated)
  statusBadgeColor: string;
  riskBadgeColor: string;
  isOverdue: boolean;
  isHighPriority: boolean;
  daysInProgress: number;
}
```

### Export Cases to CSV
```typescript
// GET /api/v1/cases/export?status=InProgress&fromDate=2024-01-01
// Returns: File download (CSV)
```

## 📋 Onboarding Cases API (onboarding-api)

### Create New Case
```typescript
// POST /onboarding/v1/cases
interface CreateCaseRequest {
  type: 'Individual' | 'Corporate' | 'Trust' | 'Partnership';
  partnerId: string;
  partnerReferenceId: string;
  applicant: {
    firstName: string;
    lastName: string;
    dateOfBirth: string; // ISO date
    email: string;
    phoneNumber: string;
    residentialAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    nationality: string;
  };
}

interface CreateCaseResponse {
  caseId: string;
  status: string;
  createdAt: string;
}
```

### Get Case Details
```typescript
// GET /onboarding/v1/cases/{caseId}
interface CaseDetails extends OnboardingCase {
  applicant: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    phoneNumber: string;
    residentialAddress: Address;
    nationality: string;
  };
  documents: Document[];
  timeline: TimelineEvent[];
}
```

### Update Case Status
```typescript
// PUT /onboarding/v1/cases/{caseId}/status
interface UpdateStatusRequest {
  status: 'InProgress' | 'PendingReview' | 'Approved' | 'Rejected';
  reason?: string;
  notes?: string;
}
```

## ✅ Checklist API (checklist-service)

### Get Case Checklist
```typescript
// GET /checklist/v1/checklists/case/{caseId}
interface Checklist {
  id: string;
  caseId: string;
  type: string;
  status: 'InProgress' | 'Completed';
  completionPercentage: number;
  requiredCompletionPercentage: number;
  items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  category: 'Identity' | 'Address' | 'Financial' | 'Compliance' | 'Documentation';
  isRequired: boolean;
  order: number;
  status: 'Pending' | 'Completed' | 'Skipped';
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}
```

### Complete Checklist Item
```typescript
// POST /checklist/v1/checklists/{checklistId}/items/{itemId}/complete
interface CompleteItemRequest {
  notes?: string;
}

interface CompleteItemResponse {
  checklistId: string;
  itemId: string;
  checklistCompleted: boolean;
  completionPercentage: number;
}
```

## ⚠️ Risk Assessment API (risk-service)

### Get Risk Assessment
```typescript
// GET /risk/v1/risk-assessments/case/{caseId}
interface RiskAssessment {
  id: string;
  caseId: string;
  overallRiskLevel: 'Low' | 'MediumLow' | 'Medium' | 'MediumHigh' | 'High';
  riskScore: number; // 0-100
  status: 'InProgress' | 'Completed' | 'Rejected';
  factors: RiskFactor[];
  createdAt: string;
  completedAt?: string;
}

interface RiskFactor {
  id: string;
  type: 'PEP' | 'Sanctions' | 'AdverseMedia' | 'Geography' | 'Industry';
  level: 'Low' | 'Medium' | 'High';
  score: number;
  description: string;
  source?: string;
}
```

### Add Risk Factor
```typescript
// POST /risk/v1/risk-assessments/{assessmentId}/factors
interface AddRiskFactorRequest {
  type: 'PEP' | 'Sanctions' | 'AdverseMedia' | 'Geography' | 'Industry';
  level: 'Low' | 'Medium' | 'High';
  score: number; // 0-100
  description: string;
  source?: string;
}
```

## 📧 Notifications API (notification-service)

### Send Welcome Email
```typescript
// POST /notifications/v1/welcome
interface WelcomeNotificationRequest {
  caseId: string;
  partnerId: string;
  applicantName: string;
  email: string;
}
```

### Send Status Update
```typescript
// POST /notifications/v1/status-update
interface StatusUpdateRequest {
  caseId: string;
  partnerId: string;
  applicantName: string;
  email: string;
  newStatus: string;
  message: string;
}
```

### Send Custom Notification
```typescript
// POST /notifications/v1/notifications
interface SendNotificationRequest {
  type: 'Welcome' | 'StatusUpdate' | 'DocumentRequest' | 'Reminder';
  channel: 'Email' | 'SMS' | 'InApp';
  recipient: string;
  subject: string;
  content: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  caseId?: string;
  partnerId?: string;
  scheduledAt?: string; // ISO datetime
}
```

## 📋 Audit Logs API (auditlog-service)

### Get Case Audit Trail
```typescript
// GET /audit/v1/audit-logs/case/{caseId}
interface AuditLogEntry {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  caseId?: string;
  userId: string;
  userRole: string;
  action: 'Create' | 'Update' | 'Delete' | 'Approve' | 'Reject';
  description: string;
  timestamp: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  complianceCategory: 'KYC' | 'AML' | 'DataProtection' | 'Financial';
  integrityVerified: boolean;
}
```

### Search Audit Logs
```typescript
// POST /audit/v1/audit-logs/search
interface AuditSearchRequest {
  caseId?: string;
  partnerId?: string;
  userId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
  skip: number;
  take: number;
}
```

## 📄 Documents API (document-service)

### Upload Document
```typescript
// POST /documents/v1/documents
// Content-Type: multipart/form-data
interface UploadDocumentRequest {
  caseId: string;
  documentType: 'ID' | 'Passport' | 'Utility Bill' | 'Bank Statement';
  file: File;
  description?: string;
}

interface DocumentResponse {
  documentId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'Uploaded' | 'Processing' | 'Verified' | 'Rejected';
  uploadedAt: string;
}
```

### Get Case Documents
```typescript
// GET /documents/v1/documents/case/{caseId}
interface Document {
  id: string;
  caseId: string;
  fileName: string;
  documentType: string;
  status: 'Uploaded' | 'Processing' | 'Verified' | 'Rejected';
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
}
```

## 🔗 Webhooks API (webhook-dispatcher)

### Configure Webhook
```typescript
// POST /webhooks/v1/webhooks
interface WebhookConfig {
  partnerId: string;
  url: string;
  events: string[]; // ['case.created', 'case.approved', 'document.verified']
  signingSecret: string;
  isActive: boolean;
}
```

## 🎨 React Component Examples

### Dashboard Component
```tsx
import React, { useEffect, useState } from 'react';
import { getDashboardData, getCasesList } from '../api/projections';

const Dashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [cases, setCases] = useState<CasesList | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboardData, casesData] = await Promise.all([
          getDashboardData(),
          getCasesList({ take: 10, sortBy: 'updatedAt', sortDirection: 'desc' })
        ]);
        setDashboard(dashboardData);
        setCases(casesData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadData();
  }, []);

  if (!dashboard) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard 
          title="Total Cases" 
          value={dashboard.cases.totalCases}
          change={dashboard.cases.newCasesGrowthPercentage}
        />
        <StatCard 
          title="Active Cases" 
          value={dashboard.cases.activeCases}
          color="blue"
        />
        <StatCard 
          title="Completion Rate" 
          value={`${dashboard.performance.completionRate.toFixed(1)}%`}
          color="green"
        />
        <StatCard 
          title="High Risk Cases" 
          value={dashboard.risk.highRiskCases}
          color="red"
        />
      </div>
      
      <div className="charts-section">
        <TrendsChart data={dashboard.dailyTrends} />
        <RiskDistributionChart risk={dashboard.risk} />
      </div>
      
      <div className="recent-cases">
        <h3>Recent Cases</h3>
        <CasesTable cases={cases?.items || []} />
      </div>
    </div>
  );
};
```

### Case Details Component
```tsx
const CaseDetails: React.FC<{ caseId: string }> = ({ caseId }) => {
  const [caseData, setCaseData] = useState<CaseDetails | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);

  useEffect(() => {
    const loadCaseData = async () => {
      try {
        const [case_, checklistData, riskData] = await Promise.all([
          getCaseDetails(caseId),
          getChecklist(caseId),
          getRiskAssessment(caseId)
        ]);
        setCaseData(case_);
        setChecklist(checklistData);
        setRiskAssessment(riskData);
      } catch (error) {
        console.error('Failed to load case data:', error);
      }
    };

    loadCaseData();
  }, [caseId]);

  const handleCompleteChecklistItem = async (itemId: string, notes?: string) => {
    try {
      await completeChecklistItem(checklist!.id, itemId, notes);
      // Refresh checklist data
      const updatedChecklist = await getChecklist(caseId);
      setChecklist(updatedChecklist);
    } catch (error) {
      console.error('Failed to complete checklist item:', error);
    }
  };

  if (!caseData) return <div>Loading...</div>;

  return (
    <div className="case-details">
      <CaseHeader case={caseData} />
      <div className="case-content">
        <div className="left-panel">
          <ApplicantInfo applicant={caseData.applicant} />
          <DocumentsList documents={caseData.documents} />
        </div>
        <div className="right-panel">
          <ChecklistProgress 
            checklist={checklist} 
            onCompleteItem={handleCompleteChecklistItem}
          />
          <RiskAssessmentCard assessment={riskAssessment} />
          <TimelineCard timeline={caseData.timeline} />
        </div>
      </div>
    </div>
  );
};
```

## 🔄 API Client Setup

```typescript
// api/client.ts
import axios from 'axios';
import { getKeycloakToken } from '../auth/keycloak';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 30000,
});

// Add auth interceptor
apiClient.interceptors.request.use(async (config) => {
  const token = await getKeycloakToken();
  config.headers.Authorization = `Bearer ${token}`;
  
  // Add idempotency key for POST requests
  if (config.method === 'post') {
    config.headers['Idempotency-Key'] = crypto.randomUUID();
  }
  
  return config;
});

// Add error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## 🎯 Key Integration Points

1. **Dashboard**: Use `/api/v1/dashboard` for main metrics
2. **Cases List**: Use `/api/v1/cases` with pagination and filtering
3. **Case Details**: Combine multiple APIs for complete case view
4. **Real-time Updates**: Consider WebSocket connections for live updates
5. **File Uploads**: Use multipart/form-data for document uploads
6. **Error Handling**: Implement proper error boundaries and retry logic
7. **Caching**: Use React Query or SWR for API state management

## 🔐 Security Considerations

- Always validate tokens on the frontend
- Use HTTPS for all API calls
- Implement proper CORS policies
- Sanitize user inputs before API calls
- Handle sensitive data appropriately (PII masking)

This comprehensive API guide provides everything needed to build a fully functional React frontend for the onboarding platform!
