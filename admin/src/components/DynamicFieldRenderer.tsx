'use client';

import React from 'react';
import { Box, HStack, Textarea, Input as ChakraInput } from '@chakra-ui/react';
// Import components directly from Mukuru package
import { Typography, Tag } from '@mukuru/mukuru-react-components';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;
import { RenderableField } from '../lib/entitySchemaRenderer';

interface DynamicFieldRendererProps {
  field: RenderableField;
  readOnly?: boolean;
  onDocumentClick?: (fileData: Record<string, unknown>) => void;
}

/**
 * Dynamically renders a field based on its type from entity configuration
 */
export function DynamicFieldRenderer({
  field,
  readOnly = true,
  onDocumentClick,
}: DynamicFieldRendererProps) {
  // Color mode values for dark/light mode support
  const inputBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const readOnlyBg = useColorModeValue(
    'mukuru.background.light',
    'mukuru.background.dark'
  );
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');
  const borderColorActive = useColorModeValue('mukuru.grey.medium', 'mukuru.grey.400');

  const renderField = () => {
    switch (field.type) {
      case 'Text':
      case 'Email':
      case 'Phone':
        return (
          <ChakraInput
            value={
              typeof field.value === 'string' || typeof field.value === 'number'
                ? String(field.value)
                : ''
            }
            placeholder={field.placeholder}
            readOnly={readOnly}
            type={
              field.type === 'Email' ? 'email' : field.type === 'Phone' ? 'tel' : 'text'
            }
            bg={readOnly ? readOnlyBg : inputBg}
            borderColor={readOnly ? borderColor : borderColorActive}
            borderWidth="1px"
            borderRadius="md"
            px="3"
            py="2"
            fontSize="sm"
            _readOnly={{
              cursor: 'default',
              opacity: 1,
            }}
          />
        );

      case 'Textarea':
        return (
          <Textarea
            value={
              typeof field.value === 'string' || typeof field.value === 'number'
                ? String(field.value)
                : ''
            }
            placeholder={field.placeholder}
            readOnly={readOnly}
            rows={4}
            bg={readOnly ? readOnlyBg : inputBg}
            borderColor={readOnly ? borderColor : borderColorActive}
            borderWidth="1px"
            borderRadius="md"
            px="3"
            py="2"
            fontSize="sm"
            _readOnly={{
              cursor: 'default',
              opacity: 1,
            }}
          />
        );

      case 'Number':
        return (
          <ChakraInput
            value={
              typeof field.value === 'string' || typeof field.value === 'number'
                ? String(field.value)
                : ''
            }
            placeholder={field.placeholder}
            readOnly={readOnly}
            type="number"
            bg={readOnly ? readOnlyBg : inputBg}
            borderColor={readOnly ? borderColor : borderColorActive}
          />
        );

      case 'Date':
        return (
          <ChakraInput
            value={
              field.value &&
              (typeof field.value === 'string' || typeof field.value === 'number')
                ? new Date(field.value).toISOString().split('T')[0]
                : ''
            }
            placeholder={field.placeholder || 'mm/dd/yyyy'}
            readOnly={readOnly}
            type="date"
            bg={readOnly ? readOnlyBg : inputBg}
            borderColor={readOnly ? borderColor : borderColorActive}
            borderWidth="1px"
            borderRadius="md"
            px="3"
            py="2"
            fontSize="sm"
            _readOnly={{
              cursor: 'default',
              opacity: 1,
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
                      <Tag key={idx} variant="info">
                        {option?.label || val}
                      </Tag>
                    );
                  })
                ) : (
                  <Typography color="gray.400" fontSize="sm">
                    No selection
                  </Typography>
                )}
              </HStack>
            );
          } else {
            // Single select
            const selectedOption = field.options.find((opt) => opt.value === field.value);
            return (
              <ChakraInput
                value={
                  selectedOption?.label ||
                  (typeof field.value === 'string' || typeof field.value === 'number'
                    ? String(field.value)
                    : '')
                }
                placeholder={field.placeholder}
                readOnly={true}
                bg="gray.50"
                borderColor="gray.200"
              />
            );
          }
        }
        return (
          <ChakraInput
            value={
              typeof field.value === 'string' || typeof field.value === 'number'
                ? String(field.value)
                : ''
            }
            placeholder={field.placeholder}
            readOnly={readOnly}
            bg={readOnly ? readOnlyBg : inputBg}
            borderColor={readOnly ? borderColor : borderColorActive}
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
            <Typography fontSize="sm" color="gray.600">
              {field.value === true || field.value === 'true' ? 'Yes' : 'No'}
            </Typography>
          </HStack>
        );

      case 'File': {
        // For file fields, show file name or "Not provided"
        // Try to parse JSON if value is a JSON string
        let fileData: Record<string, unknown> | null = null;
        if (field.value) {
          try {
            if (typeof field.value === 'string' && field.value.startsWith('{')) {
              fileData = JSON.parse(field.value) as Record<string, unknown>;
            } else if (typeof field.value === 'object') {
              fileData = field.value as Record<string, unknown>;
            }
          } catch {
            // Not JSON, treat as plain filename
          }
        }

        return (
          <Box>
            {field.value ? (
              <HStack gap="2">
                <Typography
                  fontSize="sm"
                  color="orange.600"
                  cursor="pointer"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={() => {
                    if (onDocumentClick && fileData) {
                      onDocumentClick(fileData);
                    } else if (fileData && fileData.fileName) {
                      // Fallback: try to get document from case if no callback provided
                      const caseId = (window.location.pathname.match(
                        /\/applications\/([^/]+)/
                      ) || [])[1];
                      if (caseId) {
                        fetch(`/api/proxy/api/v1/documents/case/${caseId}`)
                          .then((res) => res.json())
                          .then((documents) => {
                            const doc = Array.isArray(documents)
                              ? documents.find(
                                  (d: Record<string, unknown>) =>
                                    d.fileName === fileData.fileName ||
                                    d.documentNumber === fileData.requirementCode
                                )
                              : null;

                            if (doc && doc.storageKey) {
                              return fetch(
                                `/api/proxy/api/v1/documents/download/${encodeURIComponent(doc.storageKey)}`
                              );
                            }
                            throw new Error('Document not found');
                          })
                          .then((res) => res.json())
                          .then((data) => {
                            if (data.url) {
                              window.open(data.url, '_blank');
                            }
                          })
                          .catch((err) => {
                            console.error('Error viewing document:', err);
                            alert(
                              'Document viewing is not available for this file. Please use the Documents page to view it.'
                            );
                          });
                      } else {
                        alert(
                          'Document viewing is not available for this file. Please use the Documents page to view it.'
                        );
                      }
                    }
                  }}
                >
                  {fileData?.fileName
                    ? String(fileData.fileName)
                    : typeof field.value === 'string'
                      ? field.value
                      : 'File attached'}
                </Typography>
                {fileData?.fileSize && typeof fileData.fileSize === 'number' ? (
                  <Typography fontSize="xs" color="gray.500">
                    ({((fileData.fileSize as number) / 1024 / 1024).toFixed(2)} MB)
                  </Typography>
                ) : null}
              </HStack>
            ) : (
              <Typography fontSize="sm" color="gray.400">
                Not provided
              </Typography>
            )}
          </Box>
        );
      }

      case 'Country':
        return (
          <ChakraInput
            value={
              typeof field.value === 'string' || typeof field.value === 'number'
                ? String(field.value)
                : ''
            }
            placeholder={field.placeholder || 'Country code'}
            readOnly={readOnly}
            bg={readOnly ? readOnlyBg : inputBg}
            borderColor={readOnly ? borderColor : borderColorActive}
          />
        );

      case 'Currency':
        return (
          <ChakraInput
            value={
              field.value &&
              (typeof field.value === 'string' || typeof field.value === 'number')
                ? typeof field.value === 'number'
                  ? field.value.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })
                  : String(field.value)
                : ''
            }
            placeholder={field.placeholder}
            readOnly={readOnly}
            bg={readOnly ? readOnlyBg : inputBg}
            borderColor={readOnly ? borderColor : borderColorActive}
          />
        );

      case 'Address':
        return (
          <Textarea
            value={
              typeof field.value === 'string' || typeof field.value === 'number'
                ? String(field.value)
                : ''
            }
            placeholder={field.placeholder}
            readOnly={readOnly}
            rows={3}
            bg={readOnly ? readOnlyBg : inputBg}
            borderColor={readOnly ? borderColor : borderColorActive}
            borderWidth="1px"
            borderRadius="md"
            px="3"
            py="2"
            fontSize="sm"
            _readOnly={{
              cursor: 'default',
              opacity: 1,
            }}
          />
        );

      default:
        // Fallback for unknown types
        return (
          <ChakraInput
            value={
              typeof field.value === 'string' || typeof field.value === 'number'
                ? String(field.value)
                : ''
            }
            placeholder={field.placeholder}
            readOnly={readOnly}
            bg={readOnly ? readOnlyBg : inputBg}
            borderColor={readOnly ? borderColor : borderColorActive}
          />
        );
    }
  };

  return (
    <Box>
      <Typography fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
        {field.label}
        {field.isRequired && (
          <Typography as="span" color="red.500" ml="1">
            *
          </Typography>
        )}
      </Typography>
      {renderField()}
      {field.helpText && (
        <Typography fontSize="xs" color="gray.500" mt="1.5">
          {field.helpText}
        </Typography>
      )}
    </Box>
  );
}
