'use client';
/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Box, VStack, HStack, Icon, Spinner } from '@chakra-ui/react';
import { Button, Typography, Tag } from '@/lib/mukuruImports';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiExternalLink,
  FiRefreshCw,
  FiInfo,
} from 'react-icons/fi';

interface ValidationResult {
  isValid: boolean;
  message: string;
  data?: any;
  confidence?: number;
  source?: string;
  timestamp?: string;
}

interface ExternalValidationProps {
  fieldId: string;
  value: string;
  validationType: 'company' | 'tax' | 'bank' | 'npo' | 'government';
  country?: string;
  onValidationComplete: (result: ValidationResult) => void;
  autoValidate?: boolean;
}

export function ExternalValidation({
  fieldId: _fieldId,
  value,
  validationType,
  country = 'ZA',
  onValidationComplete,
  autoValidate = true,
}: ExternalValidationProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [lastValidated, setLastValidated] = useState<string | null>(null);

  useEffect(() => {
    if (autoValidate && value && value !== lastValidated) {
      validateField();
    }
  }, [value, autoValidate]);

  const validateField = async () => {
    if (!value || value.length < 3) return;

    setIsValidating(true);
    setLastValidated(value);

    try {
      let validationResult: ValidationResult;

      switch (validationType) {
        case 'company':
          validationResult = await validateCompanyRegistration(value, country);
          break;
        case 'tax':
          validationResult = await validateTaxNumber(value, country);
          break;
        case 'bank':
          validationResult = await validateBankAccount(value, country);
          break;
        case 'npo':
          validationResult = await validateNPORegistration(value, country);
          break;
        case 'government':
          validationResult = await validateGovernmentEntity(value, country);
          break;
        default:
          validationResult = { isValid: false, message: 'Unknown validation type' };
      }

      setResult(validationResult);
      onValidationComplete(validationResult);
    } catch {
      const errorResult: ValidationResult = {
        isValid: false,
        message: 'Validation service unavailable',
        source: 'error',
      };
      setResult(errorResult);
      onValidationComplete(errorResult);
    } finally {
      setIsValidating(false);
    }
  };

  const validateCompanyRegistration = async (
    _registrationNumber: string,
    _country: string
  ): Promise<ValidationResult> => {
    // Mock Companies House API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate different validation results based on input
    const isValid = Math.random() > 0.3; // 70% success rate for demo

    if (isValid) {
      return {
        isValid: true,
        message: 'Company registration verified',
        data: {
          companyName: 'Example Company Ltd',
          status: 'Active',
          incorporationDate: '2020-01-15',
          address: '123 Business Street, City, Country',
          directors: ['John Smith', 'Jane Doe'],
          authorizedCapital: 'R1,000,000',
          issuedCapital: 'R500,000',
        },
        confidence: 0.95,
        source: 'Companies House',
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        isValid: false,
        message: 'Company registration number not found',
        confidence: 0.0,
        source: 'Companies House',
        timestamp: new Date().toISOString(),
      };
    }
  };

  const validateTaxNumber = async (
    _taxNumber: string,
    _country: string
  ): Promise<ValidationResult> => {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const isValid = Math.random() > 0.2; // 80% success rate

    if (isValid) {
      return {
        isValid: true,
        message: 'Tax number verified',
        data: {
          registeredName: 'Example Company Ltd',
          status: 'Active',
          registrationDate: '2020-01-15',
          taxType: 'VAT',
          complianceStatus: 'Compliant',
        },
        confidence: 0.9,
        source: 'SARS',
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        isValid: false,
        message: 'Invalid tax number format',
        confidence: 0.0,
        source: 'SARS',
        timestamp: new Date().toISOString(),
      };
    }
  };

  const validateBankAccount = async (
    _accountNumber: string,
    _country: string
  ): Promise<ValidationResult> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const isValid = Math.random() > 0.25; // 75% success rate

    if (isValid) {
      return {
        isValid: true,
        message: 'Bank account verified',
        data: {
          bankName: 'Standard Bank',
          accountType: 'Business Current',
          accountHolder: 'Example Company Ltd',
          branchCode: '051001',
          status: 'Active',
        },
        confidence: 0.85,
        source: 'Banking API',
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        isValid: false,
        message: 'Bank account not found',
        confidence: 0.0,
        source: 'Banking API',
        timestamp: new Date().toISOString(),
      };
    }
  };

  const validateNPORegistration = async (
    _registrationNumber: string,
    _country: string
  ): Promise<ValidationResult> => {
    await new Promise((resolve) => setTimeout(resolve, 1300));

    const isValid = Math.random() > 0.3; // 70% success rate

    if (isValid) {
      return {
        isValid: true,
        message: 'NPO registration verified',
        data: {
          organizationName: 'Example NPO',
          status: 'Active',
          registrationDate: '2019-03-15',
          organizationType: 'Non-Profit Organisation',
          complianceStatus: 'Compliant',
        },
        confidence: 0.92,
        source: 'NPO Database',
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        isValid: false,
        message: 'NPO registration not found',
        confidence: 0.0,
        source: 'NPO Database',
        timestamp: new Date().toISOString(),
      };
    }
  };

  const validateGovernmentEntity = async (
    _registrationNumber: string,
    _country: string
  ): Promise<ValidationResult> => {
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const isValid = Math.random() > 0.2; // 80% success rate

    if (isValid) {
      return {
        isValid: true,
        message: 'Government entity verified',
        data: {
          entityName: 'Example Government Department',
          status: 'Active',
          establishmentDate: '1994-04-27',
          jurisdiction: 'National',
          complianceStatus: 'Compliant',
        },
        confidence: 0.98,
        source: 'Government Registry',
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        isValid: false,
        message: 'Government entity not found',
        confidence: 0.0,
        source: 'Government Registry',
        timestamp: new Date().toISOString(),
      };
    }
  };

  const getValidationIcon = () => {
    if (isValidating) return FiRefreshCw;
    if (result?.isValid) return FiCheckCircle;
    return FiAlertCircle;
  };

  const getValidationColor = () => {
    if (isValidating) return 'blue';
    if (result?.isValid) return 'green';
    return 'red';
  };

  if (!value) return null;

  return (
    <Box mt="2">
      {isValidating ? (
        <HStack gap="2">
          <Spinner size="xs" color="info.500" />
          <Typography fontSize="xs" color="info.600">
            Validating {validationType}...
          </Typography>
        </HStack>
      ) : result ? (
        <VStack gap="2" align="stretch">
          <HStack gap="2">
            <Icon
              as={getValidationIcon()}
              boxSize="3"
              color={`${getValidationColor()}.500`}
            />
            <Typography fontSize="xs" color={`${getValidationColor()}.600`}>
              {result.message}
            </Typography>
            {result.source && (
              <Box title={`Validated by ${result.source}`}>
                <Icon as={FiExternalLink} boxSize="3" color="gray.400" />
              </Box>
            )}
          </HStack>

          {result.confidence && (
            <HStack gap="2">
              <Typography fontSize="xs" color="gray.500">
                Confidence:
              </Typography>
              <Tag variant="solid" size="md">
                {Math.round(result.confidence * 100)}%
              </Tag>
            </HStack>
          )}

          {result.data && (
            <Box p="2" bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
              <VStack gap="1" align="stretch">
                <Typography fontSize="xs" fontWeight="medium" color="gray.700">
                  Verified Information:
                </Typography>
                {Object.entries(result.data).map(([key, value]) => (
                  <HStack key={key} gap="2" fontSize="xs">
                    <Typography color="gray.500" minW="100px">
                      {key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase())}
                      :
                    </Typography>
                    <Typography color="gray.700">{String(value)}</Typography>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          <HStack gap="2">
            <Button size="sm" variant="ghost" onClick={validateField}>
              <Icon as={FiRefreshCw} mr="1" />
              Re-validate
            </Button>
            {result.timestamp && (
              <Typography fontSize="xs" color="gray.400">
                {new Date(result.timestamp).toLocaleTimeString()}
              </Typography>
            )}
          </HStack>
        </VStack>
      ) : (
        <HStack gap="2">
          <Icon as={FiInfo} boxSize="3" color="gray.400" />
          <Typography fontSize="xs" color="gray.500">
            Enter a {validationType} number to validate
          </Typography>
          <Button size="sm" variant="ghost" onClick={validateField}>
            <Icon as={FiRefreshCw} mr="1" />
            Validate
          </Button>
        </HStack>
      )}
    </Box>
  );
}

// Auto-population hook
export function useAutoPopulation() {
  const [autoPopulatedData, setAutoPopulatedData] = useState<Record<string, any>>({});

  const populateFromValidation = (
    fieldId: string,
    validationData: Record<string, any>
  ) => {
    const mapping: Record<string, string[]> = {
      companyName: ['companyName', 'registeredName'],
      businessAddress: ['address'],
      dateOfIncorporation: ['incorporationDate', 'registrationDate', 'establishmentDate'],
      authorizedCapital: ['authorizedCapital'],
      issuedCapital: ['issuedCapital'],
      organizationName: ['organizationName', 'entityName'],
      registeredName: ['registeredName', 'companyName'],
    };

    const fieldsToUpdate = mapping[fieldId] || [];
    const updates: Record<string, any> = {};

    fieldsToUpdate.forEach((field) => {
      if (validationData[field]) {
        updates[field] = validationData[field];
      }
    });

    if (Object.keys(updates).length > 0) {
      setAutoPopulatedData((prev) => ({ ...prev, ...updates }));
      return updates;
    }

    return {};
  };

  const clearAutoPopulatedData = () => {
    setAutoPopulatedData({});
  };

  return {
    autoPopulatedData,
    populateFromValidation,
    clearAutoPopulatedData,
  };
}
