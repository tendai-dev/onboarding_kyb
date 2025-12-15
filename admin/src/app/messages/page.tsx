'use client';

import {
  Box,
  Container,
  VStack,
  HStack,
  Textarea,
  Flex,
  Spinner,
  Avatar,
} from '@chakra-ui/react';
// Import components directly from Mukuru package
import {
  Search,
  Typography,
  Button,
  Tag,
  IconWrapper,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  AlertBar,
  Card,
  Dropdown,
  Checkbox,
  Tooltip,
  // Mukuru Icons
  AddIcon,
  StarIcon,
  FilterIcon,
  UserIcon,
  MailIcon,
  ErrorIcon,
  TickCircleIcon,
  CloseIcon,
  DeleteIcon,
  ShareIcon,
  DownloadIcon,
  SearchIcon,
  RetryIcon,
  ForwardToInboxIcon,
} from '@mukuru/mukuru-react-components';
// Import wrapper components (not yet in npm package)
import { Input } from '@/lib/mukuruComponentWrappers';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;
import { SweetAlert } from '../../utils/sweetAlert';
import { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { useSidebar } from '../../contexts/SidebarContext';
import { messagingApi, MessageDto, MessageThreadDto } from '../../lib/messagingApi';
import { signalRService } from '../../lib/signalRService';
import { PushNotificationService } from '../../lib/pushNotifications';
import { uploadFileToDocumentService } from '../../lib/documentUpload';
import { logger } from '../../lib/logger';
import NextLink from 'next/link';
import { sendMessageNotificationEmail } from '../../lib/notificationService';

interface DisplayMessage {
  id: string;
  sender: string;
  senderType: 'ADMIN' | 'PARTNER' | 'CUSTOMER';
  recipient?: string;
  subject: string;
  content: string;
  timestamp: string;
  applicationId: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    contentType: string;
    fileSizeBytes: number;
    storageKey: string;
    storageUrl: string;
    documentId?: string;
    description?: string;
  }>;
  isRead: boolean;
  isStarred?: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  threadId: string;
  replyToMessageId?: string;
}

