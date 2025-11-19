'use client';

import React from 'react';
import {
  Box,
  Text,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { RenderableField } from '../lib/entitySchemaRenderer';

interface DynamicFieldRendererProps {
  field: RenderableField;
  readOnly?: boolean;
  onDocumentClick?: (fileData: any) => void;
}

/**
 * Dynamically renders a field based on its type from entity configuration
 */
export function DynamicFieldRenderer({
  field,
  readOnly = true,
  onDocumentClick,
}: DynamicFieldRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case 'Text':
      case 'Email':
      case 'Phone':
        return (
          <Input
            value={field.value || ''}
            placeholder={field.placeholder}
            readOnly={readOnly}
            type={
              field.type === 'Email'
                ? 'email'
                : field.type === 'Phone'
                ? 'tel'
                : 'text'
            }
            bg={readOnly ? 'gray.50' : 'white'}
            borderColor={readOnly ? 'gray.200' : 'gray.300'}
            borderWidth="1px"
            borderRadius="md"
            px="3"
            py="2"
            fontSize="sm"
            _readOnly={{
              cursor: 'default',
              opacity: 1
            }}
          />
        );

      case 'Textarea':
        return (
          <Textarea
            value={field.value || ''}
            placeholder={field.placeholder}
            readOnly={readOnly}
            rows={4}
            bg={readOnly ? 'gray.50' : 'white'}
            borderColor={readOnly ? 'gray.200' : 'gray.300'}
            borderWidth="1px"
            borderRadius="md"
            px="3"
            py="2"
            fontSize="sm"
            _readOnly={{
              cursor: 'default',
              opacity: 1
            }}
          />
        );

      case 'Number':
        return (
          <Input
            value={field.value || ''}
            placeholder={field.placeholder}
            readOnly={readOnly}
            type="number"
            bg={readOnly ? 'gray.50' : 'white'}
            borderColor={readOnly ? 'gray.200' : 'gray.300'}
          />
        );

      case 'Date':
        return (
          <Input
            value={
              field.value
                ? new Date(field.value).toISOString().split('T')[0]
                : ''
            }
            placeholder={field.placeholder || 'mm/dd/yyyy'}
            readOnly={readOnly}
            type="date"
            bg={readOnly ? 'gray.50' : 'white'}
            borderColor={readOnly ? 'gray.200' : 'gray.300'}
            borderWidth="1px"
            borderRadius="md"
            px="3"
            py="2"
            fontSize="sm"
            _readOnly={{
              cursor: 'default',
              opacity: 1
            }}
          />
        );

      case 'Select':
      case 'MultiSelect':
        if (field.options && field.options.length > 0) {
          if (field.type === 'MultiSelect') {
            // For multi-select, show selected values as badges
            const selectedValues = Array.isArray(field.value)
              ? field.value
              : field.value
              ? [field.value]
              : [];
            return (
              <HStack wrap="wrap" gap="2">
                {selectedValues.length > 0 ? (
                  selectedValues.map((val: string, idx: number) => {
                    const option = field.options?.find((opt) => opt.value === val);
                    return (
                      <Badge key={idx} colorScheme="blue" px="2" py="1">
                        {option?.label || val}
                      </Badge>
                    );
                  })
                ) : (
                  <Text color="gray.400" fontSize="sm">
                    No selection
                  </Text>
                )}
              </HStack>
            );
          } else {
            // Single select
            const selectedOption = field.options.find(
              (opt) => opt.value === field.value
            );
            return (
              <Input
                value={selectedOption?.label || field.value || ''}
                placeholder={field.placeholder}
                readOnly={true}
                bg="gray.50"
                borderColor="gray.200"
              />
            );
          }
        }
        return (
          <Input
            value={field.value || ''}
            placeholder={field.placeholder}
            readOnly={readOnly}
            bg={readOnly ? 'gray.50' : 'white'}
            borderColor={readOnly ? 'gray.200' : 'gray.300'}
          />
        );

      case 'Checkbox':
        return (
          <HStack>
            <input
              type="checkbox"
              checked={field.value === true || field.value === 'true'}
              readOnly={readOnly}
              disabled={readOnly}
            />
            <Text fontSize="sm" color="gray.600">
              {field.value === true || field.value === 'true' ? 'Yes' : 'No'}
            </Text>
          </HStack>
        );

      case 'File':
        // For file fields, show file name or "Not provided"
        // Try to parse JSON if value is a JSON string
        let fileData: any = null;
        if (field.value) {
          try {
            if (typeof field.value === 'string' && field.value.startsWith('{')) {
              fileData = JSON.parse(field.value);
            } else if (typeof field.value === 'object') {
              fileData = field.value;
            }
          } catch (e) {
            // Not JSON, treat as plain filename
          }
        }

        return (
          <Box>
            {field.value ? (
              <HStack gap="2">
                <Text 
                  fontSize="sm" 
                  color="orange.600"
                  cursor="pointer"
                  _hover={{ textDecoration: "underline" }}
                  onClick={() => {
                    if (onDocumentClick && fileData) {
                      onDocumentClick(fileData);
                    } else if (fileData && fileData.fileName) {
                      // Fallback: try to get document from case if no callback provided
                      const caseId = (window.location.pathname.match(/\/applications\/([^\/]+)/) || [])[1];
                      if (caseId) {
                        fetch(`/api/proxy/api/v1/documents/case/${caseId}`)
                          .then(res => res.json())
                          .then(documents => {
                            const doc = Array.isArray(documents) 
                              ? documents.find((d: any) => d.fileName === fileData.fileName || d.documentNumber === fileData.requirementCode)
                              : null;
                            
                            if (doc && doc.storageKey) {
                              return fetch(`/api/proxy/api/v1/documents/download/${encodeURIComponent(doc.storageKey)}`);
                            }
                            throw new Error('Document not found');
                          })
                          .then(res => res.json())
                          .then(data => {
                            if (data.url) {
                              window.open(data.url, '_blank');
                            }
                          })
                          .catch(err => {
                            console.error('Error viewing document:', err);
                            alert('Document viewing is not available for this file. Please use the Documents page to view it.');
                          });
                      } else {
                        alert('Document viewing is not available for this file. Please use the Documents page to view it.');
                      }
                    }
                  }}
                >
                  {fileData?.fileName || (typeof field.value === 'string' ? field.value : 'File attached')}
                </Text>
                {fileData?.fileSize && (
                  <Text fontSize="xs" color="gray.500">
                    ({(fileData.fileSize / 1024 / 1024).toFixed(2)} MB)
                  </Text>
                )}
              </HStack>
            ) : (
              <Text fontSize="sm" color="gray.400">
                Not provided
              </Text>
            )}
          </Box>
        );

      case 'Country':
        return (
          <Input
            value={field.value || ''}
            placeholder={field.placeholder || 'Country code'}
            readOnly={readOnly}
            bg={readOnly ? 'gray.50' : 'white'}
            borderColor={readOnly ? 'gray.200' : 'gray.300'}
          />
        );

      case 'Currency':
        return (
          <Input
            value={
              field.value
                ? typeof field.value === 'number'
                  ? field.value.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })
                  : field.value
                : ''
            }
            placeholder={field.placeholder}
            readOnly={readOnly}
            bg={readOnly ? 'gray.50' : 'white'}
            borderColor={readOnly ? 'gray.200' : 'gray.300'}
          />
        );

      case 'Address':
        return (
          <Textarea
            value={field.value || ''}
            placeholder={field.placeholder}
            readOnly={readOnly}
            rows={3}
            bg={readOnly ? 'gray.50' : 'white'}
            borderColor={readOnly ? 'gray.200' : 'gray.300'}
            borderWidth="1px"
            borderRadius="md"
            px="3"
            py="2"
            fontSize="sm"
            _readOnly={{
              cursor: 'default',
              opacity: 1
            }}
          />
        );

      default:
        // Fallback for unknown types
        return (
          <Input
            value={field.value || ''}
            placeholder={field.placeholder}
            readOnly={readOnly}
            bg={readOnly ? 'gray.50' : 'white'}
            borderColor={readOnly ? 'gray.200' : 'gray.300'}
          />
        );
    }
  };

  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
        {field.label}
        {field.isRequired && (
          <Text as="span" color="red.500" ml="1">
            *
          </Text>
        )}
      </Text>
      {renderField()}
      {field.helpText && (
        <Text fontSize="xs" color="gray.500" mt="1.5">
          {field.helpText}
        </Text>
      )}
    </Box>
  );
}

