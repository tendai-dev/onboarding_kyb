"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  Card,
  Flex,
  Badge,
  Avatar,
  Textarea,
  Separator,
  Input,
  InputGroup,
  InputAddon,
  SimpleGrid
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@chakra-ui/react";

const MotionBox = motion.create(Box);
const MotionCard = motion.div;

const conversations = [
  {
    id: 1,
    applicationId: "APP-001",
    companyName: "TechCorp Solutions",
    lastMessage: "We need additional information regarding your expected transaction volumes.",
    timestamp: "2 hours ago",
    unreadCount: 2,
    status: "active",
    avatar: "TC"
  },
  {
    id: 2,
    applicationId: "APP-002",
    companyName: "Global Enterprises",
    lastMessage: "Thank you for the clarification. We'll proceed with the review.",
    timestamp: "1 day ago",
    unreadCount: 0,
    status: "resolved",
    avatar: "GE"
  },
  {
    id: 3,
    applicationId: "APP-003",
    companyName: "Community Foundation",
    lastMessage: "Please upload your latest financial statements.",
    timestamp: "3 days ago",
    unreadCount: 1,
    status: "pending",
    avatar: "CF"
  }
];

const messages = [
  {
    id: 1,
    sender: "John Smith",
    senderType: "admin",
    message: "Hello! I'm reviewing your application and need some additional information about your expected transaction volumes. Could you provide more details about your business model?",
    timestamp: "2024-10-24 14:30",
    attachments: []
  },
  {
    id: 2,
    sender: "Sarah Johnson",
    senderType: "partner",
    message: "Hi John, thank you for reaching out. Our business primarily handles B2B payments for small to medium enterprises. We expect to process approximately $75,000 monthly in the first year.",
    timestamp: "2024-10-24 15:45",
    attachments: []
  },
  {
    id: 3,
    sender: "Sarah Johnson",
    senderType: "partner",
    message: "I've also attached our business plan which includes detailed financial projections for the next 3 years.",
    timestamp: "2024-10-24 15:47",
    attachments: [
      { name: "Business_Plan_2024.pdf", size: "2.3 MB" }
    ]
  },
  {
    id: 4,
    sender: "John Smith",
    senderType: "admin",
    message: "Perfect! Thank you for the detailed information and the business plan. I'll review these documents and get back to you within 24 hours with next steps.",
    timestamp: "2024-10-24 16:15",
    attachments: []
  }
];

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(1);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle sending message
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.applicationId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" px="8" py="6">
        <Container maxW="8xl">
          <VStack align="start" gap="2">
            <Text as="h1" fontSize="2xl" fontWeight="bold" color="gray.800">
              Messages
            </Text>
            <Text color="gray.600">
              Communicate with applicants and team members
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="8xl" py="8">
        <Card.Root bg="white" borderRadius="xl" boxShadow="lg" border="1px" borderColor="gray.200" height="calc(100vh - 200px)">
          <Card.Body p="0">
            <Flex height="100%">
              {/* Conversations Sidebar */}
              <Box width="350px" borderRight="1px" borderColor="gray.200" height="100%">
                <VStack gap="0" height="100%">
                  {/* Search */}
                  <Box p="4" width="100%" borderBottom="1px" borderColor="gray.100">
                    <Box position="relative">
                      <Input
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        pl="10"
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        bg="gray.50"
                        _focus={{ boxShadow: "none", borderColor: "orange.400" }}
                      />
                      <Text 
                        position="absolute" 
                        left="3" 
                        top="50%" 
                        transform="translateY(-50%)" 
                        color="gray.400"
                        pointerEvents="none"
                      >
                        🔍
                      </Text>
                    </Box>
                  </Box>

                  {/* Conversations List */}
                  <VStack gap="0" width="100%" flex="1" overflowY="auto">
                    {filteredConversations.map((conversation) => (
                      <MotionBox
                        key={conversation.id}
                        width="100%"
                        p="4"
                        cursor="pointer"
                        bg={selectedConversation === conversation.id ? "blue.50" : "transparent"}
                        borderLeft={selectedConversation === conversation.id ? "3px solid" : "3px solid transparent"}
                        borderColor="blue.400"
                        _hover={{ bg: "gray.50" }}
                        onClick={() => setSelectedConversation(conversation.id)}
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <HStack gap="3" align="start">
<Avatar.Root size="md" bg="blue.400" color="white">
                            <Avatar.Fallback>{conversation.companyName.split(' ').map(n => n[0]).join('')}</Avatar.Fallback>
                          </Avatar.Root>
                          <VStack align="start" gap="1" flex="1" minW="0">
                            <HStack justify="space-between" width="100%">
                              <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
                                {conversation.companyName}
                              </Text>
                              {conversation.unreadCount > 0 && (
                                <Badge
                                  colorScheme="blue"
                                  variant="solid"
                                  borderRadius="full"
                                  fontSize="xs"
                                  minW="20px"
                                  textAlign="center"
                                >
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="xs" color="gray.600" mb="1">
                              {conversation.applicationId}
                            </Text>
                            <Text fontSize="sm" color="gray.700" lineClamp={2}>
                              {conversation.lastMessage}
                            </Text>
                            <HStack justify="space-between" width="100%">
                              <Text fontSize="xs" color="gray.500">
                                {conversation.timestamp}
                              </Text>
                              <Badge
                                colorScheme={
                                  conversation.status === 'active' ? 'green' :
                                  conversation.status === 'pending' ? 'yellow' : 'gray'
                                }
                                variant="subtle"
                                fontSize="xs"
                              >
                                {conversation.status}
                              </Badge>
                            </HStack>
                          </VStack>
                        </HStack>
                      </MotionBox>
                    ))}
                  </VStack>
                </VStack>
              </Box>

              {/* Chat Area */}
              <Box flex="1" height="100%" display="flex" flexDirection="column">
                {/* Chat Header */}
                <Box p="4" borderBottom="1px" borderColor="gray.200">
                  <HStack justify="space-between">
                    <HStack gap="3">
<Avatar.Root size="md" bg="blue.400" color="white">
                        <Avatar.Fallback>TS</Avatar.Fallback>
                      </Avatar.Root>
                      <VStack align="start" gap="0">
                        <Text fontWeight="semibold">TechCorp Solutions</Text>
                        <Text fontSize="sm" color="gray.600">APP-001 • Active</Text>
                      </VStack>
                    </HStack>
                    <HStack gap="2">
                      <Button variant="ghost" size="sm">
                        View Application
                      </Button>
                      <Button variant="outline" size="sm">
                        Mark as Resolved
                      </Button>
                    </HStack>
                  </HStack>
                </Box>

                {/* Messages */}
                <Box flex="1" overflowY="auto" p="4">
                  <VStack gap="4" align="stretch">
                    {messages.map((message) => (
                      <MotionBox
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Flex
                          justify={message.senderType === 'partner' ? 'flex-end' : 'flex-start'}
                        >
                          <Box maxW="70%">
                            <HStack
                              gap="2"
                              mb="2"
                              justify={message.senderType === 'partner' ? 'flex-end' : 'flex-start'}
                            >
                              {message.senderType === 'admin' && (
                                <Avatar.Root size="sm">
                                  <Avatar.Fallback>{message.sender.split(' ').map(n => n[0]).join('')}</Avatar.Fallback>
                                </Avatar.Root>
                              )}
                              <VStack align={message.senderType === 'partner' ? 'end' : 'start'} gap="0">
                                <Text fontSize="sm" fontWeight="medium">
                                  {message.sender}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {message.timestamp}
                                </Text>
                              </VStack>
                              {message.senderType === 'partner' && (
                                <Avatar.Root size="sm">
                                  <Avatar.Fallback>{message.sender.split(' ').map(n => n[0]).join('')}</Avatar.Fallback>
                                </Avatar.Root>
                              )}
                            </HStack>
                            
                            <Box
                              bg={message.senderType === 'partner' ? 'blue.500' : 'gray.100'}
                              color={message.senderType === 'partner' ? 'white' : 'gray.800'}
                              p="3"
                              borderRadius="lg"
                              borderTopLeftRadius={message.senderType === 'admin' ? '4px' : 'lg'}
                              borderTopRightRadius={message.senderType === 'partner' ? '4px' : 'lg'}
                            >
                              <Text fontSize="sm" lineHeight="1.5">
                                {message.message}
                              </Text>
                              
                              {message.attachments.length > 0 && (
                                <VStack gap="2" mt="3" align="start">
                                  {message.attachments.map((attachment, index) => (
                                    <HStack
                                      key={index}
                                      p="2"
                                      bg={message.senderType === 'partner' ? 'blue.600' : 'gray.200'}
                                      borderRadius="md"
                                      gap="2"
                                      cursor="pointer"
                                      _hover={{ opacity: 0.8 }}
                                    >
                                      <Text fontSize="lg">📄</Text>
                                      <VStack align="start" gap="0">
                                        <Text fontSize="xs" fontWeight="medium">
                                          {attachment.name}
                                        </Text>
                                        <Text fontSize="xs" opacity="0.8">
                                          {attachment.size}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                  ))}
                                </VStack>
                              )}
                            </Box>
                          </Box>
                        </Flex>
                      </MotionBox>
                    ))}
                  </VStack>
                </Box>

                {/* Message Input */}
                <Box p="4" borderTop="1px" borderColor="gray.200">
                  <VStack gap="3">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      resize="none"
                      rows={3}
                      bg="gray.50"
                      border="1px"
                      borderColor="gray.200"
                      _focus={{ borderColor: "blue.400", bg: "white" }}
                    />
                    <HStack justify="space-between" width="100%">
                      <HStack gap="2">
                        <Button variant="ghost" size="sm">
                          📎 Attach File
                        </Button>
                        <Button variant="ghost" size="sm">
                          😊 Emoji
                        </Button>
                      </HStack>
                      <HStack gap="2">
                        <Button variant="ghost" size="sm">
                          Save Draft
                        </Button>
                        <Button
                          variant="solid"
                          size="sm"
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                        >
                          Send Message
                        </Button>
                      </HStack>
                    </HStack>
                  </VStack>
                </Box>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      </Container>
    </Box>
  );
}
