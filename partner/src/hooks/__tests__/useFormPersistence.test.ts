import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFormPersistence } from '../useFormPersistence';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useFormPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize with initial form data', () => {
      const initialData = { name: 'Test', email: 'test@example.com' };
      const { result } = renderHook(() =>
        useFormPersistence(initialData, { formId: 'test-form' })
      );

      expect(result.current.formData).toEqual(initialData);
    });

    it('should load saved data from localStorage if available', async () => {
      const savedData = { name: 'Saved', email: 'saved@example.com' };
      const storageData = {
        data: savedData,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storageData));

      const { result } = renderHook(() =>
        useFormPersistence({ name: '', email: '' }, { formId: 'test-form' })
      );

      // Wait for useEffect to load the data
      await waitFor(() => {
        expect(result.current.formData).toEqual(savedData);
      });
    });
  });

  describe('Field Updates', () => {
    it('should update field value', () => {
      const { result } = renderHook(() =>
        useFormPersistence({ name: '', email: '' }, { formId: 'test-form' })
      );

      act(() => {
        result.current.updateField('name', 'New Name');
      });

      expect(result.current.formData.name).toBe('New Name');
    });

    it('should mark form as dirty when field is updated', () => {
      const { result } = renderHook(() =>
        useFormPersistence({ name: '', email: '' }, { formId: 'test-form' })
      );

      act(() => {
        result.current.updateField('name', 'New Name');
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('should update nested field', () => {
      const { result } = renderHook(() =>
        useFormPersistence(
          { user: { name: '', email: '' } },
          { formId: 'test-form' }
        )
      );

      act(() => {
        result.current.updateNestedField('user', 'name', 'New Name');
      });

      expect(result.current.formData.user.name).toBe('New Name');
    });
  });

  describe('Array Field Updates', () => {
    it('should add array item', () => {
      const { result } = renderHook(() =>
        useFormPersistence({ items: [] }, { formId: 'test-form' })
      );

      act(() => {
        result.current.addArrayItem('items', { id: 1, name: 'Item 1' });
      });

      expect(result.current.formData.items).toHaveLength(1);
      expect(result.current.formData.items[0].name).toBe('Item 1');
    });

    it('should remove array item', () => {
      const { result } = renderHook(() =>
        useFormPersistence(
          { items: [{ id: 1 }, { id: 2 }] },
          { formId: 'test-form' }
        )
      );

      act(() => {
        result.current.removeArrayItem('items', 0);
      });

      expect(result.current.formData.items).toHaveLength(1);
      expect(result.current.formData.items[0].id).toBe(2);
    });

    it('should update array field', () => {
      const { result } = renderHook(() =>
        useFormPersistence(
          { items: [{ id: 1, name: 'Old' }] },
          { formId: 'test-form' }
        )
      );

      act(() => {
        result.current.updateArrayField('items', 0, { id: 1, name: 'New' });
      });

      expect(result.current.formData.items[0].name).toBe('New');
    });
  });

  describe('Auto-save', () => {
    it('should auto-save to localStorage after delay', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() =>
        useFormPersistence({ name: '' }, { formId: 'test-form', autoSave: true })
      );

      act(() => {
        result.current.updateField('name', 'New Name');
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Manual Save', () => {
    it('should save to localStorage when forceSave is called', () => {
      const { result } = renderHook(() =>
        useFormPersistence({ name: 'Test' }, { formId: 'test-form' })
      );

      act(() => {
        result.current.forceSave();
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should update lastSaved timestamp', () => {
      const { result } = renderHook(() =>
        useFormPersistence({ name: 'Test' }, { formId: 'test-form' })
      );

      act(() => {
        result.current.forceSave();
      });

      expect(result.current.lastSaved).toBeTruthy();
    });
  });

  describe('Clear Saved Data', () => {
    it('should clear saved data from localStorage', () => {
      const { result } = renderHook(() =>
        useFormPersistence({ name: 'Test' }, { formId: 'test-form' })
      );

      act(() => {
        result.current.clearSavedData();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() =>
        useFormPersistence({ name: 'Test' }, { formId: 'test-form' })
      );

      act(() => {
        result.current.forceSave();
      });

      // Should not crash
      expect(result.current.formData).toBeDefined();
    });
  });
});

