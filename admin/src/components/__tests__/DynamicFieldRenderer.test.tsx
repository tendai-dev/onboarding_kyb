import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test/testUtils';
import { DynamicFieldRenderer } from '../DynamicFieldRenderer';
import { RenderableField } from '@/lib/entitySchemaRenderer';

describe('DynamicFieldRenderer', () => {
  it('should render text input field', () => {
    const field: RenderableField = {
      code: 'test-field',
      type: 'Text',
      label: 'Test Field',
      value: 'Test value',
      placeholder: 'Enter text',
      isRequired: false,
      order: 0,
    };

    const { container } = renderWithProviders(
      <DynamicFieldRenderer field={field} />
    );

    expect(container.querySelector('input[type="text"]')).toBeInTheDocument();
  });

  it('should render email input field', () => {
    const field: RenderableField = {
      code: 'email-field',
      type: 'Email',
      label: 'Email',
      value: 'test@example.com',
      placeholder: 'Enter email',
      isRequired: false,
      order: 0,
    };

    const { container } = renderWithProviders(
      <DynamicFieldRenderer field={field} />
    );

    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
  });

  it('should render phone input field', () => {
    const field: RenderableField = {
      code: 'phone-field',
      type: 'Phone',
      label: 'Phone',
      value: '+1234567890',
      placeholder: 'Enter phone',
      isRequired: false,
      order: 0,
    };

    const { container } = renderWithProviders(
      <DynamicFieldRenderer field={field} />
    );

    expect(container.querySelector('input[type="tel"]')).toBeInTheDocument();
  });

  it('should render textarea field', () => {
    const field: RenderableField = {
      code: 'textarea-field',
      type: 'Textarea',
      label: 'Description',
      value: 'Test description',
      placeholder: 'Enter description',
      isRequired: false,
      order: 0,
    };

    const { container } = renderWithProviders(
      <DynamicFieldRenderer field={field} />
    );

    expect(container.querySelector('textarea')).toBeInTheDocument();
  });

  it('should render number input field', () => {
    const field: RenderableField = {
      code: 'number-field',
      type: 'Number',
      label: 'Amount',
      value: '100',
      placeholder: 'Enter amount',
      isRequired: false,
      order: 0,
    };

    const { container } = renderWithProviders(
      <DynamicFieldRenderer field={field} />
    );

    expect(container.querySelector('input[type="number"]')).toBeInTheDocument();
  });

  it('should render date input field', () => {
    const field: RenderableField = {
      code: 'date-field',
      type: 'Date',
      label: 'Date',
      value: '2024-01-01',
      placeholder: 'mm/dd/yyyy',
      isRequired: false,
      order: 0,
    };

    const { container } = renderWithProviders(
      <DynamicFieldRenderer field={field} />
    );

    expect(container.querySelector('input[type="date"]')).toBeInTheDocument();
  });

  it('should render read-only field', () => {
    const field: RenderableField = {
      code: 'readonly-field',
      type: 'Text',
      label: 'Read Only',
      value: 'Read only value',
      isRequired: false,
      order: 0,
    };

    const { container } = renderWithProviders(
      <DynamicFieldRenderer field={field} readOnly={true} />
    );

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('readonly');
  });

  it('should render editable field', () => {
    const field: RenderableField = {
      code: 'editable-field',
      type: 'Text',
      label: 'Editable',
      value: 'Editable value',
      isRequired: false,
      order: 0,
    };

    const { container } = renderWithProviders(
      <DynamicFieldRenderer field={field} readOnly={false} />
    );

    const input = container.querySelector('input');
    expect(input).not.toHaveAttribute('readonly');
  });
});

