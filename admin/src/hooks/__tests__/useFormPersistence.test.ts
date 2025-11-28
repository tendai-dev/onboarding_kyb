import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFormPersistence } from '../useFormPersistence';

describe('useFormPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with provided data', () => {
    const initialData = { name: 'Test', email: 'test@example.com' };
    const { result } = renderHook(() =>
      useFormPersistence(initialData, { formId: 'test-form' })
    );

    expect(result.current.formData).toEqual(initialData);
  });

  it('should load saved data from localStorage', () => {
    const savedData = {
      data: { name: 'Saved', email: 'saved@example.com' },
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem('form_test-form', JSON.stringify(savedData));

    const { result } = renderHook(() =>
      useFormPersistence({ name: '', email: '' }, { formId: 'test-form' })
    );

    expect(result.current.formData).toEqual(savedData.data);
  });

  it('should update field and mark as dirty', async () => {
    const { result } = renderHook(() =>
      useFormPersistence({ name: '', email: '' }, { formId: 'test-form' })
    );

    act(() => {
      result.current.updateField('name', 'New Name');
    });

    expect(result.current.formData.name).toBe('New Name');
    expect(result.current.isDirty).toBe(true);
  });

  it('should save to localStorage when dirty', async () => {
    const { result } = renderHook(() =>
      useFormPersistence({ name: '', email: '' }, { formId: 'test-form', debounceMs: 100 })
    );

    act(() => {
      result.current.updateField('name', 'Test Name');
    });

    await waitFor(() => {
      const saved = localStorage.getItem('form_test-form');
      expect(saved).toBeTruthy();
      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.data.name).toBe('Test Name');
      }
    }, { timeout: 500 });
  });

  it('should update nested field', () => {
    const { result } = renderHook(() =>
      useFormPersistence(
        { user: { name: '', email: '' } },
        { formId: 'test-form' }
      )
    );

    act(() => {
      result.current.updateNestedField('user', 'name', 'Nested Name');
    });

    expect(result.current.formData.user.name).toBe('Nested Name');
  });

  it('should reset form data', () => {
    const initialData = { name: 'Initial', email: 'initial@example.com' };
    const { result } = renderHook(() =>
      useFormPersistence(initialData, { formId: 'test-form' })
    );

    act(() => {
      result.current.updateField('name', 'Changed');
      result.current.reset();
    });

    expect(result.current.formData).toEqual(initialData);
    expect(result.current.isDirty).toBe(false);
  });

  it('should clear saved data', () => {
    const savedData = {
      data: { name: 'Saved' },
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem('form_test-form', JSON.stringify(savedData));

    const { result } = renderHook(() =>
      useFormPersistence({ name: '' }, { formId: 'test-form' })
    );

    act(() => {
      result.current.clear();
    });

    expect(localStorage.getItem('form_test-form')).toBeNull();
  });
});

