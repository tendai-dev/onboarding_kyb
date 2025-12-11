'use client';

import {
  Box,
  HStack,
  VStack,
  Flex,
  useDisclosure,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { FiCheckCircle, FiEdit3, FiSend, FiDownload, FiClock } from 'react-icons/fi';
import { Typography, Tag, Button, Modal, ModalHeader, ModalBody, ModalFooter } from '@mukuru/mukuru-react-components';
import { useState } from 'react';

export interface SignNowSignatureFieldProps {
  label: string;
  signerEmail: string;
  signerName: string;
  signature: string; // Will store SignNow document ID or signature status
  onSignatureChange: (value: string) => void;
  documentId?: string; // SignNow document ID
  status?: 'pending' | 'sent' | 'signed' | 'declined';
  signedAt?: string;
  disabled?: boolean;
}

export function SignNowSignatureField({
  label,
  signerEmail,
  signerName,
  signature,
  onSignatureChange,
  documentId,
  status = 'pending',
  signedAt,
  disabled = false,
}: SignNowSignatureFieldProps) {
  const { open, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendForSignature = async () => {
    if (!documentId) {
      setError('Document not ready. Please save the form first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Send invite to signer
      const response = await fetch(`/api/signnow/document/${documentId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          invites: [
            {
              to: signerEmail,
              subject: 'Please sign the Risk Assessment Form',
              message: `Dear ${signerName},\n\nPlease review and sign the Risk Assessment Form.\n\nThank you.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send signature invite');
      }

      const result = await response.json();
      onSignatureChange(documentId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send signature invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!documentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/signnow/document/${documentId}`);
      if (!response.ok) {
        throw new Error('Failed to check document status');
      }

      const document = await response.json();
      // Update status based on document status
      if (document.status === 'completed') {
        onSignatureChange(documentId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!documentId) return;

    try {
      const response = await fetch(`/api/signnow/document/${documentId}/download`);
      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed-risk-assessment-${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'signed':
        return 'success';
      case 'sent':
        return 'info';
      case 'declined':
        return 'danger';
      default:
        return 'solid';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'signed':
        return 'Signed';
      case 'sent':
        return 'Sent for Signature';
      case 'declined':
        return 'Declined';
      default:
        return 'Pending';
    }
  };

  return (
    <Box>
      <Typography fontSize="14px" fontWeight="600" color="#374151" mb="8px">
        {label}:
      </Typography>
      <HStack gap="0">
        <Flex
          w="44px"
          h="44px"
          borderRadius="8px 0 0 8px"
          bg="#F3F4F6"
          border="1.5px solid"
          borderColor="#D1D5DB"
          borderRight="none"
          align="center"
          justify="center"
        >
          {status === 'signed' ? (
            <FiCheckCircle size={18} color="#10B981" />
          ) : (
            <FiClock size={18} color="#6B7280" />
          )}
        </Flex>
        <Box
          flex="1"
          h="44px"
          borderRadius="0 8px 8px 0"
          border="1.5px solid"
          borderColor="#D1D5DB"
          bg="white"
          px="14px"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <HStack gap="12px" flex="1">
            {signature && documentId ? (
              <>
                <Text fontSize="14px" color="#1F2937">
                  {signerName}
                </Text>
                <Tag variant={getStatusColor()}>{getStatusLabel()}</Tag>
                {signedAt && (
                  <Text fontSize="12px" color="#6B7280">
                    {new Date(signedAt).toLocaleDateString()}
                  </Text>
                )}
              </>
            ) : (
              <Text fontSize="14px" color="#9CA3AF" fontStyle="italic">
                Not sent for signature
              </Text>
            )}
          </HStack>
          <HStack gap="8px">
            {signature && documentId && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCheckStatus}
                  disabled={isLoading}
                >
                  <HStack gap="4px">
                    <FiClock size={14} />
                    <Typography fontSize="sm">Check Status</Typography>
                  </HStack>
                </Button>
                {status === 'signed' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDownload}
                  >
                    <HStack gap="4px">
                      <FiDownload size={14} />
                      <Typography fontSize="sm">Download</Typography>
                    </HStack>
                  </Button>
                )}
              </>
            )}
            {!disabled && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onOpen}
              >
                <HStack gap="4px">
                  {signature ? <FiEdit3 size={14} /> : <FiSend size={14} />}
                  <Typography fontSize="sm">
                    {signature ? 'Resend' : 'Send for Signature'}
                  </Typography>
                </HStack>
              </Button>
            )}
          </HStack>
        </Box>
      </HStack>

      {/* Send Signature Modal */}
      <Modal
        isOpen={open}
        onClose={onClose}
        title="Send for Signature"
        size="small"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <Typography fontSize="lg" fontWeight="700">
            Send for Signature
          </Typography>
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" gap="16px">
            <Box>
              <Typography fontSize="14px" fontWeight="600" mb="4px">
                Signer:
              </Typography>
              <Typography fontSize="14px" color="#6B7280">
                {signerName} ({signerEmail})
              </Typography>
            </Box>
            {error && (
              <Box p="12px" bg="rgba(220, 38, 38, 0.1)" borderRadius="8px" border="1px solid" borderColor="#DC2626">
                <Typography fontSize="13px" color="#DC2626">{error}</Typography>
              </Box>
            )}
            {!documentId && (
              <Box p="12px" bg="rgba(251, 191, 36, 0.1)" borderRadius="8px" border="1px solid" borderColor="#F59E0B">
                <Typography fontSize="13px" color="#92400E">
                  Please save the form first to generate the document for signing.
                </Typography>
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack gap="8px">
            <Button variant="secondary" onClick={onClose}>
              <Typography>Cancel</Typography>
            </Button>
            <Button
              variant="primary"
              onClick={handleSendForSignature}
              disabled={!documentId || isLoading}
            >
              <HStack gap="4px">
                {isLoading ? <Spinner size="sm" /> : <FiSend size={14} />}
                <Typography>
                  {isLoading ? 'Sending...' : 'Send Invite'}
                </Typography>
              </HStack>
            </Button>
          </HStack>
        </ModalFooter>
      </Modal>
    </Box>
  );
}

