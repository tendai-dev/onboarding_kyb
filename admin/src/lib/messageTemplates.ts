// Message Templates Service
// This service manages message templates for quick message composition

export interface MessageTemplate {
  id: string;
  name: string;
  subject?: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

class MessageTemplatesService {
  private templates: MessageTemplate[] = [];

  constructor() {
    // Load templates from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('messageTemplates');
      if (stored) {
        this.templates = JSON.parse(stored);
      } else {
        // Initialize with default templates
        this.templates = this.getDefaultTemplates();
        this.saveToStorage();
      }
    } catch (error) {
      console.error('[MessageTemplates] Failed to load from storage:', error);
      this.templates = this.getDefaultTemplates();
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('messageTemplates', JSON.stringify(this.templates));
    } catch (error) {
      console.error('[MessageTemplates] Failed to save to storage:', error);
    }
  }

  private getDefaultTemplates(): MessageTemplate[] {
    return [
      {
        id: '1',
        name: 'Welcome Message',
        content: 'Thank you for your application. We have received your submission and will review it shortly.',
        category: 'General',
        tags: ['welcome', 'application'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Document Request',
        content: 'We need additional documentation to proceed with your application. Please upload the following documents:',
        category: 'Documentation',
        tags: ['documents', 'request'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Application Approved',
        content: 'Congratulations! Your application has been approved. We will contact you shortly with next steps.',
        category: 'Status Update',
        tags: ['approved', 'success'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'Application Under Review',
        content: 'Your application is currently under review. We will notify you once a decision has been made.',
        category: 'Status Update',
        tags: ['review', 'pending'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        name: 'Additional Information Required',
        content: 'We need some additional information to complete your application. Please provide the following:',
        category: 'Information Request',
        tags: ['information', 'request'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  public getAllTemplates(): MessageTemplate[] {
    return [...this.templates];
  }

  public getTemplateById(id: string): MessageTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  public getTemplatesByCategory(category: string): MessageTemplate[] {
    return this.templates.filter(t => t.category === category);
  }

  public searchTemplates(query: string): MessageTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.content.toLowerCase().includes(lowerQuery) ||
      t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  public createTemplate(template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>): MessageTemplate {
    const newTemplate: MessageTemplate = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.templates.push(newTemplate);
    this.saveToStorage();
    return newTemplate;
  }

  public updateTemplate(id: string, updates: Partial<Omit<MessageTemplate, 'id' | 'createdAt'>>): MessageTemplate | null {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return null;

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.templates[index];
  }

  public deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.templates.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  public getCategories(): string[] {
    const categories = new Set(this.templates.map(t => t.category).filter(Boolean));
    return Array.from(categories) as string[];
  }
}

export const messageTemplatesService = new MessageTemplatesService();

