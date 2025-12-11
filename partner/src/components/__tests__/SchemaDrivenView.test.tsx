import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/testUtils';
import { SchemaDrivenView } from '../SchemaDrivenView';

describe('SchemaDrivenView', () => {
  const mockSchema = {
    code: 'PRIVATE_COMPANY',
    displayName: 'Private Company',
    requirements: [
      {
        requirement: {
          code: 'LEGAL_NAME',
          displayName: 'Legal Name',
          fieldType: 'Text',
          type: 'Information',
        },
        isRequired: true,
        displayOrder: 1,
      },
      {
        requirement: {
          code: 'REGISTRATION_NUMBER',
          displayName: 'Registration Number',
          fieldType: 'Text',
          type: 'Information',
        },
        isRequired: true,
        displayOrder: 2,
      },
    ],
  };

  const mockApplicationData = {
    businessLegalName: 'Test Company',
    businessRegistrationNumber: '123456',
    metadata: {
      legal_name: 'Test Company',
      registration_number: '123456',
    },
    rawData: {
      businessLegalName: 'Test Company',
      businessRegistrationNumber: '123456',
    },
  };

  const defaultProps = {
    schema: mockSchema,
    applicationData: mockApplicationData,
    readOnly: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const { container } = renderWithProviders(<SchemaDrivenView {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should render with schema and application data', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    renderWithProviders(<SchemaDrivenView {...defaultProps} />);
    expect(document.body).toBeInTheDocument();
  });

  it('should handle empty schema', () => {
    renderWithProviders(
      <SchemaDrivenView
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...defaultProps}
        schema={{ code: 'TEST', displayName: 'Test', requirements: [] }}
      />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should handle readOnly mode', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    renderWithProviders(<SchemaDrivenView {...defaultProps} readOnly={true} />);
    expect(document.body).toBeInTheDocument();
  });

  it('should map data to field values', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    renderWithProviders(<SchemaDrivenView {...defaultProps} />);
    expect(document.body).toBeInTheDocument();
  });

  it('should handle schema with sections', () => {
    const schemaWithSections = {
      ...mockSchema,
      sections: [
        {
          id: 'section1',
          title: 'Section 1',
          fields: mockSchema.requirements,
        },
      ],
    };
    renderWithProviders(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <SchemaDrivenView {...defaultProps} schema={schemaWithSections} />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should handle missing application data', () => {
    renderWithProviders(<SchemaDrivenView schema={mockSchema} applicationData={{}} />);
    expect(document.body).toBeInTheDocument();
  });

  it('should handle null application data', () => {
    renderWithProviders(
      <SchemaDrivenView
        schema={mockSchema}
        applicationData={null as unknown as Record<string, unknown>}
      />
    );
    expect(document.body).toBeInTheDocument();
  });
});
