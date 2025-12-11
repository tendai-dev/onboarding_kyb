'use client';

import {
  Box,
  VStack,
  HStack,
  SimpleGrid,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import {
  Search,
  Typography,
  Button,
  IconWrapper,
  Tooltip,
  Dropdown,
  // Icons
  AddIcon,
  DeleteIcon,
  EditIcon,
} from '@mukuru/mukuru-react-components';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../../components/AdminSidebar';
import { useSidebar } from '../../../contexts/SidebarContext';
import { FiZap, FiClock, FiAlertCircle, FiArrowLeft, FiShield } from 'react-icons/fi';

interface NotificationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  isActive: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lastTriggered?: string;
}

export default function NotificationRulesPage() {
  const { condensed } = useSidebar();
  const router = useRouter();

  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setRules([
        {
          id: 'RULE-001',
          name: 'Critical Risk Notification',
          condition: "riskLevel == 'CRITICAL'",
          action: 'Send email to senior management',
          isActive: true,
          priority: 'URGENT',
          lastTriggered: '2024-01-14T15:45:00Z',
        },
        {
          id: 'RULE-002',
          name: 'Overdue Application',
          condition: "applicationAge > 30 days AND status == 'PENDING'",
          action: 'Send reminder to assigned admin',
          isActive: true,
          priority: 'HIGH',
          lastTriggered: '2024-01-15T08:00:00Z',
        },
        {
          id: 'RULE-003',
          name: 'Document Missing',
          condition: 'requiredDocuments < totalRequiredDocuments',
          action: 'Send notification to partner',
          isActive: true,
          priority: 'MEDIUM',
          lastTriggered: '2024-01-15T14:20:00Z',
        },
        {
          id: 'RULE-004',
          name: 'Low Risk Auto-Approve',
          condition: "riskLevel == 'LOW' AND allDocumentsComplete == true",
          action: 'Auto-approve application',
          isActive: false,
          priority: 'LOW',
        },
        {
          id: 'RULE-005',
          name: 'Partner Refresh Due',
          condition: 'daysUntilRefresh <= 30',
          action: 'Send reminder to partner and admin',
          isActive: true,
          priority: 'MEDIUM',
          lastTriggered: '2024-01-10T09:00:00Z',
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || rule.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const activeCount = rules.filter((r) => r.isActive).length;
  const urgentCount = rules.filter((r) => r.priority === 'URGENT').length;
  const highCount = rules.filter((r) => r.priority === 'HIGH').length;

  return (
    <Box minH="100vh" bg="#F8FAFC">
      <AdminSidebar />

      {/* Main Content */}
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
                bg="linear-gradient(135deg, #D97706 0%, #F59E0B 100%)"
                borderRadius="12px"
                boxShadow="0 4px 12px rgba(217, 119, 6, 0.25)"
              >
                <FiAlertCircle size={24} color="white" />
              </Box>
              <VStack align="start" gap="2px">
                <Typography fontSize="24px" fontWeight="700" color="#1E293B" lineHeight="1.2">
                  Notification Rules
                </Typography>
                <Typography fontSize="14px" color="#64748B" fontWeight="400">
                  Automated triggers and conditions for notifications
                </Typography>
              </VStack>
            </HStack>

            <HStack gap="12px">
              {/* Stats Pills */}
              <HStack gap="8px">
                <Box 
                  px="16px" 
                  py="8px" 
                  bg="#F1F5F9" 
                  borderRadius="20px"
                  border="1px solid #E2E8F0"
                >
                  <HStack gap="6px">
                    <Box w="8px" h="8px" borderRadius="full" bg="#10B981" />
                    <Typography fontSize="13px" fontWeight="600" color="#1E293B">
                      {activeCount}
                    </Typography>
                    <Typography fontSize="13px" color="#64748B">Active</Typography>
                  </HStack>
                </Box>
                <Box 
                  px="16px" 
                  py="8px" 
                  bg="#F1F5F9" 
                  borderRadius="20px"
                  border="1px solid #E2E8F0"
                >
                  <HStack gap="6px">
                    <Box w="8px" h="8px" borderRadius="full" bg="#DC2626" />
                    <Typography fontSize="13px" fontWeight="600" color="#1E293B">
                      {urgentCount}
                    </Typography>
                    <Typography fontSize="13px" color="#64748B">Urgent</Typography>
                  </HStack>
                </Box>
                <Box 
                  px="16px" 
                  py="8px" 
                  bg="#F1F5F9" 
                  borderRadius="20px"
                  border="1px solid #E2E8F0"
                >
                  <HStack gap="6px">
                    <Box w="8px" h="8px" borderRadius="full" bg="#F59E0B" />
                    <Typography fontSize="13px" fontWeight="600" color="#1E293B">
                      {highCount}
                    </Typography>
                    <Typography fontSize="13px" color="#64748B">High</Typography>
                  </HStack>
                </Box>
              </HStack>

              <Box w="1px" h="32px" bg="#E2E8F0" />

              <Tooltip content="Add new rule">
                <Button variant="primary" size="sm">
                  <IconWrapper>
                    <AddIcon width="16" height="16" />
                  </IconWrapper>
                  New Rule
                </Button>
              </Tooltip>
            </HStack>
          </Flex>
        </Box>

        {/* Content Area */}
        <Box px="32px" py="24px">
          {loading ? (
            <Flex justify="center" align="center" h="400px">
              <VStack gap="16px">
                <Spinner size="lg" color="orange.500" />
                <Typography color="#64748B" fontSize="14px">Loading rules...</Typography>
              </VStack>
            </Flex>
          ) : (
            <VStack gap="24px" align="stretch">
              {/* Search & Filters */}
              <Box
                bg="white"
                borderRadius="16px"
                border="1px solid #E2E8F0"
                boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
                p="20px"
              >
                <Flex gap="16px" align="center">
                  <Box flex="1" maxW="400px">
                    <Search
                      placeholder="Search rules..."
                      onSearchChange={(query) => setSearchTerm(query)}
                    />
                  </Box>
                  <Box w="200px">
                    <Dropdown
                      items={[
                        { label: 'All Priorities', value: 'ALL' },
                        { label: 'Urgent', value: 'URGENT' },
                        { label: 'High', value: 'HIGH' },
                        { label: 'Medium', value: 'MEDIUM' },
                        { label: 'Low', value: 'LOW' },
                      ]}
                      placeholder="Filter by priority"
                      defaultValue={priorityFilter}
                      onSelectionChange={(val) => setPriorityFilter(val as string)}
                    />
                  </Box>
                  <Typography fontSize="13px" color="#64748B">
                    {filteredRules.length} rule{filteredRules.length !== 1 ? 's' : ''} found
                  </Typography>
                </Flex>
              </Box>

              {/* Rules Grid */}
              {filteredRules.length === 0 ? (
                <Flex justify="center" align="center" h="300px">
                  <VStack gap="16px" textAlign="center">
                    <Box p="20px" borderRadius="full" bg="#F1F5F9">
                      <FiAlertCircle size={40} color="#94A3B8" />
                    </Box>
                    <Typography color="#1E293B" fontSize="16px" fontWeight="600">
                      No rules found
                    </Typography>
                    <Typography color="#64748B" fontSize="14px">
                      Try adjusting your search or filters
                    </Typography>
                  </VStack>
                </Flex>
              ) : (
                <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} gap="20px">
                  {filteredRules.map((rule) => {
                    const isSelected = rule.id === selectedRule?.id;
                    
                    return (
                      <Box
                        key={rule.id}
                        border="1px solid"
                        borderColor={isSelected ? '#F59E0B' : '#E2E8F0'}
                        borderRadius="16px"
                        bg="white"
                        transition="all 0.15s ease"
                        cursor="pointer"
                        boxShadow={isSelected ? '0 0 0 3px rgba(245, 158, 11, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)'}
                        _hover={{ borderColor: isSelected ? '#F59E0B' : '#CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                        onClick={() => setSelectedRule(rule)}
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
                          <Box flex="1" minW="0">
                            <Typography fontSize="15px" fontWeight="600" color="#1E293B" mb="4px">
                              {rule.name}
                            </Typography>
                            <Typography 
                              fontSize="13px" 
                              color="#64748B" 
                              lineHeight="1.4"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {rule.action}
                            </Typography>
                          </Box>
                          <Box 
                            px="10px" 
                            py="4px" 
                            bg={rule.priority === 'URGENT' ? '#FEE2E2' : rule.priority === 'HIGH' ? '#FEF3C7' : rule.priority === 'MEDIUM' ? '#E0E7FF' : '#F1F5F9'}
                            borderRadius="6px"
                            flexShrink={0}
                            ml="12px"
                          >
                            <Typography 
                              fontSize="11px" 
                              fontWeight="600" 
                              color={rule.priority === 'URGENT' ? '#DC2626' : rule.priority === 'HIGH' ? '#D97706' : rule.priority === 'MEDIUM' ? '#4F46E5' : '#64748B'}
                            >
                              {rule.priority}
                            </Typography>
                          </Box>
                        </Flex>

                        {/* Card Body - Condition */}
                        <Box p="20px" pt="16px" flex="1">
                          <Box p="14px" bg="#F8FAFC" borderRadius="10px" border="1px solid #E2E8F0">
                            <HStack gap="6px" mb="8px">
                              <FiZap size={14} color="#D97706" />
                              <Typography fontSize="10px" color="#64748B" fontWeight="600" textTransform="uppercase" letterSpacing="0.5px">
                                Condition
                              </Typography>
                            </HStack>
                            <Typography 
                              fontSize="12px" 
                              color="#475569" 
                              fontFamily="mono" 
                              lineHeight="1.5"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {rule.condition}
                            </Typography>
                          </Box>
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
                          <HStack gap="10px">
                            <Box
                              as="button"
                              w="40px"
                              h="22px"
                              bg={rule.isActive ? '#10B981' : '#CBD5E1'}
                              borderRadius="full"
                              position="relative"
                              transition="all 0.2s"
                              cursor="pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRules((prev) =>
                                  prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r))
                                );
                              }}
                            >
                              <Box
                                w="18px"
                                h="18px"
                                bg="white"
                                borderRadius="full"
                                position="absolute"
                                top="2px"
                                left={rule.isActive ? '20px' : '2px'}
                                transition="all 0.2s"
                                boxShadow="0 1px 3px rgba(0,0,0,0.15)"
                              />
                            </Box>
                            <Typography fontSize="12px" color={rule.isActive ? '#059669' : '#94A3B8'} fontWeight="500">
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </Typography>
                          </HStack>

                          <HStack gap="2px">
                            <Box
                              as="button"
                              p="8px"
                              borderRadius="6px"
                              cursor="pointer"
                              transition="all 0.15s"
                              _hover={{ bg: '#F1F5F9' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <EditIcon width="14" height="14" color="#64748B" />
                            </Box>
                            <Box
                              as="button"
                              p="8px"
                              borderRadius="6px"
                              cursor="pointer"
                              transition="all 0.15s"
                              _hover={{ bg: '#FEE2E2' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DeleteIcon width="14" height="14" color="#EF4444" />
                            </Box>
                          </HStack>
                        </Flex>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              )}
            </VStack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
