// Mock data for the application
export interface Application {
  id: string;
  companyName: string;
  entityType: string;
  applicantName: string;
  email: string;
  country: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'requires_action';
  riskLevel: 'low' | 'medium' | 'high';
  submissionDate: string;
  lastUpdated: string;
  completionPercentage: number;
  documents: Document[];
  timeline: TimelineEvent[];
  messages: Message[];
}

export interface Document {
  id: string;
  name: string;
  type: string;
  category: 'registration' | 'identity' | 'governance' | 'ownership' | 'address' | 'authorization' | 'compliance' | 'licensing' | 'financial';
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  uploadDate?: string;
  fileSize?: string;
  fileName?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  event: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface Message {
  id: string;
  sender: 'admin' | 'partner';
  senderName: string;
  message: string;
  timestamp: string;
  attachments?: string[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'partner' | 'partner';
  companyName?: string;
  avatar?: string;
}

// Mock Applications Data
export const mockApplications: Application[] = [
  {
    id: 'APP-001',
    companyName: 'TechCorp Solutions Ltd',
    entityType: 'Private Company',
    applicantName: 'John Smith',
    email: 'john.smith@techcorp.com',
    country: 'South Africa',
    status: 'under_review',
    riskLevel: 'low',
    submissionDate: '2024-10-20',
    lastUpdated: '2024-10-23',
    completionPercentage: 85,
    documents: [
      {
        id: 'DOC-001',
        name: 'Certificate of Incorporation',
        type: 'PDF',
        category: 'registration',
        status: 'verified',
        uploadDate: '2024-10-20',
        fileSize: '2.3 MB',
        fileName: 'certificate_incorporation.pdf'
      },
      {
        id: 'DOC-002',
        name: 'Director ID Copy',
        type: 'PDF',
        category: 'identity',
        status: 'verified',
        uploadDate: '2024-10-20',
        fileSize: '1.8 MB',
        fileName: 'director_id.pdf'
      },
      {
        id: 'DOC-003',
        name: 'Proof of Address',
        type: 'PDF',
        category: 'address',
        status: 'pending',
        uploadDate: '2024-10-22',
        fileSize: '1.2 MB',
        fileName: 'proof_address.pdf'
      }
    ],
    timeline: [
      {
        id: 'TL-001',
        date: '2024-10-20',
        event: 'Application Submitted',
        description: 'Initial application submitted with basic documents',
        type: 'info'
      },
      {
        id: 'TL-002',
        date: '2024-10-21',
        event: 'Documents Verified',
        description: 'Certificate of Incorporation and Director ID verified',
        type: 'success'
      },
      {
        id: 'TL-003',
        date: '2024-10-22',
        event: 'Additional Documents Requested',
        description: 'Proof of address document uploaded for review',
        type: 'warning'
      }
    ],
    messages: [
      {
        id: 'MSG-001',
        sender: 'admin',
        senderName: 'Sarah Johnson',
        message: 'Thank you for your application. We have received your documents and are currently reviewing them.',
        timestamp: '2024-10-21T09:30:00Z'
      },
      {
        id: 'MSG-002',
        sender: 'partner',
        senderName: 'John Smith',
        message: 'Thank you for the update. I have uploaded the additional proof of address document as requested.',
        timestamp: '2024-10-22T14:15:00Z'
      }
    ]
  },
  {
    id: 'APP-002',
    companyName: 'Global Trade Partners',
    entityType: 'Publicly Listed Entity',
    applicantName: 'Maria Rodriguez',
    email: 'maria.rodriguez@globaltradepart.com',
    country: 'Zimbabwe',
    status: 'approved',
    riskLevel: 'medium',
    submissionDate: '2024-10-15',
    lastUpdated: '2024-10-24',
    completionPercentage: 100,
    documents: [
      {
        id: 'DOC-004',
        name: 'Certificate of Incorporation',
        type: 'PDF',
        category: 'registration',
        status: 'verified',
        uploadDate: '2024-10-15',
        fileSize: '3.1 MB',
        fileName: 'cert_incorporation_gtp.pdf'
      },
      {
        id: 'DOC-005',
        name: 'Memorandum of Incorporation',
        type: 'PDF',
        category: 'ownership',
        status: 'verified',
        uploadDate: '2024-10-16',
        fileSize: '4.2 MB',
        fileName: 'memorandum_inc.pdf'
      }
    ],
    timeline: [
      {
        id: 'TL-004',
        date: '2024-10-15',
        event: 'Application Submitted',
        description: 'Complete application submitted',
        type: 'info'
      },
      {
        id: 'TL-005',
        date: '2024-10-24',
        event: 'Application Approved',
        description: 'All requirements met, application approved',
        type: 'success'
      }
    ],
    messages: [
      {
        id: 'MSG-003',
        sender: 'admin',
        senderName: 'Michael Chen',
        message: 'Congratulations! Your application has been approved. You can now access all services.',
        timestamp: '2024-10-24T11:00:00Z'
      }
    ]
  },
  {
    id: 'APP-003',
    companyName: 'StartUp Innovations',
    entityType: 'Private Company',
    applicantName: 'David Wilson',
    email: 'david@startupinnovations.co.za',
    country: 'South Africa',
    status: 'requires_action',
    riskLevel: 'high',
    submissionDate: '2024-10-18',
    lastUpdated: '2024-10-23',
    completionPercentage: 45,
    documents: [
      {
        id: 'DOC-006',
        name: 'Certificate of Incorporation',
        type: 'PDF',
        category: 'registration',
        status: 'rejected',
        uploadDate: '2024-10-18',
        fileSize: '1.9 MB',
        fileName: 'cert_startup.pdf'
      }
    ],
    timeline: [
      {
        id: 'TL-006',
        date: '2024-10-18',
        event: 'Application Submitted',
        description: 'Initial application submitted',
        type: 'info'
      },
      {
        id: 'TL-007',
        date: '2024-10-23',
        event: 'Document Rejected',
        description: 'Certificate of Incorporation requires re-submission with clearer image quality',
        type: 'error'
      }
    ],
    messages: [
      {
        id: 'MSG-004',
        sender: 'admin',
        senderName: 'Lisa Thompson',
        message: 'We need you to re-upload your Certificate of Incorporation with better image quality. The current document is not clear enough for verification.',
        timestamp: '2024-10-23T16:45:00Z'
      }
    ]
  }
];

// Mock Users Data
export const mockUsers: User[] = [
  {
    id: 'USR-001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@techcorp.com',
    role: 'partner',
    companyName: 'TechCorp Solutions Ltd'
  },
  {
    id: 'USR-002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@mukuru.com',
    role: 'admin'
  },
  {
    id: 'USR-003',
    firstName: 'Maria',
    lastName: 'Rodriguez',
    email: 'maria.rodriguez@globaltradepart.com',
    role: 'partner',
    companyName: 'Global Trade Partners'
  }
];

// Mock Statistics for Admin Dashboard
export const mockStats = {
  totalApplications: 156,
  pendingReview: 23,
  approved: 98,
  rejected: 12,
  requiresAction: 23,
  averageProcessingTime: '5.2 days',
  riskDistribution: {
    low: 89,
    medium: 45,
    high: 22
  },
  monthlyApplications: [
    { month: 'Jan', count: 12 },
    { month: 'Feb', count: 19 },
    { month: 'Mar', count: 15 },
    { month: 'Apr', count: 22 },
    { month: 'May', count: 18 },
    { month: 'Jun', count: 25 },
    { month: 'Jul', count: 28 },
    { month: 'Aug', count: 17 }
  ]
};

// Helper functions
export const getApplicationById = (id: string): Application | undefined => {
  return mockApplications.find(app => app.id === id);
};

export const getApplicationsByStatus = (status: string): Application[] => {
  return mockApplications.filter(app => app.status === status);
};

export const getUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(user => user.email === email);
};

export const getCustomerApplication = (email: string): Application | undefined => {
  return mockApplications.find(app => app.email === email);
};
