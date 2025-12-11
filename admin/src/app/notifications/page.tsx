'use client';

import {
  Box,
  VStack,
  HStack,
  Flex,
  Spinner,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  Search,
  Typography,
  Button,
  Tag,
  IconWrapper,
  Tooltip,
  Dropdown,
  // Icons
  AddIcon,
  SettingsIcon,
} from '@mukuru/mukuru-react-components';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar';
import { useSidebar } from '../../contexts/SidebarContext';
import { FiBell, FiMail, FiAlertCircle, FiMessageSquare, FiArrowRight } from 'react-icons/fi';

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

interface NotificationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  isActive: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lastTriggered?: string;
}

export default function NotificationsPage() {
  const { condensed } = useSidebar();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    setTimeout(() => {
      setNotifications([
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
      ]);

      setRules([
        { id: 'RULE-001', name: 'Critical Risk', condition: '', action: '', isActive: true, priority: 'URGENT' },
        { id: 'RULE-002', name: 'Overdue', condition: '', action: '', isActive: true, priority: 'HIGH' },
        { id: 'RULE-003', name: 'Missing Docs', condition: '', action: '', isActive: true, priority: 'MEDIUM' },
      ]);

      setLoading(false);
    }, 800);
  }, []);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || notification.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const activeCount = notifications.filter((n) => n.isActive).length;
  const emailCount = notifications.filter((n) => n.type === 'EMAIL').length;
  const immediateCount = notifications.filter((n) => n.frequency === 'IMMEDIATE').length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <FiMail size={18} />;
      case 'SYSTEM': return <FiBell size={18} />;
      case 'SMS': return <FiMessageSquare size={18} />;
      default: return <FiBell size={18} />;
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
                p="12px" 
                bg="linear-gradient(135deg, #F05423 0%, #FF7A50 100%)"
                borderRadius="12px"
                boxShadow="0 4px 12px rgba(240, 84, 35, 0.25)"
              >
                <FiBell size={24} color="white" />
              </Box>
              <VStack align="start" gap="2px">
                <Typography fontSize="24px" fontWeight="700" color="#1E293B" lineHeight="1.2">
                  Notifications
                </Typography>
                <Typography fontSize="14px" color="#64748B" fontWeight="400">
                  Manage system notifications and alert templates
                </Typography>
              </VStack>
            </HStack>

            <HStack gap="12px">
              <HStack gap="8px">
                <Box px="16px" py="8px" bg="#F1F5F9" borderRadius="20px" border="1px solid #E2E8F0">
                  <HStack gap="6px">
                    <Box w="8px" h="8px" borderRadius="full" bg="#10B981" />
                    <Typography fontSize="13px" fontWeight="600" color="#1E293B">{activeCount}</Typography>
                    <Typography fontSize="13px" color="#64748B">Active</Typography>
                  </HStack>
                </Box>
                <Box px="16px" py="8px" bg="#F1F5F9" borderRadius="20px" border="1px solid #E2E8F0">
                  <HStack gap="6px">
                    <Box w="8px" h="8px" borderRadius="full" bg="#2563EB" />
                    <Typography fontSize="13px" fontWeight="600" color="#1E293B">{emailCount}</Typography>
                    <Typography fontSize="13px" color="#64748B">Email</Typography>
                  </HStack>
                </Box>
                <Box px="16px" py="8px" bg="#F1F5F9" borderRadius="20px" border="1px solid #E2E8F0">
                  <HStack gap="6px">
                    <Box w="8px" h="8px" borderRadius="full" bg="#EF4444" />
                    <Typography fontSize="13px" fontWeight="600" color="#1E293B">{immediateCount}</Typography>
                    <Typography fontSize="13px" color="#64748B">Immediate</Typography>
                  </HStack>
                </Box>
              </HStack>

              <Box w="1px" h="32px" bg="#E2E8F0" />

              <Tooltip content="Add new notification">
                <Button variant="primary" size="sm">
                  <IconWrapper><AddIcon width="16" height="16" /></IconWrapper>
                  New Notification
                </Button>
              </Tooltip>

              <Button variant="secondary" size="sm">
                <IconWrapper><SettingsIcon width="16" height="16" /></IconWrapper>
                Settings
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* Content */}
        <Box px="32px" py="24px">
          {loading ? (
            <Flex justify="center" align="center" h="400px">
              <VStack gap="16px">
                <Spinner size="lg" color="orange.500" />
                <Typography color="#64748B" fontSize="14px">Loading notifications...</Typography>
              </VStack>
            </Flex>
          ) : (
            <VStack gap="24px" align="stretch">
              {/* Search & Filter */}
              <Box bg="white" borderRadius="16px" border="1px solid #E2E8F0" p="20px">
                <Flex gap="16px" align="center">
                  <Box flex="1" maxW="400px">
                    <Search
                      placeholder="Search notifications..."
                      onSearchChange={(query) => setSearchTerm(query)}
                    />
                  </Box>
                  <Box w="200px">
                    <Dropdown
                      items={[
                        { label: 'All Types', value: 'ALL' },
                        { label: 'Email', value: 'EMAIL' },
                        { label: 'System', value: 'SYSTEM' },
                        { label: 'SMS', value: 'SMS' },
                      ]}
                      placeholder="Filter by type"
                      defaultValue={typeFilter}
                      onSelectionChange={(val) => setTypeFilter(val as string)}
                    />
                  </Box>
                  <Typography fontSize="13px" color="#64748B">
                    {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''} found
                  </Typography>
                </Flex>
              </Box>

              {/* Notifications Grid */}
              {filteredNotifications.length === 0 ? (
                <Flex justify="center" align="center" h="300px">
                  <VStack gap="16px" textAlign="center">
                    <Box p="20px" borderRadius="full" bg="#F1F5F9">
                      <FiBell size={40} color="#94A3B8" />
                    </Box>
                    <Typography color="#1E293B" fontSize="16px" fontWeight="600">
                      No notifications found
                    </Typography>
                    <Typography color="#64748B" fontSize="14px">
                      Try adjusting your search or filters
                    </Typography>
                  </VStack>
                </Flex>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="20px">
                  {filteredNotifications.map((notification) => {
                    const typeColors = getTypeColor(notification.type);
                    
                    return (
                      <Box
                        key={notification.id}
                        bg="white"
                        borderRadius="16px"
                        border="1px solid #E2E8F0"
                        cursor="pointer"
                        transition="all 0.15s ease"
                        _hover={{ borderColor: '#F05423', boxShadow: '0 4px 12px rgba(240, 84, 35, 0.1)' }}
                        onClick={() => router.push(`/notifications/${notification.id}`)}
                        display="flex"
                        flexDirection="column"
                        h="100%"
                      >
                        {/* Card Header */}
                        <Flex 
                          justify="space-between" 
                          align="center" 
                          p="20px" 
                          pb="16px"
                          borderBottom="1px solid #F1F5F9"
                        >
                          <HStack gap="12px" flex="1">
                            <Box 
                              p="10px" 
                              borderRadius="10px" 
                              bg={typeColors.bg}
                              flexShrink={0}
                            >
                              <Box color={typeColors.color}>{getTypeIcon(notification.type)}</Box>
                            </Box>
                            <Box flex="1" minW="0">
                              <Typography 
                                fontSize="15px" 
                                fontWeight="600" 
                                color="#1E293B"
                                mb="2px"
                              >
                                {notification.name}
                              </Typography>
                              <HStack gap="6px">
                                <Box 
                                  px="6px" 
                                  py="2px" 
                                  bg="#F1F5F9" 
                                  borderRadius="4px"
                                >
                                  <Typography fontSize="10px" fontWeight="600" color="#64748B">
                                    {notification.type}
                                  </Typography>
                                </Box>
                                <Box 
                                  px="6px" 
                                  py="2px" 
                                  bg={notification.frequency === 'IMMEDIATE' ? '#FEE2E2' : notification.frequency === 'DAILY' ? '#FEF3C7' : '#E0E7FF'}
                                  borderRadius="4px"
                                >
                                  <Typography 
                                    fontSize="10px" 
                                    fontWeight="600" 
                                    color={notification.frequency === 'IMMEDIATE' ? '#DC2626' : notification.frequency === 'DAILY' ? '#D97706' : '#4F46E5'}
                                  >
                                    {notification.frequency}
                                  </Typography>
                                </Box>
                              </HStack>
                            </Box>
                          </HStack>
                          <Box 
                            px="10px" 
                            py="4px" 
                            bg={notification.isActive ? '#D1FAE5' : '#F1F5F9'}
                            borderRadius="6px"
                            flexShrink={0}
                            ml="12px"
                          >
                            <Typography 
                              fontSize="11px" 
                              fontWeight="600" 
                              color={notification.isActive ? '#059669' : '#64748B'}
                            >
                              {notification.isActive ? 'Active' : 'Inactive'}
                            </Typography>
                          </Box>
                        </Flex>

                        {/* Card Body */}
                        <Box p="20px" pt="16px" flex="1">
                          <Typography 
                            fontSize="13px" 
                            color="#64748B" 
                            lineHeight="1.6"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {notification.description}
                          </Typography>
                        </Box>

                        {/* Card Footer */}
                        <Flex 
                          justify="space-between" 
                          align="center" 
                          px="20px" 
                          py="14px"
                          borderTop="1px solid #F1F5F9"
                          bg="#FAFBFC"
                          borderBottomRadius="16px"
                        >
                          <Typography fontSize="12px" color="#94A3B8">
                            {notification.recipients.length} recipient{notification.recipients.length !== 1 ? 's' : ''}
                          </Typography>
                          <HStack gap="6px" color="#F05423">
                            <Typography fontSize="12px" fontWeight="600">View Details</Typography>
                            <FiArrowRight size={14} />
                          </HStack>
                        </Flex>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              )}

              {/* Link to Rules Page */}
              <Box
                as="button"
                bg="white"
                borderRadius="16px"
                border="1px solid #E2E8F0"
                p="24px"
                cursor="pointer"
                transition="all 0.15s ease"
                _hover={{ borderColor: '#F59E0B', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)' }}
                onClick={() => router.push('/notifications/rules')}
                width="100%"
                textAlign="left"
              >
                <Flex justify="space-between" align="center">
                  <HStack gap="16px">
                    <Box 
                      p="14px" 
                      borderRadius="12px" 
                      bg="linear-gradient(135deg, #D97706 0%, #F59E0B 100%)"
                      boxShadow="0 4px 12px rgba(217, 119, 6, 0.25)"
                    >
                      <FiAlertCircle size={24} color="white" />
                    </Box>
                    <VStack align="start" gap="4px">
                      <Typography fontSize="18px" fontWeight="600" color="#1E293B">
                        Notification Rules
                      </Typography>
                      <Typography fontSize="14px" color="#64748B">
                        Manage automated triggers and conditions for notifications
                      </Typography>
                    </VStack>
                  </HStack>
                  <HStack gap="16px">
                    <HStack gap="8px">
                      <Box px="12px" py="6px" bg="#D1FAE5" borderRadius="8px">
                        <Typography fontSize="13px" fontWeight="600" color="#059669">
                          {rules.filter(r => r.isActive).length} Active
                        </Typography>
                      </Box>
                      <Box px="12px" py="6px" bg="#F1F5F9" borderRadius="8px">
                        <Typography fontSize="13px" fontWeight="600" color="#64748B">
                          {rules.length} Total
                        </Typography>
                      </Box>
                    </HStack>
                    <Box p="10px" borderRadius="10px" bg="#F8FAFC" border="1px solid #E2E8F0">
                      <FiArrowRight size={18} color="#64748B" />
                    </Box>
                  </HStack>
                </Flex>
              </Box>
            </VStack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
