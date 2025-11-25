"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  SimpleGrid,
  Flex,
  Spinner,
  Textarea
} from "@chakra-ui/react";
import { Search, Typography, Button, Tag, IconWrapper } from "@/lib/mukuruImports";
import { 
  FiSearch, 
  FiFilter, 
  FiBell, 
  FiMail,
  FiSettings,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCheckCircle,
  FiXCircle,
  FiClock
} from "react-icons/fi";
import { useState, useEffect } from "react";
import AdminSidebar from "../../components/AdminSidebar";

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setNotifications([
        {
          id: "NOTIF-001",
          name: "Application Submitted",
          type: "EMAIL",
          trigger: "Application submitted by partner/customer",
          description: "Notify admin team when new application is submitted",
          isActive: true,
          recipients: ["admin@mukuru.com", "onboarding@mukuru.com"],
          template: "New application submitted by {{companyName}} for {{entityType}}",
          lastSent: "2024-01-15T10:30:00Z",
          frequency: "IMMEDIATE"
        },
        {
          id: "NOTIF-002",
          name: "High Risk Alert",
          type: "EMAIL",
          trigger: "High risk application detected",
          description: "Alert senior management for high-risk applications",
          isActive: true,
          recipients: ["senior@mukuru.com", "risk@mukuru.com"],
          template: "URGENT: High risk application {{applicationId}} requires immediate review",
          lastSent: "2024-01-14T15:45:00Z",
          frequency: "IMMEDIATE"
        },
        {
          id: "NOTIF-003",
          name: "Overdue Refresh",
          type: "EMAIL",
          trigger: "Partner refresh is overdue",
          description: "Notify assigned admin when partner refresh is overdue",
          isActive: true,
          recipients: ["admin@mukuru.com"],
          template: "Partner {{companyName}} refresh is overdue by {{daysOverdue}} days",
          frequency: "DAILY"
        },
        {
          id: "NOTIF-004",
          name: "Data Protection Alert",
          type: "EMAIL",
          trigger: "High risk partner requires DP review",
          description: "Notify Data Protection team for high-risk partners",
          isActive: true,
          recipients: ["ddhrp@mukuru.com"],
          template: "High risk partner {{companyName}} requires Data Protection review",
          lastSent: "2024-01-13T09:15:00Z",
          frequency: "IMMEDIATE"
        },
        {
          id: "NOTIF-005",
          name: "Commercial Manager Update",
          type: "EMAIL",
          trigger: "Partner progress update",
          description: "Weekly update to commercial managers on their partners",
          isActive: true,
          recipients: ["commercial@mukuru.com"],
          template: "Weekly partner progress report for {{managerName}}",
          frequency: "WEEKLY"
        }
      ]);

      setRules([
        {
          id: "RULE-001",
          name: "Critical Risk Notification",
          condition: "riskLevel == 'CRITICAL'",
          action: "Send email to senior management",
          isActive: true,
          priority: "URGENT",
          lastTriggered: "2024-01-14T15:45:00Z"
        },
        {
          id: "RULE-002",
          name: "Overdue Application",
          condition: "applicationAge > 30 days AND status == 'PENDING'",
          action: "Send reminder to assigned admin",
          isActive: true,
          priority: "HIGH",
          lastTriggered: "2024-01-15T08:00:00Z"
        },
        {
          id: "RULE-003",
          name: "Document Missing",
          condition: "requiredDocuments < totalRequiredDocuments",
          action: "Send notification to partner",
          isActive: true,
          priority: "MEDIUM",
          lastTriggered: "2024-01-15T14:20:00Z"
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EMAIL': return 'blue';
      case 'SYSTEM': return 'green';
      case 'SMS': return 'purple';
      default: return 'gray';
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'IMMEDIATE': return 'red';
      case 'DAILY': return 'orange';
      case 'WEEKLY': return 'blue';
      case 'MONTHLY': return 'green';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'blue';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || notification.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const activeCount = notifications.filter(n => n.isActive).length;
  const emailCount = notifications.filter(n => n.type === 'EMAIL').length;
  const systemCount = notifications.filter(n => n.type === 'SYSTEM').length;
  const immediateCount = notifications.filter(n => n.frequency === 'IMMEDIATE').length;

  if (loading) {
    return (
      <Box>
        <AdminSidebar />
        <Box ml="240px" p="8" bg="gray.50" minH="100vh">
          <Flex justify="center" align="center" h="400px">
            <Spinner size="xl" color="orange.500" />
          </Flex>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <AdminSidebar />
      <Box ml="240px" p="8" bg="gray.50" minH="100vh">
      <Container maxW="7xl">
        <VStack gap="6" align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <VStack align="start" gap="1">
              <Typography fontSize="3xl" fontWeight="bold" color="gray.800">
                Notifications
              </Typography>
              <Typography color="gray.600">
                Manage system notifications and alerts
              </Typography>
            </VStack>
            
            <HStack gap="3">
              <Button
                variant="primary"
                size="sm"
              >
                <IconWrapper><FiPlus size={16} /></IconWrapper>
                New Notification
              </Button>
              <Button
                variant="secondary"
                size="sm"
              >
                <IconWrapper><FiSettings size={16} /></IconWrapper>
                Settings
              </Button>
            </HStack>
          </Flex>

          {/* Summary Cards */}
          <SimpleGrid columns={{ base: 1, md: 4 }} gap="4">
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <IconWrapper><FiBell size={24} color="#38A169" /></IconWrapper>
                <Typography fontSize="2xl" fontWeight="bold" color="green.600">
                  {activeCount}
                </Typography>
                <Typography fontSize="sm" color="gray.600" textAlign="center">
                  Active Notifications
                </Typography>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <IconWrapper><FiMail size={24} color="#3182CE" /></IconWrapper>
                <Typography fontSize="2xl" fontWeight="bold" color="blue.600">
                  {emailCount}
                </Typography>
                <Typography fontSize="sm" color="gray.600" textAlign="center">
                  Email Notifications
                </Typography>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <IconWrapper><FiBell size={24} color="#805AD5" /></IconWrapper>
                <Typography fontSize="2xl" fontWeight="bold" color="purple.600">
                  {systemCount}
                </Typography>
                <Typography fontSize="sm" color="gray.600" textAlign="center">
                  System Notifications
                </Typography>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <IconWrapper><FiClock size={24} color="#E53E3E" /></IconWrapper>
                <Typography fontSize="2xl" fontWeight="bold" color="red.600">
                  {immediateCount}
                </Typography>
                <Typography fontSize="sm" color="gray.600" textAlign="center">
                  Immediate Alerts
                </Typography>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Search and Filters */}
          <Box bg="white" p="6" borderRadius="lg" boxShadow="sm">
            <HStack gap="4">
              <Box flex="1">
                <Box flex="1" maxW="400px">
                  <Search
                    placeholder="Search notifications..."
                    onSearchChange={(query) => setSearchTerm(query)}
                  />
                </Box>
              </Box>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "white"
                }}
              >
                <option value="ALL">All Types</option>
                <option value="EMAIL">Email</option>
                <option value="SYSTEM">System</option>
                <option value="SMS">SMS</option>
              </select>
            </HStack>
          </Box>

          <Flex gap="6" height="600px">
            {/* Notifications List */}
            <Box flex="1" bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
              <Box p="4" borderBottom="1px" borderColor="gray.200">
                <Typography fontSize="lg" fontWeight="semibold" color="gray.800">
                  Notification Templates
                </Typography>
              </Box>
              
              <Box overflowY="auto" height="calc(100% - 60px)">
                {filteredNotifications.map((notification) => (
                  <Box
                    key={notification.id}
                    p="4"
                    borderBottom="1px"
                    borderColor="gray.100"
                    cursor="pointer"
                    bg={notification.id === selectedNotification?.id ? "orange.50" : "white"}
                    _hover={{ bg: notification.id === selectedNotification?.id ? "orange.50" : "gray.50" }}
                    onClick={() => setSelectedNotification(notification)}
                  >
                    <VStack gap="2" align="stretch">
                      <Flex justify="space-between" align="start">
                        <VStack align="start" gap="1">
                          <Typography fontSize="md" fontWeight="semibold" color="gray.800">
                            {notification.name}
                          </Typography>
                          <Typography fontSize="sm" color="gray.600">
                            {notification.description}
                          </Typography>
                        </VStack>
                        
                        <VStack gap="1" align="end">
                        <Tag variant={getTypeColor(notification.type) === 'blue' ? 'info' : getTypeColor(notification.type) === 'green' ? 'success' : 'info'}>
                          {notification.type}
                        </Tag>
                          <Tag variant={getFrequencyColor(notification.frequency) === 'red' ? 'danger' : getFrequencyColor(notification.frequency) === 'orange' ? 'warning' : 'info'}>
                            {notification.frequency}
                          </Tag>
                          <Tag variant={notification.isActive ? 'success' : 'inactive'}>
                            {notification.isActive ? "Active" : "Inactive"}
                          </Tag>
                        </VStack>
                      </Flex>
                      
                      <Typography fontSize="sm" color="gray.600">
                        Trigger: {notification.trigger}
                      </Typography>
                      
                      <HStack justify="space-between" fontSize="sm" color="gray.600">
                        <Typography>Recipients: {notification.recipients.length}</Typography>
                        {notification.lastSent && (
                          <Typography>Last sent: {new Date(notification.lastSent).toLocaleDateString()}</Typography>
                        )}
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Notification Details */}
            <Box flex="1" bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
              {selectedNotification ? (
                <VStack gap="0" align="stretch" height="100%">
                  {/* Header */}
                  <Box p="4" borderBottom="1px" borderColor="gray.200" bg="gray.50">
                    <VStack gap="2" align="stretch">
                      <Flex justify="space-between" align="start">
                        <VStack align="start" gap="1">
                          <Typography fontSize="lg" fontWeight="semibold" color="gray.800">
                            {selectedNotification.name}
                          </Typography>
                          <Typography fontSize="sm" color="gray.600">
                            {selectedNotification.description}
                          </Typography>
                        </VStack>
                        
                        <HStack gap="2">
                          <Tag variant={getTypeColor(selectedNotification.type) === 'blue' ? 'info' : getTypeColor(selectedNotification.type) === 'green' ? 'success' : 'info'}>
                            {selectedNotification.type}
                          </Tag>
                          <Tag variant={getFrequencyColor(selectedNotification.frequency) === 'red' ? 'danger' : getFrequencyColor(selectedNotification.frequency) === 'orange' ? 'warning' : 'info'}>
                            {selectedNotification.frequency}
                          </Tag>
                        </HStack>
                      </Flex>
                      
                      <HStack gap="4" fontSize="sm" color="gray.600">
                        <Typography>Recipients: {selectedNotification.recipients.length}</Typography>
                        <Typography>Status: {selectedNotification.isActive ? "Active" : "Inactive"}</Typography>
                        {selectedNotification.lastSent && (
                          <Typography>Last sent: {new Date(selectedNotification.lastSent).toLocaleDateString()}</Typography>
                        )}
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Details */}
                  <Box p="4" flex="1" overflowY="auto">
                    <VStack gap="4" align="stretch">
                      <Box>
                        <Typography fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                          Trigger Condition:
                        </Typography>
                        <Typography fontSize="sm" color="gray.600" p="3" bg="gray.50" borderRadius="md">
                          {selectedNotification.trigger}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                          Email Template:
                        </Typography>
                        <Textarea
                          value={selectedNotification.template}
                          readOnly
                          rows={4}
                          fontSize="sm"
                          bg="gray.50"
                        />
                      </Box>
                      
                      <Box>
                        <Typography fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                          Recipients:
                        </Typography>
                        <VStack gap="1" align="stretch">
                          {selectedNotification.recipients.map((recipient, index) => (
                            <Typography key={index} fontSize="sm" color="gray.600" p="2" bg="gray.50" borderRadius="md">
                              {recipient}
                            </Typography>
                          ))}
                        </VStack>
                      </Box>
                    </VStack>
                  </Box>

                  {/* Actions */}
                  <Box p="4" borderTop="1px" borderColor="gray.200" bg="gray.50">
                    <HStack justify="space-between">
                      <HStack gap="2">
                        <Box
                          as="button"
                          w="12"
                          h="6"
                          bg={selectedNotification.isActive ? "#FF6B35" : "gray.300"}
                          borderRadius="full"
                          position="relative"
                          transition="all 0.2s"
                          onClick={() => {
                            setNotifications(prev => prev.map(n => 
                              n.id === selectedNotification.id 
                                ? { ...n, isActive: !n.isActive }
                                : n
                            ));
                            setSelectedNotification(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
                          }}
                        >
                          <Box
                            w="5"
                            h="5"
                            bg="white"
                            borderRadius="full"
                            position="absolute"
                            top="0.5"
                            left={selectedNotification.isActive ? "6.5" : "0.5"}
                            transition="all 0.2s"
                            boxShadow="sm"
                          />
                        </Box>
                        <Typography fontSize="sm" color="gray.700">
                          {selectedNotification.isActive ? "Active" : "Inactive"}
                        </Typography>
                      </HStack>
                      
                      <HStack gap="2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setIsEditing(true)}
                        >
                          <IconWrapper><FiEdit size={16} /></IconWrapper>
                          Edit
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="secondary"
                        >
                          <IconWrapper><FiTrash2 size={16} /></IconWrapper>
                          Delete
                        </Button>
                      </HStack>
                    </HStack>
                  </Box>
                </VStack>
              ) : (
                <Flex justify="center" align="center" height="100%">
                  <VStack gap="4">
                    <IconWrapper><FiBell size={48} color="#9CA3AF" /></IconWrapper>
                    <Typography fontSize="lg" color="gray.600">
                      Select a notification to view details
                    </Typography>
                  </VStack>
                </Flex>
              )}
            </Box>
          </Flex>

          {/* Notification Rules */}
          <Box bg="white" p="6" borderRadius="lg" boxShadow="sm">
            <VStack gap="4" align="stretch">
              <Flex justify="space-between" align="center">
                <Typography fontSize="lg" fontWeight="semibold" color="gray.800">
                  Notification Rules
                </Typography>
                <Button
                  variant="secondary"
                  size="sm"
                >
                  <IconWrapper><FiPlus size={16} /></IconWrapper>
                  New Rule
                </Button>
              </Flex>

              <SimpleGrid columns={{ base: 1, lg: 2 }} gap="4">
                {rules.map((rule) => (
                  <Box
                    key={rule.id}
                    p="4"
                    border="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    bg="gray.50"
                  >
                    <VStack gap="3" align="stretch">
                      <Flex justify="space-between" align="start">
                        <VStack align="start" gap="1">
                          <Typography fontSize="md" fontWeight="semibold" color="gray.800">
                            {rule.name}
                          </Typography>
                          <Typography fontSize="sm" color="gray.600">
                            {rule.action}
                          </Typography>
                        </VStack>
                        
                        <VStack gap="1" align="end">
                          <Tag variant={getPriorityColor(rule.priority) === 'red' ? 'danger' : getPriorityColor(rule.priority) === 'orange' ? 'warning' : 'info'}>
                            {rule.priority}
                          </Tag>
                          <Tag variant={rule.isActive ? 'success' : 'inactive'}>
                            {rule.isActive ? "Active" : "Inactive"}
                          </Tag>
                        </VStack>
                      </Flex>

                      <Box>
                        <Typography fontSize="sm" fontWeight="medium" color="gray.700" mb="1">
                          Condition:
                        </Typography>
                        <Typography fontSize="sm" color="gray.600" p="2" bg="white" borderRadius="md">
                          {rule.condition}
                        </Typography>
                      </Box>

                      <HStack justify="space-between" fontSize="sm" color="gray.600">
                        <Typography>Rule ID: {rule.id}</Typography>
                        {rule.lastTriggered && (
                          <Typography>Last triggered: {new Date(rule.lastTriggered).toLocaleDateString()}</Typography>
                        )}
                      </HStack>

                      <HStack justify="space-between">
                        <Box
                          as="button"
                          w="10"
                          h="5"
                          bg={rule.isActive ? "#FF6B35" : "gray.300"}
                          borderRadius="full"
                          position="relative"
                          transition="all 0.2s"
                          onClick={() => {
                            setRules(prev => prev.map(r => 
                              r.id === rule.id 
                                ? { ...r, isActive: !r.isActive }
                                : r
                            ));
                          }}
                        >
                          <Box
                            w="4"
                            h="4"
                            bg="white"
                            borderRadius="full"
                            position="absolute"
                            top="0.5"
                            left={rule.isActive ? "5.5" : "0.5"}
                            transition="all 0.2s"
                            boxShadow="sm"
                          />
                        </Box>
                        
                        <HStack gap="1">
                          <Button
                            size="sm"
                            variant="ghost"
                          >
                            <IconWrapper><FiEdit size={14} /></IconWrapper>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                          >
                            <IconWrapper><FiTrash2 size={14} /></IconWrapper>
                            Delete
                          </Button>
                        </HStack>
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>
        </VStack>
      </Container>
      </Box>
    </Box>
  );
}
