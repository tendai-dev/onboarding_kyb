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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pushNotificationService = PushNotificationService.getInstance();

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

            logger.debug('[Admin Messages] Received SignalR message', {
              messageId: message.id,
            });

            // Show push notification for new messages
            if (
              document.hidden ||
              !selectedThread ||
              message.threadId !== selectedThread.id
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
            if (selectedThread && message.threadId === selectedThread.id) {
              // Determine sender type more accurately
              const senderEmail = (
                message.senderEmail ||
                message.senderId ||
                ''
              ).toLowerCase();
              const senderNameLower = (message.senderName || '').toLowerCase();

              // Determine if message is from admin
              // Check common admin patterns
              const hasAdminKeywords = 
                senderNameLower.includes('admin') ||
                senderNameLower.includes('compliance') ||
                senderNameLower.includes('manager') ||
                senderNameLower.includes('tendai') ||
                senderNameLower.includes('mukuru');
              
              const isFromAdmin =
                senderNameLower.includes('@mukuru.com') ||
                senderEmail.includes('@mukuru.com') ||
                message.senderRole === 'Admin' ||
                message.senderRole === 'ComplianceManager' ||
                hasAdminKeywords;

              const displayMessage: DisplayMessage = {
                id: message.id,
                sender: message.senderName || 'Unknown',
                senderType: isFromAdmin ? 'ADMIN' : 'PARTNER',
                subject: getSubjectFromThread(selectedThread),
                content: message.content || '',
                timestamp: message.sentAt || new Date().toISOString(),
                applicationId: message.applicationId || selectedThread.applicationId,
                attachments: message.attachments || [],
                isRead: false,
                isStarred: false,
                priority: determinePriority({
                  content: message.content || '',
                } as MessageDto),
                threadId: message.threadId,
              };

              setMessages((prev) => {
                // Check if message already exists (avoid duplicates)
                if (prev.some((m) => m.id === message.id)) {
                  return prev;
                }
                return [...prev, displayMessage].sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
              });

              // Scroll to bottom
              setTimeout(() => {
                if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }
              }, 100);

              // Also reload messages from backend to ensure consistency and proper sender type
              setTimeout(async () => {
                try {
                  await loadThreadMessages(selectedThread.id);
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
            if (selectedThread && message.threadId === selectedThread.id) {
              loadThreadMessages(selectedThread.id);
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
            if (selectedThread && threadId === selectedThread.id) {
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

        return () => {
          unsubscribeReceive();
          unsubscribeSent();
          unsubscribeTyping();
          unsubscribeRead();
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
    if (selectedThread && signalRConnected && selectedThread.id) {
      // Validate threadId is a valid GUID before joining
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (
        guidRegex.test(selectedThread.id) &&
        selectedThread.id !== '00000000-0000-0000-0000-000000000000'
      ) {
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
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedThread, signalRConnected]);

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
    // Auto-scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
          const senderNameLower = (msg.senderName || '').toLowerCase();
          const senderIdLower = (msg.senderId || '').toLowerCase();
          const senderRole = (msg.senderRole || '').trim();
          const roleUpper = senderRole.toUpperCase();

          // Check email domain first (most reliable)
          const hasMukuruEmail =
            senderNameLower.includes('@mukuru.com') ||
            senderIdLower.includes('@mukuru.com');
          const hasKurasikaEmail =
            senderNameLower.includes('@kurasika.com') ||
            senderIdLower.includes('@kurasika.com');

          // Admin detection: check role first, then email domain, then name patterns
          const adminNames = [
            'tendai gatahwa',
            'tendai',
            'admin',
            'compliance',
            'mukuru',
          ];
          const customerNames = ['alpha tembo', 'alpha', 'customer', 'applicant'];

          // Check if admin by name
          const isAdminByName = adminNames.some((name) => senderNameLower.includes(name));

          // Check if customer by name
          const isCustomerByName = customerNames.some((name) =>
            senderNameLower.includes(name)
          );

          // Determine if admin: check role first, then email domain, then name
          const isAdmin =
            senderRole === 'Admin' ||
            senderRole === 'ComplianceManager' ||
            roleUpper === 'ADMIN' ||
            roleUpper === 'COMPLIANCEMANAGER' ||
            roleUpper.includes('ADMIN') ||
            roleUpper.includes('COMPLIANCE') ||
            hasMukuruEmail ||
            (isAdminByName && !isCustomerByName && !hasKurasikaEmail);

          // Determine sender type
          let senderType: 'ADMIN' | 'PARTNER' | 'CUSTOMER';
          if (isAdmin) {
            senderType = 'ADMIN';
          } else if (roleUpper.includes('PARTNER') || hasKurasikaEmail) {
            senderType = 'PARTNER';
          } else {
            senderType = 'CUSTOMER';
          }

          return {
            id: msg.id,
            sender: msg.senderName,
            senderType: senderType,
            recipient: msg.receiverName || undefined,
            subject: getSubjectFromThread(selectedThread),
            content: msg.content,
            timestamp: msg.sentAt,
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
      // Sort messages by timestamp: oldest first (ascending order)
      const sortedMessages = displayMessages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(sortedMessages);

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
  // In admin view: admin messages go on the right, customer messages on the left
  // NOTE: Backend is storing all messages with sender_role='Applicant', so we detect by name
  const isFromAdmin = (message: DisplayMessage): boolean => {
    if (!message.sender) {
      console.log('[isFromAdmin] No sender, returning false');
      return false;
    }

    const senderLower = message.sender.toLowerCase();
    console.log('[isFromAdmin] Checking message:', {
      sender: message.sender,
      senderLower,
      senderType: message.senderType,
    });

    // Check senderType first (if backend ever fixes it)
    if (message.senderType === 'ADMIN') {
      console.log('[isFromAdmin] ✅ TRUE - senderType is ADMIN');
      return true;
    }

    // Check for @mukuru.com email domain
    if (senderLower.includes('@mukuru.com')) {
      console.log('[isFromAdmin] ✅ TRUE - has @mukuru.com email');
      return true;
    }

    // Check for known admin names (since backend role is broken)
    // Admin names: Tendai Gatahwa, or any name that doesn't match customer patterns
    const adminNames = ['tendai gatahwa', 'tendai', 'admin', 'compliance', 'mukuru'];
    const customerNames = ['alpha tembo', 'alpha', 'customer', 'applicant'];

    // If it matches admin name patterns, it's admin
    if (adminNames.some((name) => senderLower.includes(name))) {
      console.log('[isFromAdmin] ✅ TRUE - matches admin name pattern');
      return true;
    }

    // If it matches customer name patterns, it's NOT admin
    if (customerNames.some((name) => senderLower.includes(name))) {
      console.log('[isFromAdmin] ❌ FALSE - matches customer name pattern');
      return false;
    }

    // Default: if senderType is CUSTOMER or senderRole was Applicant, assume customer
    // Otherwise, if unclear, check if it's NOT a known customer name
    if (message.senderType === 'CUSTOMER') {
      return false;
    }

    // Last resort: if name contains common admin indicators
    return senderLower.includes('mukuru') || senderLower.includes('admin');
  };

  const getSubjectFromThread = (thread: MessageThreadDto | null): string => {
    if (!thread) return 'No Subject';
    if (thread.applicationReference) return `Application ${thread.applicationReference}`;
    if (thread.applicationId) return `Application ${thread.applicationId.substring(0, 8)}...`;
    return 'Message Thread';
  };

  // Helper to format date safely
  const formatDate = (dateString: string | null | undefined, format: 'short' | 'full' = 'short'): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      if (format === 'short') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Helper to get sender display name
  const getSenderName = (sender: string | null | undefined): string => {
    if (!sender || sender.trim() === '') return 'User';
    const name = sender.split(',')[0].trim();
    return name || 'User';
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
      setSelectedThread((prev) => (prev ? { ...prev, applicationId: selectedThread.id } : null));
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

          // Scroll to bottom to show new message
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
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
  const filteredMessages = messages
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
      // Sort by timestamp: oldest first (ascending order)
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
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
    <Box 
      height="100vh" 
      overflow="hidden" 
      display="flex" 
      bg="#F8FAFC"
      width="100%"
    >
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
          <VStack gap="3" align="stretch" flex="1" minH="0" overflow="hidden" height="100%">
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
                    <Box
                      bg="mukuru.grey.medium"
                      color="white"
                      px="2.5"
                      py="1.5"
                      borderRadius="8px"
                    >
                      <Typography fontSize="xs" fontWeight="medium">
                        Offline
                      </Typography>
                    </Box>
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
                      <Typography fontWeight="semibold" fontSize="xs">New Message</Typography>
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
                      <Typography fontWeight="medium" fontSize="xs">Refresh</Typography>
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
                        boxShadow={filterArchived ? '0 1px 4px rgba(240, 84, 35, 0.2)' : '0 1px 2px rgba(0,0,0,0.04)'}
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
                        boxShadow={filterStarred ? '0 1px 4px rgba(245, 158, 11, 0.2)' : '0 1px 2px rgba(0,0,0,0.04)'}
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
                            <Typography color="mukuru.grey.medium" fontSize="xs" lineHeight="1.4">
                              Try adjusting your search or filter criteria
                            </Typography>
                          ) : (
                            <Typography color="mukuru.grey.medium" fontSize="xs" lineHeight="1.4">
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
                        <Typography fontSize="xs" color="mukuru.grey.medium" fontWeight="medium">
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
                              bg={thread.id === selectedThread?.id 
                                ? 'mukuru.primary' 
                                : 'mukuru.teal'
                              }
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              flexShrink={0}
                              boxShadow={thread.id === selectedThread?.id 
                                ? '0 2px 6px rgba(240, 84, 35, 0.25)' 
                                : '0 1px 3px rgba(0, 0, 0, 0.1)'
                              }
                            >
                              <Typography 
                                fontSize="sm" 
                                fontWeight="bold" 
                                color="white"
                              >
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
                                {(thread.applicationReference || thread.applicationId) && (
                                  <Box
                                    px="2"
                                    py="0.5"
                                    borderRadius="6px"
                                    bg="#F3F4F6"
                                    border="1px solid"
                                    borderColor="#E5E7EB"
                                  >
                                    <Typography fontSize="2xs" fontWeight="medium" color="#6B7280">
                                      {thread.applicationReference || thread.applicationId?.substring(0, 8)}
                                    </Typography>
                                  </Box>
                                )}
                                {(thread.applicationReference || thread.applicationId) && thread.messageCount !== undefined && (
                                  <Typography color="#D1D5DB">•</Typography>
                                )}
                                {thread.messageCount !== undefined && (
                                  <Typography fontSize="2xs" fontWeight="medium" color="#9CA3AF">
                                    {thread.messageCount} {thread.messageCount === 1 ? 'msg' : 'msgs'}
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
                              {(selectedThread.applicantName || 'U').charAt(0).toUpperCase()}
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
                                <Box
                                  w="6px"
                                  h="6px"
                                  borderRadius="full"
                                  bg="#10B981"
                                />
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
                                <Typography fontSize="2xs" fontWeight="medium" color="mukuru.charcoal">
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
                                <Typography fontSize="2xs" fontWeight="medium" color="mukuru.charcoal">
                                  {selectedThread.messageCount} messages
                                </Typography>
                              </HStack>
                            </HStack>
                          </VStack>
                        </HStack>

                        {/* Action Button */}
                        <NextLink
                          href={`/applications/${selectedThread.applicationId}`}
                        >
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
                            <Typography fontWeight="medium" fontSize="xs">View Application</Typography>
                          </Box>
                        </NextLink>
                      </Flex>
                    </Box>

                    {/* Messages List */}
                    <Box
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
                                <Typography color="mukuru.text.primary" fontSize="xs" fontWeight="medium">
                                  Clear Search
                                </Typography>
                              </Button>
                            )}
                          </VStack>
                        </Flex>
                      ) : (
                        <VStack 
                          gap="2" 
                          align="stretch" 
                          width="100%"
                        >
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
                                    <Typography fontSize="2xs" fontWeight="bold" color="white">
                                      {getSenderName(message.sender).substring(0, 2).toUpperCase()}
                                    </Typography>
                                  </Box>
                                )}
                                <Box
                                  maxW="70%"
                                  p="3"
                                  bg={isAdmin ? 'mukuru.primary' : 'white'}
                                  color={isAdmin ? 'white' : 'mukuru.text.primary'}
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
                                      <Typography
                                        fontSize="xs"
                                        fontWeight="semibold"
                                        color={isAdmin ? 'white' : 'mukuru.charcoal'}
                                      >
                                        {getSenderName(message.sender)}
                                      </Typography>
                                      <Typography
                                        fontSize="2xs"
                                        color={
                                          isAdmin
                                            ? 'rgba(255, 255, 255, 0.7)'
                                            : '#9CA3AF'
                                        }
                                      >
                                        {formatDate(message.timestamp, 'full') || 'Just now'}
                                      </Typography>
                                    </Flex>

                                    <Typography
                                      fontSize="sm"
                                      whiteSpace="pre-wrap"
                                      lineHeight="1.5"
                                      color={isAdmin ? 'white' : '#374151'}
                                    >
                                      {message.content || ''}
                                    </Typography>

                                    {message.attachments &&
                                      message.attachments.length > 0 && (
                                        <Box
                                          mt="2"
                                          p="2"
                                          bg={isAdmin ? 'rgba(255,255,255,0.1)' : '#F9FAFB'}
                                          borderRadius="8px"
                                          border="1px solid"
                                          borderColor={isAdmin ? 'rgba(255,255,255,0.2)' : '#E5E7EB'}
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
                                                      bg={isAdmin ? 'rgba(255,255,255,0.15)' : '#E5E7EB'}
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
                                                      <Typography
                                                        fontSize="xs"
                                                        color={isAdmin ? 'white' : '#374151'}
                                                        fontWeight="medium"
                                                        overflow="hidden"
                                                        textOverflow="ellipsis"
                                                        whiteSpace="nowrap"
                                                      >
                                                        {attachment.fileName ||
                                                          `Attachment ${idx + 1}`}
                                                      </Typography>
                                                      <Typography
                                                        fontSize="2xs"
                                                        color={isAdmin ? 'rgba(255,255,255,0.7)' : '#9CA3AF'}
                                                      >
                                                        {(
                                                          attachment.fileSizeBytes / 1024
                                                        ).toFixed(1)}{' '}
                                                        KB
                                                      </Typography>
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
                                          bg: isAdmin ? 'rgba(255,255,255,0.1)' : '#F3F4F6',
                                        }}
                                        onClick={() => setReplyingTo(message)}
                                        title="Reply"
                                      >
                                        <ForwardToInboxIcon 
                                          width="14" 
                                          height="14" 
                                          color={isAdmin ? 'rgba(255,255,255,0.6)' : '#9CA3AF'}
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
                                          bg: isAdmin ? 'rgba(255,255,255,0.1)' : '#F3F4F6',
                                        }}
                                        onClick={() => setForwardingMessage(message)}
                                        title="Forward"
                                      >
                                        <ShareIcon 
                                          width="14" 
                                          height="14" 
                                          color={isAdmin ? 'rgba(255,255,255,0.6)' : '#9CA3AF'}
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
                                          bg: isAdmin ? 'rgba(255,255,255,0.1)' : '#FEF3C7',
                                        }}
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
                                          color={isAdmin ? 'rgba(255,255,255,0.6)' : (message.isStarred ? '#F59E0B' : '#9CA3AF')}
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
                                          bg: isAdmin ? 'rgba(255,255,255,0.1)' : '#FEE2E2',
                                        }}
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
                                          color={isAdmin ? 'rgba(255,255,255,0.6)' : '#9CA3AF'}
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
                                    <Typography fontSize="2xs" fontWeight="bold" color="white">
                                      {getSenderName(message.sender).substring(0, 2).toUpperCase()}
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
                            boxShadow: '0 0 0 1px var(--chakra-colors-mukuru-primary)'
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
                            <Box
                              display="flex"
                              gap="0.5"
                            >
                              <Box w="4px" h="4px" borderRadius="full" bg="mukuru.primary" animation="bounce 1s infinite" />
                              <Box w="4px" h="4px" borderRadius="full" bg="mukuru.primary" animation="bounce 1s infinite 0.2s" />
                              <Box w="4px" h="4px" borderRadius="full" bg="mukuru.primary" animation="bounce 1s infinite 0.4s" />
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
                                <Typography fontWeight="medium" fontSize="xs">Attach</Typography>
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
                          To send a message, please select a thread from the list or navigate to an
                          application to start a conversation.
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
                        <Typography fontWeight="semibold" fontSize="xs">Cancel</Typography>
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
