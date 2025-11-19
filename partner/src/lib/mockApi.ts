// Mock API for Mukuru KYC Application
// This provides realistic data and API-like functionality for presentation

export interface Application {
  id: string;
  legalName: string;
  entityType: string;
  country: string;
  status: 'SUBMITTED' | 'IN PROGRESS' | 'RISK REVIEW' | 'COMPLETE' | 'INCOMPLETE' | 'DECLINED';
  created: string;
  updated: string;
  submittedBy: string;
  riskScore?: number;
  documents: Document[];
  businessInfo: BusinessInfo;
  contactInfo: ContactInfo;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string;
  url: string;
}

export interface BusinessInfo {
  registrationNumber: string;
  taxId: string;
  businessAddress: string;
  industry: string;
  employees: number;
  annualRevenue: number;
}

export interface ContactInfo {
  primaryContact: string;
  email: string;
  phone: string;
  address: string;
}

export interface DashboardStats {
  totalApplications: number;
  pendingReview: number;
  riskReview: number;
  completed: number;
  incomplete: number;
  declined: number;
  avgProcessingTime: number;
  successRate: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userName: string;
  details: string;
  status: 'SUCCESS' | 'FAILED';
  ipAddress: string;
}

export interface EntityType {
  id: string;
  internalName: string;
  displayName: string;
  description: string;
  status: 'active' | 'inactive';
  requirements: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Requirement {
  id: string;
  internalName: string;
  displayName: string;
  description: string;
  fieldType: 'text' | 'date' | 'file' | 'number' | 'email' | 'phone';
  status: 'active' | 'inactive';
  isRequired: boolean;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    fileTypes?: string[];
    maxFileSize?: number;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Mock data generators
const generateRandomId = () => Math.random().toString(36).substr(2, 9).toUpperCase();
const generateRandomDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

const entityTypes = ['company', 'ngo', 'sole proprietor', 'partnership', 'trust'];
const countries = ['South Africa', 'Kenya', 'Nigeria', 'Zimbabwe', 'Botswana', 'Ghana'];
const industries = ['Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail'];
const statuses: Application['status'][] = ['SUBMITTED', 'IN PROGRESS', 'RISK REVIEW', 'COMPLETE', 'INCOMPLETE', 'DECLINED'];

// Generate mock applications
const generateMockApplications = (count: number): Application[] => {
  return Array.from({ length: count }, (_, i) => {
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdDaysAgo = Math.floor(Math.random() * 30);
    
    return {
      id: `APP-${String(i + 1).padStart(3, '0')}`,
      legalName: `${['ACME', 'TechHub', 'Global', 'Premier', 'Elite', 'Prime'][Math.floor(Math.random() * 6)]} ${['Corp', 'Ltd', 'Solutions', 'Group', 'Enterprises'][Math.floor(Math.random() * 5)]}`,
      entityType,
      country,
      status,
      created: generateRandomDate(createdDaysAgo),
      updated: generateRandomDate(Math.floor(Math.random() * createdDaysAgo)),
      submittedBy: `user${i + 1}@example.com`,
      riskScore: Math.floor(Math.random() * 100),
      documents: [
        {
          id: `doc-${i}-1`,
          name: 'Certificate of Incorporation',
          type: 'legal',
          status: status === 'COMPLETE' ? 'APPROVED' : 'PENDING',
          uploadedAt: generateRandomDate(createdDaysAgo - 1),
          url: '#'
        },
        {
          id: `doc-${i}-2`,
          name: 'Tax Certificate',
          type: 'tax',
          status: status === 'COMPLETE' ? 'APPROVED' : 'PENDING',
          uploadedAt: generateRandomDate(createdDaysAgo - 2),
          url: '#'
        }
      ],
      businessInfo: {
        registrationNumber: `REG-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        taxId: `TAX-${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
        businessAddress: `${Math.floor(Math.random() * 999) + 1} Main Street, ${country}`,
        industry: industries[Math.floor(Math.random() * industries.length)],
        employees: Math.floor(Math.random() * 500) + 1,
        annualRevenue: Math.floor(Math.random() * 10000000) + 100000
      },
      contactInfo: {
        primaryContact: `Contact ${i + 1}`,
        email: `contact${i + 1}@example.com`,
        phone: `+${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        address: `${Math.floor(Math.random() * 999) + 1} Business Ave, ${country}`
      }
    };
  });
};

// Generate mock audit events
const generateMockAuditEvents = (count: number): AuditEvent[] => {
  const actions = ['CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'EXPORT', 'DELETE'];
  const entities = ['APPLICATION', 'USER', 'DOCUMENT', 'SETTINGS'];
  
  return Array.from({ length: count }, (_, i) => {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const entity = entities[Math.floor(Math.random() * entities.length)];
    const hoursAgo = Math.floor(Math.random() * 168); // Last week
    
    return {
      id: `audit-${i + 1}`,
      timestamp: generateRandomDate(hoursAgo / 24),
      action,
      entity,
      entityId: `ID-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      userId: `user-${Math.floor(Math.random() * 10) + 1}`,
      userName: `User ${Math.floor(Math.random() * 10) + 1}`,
      details: `${action} operation on ${entity.toLowerCase()}`,
      status: Math.random() > 0.1 ? 'SUCCESS' : 'FAILED',
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    };
  });
};

// Mock data storage
let mockApplications: Application[] = generateMockApplications(50);
let mockAuditEvents: AuditEvent[] = generateMockAuditEvents(200);

// Generate mock entity types
const generateMockEntityTypes = (): EntityType[] => {
  return [
    {
      id: 'ET-001',
      internalName: 'company',
      displayName: 'Company',
      description: 'Registered companies and corporations',
      status: 'active',
      requirements: ['REQ-001', 'REQ-002', 'REQ-003', 'REQ-004', 'REQ-005'],
      createdAt: generateRandomDate(60),
      updatedAt: generateRandomDate(5),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'ET-002',
      internalName: 'ngo',
      displayName: 'NGO',
      description: 'Non-Governmental Organizations',
      status: 'active',
      requirements: ['REQ-001', 'REQ-002', 'REQ-006'],
      createdAt: generateRandomDate(55),
      updatedAt: generateRandomDate(3),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'ET-003',
      internalName: 'government',
      displayName: 'Government Entity',
      description: 'Government and state-owned entities',
      status: 'active',
      requirements: ['REQ-001', 'REQ-007', 'REQ-008', 'REQ-009'],
      createdAt: generateRandomDate(50),
      updatedAt: generateRandomDate(7),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'ET-004',
      internalName: 'trust',
      displayName: 'Trust',
      description: 'Legal arrangements for asset management',
      status: 'active',
      requirements: ['REQ-010', 'REQ-011', 'REQ-012', 'REQ-013'],
      createdAt: generateRandomDate(45),
      updatedAt: generateRandomDate(2),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'ET-005',
      internalName: 'association',
      displayName: 'Association',
      description: 'Voluntary associations and societies',
      status: 'active',
      requirements: ['REQ-001', 'REQ-002', 'REQ-014'],
      createdAt: generateRandomDate(40),
      updatedAt: generateRandomDate(1),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'ET-006',
      internalName: 'sole_proprietor',
      displayName: 'Sole Proprietor',
      description: 'Individual business owners',
      status: 'active',
      requirements: ['REQ-001', 'REQ-015', 'REQ-016'],
      createdAt: generateRandomDate(35),
      updatedAt: generateRandomDate(4),
      createdBy: 'admin@mukuru.com'
    }
  ];
};

// Generate mock requirements
const generateMockRequirements = (): Requirement[] => {
  return [
    {
      id: 'REQ-001',
      internalName: 'legal_name',
      displayName: 'Legal Name',
      description: 'Official registered name of the entity',
      fieldType: 'text',
      status: 'active',
      isRequired: true,
      validationRules: {
        minLength: 2,
        maxLength: 100
      },
      createdAt: generateRandomDate(60),
      updatedAt: generateRandomDate(5),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-002',
      internalName: 'registration_number',
      displayName: 'Registration Number',
      description: 'Official registration or incorporation number',
      fieldType: 'text',
      status: 'active',
      isRequired: true,
      validationRules: {
        minLength: 5,
        maxLength: 20,
        pattern: '^[A-Z0-9-]+$'
      },
      createdAt: generateRandomDate(58),
      updatedAt: generateRandomDate(3),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-003',
      internalName: 'tax_id',
      displayName: 'Tax ID',
      description: 'Tax identification number',
      fieldType: 'text',
      status: 'active',
      isRequired: true,
      validationRules: {
        minLength: 8,
        maxLength: 15,
        pattern: '^[0-9-]+$'
      },
      createdAt: generateRandomDate(55),
      updatedAt: generateRandomDate(2),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-004',
      internalName: 'incorporation_date',
      displayName: 'Incorporation Date',
      description: 'Date when the entity was registered',
      fieldType: 'date',
      status: 'active',
      isRequired: true,
      createdAt: generateRandomDate(52),
      updatedAt: generateRandomDate(1),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-005',
      internalName: 'certificate_incorporation',
      displayName: 'Certificate of Incorporation',
      description: 'Official certificate of incorporation document',
      fieldType: 'file',
      status: 'active',
      isRequired: true,
      validationRules: {
        fileTypes: ['pdf', 'jpg', 'png'],
        maxFileSize: 10485760 // 10MB
      },
      createdAt: generateRandomDate(50),
      updatedAt: generateRandomDate(4),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-006',
      internalName: 'business_address',
      displayName: 'Business Address',
      description: 'Physical business address',
      fieldType: 'text',
      status: 'active',
      isRequired: true,
      validationRules: {
        minLength: 10,
        maxLength: 200
      },
      createdAt: generateRandomDate(48),
      updatedAt: generateRandomDate(6),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-007',
      internalName: 'registration_certificate',
      displayName: 'Registration Certificate',
      description: 'Government registration certificate',
      fieldType: 'file',
      status: 'active',
      isRequired: true,
      validationRules: {
        fileTypes: ['pdf', 'jpg', 'png'],
        maxFileSize: 10485760
      },
      createdAt: generateRandomDate(45),
      updatedAt: generateRandomDate(3),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-008',
      internalName: 'government_resolution',
      displayName: 'Government Resolution',
      description: 'Official government resolution document',
      fieldType: 'file',
      status: 'active',
      isRequired: true,
      validationRules: {
        fileTypes: ['pdf'],
        maxFileSize: 5242880 // 5MB
      },
      createdAt: generateRandomDate(42),
      updatedAt: generateRandomDate(2),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-009',
      internalName: 'authorized_signatories',
      displayName: 'Authorized Signatories',
      description: 'List of authorized signatories',
      fieldType: 'file',
      status: 'active',
      isRequired: true,
      validationRules: {
        fileTypes: ['pdf', 'doc', 'docx'],
        maxFileSize: 5242880
      },
      createdAt: generateRandomDate(40),
      updatedAt: generateRandomDate(1),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-010',
      internalName: 'trust_deed',
      displayName: 'Trust Deed',
      description: 'Legal trust deed document',
      fieldType: 'file',
      status: 'active',
      isRequired: true,
      validationRules: {
        fileTypes: ['pdf'],
        maxFileSize: 10485760
      },
      createdAt: generateRandomDate(38),
      updatedAt: generateRandomDate(5),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-011',
      internalName: 'trustee_information',
      displayName: 'Trustee Information',
      description: 'Information about trustees',
      fieldType: 'text',
      status: 'active',
      isRequired: true,
      validationRules: {
        minLength: 10,
        maxLength: 500
      },
      createdAt: generateRandomDate(35),
      updatedAt: generateRandomDate(2),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-012',
      internalName: 'beneficiary_details',
      displayName: 'Beneficiary Details',
      description: 'Details of trust beneficiaries',
      fieldType: 'text',
      status: 'active',
      isRequired: true,
      validationRules: {
        minLength: 10,
        maxLength: 500
      },
      createdAt: generateRandomDate(32),
      updatedAt: generateRandomDate(4),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-013',
      internalName: 'asset_documentation',
      displayName: 'Asset Documentation',
      description: 'Documentation of trust assets',
      fieldType: 'file',
      status: 'active',
      isRequired: true,
      validationRules: {
        fileTypes: ['pdf', 'jpg', 'png', 'doc', 'docx'],
        maxFileSize: 10485760
      },
      createdAt: generateRandomDate(30),
      updatedAt: generateRandomDate(3),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-014',
      internalName: 'association_constitution',
      displayName: 'Association Constitution',
      description: 'Constitution or bylaws of the association',
      fieldType: 'file',
      status: 'active',
      isRequired: true,
      validationRules: {
        fileTypes: ['pdf', 'doc', 'docx'],
        maxFileSize: 5242880
      },
      createdAt: generateRandomDate(28),
      updatedAt: generateRandomDate(1),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-015',
      internalName: 'personal_id',
      displayName: 'Personal ID',
      description: 'Government-issued personal identification',
      fieldType: 'file',
      status: 'active',
      isRequired: true,
      validationRules: {
        fileTypes: ['pdf', 'jpg', 'png'],
        maxFileSize: 5242880
      },
      createdAt: generateRandomDate(25),
      updatedAt: generateRandomDate(2),
      createdBy: 'admin@mukuru.com'
    },
    {
      id: 'REQ-016',
      internalName: 'business_license',
      displayName: 'Business License',
      description: 'Valid business operating license',
      fieldType: 'file',
      status: 'active',
      isRequired: true,
      validationRules: {
        fileTypes: ['pdf', 'jpg', 'png'],
        maxFileSize: 5242880
      },
      createdAt: generateRandomDate(22),
      updatedAt: generateRandomDate(4),
      createdBy: 'admin@mukuru.com'
    }
  ];
};

let mockEntityTypes: EntityType[] = generateMockEntityTypes();
let mockRequirements: Requirement[] = generateMockRequirements();

// API functions
export const mockApi = {
  // Applications
  getApplications: async (filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Application[]; total: number }> => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    
    let filtered = [...mockApplications];
    
    if (filters?.status && filters.status !== 'ALL') {
      filtered = filtered.filter(app => app.status === filters.status);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.legalName.toLowerCase().includes(searchLower) ||
        app.entityType.toLowerCase().includes(searchLower) ||
        app.country.toLowerCase().includes(searchLower)
      );
    }
    
    const total = filtered.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 10;
    
    return {
      data: filtered.slice(offset, offset + limit),
      total
    };
  },

  getApplicationById: async (id: string): Promise<Application | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockApplications.find(app => app.id === id) || null;
  },

  updateApplicationStatus: async (id: string, status: Application['status']): Promise<Application> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const app = mockApplications.find(a => a.id === id);
    if (!app) throw new Error('Application not found');
    
    app.status = status;
    app.updated = new Date().toISOString();
    
    // Add audit event
    mockAuditEvents.unshift({
      id: generateRandomId(),
      timestamp: new Date().toISOString(),
      action: 'UPDATE',
      entity: 'APPLICATION',
      entityId: id,
      userId: 'current-user',
      userName: 'Current User',
      details: `Status changed to ${status}`,
      status: 'SUCCESS',
      ipAddress: '192.168.1.1'
    });
    
    return app;
  },

  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const stats = mockApplications.reduce((acc, app) => {
      acc.totalApplications++;
      switch (app.status) {
        case 'SUBMITTED':
        case 'IN PROGRESS':
          acc.pendingReview++;
          break;
        case 'RISK REVIEW':
          acc.riskReview++;
          break;
        case 'COMPLETE':
          acc.completed++;
          break;
        case 'INCOMPLETE':
          acc.incomplete++;
          break;
        case 'DECLINED':
          acc.declined++;
          break;
      }
      return acc;
    }, {
      totalApplications: 0,
      pendingReview: 0,
      riskReview: 0,
      completed: 0,
      incomplete: 0,
      declined: 0,
      avgProcessingTime: 0,
      successRate: 0
    });
    
