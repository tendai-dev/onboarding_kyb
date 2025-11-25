// @ts-nocheck
"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Avatar,
  Badge,
  Flex,
  Icon,
  Tooltip,
  Alert,
  AlertTitle,
  AlertDescription,
  Spinner,
  Image,
  Link,
  Divider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  Checkbox,
  SimpleGrid
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import {
  FiSend,
  FiPaperclip,
  FiMoreVertical,
  FiSearch,
  FiFilter,
  FiArchive,
  FiFlag,
  FiReply,
  FiForward,
  FiDownload,
  FiEye,
  FiEdit,
  FiTrash2,
  FiStar,
  FiStarFill,
  FiClock,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiUser,
  FiUsers,
  FiTag,
  FiCalendar,
  FiMessageSquare,
  FiFileText,
  FiImage,
  FiVideo,
  FiFile
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion.create(Box);
const MotionVStack = motion.create(VStack);

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'partner' | 'admin' | 'system';
  senderAvatar?: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    url: string;
  }>;
  replyTo?: string;
  isRead: boolean;
  isStarred: boolean;
  tags?: string[];
  applicationId?: string;
  sectionReference?: string;
}

export interface Conversation {
  id: string;
  applicationId: string;
  partnerName: string;
  partnerEmail: string;
  lastMessage: Message;
  unreadCount: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'active' | 'archived' | 'closed';
  assignedTo?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface EnhancedMessagingProps {
  conversations: Conversation[];
  messages: Message[];
  currentConversationId?: string;
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  onReplyToMessage: (messageId: string, content: string) => Promise<void>;
  onForwardMessage: (messageId: string, toConversationId: string) => Promise<void>;
  onStarMessage: (messageId: string) => Promise<void>;
  onArchiveConversation: (conversationId: string) => Promise<void>;
  onAssignConversation: (conversationId: string, adminId: string) => Promise<void>;
  onTagConversation: (conversationId: string, tags: string[]) => Promise<void>;
  currentUser: {
    id: string;
    name: string;
    type: 'partner' | 'admin';
    avatar?: string;
  };
}

export function EnhancedMessaging({
  conversations,
  messages,
  currentConversationId,
  onSendMessage,
  onReplyToMessage,
  onForwardMessage,
  onStarMessage,
  onArchiveConversation,
  onAssignConversation,
  onTagConversation,
  currentUser
}: EnhancedMessagingProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [forwardToConversation, setForwardToConversation] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isOpen: isReplyOpen, onOpen: onReplyOpen, onClose: onReplyClose } = useDisclosure();
  const { isOpen: isForwardOpen, onOpen: onForwardOpen, onClose: onForwardClose } = useDisclosure();
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
  const { isOpen: isTagOpen, onOpen: onTagOpen, onClose: onTagClose } = useDisclosure();

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.partnerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.applicationId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = filterPriority === "all" || conv.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || conv.status === filterStatus;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Filter messages for current conversation
  const currentMessages = selectedConversation 
    ? messages.filter(msg => msg.applicationId === selectedConversation.applicationId)
    : [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // Set selected conversation when currentConversationId changes
  useEffect(() => {
    if (currentConversationId) {
      const conv = conversations.find(c => c.id === currentConversationId);
      setSelectedConversation(conv || null);
    }
  }, [currentConversationId, conversations]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    
    setIsSending(true);
    try {
      await onSendMessage(newMessage, attachments);
      setNewMessage("");
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = async () => {
    if (!replyToMessage || !newMessage.trim()) return;
    
    setIsSending(true);
    try {
      await onReplyToMessage(replyToMessage.id, newMessage);
      setNewMessage("");
      setReplyToMessage(null);
      onReplyClose();
    } catch (error) {
      console.error('Error replying to message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleForward = async () => {
    if (!replyToMessage || !forwardToConversation) return;
    
    try {
      await onForwardMessage(replyToMessage.id, forwardToConversation);
      setReplyToMessage(null);
      setForwardToConversation("");
      onForwardClose();
    } catch (error) {
      console.error('Error forwarding message:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'normal': return 'blue';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read': return FiCheckCircle;
      case 'delivered': return FiCheck;
      case 'sent': return FiClock;
      default: return FiClock;
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return FiImage;
    if (type.startsWith('video/')) return FiVideo;
    if (type.includes('pdf')) return FiFileText;
    return FiFile;
  };

  const messageTemplates = [
    "Thank you for your application. We are currently reviewing your documents.",
    "We need additional information to complete your application. Please provide the following:",
    "Your application has been approved. Welcome to Mukuru!",
    "We have received your documents and they are under review.",
    "Please upload the missing documents listed in your requirements.",
    "Your application requires additional verification. We will contact you shortly.",
    "Thank you for your patience. We are working to process your application as quickly as possible."
  ];

  return (
    <Flex height="100vh" bg="gray.50">
      {/* Conversations Sidebar */}
      <Box width="400px" bg="white" borderRight="1px" borderColor="gray.200" display="flex" flexDirection="column">
        {/* Header */}
        <Box p="4" borderBottom="1px" borderColor="gray.200">
          <VStack gap="4" align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                Messages
              </Text>
              <Badge colorScheme="orange" variant="solid">
                {conversations.filter(c => c.unreadCount > 0).length}
              </Badge>
            </HStack>
            
            {/* Search and Filters */}
            <VStack gap="2" align="stretch">
              <HStack>
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="sm"
                />
                <Button size="sm" variant="outline">
                  <Icon as={FiSearch} />
                </Button>
              </HStack>
              
              <HStack gap="2">
                <Select
                  size="sm"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </Select>
                
                <Select
                  size="sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="closed">Closed</option>
                </Select>
              </HStack>
            </VStack>
          </VStack>
        </Box>

        {/* Conversations List */}
        <Box flex="1" overflowY="auto">
          <VStack gap="0" align="stretch">
            {filteredConversations.map((conversation) => (
              <MotionBox
                key={conversation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Box
                  p="4"
                  borderBottom="1px"
                  borderColor="gray.100"
                  cursor="pointer"
                  bg={selectedConversation?.id === conversation.id ? "orange.50" : "white"}
                  _hover={{ bg: selectedConversation?.id === conversation.id ? "orange.100" : "gray.50" }}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <VStack gap="2" align="stretch">
                    <HStack justify="space-between">
                      <HStack gap="2">
                        <Avatar size="sm" name={conversation.partnerName} />
                        <VStack align="start" gap="0">
                          <Text fontSize="sm" fontWeight="medium" color="gray.800">
                            {conversation.partnerName}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {conversation.applicationId}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <VStack align="end" gap="0">
                        <Badge
                          colorScheme={getPriorityColor(conversation.priority)}
                          size="sm"
                          variant="subtle"
                        >
                          {conversation.priority}
                        </Badge>
                        {conversation.unreadCount > 0 && (
                          <Badge colorScheme="orange" variant="solid" borderRadius="full">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </VStack>
                    </HStack>
                    
                    <Text fontSize="xs" color="gray.600" noOfLines={2}>
                      {conversation.lastMessage.content}
                    </Text>
                    
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.500">
                        {new Date(conversation.lastMessage.timestamp).toLocaleTimeString()}
                      </Text>
                      <HStack gap="1">
                        {conversation.tags.map(tag => (
                          <Badge key={tag} size="sm" variant="outline" colorScheme="blue">
                            {tag}
                          </Badge>
                        ))}
                      </HStack>
                    </HStack>
                  </VStack>
                </Box>
              </MotionBox>
            ))}
          </VStack>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box flex="1" display="flex" flexDirection="column">
        {selectedConversation ? (
          <>
            {/* Messages Header */}
            <Box p="4" bg="white" borderBottom="1px" borderColor="gray.200">
              <HStack justify="space-between">
                <HStack gap="3">
                  <Avatar name={selectedConversation.partnerName} />
                  <VStack align="start" gap="0">
                    <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                      {selectedConversation.partnerName}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {selectedConversation.partnerEmail} • {selectedConversation.applicationId}
                    </Text>
                  </VStack>
                </HStack>
                
                <HStack gap="2">
                  <Button size="sm" variant="outline" onClick={onAssignOpen}>
                    <Icon as={FiUser} mr="1" />
                    Assign
                  </Button>
                  <Button size="sm" variant="outline" onClick={onTagOpen}>
                    <Icon as={FiTag} mr="1" />
                    Tag
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onArchiveConversation(selectedConversation.id)}>
                    <Icon as={FiArchive} mr="1" />
                    Archive
                  </Button>
                  <Menu>
                    <MenuButton as={Button} size="sm" variant="outline">
                      <Icon as={FiMoreVertical} />
                    </MenuButton>
                    <MenuList>
                      <MenuItem icon={<Icon as={FiFlag} />}>Flag</MenuItem>
                      <MenuItem icon={<Icon as={FiArchive} />}>Archive</MenuItem>
                      <MenuDivider />
                      <MenuItem icon={<Icon as={FiTrash2} />} color="red.500">Delete</MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </HStack>
            </Box>

            {/* Messages List */}
            <Box flex="1" overflowY="auto" p="4" bg="gray.50">
              <VStack gap="4" align="stretch">
                <AnimatePresence>
                  {currentMessages.map((message) => (
                    <MotionBox
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Flex
                        justify={message.senderType === currentUser.type ? 'flex-end' : 'flex-start'}
                        align="start"
                        gap="3"
                      >
                        {message.senderType !== currentUser.type && (
                          <Avatar size="sm" name={message.senderName} src={message.senderAvatar} />
                        )}
                        
                        <Box
                          maxW="70%"
                          bg={message.senderType === currentUser.type ? "orange.500" : "white"}
                          color={message.senderType === currentUser.type ? "white" : "gray.800"}
                          p="3"
                          borderRadius="lg"
                          boxShadow="sm"
                          position="relative"
                        >
                          <VStack align="start" gap="2">
                            {message.replyTo && (
                              <Box
                                p="2"
                                bg={message.senderType === currentUser.type ? "orange.600" : "gray.100"}
                                borderRadius="md"
                                fontSize="xs"
                                opacity="0.8"
                              >
                                <Text fontWeight="medium">Replying to:</Text>
                                <Text noOfLines={2}>
                                  {/* Reply content would go here */}
                                </Text>
                              </Box>
                            )}
                            
                            <Text fontSize="sm" lineHeight="1.4">
                              {message.content}
                            </Text>
                            
                            {message.attachments && message.attachments.length > 0 && (
                              <VStack align="start" gap="1">
                                {message.attachments.map((attachment) => (
                                  <HStack
                                    key={attachment.id}
                                    p="2"
                                    bg={message.senderType === currentUser.type ? "orange.600" : "gray.100"}
                                    borderRadius="md"
                                    cursor="pointer"
                                    _hover={{ opacity: 0.8 }}
                                  >
                                    <Icon as={getFileIcon(attachment.type)} />
                                    <Text fontSize="xs">{attachment.name}</Text>
                                    <Text fontSize="xs" opacity="0.7">({attachment.size})</Text>
                                  </HStack>
                                ))}
                              </VStack>
                            )}
                            
                            <HStack justify="space-between" width="100%">
                              <Text fontSize="xs" opacity="0.7">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </Text>
                              <HStack gap="1">
                                <Icon as={getStatusIcon(message.status)} size="12px" opacity="0.7" />
                                {message.isStarred && (
                                  <Icon as={FiStarFill} size="12px" color="yellow.400" />
                                )}
                              </HStack>
                            </HStack>
                          </VStack>
                          
                          {/* Message Actions */}
                          <Box
                            position="absolute"
                            top="-8px"
                            right="-8px"
                            opacity="0"
                            _groupHover={{ opacity: 1 }}
                            transition="opacity 0.2s"
                          >
                            <Menu>
                              <MenuButton as={Button} size="xs" variant="solid" colorScheme="gray">
                                <Icon as={FiMoreVertical} />
                              </MenuButton>
                              <MenuList>
                                <MenuItem icon={<Icon as={FiReply} />} onClick={() => {
                                  setReplyToMessage(message);
                                  onReplyOpen();
                                }}>
                                  Reply
                                </MenuItem>
                                <MenuItem icon={<Icon as={FiForward} />} onClick={() => {
                                  setReplyToMessage(message);
                                  onForwardOpen();
                                }}>
                                  Forward
                                </MenuItem>
                                <MenuItem icon={<Icon as={FiStar} />} onClick={() => onStarMessage(message.id)}>
                                  Star
                                </MenuItem>
                                <MenuDivider />
                                <MenuItem icon={<Icon as={FiDownload} />}>Download</MenuItem>
                                <MenuItem icon={<Icon as={FiTrash2} />} color="red.500">Delete</MenuItem>
                              </MenuList>
                            </Menu>
                          </Box>
                        </Box>
                        
                        {message.senderType === currentUser.type && (
                          <Avatar size="sm" name={message.senderName} src={message.senderAvatar} />
                        )}
                      </Flex>
                    </MotionBox>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </VStack>
            </Box>

            {/* Message Input */}
            <Box p="4" bg="white" borderTop="1px" borderColor="gray.200">
              <VStack gap="3" align="stretch">
                {/* Attachments */}
                {attachments.length > 0 && (
                  <HStack gap="2" flexWrap="wrap">
                    {attachments.map((file, index) => (
                      <HStack
                        key={index}
                        p="2"
                        bg="gray.100"
                        borderRadius="md"
                        gap="2"
                      >
                        <Icon as={getFileIcon(file.type)} />
                        <Text fontSize="xs">{file.name}</Text>
                        <Button size="xs" variant="ghost" onClick={() => removeAttachment(index)}>
                          <Icon as={FiX} />
                        </Button>
                      </HStack>
                    ))}
                  </HStack>
                )}
                
                {/* Input Area */}
                <HStack gap="2" align="end">
                  <VStack flex="1" align="stretch">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={1}
                      resize="none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    
                    {/* Quick Actions */}
                    <HStack justify="space-between">
                      <HStack gap="1">
                        <Button size="xs" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                          <Icon as={FiPaperclip} />
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => setShowTemplates(!showTemplates)}>
                          <Icon as={FiMessageSquare} />
                        </Button>
                      </HStack>
                      
                      <Button
                        size="sm"
                        colorScheme="orange"
                        onClick={handleSendMessage}
                        isLoading={isSending}
                        loadingText="Sending..."
                        isDisabled={!newMessage.trim() && attachments.length === 0}
                      >
                        <Icon as={FiSend} mr="1" />
                        Send
                      </Button>
                    </HStack>
                  </VStack>
                </HStack>
                
                {/* Message Templates */}
                {showTemplates && (
                  <Box p="3" bg="gray.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="medium" mb="2">Quick Templates:</Text>
                    <SimpleGrid columns={2} gap="2">
                      {messageTemplates.map((template, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant="outline"
                          textAlign="left"
                          height="auto"
                          p="2"
                          onClick={() => {
                            setNewMessage(template);
                            setShowTemplates(false);
                          }}
                        >
                          <Text fontSize="xs" noOfLines={2}>
                            {template}
                          </Text>
                        </Button>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
              </VStack>
            </Box>
          </>
        ) : (
          <Box flex="1" display="flex" alignItems="center" justifyContent="center">
            <VStack gap="4">
              <Icon as={FiMessageSquare} boxSize="12" color="gray.400" />
              <Text fontSize="lg" color="gray.600">
                Select a conversation to start messaging
              </Text>
            </VStack>
          </Box>
        )}
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Reply Modal */}
      <Modal isOpen={isReplyOpen} onClose={onReplyClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reply to Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack gap="4" align="stretch">
              <Box p="3" bg="gray.50" borderRadius="md">
                <Text fontSize="sm" fontWeight="medium" mb="2">Replying to:</Text>
                <Text fontSize="sm" color="gray.600">
                  {replyToMessage?.content}
                </Text>
              </Box>
              
              <FormControl>
                <FormLabel>Your Reply</FormLabel>
                <Textarea
                  placeholder="Type your reply..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr="3" onClick={onReplyClose}>
              Cancel
            </Button>
            <Button colorScheme="orange" onClick={handleReply} isLoading={isSending}>
              Send Reply
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Forward Modal */}
      <Modal isOpen={isForwardOpen} onClose={onForwardClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Forward Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack gap="4" align="stretch">
              <Box p="3" bg="gray.50" borderRadius="md">
                <Text fontSize="sm" fontWeight="medium" mb="2">Forwarding:</Text>
                <Text fontSize="sm" color="gray.600">
                  {replyToMessage?.content}
                </Text>
              </Box>
              
              <FormControl>
                <FormLabel>Forward to Conversation</FormLabel>
                <Select
                  placeholder="Select conversation..."
                  value={forwardToConversation}
                  onChange={(e) => setForwardToConversation(e.target.value)}
                >
                  {conversations.map(conv => (
                    <option key={conv.id} value={conv.id}>
                      {conv.partnerName} - {conv.applicationId}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr="3" onClick={onForwardClose}>
              Cancel
            </Button>
            <Button colorScheme="orange" onClick={handleForward}>
              Forward Message
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={isAssignOpen} onClose={onAssignClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Conversation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Assign to Admin</FormLabel>
              <Select placeholder="Select admin...">
                <option value="admin1">John Smith</option>
                <option value="admin2">Jane Doe</option>
                <option value="admin3">Mike Johnson</option>
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr="3" onClick={onAssignClose}>
              Cancel
            </Button>
            <Button colorScheme="orange">
              Assign
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Tag Modal */}
      <Modal isOpen={isTagOpen} onClose={onTagClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Tags</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack gap="3" align="stretch">
              <Text fontSize="sm" color="gray.600">Select tags for this conversation:</Text>
              <VStack align="start" gap="2">
                {['urgent', 'follow-up', 'documentation', 'verification', 'approved'].map(tag => (
                  <Checkbox key={tag} defaultChecked={selectedConversation?.tags.includes(tag)}>
                    {tag}
                  </Checkbox>
                ))}
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr="3" onClick={onTagClose}>
              Cancel
            </Button>
            <Button colorScheme="orange">
              Save Tags
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}
