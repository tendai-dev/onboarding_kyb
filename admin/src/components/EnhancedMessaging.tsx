'use client';

import {
  Box,
  VStack,
  HStack,
  Textarea,
  Flex,
  Icon,
  Menu,
  Image,
  useDisclosure,
  SimpleGrid,
} from '@chakra-ui/react';
// Import components directly from Mukuru package
import {
  Search,
  Typography,
  Button,
  Tag,
  Checkbox,
  Dropdown,
  Tooltip,
  Modal,
} from '@mukuru/mukuru-react-components';
import { useState, useEffect, useRef } from 'react';
import {
  FiSend,
  FiPaperclip,
  FiMoreVertical,
  FiCornerUpLeft,
  FiDownload,
  FiTrash2,
  FiStar,
  FiFileText,
  FiImage,
  FiVideo,
  FiFile,
  FiCheckCircle,
  FiCheck,
  FiClock,
  FiUser,
  FiArchive,
  FiFlag,
  FiX,
  FiTag,
  FiMessageSquare,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Use motion.create() instead of deprecated motion()
const MotionBox = motion.create(Box);

export interface Message {
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
}

export interface Conversation {
  id: string;
  applicationId: string;
  customerName: string;
  customerEmail: string;
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
    type: 'customer' | 'admin';
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
  onAssignConversation: _onAssignConversation,
  onTagConversation: _onTagConversation,
  currentUser,
}: EnhancedMessagingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    null
  );
  const [newMessage, setNewMessage] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [forwardToConversation, setForwardToConversation] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    open: isReplyOpen,
    onOpen: onReplyOpen,
    onClose: onReplyClose,
  } = useDisclosure();
  const {
    open: isForwardOpen,
    onOpen: onForwardOpen,
    onClose: onForwardClose,
  } = useDisclosure();
  const {
    open: isAssignOpen,
    onOpen: onAssignOpen,
    onClose: onAssignClose,
  } = useDisclosure();
  const { open: isTagOpen, onOpen: onTagOpen, onClose: onTagClose } = useDisclosure();

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.applicationId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = filterPriority === 'all' || conv.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Filter messages for current conversation
  const currentMessages = selectedConversation
    ? messages.filter((msg) => msg.applicationId === selectedConversation.applicationId)
    : [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Set selected conversation when currentConversationId changes
  useEffect(() => {
    if (currentConversationId) {
      const conv = conversations.find((c) => c.id === currentConversationId);
      setSelectedConversation(conv || null);
    }
  }, [currentConversationId, conversations]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage, attachments);
      setNewMessage('');
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
      setNewMessage('');
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
      setForwardToConversation('');
      onForwardClose();
    } catch (error) {
      console.error('Error forwarding message:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // getPriorityColor function removed - using Tag variants directly

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'read':
        return FiCheckCircle;
      case 'delivered':
        return FiCheck;
      case 'sent':
        return FiClock;
      default:
        return FiClock;
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return FiImage;
    if (type.startsWith('video/')) return FiVideo;
    if (type.includes('pdf')) return FiFileText;
    return FiFile;
  };

  const messageTemplates = [
    'Thank you for your application. We are currently reviewing your documents.',
    'We need additional information to complete your application. Please provide the following:',
    'Your application has been approved. Welcome to Mukuru!',
    'We have received your documents and they are under review.',
    'Please upload the missing documents listed in your requirements.',
    'Your application requires additional verification. We will contact you shortly.',
    'Thank you for your patience. We are working to process your application as quickly as possible.',
  ];

  return (
    <Flex height="100vh" bg="mukuru.background.light">
      {/* Conversations Sidebar */}
      <Box
        width="400px"
        bg="white"
        borderRight="1px"
        borderColor="gray.200"
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <Box p="4" borderBottom="1px" borderColor="gray.200">
          <VStack gap="4" align="stretch">
            <HStack justify="space-between">
              <Typography fontSize="lg" fontWeight="bold" color="mukuru.text.primary">
                Messages
              </Typography>
              <Tag variant="warning">
                {conversations.filter((c) => c.unreadCount > 0).length}
              </Tag>
            </HStack>

            {/* Search and Filters */}
            <VStack gap="2" align="stretch">
              <Box flex="1" maxW="300px">
                <Search
                  placeholder="Search conversations..."
                  onSearchChange={(query) => setSearchTerm(query)}
                />
              </Box>

              <HStack gap="2">
                <Dropdown
                  items={[
                    { label: 'All Priorities', value: 'all' },
                    { label: 'Urgent', value: 'urgent' },
                    { label: 'High', value: 'high' },
                    { label: 'Normal', value: 'normal' },
                    { label: 'Low', value: 'low' },
                  ]}
                  placeholder="Priority"
                  defaultValue={filterPriority}
                  onSelectionChange={(value) => {
                    if (value) setFilterPriority(value);
                  }}
                />

                <Dropdown
                  items={[
                    { label: 'All Status', value: 'all' },
                    { label: 'Active', value: 'active' },
                    { label: 'Archived', value: 'archived' },
                    { label: 'Closed', value: 'closed' },
                  ]}
                  placeholder="Status"
                  defaultValue={filterStatus}
                  onSelectionChange={(value) => {
                    if (value) setFilterStatus(value);
                  }}
                />
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
                  bg={
                    selectedConversation?.id === conversation.id ? 'orange.50' : 'white'
                  }
                  _hover={{
                    bg:
                      selectedConversation?.id === conversation.id
                        ? 'orange.100'
                        : 'gray.50',
                  }}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <VStack gap="2" align="stretch">
                    <HStack justify="space-between">
                      <HStack gap="2">
                        <Box
                          width="32px"
                          height="32px"
                          borderRadius="full"
                          bg="mukuru.teal"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Typography fontSize="xs" color="white" fontWeight="bold">
                            {conversation.customerName.charAt(0).toUpperCase()}
                          </Typography>
                        </Box>
                        <VStack align="start" gap="0">
                          <Typography
                            fontSize="sm"
                            fontWeight="medium"
                            color="mukuru.text.primary"
                          >
                            {conversation.customerName}
                          </Typography>
                          <Typography fontSize="xs" color="mukuru.grey.medium">
                            {conversation.applicationId}
                          </Typography>
                        </VStack>
                      </HStack>

                      <VStack align="end" gap="0">
                        <Tag
                          variant={
                            conversation.priority === 'urgent'
                              ? 'danger'
                              : conversation.priority === 'high'
                                ? 'warning'
                                : 'info'
                          }
                        >
                          {conversation.priority}
                        </Tag>
                        {conversation.unreadCount > 0 && (
                          <Tag variant="warning">{conversation.unreadCount}</Tag>
                        )}
                      </VStack>
                    </HStack>

                    <Typography fontSize="xs" color="mukuru.text.primary" lineClamp={2}>
                      {conversation.lastMessage.content}
                    </Typography>

                    <HStack justify="space-between">
                      <Typography fontSize="xs" color="mukuru.grey.medium">
                        {new Date(
                          conversation.lastMessage.timestamp
                        ).toLocaleTimeString()}
                      </Typography>
                      <HStack gap="1">
                        {conversation.tags.map((tag) => (
                          <Tag key={tag} variant="info">
                            {tag}
                          </Tag>
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
                  <Box
                    width="48px"
                    height="48px"
                    borderRadius="full"
                    bg="blue.500"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography fontSize="sm" color="white" fontWeight="bold">
                      {selectedConversation.customerName.charAt(0).toUpperCase()}
                    </Typography>
                  </Box>
                  <VStack align="start" gap="0">
                    <Typography
                      fontSize="lg"
                      fontWeight="semibold"
                      color="mukuru.text.primary"
                    >
                      {selectedConversation.customerName}
                    </Typography>
                    <Typography fontSize="sm" color="mukuru.text.primary">
                      {selectedConversation.customerEmail} •{' '}
                      {selectedConversation.applicationId}
                    </Typography>
                  </VStack>
                </HStack>

                <HStack gap="2">
                  <Tooltip content="Assign this conversation to an admin" showArrow>
                    <Button size="sm" variant="ghost" onClick={onAssignOpen}>
                      <Icon as={FiUser} mr="1" />
                      Assign
                    </Button>
                  </Tooltip>
                  <Tooltip content="Manage tags for this conversation" showArrow>
                    <Button size="sm" variant="ghost" onClick={onTagOpen}>
                      <Icon as={FiTag} mr="1" />
                      Tag
                    </Button>
                  </Tooltip>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onArchiveConversation(selectedConversation.id)}
                  >
                    <Icon as={FiArchive} mr="1" />
                    Archive
                  </Button>
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <Button size="sm" variant="ghost">
                        <Icon as={FiMoreVertical} />
                      </Button>
                    </Menu.Trigger>
                    <Menu.Content>
                      <Menu.Item value="flag">
                        <Icon as={FiFlag} mr="2" />
                        Flag
                      </Menu.Item>
                      <Menu.Item value="archive">
                        <Icon as={FiArchive} mr="2" />
                        Archive
                      </Menu.Item>
                      <Menu.Separator />
                      <Menu.Item value="delete" color="mukuru.text.error">
                        <Icon as={FiTrash2} mr="2" />
                        Delete
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Root>
                </HStack>
              </HStack>
            </Box>

            {/* Messages List */}
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
                      <Flex
                        justify={
                          message.senderType === currentUser.type
                            ? 'flex-end'
                            : 'flex-start'
                        }
                        align="start"
                        gap="3"
                      >
                        {message.senderType !== currentUser.type && (
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
                              <Typography fontSize="xs" color="white" fontWeight="bold">
                                {message.senderName.charAt(0).toUpperCase()}
                              </Typography>
                            )}
                          </Box>
                        )}

                        <Box
                          maxW="70%"
                          bg={
                            message.senderType === currentUser.type
                              ? 'orange.500'
                              : 'white'
                          }
                          color={
                            message.senderType === currentUser.type ? 'white' : 'gray.800'
                          }
                          p="3"
                          borderRadius="lg"
                          boxShadow="sm"
                          position="relative"
                        >
                          <VStack align="start" gap="2">
                            {message.replyTo && (
                              <Box
                                p="2"
                                bg={
                                  message.senderType === currentUser.type
                                    ? 'orange.600'
                                    : 'gray.100'
                                }
                                borderRadius="md"
                                fontSize="xs"
                                opacity="0.8"
                              >
                                <Typography fontWeight="medium">Replying to:</Typography>
                                <Typography lineClamp={2}>
                                  {/* Reply content would go here */}
                                </Typography>
                              </Box>
                            )}

                            <Typography fontSize="sm" lineHeight="1.4">
                              {message.content}
                            </Typography>

                            {message.attachments && message.attachments.length > 0 && (
                              <VStack align="start" gap="1">
                                {message.attachments.map((attachment) => (
                                  <HStack
                                    key={attachment.id}
                                    p="2"
                                    bg={
                                      message.senderType === currentUser.type
                                        ? 'orange.600'
                                        : 'gray.100'
                                    }
                                    borderRadius="md"
                                    cursor="pointer"
                                    _hover={{ opacity: 0.8 }}
                                  >
                                    <Icon as={getFileIcon(attachment.type)} />
                                    <Typography fontSize="xs">
                                      {attachment.name}
                                    </Typography>
                                    <Typography fontSize="xs" opacity="0.7">
                                      ({attachment.size})
                                    </Typography>
                                  </HStack>
                                ))}
                              </VStack>
                            )}

                            <HStack justify="space-between" width="100%">
                              <Typography fontSize="xs" opacity="0.7">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </Typography>
                              <HStack gap="1">
                                <Icon
                                  as={getStatusIcon(message.status)}
                                  boxSize="xs"
                                  opacity="0.7"
                                />
                                {message.isStarred && (
                                  <Icon
                                    as={FiStar}
                                    boxSize="xs"
                                    color="mukuru.text.alert"
                                  />
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
                            <Menu.Root>
                              <Menu.Trigger asChild>
                                <Button size="sm" variant="primary" colorScheme="gray">
                                  <Icon as={FiMoreVertical} />
                                </Button>
                              </Menu.Trigger>
                              <Menu.Content>
                                <Menu.Item
                                  value="reply"
                                  onClick={() => {
                                    setReplyToMessage(message);
                                    onReplyOpen();
                                  }}
                                >
                                  <Icon as={FiCornerUpLeft} mr="2" />
                                  Reply
                                </Menu.Item>
                                <Menu.Item
                                  value="forward"
                                  onClick={() => {
                                    setReplyToMessage(message);
                                    onForwardOpen();
                                  }}
                                >
                                  <Icon as={FiCornerUpLeft} mr="2" />
                                  Forward
                                </Menu.Item>
                                <Menu.Item
                                  value="star"
                                  onClick={() => onStarMessage(message.id)}
                                >
                                  <Icon as={FiStar} mr="2" />
                                  Star
                                </Menu.Item>
                                <Menu.Separator />
                                <Menu.Item value="download">
                                  <Icon as={FiDownload} mr="2" />
                                  Download
                                </Menu.Item>
                                <Menu.Item value="delete" color="mukuru.text.error">
                                  <Icon as={FiTrash2} mr="2" />
                                  Delete
                                </Menu.Item>
                              </Menu.Content>
                            </Menu.Root>
                          </Box>
                        </Box>

                        {message.senderType === currentUser.type && (
                          <Box
                            width="32px"
                            height="32px"
                            borderRadius="full"
                            bg="mukuru.buttons.primary"
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
                              <Typography fontSize="xs" color="white" fontWeight="bold">
                                {message.senderName.charAt(0).toUpperCase()}
                              </Typography>
                            )}
                          </Box>
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
                        bg="mukuru.state.hover"
                        borderRadius="md"
                        gap="2"
                      >
                        <Icon as={getFileIcon(file.type)} />
                        <Typography fontSize="xs">{file.name}</Typography>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAttachment(index)}
                        >
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
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setNewMessage(e.target.value)
                      }
                      rows={1}
                      resize="none"
                      onKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />

                    {/* Quick Actions */}
                    <HStack justify="space-between">
                      <HStack gap="1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Icon as={FiPaperclip} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowTemplates(!showTemplates)}
                        >
                          <Icon as={FiMessageSquare} />
                        </Button>
                      </HStack>

                      <Button
                        size="sm"
                        colorScheme="orange"
                        onClick={handleSendMessage}
                        loading={isSending}
                        loadingText="Sending..."
                        disabled={!newMessage.trim() && attachments.length === 0}
                      >
                        <Icon as={FiSend} mr="1" />
                        Send
                      </Button>
                    </HStack>
                  </VStack>
                </HStack>

                {/* Message Templates */}
                {showTemplates && (
                  <Box p="3" bg="mukuru.background.light" borderRadius="md">
                    <Typography fontSize="sm" fontWeight="medium" mb="2">
                      Quick Templates:
                    </Typography>
                    <SimpleGrid columns={2} gap="2">
                      {messageTemplates.map((template, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant="ghost"
                          textAlign="left"
                          height="auto"
                          p="2"
                          onClick={() => {
                            setNewMessage(template);
                            setShowTemplates(false);
                          }}
                        >
                          <Typography fontSize="xs" lineClamp={2}>
                            {template}
                          </Typography>
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
              <Icon as={FiMessageSquare} boxSize="12" color="mukuru.grey.medium" />
              <Typography fontSize="lg" color="mukuru.text.primary">
                Select a conversation to start messaging
              </Typography>
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
      {isReplyOpen && (
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
          onClick={onReplyClose}
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
                <Typography fontWeight="bold" fontSize="lg">
                  Reply to Message
                </Typography>
                <Button variant="ghost" size="sm" onClick={onReplyClose}>
                  <Icon as={FiX} />
                </Button>
              </HStack>
            </Box>
            <Box p="4">
              <VStack gap="4" align="stretch">
                <Box p="3" bg="gray.50" borderRadius="md">
                  <Typography fontSize="sm" fontWeight="medium" mb="2">
                    Replying to:
                  </Typography>
                  <Typography fontSize="sm" color="mukuru.text.primary">
                    {replyToMessage?.content}
                  </Typography>
                </Box>

                <Box>
                  <Typography fontSize="sm" fontWeight="medium" mb="2">
                    Your Reply
                  </Typography>
                  <Textarea
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                  />
                </Box>
              </VStack>
            </Box>
            <Box p="4" borderTop="1px" borderColor="gray.200">
              <HStack justify="flex-end" gap="3">
                <Button variant="ghost" onClick={onReplyClose}>
                  Cancel
                </Button>
                <Button colorScheme="orange" onClick={handleReply} loading={isSending}>
                  Send Reply
                </Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}

      {/* Forward Modal */}
      {isForwardOpen && (
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
          onClick={onForwardClose}
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
                <Typography fontWeight="bold" fontSize="lg">
                  Forward Message
                </Typography>
                <Button variant="ghost" size="sm" onClick={onForwardClose}>
                  <Icon as={FiX} />
                </Button>
              </HStack>
            </Box>
            <Box p="4">
              <VStack gap="4" align="stretch">
                <Box p="3" bg="gray.50" borderRadius="md">
                  <Typography fontSize="sm" fontWeight="medium" mb="2">
                    Forwarding:
                  </Typography>
                  <Typography fontSize="sm" color="mukuru.text.primary">
                    {replyToMessage?.content}
                  </Typography>
                </Box>

                <Box>
                  <Typography fontSize="sm" fontWeight="medium" mb="2">
                    Forward to Conversation
                  </Typography>
                  <select
                    value={forwardToConversation}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setForwardToConversation(e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <option value="">Select conversation...</option>
                    {conversations.map((conv) => (
                      <option key={conv.id} value={conv.id}>
                        {conv.customerName} - {conv.applicationId}
                      </option>
                    ))}
                  </select>
                </Box>
              </VStack>
            </Box>
            <Box p="4" borderTop="1px" borderColor="gray.200">
              <HStack justify="flex-end" gap="3">
                <Button variant="ghost" onClick={onForwardClose}>
                  Cancel
                </Button>
                <Button colorScheme="orange" onClick={handleForward}>
                  Forward Message
                </Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={onAssignClose}
        title="Assign Conversation"
        showCloseButton={true}
        footer={
          <HStack justify="flex-end" gap="3">
            <Button variant="ghost" onClick={onAssignClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                // Handle assignment
                onAssignClose();
              }}
            >
              Assign
            </Button>
          </HStack>
        }
      >
        <Box>
          <Typography fontSize="sm" fontWeight="medium" mb="2">
            Assign to Admin
          </Typography>
          <Dropdown
            items={[
              { label: 'John Smith', value: 'admin1' },
              { label: 'Jane Doe', value: 'admin2' },
              { label: 'Mike Johnson', value: 'admin3' },
            ]}
            placeholder="Select admin..."
            onSelectionChange={(value) => {
              // Handle assignment
              console.info('Assign to:', value);
            }}
          />
        </Box>
      </Modal>

      {/* Tag Modal */}
      <Modal
        isOpen={isTagOpen}
        onClose={onTagClose}
        title="Manage Tags"
        showCloseButton={true}
        footer={
          <HStack justify="flex-end" gap="3">
            <Button variant="ghost" onClick={onTagClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                // Handle tag save
                onTagClose();
              }}
            >
              Save Tags
            </Button>
          </HStack>
        }
      >
        <VStack gap="3" align="stretch">
          <Typography fontSize="sm" color="gray.600">
            Select tags for this conversation:
          </Typography>
          <VStack align="start" gap="2">
            {['urgent', 'follow-up', 'documentation', 'verification', 'approved'].map(
              (tag) => (
                <HStack key={tag} gap="2">
                  <Checkbox defaultChecked={selectedConversation?.tags.includes(tag)} />
                  <Typography>{tag}</Typography>
                </HStack>
              )
            )}
          </VStack>
        </VStack>
      </Modal>
    </Flex>
  );
}
