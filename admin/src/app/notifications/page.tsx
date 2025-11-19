"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  Button,
  Input,
  SimpleGrid,
  Badge,
  Icon,
  Flex,
  Spinner,
  Textarea
} from "@chakra-ui/react";
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
              <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                Notifications
              </Text>
              <Text color="gray.600">
                Manage system notifications and alerts
              </Text>
            </VStack>
            
            <HStack gap="3">
              <Button
                bg="#FF6B35"
                color="white"
                _hover={{ bg: "#E55A2B" }}
                _active={{ bg: "#CC4A1F" }}
                size="sm"
              >
                <HStack gap="2">
                  <Icon as={FiPlus} />
                  <Text>New Notification</Text>
                </HStack>
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                <HStack gap="2">
                  <Icon as={FiSettings} />
                  <Text>Settings</Text>
                </HStack>
              </Button>
            </HStack>
          </Flex>

          {/* Summary Cards */}
          <SimpleGrid columns={{ base: 1, md: 4 }} gap="4">
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <Icon as={FiBell} boxSize="6" color="green.500" />
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {activeCount}
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Active Notifications
                </Text>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <Icon as={FiMail} boxSize="6" color="blue.500" />
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {emailCount}
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Email Notifications
                </Text>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <Icon as={FiBell} boxSize="6" color="purple.500" />
                <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                  {systemCount}
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  System Notifications
                </Text>
              </VStack>
            </Box>
            
            <Box bg="white" p="4" borderRadius="lg" boxShadow="sm">
              <VStack gap="2">
                <Icon as={FiClock} boxSize="6" color="red.500" />
                <Text fontSize="2xl" fontWeight="bold" color="red.600">
                  {immediateCount}
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Immediate Alerts
                </Text>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Search and Filters */}
          <Box bg="white" p="6" borderRadius="lg" boxShadow="sm">
            <HStack gap="4">
              <Box flex="1">
                <HStack>
                  <Icon as={FiSearch} color="gray.400" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    border="none"
                    _focus={{ boxShadow: "none" }}
                  />
                </HStack>
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
                <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                  Notification Templates
                </Text>
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
                          <Text fontSize="md" fontWeight="semibold" color="gray.800">
                            {notification.name}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {notification.description}
                          </Text>
                        </VStack>
                        
                        <VStack gap="1" align="end">
                        <Badge
                          bg={`${getTypeColor(notification.type)}.500`}
                          color="white"
                          variant="solid"
                          fontSize="xs"
                        >
                          {notification.type}
                        </Badge>
                          <Badge
                            bg={`${getFrequencyColor(notification.frequency)}.500`}
                            color="white"
                            variant="subtle"
                            fontSize="xs"
                          >
                            {notification.frequency}
                          </Badge>
                          <Badge
                            bg={notification.isActive ? "green.500" : "gray.500"}
                            color="white"
                            variant="subtle"
                            fontSize="xs"
                          >
                            {notification.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </VStack>
                      </Flex>
                      
                      <Text fontSize="sm" color="gray.600">
                        Trigger: {notification.trigger}
                      </Text>
                      
                      <HStack justify="space-between" fontSize="sm" color="gray.600">
                        <Text>Recipients: {notification.recipients.length}</Text>
                        {notification.lastSent && (
                          <Text>Last sent: {new Date(notification.lastSent).toLocaleDateString()}</Text>
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
                          <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                            {selectedNotification.name}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {selectedNotification.description}
                          </Text>
                        </VStack>
                        
                        <HStack gap="2">
                          <Badge
                            bg={`${getTypeColor(selectedNotification.type)}.500`}
                            color="white"
                            variant="solid"
                            fontSize="xs"
                          >
                            {selectedNotification.type}
                          </Badge>
                          <Badge
                            bg={`${getFrequencyColor(selectedNotification.frequency)}.500`}
                            color="white"
                            variant="solid"
                            fontSize="xs"
                          >
                            {selectedNotification.frequency}
                          </Badge>
                        </HStack>
                      </Flex>
                      
                      <HStack gap="4" fontSize="sm" color="gray.600">
                        <Text>Recipients: {selectedNotification.recipients.length}</Text>
                        <Text>Status: {selectedNotification.isActive ? "Active" : "Inactive"}</Text>
                        {selectedNotification.lastSent && (
                          <Text>Last sent: {new Date(selectedNotification.lastSent).toLocaleDateString()}</Text>
                        )}
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Details */}
                  <Box p="4" flex="1" overflowY="auto">
                    <VStack gap="4" align="stretch">
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                          Trigger Condition:
                        </Text>
                        <Text fontSize="sm" color="gray.600" p="3" bg="gray.50" borderRadius="md">
                          {selectedNotification.trigger}
                        </Text>
                      </Box>
                      
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                          Email Template:
                        </Text>
                        <Textarea
                          value={selectedNotification.template}
                          readOnly
                          rows={4}
                          fontSize="sm"
                          bg="gray.50"
                        />
                      </Box>
                      
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                          Recipients:
                        </Text>
                        <VStack gap="1" align="stretch">
                          {selectedNotification.recipients.map((recipient, index) => (
                            <Text key={index} fontSize="sm" color="gray.600" p="2" bg="gray.50" borderRadius="md">
                              {recipient}
                            </Text>
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
                        <Text fontSize="sm" color="gray.700">
                          {selectedNotification.isActive ? "Active" : "Inactive"}
                        </Text>
                      </HStack>
                      
                      <HStack gap="2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          <HStack gap="2">
                            <Icon as={FiEdit} />
                            <Text>Edit</Text>
                          </HStack>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          borderColor="red.300"
                          color="red.600"
                          _hover={{ bg: "red.50" }}
                        >
                          <HStack gap="2">
                            <Icon as={FiTrash2} />
                            <Text>Delete</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    </HStack>
                  </Box>
                </VStack>
              ) : (
                <Flex justify="center" align="center" height="100%">
                  <VStack gap="4">
                    <Icon as={FiBell} boxSize="12" color="gray.400" />
                    <Text fontSize="lg" color="gray.600">
                      Select a notification to view details
                    </Text>
                  </VStack>
                </Flex>
              )}
            </Box>
          </Flex>

          {/* Notification Rules */}
          <Box bg="white" p="6" borderRadius="lg" boxShadow="sm">
            <VStack gap="4" align="stretch">
              <Flex justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                  Notification Rules
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <HStack gap="2">
                    <Icon as={FiPlus} />
                    <Text>New Rule</Text>
                  </HStack>
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
                          <Text fontSize="md" fontWeight="semibold" color="gray.800">
                            {rule.name}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {rule.action}
                          </Text>
                        </VStack>
                        
                        <VStack gap="1" align="end">
                          <Badge
                            bg={`${getPriorityColor(rule.priority)}.500`}
                            color="white"
                            variant="solid"
                            fontSize="xs"
                          >
                            {rule.priority}
                          </Badge>
                          <Badge
                            bg={rule.isActive ? "green.500" : "gray.500"}
                            color="white"
                            variant="subtle"
                            fontSize="xs"
                          >
                            {rule.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </VStack>
                      </Flex>

                      <Box>
                        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="1">
                          Condition:
                        </Text>
                        <Text fontSize="sm" color="gray.600" p="2" bg="white" borderRadius="md">
                          {rule.condition}
                        </Text>
                      </Box>

                      <HStack justify="space-between" fontSize="sm" color="gray.600">
                        <Text>Rule ID: {rule.id}</Text>
                        {rule.lastTriggered && (
                          <Text>Last triggered: {new Date(rule.lastTriggered).toLocaleDateString()}</Text>
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
                            size="xs"
                            variant="ghost"
                          >
                            <HStack gap="1">
                              <Icon as={FiEdit} />
                              <Text>Edit</Text>
                            </HStack>
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            color="red.600"
                            _hover={{ bg: "red.50" }}
                          >
                            <HStack gap="1">
                              <Icon as={FiTrash2} />
                              <Text>Delete</Text>
                            </HStack>
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
