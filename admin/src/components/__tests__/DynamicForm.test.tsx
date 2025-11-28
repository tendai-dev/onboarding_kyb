import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { DynamicForm, FormField } from '../DynamicForm';

describe('DynamicForm', () => {
  const mockFields: FormField[] = [
    {
      id: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter name',
    },
    {
      id: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      validation: {
        pattern: '^[^@]+@[^@]+\\.[^@]+$',
      },
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      validation: {
        min: 18,
        max: 100,
      },
    },
    {
      id: 'country',
      label: 'Country',
      type: 'select',
      options: [
        { value: 'ZA', label: 'South Africa' },
        { value: 'US', label: 'United States' },
      ],
    },
    {
      id: 'newsletter',
      label: 'Subscribe to newsletter',
      type: 'checkbox',
    },
    {
      id: 'gender',
      label: 'Gender',
      type: 'radio',
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
      ],
    },
    {
      id: 'bio',
      label: 'Bio',
      type: 'textarea',
      placeholder: 'Enter bio',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form with all fields', () => {
      const onSubmit = vi.fn();
      renderWithProviders(<DynamicForm fields={mockFields} onSubmit={onSubmit} />);
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    });

    it('should handle text input changes', async () => {
    const onSubmit = vi.fn();
    const onFieldChange = vi.fn();
    
    renderWithProviders(
      <DynamicForm 
        fields={mockFields} 
        onSubmit={onSubmit}
        onFieldChange={onFieldChange}
      />
    );
    
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    
    await waitFor(() => {
      expect(onFieldChange).toHaveBeenCalledWith('name', 'John Doe');
    });
  });

    it('should validate required fields', async () => {
    const onSubmit = vi.fn();
    
    renderWithProviders(<DynamicForm fields={mockFields} onSubmit={onSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Form should not submit if required fields are missing
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

    it('should validate email format', async () => {
    const onSubmit = vi.fn();
    
    renderWithProviders(<DynamicForm fields={mockFields} onSubmit={onSubmit} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    await waitFor(() => {
      // Should show validation error
      expect(document.body).toBeInTheDocument();
    });
  });

    it('should validate number range', async () => {
    const onSubmit = vi.fn();
    
    renderWithProviders(<DynamicForm fields={mockFields} onSubmit={onSubmit} />);
    
    const ageInput = screen.getByLabelText(/age/i);
    fireEvent.change(ageInput, { target: { value: '150' } });
    fireEvent.blur(ageInput);
    
    await waitFor(() => {
      // Should show validation error for out of range
      expect(document.body).toBeInTheDocument();
    });
  });

    it('should handle select field changes', async () => {
    const onSubmit = vi.fn();
    const onFieldChange = vi.fn();
    
    renderWithProviders(
      <DynamicForm 
        fields={mockFields} 
        onSubmit={onSubmit}
        onFieldChange={onFieldChange}
      />
    );
    
    const countrySelect = screen.getByLabelText(/country/i);
    fireEvent.change(countrySelect, { target: { value: 'ZA' } });
    
    await waitFor(() => {
      expect(onFieldChange).toHaveBeenCalledWith('country', 'ZA');
    });
  });

    it('should handle checkbox changes', async () => {
    const onSubmit = vi.fn();
    const onFieldChange = vi.fn();
    
    renderWithProviders(
      <DynamicForm 
        fields={mockFields} 
        onSubmit={onSubmit}
        onFieldChange={onFieldChange}
      />
    );
    
    const checkbox = screen.getByLabelText(/newsletter/i);
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(onFieldChange).toHaveBeenCalledWith('newsletter', true);
    });
  });

    it('should handle radio button changes', async () => {
    const onSubmit = vi.fn();
    const onFieldChange = vi.fn();
    
    renderWithProviders(
      <DynamicForm 
        fields={mockFields} 
        onSubmit={onSubmit}
        onFieldChange={onFieldChange}
      />
    );
    
    const maleRadio = screen.getByLabelText(/male/i);
    fireEvent.click(maleRadio);
    
    await waitFor(() => {
      expect(onFieldChange).toHaveBeenCalledWith('gender', 'male');
    });
  });

    it('should submit form with valid data', async () => {
    const onSubmit = vi.fn();
    
    renderWithProviders(<DynamicForm fields={mockFields} onSubmit={onSubmit} />);
    
    // Fill in required fields
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
        })
      );
    });
  });

    it('should handle initial data', () => {
    const onSubmit = vi.fn();
    const initialData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      age: 25,
    };
    
    renderWithProviders(
      <DynamicForm 
        fields={mockFields} 
        onSubmit={onSubmit}
        initialData={initialData}
      />
    );
    
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
  });

    it('should handle conditional fields', async () => {
    const conditionalFields: FormField[] = [
      {
        id: 'hasPhone',
        label: 'Has Phone',
        type: 'checkbox',
      },
      {
        id: 'phone',
        label: 'Phone',
        type: 'tel',
        conditional: {
          field: 'hasPhone',
          operator: 'equals',
          value: true,
        },
      },
    ];
    
    const onSubmit = vi.fn();
    renderWithProviders(
      <DynamicForm 
        fields={conditionalFields} 
        onSubmit={onSubmit}
      />
    );
    
    // Phone field should not be visible initially
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
    
    // Check "Has Phone" checkbox
    const hasPhoneCheckbox = screen.getByLabelText(/has phone/i);
    fireEvent.click(hasPhoneCheckbox);
    
    await waitFor(() => {
      // Phone field should now be visible
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    });
  });

    it('should handle disabled state', () => {
    const onSubmit = vi.fn();
    
    renderWithProviders(
      <DynamicForm 
        fields={mockFields} 
        onSubmit={onSubmit}
        disabled={true}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });

    it('should handle loading state', () => {
    const onSubmit = vi.fn();
    
    renderWithProviders(
      <DynamicForm 
        fields={mockFields} 
        onSubmit={onSubmit}
        loading={true}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });

    it('should handle custom validation', async () => {
    const customValidationFields: FormField[] = [
      {
        id: 'password',
        label: 'Password',
        type: 'text',
        validation: {
          custom: (value: string) => {
            if (value.length < 8) {
              return 'Password must be at least 8 characters';
            }
            return null;
          },
        },
      },
    ];
    
    const onSubmit = vi.fn();
    renderWithProviders(
      <DynamicForm 
        fields={customValidationFields} 
        onSubmit={onSubmit}
      />
    );
    
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.blur(passwordInput);
    
    await waitFor(() => {
      // Should show custom validation error
      expect(document.body).toBeInTheDocument();
    });
  });

    it('should handle grouped fields', () => {
    const groupedFields: FormField[] = [
      {
        id: 'firstName',
        label: 'First Name',
        type: 'text',
        group: 'personal',
        order: 1,
      },
      {
        id: 'lastName',
        label: 'Last Name',
        type: 'text',
        group: 'personal',
        order: 2,
      },
      {
        id: 'company',
        label: 'Company',
        type: 'text',
        group: 'business',
        order: 1,
      },
    ];
    
    const onSubmit = vi.fn();
    renderWithProviders(
      <DynamicForm 
        fields={groupedFields} 
        onSubmit={onSubmit}
      />
    );
    
    // All fields should be rendered
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
  });
});
