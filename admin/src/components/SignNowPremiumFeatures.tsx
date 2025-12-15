'use client';

import { Box, VStack, HStack, useDisclosure, Spinner, Text } from '@chakra-ui/react';
import {
  FiFileText,
  FiLayers,
  FiLink,
  FiBarChart2,
  FiCopy,
  FiTrash2,
  FiDownload,
  FiEye,
  FiClock,
} from 'react-icons/fi';
import {
  Typography,
  Tag,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Card,
} from '@mukuru/mukuru-react-components';
import { useState, useEffect } from 'react';

export interface SignNowDocumentCardProps {
  documentId: string;
  documentName: string;
  status: 'pending' | 'completed' | 'cancelled' | 'declined';
  createdAt: number;
  pageCount?: number;
  onView?: () => void;
  onDownload?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onViewHistory?: () => void;
  onViewAnalytics?: () => void;
}

export function SignNowDocumentCard({
  documentId,
  documentName,
  status,
  createdAt,
  pageCount,
  onView,
  onDownload,
  onDuplicate,
  onDelete,
  onViewHistory,
  onViewAnalytics,
}: SignNowDocumentCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'info';
      case 'declined':
        return 'danger';
      case 'cancelled':
        return 'solid';
      default:
        return 'solid';
    }
  };

  return (
    <Card p="16px">
      <VStack align="stretch" gap="12px">
        <HStack justify="space-between">
          <VStack align="start" gap="4px">
            <Typography fontSize="16px" fontWeight="600">
              {documentName}
            </Typography>
            <HStack gap="8px">
              <Tag variant={getStatusColor()}>{status}</Tag>
              {pageCount && (
                <Typography fontSize="12px" color="#6B7280">
                  {pageCount} page{pageCount > 1 ? 's' : ''}
                </Typography>
              )}
            </HStack>
          </VStack>
          <Typography fontSize="12px" color="#6B7280">
            {new Date(createdAt * 1000).toLocaleDateString()}
          </Typography>
        </HStack>

        <HStack gap="8px" flexWrap="wrap">
          {onView && (
            <Button size="sm" variant="ghost" onClick={onView}>
              <HStack gap="4px">
                <FiEye size={14} />
                <Typography fontSize="sm">View</Typography>
              </HStack>
            </Button>
          )}
          {onDownload && status === 'completed' && (
            <Button size="sm" variant="ghost" onClick={onDownload}>
              <HStack gap="4px">
                <FiDownload size={14} />
                <Typography fontSize="sm">Download</Typography>
              </HStack>
            </Button>
          )}
          {onViewHistory && (
            <Button size="sm" variant="ghost" onClick={onViewHistory}>
              <HStack gap="4px">
                <FiClock size={14} />
                <Typography fontSize="sm">History</Typography>
              </HStack>
            </Button>
          )}
          {onViewAnalytics && (
            <Button size="sm" variant="ghost" onClick={onViewAnalytics}>
              <HStack gap="4px">
                <FiBarChart2 size={14} />
                <Typography fontSize="sm">Analytics</Typography>
              </HStack>
            </Button>
          )}
          {onDuplicate && (
            <Button size="sm" variant="ghost" onClick={onDuplicate}>
              <HStack gap="4px">
                <FiCopy size={14} />
                <Typography fontSize="sm">Duplicate</Typography>
              </HStack>
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="ghost" onClick={onDelete} colorScheme="red">
              <HStack gap="4px">
                <FiTrash2 size={14} />
                <Typography fontSize="sm">Delete</Typography>
              </HStack>
            </Button>
          )}
        </HStack>
      </VStack>
    </Card>
  );
}

export interface SignNowTemplateCardProps {
  templateId: string;
  templateName: string;
  pageCount?: number;
  createdAt: number;
  onUse?: () => void;
  onView?: () => void;
}

export function SignNowTemplateCard({
  templateId,
  templateName,
  pageCount,
  createdAt,
  onUse,
  onView,
}: SignNowTemplateCardProps) {
  return (
    <Card p="16px">
      <VStack align="stretch" gap="12px">
        <HStack justify="space-between">
          <VStack align="start" gap="4px">
            <HStack gap="8px">
              <FiLayers size={18} color="#6B7280" />
              <Typography fontSize="16px" fontWeight="600">
                {templateName}
              </Typography>
            </HStack>
            {pageCount && (
              <Typography fontSize="12px" color="#6B7280">
                {pageCount} page{pageCount > 1 ? 's' : ''}
              </Typography>
            )}
          </VStack>
          <Typography fontSize="12px" color="#6B7280">
            {new Date(createdAt * 1000).toLocaleDateString()}
          </Typography>
        </HStack>

        <HStack gap="8px">
          {onUse && (
            <Button size="sm" variant="primary" onClick={onUse}>
              <HStack gap="4px">
                <FiFileText size={14} />
                <Typography fontSize="sm">Use Template</Typography>
              </HStack>
            </Button>
          )}
          {onView && (
            <Button size="sm" variant="ghost" onClick={onView}>
              <HStack gap="4px">
                <FiEye size={14} />
                <Typography fontSize="sm">View</Typography>
              </HStack>
            </Button>
          )}
        </HStack>
      </VStack>
    </Card>
  );
}

