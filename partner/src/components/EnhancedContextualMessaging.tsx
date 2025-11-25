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
  Spinner,
  Image,
  Link,
  useDisclosure,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
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
  FiCornerUpLeft,
  FiCornerUpRight,
  FiDownload,
  FiEye,
  FiEdit,
  FiTrash2,
  FiStar,
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
  FiFile,
  FiMapPin,
  FiFolder
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion.create(Box);
const MotionVStack = motion.create(VStack);

export interface ContextualMessage {
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
  documentReference?: string;
  fieldReference?: string;
  context?: {
    sectionTitle?: string;
    fieldLabel?: string;
    documentName?: string;
    actionRequired?: string;
  };
}

export interface ContextualConversation {
  id: string;
  applicationId: string;
  partnerId: string;
  adminId?: string;
  subject: string;
  status: 'active' | 'resolved' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  tags: string[];
  createdAt: string;
  contextSections: string[];
}

interface EnhancedContextualMessagingProps {
  conversations: ContextualConversation[];
  messages: ContextualMessage[];
  currentConversationId?: string;
  currentApplicationId?: string;
  onSendMessage: (content: string, context?: any, attachments?: File[]) => Promise<void>;
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
  applicationSections?: Array<{
    id: string;
    title: string;
    fields: Array<{
      id: string;
      label: string;
      value?: any;
    }>;
  }>;
  applicationDocuments?: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    url?: string;
  }>;
}

