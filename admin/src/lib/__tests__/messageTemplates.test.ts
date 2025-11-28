import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messageTemplatesService } from '../messageTemplates';

describe('messageTemplatesService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should get all templates', () => {
    const templates = messageTemplatesService.getAllTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should get template by id', () => {
    const templates = messageTemplatesService.getAllTemplates();
    if (templates.length > 0) {
      const template = messageTemplatesService.getTemplateById(templates[0].id);
      expect(template).toBeDefined();
      expect(template?.id).toBe(templates[0].id);
    }
  });

  it('should create template', () => {
    const newTemplate = {
      name: 'Test Template',
      content: 'Test content',
      category: 'Test',
    };

    const created = messageTemplatesService.createTemplate(newTemplate);
    expect(created).toBeDefined();
    expect(created.name).toBe(newTemplate.name);
  });

  it('should update template', () => {
    const templates = messageTemplatesService.getAllTemplates();
    if (templates.length > 0) {
      const updated = messageTemplatesService.updateTemplate(templates[0].id, {
        name: 'Updated Name',
      });
      expect(updated?.name).toBe('Updated Name');
    }
  });

  it('should delete template', () => {
    const templates = messageTemplatesService.getAllTemplates();
    const initialCount = templates.length;
    
    if (templates.length > 0) {
      messageTemplatesService.deleteTemplate(templates[0].id);
      const remaining = messageTemplatesService.getAllTemplates();
      expect(remaining.length).toBe(initialCount - 1);
    }
  });

  it('should search templates', () => {
    const results = messageTemplatesService.searchTemplates('welcome');
    expect(Array.isArray(results)).toBe(true);
  });

  it('should get templates by category', () => {
    const templates = messageTemplatesService.getTemplatesByCategory('General');
    expect(Array.isArray(templates)).toBe(true);
  });
});