export interface SignNowWebhookCardProps {
  webhookId: string;
  event: string;
  callbackUrl: string;
  onDelete?: () => void;
}

export function SignNowWebhookCard({
  webhookId,
  event,
  callbackUrl,
  onDelete,
}: SignNowWebhookCardProps) {
  return (
    <Card p="16px">
      <VStack align="stretch" gap="12px">
        <HStack justify="space-between">
          <VStack align="start" gap="4px">
            <HStack gap="8px">
              <FiLink size={18} color="#6B7280" />
              <Typography fontSize="16px" fontWeight="600">
                {event}
              </Typography>
            </HStack>
            <Typography fontSize="12px" color="#6B7280" fontFamily="mono">
              {callbackUrl}
            </Typography>
          </VStack>
        </HStack>

        {onDelete && (
          <HStack justify="flex-end">
            <Button size="sm" variant="ghost" onClick={onDelete} colorScheme="red">
              <HStack gap="4px">
                <FiTrash2 size={14} />
                <Typography fontSize="sm">Delete</Typography>
              </HStack>
            </Button>
          </HStack>
        )}
      </VStack>
    </Card>
  );
}

export interface SignNowDocumentHistoryViewProps {
  documentId: string;
  onClose: () => void;
}

export function SignNowDocumentHistoryView({
  documentId,
  onClose,
}: SignNowDocumentHistoryViewProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`/api/signnow/document/${documentId}/history`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch document history');
        }
        return res.json();
      })
      .then((data) => {
        setHistory(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch history');
        setIsLoading(false);
      });
  }, [documentId]);

  return (
    <Modal isOpen={true} onClose={onClose} title="Document History" size="large">
      <ModalHeader>
        <Typography fontSize="lg" fontWeight="700">
          Document History
        </Typography>
      </ModalHeader>
      <ModalBody>
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <Box
            p="12px"
            bg="rgba(220, 38, 38, 0.1)"
            borderRadius="8px"
            border="1px solid"
            borderColor="#DC2626"
          >
            <Typography fontSize="13px" color="#DC2626">
              {error}
            </Typography>
          </Box>
        ) : history.length === 0 ? (
          <Typography color="#6B7280">No history available</Typography>
        ) : (
          <VStack align="stretch" gap="8px">
            {history.map((item, index) => (
              <Box key={index} p="12px" bg="#F3F4F6" borderRadius="8px">
                <HStack justify="space-between">
                  <Typography fontSize="14px" fontWeight="600">
                    {item.action}
                  </Typography>
                  <Typography fontSize="12px" color="#6B7280">
                    {new Date(item.timestamp * 1000).toLocaleString()}
                  </Typography>
                </HStack>
                {item.user_email && (
                  <Typography fontSize="12px" color="#6B7280" mt="4px">
                    By: {item.user_email}
                  </Typography>
                )}
              </Box>
            ))}
          </VStack>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          <Typography>Close</Typography>
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export interface SignNowDocumentAnalyticsViewProps {
  documentId: string;
  onClose: () => void;
}

export function SignNowDocumentAnalyticsView({
  documentId,
  onClose,
}: SignNowDocumentAnalyticsViewProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`/api/signnow/document/${documentId}/analytics`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch document analytics');
        }
        return res.json();
      })
      .then((data) => {
        setAnalytics(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
        setIsLoading(false);
      });
  }, [documentId]);

  return (
    <Modal isOpen={true} onClose={onClose} title="Document Analytics" size="large">
      <ModalHeader>
        <Typography fontSize="lg" fontWeight="700">
          Document Analytics
        </Typography>
      </ModalHeader>
      <ModalBody>
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <Box
            p="12px"
            bg="rgba(220, 38, 38, 0.1)"
            borderRadius="8px"
            border="1px solid"
            borderColor="#DC2626"
          >
            <Typography fontSize="13px" color="#DC2626">
              {error}
            </Typography>
          </Box>
        ) : !analytics ? (
          <Typography color="#6B7280">No analytics available</Typography>
        ) : (
          <VStack align="stretch" gap="16px">
            <Box>
              <Typography fontSize="14px" fontWeight="600" mb="8px">
                Overview
              </Typography>
              <HStack gap="16px">
                <Box>
                  <Typography fontSize="12px" color="#6B7280">
                    Views
                  </Typography>
                  <Typography fontSize="20px" fontWeight="700">
                    {analytics.views}
                  </Typography>
                </Box>
                <Box>
                  <Typography fontSize="12px" color="#6B7280">
                    Completion Rate
                  </Typography>
                  <Typography fontSize="20px" fontWeight="700">
                    {(analytics.completion_rate * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </HStack>
            </Box>

            {analytics.signers && analytics.signers.length > 0 && (
              <Box>
                <Typography fontSize="14px" fontWeight="600" mb="8px">
                  Signers
                </Typography>
                <VStack align="stretch" gap="8px">
                  {analytics.signers.map((signer: any, index: number) => (
                    <Box key={index} p="12px" bg="#F3F4F6" borderRadius="8px">
                      <Typography fontSize="14px">{signer.email}</Typography>
                      {signer.signed_at && (
                        <Typography fontSize="12px" color="#6B7280">
                          Signed: {new Date(signer.signed_at * 1000).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          <Typography>Close</Typography>
        </Button>
      </ModalFooter>
    </Modal>
  );
}
