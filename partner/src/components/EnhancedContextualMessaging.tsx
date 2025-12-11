'use client';
/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  VStack,
  HStack,
  Textarea,
  Avatar,
  Flex,
  Icon,
  Spinner,
  useDisclosure,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import { Button, Typography, Tag } from '@/lib/mukuruImports';
import { useState, useEffect, useRef } from 'react';
import {
  FiSend,
  FiPaperclip,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiTrash2,
  FiStar,
  FiMessageSquare,
  FiFileText,
  FiImage,
  FiVideo,
  FiFile,
  FiMapPin,
  FiFolder,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

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
  userApplications?: Array<{
    id?: string;
    caseId: string;
    type?: string;
    status?: string;
    applicantFirstName?: string;
    applicantLastName?: string;
  }>;
  onApplicationSelect?: (applicationId: string) => void;
  loadingApplications?: boolean;
}

export function EnhancedContextualMessaging({
  conversations,
  messages,
  currentConversationId,
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
  loadingContext = false,
  userApplications = [],
  onApplicationSelect,
  loadingApplications = false,
}: EnhancedContextualMessagingProps & {
  loadingContext?: boolean;
  userApplications?: Array<{
    id?: string;
    caseId: string;
    type?: string;
    status?: string;
    applicantFirstName?: string;
    applicantLastName?: string;
  }>;
  onApplicationSelect?: (applicationId: string) => void;
  loadingApplications?: boolean;
}) {
  const [newMessage, setNewMessage] = useState('');
  const [selectedContext, setSelectedContext] = useState<any>(null);
  // Search and filter state not currently used
  // const [searchTerm, setSearchTerm] = useState('');
  // const [filterPriority, setFilterPriority] = useState<string>('all');
  // const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSending, setIsSending] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<ContextualMessage | null>(null);

  const {
    open: isContextOpen,
    onOpen: onContextOpen,
    onClose: onContextClose,
  } = useDisclosure();
  // Attachment disclosure not currently used
  // const {
  //   open: isAttachmentOpen,
  //   onOpen: onAttachmentOpen,
  //   onClose: onAttachmentClose,
  // } = useDisclosure();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [banner, setBanner] = useState<{
    status: 'success' | 'error';
    message: string;
  } | null>(null);

  const currentConversation = conversations.find((c) => c.id === currentConversationId);
  // Filter messages by conversation/thread, sort by timestamp (oldest first for display)
  const currentMessages = messages
    .filter(
      (m) =>
        !currentConversationId ||
        m.applicationId === currentApplicationId ||
        m.applicationId === currentConversation?.applicationId
    )
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    const timer = setTimeout(() => {
      // Try both methods for reliable scrolling
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [currentMessages, currentMessages.length]);
  
  // Also scroll on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [currentConversationId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedAttachments.length === 0) return;

    // Check if we have an application ID - if not, try to find it from current conversation
    let applicationIdToUse = currentApplicationId;

    if (!applicationIdToUse && currentConversation) {
      applicationIdToUse = currentConversation.applicationId;
      console.info(
        '[EnhancedMessaging] Using applicationId from conversation:',
        applicationIdToUse
      );
    }

    if (!applicationIdToUse) {
      setBanner({
        status: 'error',
        message:
          userApplications.length === 0
            ? 'No applications found. Please submit an application first before sending messages.'
            : 'Please select an application from the dropdown above to send a message.',
      });
      setTimeout(() => setBanner(null), 5000);
      return;
    }

    setIsSending(true);
    try {
      // Pass the applicationId explicitly if we resolved it from conversation
      await onSendMessage(newMessage, selectedContext, selectedAttachments);
      setNewMessage('');
      setSelectedContext(null);
      setSelectedAttachments([]);
      setReplyToMessage(null);
    } catch (error) {
      console.error('[EnhancedMessaging] Failed to send message:', error);
      setBanner({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to send message',
      });
      setTimeout(() => setBanner(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (event?: React.ChangeEvent<HTMLInputElement>) => {
    if (!event?.target) return;
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
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
      title: doc.name || 'Document',
      type: doc.type || 'document',
      status: doc.status || 'unknown',
      url: doc.url,
    }));
  };

  // Helper functions not currently used
  // const getPriorityColor = (priority: string) => {
  //   switch (priority) {
  //     case 'urgent':
  //       return 'red';
  //     case 'high':
  //       return 'orange';
  //     case 'normal':
  //       return 'blue';
  //     case 'low':
  //       return 'gray';
  //     default:
  //       return 'gray';
  //   }
  // };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'sent':
  //       return 'blue';
  //     case 'delivered':
  //       return 'green';
  //     case 'read':
  //       return 'green';
  //     default:
  //       return 'gray';
  //   }
  // };

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
    <Box h="100%" maxH="100%" display="flex" flexDirection="column" overflow="hidden" bg="#F9FAFB">
      {/* Header */}
      <Box
        px="3"
        py="2.5"
        borderBottom="1px solid #E5E7EB"
        bg="white"
        flexShrink={0}
      >
        <Flex justify="space-between" align="center" gap="3">
          <VStack align="start" gap="1" flex="1" minW="0">
            <Typography fontSize="xs" fontWeight="semibold" color="#1F2937">
              Application Communication
            </Typography>
            {onApplicationSelect ? (
              <Box maxW="340px" width="100%">
                {loadingApplications ? (
                  <HStack gap="2">
                    <Spinner size="xs" color="#00A5A3" />
                    <Typography fontSize="xs" color="#6B7280">
                      Loading applications...
                    </Typography>
                  </HStack>
                ) : userApplications.length > 0 ? (
                  <select
                    value={currentApplicationId || ''}
                    onChange={(e) => {
                      if (e.target.value && onApplicationSelect) {
                        onApplicationSelect(e.target.value);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: 'white',
                      color: '#374151',
                      fontSize: '13px',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="" disabled>
                      Select Application
                    </option>
                    {userApplications.map((app) => {
                      const appId = app.id || app.caseId;
                      const displayText = `${app.caseId}${app.applicantFirstName ? ` - ${app.applicantFirstName} ${app.applicantLastName || ''}`.trim() : ''}${app.status ? ` (${app.status})` : ''}`;
                      return (
                        <option key={appId} value={appId}>
                          {displayText}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <Box
                    p="2"
                    bg="#FEF3C7"
                    borderRadius="8px"
                    border="1px solid #FCD34D"
                  >
                    <Typography fontSize="xs" color="#92400E" fontWeight="medium">
                      No applications found. Please submit an application first.
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography fontSize="xs" color="#6B7280">
                {currentApplicationId
                  ? `Application ${currentApplicationId.slice(0, 8)}...`
                  : 'No application selected'}
              </Typography>
            )}
          </VStack>

          {/* Unread Badge */}
          {currentMessages.filter((m) => !m.isRead && m.senderType !== currentUser.type).length > 0 && (
            <Box
              px="3"
              py="1.5"
              borderRadius="full"
              bg="#00A5A3"
              display="flex"
              alignItems="center"
              gap="1.5"
            >
              <Typography fontSize="xs" fontWeight="semibold" color="white">
                {currentMessages.filter((m) => !m.isRead && m.senderType !== currentUser.type).length} Unread
              </Typography>
            </Box>
          )}
        </Flex>

        {/* Context Selection */}
        <Flex mt="2" gap="2" align="center">
          <Typography fontSize="2xs" color="#6B7280" fontWeight="medium">
            Reference:
          </Typography>
          <Box
            as="button"
            px="2"
            py="1"
            borderRadius="5px"
            bg="#F3F4F6"
            border="1px solid #E5E7EB"
            display="flex"
            alignItems="center"
            gap="1"
            cursor="pointer"
            _hover={{ bg: '#E5E7EB' }}
            onClick={onContextOpen}
          >
            <Icon as={FiMapPin} boxSize="2.5" color="#6B7280" />
            <Typography fontSize="2xs" color="#374151" fontWeight="medium">
              {selectedContext ? selectedContext.title : 'Select Context'}
            </Typography>
          </Box>
          {selectedContext && (
            <Box px="1.5" py="0.5" borderRadius="4px" bg="#DBEAFE">
              <Typography fontSize="2xs" color="#1D4ED8" fontWeight="medium">
                {selectedContext.type}
              </Typography>
            </Box>
          )}
        </Flex>
      </Box>

      {/* Banner */}
      {banner && (
        <Box
          p="2"
          bg={banner.status === 'success' ? 'success.50' : 'error.50'}
          border="1px"
          borderColor={banner.status === 'success' ? 'success.200' : 'error.200'}
        >
          <Typography
            fontSize="xs"
            color={banner.status === 'success' ? 'success.700' : 'error.700'}
          >
            {banner.message}
          </Typography>
        </Box>
      )}

      {/* Messages */}
      <Box 
        ref={messagesContainerRef}
        flex="1" 
        overflowY="auto" 
        overflowX="hidden"
        px="3"
        py="2" 
        bg="#F9FAFB"
        minH="0"
      >
        <VStack gap="3" align="stretch">
          <AnimatePresence>
            {currentMessages.length === 0 ? (
              <Flex 
                direction="column" 
                align="center" 
                justify="center" 
                py="12"
                px="4"
              >
                <Box
                  w="48px"
                  h="48px"
                  borderRadius="12px"
                  bg="#E5E7EB"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mb="3"
                >
                  <Icon as={FiMessageSquare} boxSize="5" color="#9CA3AF" />
                </Box>
                <Typography fontSize="sm" color="#374151" fontWeight="medium">
                  No messages yet
                </Typography>
                <Typography fontSize="xs" color="#9CA3AF" mt="1">
                  Start the conversation below
                </Typography>
              </Flex>
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
                    const isFromAdmin = message.senderType === 'admin';
                    const isFromCurrentUser = message.senderType === 'partner';
                    const hasContent = message.content && message.content.trim().length > 0;

                    return (
                      <Flex
                        justify={isFromCurrentUser ? 'flex-end' : 'flex-start'}
                        gap="2"
                        align="flex-start"
                        w="100%"
                        px="1"
                      >
                        {/* Left Avatar for admin/other messages */}
                        {!isFromCurrentUser && (
                          <Box
                            w="28px"
                            h="28px"
                            borderRadius="8px"
                            bg={isFromAdmin ? '#F05423' : '#00A5A3'}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                            boxShadow="0 1px 3px rgba(0,0,0,0.12)"
                          >
                            <Typography fontSize="xs" fontWeight="bold" color="white">
                              {(message.senderName || 'U').charAt(0).toUpperCase()}
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Message Bubble */}
                        <Box
                          maxW="65%"
                          minW="120px"
                          p="3"
                          bg={isFromCurrentUser ? '#00A5A3' : 'white'}
                          borderRadius="12px"
                          borderTopLeftRadius={!isFromCurrentUser ? '4px' : '12px'}
                          borderTopRightRadius={isFromCurrentUser ? '4px' : '12px'}
                          boxShadow="0 1px 4px rgba(0, 0, 0, 0.08)"
                          border={isFromCurrentUser ? 'none' : '1px solid #E5E7EB'}
                        >
                          {/* Header: Sender + Time + Status */}
                          <Flex justify="space-between" align="center" mb="1.5" gap="3">
                            <Typography
                              fontSize="xs"
                              fontWeight="semibold"
                              color={isFromCurrentUser ? 'white' : '#1F2937'}
                            >
                              {message.senderName || 'User'}
                            </Typography>
                            <HStack gap="2" align="center">
                              <Typography
                                fontSize="2xs"
                                color={isFromCurrentUser ? 'rgba(255,255,255,0.75)' : '#9CA3AF'}
                              >
                                {(() => {
                                  try {
                                    const date = new Date(message.timestamp);
                                    if (isNaN(date.getTime())) return 'Just now';
                                    return date.toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    });
                                  } catch {
                                    return 'Just now';
                                  }
                                })()}
                              </Typography>
                              <Box
                                px="1.5"
                                py="0.5"
                                borderRadius="4px"
                                bg={isFromCurrentUser ? 'rgba(255,255,255,0.2)' : '#F3F4F6'}
                              >
                                <Typography
                                  fontSize="2xs"
                                  fontWeight="medium"
                                  color={isFromCurrentUser ? 'white' : '#6B7280'}
                                >
                                  {message.isRead ? 'Read' : 'Sent'}
                                </Typography>
                              </Box>
                            </HStack>
                          </Flex>

                          {/* Message Content */}
                          {hasContent && (
                            <Typography
                              fontSize="sm"
                              lineHeight="1.5"
                              color={isFromCurrentUser ? 'white' : '#374151'}
                              whiteSpace="pre-wrap"
                              wordBreak="break-word"
                            >
                              {message.content}
                            </Typography>
                          )}

                          {/* Actions Row */}
                          <Flex
                            mt="2"
                            pt="2"
                            borderTop="1px solid"
                            borderColor={isFromCurrentUser ? 'rgba(255,255,255,0.2)' : '#E5E7EB'}
                            gap="3"
                          >
                            <Box
                              as="button"
                              display="flex"
                              alignItems="center"
                              gap="1"
                              fontSize="xs"
                              color={isFromCurrentUser ? 'rgba(255,255,255,0.8)' : '#6B7280'}
                              cursor="pointer"
                              _hover={{ color: isFromCurrentUser ? 'white' : '#374151' }}
                              onClick={() => setReplyToMessage(message)}
                            >
                              <Icon as={FiCornerUpLeft} boxSize="3" />
                              Reply
                            </Box>
                            <Box
                              as="button"
                              display="flex"
                              alignItems="center"
                              gap="1"
                              fontSize="xs"
                              color={isFromCurrentUser ? 'rgba(255,255,255,0.8)' : (message.isStarred ? '#F59E0B' : '#6B7280')}
                              cursor="pointer"
                              _hover={{ color: isFromCurrentUser ? 'white' : '#F59E0B' }}
                              onClick={() => onStarMessage(message.id)}
                            >
                              <Icon as={FiStar} boxSize="3" />
                              Star
                            </Box>
                            <Box
                              as="button"
                              display="flex"
                              alignItems="center"
                              gap="1"
                              fontSize="xs"
                              color={isFromCurrentUser ? 'rgba(255,255,255,0.8)' : '#6B7280'}
                              cursor="pointer"
                              _hover={{ color: isFromCurrentUser ? 'white' : '#374151' }}
                            >
                              <Icon as={FiCornerUpRight} boxSize="3" />
                              Forward
                            </Box>
                          </Flex>
                        </Box>

                        {/* Right Avatar for current user messages */}
                        {isFromCurrentUser && (
                          <Box
                            w="28px"
                            h="28px"
                            borderRadius="8px"
                            bg="#00A5A3"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                            boxShadow="0 1px 3px rgba(0,0,0,0.12)"
                          >
                            <Typography fontSize="xs" fontWeight="bold" color="white">
                              {(message.senderName || 'U').charAt(0).toUpperCase()}
                            </Typography>
                          </Box>
                        )}
                      </Flex>
                    );
                  })()}
                </MotionBox>
              ))
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} style={{ height: '20px', flexShrink: 0 }} />
        </VStack>
      </Box>

      {/* Reply Indicator */}
      {replyToMessage && (
        <Box p="2" bg="info.50" borderTop="1px" borderColor="info.200">
          <HStack justify="space-between">
            <HStack gap="1.5">
              <Icon as={FiCornerUpLeft} color="mukuru.teal" boxSize="3" />
              <Typography fontSize="xs" color="mukuru.text.primary">
                Replying to {replyToMessage.senderName}
              </Typography>
            </HStack>
            <Button size="sm" variant="ghost" onClick={() => setReplyToMessage(null)}>
              Cancel
            </Button>
          </HStack>
        </Box>
      )}

      {/* Message Input */}
      <Box
        px="3"
        py="3"
        bg="white"
        borderTop="1px solid #E5E7EB"
        flexShrink={0}
        boxShadow="0 -2px 8px rgba(0,0,0,0.04)"
      >
        <VStack gap="2" align="stretch">
          {/* Attachments */}
          {selectedAttachments.length > 0 && (
            <Box
              p="1.5"
              bg="mukuru.background.light"
              borderRadius="md"
              border="1px"
              borderColor="mukuru.grey.light"
            >
              <VStack gap="1" align="stretch">
                <Typography
                  fontSize="2xs"
                  fontWeight="semibold"
                  color="mukuru.text.primary"
                >
                  Attachments ({selectedAttachments.length})
                </Typography>
                {selectedAttachments.map((file, index) => (
                  <HStack
                    key={index}
                    gap="1.5"
                    justify="space-between"
                    p="1"
                    bg="mukuru.cards.white"
                    borderRadius="sm"
                  >
                    <HStack gap="1.5" flex="1" minW="0">
                      <Icon
                        as={getFileIcon(file.type)}
                        color="mukuru.grey.medium"
                        boxSize="3"
                      />
                      <VStack align="start" gap="0" flex="1" minW="0">
                        <Typography
                          fontSize="2xs"
                          color="mukuru.text.primary"
                          fontWeight="medium"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                        >
                          {file.name}
                        </Typography>
                        <Typography fontSize="2xs" color="mukuru.grey.medium">
                          {formatFileSize(file.size)}
                        </Typography>
                      </VStack>
                    </HStack>
                    <Box
                      as="button"
                      p="1"
                      borderRadius="4px"
                      color="#9CA3AF"
                      cursor="pointer"
                      _hover={{ bg: '#FEE2E2', color: '#EF4444' }}
                      onClick={() => removeAttachment(index)}
                    >
                      <Icon as={FiTrash2} boxSize="3" />
                    </Box>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {/* Input Area */}
          <Flex gap="2" align="center">
            <Box
              as="button"
              display="flex"
              alignItems="center"
              p="1.5"
              borderRadius="6px"
              color="#6B7280"
              cursor="pointer"
              _hover={{ bg: '#F3F4F6', color: '#374151' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon as={FiPaperclip} boxSize="4" />
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={1}
              resize="none"
              bg="#F9FAFB"
              borderColor="#E5E7EB"
              color="#374151"
              flex="1"
              _focus={{
                borderColor: '#00A5A3',
                boxShadow: '0 0 0 1px rgba(0, 165, 163, 0.2)',
                bg: 'white',
              }}
              _hover={{ borderColor: '#D1D5DB' }}
              _placeholder={{ color: '#9CA3AF' }}
              fontSize="xs"
              py="2"
              px="3"
              borderRadius="8px"
              minH="36px"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={handleSendMessage}
              loading={isSending}
              disabled={
                (!newMessage.trim() && selectedAttachments.length === 0) ||
                !currentApplicationId
              }
              fontWeight="medium"
              h="36px"
              px="4"
              fontSize="xs"
              title={
                !currentApplicationId
                  ? 'Please select an application first'
                  : undefined
              }
              className="mukuru-primary-button"
            >
              <Icon as={FiSend} mr="1" boxSize="3" />
              Send
            </Button>
          </Flex>
        </VStack>
      </Box>

      {/* Context Selection Dialog (Chakra v3) */}
      <DialogRoot
        open={isContextOpen}
        onOpenChange={(e) => (e.open ? onContextOpen() : onContextClose())}
        modal={true}
      >
        <DialogBackdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
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
          borderColor="mukuru.grey.light"
        >
          <DialogHeader borderBottom="1px" borderColor="mukuru.grey.light" pb="3">
            <DialogTitle fontSize="lg" fontWeight="semibold" color="mukuru.text.primary">
              Select Context Reference
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            {loadingContext ? (
              <Box p="8" textAlign="center">
                <Spinner size="md" color="mukuru.teal" />
                <Typography fontSize="sm" color="mukuru.text.primary" mt="3">
                  Loading context...
                </Typography>
              </Box>
            ) : (
              <VStack gap="4" align="stretch">
                {/* Application Sections */}
                <Box>
                  <Typography
                    fontSize="sm"
                    fontWeight="semibold"
                    color="mukuru.text.primary"
                    mb="2"
                  >
                    Application Sections
                  </Typography>
                  {getContextualSections().length === 0 ? (
                    <Box
                      p="4"
                      textAlign="center"
                      bg="mukuru.background.light"
                      borderRadius="md"
                    >
                      <Typography fontSize="xs" color="mukuru.grey.medium">
                        No sections available
                      </Typography>
                    </Box>
                  ) : (
                    <VStack gap="2" align="stretch">
                      {getContextualSections().map((section) => (
                        <Box
                          key={section.id}
                          p="2.5"
                          border="1px"
                          borderColor="mukuru.grey.light"
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{
                            bg: 'mukuru.state.hover',
                            borderColor: 'mukuru.teal',
                          }}
                          transition="all 0.2s"
                          onClick={() => {
                            setSelectedContext(section);
                            onContextClose();
                          }}
                        >
                          <HStack gap="2">
                            <Icon as={FiFolder} color="info.500" boxSize="4" />
                            <VStack align="start" gap="0" flex="1">
                              <Typography
                                fontSize="sm"
                                fontWeight="medium"
                                color="mukuru.text.primary"
                              >
                                {section.title}
                              </Typography>
                              <Typography fontSize="xs" color="mukuru.grey.medium">
                                {section.fields?.length || 0} field
                                {section.fields?.length !== 1 ? 's' : ''}
                              </Typography>
                            </VStack>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>

                <Box h="1px" bg="mukuru.grey.light" />

                {/* Application Documents */}
                <Box>
                  <Typography
                    fontSize="sm"
                    fontWeight="semibold"
                    color="mukuru.text.primary"
                    mb="2"
                  >
                    Application Documents
                  </Typography>
                  {getContextualDocuments().length === 0 ? (
                    <Box
                      p="4"
                      textAlign="center"
                      bg="mukuru.background.light"
                      borderRadius="md"
                    >
                      <Typography fontSize="xs" color="mukuru.grey.medium">
                        No documents available
                      </Typography>
                    </Box>
                  ) : (
                    <VStack gap="2" align="stretch">
                      {getContextualDocuments().map((doc) => (
                        <Box
                          key={doc.id}
                          p="2.5"
                          border="1px"
                          borderColor="mukuru.grey.light"
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{
                            bg: 'mukuru.state.hover',
                            borderColor: 'mukuru.text.success',
                          }}
                          transition="all 0.2s"
                          onClick={() => {
                            setSelectedContext(doc);
                            onContextClose();
                          }}
                        >
                          <HStack gap="2">
                            <Icon
                              as={FiFileText}
                              color="mukuru.text.success"
                              boxSize="4"
                            />
                            <VStack align="start" gap="0" flex="1">
                              <Typography
                                fontSize="sm"
                                fontWeight="medium"
                                color="mukuru.text.primary"
                              >
                                {doc.title || 'Document'}
                              </Typography>
                              <Typography fontSize="xs" color="mukuru.text.primary">
                                {doc.type && doc.type !== 'document' && (
                                  <span>{doc.type} • </span>
                                )}
                                Status: {doc.status || 'Unknown'}
                              </Typography>
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
          <DialogFooter borderTop="1px" borderColor="mukuru.grey.light" pt="3">
            <Button onClick={onContextClose} variant="ghost" size="sm">
              <Typography color="mukuru.text.primary" fontSize="sm" fontWeight="medium">
                Close
              </Typography>
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}