    // Calculate derived stats
    stats.avgProcessingTime = 3.5; // Mock value
    stats.successRate = Math.round((stats.completed / stats.totalApplications) * 100);
    
    return stats;
  },

  // Audit Log
  getAuditEvents: async (filters?: {
    search?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AuditEvent[]; total: number }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filtered = [...mockAuditEvents];
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.action.toLowerCase().includes(searchLower) ||
        event.entity.toLowerCase().includes(searchLower) ||
        event.userName.toLowerCase().includes(searchLower) ||
        event.details.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters?.action) {
      filtered = filtered.filter(event => event.action === filters.action);
    }
    
    const total = filtered.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 20;
    
    return {
      data: filtered.slice(offset, offset + limit),
      total
    };
  },

  // Reports
  getApplicationTrends: async (days: number = 30): Promise<Array<{ date: string; applications: number; completed: number }>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const trends = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayApplications = mockApplications.filter(app => 
        app.created.startsWith(dateStr)
      );
      
      const dayCompleted = mockApplications.filter(app => 
        app.updated.startsWith(dateStr) && app.status === 'COMPLETE'
      );
      
      trends.push({
        date: dateStr,
        applications: dayApplications.length,
        completed: dayCompleted.length
      });
    }
    
    return trends;
  },

  getEntityTypeDistribution: async (): Promise<Array<{ type: string; count: number }>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const distribution = entityTypes.map(type => ({
      type,
      count: mockApplications.filter(app => app.entityType === type).length
    }));
    
    return distribution;
  },

  getProcessingTimeDistribution: async (): Promise<Array<{ range: string; count: number }>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return [
      { range: '0-2 days', count: 8 },
      { range: '3-5 days', count: 18 },
      { range: '6-7 days', count: 12 },
      { range: '8+ days', count: 6 }
    ];
  },

  // Real-time updates
  subscribeToUpdates: (callback: (data: any) => void) => {
    // Simulate real-time updates every 30 seconds
    const interval = setInterval(() => {
      // Randomly update some applications
      if (Math.random() > 0.7) {
        const randomApp = mockApplications[Math.floor(Math.random() * mockApplications.length)];
        if (randomApp.status === 'IN PROGRESS' && Math.random() > 0.5) {
          randomApp.status = 'COMPLETE';
          randomApp.updated = new Date().toISOString();
        }
      }
      
      callback({ type: 'update', timestamp: new Date().toISOString() });
    }, 30000);
    
    return () => clearInterval(interval);
  },

  // Entity Types API
  getEntityTypes: async (): Promise<EntityType[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockEntityTypes;
  },

  getEntityType: async (id: string): Promise<EntityType | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockEntityTypes.find(et => et.id === id) || null;
  },

  createEntityType: async (data: Omit<EntityType, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<EntityType> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newEntityType: EntityType = {
      id: `ET-${String(mockEntityTypes.length + 1).padStart(3, '0')}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin@mukuru.com'
    };
    
    mockEntityTypes.push(newEntityType);
    return newEntityType;
  },

  updateEntityType: async (id: string, data: Partial<Omit<EntityType, 'id' | 'createdAt' | 'createdBy'>>): Promise<EntityType | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = mockEntityTypes.findIndex(et => et.id === id);
    if (index === -1) return null;
    
    mockEntityTypes[index] = {
      ...mockEntityTypes[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return mockEntityTypes[index];
  },

  deleteEntityType: async (id: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockEntityTypes.findIndex(et => et.id === id);
    if (index === -1) return false;
    
    mockEntityTypes.splice(index, 1);
    return true;
  },

  // Requirements API
  getRequirements: async (): Promise<Requirement[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockRequirements;
  },

  getRequirement: async (id: string): Promise<Requirement | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockRequirements.find(req => req.id === id) || null;
  },

  createRequirement: async (data: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Requirement> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newRequirement: Requirement = {
      id: `REQ-${String(mockRequirements.length + 1).padStart(3, '0')}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin@mukuru.com'
    };
    
    mockRequirements.push(newRequirement);
    return newRequirement;
  },

  updateRequirement: async (id: string, data: Partial<Omit<Requirement, 'id' | 'createdAt' | 'createdBy'>>): Promise<Requirement | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = mockRequirements.findIndex(req => req.id === id);
    if (index === -1) return null;
    
    mockRequirements[index] = {
      ...mockRequirements[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return mockRequirements[index];
  },

  deleteRequirement: async (id: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockRequirements.findIndex(req => req.id === id);
    if (index === -1) return false;
    
    mockRequirements.splice(index, 1);
    return true;
  }
};

// Export types and API
export default mockApi;