export default function MessagesPage() {
  const { condensed } = useSidebar();

  // Color mode values for dark/light mode support
  const bgColor = useColorModeValue('mukuru.background.light', 'mukuru.background.dark');
  const cardBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const headerBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');

  const [threads, setThreads] = useState<MessageThreadDto[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThreadDto | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  // Filter priority removed - not currently used
  // const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterArchived, setFilterArchived] = useState<boolean>(false);
  const [filterStarred, setFilterStarred] = useState<boolean>(false);
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState({
    applicationId: '',
    content: '',
    receiverId: '',
  });
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [isTyping, setIsTyping] = useState<{ [threadId: string]: { userName: string } }>(
    {}
  );
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DisplayMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<DisplayMessage | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [attachmentUploadProgress, setAttachmentUploadProgress] = useState<{
    [fileName: string]: number;
  }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Refs to access current values in SignalR callbacks without re-initializing
  const selectedThreadRef = useRef<MessageThreadDto | null>(null);

  const pushNotificationService = PushNotificationService.getInstance();

  // Keep refs in sync with state
  useEffect(() => {
    selectedThreadRef.current = selectedThread;
  }, [selectedThread]);

  // Initialize SignalR connection
  useEffect(() => {
    const initSignalR = async () => {
      try {
        await signalRService.connect();
        setSignalRConnected(true);

        // Set up event listeners
        const unsubscribeReceive = signalRService.on(
          'ReceiveMessage',
          async (messageData: Record<string, unknown>) => {
            const message = messageData as {
              id: string;
              threadId: string;
              senderName?: string;
              senderEmail?: string;
              senderId?: string;
              senderRole?: string;
              content?: string;
              sentAt?: string;
              applicationId?: string;
              attachments?: Array<{
                id: string;
                fileName: string;
                contentType: string;
                fileSizeBytes: number;
                storageKey: string;
                storageUrl: string;
                documentId?: string;
                description?: string;
              }>;
            };

            logger.info('[Admin Messages] Received SignalR message', {
              messageId: message.id,
              threadId: message.threadId,
              sender: message.senderName || message.senderEmail,
            });

            // Use ref to get current thread (avoids stale closures)
            const currentThread = selectedThreadRef.current;

            console.info('[Admin Messages] SignalR message received:', {
              messageId: message.id,
              threadId: message.threadId,
              currentThreadId: currentThread?.id,
              matches: currentThread?.id === message.threadId,
            });

            // Show push notification for new messages
            if (
              document.hidden ||
              !currentThread ||
              message.threadId !== currentThread.id
            ) {
              try {
                await pushNotificationService.showMessageNotification(
                  message.senderName || 'Admin',
                  message.content || 'New message',
                  message.threadId
                );
              } catch (error) {
                logger.error(error, '[Messages] Failed to show notification', {
                  tags: { error_type: 'notification_error' },
                });
              }
            }

            // If message is for current thread, add it immediately
            // Use string comparison to ensure exact match (handle both string and GUID formats)
            const messageThreadId = String(message.threadId || '').toLowerCase();
            const currentThreadIdStr = currentThread?.id
              ? String(currentThread.id).toLowerCase()
              : '';
            const isForCurrentThread =
              currentThreadIdStr &&
              messageThreadId &&
              messageThreadId === currentThreadIdStr;

            if (isForCurrentThread) {
              // Determine sender type more accurately
              const senderEmail = (
                message.senderEmail ||
                message.senderId ||
                ''
              ).toLowerCase();
              const senderNameLower = (message.senderName || '').toLowerCase();

              // SIMPLE LOGIC: Admin/ComplianceManager/Reviewer = admin (right), Applicant = partner (left)
              // Handle 'None' string from backend
              const rawRole =
                message.senderRole && message.senderRole !== 'None'
                  ? message.senderRole
                  : (message as any).sender_role;
              const senderRoleLower = (rawRole || '').toLowerCase();
              const isFromAdmin =
                senderRoleLower === 'admin' ||
                senderRoleLower === 'compliancemanager' ||
                senderRoleLower === 'reviewer' ||
                senderRoleLower === 'administrator';

              // Get proper sender name - ALWAYS use thread info to ensure correct names for each side
              let senderDisplayName = '';

              if (!isFromAdmin) {
                // Partner messages: ALWAYS use thread's applicantName to ensure consistency
                senderDisplayName =
                  currentThread?.applicantName || message.senderName || 'Partner';
              } else {
                // Admin messages: Use thread's assignedAdminName, or fallback to senderName
                // If senderName exists and doesn't match applicantName, use it (might be different admin)
                if (currentThread?.assignedAdminName) {
                  senderDisplayName = currentThread.assignedAdminName;
                } else if (
                  message.senderName &&
                  message.senderName !== currentThread?.applicantName
                ) {
                  // Use senderName if it's different from applicant name (likely an admin name)
                  senderDisplayName = message.senderName;
                } else {
                  // Try to extract from email or use default
                  if (message.senderEmail && message.senderEmail.includes('@')) {
                    const emailParts = message.senderEmail.split('@');
                    senderDisplayName =
                      emailParts[0]
                        .split('.')
                        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                        .join(' ') || emailParts[0];
                  } else if (message.senderId && message.senderId.includes('@')) {
                    const emailParts = message.senderId.split('@');
                    senderDisplayName =
                      emailParts[0]
                        .split('.')
                        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                        .join(' ') || emailParts[0];
                  } else {
                    senderDisplayName = message.senderName || 'Admin';
                  }
                }
              }

              const displayMessage: DisplayMessage = {
                id: message.id,
                sender: senderDisplayName,
                senderType: isFromAdmin ? 'ADMIN' : 'PARTNER',
                subject: currentThread ? getSubjectFromThread(currentThread) : 'Message',
                content: message.content || '',
                timestamp: message.sentAt || new Date().toISOString(),
                applicationId:
                  message.applicationId ||
                  (currentThread ? currentThread.applicationId : ''),
                attachments: message.attachments || [],
                isRead: false,
                isStarred: false,
                priority: determinePriority({
                  content: message.content || '',
                } as MessageDto),
                threadId: message.threadId,
              };

              // Add message immediately to state - this makes it appear instantly without page refresh
              setMessages((prev) => {
                // Check if message already exists (avoid duplicates)
                if (prev.some((m) => m.id === message.id)) {
                  return prev;
                }

                // Replace optimistic message if this is the real message (same content, recent timestamp)
                const messageSentAt = message.sentAt || new Date().toISOString();
                const optimisticIndex = prev.findIndex(
                  (m) =>
                    m.id.startsWith('temp-') &&
                    m.content === message.content &&
                    Math.abs(
                      new Date(m.timestamp).getTime() - new Date(messageSentAt).getTime()
                    ) < 5000
                );

                if (optimisticIndex >= 0) {
                  // Replace optimistic message with real one
                  const updated = [...prev];
                  updated[optimisticIndex] = displayMessage;
                  return updated.sort((a, b) => {
                    const timeA = new Date(a.timestamp).getTime();
                    const timeB = new Date(b.timestamp).getTime();
                    if (isNaN(timeA) && isNaN(timeB)) return 0;
                    if (isNaN(timeA)) return 1;
                    if (isNaN(timeB)) return -1;
                    const diff = timeA - timeB;
                    return diff !== 0 ? diff : 0;
                  });
                }

                // Sort ascending: oldest first, newest last (at bottom)
                // Create new array to ensure proper sorting
                // Message appears instantly!
                const updated = [...prev, displayMessage];
                return updated.sort((a, b) => {
                  const timeA = new Date(a.timestamp).getTime();
                  const timeB = new Date(b.timestamp).getTime();
                  // Handle invalid dates
                  if (isNaN(timeA) && isNaN(timeB)) return 0;
                  if (isNaN(timeA)) return 1; // Put invalid dates at end
                  if (isNaN(timeB)) return -1; // Put invalid dates at end
                  // Ascending: older messages first, newer messages last
                  // This puts latest messages at the bottom
                  const diff = timeA - timeB;
                  // If timestamps are equal, maintain original order (stable sort)
                  return diff !== 0 ? diff : 0;
                });
              });

              // Scroll to bottom (same logic as partner portal)
              setTimeout(() => {
                if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end',
                  });
                }
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop =
                    messagesContainerRef.current.scrollHeight;
                }
              }, 150);

              // Also reload messages from backend to ensure consistency and proper sender type
              // Note: Background refresh happens here, but message is already visible above
              setTimeout(async () => {
                try {
                  if (currentThread?.id) {
                    await loadThreadMessages(currentThread.id);
                  }
                } catch (error) {
                  logger.error(
                    error,
                    '[Admin Messages] Failed to reload messages after SignalR update',
                    {
                      tags: { error_type: 'messages_reload_error' },
                    }
                  );
                }
              }, 500);
            }

            // Refresh threads to update last message and unread counts
            loadThreads();
            loadUnreadCount();
          }
        );

        const unsubscribeSent = signalRService.on(
          'MessageSent',
          (messageData: Record<string, unknown>) => {
            const message = messageData as { threadId?: string };
            // Message was sent successfully via SignalR
            const currentThread = selectedThreadRef.current;
            if (currentThread && message.threadId === currentThread.id) {
              loadThreadMessages(currentThread.id);
            }
            loadThreads();
            loadUnreadCount();
          }
        );

        const unsubscribeTyping = signalRService.on(
          'UserTyping',
          (data: Record<string, unknown>) => {
            const threadId = data.threadId as string;
            const userName = data.userName as string;
            const currentThread = selectedThreadRef.current;
            if (currentThread && threadId === currentThread.id) {
              setIsTyping((prev) => ({
                ...prev,
                [threadId]: { userName },
              }));

              // Clear typing indicator after 3 seconds
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              typingTimeoutRef.current = setTimeout(() => {
                setIsTyping((prev) => {
                  const updated = { ...prev };
                  if (threadId in updated) {
                    const rest = Object.fromEntries(
                      Object.entries(updated).filter(([key]) => key !== threadId)
                    );
                    return rest;
                  }
                  return updated;
                });
              }, 3000);
            }
          }
        );

        const unsubscribeRead = signalRService.on(
          'MessageRead',
          (messageIdData: Record<string, unknown>) => {
            const messageId = (messageIdData.id ||
              messageIdData.messageId ||
              messageIdData) as string;
            if (typeof messageId === 'string') {
              setMessages((prev) =>
                prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
              );
            }
          }
        );

        // Listen for connection state changes
        const unsubscribeReconnected = signalRService.on('Reconnected', () => {
          console.info('[Admin Messages] SignalR reconnected');
          setSignalRConnected(true);
          // Rejoin current thread if one is selected (use ref to get current value)
          const thread = selectedThreadRef.current;
          if (thread) {
            signalRService.joinThread(thread.id).catch(() => {});
          }
        });

        const unsubscribeConnectionClosed = signalRService.on('ConnectionClosed', () => {
          console.warn('[Admin Messages] SignalR connection closed');
          setSignalRConnected(false);
        });

        return () => {
          unsubscribeReceive();
          unsubscribeSent();
          unsubscribeTyping();
          unsubscribeRead();
          unsubscribeReconnected();
          unsubscribeConnectionClosed();
          signalRService.disconnect();
        };
      } catch (error) {
        // Check if it's a 404 error (endpoint not available)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
          // SignalR endpoint not available - this is expected in some environments
          logger.debug(
            '[Messages] SignalR endpoint not available (404) - continuing without real-time updates'
          );
        } else {
          // Other connection errors - log as warning, not error
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.warn('[Messages] Failed to connect SignalR', {
            tags: { error_type: 'signalr_connection_error' },
            extra: { error: errorMessage },
          });
        }
        setSignalRConnected(false);
      }
    };

    initSignalR();
  }, []);

  // Join/leave thread when selection changes
  useEffect(() => {
    if (!selectedThread?.id) return;

    // Wait for SignalR to be connected before joining
    if (!signalRConnected) {
      // If not connected, try to connect first
      signalRService
        .connect()
        .then(() => {
          if (signalRService.isConnected()) {
            setSignalRConnected(true);
            // Then join thread
            const guidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (
              guidRegex.test(selectedThread.id) &&
              selectedThread.id !== '00000000-0000-0000-0000-000000000000'
            ) {
              signalRService.joinThread(selectedThread.id).catch(() => {});
            }
          }
        })
        .catch(() => {});
      return;
    }

    // Validate threadId is a valid GUID before joining
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (
      guidRegex.test(selectedThread.id) &&
      selectedThread.id !== '00000000-0000-0000-0000-000000000000'
    ) {
      console.info('[Admin Messages] Joining thread:', selectedThread.id);
      signalRService.joinThread(selectedThread.id).catch((error) => {
        // Errors are already handled in signalRService - only log if it's unexpected
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (
          !errorMessage.includes('Method does not exist') &&
          !errorMessage.includes('HubException')
        ) {
          logger.warn('[Messages] Failed to join thread', {
            tags: { error_type: 'thread_join_error' },
            extra: { error: errorMessage },
          });
        }
      });
      return () => {
        console.info('[Admin Messages] Leaving thread:', selectedThread.id);
        signalRService.leaveThread(selectedThread.id).catch((error) => {
          // Errors are already handled in signalRService - only log if it's unexpected
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (
            !errorMessage.includes('Method does not exist') &&
            !errorMessage.includes('HubException')
          ) {
            logger.warn('[Messages] Failed to leave thread', {
              tags: { error_type: 'thread_leave_error' },
              extra: { error: errorMessage },
            });
          }
        });
      };
    } else {
      logger.warn('[Messages] Invalid thread ID, skipping join', {
        tags: { warning_type: 'invalid_thread_id' },
        extra: { threadId: selectedThread.id },
      });
    }
  }, [selectedThread, signalRConnected]);

  useEffect(() => {
    // NOTE: Diagnostic endpoint removed to prevent console errors
    // The diagnostic/identity endpoint is optional and not required for messaging functionality
    // If needed for debugging, it can be accessed directly via the backend API

    loadThreads();
    loadUnreadCount();
  }, []);

  // Fallback polling (only if SignalR is not connected)
  useEffect(() => {
    if (signalRConnected) return; // Don't poll if SignalR is connected

    const interval = setInterval(() => {
      loadThreads();
      loadUnreadCount();
      // Refresh current thread messages if one is selected
      if (selectedThread) {
        loadThreadMessages(selectedThread.id);
      }
    }, 5000); // 5 seconds - faster polling when SignalR is not connected

    return () => clearInterval(interval);
  }, [selectedThread, signalRConnected]);

  // Auto-retry SignalR connection every 30 seconds if disconnected
  useEffect(() => {
    if (signalRConnected) return; // Already connected

    const retryInterval = setInterval(async () => {
      console.info('[Messages] Attempting to reconnect SignalR...');
      try {
        await signalRService.connect();
        if (signalRService.isConnected()) {
          console.info('[Messages] SignalR reconnected successfully!');
          setSignalRConnected(true);
          // Rejoin thread if one is selected (use ref to get current value)
          const thread = selectedThreadRef.current;
          if (thread?.id) {
            await signalRService.joinThread(thread.id);
          }
        }
      } catch (e) {
        console.debug('[Messages] SignalR reconnection attempt failed:', e);
      }
    }, 30000); // Retry every 30 seconds

    return () => clearInterval(retryInterval);
  }, [signalRConnected]);

  // Prevent body scrolling - page should be fixed
  useEffect(() => {
    // Prevent body and html scroll when component mounts
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlHeight = document.documentElement.style.height;

    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100vh';

    return () => {
      // Restore original styles when component unmounts
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.height = originalBodyHeight;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.height = originalHtmlHeight;
    };
  }, []);

  useEffect(() => {
    if (selectedThread && selectedThread.id) {
      // If thread is missing applicationId, try to find it BEFORE loading messages
      // This ensures messages will have the correct applicationId when loaded
      if (!selectedThread.applicationId) {
        (async () => {
          try {
            // Try to find applicationId by searching cases using applicantId
            if (selectedThread.applicantId) {
              console.info(
                '[Messages] Searching for applicationId using applicantId:',
                selectedThread.applicantId
              );
              const searchResponse = await fetch(
                `/api/proxy/projections/v1/cases?searchTerm=${encodeURIComponent(selectedThread.applicantId)}&take=10`
              );
              if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                if (searchData.items && searchData.items.length > 0) {
                  // Try to find a match by applicantId or applicantEmail
                  const match = searchData.items.find((item: any) => {
                    const itemApplicantId = item.applicantId || item.applicant_id;
                    const itemApplicantEmail =
                      item.applicantEmail || item.applicant_email;
                    const threadApplicantId = selectedThread.applicantId;
                    return (
                      itemApplicantId === threadApplicantId ||
                      itemApplicantEmail === threadApplicantId ||
                      item.id === threadApplicantId
                    );
                  });
                  if (match) {
                    const foundAppId = match.id || match.caseId || match.caseNumber;
                    console.info(
                      '[Messages] Found applicationId from applicantId search:',
                      foundAppId
                    );
                    // Update the selectedThread with the found applicationId
                    setSelectedThread((prev) =>
                      prev ? { ...prev, applicationId: foundAppId } : null
                    );
                  }
                }
              }
            }

            // Also try applicationReference if available
            if (!selectedThread.applicationId && selectedThread.applicationReference) {
              console.info(
                '[Messages] Using applicationReference as applicationId:',
                selectedThread.applicationReference
              );
              setSelectedThread((prev) =>
                prev
                  ? { ...prev, applicationId: selectedThread.applicationReference! }
                  : null
              );
            }
          } catch (error) {
            console.warn('[Messages] Failed to find applicationId for thread:', error);
          }
        })();
      }

      // Only load messages if we're not already loading to prevent loops
      if (!loadingMessages) {
        loadThreadMessages(selectedThread.id);
      }

      // Update newMessage with the current thread's applicationId
      setNewMessage((prev) => ({
        ...prev,
        applicationId: selectedThread.applicationId || '',
      }));
    }
  }, [selectedThread?.id]); // Only depend on thread ID to prevent unnecessary reloads

  useEffect(() => {
    // Auto-scroll to bottom when messages change (same logic as partner portal)
    // Use setTimeout to ensure DOM has updated
    const timer = setTimeout(() => {
      // Try both methods for reliable scrolling (same as partner portal)
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [messages, messages.length]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.debug('[Messages] Loading threads...');
      // Use getAllThreads for admin to see all messages
      let result;
      try {
        result = await messagingApi.getAllThreads(1, 100);
        logger.debug('[Messages] Using getAllThreads - loaded all threads');
      } catch (allThreadsError) {
        // Check if it's a 404 - if so, try fallback without logging warning
        const errorMessage =
          allThreadsError instanceof Error
            ? allThreadsError.message
            : String(allThreadsError);
        if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
          // 404 is expected - endpoint might not be available, silently fallback
          logger.debug(
            '[Messages] getAllThreads endpoint not available (404), using getMyThreads'
          );
        } else {
          // Fallback to getMyThreads if getAllThreads fails (e.g., not admin)
          logger.warn('[Messages] getAllThreads failed, falling back to getMyThreads', {
            tags: { warning_type: 'getallthreads_fallback' },
            extra: { error: allThreadsError },
          });
        }
        result = await messagingApi.getMyThreads(1, 100);
      }
      logger.debug('[Messages] Threads loaded', {
        totalCount: result.totalCount,
        itemsCount: result.items?.length || 0,
      });
      setThreads(result.items || []);
      // Clear error if successful
      if (result.items && result.items.length >= 0) {
        setError(null);
      }
      // Log if no threads found
      if (!result.items || result.items.length === 0) {
        logger.warn('[Messages] No threads found', {
          tags: { warning_type: 'no_threads' },
          extra: { totalCount: result.totalCount },
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';

      // Check if it's a 404 error - if so, don't show error to user, just show empty state
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        logger.debug(
          '[Messages] Messaging API endpoints not available (404) - showing empty state'
        );
        setThreads([]);
        setError(null); // Don't show error for 404s
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        const { clientSentry } = await import('../../lib/sentry-client');
        clientSentry.reportError(err, {
          tags: { error_type: 'messages', operation: 'load_threads' },
          level: 'error',
        });
      }
      // Check if it's a connection error
      if (
        errorMessage.includes('connect') ||
        errorMessage.includes('unavailable') ||
        errorMessage.includes('ECONNREFUSED')
      ) {
        setError(
          'Cannot connect to messaging service. Please ensure the backend messaging service is running on port 8087.'
        );
      } else {
        setError(errorMessage);
      }
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const result = await messagingApi.getUnreadCount();
      setUnreadCount(result.count || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Check if it's a 404 error - if so, silently set count to 0
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        logger.debug(
          '[Messages] Unread count endpoint not available (404) - setting to 0'
        );
        setUnreadCount(0);
        return;
      }

      if (typeof window !== 'undefined') {
        const { clientSentry } = await import('../../lib/sentry-client');
        clientSentry.reportError(err, {
          tags: { error_type: 'messages', operation: 'load_unread_count' },
          level: 'warning',
        });
      }
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      setLoadingMessages(true);
      const result = await messagingApi.getThreadMessages(threadId, 1, 100);
      const displayMessages: DisplayMessage[] = (result.items || []).map(
        (msg: MessageDto) => {
          // Determine sender type based on email domain, name, and role
          // Handle both camelCase and snake_case from backend
          // Note: Backend may return 'None' as a string, so check for that too
          const senderNameLower = (msg.senderName || msg.sender_name || '').toLowerCase();
          const senderIdLower = (msg.senderId || msg.sender_id || '').toLowerCase();
          const rawSenderRole =
            msg.senderRole && msg.senderRole !== 'None'
              ? msg.senderRole
              : msg.sender_role;
          const senderRole = (rawSenderRole || '').trim();

          // Debug log to verify senderRole
          console.log('[loadThreadMessages] Message role:', {
            senderRole,
            content: msg.content?.substring(0, 20),
          });

          // Check email domain for fallback
          const hasMukuruEmail =
            senderNameLower.includes('@mukuru.com') ||
            senderIdLower.includes('@mukuru.com');

          // SIMPLE LOGIC: In Admin Portal, Admin/ComplianceManager/Reviewer = admin (right side), Applicant = partner (left side)
          // Check senderRole from backend (single source of truth)
          let senderType: 'ADMIN' | 'PARTNER' | 'CUSTOMER';
          const senderRoleLower = senderRole.toLowerCase();

          if (
            senderRoleLower === 'admin' ||
            senderRoleLower === 'compliancemanager' ||
            senderRoleLower === 'reviewer' ||
            senderRoleLower === 'administrator'
          ) {
            senderType = 'ADMIN';
          } else if (senderRoleLower === 'applicant' || senderRoleLower === 'partner') {
            senderType = 'PARTNER';
          } else {
            // Fallback for unknown roles
            senderType = hasMukuruEmail ? 'ADMIN' : 'PARTNER';
          }

          console.log('[loadThreadMessages] Determined senderType:', {
            senderType,
            senderRole,
          });

          // Get proper sender name - ALWAYS use thread info to ensure correct names for each side
          let senderDisplayName = '';

          if (senderType === 'PARTNER') {
            // Partner messages: ALWAYS use thread's applicantName to ensure consistency
            senderDisplayName =
              selectedThread?.applicantName ||
              msg.senderName ||
              msg.sender_name ||
              'Partner';
          } else {
            // Admin messages: Use thread's assignedAdminName, or fallback to senderName
            // If senderName exists and doesn't match applicantName, use it (might be different admin)
            if (selectedThread?.assignedAdminName) {
              senderDisplayName = selectedThread.assignedAdminName;
            } else if (
              (msg.senderName || msg.sender_name) &&
              (msg.senderName || msg.sender_name) !== selectedThread?.applicantName
            ) {
              // Use senderName if it's different from applicant name (likely an admin name)
              senderDisplayName = msg.senderName || msg.sender_name || '';
            } else {
              // Try to extract from email or use default
              const senderId = msg.senderId || msg.sender_id || '';
              if (senderId && senderId.includes('@')) {
                const emailParts = senderId.split('@');
                senderDisplayName =
                  emailParts[0]
                    .split('.')
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(' ') || emailParts[0];
              } else {
                senderDisplayName = msg.senderName || msg.sender_name || 'Admin';
              }
            }
          }

          return {
            id: msg.id,
            sender: senderDisplayName,
            senderType: senderType,
            recipient: msg.receiverName || msg.receiver_name || undefined,
            subject: getSubjectFromThread(selectedThread),
            content: msg.content,
            timestamp: msg.sentAt || msg.sent_at || new Date().toISOString(),
            applicationId: selectedThread?.applicationId || '',
            attachments: msg.attachments?.map((a) => ({
              id: a.id,
              fileName: a.fileName,
              contentType: a.contentType,
              fileSizeBytes: a.fileSizeBytes,
              storageKey: a.storageKey,
              storageUrl: a.storageUrl,
              documentId: a.documentId || undefined,
              description: a.description || undefined,
            })),
            isRead: msg.isRead,
            isStarred: msg.isStarred || false,
            priority: determinePriority(msg),
            threadId: msg.threadId,
            replyToMessageId: msg.replyToMessageId || undefined,
          };
        }
      );
      // Sort messages by timestamp: oldest first, newest last (ascending order)
      // This ensures latest messages appear at the bottom
      // Create a new array to avoid mutating the original
      const sortedMessages = [...displayMessages].sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        // Handle invalid dates
        if (isNaN(timeA) && isNaN(timeB)) return 0;
        if (isNaN(timeA)) return 1; // Put invalid dates at end
        if (isNaN(timeB)) return -1; // Put invalid dates at end
        // Ascending: older messages first (smaller timestamp), newer messages last (larger timestamp)
        // This puts latest messages at the bottom
        const diff = timeA - timeB;
        // If timestamps are equal, maintain original order (stable sort)
        return diff !== 0 ? diff : 0;
      });
      console.log(
        '[loadThreadMessages] Sorted messages:',
        sortedMessages.map((m) => ({
          id: m.id,
          timestamp: m.timestamp,
          content: m.content?.substring(0, 30),
        }))
      );
      setMessages(sortedMessages);

      // Scroll to bottom after loading messages to show latest (same logic as partner portal)
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }, 150);

      // Mark unread messages as read (don't await to avoid blocking)
      const unreadMessages = displayMessages.filter((m) => !m.isRead);
      if (unreadMessages.length > 0) {
        // Mark as read in background without blocking
        Promise.all(
          unreadMessages.map((msg) =>
            messagingApi.markMessageRead(msg.id).catch(() => {
              // Errors are already handled in markMessageRead - just prevent unhandled promise rejection
            })
          )
        ).then(() => {
          // Only reload threads/unread count after a delay to avoid refresh loops
          // Use a longer delay and check if component is still mounted
          setTimeout(() => {
            // Only reload if we're not currently loading messages (avoid loops)
            if (!loadingMessages) {
              loadThreads().catch((err) => {
                if (typeof window !== 'undefined') {
                  import('../../lib/sentry-client').then(({ clientSentry }) => {
                    clientSentry.reportError(err, {
                      tags: { error_type: 'messages', operation: 'load_threads' },
                      level: 'error',
                    });
                  });
                }
              });
              loadUnreadCount().catch((err) => {
                if (typeof window !== 'undefined') {
                  import('../../lib/sentry-client').then(({ clientSentry }) => {
                    clientSentry.reportError(err, {
                      tags: { error_type: 'messages', operation: 'load_unread_count' },
                      level: 'warning',
                    });
                  });
                }
              });
            }
          }, 2000);
        });
      }
    } catch (err) {
      logger.error(err, 'Failed to load messages', {
        tags: { error_type: 'messages_load_error' },
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  // mapSenderRole removed - not currently used

  // Determine if message is from admin (for alignment)
  // In admin view: admin messages go on the right, customer/partner messages on the left
  const isFromAdmin = (message: DisplayMessage): boolean => {
    // Primary: Trust backend's senderType field (single source of truth)
    if (message.senderType === 'ADMIN') {
      return true;
    }

    if (message.senderType === 'CUSTOMER' || message.senderType === 'PARTNER') {
      return false;
    }

    // Fallback: Check sender name/email for admin indicators
    if (!message.sender) {
      return false;
    }

    const senderLower = message.sender.toLowerCase();

    // Check for @mukuru.com email domain
    if (senderLower.includes('@mukuru.com')) {
      return true;
    }

    // Check for admin name patterns
    const adminNames = ['admin', 'compliance', 'mukuru', 'manager'];
    if (adminNames.some((name) => senderLower.includes(name))) {
      return true;
    }

    // Default: assume partner/customer (not admin)
    return false;
  };

  const getSubjectFromThread = (thread: MessageThreadDto | null): string => {
    if (!thread) return 'No Subject';
    if (thread.applicationReference) return `Application ${thread.applicationReference}`;
    if (thread.applicationId)
      return `Application ${thread.applicationId.substring(0, 8)}...`;
    return 'Message Thread';
  };

  // Helper to format date safely
  const formatDate = (
    dateString: string | null | undefined,
    format: 'short' | 'full' = 'short'
  ): string => {
    if (!dateString) return '';
    try {
      // Handle various date formats from backend
      let date: Date;
      if (typeof dateString === 'string') {
        // Try parsing as ISO string first
        date = new Date(dateString);
        // If invalid, try parsing as timestamp
        if (isNaN(date.getTime()) && !isNaN(Number(dateString))) {
          date = new Date(Number(dateString));
        }
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        console.warn('[formatDate] Invalid date:', dateString);
        return '';
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (format === 'short') {
        // For thread list - show relative time or date
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      // For full format - show time with date context
      const isToday = date.toDateString() === now.toDateString();
      const isYesterday =
        new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

      if (isToday) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      }
      if (isYesterday) {
        return (
          'Yesterday ' +
          date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        );
      }
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (e) {
      console.warn('[formatDate] Error parsing date:', dateString, e);
      return '';
    }
  };

  // Helper to get sender display name
  const getSenderName = (sender: string | null | undefined): string => {
    if (!sender || sender.trim() === '') return 'User';

    // If it's an email address, extract and format the name part
    if (sender.includes('@')) {
      const emailParts = sender.split('@');
      const namePart = emailParts[0];
      // Convert "john.doe" or "john_doe" to "John Doe"
      return (
        namePart
          .split(/[._-]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ') || 'User'
      );
    }

    // If it contains a comma (e.g., "Doe, John"), handle that
    if (sender.includes(',')) {
      const parts = sender.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        return `${parts[1]} ${parts[0]}`; // "John Doe"
      }
      return parts[0];
    }

    return sender.trim() || 'User';
  };

  const determinePriority = (msg: MessageDto): 'LOW' | 'MEDIUM' | 'HIGH' => {
    // Determine priority based on content or other factors
    const content = msg.content.toLowerCase();
    if (
      content.includes('urgent') ||
      content.includes('asap') ||
      content.includes('immediate')
    ) {
      return 'HIGH';
    }
    return 'MEDIUM';
  };

  const handleSendMessage = async () => {
    if (
      (!newMessage.content.trim() && selectedAttachments.length === 0) ||
      !selectedThread
    ) {
      await SweetAlert.warning(
        'Message Required',
        'Please enter a message or attach a file'
      );
      return;
    }

    // Try to get applicationId - check thread first, then try to get from messages
    let applicationId = selectedThread.applicationId;

    // If thread doesn't have applicationId, try to get it from the first message
    if (!applicationId && messages.length > 0) {
      applicationId = messages[0]?.applicationId || '';
    }

    // If still no applicationId, try to find it from the thread's applicantId
    if (!applicationId && selectedThread.applicantId) {
      try {
        console.info(
          '[Messages] Attempting to find applicationId from applicantId:',
          selectedThread.applicantId
        );
        // Try to search for cases/applications by applicantId
        const searchResponse = await fetch(
          `/api/proxy/projections/v1/cases?searchTerm=${encodeURIComponent(selectedThread.applicantId)}&take=10`
        );
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.items && searchData.items.length > 0) {
            // Try to find a match by applicantId or applicantEmail
            const match = searchData.items.find((item: any) => {
              const itemApplicantId = item.applicantId || item.applicant_id;
              const itemApplicantEmail = item.applicantEmail || item.applicant_email;
              const threadApplicantId = selectedThread.applicantId;
              return (
                itemApplicantId === threadApplicantId ||
                itemApplicantEmail === threadApplicantId ||
                item.id === threadApplicantId
              );
            });
            if (match) {
              applicationId = match.id || match.caseId || match.caseNumber;
              console.info(
                '[Messages] Found applicationId from applicantId search:',
                applicationId
              );
            }
          }
        }
      } catch (error) {
        console.warn(
          '[Messages] Failed to search for applicationId from applicantId:',
          error
        );
      }
    }

    // If still no applicationId, try to get it from applicationReference
    if (!applicationId && selectedThread.applicationReference) {
      applicationId = selectedThread.applicationReference;
      console.info(
        '[Messages] Using applicationReference as applicationId:',
        applicationId
      );
    }

    // If still no applicationId, try to find it from ALL loaded messages (not just first one)
    // Note: DisplayMessage has applicationId, but MessageDto doesn't, so we check DisplayMessage
    if (!applicationId && messages.length > 0) {
      // Search through all messages to find one with applicationId
      for (const msg of messages) {
        if (msg.applicationId) {
          applicationId = msg.applicationId;
          console.info(
            '[Messages] Found applicationId from messages array:',
            applicationId
          );
          // Update the selectedThread state with the found applicationId
          setSelectedThread((prev) => (prev ? { ...prev, applicationId } : null));
          break;
        }
      }
    }

    // Last resort: Use thread ID as applicationId if still not found
    // This can happen when a thread exists but the application was not properly linked
    if (!applicationId) {
      console.warn('[Messages] No applicationId found, using thread ID as fallback');
      applicationId = selectedThread.id;
      // Update the selectedThread state with the thread ID as applicationId
      setSelectedThread((prev) =>
        prev ? { ...prev, applicationId: selectedThread.id } : null
      );
    }

    try {
      setSending(true);
      setError(null);

      // Upload attachments first if any
      let attachmentInfos: Array<{
        fileName: string;
        contentType: string;
        fileSizeBytes: number;
        storageKey: string;
        storageUrl: string;
        documentId?: string;
        description?: string;
      }> = [];

      if (selectedAttachments.length > 0) {
        // Upload files to document service and get storage keys/URLs
        setUploadingAttachments(true);
        setAttachmentUploadProgress({});

        try {
          attachmentInfos = await Promise.all(
            selectedAttachments.map(async (file, _index) => {
              try {
                // Update progress
                setAttachmentUploadProgress((prev) => ({ ...prev, [file.name]: 50 }));

                const uploadResult = await uploadFileToDocumentService(
                  applicationId,
                  file,
                  `Message attachment: ${file.name}`,
                  undefined // Will be extracted from session
                );

                // Mark as complete
                setAttachmentUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

                return {
                  fileName: file.name,
                  contentType: file.type || 'application/octet-stream',
                  fileSizeBytes: file.size,
                  storageKey: uploadResult.storageKey,
                  storageUrl: uploadResult.storageUrl || '',
                  documentId: uploadResult.documentId,
                  description: `Message attachment: ${file.name}`,
                };
              } catch (error) {
                logger.error(error, `Failed to upload attachment ${file.name}`, {
                  tags: { error_type: 'attachment_upload_error' },
                  extra: { fileName: file.name },
                });
                setAttachmentUploadProgress((prev) => ({ ...prev, [file.name]: -1 })); // -1 indicates error

                // Ask user if they want to continue without this attachment
                const shouldContinue = await SweetAlert.confirm(
                  'Upload Failed',
                  `Failed to upload "${file.name}". Do you want to continue sending the message without this attachment?`,
                  'Continue Without It',
                  'Cancel',
                  'warning'
                );

                if (!shouldContinue.isConfirmed) {
                  throw new Error(
                    'User cancelled message send due to attachment upload failure'
                  );
                }

                // Continue with placeholder if user chooses to proceed
                return {
                  fileName: file.name,
                  contentType: file.type || 'application/octet-stream',
                  fileSizeBytes: file.size,
                  storageKey: `messages/${applicationId}/${Date.now()}-${file.name}`,
                  storageUrl: '',
                  description: undefined,
                };
              }
            })
          );
        } catch (error) {
          logger.error(error, 'Error uploading attachments', {
            tags: { error_type: 'attachments_upload_error' },
          });
          if (error instanceof Error && error.message.includes('User cancelled')) {
            setUploadingAttachments(false);
            setAttachmentUploadProgress({});
            return; // User cancelled, don't send message
          }
          await SweetAlert.warning(
            'Upload Warning',
            'Some attachments failed to upload. The message will be sent without attachments.'
          );
        } finally {
          setUploadingAttachments(false);
          setAttachmentUploadProgress({});
        }
      }

      logger.debug('Sending message', {
        applicationId: applicationId,
        content: newMessage.content.substring(0, 50) + '...',
        receiverId: newMessage.receiverId || 'none',
        replyToMessageId: replyingTo?.id,
        attachmentsCount: attachmentInfos.length,
      });

      const result = await messagingApi.sendMessage(
        applicationId,
        newMessage.content.trim(),
        newMessage.receiverId || undefined,
        replyingTo?.id,
        attachmentInfos.length > 0 ? attachmentInfos : undefined
      );

      if (result.success) {
        // Show success indicator
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 3000);

        // Send email notification to partner (non-blocking)
        try {
          // Try to get recipient email from thread or application
          let recipientEmail: string | undefined;
          let recipientName: string | undefined;
          let caseNumber: string | undefined;
          let applicationName: string | undefined;

          // Get from thread if available (thread has applicantName but we need to get email from application)
          if (selectedThread?.applicantName) {
            recipientName = selectedThread.applicantName;
          }
          if (selectedThread?.applicationReference) {
            caseNumber = selectedThread.applicationReference;
          }

          // Always fetch application details to get recipient email
          if (applicationId) {
            try {
              const appResponse = await fetch(`/api/proxy/projections/v1/cases/${applicationId}`);
              if (appResponse.ok) {
                const appData = await appResponse.json();
                recipientEmail = appData.applicantEmail || appData.applicant_email;
                recipientName = appData.applicantFirstName && appData.applicantLastName
                  ? `${appData.applicantFirstName} ${appData.applicantLastName}`.trim()
                  : appData.applicantFirstName || appData.applicantLastName || appData.businessLegalName;
                caseNumber = appData.caseNumber || appData.caseId || applicationId;
                applicationName = appData.businessLegalName || appData.legalName;
              }
            } catch (error) {
              console.warn('Failed to fetch application details for email:', error);
            }
          }

          // Get admin name from session
          let adminName: string | undefined;
          try {
            const sessionResponse = await fetch('/api/auth/session');
            if (sessionResponse.ok) {
              const session = await sessionResponse.json();
              adminName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Support Team';
            }
          } catch (error) {
            console.warn('Failed to get admin name:', error);
          }

          // Send email if we have recipient email and receiverId is set (message to partner)
          if (recipientEmail && newMessage.receiverId) {
            sendMessageNotificationEmail({
              to: recipientEmail,
              recipientName: recipientName || 'Valued Partner',
              caseId: applicationId,
              caseNumber: caseNumber,
              message: newMessage.content.trim().substring(0, 200), // Preview
              adminName: adminName,
              applicationName: applicationName,
            }).catch((error) => {
              // Log error but don't block user flow
              console.warn('Failed to send message notification email:', error);
            });
          }
        } catch (error) {
          // Log error but don't block user flow
          console.warn('Error sending message notification email:', error);
        }

        // Clear the message input and attachments
        setNewMessage({ applicationId: '', content: '', receiverId: '' });
        setSelectedAttachments([]);
        setReplyingTo(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Wait a bit for SignalR to process, then reload messages to ensure proper sender type
        setTimeout(async () => {
          // Reload messages to show the new message with proper sender type
          await loadThreadMessages(selectedThread.id);

          // Refresh threads list to update last message and unread counts
          await loadThreads();
          await loadUnreadCount();

          // Scroll to bottom to show new message (same logic as partner portal)
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop =
                messagesContainerRef.current.scrollHeight;
            }
          }, 150);
        }, 500);
      } else {
        throw new Error(result.errorMessage || 'Failed to send message');
      }
    } catch (err) {
      logger.error(err, 'Failed to send message', {
        tags: { error_type: 'message_send_error' },
      });
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      await SweetAlert.error('Failed to Send', errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleComposeNew = () => {
    setShowCompose(true);
    setSelectedThread(null);
    setMessages([]);
  };

  const filteredThreads = threads.filter((thread) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (thread.applicantName?.toLowerCase() || '').includes(searchLower) ||
      (thread.applicationReference?.toLowerCase() || '').includes(searchLower) ||
      (thread.lastMessage?.content?.toLowerCase() || '').includes(searchLower) ||
      (thread.applicationId?.toLowerCase() || '').includes(searchLower);

    const matchesFilter =
      filterType === 'ALL' ||
      (filterType === 'UNREAD' && thread.unreadCount > 0) ||
      (filterType === 'ACTIVE' && thread.isActive);

    const matchesArchived = filterArchived ? thread.isArchived : !thread.isArchived;
    const matchesStarred = filterStarred ? thread.isStarred : true;

    return matchesSearch && matchesFilter && matchesArchived && matchesStarred;
  });

  // Filter and sort messages: oldest at top, newest at bottom
  // Latest messages should appear at the bottom (ascending order)
  const filteredMessages = [...messages]
    .filter((message) => {
      if (!messageSearchTerm) return true;
      const search = messageSearchTerm.toLowerCase();
      return (
        (message.content || '').toLowerCase().includes(search) ||
        (message.sender || '').toLowerCase().includes(search) ||
        (message.subject || '').toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      // Sort by timestamp: oldest first, newest last (ascending order)
      // This ensures latest messages appear at the bottom
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      // Handle invalid dates
      if (isNaN(timeA) && isNaN(timeB)) return 0;
      if (isNaN(timeA)) return 1; // Put invalid dates at end
      if (isNaN(timeB)) return -1; // Put invalid dates at end
      // Ascending: older messages first (smaller timestamp), newer messages last (larger timestamp)
      const diff = timeA - timeB;
      // If timestamps are equal, maintain original order (stable sort)
      return diff !== 0 ? diff : 0;
    });

  // _getPriorityColor removed - not currently used
  // const _getPriorityColor = (priority: string) => {
  //   switch (priority) {
  //     case 'HIGH':
  //       return 'red';
  //     case 'MEDIUM':
  //       return 'orange';
  //     case 'LOW':
  //       return 'green';
  //     default:
  //       return 'gray';
  //   }
  // };

  // _getSenderTypeColor removed - not currently used

  if (loading) {
    return (
      <Box height="100vh" overflow="hidden" display="flex">
        <AdminSidebar />
        <Box
          ml={condensed ? '72px' : '280px'}
          width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
          p="8"
          bg="mukuru.background.light"
          h="100vh"
          flex="1"
          display="flex"
          alignItems="center"
          justifyContent="center"
          transition="margin-left 0.3s ease, width 0.3s ease"
        >
          <VStack gap="6">
            <Box
              p="6"
              borderRadius="full"
              bg="mukuru.cards.white"
              boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
            >
              <Spinner size="xl" color="mukuru.primary" />
            </Box>
            <VStack gap="2">
              <Typography fontSize="lg" fontWeight="bold" color="mukuru.text.primary">
                Loading Messages
              </Typography>
              <Typography fontSize="sm" color="mukuru.grey.medium">
                Please wait while we fetch your conversations...
              </Typography>
            </VStack>
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box height="100vh" overflow="hidden" display="flex" bg="#F8FAFC" width="100%">
      <AdminSidebar />
      <Box
        ml={condensed ? '72px' : '280px'}
        width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
        bg="#F8FAFC"
        h="100vh"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        flex="1"
        transition="margin-left 0.3s ease, width 0.3s ease"
        position="relative"
      >
        {/* Main Content */}
        <Box
          flex="1"
          display="flex"
          flexDirection="column"
          p="4"
          overflow="hidden"
          minH="0"
          height="100%"
        >
          <VStack
            gap="3"
            align="stretch"
            flex="1"
            minH="0"
            overflow="hidden"
            height="100%"
          >
            {/* Premium Header */}
            <Box
              bg="white"
              borderRadius="16px"
              p="3"
              boxShadow="0 2px 12px rgba(0, 0, 0, 0.06)"
              flexShrink={0}
              position="relative"
              overflow="hidden"
            >
              {/* Subtle gradient accent */}
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="3px"
                bgGradient="linear(to-r, mukuru.primary, mukuru.teal)"
                borderTopRadius="16px"
              />

              <Flex justify="space-between" align="center" pt="1">
                <HStack gap="3">
                  {/* Icon */}
                  <Box
                    w="36px"
                    h="36px"
                    borderRadius="10px"
                    bg="linear-gradient(135deg, #F05423 0%, #FF7A50 100%)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 2px 8px rgba(240, 84, 35, 0.25)"
                  >
                    <IconWrapper>
                      <MailIcon width="18" height="18" color="white" />
                    </IconWrapper>
                  </Box>
                  <VStack align="start" gap="0">
                    <Typography fontSize="md" fontWeight="bold" color="mukuru.charcoal">
                      Messages
                    </Typography>
                    <Typography fontSize="xs" color="mukuru.grey.medium">
                      Communicate with partners and customers
                    </Typography>
                  </VStack>
                </HStack>

                <HStack gap="2">
                  {/* Unread Count Badge */}
                  <Box
                    bg="mukuru.charcoal"
                    color="white"
                    px="2.5"
                    py="1.5"
                    borderRadius="8px"
                    display="flex"
                    alignItems="center"
                    gap="1.5"
                    boxShadow="0 1px 4px rgba(0, 0, 0, 0.12)"
                  >
                    <Box
                      bg="white"
                      color="mukuru.charcoal"
                      w="18px"
                      h="18px"
                      borderRadius="5px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Typography fontSize="2xs" fontWeight="bold">
                        {unreadCount}
                      </Typography>
                    </Box>
                    <Typography fontSize="xs" fontWeight="medium">
                      Unread
                    </Typography>
                  </Box>

                  {/* Connection Status */}
                  {signalRConnected ? (
                    <Box
                      bg="#10B981"
                      color="white"
                      px="2.5"
                      py="1.5"
                      borderRadius="8px"
                      display="flex"
                      alignItems="center"
                      gap="1.5"
                      boxShadow="0 1px 4px rgba(16, 185, 129, 0.25)"
                    >
                      <Box
                        w="6px"
                        h="6px"
                        borderRadius="full"
                        bg="white"
                        boxShadow="0 0 0 2px rgba(255,255,255,0.3)"
                      />
                      <Typography fontSize="xs" fontWeight="semibold">
                        Live
                      </Typography>
                    </Box>
                  ) : (
                    <Tooltip content="Real-time updates unavailable. Messages refresh every 5 seconds. Click to retry connection.">
                      <Box
                        as="button"
                        onClick={async () => {
                          try {
                            await signalRService.reconnect();
                            setSignalRConnected(signalRService.isConnected());
                          } catch (e) {
                            console.warn('[Messages] Failed to reconnect SignalR:', e);
                          }
                        }}
                        bg="#EF4444"
                        color="white"
                        px="2.5"
                        py="1.5"
                        borderRadius="8px"
                        display="flex"
                        alignItems="center"
                        gap="1.5"
                        cursor="pointer"
                        _hover={{ bg: '#DC2626' }}
                        transition="all 0.2s"
                      >
                        <Box
                          w="6px"
                          h="6px"
                          borderRadius="full"
                          bg="white"
                          opacity={0.7}
                        />
                        <Typography fontSize="xs" fontWeight="medium">
                          Offline - Click to retry
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}

                  {/* New Message Button */}
                  <Tooltip content="Create a new message">
                    <Box
                      as="button"
                      onClick={handleComposeNew}
                      bg="linear-gradient(135deg, #F05423 0%, #FF7A50 100%)"
                      color="white"
                      px="3"
                      py="1.5"
                      borderRadius="8px"
                      display="flex"
                      alignItems="center"
                      gap="1.5"
                      cursor="pointer"
                      border="none"
                      boxShadow="0 2px 8px rgba(240, 84, 35, 0.3)"
                      transition="all 0.2s ease"
                      _hover={{
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(240, 84, 35, 0.35)',
                      }}
                      _active={{
                        transform: 'translateY(0)',
                      }}
                    >
                      <IconWrapper>
                        <AddIcon width="14" height="14" />
                      </IconWrapper>
                      <Typography fontWeight="semibold" fontSize="xs">
                        New Message
                      </Typography>
                    </Box>
                  </Tooltip>

                  {/* Refresh Button */}
                  <Tooltip content="Refresh messages">
                    <Box
                      as="button"
                      onClick={() => {
                        loadThreads();
                        loadUnreadCount();
                        if (selectedThread) {
                          loadThreadMessages(selectedThread.id);
                        }
                      }}
                      bg="white"
                      color="mukuru.charcoal"
                      px="2.5"
                      py="1.5"
                      borderRadius="8px"
                      display="flex"
                      alignItems="center"
                      gap="1.5"
                      cursor="pointer"
                      border="1px solid"
                      borderColor="mukuru.grey.light"
                      transition="all 0.2s ease"
                      _hover={{
                        bg: 'mukuru.state.hover',
                        borderColor: 'mukuru.grey.medium',
                      }}
                    >
                      <IconWrapper>
                        <RetryIcon width="14" height="14" />
                      </IconWrapper>
                      <Typography fontWeight="medium" fontSize="xs">
                        Refresh
                      </Typography>
                    </Box>
                  </Tooltip>
                </HStack>
              </Flex>
            </Box>

            {/* Success Alert */}
            {sendSuccess && (
              <Box flexShrink={0}>
                <AlertBar
                  status="success"
                  title="Message sent successfully!"
                  onClose={() => setSendSuccess(false)}
                />
              </Box>
            )}

            {/* Error Alert */}
            {error && (
              <Box flexShrink={0}>
                <AlertBar
                  status="error"
                  title="Error loading messages"
                  description={error}
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setError(null);
                        loadThreads();
                        loadUnreadCount();
                      }}
                    >
                      <IconWrapper>
                        <RetryIcon width="14" height="14" />
                      </IconWrapper>
                      Retry
                    </Button>
                  }
                />
              </Box>
            )}

            {/* Main Content Area - Two Column Layout */}
            <Flex
              gap="3"
              flex="1"
              minH="0"
              align="stretch"
              overflow="hidden"
              width="100%"
              height="100%"
              position="relative"
            >
              {/* Threads List - Left Panel */}
              <Box
                width="320px"
                minWidth="280px"
                maxWidth="360px"
                display="flex"
                flexDirection="column"
                overflow="hidden"
                flexShrink={0}
                bg="white"
                boxShadow="0 2px 12px rgba(0, 0, 0, 0.06)"
                borderRadius="14px"
                height="100%"
                minH="0"
                position="relative"
              >
                {/* Panel Header with gradient */}
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  right="0"
                  h="3px"
                  bgGradient="linear(to-r, mukuru.teal, mukuru.primary)"
                  borderTopRadius="14px"
                />

                {/* Search and Filter Header */}
                <Box
                  p="3"
                  pt="4"
                  borderBottom="1px solid"
                  borderColor="#E5E7EB"
                  bg="white"
                  flexShrink={0}
                  borderTopRadius="14px"
                >
                  <VStack gap="2.5" align="stretch">
                    {/* Search */}
                    <Box width="100%">
                      <Search
                        placeholder="Search messages..."
                        onSearchChange={(query) => setSearchTerm(query)}
                      />
                    </Box>

                    {/* Filter Dropdown - Full Width */}
                    <Box width="100%" position="relative" zIndex="10">
                      <Dropdown
                        items={[
                          { label: 'All Messages', value: 'ALL' },
                          { label: 'Unread Only', value: 'UNREAD' },
                          { label: 'Active Only', value: 'ACTIVE' },
                        ]}
                        placeholder="Filter by status"
                        defaultValue={filterType}
                        onSelectionChange={(selectedValue) =>
                          setFilterType(selectedValue as string)
                        }
                      />
                    </Box>

                    {/* Quick Filter Toggles */}
                    <HStack gap="1.5" align="center" flexWrap="wrap">
                      <Box
                        as="button"
                        px="2"
                        py="1"
                        borderRadius="6px"
                        bg={filterArchived ? 'mukuru.primary' : 'white'}
                        color={filterArchived ? 'white' : 'mukuru.charcoal'}
                        border="1px solid"
                        borderColor={filterArchived ? 'mukuru.primary' : '#E5E7EB'}
                        cursor="pointer"
                        transition="all 0.2s"
                        onClick={() => setFilterArchived(!filterArchived)}
                        boxShadow={
                          filterArchived
                            ? '0 1px 4px rgba(240, 84, 35, 0.2)'
                            : '0 1px 2px rgba(0,0,0,0.04)'
                        }
                        _hover={{
                          bg: filterArchived ? 'mukuru.primary' : '#F8FAFC',
                          transform: 'translateY(-1px)',
                        }}
                        display="flex"
                        alignItems="center"
                        gap="1.5"
                      >
                        <Box
                          w="12px"
                          h="12px"
                          borderRadius="3px"
                          border="1.5px solid"
                          borderColor={filterArchived ? 'white' : '#CBD5E1'}
                          bg={filterArchived ? 'white' : 'transparent'}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          {filterArchived && (
                            <Box w="6px" h="6px" borderRadius="1px" bg="mukuru.primary" />
                          )}
                        </Box>
                        <Typography fontSize="2xs" fontWeight="semibold">
                          Hide Archived
                        </Typography>
                      </Box>

                      <Box
                        as="button"
                        px="2"
                        py="1"
                        borderRadius="6px"
                        bg={filterStarred ? '#FEF3C7' : 'white'}
                        color={filterStarred ? '#B45309' : 'mukuru.charcoal'}
                        border="1px solid"
                        borderColor={filterStarred ? '#F59E0B' : '#E5E7EB'}
                        cursor="pointer"
                        transition="all 0.2s"
                        onClick={() => setFilterStarred(!filterStarred)}
                        boxShadow={
                          filterStarred
                            ? '0 1px 4px rgba(245, 158, 11, 0.2)'
                            : '0 1px 2px rgba(0,0,0,0.04)'
                        }
                        _hover={{
                          bg: filterStarred ? '#FEF3C7' : '#F8FAFC',
                          transform: 'translateY(-1px)',
                        }}
                        display="flex"
                        alignItems="center"
                        gap="1.5"
                      >
                        <IconWrapper>
                          <StarIcon width="12" height="12" />
                        </IconWrapper>
                        <Typography fontSize="2xs" fontWeight="semibold">
                          Starred Only
                        </Typography>
                      </Box>
                    </HStack>
                  </VStack>
                </Box>

                {/* Threads List */}
                <Box
                  flex="1"
                  overflowY="auto"
                  overflowX="hidden"
                  minH="0"
                  p="2.5"
                  bg="#F8FAFC"
                  position="relative"
                  borderBottomRadius="14px"
                  css={{
                    '&::-webkit-scrollbar': {
                      width: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#CBD5E1',
                      borderRadius: '2px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#94A3B8',
                    },
                  }}
                >
                  {filteredThreads.length === 0 && !loading ? (
                    <Flex justify="center" align="center" height="100%" minH="200px">
                      <VStack gap="3" textAlign="center" maxW="220px">
                        <Box
                          w="56px"
                          h="56px"
                          borderRadius="14px"
                          bg="white"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 2px 8px rgba(0, 0, 0, 0.06)"
                        >
                          <IconWrapper>
                            <MailIcon width="24" height="24" />
                          </IconWrapper>
                        </Box>
                        <VStack gap="0.5">
                          <Typography
                            color="mukuru.text.primary"
                            fontSize="sm"
                            fontWeight="bold"
                          >
                            No messages found
                          </Typography>
                          {searchTerm || filterType !== 'ALL' ? (
                            <Typography
                              color="mukuru.grey.medium"
                              fontSize="xs"
                              lineHeight="1.4"
                            >
                              Try adjusting your search or filter criteria
                            </Typography>
                          ) : (
                            <Typography
                              color="mukuru.grey.medium"
                              fontSize="xs"
                              lineHeight="1.4"
                            >
                              Messages will appear here when available
                            </Typography>
                          )}
                        </VStack>
                      </VStack>
                    </Flex>
                  ) : filteredThreads.length === 0 && loading ? (
                    <Flex justify="center" align="center" height="100%" minH="200px">
                      <VStack gap="2.5">
                        <Spinner size="md" color="mukuru.primary" />
                        <Typography
                          fontSize="xs"
                          color="mukuru.grey.medium"
                          fontWeight="medium"
                        >
                          Loading messages...
                        </Typography>
                      </VStack>
                    </Flex>
                  ) : (
                    <VStack gap="2" align="stretch">
                      {filteredThreads.map((thread) => (
                        <Box
                          key={thread.id}
                          p="3"
                          borderRadius="12px"
                          cursor="pointer"
                          bg="white"
                          border="1px solid"
                          borderColor={
                            thread.id === selectedThread?.id
                              ? 'mukuru.primary'
                              : '#E5E7EB'
                          }
                          boxShadow={
                            thread.id === selectedThread?.id
                              ? '0 2px 8px rgba(240, 84, 35, 0.15)'
                              : '0 1px 3px rgba(0, 0, 0, 0.05)'
                          }
                          _hover={{
                            borderColor:
                              thread.id === selectedThread?.id
                                ? 'mukuru.primary'
                                : '#D1D5DB',
                            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.08)',
                            transform: 'translateY(-1px)',
                          }}
                          onClick={() => setSelectedThread(thread)}
                          transition="all 0.2s ease"
                          position="relative"
                          overflow="hidden"
                        >
                          {/* Selection indicator */}
                          {thread.id === selectedThread?.id && (
                            <Box
                              position="absolute"
                              left="0"
                              top="0"
                              bottom="0"
                              width="3px"
                              bgGradient="linear(to-b, mukuru.primary, #FF7A50)"
                            />
                          )}

                          <HStack gap="2.5" align="start">
                            {/* Avatar */}
                            <Box
                              w="36px"
                              h="36px"
                              borderRadius="10px"
                              bg={
                                thread.id === selectedThread?.id
                                  ? 'mukuru.primary'
                                  : 'mukuru.teal'
                              }
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              flexShrink={0}
                              boxShadow={
                                thread.id === selectedThread?.id
                                  ? '0 2px 6px rgba(240, 84, 35, 0.25)'
                                  : '0 1px 3px rgba(0, 0, 0, 0.1)'
                              }
                            >
                              <Typography fontSize="sm" fontWeight="bold" color="white">
                                {(thread.applicantName || 'U').charAt(0).toUpperCase()}
                              </Typography>
                            </Box>

                            <VStack gap="1.5" align="stretch" flex="1" minW="0">
                              <Flex justify="space-between" align="start">
                                <HStack gap="2" flex="1" minW="0">
                                  <Typography
                                    fontSize="sm"
                                    fontWeight="semibold"
                                    color="mukuru.charcoal"
                                    overflow="hidden"
                                    textOverflow="ellipsis"
                                    whiteSpace="nowrap"
                                  >
                                    {thread.applicantName}
                                  </Typography>
                                  {thread.unreadCount > 0 && (
                                    <Box
                                      px="1.5"
                                      py="0.5"
                                      borderRadius="full"
                                      bg="mukuru.primary"
                                      color="white"
                                      fontSize="2xs"
                                      fontWeight="bold"
                                      minW="18px"
                                      textAlign="center"
                                      lineHeight="1.2"
                                    >
                                      {thread.unreadCount}
                                    </Box>
                                  )}
                                </HStack>
                                <Typography
                                  fontSize="2xs"
                                  color="#9CA3AF"
                                  flexShrink={0}
                                  ml="2"
                                  fontWeight="medium"
                                >
                                  {formatDate(thread.lastMessageAt) || 'Recent'}
                                </Typography>
                              </Flex>

                              {thread.lastMessage?.content && (
                                <Typography
                                  fontSize="xs"
                                  color="#6B7280"
                                  lineHeight="1.4"
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {thread.lastMessage.content}
                                </Typography>
                              )}

                              <HStack gap="2" fontSize="2xs">
                                {(thread.applicationReference ||
                                  thread.applicationId) && (
                                  <Box
                                    px="2"
                                    py="0.5"
                                    borderRadius="6px"
                                    bg="#F3F4F6"
                                    border="1px solid"
                                    borderColor="#E5E7EB"
                                  >
                                    <Typography
                                      fontSize="2xs"
                                      fontWeight="medium"
                                      color="#6B7280"
                                    >
                                      {thread.applicationReference ||
                                        thread.applicationId?.substring(0, 8)}
                                    </Typography>
                                  </Box>
                                )}
                                {(thread.applicationReference || thread.applicationId) &&
                                  thread.messageCount !== undefined && (
                                    <Typography color="#D1D5DB">•</Typography>
                                  )}
                                {thread.messageCount !== undefined && (
                                  <Typography
                                    fontSize="2xs"
                                    fontWeight="medium"
                                    color="#9CA3AF"
                                  >
                                    {thread.messageCount}{' '}
                                    {thread.messageCount === 1 ? 'msg' : 'msgs'}
                                  </Typography>
                                )}
                              </HStack>
                            </VStack>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
              </Box>

              {/* Message Details - Right Panel */}
              <Box
                flex="1"
                display="flex"
                flexDirection="column"
                overflow="hidden"
                minW="0"
                minWidth="400px"
                bg="white"
                boxShadow="0 2px 12px rgba(0, 0, 0, 0.06)"
                borderRadius="14px"
                height="100%"
                minH="0"
                position="relative"
              >
                {/* Panel Header with gradient */}
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  right="0"
                  h="3px"
                  bgGradient="linear(to-r, mukuru.primary, mukuru.teal)"
                  borderTopRadius="14px"
                  zIndex="1"
                />
                {selectedThread ? (
                  <>
                    {/* Thread Header */}
                    <Box
                      p="3"
                      pt="4"
                      borderBottom="1px solid"
                      borderColor="#E5E7EB"
                      bg="white"
                      flexShrink={0}
                      borderTopRadius="14px"
                    >
                      <Flex justify="space-between" align="start" gap="3">
                        <HStack gap="2.5" flex="1" align="start">
                          {/* Avatar */}
                          <Box
                            w="36px"
                            h="36px"
                            borderRadius="10px"
                            bg="linear-gradient(135deg, #F05423 0%, #FF7A50 100%)"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            boxShadow="0 2px 8px rgba(240, 84, 35, 0.2)"
                            flexShrink={0}
                          >
                            <Typography fontSize="sm" fontWeight="bold" color="white">
                              {(selectedThread.applicantName || 'U')
                                .charAt(0)
                                .toUpperCase()}
                            </Typography>
                          </Box>

                          <VStack align="start" gap="1" flex="1">
                            {/* Title and Applicant */}
                            <VStack align="start" gap="0">
                              <Typography
                                fontSize="sm"
                                fontWeight="bold"
                                color="mukuru.charcoal"
                              >
                                {getSubjectFromThread(selectedThread)}
                              </Typography>
                              <HStack gap="1.5" align="center">
                                <Box w="6px" h="6px" borderRadius="full" bg="#10B981" />
                                <Typography
                                  fontSize="xs"
                                  color="mukuru.grey.mediumDark"
                                  fontWeight="medium"
                                >
                                  {selectedThread.applicantName}
                                </Typography>
                              </HStack>
                            </VStack>

                            {/* Meta Info Pills */}
                            <HStack gap="1.5" flexWrap="wrap">
                              <HStack
                                gap="1"
                                bg="#F8FAFC"
                                px="2"
                                py="0.5"
                                borderRadius="5px"
                                border="1px solid"
                                borderColor="#E5E7EB"
                              >
                                <IconWrapper>
                                  <UserIcon width="10" height="10" />
                                </IconWrapper>
                                <Typography
                                  fontSize="2xs"
                                  fontWeight="medium"
                                  color="mukuru.charcoal"
                                >
                                  {selectedThread.assignedAdminName || 'Unassigned'}
                                </Typography>
                              </HStack>
                              <HStack
                                gap="1"
                                bg="#F8FAFC"
                                px="2"
                                py="0.5"
                                borderRadius="5px"
                                border="1px solid"
                                borderColor="#E5E7EB"
                              >
                                <IconWrapper>
                                  <MailIcon width="10" height="10" />
                                </IconWrapper>
                                <Typography
                                  fontSize="2xs"
                                  fontWeight="medium"
                                  color="mukuru.charcoal"
                                >
                                  {selectedThread.messageCount} messages
                                </Typography>
                              </HStack>
                            </HStack>
                          </VStack>
                        </HStack>

                        {/* Action Button */}
                        <NextLink href={`/applications/${selectedThread.applicationId}`}>
                          <Box
                            as="button"
                            bg="#F8FAFC"
                            color="mukuru.charcoal"
                            px="2.5"
                            py="1.5"
                            borderRadius="8px"
                            display="flex"
                            alignItems="center"
                            gap="1.5"
                            cursor="pointer"
                            border="1px solid"
                            borderColor="#E5E7EB"
                            transition="all 0.2s ease"
                            _hover={{
                              bg: 'white',
                              borderColor: 'mukuru.primary',
                              color: 'mukuru.primary',
                              boxShadow: '0 2px 8px rgba(240, 84, 35, 0.15)',
                            }}
                          >
                            <Typography fontWeight="medium" fontSize="xs">
                              View Application
                            </Typography>
                          </Box>
                        </NextLink>
                      </Flex>
                    </Box>

                    {/* Messages List */}
                    <Box
                      ref={messagesContainerRef}
                      flex="1"
                      overflowY="auto"
                      overflowX="hidden"
                      p="3"
                      bg={bgColor}
                      minH="0"
                      display="flex"
                      flexDirection="column"
                      position="relative"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                      {loadingMessages ? (
                        <Flex justify="center" align="center" h="150px">
                          <Spinner size="sm" color="mukuru.primary" />
                        </Flex>
                      ) : filteredMessages.length === 0 ? (
                        <Flex justify="center" align="center" height="100%" minH="200px">
                          <VStack gap="2">
                            <Box
                              p="3"
                              borderRadius="full"
                              bg="mukuru.state.hover"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <MailIcon
                                width="24"
                                height="24"
                                color="mukuru.grey.medium"
                              />
                            </Box>
                            <Typography
                              color="mukuru.grey.medium"
                              fontSize="xs"
                              fontWeight="medium"
                            >
                              {messageSearchTerm
                                ? 'No messages match your search'
                                : 'No messages in this thread'}
                            </Typography>
                            {messageSearchTerm && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setMessageSearchTerm('')}
                              >
                                <Typography
                                  color="mukuru.text.primary"
                                  fontSize="xs"
                                  fontWeight="medium"
                                >
                                  Clear Search
                                </Typography>
                              </Button>
                            )}
                          </VStack>
                        </Flex>
                      ) : (
                        <VStack gap="2" align="stretch" width="100%">
                          {filteredMessages.map((message) => {
                            const isAdmin = isFromAdmin(message);
                            // Enhanced debug logging - log ALL messages
                            console.log('[Messages] Rendering message:', {
                              sender: message.sender,
                              senderType: message.senderType,
                              isAdmin,
                              willAlignRight: isAdmin,
                              messageId: message.id,
                            });
                            return (
                              <Flex
                                key={message.id}
                                justify={isAdmin ? 'flex-end' : 'flex-start'}
                                align="flex-start"
                                gap="1.5"
                                px="1"
                              >
                                {!isAdmin && (
                                  <Box
                                    w="28px"
                                    h="28px"
                                    borderRadius="8px"
                                    bg="mukuru.teal"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    flexShrink={0}
                                  >
                                    <Typography
                                      fontSize="2xs"
                                      fontWeight="bold"
                                      color="white"
                                    >
                                      {getSenderName(message.sender)
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </Typography>
                                  </Box>
                                )}
                                <Box
                                  maxW="70%"
                                  p="3"
                                  style={{
                                    backgroundColor: isAdmin ? '#F05423' : '#FFFFFF',
                                    color: isAdmin ? '#FFFFFF' : '#1F2937',
                                  }}
                                  borderRadius="12px"
                                  borderTopLeftRadius={!isAdmin ? '4px' : '12px'}
                                  borderTopRightRadius={isAdmin ? '4px' : '12px'}
                                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1)"
                                  border={isAdmin ? 'none' : '1px solid'}
                                  borderColor={isAdmin ? 'transparent' : '#E5E7EB'}
                                  position="relative"
                                >
                                  <VStack gap="1.5" align="stretch">
                                    <Flex justify="space-between" align="center" gap="2">
                                      <Box
                                        as="span"
                                        fontSize="xs"
                                        fontWeight="semibold"
                                        style={{ color: isAdmin ? '#FFFFFF' : '#1F2937' }}
                                      >
                                        {getSenderName(message.sender)}
                                      </Box>
                                      <Box
                                        as="span"
                                        fontSize="2xs"
                                        style={{
                                          color: isAdmin
                                            ? 'rgba(255, 255, 255, 0.7)'
                                            : '#9CA3AF',
                                        }}
                                      >
                                        {formatDate(message.timestamp, 'full') ||
                                          'Just now'}
                                      </Box>
                                    </Flex>

                                    <Box
                                      as="p"
                                      fontSize="sm"
                                      whiteSpace="pre-wrap"
                                      lineHeight="1.5"
                                      style={{
                                        color: isAdmin ? '#FFFFFF' : '#374151',
                                        margin: 0,
                                      }}
                                    >
                                      {message.content || ''}
                                    </Box>

                                    {message.attachments &&
                                      message.attachments.length > 0 && (
                                        <Box
                                          mt="2"
                                          p="2"
                                          bg={
                                            isAdmin ? 'rgba(255,255,255,0.1)' : '#F9FAFB'
                                          }
                                          borderRadius="8px"
                                          border="1px solid"
                                          borderColor={
                                            isAdmin ? 'rgba(255,255,255,0.2)' : '#E5E7EB'
                                          }
                                        >
                                          <VStack gap="1.5" align="stretch">
                                            {message.attachments.map(
                                              (attachment, idx) => (
                                                <HStack
                                                  key={idx}
                                                  gap="1.5"
                                                  justify="space-between"
                                                >
                                                  <HStack gap="2" flex="1" minW="0">
                                                    <Box
                                                      p="1.5"
                                                      borderRadius="6px"
                                                      bg={
                                                        isAdmin
                                                          ? 'rgba(255,255,255,0.15)'
                                                          : '#E5E7EB'
                                                      }
                                                    >
                                                      <IconWrapper>
                                                        <DownloadIcon
                                                          width="12"
                                                          height="12"
                                                        />
                                                      </IconWrapper>
                                                    </Box>
                                                    <VStack
                                                      align="start"
                                                      gap="0"
                                                      flex="1"
                                                      minW="0"
                                                    >
                                                      <Box
                                                        as="span"
                                                        fontSize="xs"
                                                        fontWeight="medium"
                                                        overflow="hidden"
                                                        textOverflow="ellipsis"
                                                        whiteSpace="nowrap"
                                                        style={{
                                                          color: isAdmin
                                                            ? '#FFFFFF'
                                                            : '#374151',
                                                        }}
                                                      >
                                                        {attachment.fileName ||
                                                          `Attachment ${idx + 1}`}
                                                      </Box>
                                                      <Box
                                                        as="span"
                                                        fontSize="2xs"
                                                        style={{
                                                          color: isAdmin
                                                            ? 'rgba(255,255,255,0.7)'
                                                            : '#9CA3AF',
                                                        }}
                                                      >
                                                        {(
                                                          attachment.fileSizeBytes / 1024
                                                        ).toFixed(1)}{' '}
                                                        KB
                                                      </Box>
                                                    </VStack>
                                                  </HStack>
                                                  {(attachment.storageUrl ||
                                                    attachment.storageKey) && (
                                                    <Button
                                                      size="sm"
                                                      variant={
                                                        isAdmin ? 'primary' : 'secondary'
                                                      }
                                                      onClick={async () => {
                                                        try {
                                                          let downloadUrl =
                                                            attachment.storageUrl;

                                                          // If no storageUrl, generate one from storageKey
                                                          if (
                                                            !downloadUrl &&
                                                            attachment.storageKey
                                                          ) {
                                                            try {
                                                              const response =
                                                                await fetch(
                                                                  `/api/proxy/api/v1/documents/download/${encodeURIComponent(attachment.storageKey)}`
                                                                );
                                                              if (response.ok) {
                                                                const result =
                                                                  await response.json();
                                                                downloadUrl =
                                                                  result.url ||
                                                                  result.downloadUrl ||
                                                                  '';
                                                              }
                                                            } catch (error) {
                                                              logger.error(
                                                                error,
                                                                'Failed to get download URL',
                                                                {
                                                                  tags: {
                                                                    error_type:
                                                                      'download_url_error',
                                                                  },
                                                                }
                                                              );
                                                            }
                                                          }

                                                          // If we have documentId, try to get download URL from document service
                                                          if (
                                                            !downloadUrl &&
                                                            attachment.documentId
                                                          ) {
                                                            try {
                                                              const response =
                                                                await fetch(
                                                                  `/api/proxy/api/v1/documents/${attachment.documentId}/download`
                                                                );
                                                              if (response.ok) {
                                                                const result =
                                                                  await response.json();
                                                                downloadUrl =
                                                                  result.url ||
                                                                  result.downloadUrl ||
                                                                  '';
                                                              }
                                                            } catch (error) {
                                                              logger.error(
                                                                error,
                                                                'Failed to get document download URL',
                                                                {
                                                                  tags: {
                                                                    error_type:
                                                                      'document_download_url_error',
                                                                  },
                                                                }
                                                              );
                                                            }
                                                          }

                                                          if (downloadUrl) {
                                                            window.open(
                                                              downloadUrl,
                                                              '_blank'
                                                            );
                                                          } else {
                                                            await SweetAlert.warning(
                                                              'Download Unavailable',
                                                              'Download URL is not available for this attachment.'
                                                            );
                                                          }
                                                        } catch (error) {
                                                          logger.error(
                                                            error,
                                                            'Error downloading attachment',
                                                            {
                                                              tags: {
                                                                error_type:
                                                                  'attachment_download_error',
                                                              },
                                                            }
                                                          );
                                                          await SweetAlert.error(
                                                            'Download Failed',
                                                            'Failed to download attachment. Please try again.'
                                                          );
                                                        }
                                                      }}
                                                      flexShrink={0}
                                                    >
                                                      <IconWrapper>
                                                        <DownloadIcon
                                                          width="12"
                                                          height="12"
                                                        />
                                                      </IconWrapper>
                                                      <Typography ml="1">
                                                        Download
                                                      </Typography>
                                                    </Button>
                                                  )}
                                                </HStack>
                                              )
                                            )}
                                          </VStack>
                                        </Box>
                                      )}

                                    {/* Reply context */}
                                    {message.replyToMessageId && (
                                      <Box
                                        mt="2"
                                        p="2"
                                        bg={
                                          isAdmin
                                            ? 'mukuru.primary'
                                            : 'mukuru.state.hover'
                                        }
                                        borderRadius="md"
                                        borderLeft={isAdmin ? 'none' : '3px'}
                                        borderColor={
                                          isAdmin ? 'transparent' : 'mukuru.teal'
                                        }
                                      >
                                        <Typography
                                          fontSize="2xs"
                                          color={
                                            isAdmin
                                              ? 'mukuru.white'
                                              : 'mukuru.grey.medium'
                                          }
                                          fontStyle="italic"
                                          style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                          }}
                                        >
                                          Replying to:{' '}
                                          {messages
                                            .find(
                                              (m) => m.id === message.replyToMessageId
                                            )
                                            ?.content?.substring(0, 100) ||
                                            'Previous message'}
                                        </Typography>
                                      </Box>
                                    )}

                                    {/* Message actions */}
                                    <HStack gap="1" mt="2" justify="flex-end">
                                      <Box
                                        as="button"
                                        p="1.5"
                                        borderRadius="6px"
                                        cursor="pointer"
                                        transition="all 0.15s"
                                        bg="transparent"
                                        _hover={{
                                          bg: isAdmin
                                            ? 'rgba(255,255,255,0.1)'
                                            : '#F3F4F6',
                                        }}
                                        onClick={() => setReplyingTo(message)}
                                        title="Reply"
                                        style={{ color: isAdmin ? '#FFFFFF' : '#9CA3AF' }}
                                      >
                                        <ForwardToInboxIcon
                                          width="14"
                                          height="14"
                                          color={isAdmin ? '#FFFFFF' : '#9CA3AF'}
                                        />
                                      </Box>
                                      <Box
                                        as="button"
                                        p="1.5"
                                        borderRadius="6px"
                                        cursor="pointer"
                                        transition="all 0.15s"
                                        bg="transparent"
                                        _hover={{
                                          bg: isAdmin
                                            ? 'rgba(255,255,255,0.1)'
                                            : '#F3F4F6',
                                        }}
                                        onClick={() => setForwardingMessage(message)}
                                        title="Forward"
                                        style={{ color: isAdmin ? '#FFFFFF' : '#9CA3AF' }}
                                      >
                                        <ShareIcon
                                          width="14"
                                          height="14"
                                          color={isAdmin ? '#FFFFFF' : '#9CA3AF'}
                                        />
                                      </Box>
                                      <Box
                                        as="button"
                                        p="1.5"
                                        borderRadius="6px"
                                        cursor="pointer"
                                        transition="all 0.15s"
                                        bg="transparent"
                                        _hover={{
                                          bg: isAdmin
                                            ? 'rgba(255,255,255,0.1)'
                                            : '#FEF3C7',
                                        }}
                                        style={{ color: isAdmin ? '#FFFFFF' : '#9CA3AF' }}
                                        onClick={async () => {
                                          try {
                                            const result = await messagingApi.starMessage(
                                              message.id
                                            );
                                            if (result.success) {
                                              // Refresh messages to show updated star status
                                              if (selectedThread) {
                                                await loadThreadMessages(
                                                  selectedThread.id
                                                );
                                              }
                                            }
                                          } catch (error) {
                                            logger.error(
                                              error,
                                              'Failed to star message',
                                              {
                                                tags: {
                                                  error_type: 'star_message_error',
                                                },
                                              }
                                            );
                                          }
                                        }}
                                        title={message.isStarred ? 'Unstar' : 'Star'}
                                      >
                                        <StarIcon
                                          width="14"
                                          height="14"
                                          color={
                                            isAdmin
                                              ? '#FFFFFF'
                                              : message.isStarred
                                                ? '#F59E0B'
                                                : '#9CA3AF'
                                          }
                                        />
                                      </Box>
                                      <Box
                                        as="button"
                                        p="1.5"
                                        borderRadius="6px"
                                        cursor="pointer"
                                        transition="all 0.15s"
                                        bg="transparent"
                                        _hover={{
                                          bg: isAdmin
                                            ? 'rgba(255,255,255,0.1)'
                                            : '#FEE2E2',
                                        }}
                                        style={{ color: isAdmin ? '#FFFFFF' : '#EF4444' }}
                                        onClick={async () => {
                                          const result = await SweetAlert.confirm(
                                            'Delete Message',
                                            'Are you sure you want to delete this message? This action cannot be undone.',
                                            'Yes, delete it!',
                                            'Cancel',
                                            'warning'
                                          );

                                          if (!result.isConfirmed) return;

                                          try {
                                            SweetAlert.loading(
                                              'Deleting...',
                                              'Please wait while we delete the message.'
                                            );
                                            const deleteResult =
                                              await messagingApi.deleteMessage(
                                                message.id
                                              );
                                            if (deleteResult.success) {
                                              // Remove message from list
                                              setMessages((prev) =>
                                                prev.filter((m) => m.id !== message.id)
                                              );
                                              // Refresh threads
                                              await loadThreads();
                                              SweetAlert.close();
                                              await SweetAlert.success(
                                                'Deleted!',
                                                'Message has been deleted successfully.'
                                              );
                                            } else {
                                              SweetAlert.close();
                                              await SweetAlert.error(
                                                'Delete Failed',
                                                deleteResult.errorMessage ||
                                                  'Failed to delete message'
                                              );
                                            }
                                          } catch (error) {
                                            logger.error(
                                              error,
                                              'Failed to delete message',
                                              {
                                                tags: {
                                                  error_type: 'delete_message_error',
                                                },
                                              }
                                            );
                                            SweetAlert.close();
                                            await SweetAlert.error(
                                              'Delete Failed',
                                              'Failed to delete message. Please try again.'
                                            );
                                          }
                                        }}
                                        title="Delete"
                                      >
                                        <DeleteIcon
                                          width="14"
                                          height="14"
                                          color={isAdmin ? '#FFFFFF' : '#9CA3AF'}
                                        />
                                      </Box>
                                    </HStack>
                                  </VStack>
                                </Box>
                                {isAdmin && (
                                  <Box
                                    w="28px"
                                    h="28px"
                                    borderRadius="8px"
                                    bg="mukuru.primary"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    flexShrink={0}
                                  >
                                    <Typography
                                      fontSize="2xs"
                                      fontWeight="bold"
                                      color="white"
                                    >
                                      {getSenderName(message.sender)
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </Typography>
                                  </Box>
                                )}
                              </Flex>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </VStack>
                      )}
                    </Box>

                    {/* Reply Section */}
                    <Box
                      p="3"
                      borderTop="1px solid"
                      borderColor="mukuru.grey.light"
                      bg="mukuru.cards.white"
                      flexShrink={0}
                      borderBottomRadius="12px"
                    >
                      <VStack gap="2" align="stretch">
                        {/* Reply context */}
                        {replyingTo && (
                          <Box
                            p="2"
                            bg="mukuru.state.hover"
                            borderRadius="8px"
                            borderLeft="3px solid"
                            borderLeftColor="mukuru.primary"
                          >
                            <HStack justify="space-between" align="start">
                              <VStack align="start" gap="0.5" flex="1" minW="0">
                                <Typography
                                  fontSize="2xs"
                                  fontWeight="bold"
                                  color="mukuru.primary"
                                >
                                  Replying to {replyingTo.sender}
                                </Typography>
                                <Typography
                                  fontSize="2xs"
                                  color="mukuru.grey.mediumDark"
                                  overflow="hidden"
                                  textOverflow="ellipsis"
                                  whiteSpace="nowrap"
                                >
                                  {replyingTo.content?.substring(0, 100) || ''}
                                </Typography>
                              </VStack>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setReplyingTo(null)}
                              >
                                <IconWrapper>
                                  <CloseIcon width="12" height="12" />
                                </IconWrapper>
                              </Button>
                            </HStack>
                          </Box>
                        )}

                        <Textarea
                          placeholder={
                            replyingTo
                              ? `Reply to ${replyingTo.sender}...`
                              : 'Type your message...'
                          }
                          value={newMessage.content}
                          onChange={(e) => {
                            setNewMessage((prev) => ({
                              ...prev,
                              content: e.target.value,
                            }));
                            // Send typing indicator (errors handled in service)
                            if (
                              selectedThread &&
                              signalRConnected &&
                              e.target.value.length > 0
                            ) {
                              signalRService
                                .sendTypingIndicator(selectedThread.id)
                                .catch(() => {
                                  // Errors are already handled in signalRService
                                });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          size="sm"
                          rows={2}
                          resize="none"
                          fontSize="xs"
                          color="mukuru.text.primary"
                          bg="mukuru.background.light"
                          border="1px solid"
                          borderColor="mukuru.grey.light"
                          borderRadius="8px"
                          p="2.5"
                          _focus={{
                            color: 'mukuru.text.primary',
                            borderColor: 'mukuru.primary',
                            boxShadow: '0 0 0 1px var(--chakra-colors-mukuru-primary)',
                          }}
                          _placeholder={{ color: 'mukuru.grey.medium' }}
                        />

                        {/* Selected attachments */}
                        {selectedAttachments.length > 0 && (
                          <VStack gap="1.5" align="stretch">
                            {selectedAttachments.map((file, idx) => {
                              const progress = attachmentUploadProgress[file.name];
                              const hasError = progress === -1;
                              const isUploading =
                                progress !== undefined && progress > 0 && progress < 100;

                              return (
                                <HStack
                                  key={idx}
                                  p="2"
                                  bg="mukuru.state.hover"
                                  borderRadius="md"
                                  justify="space-between"
                                  border={hasError ? '1px' : 'none'}
                                  borderColor={
                                    hasError ? 'mukuru.text.error' : 'transparent'
                                  }
                                >
                                  <HStack gap="2" flex="1" minW="0">
                                    <IconWrapper>
                                      <DownloadIcon width="12" height="12" />
                                    </IconWrapper>
                                    <VStack align="start" gap="0" flex="1" minW="0">
                                      <Typography
                                        fontSize="xs"
                                        fontWeight="medium"
                                        overflow="hidden"
                                        textOverflow="ellipsis"
                                        whiteSpace="nowrap"
                                        color={
                                          hasError
                                            ? 'mukuru.text.error'
                                            : 'mukuru.text.primary'
                                        }
                                      >
                                        {file.name}
                                      </Typography>
                                      <HStack gap="2" align="center">
                                        <Typography
                                          fontSize="2xs"
                                          color={
                                            hasError
                                              ? 'mukuru.text.error'
                                              : 'mukuru.grey.medium'
                                          }
                                        >
                                          {(file.size / 1024).toFixed(1)} KB
                                        </Typography>
                                        {isUploading && (
                                          <Typography
                                            fontSize="2xs"
                                            color="mukuru.primary"
                                          >
                                            {progress}%
                                          </Typography>
                                        )}
                                        {hasError && (
                                          <Typography
                                            fontSize="2xs"
                                            color="mukuru.text.error"
                                            fontWeight="medium"
                                          >
                                            Upload failed
                                          </Typography>
                                        )}
                                      </HStack>
                                    </VStack>
                                  </HStack>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedAttachments((prev) =>
                                        prev.filter((_, i) => i !== idx)
                                      );
                                      setAttachmentUploadProgress((prev) => {
                                        const updated = { ...prev };
                                        delete updated[file.name];
                                        return updated;
                                      });
                                    }}
                                  >
                                    <IconWrapper>
                                      <CloseIcon width="12" height="12" />
                                    </IconWrapper>
                                  </Button>
                                </HStack>
                              );
                            })}
                          </VStack>
                        )}

                        {/* Typing indicator */}
                        {selectedThread && isTyping[selectedThread.id] && (
                          <HStack gap="1.5" align="center">
                            <Box display="flex" gap="0.5">
                              <Box
                                w="4px"
                                h="4px"
                                borderRadius="full"
                                bg="mukuru.primary"
                                animation="bounce 1s infinite"
                              />
                              <Box
                                w="4px"
                                h="4px"
                                borderRadius="full"
                                bg="mukuru.primary"
                                animation="bounce 1s infinite 0.2s"
                              />
                              <Box
                                w="4px"
                                h="4px"
                                borderRadius="full"
                                bg="mukuru.primary"
                                animation="bounce 1s infinite 0.4s"
                              />
                            </Box>
                            <Typography
                              fontSize="2xs"
                              color="mukuru.grey.medium"
                              fontStyle="italic"
                            >
                              {isTyping[selectedThread.id].userName} is typing...
                            </Typography>
                          </HStack>
                        )}

                        <HStack justify="space-between" gap="2" pt="0.5">
                          <HStack gap="2" flex="1">
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setSelectedAttachments((prev) => [...prev, ...files]);
                              }}
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <HStack gap="1.5">
                                <IconWrapper>
                                  <DownloadIcon width="12" height="12" />
                                </IconWrapper>
                                <Typography fontWeight="medium" fontSize="xs">
                                  Attach
                                </Typography>
                              </HStack>
                            </Button>
                            {selectedThread && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const result = await messagingApi.archiveThread(
                                      selectedThread.id,
                                      !selectedThread.isArchived
                                    );
                                    if (result.success) {
                                      await loadThreads();
                                      if (result.isArchived) {
                                        setSelectedThread(null);
                                      }
                                    }
                                  } catch (error) {
                                    logger.error(error, 'Failed to archive thread', {
                                      tags: { error_type: 'archive_thread_error' },
                                    });
                                    await SweetAlert.error(
                                      'Archive Failed',
                                      'Failed to archive thread. Please try again.'
                                    );
                                  }
                                }}
                              >
                                <HStack gap="1.5">
                                  <IconWrapper>
                                    <ForwardToInboxIcon width="12" height="12" />
                                  </IconWrapper>
                                  <Typography fontWeight="medium" fontSize="xs">
                                    {selectedThread.isArchived ? 'Unarchive' : 'Archive'}
                                  </Typography>
                                </HStack>
                              </Button>
                            )}
                          </HStack>

                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSendMessage}
                            disabled={sending || uploadingAttachments}
                          >
                            <HStack gap="1.5">
                              {sending || uploadingAttachments ? (
                                <Spinner size="xs" />
                              ) : (
                                <IconWrapper>
                                  <MailIcon width="12" height="12" />
                                </IconWrapper>
                              )}
                              <Typography fontWeight="semibold" fontSize="xs">
                                {uploadingAttachments
                                  ? 'Uploading...'
                                  : sending
                                    ? 'Sending...'
                                    : 'Send Message'}
                              </Typography>
                            </HStack>
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  </>
                ) : showCompose ? (
                  <Flex
                    justify="center"
                    align="center"
                    height="100%"
                    bg="#F8FAFC"
                    borderRadius="14px"
                    pt="3"
                  >
                    <VStack gap="5" p="6" maxW="320px" textAlign="center">
                      <Box
                        w="64px"
                        h="64px"
                        borderRadius="16px"
                        bg="linear-gradient(135deg, #F05423 0%, #FF7A50 100%)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow="0 4px 16px rgba(240, 84, 35, 0.3)"
                      >
                        <IconWrapper>
                          <AddIcon width="28" height="28" color="white" />
                        </IconWrapper>
                      </Box>
                      <VStack gap="1.5">
                        <Typography
                          fontSize="md"
                          fontWeight="bold"
                          color="mukuru.charcoal"
                        >
                          Compose New Message
                        </Typography>
                        <Typography
                          fontSize="xs"
                          color="mukuru.grey.medium"
                          lineHeight="1.5"
                        >
                          To send a message, please select a thread from the list or
                          navigate to an application to start a conversation.
                        </Typography>
                      </VStack>
                      <Box
                        as="button"
                        onClick={() => setShowCompose(false)}
                        bg="white"
                        color="mukuru.charcoal"
                        px="4"
                        py="2"
                        borderRadius="8px"
                        cursor="pointer"
                        border="1px solid"
                        borderColor="#E5E7EB"
                        transition="all 0.2s ease"
                        boxShadow="0 1px 4px rgba(0, 0, 0, 0.04)"
                        _hover={{
                          bg: '#F8FAFC',
                          borderColor: 'mukuru.grey.medium',
                        }}
                      >
                        <Typography fontWeight="semibold" fontSize="xs">
                          Cancel
                        </Typography>
                      </Box>
                    </VStack>
                  </Flex>
                ) : (
                  <Flex
                    justify="center"
                    align="center"
                    height="100%"
                    bg="#F8FAFC"
                    borderRadius="14px"
                    pt="3"
                  >
                    <VStack gap="5" textAlign="center" maxW="320px">
                      <Box
                        w="64px"
                        h="64px"
                        borderRadius="16px"
                        bg="white"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        border="2px dashed"
                        borderColor="mukuru.grey.light"
                      >
                        <IconWrapper>
                          <MailIcon width="28" height="28" />
                        </IconWrapper>
                      </Box>
                      <VStack gap="1.5">
                        <Typography
                          fontSize="md"
                          fontWeight="bold"
                          color="mukuru.charcoal"
                        >
                          Select a message to view details
                        </Typography>
                        <Typography
                          fontSize="xs"
                          color="mukuru.grey.medium"
                          lineHeight="1.5"
                        >
                          Choose a conversation from the list to start messaging
                        </Typography>
                      </VStack>

                      {/* Decorative elements */}
                      <HStack gap="2">
                        <Box w="28px" h="3px" borderRadius="1.5px" bg="#E5E7EB" />
                        <Box w="14px" h="3px" borderRadius="1.5px" bg="mukuru.primary" />
                        <Box w="28px" h="3px" borderRadius="1.5px" bg="#E5E7EB" />
                      </HStack>
                    </VStack>
                  </Flex>
                )}
              </Box>
            </Flex>
          </VStack>
        </Box>
      </Box>

      {/* Forward Message Modal */}
      <Modal
        isOpen={!!forwardingMessage}
        onClose={() => {
          setForwardingMessage(null);
          setNewMessage({ applicationId: '', content: '', receiverId: '' });
        }}
        title="Forward Message"
        size="large"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <Typography fontSize="lg" fontWeight="semibold" color="mukuru.text.primary">
            Forward Message
          </Typography>
        </ModalHeader>
        <ModalBody>
          <VStack gap="4" align="stretch">
            <Box
              p="3"
              bg={bgColor}
              borderRadius="md"
              borderLeft="3px"
              borderColor="mukuru.primary"
            >
              <Typography
                fontSize="sm"
                fontWeight="medium"
                color="mukuru.text.primary"
                mb="2"
              >
                Original Message:
              </Typography>
              <Typography fontSize="sm" color="mukuru.grey.medium" mb="1">
                From: {forwardingMessage?.sender}
              </Typography>
              <Typography fontSize="sm" color="mukuru.grey.medium" whiteSpace="pre-wrap">
                {forwardingMessage?.content}
              </Typography>
            </Box>

            <VStack gap="3" align="stretch">
              <Box>
                <Typography
                  fontSize="sm"
                  fontWeight="medium"
                  color="mukuru.text.primary"
                  mb="2"
                >
                  To Application ID:
                </Typography>
                <Input
                  placeholder="Enter application ID (GUID)"
                  value={newMessage.receiverId || ''}
                  onChange={(e) =>
                    setNewMessage((prev) => ({ ...prev, receiverId: e.target.value }))
                  }
                />
              </Box>

              <Box>
                <Typography
                  fontSize="sm"
                  fontWeight="medium"
                  color="mukuru.text.primary"
                  mb="2"
                >
                  Additional Message (Optional):
                </Typography>
                <Textarea
                  placeholder="Add any additional context..."
                  value={newMessage.content}
                  onChange={(e) =>
                    setNewMessage((prev) => ({ ...prev, content: e.target.value }))
                  }
                  rows={4}
                />
              </Box>
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack justify="flex-end" gap="3" w="full">
            <Button
              variant="secondary"
              onClick={() => {
                setForwardingMessage(null);
                setNewMessage({ applicationId: '', content: '', receiverId: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!newMessage.receiverId?.trim()) {
                  await SweetAlert.warning(
                    'Application ID Required',
                    'Please enter an application ID to forward to'
                  );
                  return;
                }

                try {
                  setSending(true);
                  const result = await messagingApi.forwardMessage(
                    forwardingMessage!.id,
                    newMessage.receiverId.trim(),
                    undefined,
                    newMessage.content.trim() || undefined
                  );

                  if (result.success) {
                    await SweetAlert.success(
                      'Message Forwarded',
                      'The message has been forwarded successfully.'
                    );
                    setForwardingMessage(null);
                    setNewMessage({ applicationId: '', content: '', receiverId: '' });
                    await loadThreads();
                  } else {
                    throw new Error(result.errorMessage || 'Failed to forward message');
                  }
                } catch (error) {
                  logger.error(error, 'Failed to forward message', {
                    tags: { error_type: 'forward_message_error' },
                  });
                  await SweetAlert.error(
                    'Forward Failed',
                    error instanceof Error ? error.message : 'Failed to forward message'
                  );
                } finally {
                  setSending(false);
                }
              }}
              disabled={sending}
            >
              {sending ? (
                <Spinner size="sm" />
              ) : (
                <IconWrapper>
                  <ShareIcon width="16" height="16" />
                </IconWrapper>
              )}
              <Typography ml="2">{sending ? 'Forwarding...' : 'Forward'}</Typography>
            </Button>
          </HStack>
        </ModalFooter>
      </Modal>
    </Box>
  );
}