export function EnhancedContextualMessaging({
  conversations,
  messages,
  currentConversationId,
  currentApplicationId,
  onSendMessage,
  onReplyToMessage,
  onForwardMessage,
  onStarMessage,
  onArchiveConversation,
  onAssignConversation,
  onTagConversation,
  currentUser,
  applicationSections = [],
  applicationDocuments = [],
  loadingContext = false
}: EnhancedContextualMessagingProps & { loadingContext?: boolean }) {
  
  const [newMessage, setNewMessage] = useState("");
  const [selectedContext, setSelectedContext] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isSending, setIsSending] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<ContextualMessage | null>(null);
  
  const { open: isContextOpen, onOpen: onContextOpen, onClose: onContextClose } = useDisclosure();
  const { open: isAttachmentOpen, onOpen: onAttachmentOpen, onClose: onAttachmentClose } = useDisclosure();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [banner, setBanner] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  // Filter messages by conversation/thread, sort by timestamp (oldest first for display)
  const currentMessages = messages
    .filter(m => !currentConversationId || m.applicationId === currentApplicationId || m.applicationId === currentConversation?.applicationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedAttachments.length === 0) return;
    
    // Check if we have an application ID
    if (!currentApplicationId) {
      setBanner({ status: 'error', message: 'Please select an application to send a message' });
      setTimeout(() => setBanner(null), 3000);
      return;
    }
    
    setIsSending(true);
    try {
      await onSendMessage(newMessage, selectedContext, selectedAttachments);
      setNewMessage("");
      setSelectedContext(null);
      setSelectedAttachments([]);
      setReplyToMessage(null);
    } catch (error) {
      setBanner({ status: 'error', message: 'Failed to send message' });
      setTimeout(() => setBanner(null), 3000);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setSelectedAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getContextualSections = () => {
    return applicationSections.map(section => ({
      id: section.id,
      title: section.title,
      type: 'section',
      fields: section.fields
    }));
  };

  const getContextualDocuments = () => {
    return applicationDocuments.map(doc => ({
      id: doc.id,
      title: doc.name || 'Document',
      type: doc.type || 'document',
      status: doc.status || 'unknown',
      url: doc.url
    }));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'blue';
      case 'delivered': return 'green';
      case 'read': return 'green';
      default: return 'gray';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return FiImage;
    if (type.startsWith('video/')) return FiVideo;
    if (type.includes('pdf')) return FiFileText;
    return FiFile;
  };

  return (
    <Box height="100%" display="flex" flexDirection="column" overflow="hidden" minH="0">
      {/* Header */}
      <Box p="3" borderBottom="1px" borderColor="gray.200" bg="white" flexShrink={0}>
        <VStack gap="2" align="stretch">
          <HStack justify="space-between" align="center">
            <VStack align="start" gap="0.5">
              <Text fontSize="md" fontWeight="semibold" color="gray.900">
                Application Communication
              </Text>
              <Text fontSize="xs" color="gray.600" fontWeight="normal">
                {currentApplicationId ? `Application ${currentApplicationId.slice(0, 8)}...` : 'No application selected'}
              </Text>
            </VStack>
            
            {currentMessages.filter(m => !m.isRead && m.senderType !== currentUser.type).length > 0 && (
              <Badge 
                colorScheme="orange" 
                variant="solid"
                px="1.5"
                py="0.5"
                borderRadius="full"
                fontSize="2xs"
                fontWeight="semibold"
              >
                {currentMessages.filter(m => !m.isRead && m.senderType !== currentUser.type).length} Unread
              </Badge>
            )}
          </HStack>
          
          {/* Context Selection */}
          <HStack gap="2" align="center">
            <Text fontSize="xs" color="gray.600" fontWeight="medium">Reference:</Text>
            <Button
              size="xs"
              variant="outline"
              onClick={onContextOpen}
              borderColor="gray.300"
              _hover={{ bg: "gray.50", borderColor: "gray.400" }}
              height="24px"
              fontSize="xs"
            >
              <Icon as={FiMapPin} mr="1" boxSize="3" />
              {selectedContext ? selectedContext.title : "Select Context"}
            </Button>
            {selectedContext && (
              <Badge colorScheme="blue" variant="subtle" fontSize="2xs">
                {selectedContext.type}
              </Badge>
            )}
          </HStack>
        </VStack>
      </Box>

      {/* Banner */}
      {banner && (
        <Box p="3" bg={banner.status === 'success' ? 'green.50' : 'red.50'} border="1px" borderColor={banner.status === 'success' ? 'green.200' : 'red.200'}>
          <Text fontSize="sm" color={banner.status === 'success' ? 'green.700' : 'red.700'}>{banner.message}</Text>
        </Box>
      )}

      {/* Messages */}
      <Box flex="1" overflowY="auto" p="4" bg="gray.50">
        <VStack gap="2.5" align="stretch">
          <AnimatePresence>
            {currentMessages.length === 0 ? (
              <Box p="8" textAlign="center">
                <Icon as={FiMessageSquare} boxSize="8" color="gray.300" mb="3" />
                <Text fontSize="sm" color="gray.500" fontWeight="medium">No messages yet</Text>
                <Text fontSize="xs" color="gray.400" mt="1">Start the conversation below</Text>
              </Box>
            ) : (
              currentMessages.map((message) => (
                <MotionBox
                  key={message.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.1 }}
                >
                  {/* Determine if message is from current user (partner) or admin */}
                  {(() => {
                    // In partner view: partner messages go on RIGHT, admin messages on LEFT
                    const isFromCurrentUser = message.senderType === 'partner' || 
                                             (currentUser.type === 'partner' && message.senderType !== 'admin');
                    const isFromAdmin = message.senderType === 'admin';
                    
                    return (
                      <Flex
                        justify={isFromCurrentUser ? "flex-end" : "flex-start"}
                        gap="2"
                        align="flex-start"
                        maxW="75%"
                        ml={isFromCurrentUser ? "auto" : "0"}
                        mr={!isFromCurrentUser ? "auto" : "0"}
                      >
                        {!isFromCurrentUser && (
                          <Avatar.Root size="sm" flexShrink={0}>
                            <Avatar.Fallback bg={isFromAdmin ? "orange.500" : "blue.500"} color="white" fontSize="xs" fontWeight="semibold">
                              {message.senderName.charAt(0).toUpperCase()}
                            </Avatar.Fallback>
                          </Avatar.Root>
                        )}
                        <Box
                          maxW="100%"
                          p="2.5"
                          bg={isFromCurrentUser ? "blue.500" : (isFromAdmin ? "orange.500" : "white")}
                          bgGradient={isFromCurrentUser ? "linear(to-br, blue.500, blue.600)" : (isFromAdmin ? "linear(to-br, orange.500, orange.600)" : undefined)}
                          color={isFromCurrentUser || isFromAdmin ? "white" : "gray.900"}
                          borderRadius="lg"
                          boxShadow={isFromCurrentUser ? "0 2px 8px rgba(49, 130, 206, 0.2)" : (isFromAdmin ? "0 2px 8px rgba(237, 137, 54, 0.2)" : "0 1px 4px rgba(0, 0, 0, 0.06)")}
                          border={isFromCurrentUser || isFromAdmin ? "none" : "1px solid"}
                          borderColor={isFromCurrentUser || isFromAdmin ? "transparent" : "gray.200"}
                          _hover={{
                            boxShadow: isFromCurrentUser ? "0 3px 10px rgba(49, 130, 206, 0.25)" : (isFromAdmin ? "0 3px 10px rgba(237, 137, 54, 0.25)" : "0 2px 6px rgba(0, 0, 0, 0.08)")
                          }}
                          transition="all 0.2s ease"
                        >
                          <VStack gap="1.5" align="stretch">
                            {/* Message Header */}
                            <HStack justify="space-between" align="start" gap="2">
                              <HStack gap="1.5" align="center">
                                <Box
                                  width="4px"
                                  height="4px"
                                  borderRadius="full"
                                  bg={isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.6)" : "blue.500"}
                                  flexShrink={0}
                                />
                                <VStack align="start" gap="0">
                                  <Text 
                                    fontSize="xs" 
                                    fontWeight="medium" 
                                    color={isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.95)" : "gray.700"}
                                    letterSpacing="0.1px"
                                  >
                                    {message.senderName}
                                  </Text>
                                  <Text 
                                    fontSize="2xs" 
                                    color={isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.75)" : "gray.500"}
                                  >
                                    {new Date(message.timestamp).toLocaleString('en-US', {
                                      month: 'numeric',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </Text>
                                </VStack>
                              </HStack>
                              <Badge
                                bg={isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.2)" : "gray.100"}
                                color={isFromCurrentUser || isFromAdmin ? "white" : "gray.600"}
                                variant="solid"
                                fontSize="2xs"
                                px="1.5"
                                py="0.5"
                                borderRadius="sm"
                                fontWeight="medium"
                                backdropFilter="blur(4px)"
                              >
                                {message.isRead ? "✓ Read" : "Sent"}
                              </Badge>
                            </HStack>
                            
                            {/* Message Content */}
                            <Box pt="0.5">
                              <Text 
                                fontSize="sm" 
                                whiteSpace="pre-wrap" 
                                lineHeight="1.5"
                                color={isFromCurrentUser || isFromAdmin ? "white" : "gray.800"}
                                fontWeight="normal"
                              >
                                {message.content}
                              </Text>
                            </Box>
                            
                            {/* Message Actions */}
                            <HStack gap="0.5" pt="1.5" borderTop="1px" borderColor={isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.15)" : "gray.100"}>
                              <Button
                                size="xs"
                                variant="ghost"
                                color={isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.85)" : "gray.600"}
                                onClick={() => setReplyToMessage(message)}
                                _hover={{ 
                                  bg: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.12)" : "gray.100",
                                  color: isFromCurrentUser || isFromAdmin ? "white" : "gray.700"
                                }}
                                fontSize="2xs"
                                px="1.5"
                                py="0.5"
                                h="auto"
                                minH="auto"
                                fontWeight="normal"
                              >
                                <Icon as={FiCornerUpLeft} mr="1" boxSize="2.5" />
                                Reply
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                color={isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.85)" : "gray.600"}
                                onClick={() => onStarMessage(message.id)}
                                _hover={{ 
                                  bg: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.12)" : "gray.100",
                                  color: isFromCurrentUser || isFromAdmin ? "white" : "gray.700"
                                }}
                                fontSize="2xs"
                                px="1.5"
                                py="0.5"
                                h="auto"
                                minH="auto"
                                fontWeight="normal"
                              >
                                <Icon as={FiStar} mr="1" boxSize="2.5" />
                                Star
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                color={isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.85)" : "gray.600"}
                                _hover={{ 
                                  bg: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.12)" : "gray.100",
                                  color: isFromCurrentUser || isFromAdmin ? "white" : "gray.700"
                                }}
                                fontSize="2xs"
                                px="1.5"
                                py="0.5"
                                h="auto"
                                minH="auto"
                                fontWeight="normal"
                              >
                                <Icon as={FiCornerUpRight} mr="1" boxSize="2.5" />
                                Forward
                              </Button>
                            </HStack>
                          </VStack>
                        </Box>
                        {isFromCurrentUser && (
                          <Avatar.Root size="sm" flexShrink={0}>
                            <Avatar.Fallback bg="#f76834" color="white" fontSize="xs" fontWeight="semibold">
                              {message.senderName.charAt(0).toUpperCase()}
                            </Avatar.Fallback>
                          </Avatar.Root>
                        )}
                      </Flex>
                    );
                  })()}
                </MotionBox>
              ))
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {/* Reply Indicator */}
      {replyToMessage && (
        <Box p="3" bg="blue.50" borderTop="1px" borderColor="blue.200">
          <HStack justify="space-between">
            <HStack gap="2">
              <Icon as={FiCornerUpLeft} color="blue.500" />
              <Text fontSize="sm" color="blue.700">
                Replying to {replyToMessage.senderName}
              </Text>
            </HStack>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setReplyToMessage(null)}
            >
              Cancel
            </Button>
          </HStack>
        </Box>
      )}

      {/* Message Input */}
      <Box p="3" bg="white" borderTop="1px" borderColor="gray.200" flexShrink={0}>
        <VStack gap="2" align="stretch">
          {/* Attachments */}
          {selectedAttachments.length > 0 && (
            <Box p="2" bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
              <VStack gap="1.5" align="stretch">
                <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                  Attachments ({selectedAttachments.length})
                </Text>
                {selectedAttachments.map((file, index) => (
                  <HStack key={index} gap="2" justify="space-between" p="1.5" bg="white" borderRadius="sm">
                    <HStack gap="2" flex="1" minW="0">
                      <Icon as={getFileIcon(file.type)} color="gray.500" boxSize="3.5" />
                      <VStack align="start" gap="0" flex="1" minW="0">
                        <Text fontSize="2xs" color="gray.700" fontWeight="medium" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{file.name}</Text>
                        <Text fontSize="2xs" color="gray.500">{formatFileSize(file.size)}</Text>
                      </VStack>
                    </HStack>
                    <Button
                      size="xs"
                      variant="ghost"
                      color="red.500"
                      onClick={() => removeAttachment(index)}
                      _hover={{ bg: "red.50" }}
                      minW="auto"
                      px="1"
                      h="auto"
                    >
                      <Icon as={FiTrash2} boxSize="3" />
                    </Button>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}
          
          {/* Input Area */}
          <HStack gap="2" align="flex-end">
            <VStack gap="1.5" align="stretch" flex="1">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={2}
                resize="none"
                borderColor="gray.300"
                color="black"
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce", color: "black" }}
                _hover={{ borderColor: "gray.400" }}
                _placeholder={{ color: "gray.400" }}
                fontSize="sm"
                py="2"
                px="3"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              
              <HStack justify="space-between" align="center">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  color="gray.600"
                  _hover={{ bg: "gray.100", color: "gray.700" }}
                  fontWeight="normal"
                  h="auto"
                  py="1"
                  px="2"
                >
                  <Icon as={FiPaperclip} mr="1.5" boxSize="3.5" />
                  Attach
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                <HStack gap="1.5">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setNewMessage("")}
                    disabled={!newMessage.trim()}
                    borderColor="gray.300"
                    color="gray.600"
                    _hover={{ bg: "gray.50", borderColor: "gray.400" }}
                    fontWeight="normal"
                    h="auto"
                    py="1"
                    px="2.5"
                  >
                    Clear
                  </Button>
                  <Button
                    size="xs"
                    bg="blue.500"
                    color="white"
                    onClick={handleSendMessage}
                    loading={isSending}
                    disabled={(!newMessage.trim() && selectedAttachments.length === 0) || !currentApplicationId}
                    _hover={{ bg: "blue.600" }}
                    _active={{ bg: "blue.700" }}
                    fontWeight="semibold"
                    h="auto"
                    py="1"
                    px="3"
                    title={!currentApplicationId ? "Please select an application first" : undefined}
                  >
                    <Icon as={FiSend} mr="1.5" boxSize="3.5" />
                    Send
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </Box>

      {/* Context Selection Dialog (Chakra v3) */}
      <DialogRoot open={isContextOpen} onOpenChange={(e) => (e.open ? onContextOpen() : onContextClose())} modal={true}>
        <DialogBackdrop 
          bg="blackAlpha.600" 
          backdropFilter="blur(4px)"
        />
        <DialogContent 
          maxW="md" 
          mx="auto"
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1500}
          boxShadow="xl"
          borderRadius="xl"
          border="1px"
          borderColor="gray.200"
        >
          <DialogHeader borderBottom="1px" borderColor="gray.200" pb="3">
            <DialogTitle fontSize="lg" fontWeight="semibold" color="gray.900">Select Context Reference</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {loadingContext ? (
              <Box p="8" textAlign="center">
                <Spinner size="md" color="blue.500" />
                <Text fontSize="sm" color="gray.600" mt="3">Loading context...</Text>
              </Box>
            ) : (
              <VStack gap="4" align="stretch">
                {/* Application Sections */}
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.800" mb="2">
                    Application Sections
                  </Text>
                  {getContextualSections().length === 0 ? (
                    <Box p="4" textAlign="center" bg="gray.50" borderRadius="md">
                      <Text fontSize="xs" color="gray.500">No sections available</Text>
                    </Box>
                  ) : (
                  <VStack gap="2" align="stretch">
                    {getContextualSections().map((section) => (
                      <Box
                        key={section.id}
                        p="2.5"
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        cursor="pointer"
                        _hover={{ bg: "blue.50", borderColor: "blue.300" }}
                        transition="all 0.2s"
                        onClick={() => {
                          setSelectedContext(section);
                          onContextClose();
                        }}
                      >
                        <HStack gap="2">
                          <Icon as={FiFolder} color="blue.500" boxSize="4" />
                          <VStack align="start" gap="0" flex="1">
                            <Text fontSize="sm" fontWeight="medium" color="gray.800">
                              {section.title}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {section.fields?.length || 0} field{section.fields?.length !== 1 ? 's' : ''}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
              
              <Box h="1px" bg="gray.200" />
              
              {/* Application Documents */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.800" mb="2">
                  Application Documents
                </Text>
                {getContextualDocuments().length === 0 ? (
                  <Box p="4" textAlign="center" bg="gray.50" borderRadius="md">
                    <Text fontSize="xs" color="gray.500">No documents available</Text>
                  </Box>
                ) : (
                  <VStack gap="2" align="stretch">
                    {getContextualDocuments().map((doc) => (
                      <Box
                        key={doc.id}
                        p="2.5"
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        cursor="pointer"
                        _hover={{ bg: "green.50", borderColor: "green.300" }}
                        transition="all 0.2s"
                        onClick={() => {
                          setSelectedContext(doc);
                          onContextClose();
                        }}
                      >
                        <HStack gap="2">
                          <Icon as={FiFileText} color="green.500" boxSize="4" />
                          <VStack align="start" gap="0" flex="1">
                            <Text fontSize="sm" fontWeight="medium" color="gray.800">
                              {doc.title || 'Document'}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {doc.type && doc.type !== 'document' && <span>{doc.type} • </span>}
                              Status: {doc.status || 'Unknown'}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
              </VStack>
            )}
          </DialogBody>
          <DialogFooter borderTop="1px" borderColor="gray.200" pt="3">
            <Button 
              onClick={onContextClose}
              variant="outline"
              size="sm"
            >
              Close
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}
