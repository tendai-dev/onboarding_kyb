'use client';

import {
  Box,
  VStack,
  HStack,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { Button, Typography, Tag, Card, AlertBar } from '@/lib/mukuruImports';
import { useState, useEffect } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiDownload,
  FiAlertCircle,
  FiShield,
  FiRefreshCw,
} from 'react-icons/fi';

interface AcknowledgementFormProps {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  companyName?: string;
  onSigned?: () => void;
}

interface AcknowledgementStatus {
  status: 'pending' | 'document_ready' | 'sent' | 'signed' | 'declined' | 'self_acknowledged';
  documentId?: string;
  signedAt?: string;
  signedBy?: string;
  error?: string;
  selfSigned?: boolean;
}

export function AcknowledgementForm({
  applicationId,
  applicantName,
  applicantEmail,
  companyName,
  onSigned,
}: AcknowledgementFormProps) {
  const [acknowledgementStatus, setAcknowledgementStatus] =
    useState<AcknowledgementStatus>({ status: 'pending' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check acknowledgement status on mount
  useEffect(() => {
    let statusCheckTimer: NodeJS.Timeout | null = null;
    
    const checkStatus = () => {
      checkAcknowledgementStatus();
    };
    
    checkStatus();
    
    return () => {
      if (statusCheckTimer) {
        clearTimeout(statusCheckTimer);
      }
    };
  }, [applicationId]);

  const checkAcknowledgementStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/acknowledgement/${applicationId}/status`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No acknowledgement document exists yet - this is normal
          setAcknowledgementStatus({ status: 'pending' });
          return;
        }
        const errorText = await response.text();
        let errorMessage = 'Failed to check acknowledgement status';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setAcknowledgementStatus(data);
      
      // If signed, trigger callback
      if (data.status === 'signed' && onSigned) {
        onSigned();
      }
    } catch (err) {
      console.error('Error checking acknowledgement status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAndSendAcknowledgement = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/acknowledgement/${applicationId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          applicantName,
          applicantEmail,
          companyName,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to generate acknowledgement document';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Handle self-signed case (when user is SignNow account owner)
      if (data.selfSigned) {
        setAcknowledgementStatus({
          status: 'self_acknowledged',
          documentId: data.documentId,
          signedAt: new Date().toISOString(),
          signedBy: applicantName,
        });
        if (onSigned) {
          onSigned();
        }
      } else {
        setAcknowledgementStatus({
          status: 'sent',
          documentId: data.documentId,
        });

        // Check status after a short delay to see if it was signed
        // Note: This timeout is intentionally not cleaned up as it's a one-time check
        // and the component will handle the state update when it completes
        setTimeout(() => {
          checkAcknowledgementStatus();
        }, 2000);
      }
    } catch (err) {
      console.error('Error generating acknowledgement:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate acknowledgement document';
      setError(errorMessage);
      setAcknowledgementStatus((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSignedDocument = async () => {
    if (!acknowledgementStatus.documentId) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/acknowledgement/${applicationId}/download`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to download document';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acknowledgement-${applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download document';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (acknowledgementStatus.status) {
      case 'signed':
      case 'self_acknowledged':
        return 'success';
      case 'sent':
        return 'info';
      case 'declined':
        return 'danger';
      default:
        return 'warning';
    }
  };

  const getStatusLabel = () => {
    switch (acknowledgementStatus.status) {
      case 'signed':
        return 'Signed';
      case 'self_acknowledged':
        return 'Acknowledged';
      case 'sent':
        return 'Awaiting Signature';
      case 'declined':
        return 'Declined';
      default:
        return 'Pending';
    }
  };

  return (
    <Card p="6" borderRadius="lg" boxShadow="md">
      <VStack align="stretch" gap="4">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack gap="3">
            <Box
              p="2"
              borderRadius="md"
              bg="mukuru.background.light"
              color="mukuru.buttons.primary"
            >
              <FiShield size={24} />
            </Box>
            <VStack align="start" gap="0">
              <Typography fontSize="lg" fontWeight="bold" color="mukuru.text.primary">
                Final Acknowledgement
              </Typography>
              <Typography fontSize="sm" color="mukuru.grey.medium">
                Confirm accuracy and agree to terms
              </Typography>
            </VStack>
          </HStack>
          {acknowledgementStatus.status !== 'pending' && (
            <Tag variant={getStatusColor()}>{getStatusLabel()}</Tag>
          )}
        </HStack>

        {/* Content */}
        <Box
          bg="mukuru.background.light"
          p="4"
          borderRadius="md"
          border="1px solid"
          borderColor="mukuru.grey.light"
        >
          <VStack align="stretch" gap="3">
            <Typography fontSize="sm" color="mukuru.text.primary" lineHeight="1.6">
              Before your application can be finalized, you must sign an acknowledgement form
              confirming that:
            </Typography>
            <VStack align="start" gap="2" pl="4">
              <HStack gap="2">
                <FiCheckCircle size={16} color="var(--chakra-colors-mukuru-teal)" />
                <Typography fontSize="sm" color="mukuru.text.primary">
                  All information provided is accurate and complete
                </Typography>
              </HStack>
              <HStack gap="2">
                <FiCheckCircle size={16} color="var(--chakra-colors-mukuru-teal)" />
                <Typography fontSize="sm" color="mukuru.text.primary">
                  You agree to the relevant legal and product terms
                </Typography>
              </HStack>
              <HStack gap="2">
                <FiCheckCircle size={16} color="var(--chakra-colors-mukuru-teal)" />
                <Typography fontSize="sm" color="mukuru.text.primary">
                  You understand your obligations and responsibilities
                </Typography>
              </HStack>
            </VStack>
          </VStack>
        </Box>

        {/* Status Information */}
        {acknowledgementStatus.status === 'signed' && acknowledgementStatus.signedAt && (
          <Box
            bg="green.50"
            border="1px solid"
            borderColor="green.200"
            borderRadius="lg"
            p="4"
          >
            <HStack gap="3">
              <Box color="green.500">
                <FiCheckCircle size={24} />
              </Box>
              <VStack align="start" gap="1">
                <Typography fontWeight="semibold" color="green.700">
                  Acknowledgement Signed
                </Typography>
                <Typography fontSize="sm" color="green.600">
                  Signed on {new Date(acknowledgementStatus.signedAt).toLocaleDateString()}
                  {acknowledgementStatus.signedBy ? ` by ${acknowledgementStatus.signedBy}` : ''}
                </Typography>
              </VStack>
            </HStack>
          </Box>
        )}

        {acknowledgementStatus.status === 'self_acknowledged' && (
          <Box
            bg="green.50"
            border="1px solid"
            borderColor="green.200"
            borderRadius="lg"
            p="4"
          >
            <HStack gap="3">
              <Box color="green.500">
                <FiCheckCircle size={24} />
              </Box>
              <VStack align="start" gap="1">
                <Typography fontWeight="semibold" color="green.700">
                  Acknowledgement Complete
                </Typography>
                <Typography fontSize="sm" color="green.600">
                  Your acknowledgement has been recorded on {new Date().toLocaleDateString()}.
                  Thank you for confirming the accuracy of your application.
                </Typography>
              </VStack>
            </HStack>
          </Box>
        )}

        {acknowledgementStatus.status === 'sent' && (
          <Box
            bg="blue.50"
            border="1px solid"
            borderColor="blue.200"
            borderRadius="lg"
            p="4"
          >
            <HStack gap="3">
              <Box color="blue.500">
                <FiClock size={24} />
              </Box>
              <VStack align="start" gap="1">
                <Typography fontWeight="semibold" color="blue.700">
                  Signature Request Sent
                </Typography>
                <Typography fontSize="sm" color="blue.600">
                  Please check your email ({applicantEmail}) for the signature request.
                  Click the link in the email to sign the document.
                </Typography>
              </VStack>
            </HStack>
          </Box>
        )}

        {error && (
          <Box
            bg="red.50"
            border="1px solid"
            borderColor="red.200"
            borderRadius="lg"
            p="4"
          >
            <HStack gap="3">
              <Box color="red.500">
                <FiAlertCircle size={24} />
              </Box>
              <VStack align="start" gap="1">
                <Typography fontWeight="semibold" color="red.700">
                  Error
                </Typography>
                <Typography fontSize="sm" color="red.600">
                  {error}
                </Typography>
              </VStack>
            </HStack>
          </Box>
        )}

        {/* Actions */}
        <Flex justify="flex-end" gap="3" pt="2">
          {(acknowledgementStatus.status === 'signed' || acknowledgementStatus.status === 'self_acknowledged') && (
            <Button
              variant="secondary"
              onClick={downloadSignedDocument}
              disabled={isLoading}
              leftIcon={<FiDownload size={16} />}
            >
              Download Document
            </Button>
          )}

          {acknowledgementStatus.status === 'pending' && (
            <Button
              variant="primary"
              onClick={generateAndSendAcknowledgement}
              disabled={isLoading}
              leftIcon={isLoading ? <Spinner size="sm" /> : <FiShield size={16} />}
            >
              {isLoading ? 'Processing...' : 'Sign Acknowledgement'}
            </Button>
          )}

          {acknowledgementStatus.status === 'sent' && (
            <Button
              variant="secondary"
              onClick={checkAcknowledgementStatus}
              disabled={isLoading}
              leftIcon={isLoading ? <Spinner size="sm" /> : <FiRefreshCw size={16} />}
            >
              {isLoading ? 'Checking...' : 'Refresh Status'}
            </Button>
          )}
        </Flex>
      </VStack>
    </Card>
  );
}
