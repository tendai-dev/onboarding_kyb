'use client';

import {
  Box,
  VStack,
  HStack,
  Input,
  Textarea,
  Avatar,
  Flex,
  Icon,
  useDisclosure,
  SimpleGrid,
  Menu,
} from '@chakra-ui/react';
import { Button, Typography, Tag, Modal, Checkbox } from '@/lib/mukuruImports';
import { FormControl, FormLabel } from '@/lib/mukuruComponentWrappers';
import { useState, useEffect, useRef } from 'react';
import {
  FiSend,
  FiPaperclip,
  FiMoreVertical,
  FiArchive,
  FiFlag,
  FiCornerUpLeft as FiReply,
  FiShare2 as FiForward,
  FiDownload,
  FiTrash2,
  FiStar,
  FiStar as FiStarFill,
  FiClock,
  FiCheck,
  FiCheckCircle,
  FiMessageSquare,
  FiFileText,
  FiSearch,
  FiUser,
  FiTag,
  FiX,
  FiImage,
  FiVideo,
  FiFile,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

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
      conv.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.partnerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // Unused helper function - kept for potential future use
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

  const getStatusIcon = (status: 'sent' | 'delivered' | 'read') => {
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
              <Tag variant="solid" size="md">
                {conversations.filter((c) => c.unreadCount > 0).length}
              </Tag>
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
                <Button size="sm" variant="ghost">
                  <Icon as={FiSearch} />
                </Button>
              </HStack>

              <HStack gap="2">
                <Box>
                  <select
                    value={filterPriority}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFilterPriority(e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--chakra-colors-gray-200)',
                      background: 'white',
                      color: '#000000',
                      fontSize: '14px',
                    }}
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </Box>

                <Box>
                  <select
                    value={filterStatus}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFilterStatus(e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--chakra-colors-gray-200)',
                      background: 'white',
                      color: '#000000',
                      fontSize: '14px',
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                    <option value="closed">Closed</option>
                  </select>
                </Box>
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
                    selectedConversation?.id === conversation.id ? 'primary.50' : 'white'
                  }
                  _hover={{
                    bg:
                      selectedConversation?.id === conversation.id
                        ? 'primary.100'
                        : 'gray.50',
                  }}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <VStack gap="2" align="stretch">
                    <HStack justify="space-between">
                      <HStack gap="2">
                        <Avatar.Root size="sm">
                          <Avatar.Fallback>
                            {conversation.partnerName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </Avatar.Fallback>
                        </Avatar.Root>
                        <VStack align="start" gap="0">
                          <Typography
                            fontSize="sm"
                            fontWeight="medium"
                            color="mukuru.text.primary"
                          >
                            {conversation.partnerName}
                          </Typography>
                          <Typography fontSize="xs" color="mukuru.grey.medium">
                            {conversation.applicationId}
                          </Typography>
                        </VStack>
                      </HStack>

                      <VStack align="end" gap="0">
                        <Tag variant="solid" size="md">
                          {conversation.priority}
                        </Tag>
                        {conversation.unreadCount > 0 && (
                          <Tag variant="solid" size="md">
                            {conversation.unreadCount}
                          </Tag>
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
                          <Tag key={tag} size="md" variant="solid">
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
                  <Avatar.Root>
                    <Avatar.Fallback>
                      {selectedConversation.partnerName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <VStack align="start" gap="0">
                    <Typography
                      fontSize="lg"
                      fontWeight="semibold"
                      color="mukuru.text.primary"
                    >
                      {selectedConversation.partnerName}
                    </Typography>
                    <Typography fontSize="sm" color="mukuru.text.primary">
                      {selectedConversation.partnerEmail} •{' '}
                      {selectedConversation.applicationId}
                    </Typography>
                  </VStack>
                </HStack>

                <HStack gap="2">
                  <Button size="sm" variant="ghost" onClick={onAssignOpen}>
                    <Icon as={FiUser} mr="1" />
                    Assign
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onTagOpen}>
                    <Icon as={FiTag} mr="1" />
                    Tag
                  </Button>
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
                      <Menu.Item value="delete" color="error.500">
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
                          <Avatar.Root size="sm">
                            {message.senderAvatar ? (
                              <Avatar.Image
                                src={message.senderAvatar}
                                alt={message.senderName}
                              />
                            ) : null}
                            <Avatar.Fallback>
                              {message.senderName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </Avatar.Fallback>
                          </Avatar.Root>
                        )}

                        <Box
                          maxW="70%"
                          bg={
                            message.senderType === currentUser.type
                              ? 'primary.500'
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
                                    ? 'primary.600'
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
                                        ? 'primary.600'
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
                                  boxSize="3"
                                  opacity="0.7"
                                />
                                {message.isStarred && (
                                  <Icon as={FiStarFill} boxSize="3" color="warning.400" />
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
                                  <Icon as={FiReply} mr="2" />
                                  Reply
                                </Menu.Item>
                                <Menu.Item
                                  value="forward"
                                  onClick={() => {
                                    setReplyToMessage(message);
                                    onForwardOpen();
                                  }}
                                >
                                  <Icon as={FiForward} mr="2" />
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
                                <Menu.Item value="delete" color="error.500">
                                  <Icon as={FiTrash2} mr="2" />
                                  Delete
                                </Menu.Item>
                              </Menu.Content>
                            </Menu.Root>
                          </Box>
                        </Box>

                        {message.senderType === currentUser.type && (
                          <Avatar.Root size="sm">
                            {message.senderAvatar ? (
                              <Avatar.Image
                                src={message.senderAvatar}
                                alt={message.senderName}
                              />
                            ) : null}
                            <Avatar.Fallback>
                              {message.senderName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </Avatar.Fallback>
                          </Avatar.Root>
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
      <Modal
        isOpen={isReplyOpen}
        onClose={onReplyClose}
        size="large"
        title="Reply to Message"
        footer={
          <>
            <Button variant="ghost" mr="3" onClick={onReplyClose}>
              Cancel
            </Button>
            <Button colorScheme="orange" onClick={handleReply} loading={isSending}>
              Send Reply
            </Button>
          </>
        }
      >
        <VStack gap="4" align="stretch">
          <Box p="3" bg="gray.50" borderRadius="md">
            <Typography fontSize="sm" fontWeight="medium" mb="2">
              Replying to:
            </Typography>
            <Typography fontSize="sm" color="mukuru.text.primary">
              {replyToMessage?.content}
            </Typography>
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
      </Modal>

      {/* Forward Modal */}
      <Modal
        isOpen={isForwardOpen}
        onClose={onForwardClose}
        size="large"
        title="Forward Message"
        footer={
          <>
            <Button variant="ghost" mr="3" onClick={onForwardClose}>
              Cancel
            </Button>
            <Button colorScheme="orange" onClick={handleForward}>
              Forward Message
            </Button>
          </>
        }
      >
        <VStack gap="4" align="stretch">
          <Box p="3" bg="gray.50" borderRadius="md">
            <Typography fontSize="sm" fontWeight="medium" mb="2">
              Forwarding:
            </Typography>
            <Typography fontSize="sm" color="mukuru.text.primary">
              {replyToMessage?.content}
            </Typography>
          </Box>

          <FormControl>
            <FormLabel>Forward to Conversation</FormLabel>
            <Box>
              <select
                value={forwardToConversation}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setForwardToConversation(e.target.value)
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--chakra-colors-gray-200)',
                  background: 'white',
                  color: '#000000',
                }}
              >
                <option value="">Select conversation...</option>
                {conversations.map((conv) => (
                  <option key={conv.id} value={conv.id}>
                    {conv.partnerName} - {conv.applicationId}
                  </option>
                ))}
              </select>
            </Box>
          </FormControl>
        </VStack>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={onAssignClose}
        title="Assign Conversation"
        footer={
          <>
            <Button variant="ghost" mr="3" onClick={onAssignClose}>
              Cancel
            </Button>
            <Button colorScheme="orange">Assign</Button>
          </>
        }
      >
        <FormControl>
          <FormLabel>Assign to Admin</FormLabel>
          <Box>
            <select
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--chakra-colors-gray-200)',
                background: 'white',
                color: '#000000',
              }}
            >
              <option value="">Select admin...</option>
              <option value="admin1">John Smith</option>
              <option value="admin2">Jane Doe</option>
              <option value="admin3">Mike Johnson</option>
            </select>
          </Box>
        </FormControl>
      </Modal>

      {/* Tag Modal */}
      <Modal
        isOpen={isTagOpen}
        onClose={onTagClose}
        title="Add Tags"
        footer={
          <>
            <Button variant="ghost" mr="3" onClick={onTagClose}>
              Cancel
            </Button>
            <Button colorScheme="orange">Save Tags</Button>
          </>
        }
      >
        <VStack gap="3" align="stretch">
          <Typography fontSize="sm" color="gray.600">
            Select tags for this conversation:
          </Typography>
          <VStack align="start" gap="2">
            {['urgent', 'follow-up', 'documentation', 'verification', 'approved'].map(
              (tag) => (
                <Checkbox
                  key={tag}
                  checked={selectedConversation?.tags.includes(tag) || false}
                  onCheckedChange={(details) => {
                    // Handle tag toggle - this would need to be connected to a state update function
                    // For now, just log the change
                    console.info(`Tag ${tag} toggled:`, details.checked);
                  }}
                >
                  {tag}
                </Checkbox>
              )
            )}
          </VStack>
        </VStack>
      </Modal>
    </Flex>
  );
}
