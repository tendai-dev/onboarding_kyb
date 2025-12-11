/* eslint-disable security/detect-object-injection */
'use client';

import { useState, useEffect, useCallback } from 'react';

interface FormData {
  [key: string]: unknown;
}

interface UseFormPersistenceOptions {
  formId: string;
  autoSaveInterval?: number; // in milliseconds
  debounceMs?: number;
}

export function useFormPersistence<T extends FormData>(
  initialData: T,
  options: UseFormPersistenceOptions
) {
  const { formId, autoSaveInterval = 30000, debounceMs = 1000 } = options;
  const storageKey = `form_${formId}`;

  const [formData, setFormData] = useState<T>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load saved data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData) as { data: T; timestamp: string };
        setFormData(parsed.data);
        setLastSaved(new Date(parsed.timestamp));
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
    }
  }, [storageKey]);

  // Auto-save functionality
  useEffect(() => {
    if (!isDirty) return;

    const timeoutId = setTimeout(() => {
      saveToStorage();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [formData, isDirty, debounceMs]);

  // Periodic auto-save
  useEffect(() => {
    if (!isDirty) return;

    const intervalId = setInterval(() => {
      saveToStorage();
    }, autoSaveInterval);

    return () => clearInterval(intervalId);
  }, [isDirty, autoSaveInterval]);

  const saveToStorage = useCallback(async () => {
    if (!isDirty) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      const dataToSave = {
        data: formData,
        timestamp: new Date().toISOString(),
        version: '1.0',
      };

      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      setSaveError('Failed to save form data');
      console.error('Error saving form data:', error);
    } finally {
      setIsSaving(false);
    }
  }, [formData, isDirty, storageKey]);

  const updateField = useCallback((field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  }, []);

  const updateNestedField = useCallback(
    (parentField: string, childField: string, value: unknown) => {
      setFormData((prev) => {
        const parentValue = (prev[parentField] as Record<string, unknown>) || {};
        return {
          ...prev,
          [parentField]: {
            ...parentValue,
            [childField]: value,
          },
        };
      });
      setIsDirty(true);
    },
    []
  );

  const updateArrayField = useCallback((field: string, index: number, value: unknown) => {
    setFormData((prev) => {
      const fieldValue = (prev[field] as unknown[]) || [];
      return {
        ...prev,
        [field]: fieldValue.map((item: unknown, i: number) =>
          i === index ? value : item
        ),
      };
    });
    setIsDirty(true);
  }, []);

  const addArrayItem = useCallback((field: string, item: unknown) => {
    setFormData((prev) => {
      const fieldValue = (prev[field] as unknown[]) || [];
      return {
        ...prev,
        [field]: [...fieldValue, item],
      };
    });
    setIsDirty(true);
  }, []);

  const removeArrayItem = useCallback((field: string, index: number) => {
    setFormData((prev) => {
      const fieldValue = (prev[field] as unknown[]) || [];
      return {
        ...prev,
        [field]: fieldValue.filter((_: unknown, i: number) => i !== index),
      };
    });
    setIsDirty(true);
  }, []);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(storageKey);
    setLastSaved(null);
    setIsDirty(false);
  }, [storageKey]);

  const forceSave = useCallback(() => {
    return saveToStorage();
  }, [saveToStorage]);

  return {
    formData,
    updateField,
    updateNestedField,
    updateArrayField,
    addArrayItem,
    removeArrayItem,
    isDirty,
    lastSaved,
    isSaving,
    saveError,
    clearSavedData,
    forceSave,
  };
}
