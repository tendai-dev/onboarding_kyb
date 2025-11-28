import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchEntitySchema } from '../entitySchemaRenderer';
import { entityConfigApiService } from '../../services/entityConfigApi';

vi.mock('../../services/entityConfigApi', () => ({
  entityConfigApiService: {
    getEntityTypeByCode: vi.fn(),
  },
}));

describe('entitySchemaRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch entity schema', async () => {
    const mockEntityType = {
      id: '1',
      code: 'pty_ltd',
      displayName: 'Private Company',
      requirements: [
        {
          id: 'req-1',
          requirementId: 'req-1',
          isRequired: true,
          displayOrder: 1,
          requirement: {
            id: 'req-1',
            code: 'companyName',
            displayName: 'Company Name',
            type: 'Information',
            fieldType: 'text',
            isActive: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        },
      ],
    };

    (entityConfigApiService.getEntityTypeByCode as any).mockResolvedValue(mockEntityType);

    const schema = await fetchEntitySchema('pty_ltd', {});

    expect(schema).toBeDefined();
    expect(schema?.entityTypeCode).toBe('pty_ltd');
  });

  it('should return null when entity type not found', async () => {
    (entityConfigApiService.getEntityTypeByCode as any).mockResolvedValue(null);

    const schema = await fetchEntitySchema('invalid', {});

    expect(schema).toBeNull();
  });

  it('should handle entity type without requirements', async () => {
    const mockEntityType = {
      id: '1',
      code: 'pty_ltd',
      displayName: 'Private Company',
      requirements: null,
    };

    (entityConfigApiService.getEntityTypeByCode as any).mockResolvedValue(mockEntityType);

    const schema = await fetchEntitySchema('pty_ltd', {});

    expect(schema).toBeNull();
  });
});

