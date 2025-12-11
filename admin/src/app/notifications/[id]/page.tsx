'use client';

import {
  Box,
  VStack,
  HStack,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import {
  Typography,
  Button,
  Tag,
  IconWrapper,
  // Icons
  DeleteIcon,
  EditIcon,
  TickCircleIcon,
  CloseIcon,
} from '@mukuru/mukuru-react-components';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../../components/AdminSidebar';
import { useSidebar } from '../../../contexts/SidebarContext';
import { FiBell, FiMail, FiZap, FiClock, FiUsers, FiFileText, FiArrowLeft, FiSave, FiMessageSquare } from 'react-icons/fi';

interface Notification {
  id: string;
  name: string;
  type: 'EMAIL' | 'SYSTEM' | 'SMS';
  trigger: string;
  description: string;
  isActive: boolean;
  recipients: string[];
  template: string;
  lastSent?: string;
  frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

// Mock data - in real app this would come from API
const mockNotifications: Notification[] = [
  {
    id: 'NOTIF-001',
    name: 'Application Submitted',
    type: 'EMAIL',
    trigger: 'Application submitted by partner/customer',
    description: 'Notify admin team when new application is submitted',
    isActive: true,
    recipients: ['admin@mukuru.com', 'onboarding@mukuru.com'],
    template: 'New application submitted by {{companyName}} for {{entityType}}',
    lastSent: '2024-01-15T10:30:00Z',
    frequency: 'IMMEDIATE',
  },
  {
    id: 'NOTIF-002',
    name: 'High Risk Alert',
    type: 'EMAIL',
    trigger: 'High risk application detected',
    description: 'Alert senior management for high-risk applications',
    isActive: true,
    recipients: ['senior@mukuru.com', 'risk@mukuru.com'],
    template: 'URGENT: High risk application {{applicationId}} requires immediate review',
    lastSent: '2024-01-14T15:45:00Z',
    frequency: 'IMMEDIATE',
  },
  {
    id: 'NOTIF-003',
    name: 'Overdue Refresh',
    type: 'EMAIL',
    trigger: 'Partner refresh is overdue',
    description: 'Notify assigned admin when partner refresh is overdue',
    isActive: true,
    recipients: ['admin@mukuru.com'],
    template: 'Partner {{companyName}} refresh is overdue by {{daysOverdue}} days',
    frequency: 'DAILY',
  },
  {
    id: 'NOTIF-004',
    name: 'Data Protection Alert',
    type: 'EMAIL',
    trigger: 'High risk partner requires DP review',
    description: 'Notify Data Protection team for high-risk partners',
    isActive: true,
    recipients: ['ddhrp@mukuru.com'],
    template: 'High risk partner {{companyName}} requires Data Protection review',
    lastSent: '2024-01-13T09:15:00Z',
    frequency: 'IMMEDIATE',
  },
  {
    id: 'NOTIF-005',
    name: 'Commercial Manager Update',
    type: 'EMAIL',
    trigger: 'Partner progress update',
    description: 'Weekly update to commercial managers on their partners',
    isActive: true,
    recipients: ['commercial@mukuru.com'],
    template: 'Weekly partner progress report for {{managerName}}',
    frequency: 'WEEKLY',
  },
];

export default function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { condensed } = useSidebar();
  const router = useRouter();
  const resolvedParams = use(params);
  const notificationId = resolvedParams.id;

  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotification, setEditedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const found = mockNotifications.find(n => n.id === notificationId);
      setNotification(found || null);
      setEditedNotification(found || null);
      setLoading(false);
    }, 500);
  }, [notificationId]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <FiMail size={20} />;
      case 'SYSTEM': return <FiBell size={20} />;
      case 'SMS': return <FiMessageSquare size={20} />;
      default: return <FiBell size={20} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EMAIL': return { bg: '#DBEAFE', color: '#2563EB' };
      case 'SYSTEM': return { bg: '#D1FAE5', color: '#059669' };
      case 'SMS': return { bg: '#FEF3C7', color: '#D97706' };
      default: return { bg: '#E5E7EB', color: '#6B7280' };
    }
  };

  const handleSave = () => {
    if (editedNotification) {
      setNotification(editedNotification);
      setIsEditing(false);
      // In real app, would call API to save
    }
  };

  const handleCancel = () => {
    setEditedNotification(notification);
    setIsEditing(false);
  };

  const handleToggleActive = () => {
    if (notification) {
      const updated = { ...notification, isActive: !notification.isActive };
      setNotification(updated);
      setEditedNotification(updated);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="#F8FAFC">
        <AdminSidebar />
        <Box
          ml={condensed ? '72px' : '280px'}
          minH="100vh"
          bg="#F8FAFC"
          transition="margin-left 0.3s ease"
        >
          <Flex justify="center" align="center" h="100vh">
            <VStack gap="16px">
              <Spinner size="lg" color="orange.500" />
              <Typography color="#64748B" fontSize="14px">Loading notification...</Typography>
            </VStack>
          </Flex>
        </Box>
      </Box>
    );
  }

  if (!notification) {
    return (
      <Box minH="100vh" bg="#F8FAFC">
        <AdminSidebar />
        <Box
          ml={condensed ? '72px' : '280px'}
          minH="100vh"
          bg="#F8FAFC"
          transition="margin-left 0.3s ease"
        >
          <Flex justify="center" align="center" h="100vh">
            <VStack gap="16px" textAlign="center">
              <Box p="24px" borderRadius="full" bg="#FEE2E2">
                <FiBell size={40} color="#DC2626" />
              </Box>
              <Typography color="#1E293B" fontSize="18px" fontWeight="600">
                Notification not found
              </Typography>
              <Typography color="#64748B" fontSize="14px">
                The notification you're looking for doesn't exist
              </Typography>
              <Button variant="secondary" onClick={() => router.push('/notifications')}>
                Back to Notifications
              </Button>
            </VStack>
          </Flex>
        </Box>
      </Box>
    );
  }

  const typeColors = getTypeColor(notification.type);

  return (
    <Box minH="100vh" bg="#F8FAFC">
      <AdminSidebar />

      <Box
        ml={condensed ? '72px' : '280px'}
        minH="100vh"
        bg="#F8FAFC"
        transition="margin-left 0.3s ease"
      >
        {/* Page Header */}
        <Box 
          px="32px" 
          py="24px" 
          bg="white" 
          borderBottom="1px solid" 
          borderColor="#E2E8F0"
          position="sticky"
          top="0"
          zIndex={10}
        >
          <Flex justify="space-between" align="center">
            <HStack gap="16px" align="center">
              <Box
                as="button"
                p="10px"
                borderRadius="10px"
                border="1px solid #E2E8F0"
                cursor="pointer"
                transition="all 0.15s"
                _hover={{ bg: '#F8FAFC', borderColor: '#CBD5E1' }}
                onClick={() => router.push('/notifications')}
              >
                <FiArrowLeft size={18} color="#64748B" />
              </Box>
              <Box 
                p="12px" 
                bg={typeColors.bg}
                borderRadius="12px"
              >
                <Box color={typeColors.color}>
                  {getTypeIcon(notification.type)}
                </Box>
              </Box>
              <VStack align="start" gap="2px">
                <HStack gap="8px">
                  <Typography fontSize="24px" fontWeight="700" color="#1E293B" lineHeight="1.2">
                    {notification.name}
                  </Typography>
                  <Tag variant={notification.isActive ? 'success' : 'inactive'}>
                    {notification.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                </HStack>
                <Typography fontSize="14px" color="#64748B" fontWeight="400">
                  {notification.description}
                </Typography>
              </VStack>
            </HStack>

            <HStack gap="12px">
              {isEditing ? (
                <>
                  <Button variant="secondary" size="sm" onClick={handleCancel}>
                    <IconWrapper>
                      <CloseIcon width="14" height="14" />
                    </IconWrapper>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave}>
                    <IconWrapper>
                      <TickCircleIcon width="14" height="14" />
                    </IconWrapper>
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                    <IconWrapper>
                      <EditIcon width="14" height="14" />
                    </IconWrapper>
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm">
                    <IconWrapper>
                      <DeleteIcon width="14" height="14" />
                    </IconWrapper>
                    Delete
                  </Button>
                </>
              )}
            </HStack>
          </Flex>
        </Box>

        {/* Content */}
        <Box px="32px" py="24px">
          <Flex gap="24px">
            {/* Main Content */}
            <Box flex="1">
              <VStack gap="24px" align="stretch">
                {/* Type & Frequency */}
                <Box
                  bg="white"
                  borderRadius="16px"
                  border="1px solid #E2E8F0"
                  overflow="hidden"
                >
                  <Box p="20px" borderBottom="1px solid #F1F5F9">
                    <Typography fontSize="14px" fontWeight="600" color="#1E293B">
                      Configuration
                    </Typography>
                  </Box>
                  <Flex>
                    <Box flex="1" p="20px" borderRight="1px solid #F1F5F9">
                      <Typography fontSize="11px" color="#94A3B8" mb="8px" fontWeight="600" textTransform="uppercase" letterSpacing="0.5px">
                        Type
                      </Typography>
                      <Box 
                        display="inline-block"
                        px="12px" 
                        py="6px" 
                        bg="#DBEAFE" 
                        borderRadius="6px"
                      >
                        <Typography fontSize="13px" fontWeight="600" color="#2563EB">
                          {notification.type}
                        </Typography>
                      </Box>
                    </Box>
                    <Box flex="1" p="20px" borderRight="1px solid #F1F5F9">
                      <Typography fontSize="11px" color="#94A3B8" mb="8px" fontWeight="600" textTransform="uppercase" letterSpacing="0.5px">
                        Frequency
                      </Typography>
                      <Box 
                        display="inline-block"
                        px="12px" 
                        py="6px" 
                        bg={notification.frequency === 'IMMEDIATE' ? '#FEE2E2' : notification.frequency === 'DAILY' ? '#FEF3C7' : '#E0E7FF'}
                        borderRadius="6px"
                      >
                        <Typography 
                          fontSize="13px" 
                          fontWeight="600" 
                          color={notification.frequency === 'IMMEDIATE' ? '#DC2626' : notification.frequency === 'DAILY' ? '#D97706' : '#4F46E5'}
                        >
                          {notification.frequency}
                        </Typography>
                      </Box>
                    </Box>
                    <Box flex="1" p="20px">
                      <Typography fontSize="11px" color="#94A3B8" mb="8px" fontWeight="600" textTransform="uppercase" letterSpacing="0.5px">
                        Last Sent
                      </Typography>
                      <Typography fontSize="14px" color="#1E293B" fontWeight="500">
                        {notification.lastSent 
                          ? new Date(notification.lastSent).toLocaleDateString() 
                          : 'Never'}
                      </Typography>
                    </Box>
                  </Flex>
                </Box>

                {/* Trigger Condition */}
                <Box
                  bg="white"
                  borderRadius="16px"
                  border="1px solid #E2E8F0"
                  overflow="hidden"
                >
                  <Flex p="20px" borderBottom="1px solid #F1F5F9" align="center" gap="12px">
                    <Box p="10px" borderRadius="10px" bg="#FEF3C7">
                      <FiZap size={18} color="#D97706" />
                    </Box>
                    <Typography fontSize="14px" fontWeight="600" color="#1E293B">
                      Trigger Condition
                    </Typography>
                  </Flex>
                  <Box p="20px">
                    <Box p="16px" bg="#F8FAFC" borderRadius="10px" border="1px solid #E2E8F0">
                      <Typography fontSize="14px" color="#1E293B" lineHeight="1.7">
                        {notification.trigger}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Email Template */}
                <Box
                  bg="white"
                  borderRadius="16px"
                  border="1px solid #E2E8F0"
                  overflow="hidden"
                >
                  <Flex p="20px" borderBottom="1px solid #F1F5F9" align="center" gap="12px">
                    <Box p="10px" borderRadius="10px" bg="#DBEAFE">
                      <FiMail size={18} color="#2563EB" />
                    </Box>
                    <Typography fontSize="14px" fontWeight="600" color="#1E293B">
                      Email Template
                    </Typography>
                  </Flex>
                  <Box p="20px">
                    <Box p="16px" bg="#F1F5F9" borderRadius="10px" border="1px solid #E2E8F0">
                      <Typography fontSize="13px" color="#475569" fontFamily="mono" whiteSpace="pre-wrap" lineHeight="1.6">
                        {notification.template}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Recipients */}
                <Box
                  bg="white"
                  borderRadius="16px"
                  border="1px solid #E2E8F0"
                  overflow="hidden"
                >
                  <Flex p="20px" borderBottom="1px solid #F1F5F9" align="center" gap="12px">
                    <Box p="10px" borderRadius="10px" bg="#D1FAE5">
                      <FiUsers size={18} color="#059669" />
                    </Box>
                    <Typography fontSize="14px" fontWeight="600" color="#1E293B">
                      Recipients ({notification.recipients.length})
                    </Typography>
                  </Flex>
                  <Box p="20px">
                    <VStack gap="10px" align="stretch">
                      {notification.recipients.map((recipient, index) => (
                        <Box 
                          key={index} 
                          p="14px" 
                          bg="#F8FAFC" 
                          borderRadius="10px" 
                          border="1px solid #E2E8F0"
                        >
                          <HStack gap="10px">
                            <FiMail size={16} color="#94A3B8" />
                            <Typography fontSize="14px" color="#1E293B" fontWeight="500">
                              {recipient}
                            </Typography>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                </Box>
              </VStack>
            </Box>

            {/* Sidebar */}
            <Box w="320px" flexShrink={0}>
              <VStack gap="20px" align="stretch">
                {/* Status Card */}
                <Box
                  bg="white"
                  borderRadius="16px"
                  border="1px solid #E2E8F0"
                  overflow="hidden"
                >
                  <Box p="16px" borderBottom="1px solid #F1F5F9">
                    <Typography fontSize="13px" fontWeight="600" color="#1E293B">
                      Status
                    </Typography>
                  </Box>
                  <Box p="16px">
                    <Flex justify="space-between" align="center">
                      <VStack align="start" gap="2px">
                        <Typography fontSize="14px" color="#1E293B" fontWeight="600">
                          {notification.isActive ? 'Active' : 'Inactive'}
                        </Typography>
                        <Typography fontSize="11px" color="#94A3B8">
                          Toggle notification status
                        </Typography>
                      </VStack>
                      <Box
                        as="button"
                        w="48px"
                        h="26px"
                        bg={notification.isActive ? '#10B981' : '#CBD5E1'}
                        borderRadius="full"
                        position="relative"
                        transition="all 0.2s"
                        cursor="pointer"
                        onClick={handleToggleActive}
                      >
                        <Box
                          w="22px"
                          h="22px"
                          bg="white"
                          borderRadius="full"
                          position="absolute"
                          top="2px"
                          left={notification.isActive ? '24px' : '2px'}
                          transition="all 0.2s"
                          boxShadow="0 1px 3px rgba(0,0,0,0.15)"
                        />
                      </Box>
                    </Flex>
                  </Box>
                </Box>

                {/* Info Card */}
                <Box
                  bg="white"
                  borderRadius="16px"
                  border="1px solid #E2E8F0"
                  overflow="hidden"
                >
                  <Box p="16px" borderBottom="1px solid #F1F5F9">
                    <Typography fontSize="13px" fontWeight="600" color="#1E293B">
                      Information
                    </Typography>
                  </Box>
                  <Box p="0">
                    <Flex justify="space-between" p="14px 16px" borderBottom="1px solid #F1F5F9">
                      <Typography fontSize="13px" color="#64748B">ID</Typography>
                      <Typography fontSize="12px" color="#1E293B" fontFamily="mono" fontWeight="500">
                        {notification.id}
                      </Typography>
                    </Flex>
                    <Flex justify="space-between" p="14px 16px" borderBottom="1px solid #F1F5F9">
                      <Typography fontSize="13px" color="#64748B">Type</Typography>
                      <Box 
                        px="8px" 
                        py="2px" 
                        bg="#DBEAFE" 
                        borderRadius="4px"
                      >
                        <Typography fontSize="11px" fontWeight="600" color="#2563EB">
                          {notification.type}
                        </Typography>
                      </Box>
                    </Flex>
                    <Flex justify="space-between" p="14px 16px" borderBottom="1px solid #F1F5F9">
                      <Typography fontSize="13px" color="#64748B">Frequency</Typography>
                      <Box 
                        px="8px" 
                        py="2px" 
                        bg={notification.frequency === 'IMMEDIATE' ? '#FEE2E2' : notification.frequency === 'DAILY' ? '#FEF3C7' : '#E0E7FF'}
                        borderRadius="4px"
                      >
                        <Typography 
                          fontSize="11px" 
                          fontWeight="600" 
                          color={notification.frequency === 'IMMEDIATE' ? '#DC2626' : notification.frequency === 'DAILY' ? '#D97706' : '#4F46E5'}
                        >
                          {notification.frequency}
                        </Typography>
                      </Box>
                    </Flex>
                    <Flex justify="space-between" p="14px 16px">
                      <Typography fontSize="13px" color="#64748B">Recipients</Typography>
                      <Typography fontSize="13px" color="#1E293B" fontWeight="600">
                        {notification.recipients.length}
                      </Typography>
                    </Flex>
                  </Box>
                </Box>

                {/* Quick Actions */}
                <Box
                  bg="white"
                  borderRadius="16px"
                  border="1px solid #E2E8F0"
                  overflow="hidden"
                >
                  <Box p="16px" borderBottom="1px solid #F1F5F9">
                    <Typography fontSize="13px" fontWeight="600" color="#1E293B">
                      Quick Actions
                    </Typography>
                  </Box>
                  <Box p="16px">
                    <VStack gap="10px" align="stretch">
                      <Button variant="secondary" size="sm" width="100%">
                        <IconWrapper>
                          <FiMail size={14} />
                        </IconWrapper>
                        Send Test Email
                      </Button>
                      <Button variant="secondary" size="sm" width="100%">
                        <IconWrapper>
                          <FiClock size={14} />
                        </IconWrapper>
                        View History
                      </Button>
                    </VStack>
                  </Box>
                </Box>
              </VStack>
            </Box>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
