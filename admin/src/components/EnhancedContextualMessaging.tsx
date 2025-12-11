/* eslint-disable security/detect-object-injection */
'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Textarea,
  Badge,
  Icon,
  Image,
  useDisclosure,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import {
  FiSend,
  FiPaperclip,
  FiCornerUpLeft,
  FiDownload,
  FiX,
  FiTrash2,
  FiStar,
  FiFileText,
  FiImage,
  FiVideo,
  FiFile,
  FiMapPin,
  FiFolder,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Use motion.create() instead of deprecated motion()
const MotionBox = motion.create(Box);

export interface ContextualMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'admin' | 'system';
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
  customerId: string;
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
  onSendMessage: (
    content: string,
    context?: Record<string, unknown>,
    attachments?: File[]
  ) => Promise<void>;
  onReplyToMessage: (messageId: string, content: string) => Promise<void>;
  onForwardMessage: (messageId: string, toConversationId: string) => Promise<void>;
  onStarMessage: (messageId: string) => Promise<void>;
  onArchiveConversation: (conversationId: string) => Promise<void>;
  onAssignConversation: (conversationId: string, adminId: string) => Promise<void>;
  onTagConversation: (conversationId: string, tags: string[]) => Promise<void>;
  currentUser: {
    id: string;
    name: string;
    type: 'customer' | 'admin';
    avatar?: string;
  };
  applicationSections?: Array<{
    id: string;
    title: string;
    fields: Array<{
      id: string;
      label: string;
      value?: unknown;
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
  conversations: _conversations,
  messages,
  currentConversationId: _currentConversationId,
  currentApplicationId,
  onSendMessage,
  onReplyToMessage: _onReplyToMessage,
  onForwardMessage: _onForwardMessage,
  onStarMessage,
  onArchiveConversation: _onArchiveConversation,
  onAssignConversation: _onAssignConversation,
  onTagConversation: _onTagConversation,
  currentUser,
  applicationSections = [],
  applicationDocuments = [],
}: EnhancedContextualMessagingProps) {
  const [newMessage, setNewMessage] = useState('');
  const [selectedContext, setSelectedContext] = useState<unknown>(null);
  const [isSending, setIsSending] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<ContextualMessage | null>(null);

  const {
    open: isContextOpen,
    onOpen: onContextOpen,
    onClose: onContextClose,
  } = useDisclosure();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const toast = useToast(); // Removed - not available in Chakra UI v3

  const currentMessages = messages.filter(
    (m) => m.applicationId === currentApplicationId
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedAttachments.length === 0) return;

    setIsSending(true);
    try {
      await onSendMessage(
        newMessage,
        selectedContext as Record<string, unknown> | undefined,
        selectedAttachments
      );
      setNewMessage('');
      setSelectedContext(null);
      setSelectedAttachments([]);
      setReplyToMessage(null);
    } catch {
      console.info({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (event?: React.ChangeEvent<HTMLInputElement>) => {
    if (!event?.target?.files) return;
    const files = Array.from(event.target.files);
    setSelectedAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getContextualSections = () => {
    return applicationSections.map((section) => ({
      id: section.id,
      title: section.title,
      type: 'section',
      fields: section.fields,
    }));
  };

  const getContextualDocuments = () => {
    return applicationDocuments.map((doc) => ({
      id: doc.id,
      title: doc.name,
      type: 'document',
      status: doc.status,
      url: doc.url,
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'red';
      case 'high':
        return 'orange';
      case 'normal':
        return 'blue';
      case 'low':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'blue';
      case 'delivered':
        return 'green';
      case 'read':
        return 'green';
      default:
        return 'gray';
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
    <Box height="100%" display="flex" flexDirection="column">
      {/* Header */}
      <Box p="4" borderBottom="1px" borderColor="gray.200" bg="white">
        <VStack gap="3" align="stretch">
          <HStack justify="space-between">
            <VStack align="start" gap="1">
              <Text fontSize="lg" fontWeight="semibold" color="mukuru.text.primary">
                Application Communication
              </Text>
              <Text fontSize="sm" color="mukuru.text.primary">
                Contextual messaging for application {currentApplicationId}
              </Text>
            </VStack>

            <HStack gap="2">
              <Badge colorScheme="blue" variant="subtle">
                {
                  currentMessages.filter(
                    (m) => !m.isRead && m.senderType !== currentUser.type
                  ).length
                }{' '}
                Unread
              </Badge>
            </HStack>
          </HStack>

          {/* Context Selection */}
          <HStack gap="2" wrap="wrap">
            <Text fontSize="sm" color="mukuru.text.primary">
              Reference:
            </Text>
            <Button size="sm" variant="outline" onClick={onContextOpen}>
              <Icon as={FiMapPin} mr="2" />
              {selectedContext &&
              typeof selectedContext === 'object' &&
              selectedContext !== null &&
              'title' in selectedContext
                ? String((selectedContext as Record<string, unknown>).title)
                : 'Select Context'}
            </Button>
            {selectedContext &&
            typeof selectedContext === 'object' &&
            selectedContext !== null &&
            'type' in selectedContext ? (
              <Badge colorScheme="blue" variant="subtle">
                {String((selectedContext as Record<string, unknown>).type || '')}
              </Badge>
            ) : null}
          </HStack>
        </VStack>
      </Box>

      {/* Messages */}
      <Box flex="1" overflowY="auto" p="4" bg="mukuru.background.light">
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
                <Box
                  p="4"
                  bg="white"
                  borderRadius="lg"
                  boxShadow="sm"
                  border="1px"
                  borderColor="gray.200"
                  ml={message.senderType === 'admin' ? '20%' : '0'}
                  mr={message.senderType !== 'admin' ? '20%' : '0'}
                >
                  <VStack gap="3" align="stretch">
                    {/* Message Header */}
                    <HStack justify="space-between" align="start">
                      <HStack gap="2">
                        <Box
                          width="32px"
                          height="32px"
                          borderRadius="full"
                          bg="mukuru.teal"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          overflow="hidden"
                        >
                          {message.senderAvatar ? (
                            <Image
                              src={message.senderAvatar}
                              alt={message.senderName}
                              width="100%"
                              height="100%"
                              objectFit="cover"
                            />
                          ) : (
                            <Text fontSize="xs" color="white" fontWeight="bold">
                              {message.senderName.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </Box>
                        <VStack align="start" gap="0">
                          <Text fontSize="sm" fontWeight="medium" color="gray.800">
                            {message.senderName}
                          </Text>
                          <Text fontSize="xs" color="mukuru.grey.medium">
                            {new Date(message.timestamp).toLocaleString()}
                          </Text>
                        </VStack>
                      </HStack>

                      <HStack gap="1">
                        <Badge
                          colorScheme={getPriorityColor(message.priority)}
                          variant="subtle"
                          fontSize="xs"
                        >
                          {message.priority}
                        </Badge>
                        <Badge
                          colorScheme={getStatusColor(message.status)}
                          variant="subtle"
                          fontSize="xs"
                        >
                          {message.status}
                        </Badge>
                        {message.isStarred && (
                          <Icon as={FiStar} color="mukuru.text.alert" boxSize="3" />
                        )}
                      </HStack>
                    </HStack>

                    {/* Context Reference */}
                    {message.context && (
                      <Box
                        p="2"
                        bg="mukuru.teal"
                        borderRadius="md"
                        border="1px"
                        borderColor="blue.200"
                      >
                        <HStack gap="2">
                          <Icon as={FiMapPin} color="mukuru.teal" boxSize="3" />
                          <Text fontSize="xs" color="mukuru.teal">
                            {message.context.sectionTitle &&
                              `Section: ${message.context.sectionTitle}`}
                            {message.context.fieldLabel &&
                              ` • Field: ${message.context.fieldLabel}`}
                            {message.context.documentName &&
                              ` • Document: ${message.context.documentName}`}
                          </Text>
                        </HStack>
                      </Box>
                    )}

                    {/* Message Content */}
                    <Text fontSize="sm" color="mukuru.text.primary" whiteSpace="pre-wrap">
                      {message.content}
                    </Text>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <VStack gap="2" align="stretch">
                        <Text fontSize="xs" color="gray.500">
                          Attachments:
                        </Text>
                        {message.attachments.map((attachment) => (
                          <HStack
                            key={attachment.id}
                            gap="2"
                            p="2"
                            bg="mukuru.background.light"
                            borderRadius="md"
                          >
                            <Icon
                              as={getFileIcon(attachment.type)}
                              color="mukuru.grey.medium"
                              boxSize="4"
                            />
                            <VStack align="start" gap="0" flex="1">
                              <Text fontSize="xs" color="mukuru.text.primary">
                                {attachment.name}
                              </Text>
                              <Text fontSize="xs" color="mukuru.grey.medium">
                                {attachment.size}
                              </Text>
                            </VStack>
                            <Button size="xs" variant="ghost">
                              <Icon as={FiDownload} mr="1" />
                              Download
                            </Button>
                          </HStack>
                        ))}
                      </VStack>
                    )}

                    {/* Message Actions */}
                    <HStack justify="space-between">
                      <HStack gap="1">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setReplyToMessage(message)}
                        >
                          <Icon as={FiCornerUpLeft} mr="1" />
                          Reply
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => onStarMessage(message.id)}
                        >
                          <Icon as={message.isStarred ? FiStar : FiStar} mr="1" />
                          Star
                        </Button>
                        <Button size="xs" variant="ghost">
                          <Icon as={FiCornerUpLeft} mr="1" />
                          Forward
                        </Button>
                      </HStack>

                      {message.tags && message.tags.length > 0 && (
                        <HStack gap="1">
                          {message.tags.map((tag) => (
                            <Badge
                              key={tag}
                              colorScheme="gray"
                              variant="subtle"
                              fontSize="xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </HStack>
                      )}
                    </HStack>
                  </VStack>
                </Box>
              </MotionBox>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {/* Reply Indicator */}
      {replyToMessage && (
        <Box p="3" bg="mukuru.teal" borderTop="1px" borderColor="mukuru.teal">
          <HStack justify="space-between">
            <HStack gap="2">
              <Icon as={FiCornerUpLeft} color="mukuru.teal" />
              <Text fontSize="sm" color="mukuru.teal">
                Replying to {replyToMessage.senderName}
              </Text>
            </HStack>
            <Button size="xs" variant="ghost" onClick={() => setReplyToMessage(null)}>
              Cancel
            </Button>
          </HStack>
        </Box>
      )}

      {/* Message Input */}
      <Box p="4" bg="white" borderTop="1px" borderColor="gray.200">
        <VStack gap="3" align="stretch">
          {/* Attachments */}
          {selectedAttachments.length > 0 && (
            <Box
              p="3"
              bg="mukuru.background.light"
              borderRadius="md"
              border="1px"
              borderColor="mukuru.grey.light"
            >
              <VStack gap="2" align="stretch">
                <Text fontSize="sm" fontWeight="medium" color="mukuru.text.primary">
                  Attachments ({selectedAttachments.length})
                </Text>
                {selectedAttachments.map((file, index) => (
                  <HStack key={index} gap="2" justify="space-between">
                    <HStack gap="2">
                      <Icon
                        as={getFileIcon(file.type)}
                        color="mukuru.grey.medium"
                        boxSize="4"
                      />
                      <VStack align="start" gap="0">
                        <Text fontSize="xs" color="mukuru.text.primary">
                          {file.name}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {formatFileSize(file.size)}
                        </Text>
                      </VStack>
                    </HStack>
                    <Button
                      size="xs"
                      variant="ghost"
                      color="red.500"
                      onClick={() => removeAttachment(index)}
                    >
                      <Icon as={FiTrash2} />
                    </Button>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {/* Input Area */}
          <HStack gap="3" align="end">
            <VStack gap="2" align="stretch" flex="1">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                resize="none"
                color="gray.900"
                _placeholder={{ color: 'gray.400' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />

              <HStack justify="space-between">
                <HStack gap="2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon as={FiPaperclip} mr="2" />
                    Attach
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </HStack>

                <HStack gap="2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNewMessage('')}
                    disabled={!newMessage.trim()}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={handleSendMessage}
                    loading={isSending}
                    disabled={!newMessage.trim() && selectedAttachments.length === 0}
                  >
                    <Icon as={FiSend} mr="2" />
                    Send
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </Box>

      {/* Context Selection Modal */}
      {isContextOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={onContextClose}
        >
          <Box
            bg="white"
            borderRadius="md"
            maxW="lg"
            w="90%"
            maxH="90vh"
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Box p="4" borderBottom="1px" borderColor="gray.200">
              <HStack justify="space-between">
                <Text fontWeight="bold" fontSize="lg">
                  Select Context Reference
                </Text>
                <Button variant="ghost" size="sm" onClick={onContextClose}>
                  <Icon as={FiX} />
                </Button>
              </HStack>
            </Box>
            <Box p="4">
              <VStack gap="4" align="stretch">
                {/* Application Sections */}
                <Box>
                  <Text fontSize="md" fontWeight="medium" color="gray.800" mb="3">
                    Application Sections
                  </Text>
                  <VStack gap="2" align="stretch">
                    {getContextualSections().map((section) => (
                      <Box
                        key={section.id}
                        p="3"
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        cursor="pointer"
                        _hover={{ bg: 'gray.50' }}
                        onClick={() => {
                          setSelectedContext(section);
                          onContextClose();
                        }}
                      >
                        <HStack gap="2">
                          <Icon as={FiFolder} color="blue.500" />
                          <VStack align="start" gap="0">
                            <Text fontSize="sm" fontWeight="medium" color="gray.800">
                              {section.title}
                            </Text>
                            <Text fontSize="xs" color="mukuru.grey.medium">
                              {section.fields.length} fields
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>

                <Box height="1px" bg="gray.200" my="4" />

                {/* Application Documents */}
                <Box>
                  <Text fontSize="md" fontWeight="medium" color="gray.800" mb="3">
                    Application Documents
                  </Text>
                  <VStack gap="2" align="stretch">
                    {getContextualDocuments().map((doc) => (
                      <Box
                        key={doc.id}
                        p="3"
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        cursor="pointer"
                        _hover={{ bg: 'gray.50' }}
                        onClick={() => {
                          setSelectedContext(doc);
                          onContextClose();
                        }}
                      >
                        <HStack gap="2">
                          <Icon as={FiFileText} color="green.500" />
                          <VStack align="start" gap="0">
                            <Text fontSize="sm" fontWeight="medium" color="gray.800">
                              {doc.title}
                            </Text>
                            <Text fontSize="xs" color="mukuru.grey.medium">
                              Status: {doc.status}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </Box>
            <Box p="4" borderTop="1px" borderColor="gray.200">
              <HStack justify="flex-end">
                <Button variant="outline" onClick={onContextClose}>
                  Close
                </Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
