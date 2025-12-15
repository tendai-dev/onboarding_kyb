'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Container, VStack, HStack, Flex } from '@chakra-ui/react';
import { 
  Button, 
  Typography, 
  Card, 
  Tag,
  MailIcon, 
  ForwardToInboxIcon,
  NotificationIcon,
  StarIcon,
  UserIcon,
} from '@/lib/mukuruImports';
import { PartnerHeader } from '@/components/PartnerHeader';
import { useEffect, useState, useRef } from 'react';
import { getAuthUser } from '@/lib/auth/session';
import { useSession } from 'next-auth/react';
// Removed mockData import - using real backend data only
import {
  EnhancedContextualMessaging,
  type ContextualConversation,
  type ContextualMessage,
} from '@/components/EnhancedContextualMessaging';
import {
  getMyThreads,
  getThreadMessages,
  sendMessage,
  markMessageRead,
  getUnreadCount,
  getApplicationSections,
  getApplicationDocuments,
  forwardMessage,
  starMessage,
  archiveThread,
  findUserCaseByEmail,
  getThreadByApplication,
  getUserApplications,
  type MessageDto,
  type MessageThreadDto,
  type ApplicationSection,
  type ApplicationDocument,
  type UserCase,
} from '@/lib/api';
import { signalRService } from '@/lib/signalRService';
import { uploadFileToDocumentService } from '@/lib/documentUpload';

// Helper function to determine sender type for a message
// SIMPLE LOGIC: In Partner Portal, Applicant role = partner (right side), everything else = admin (left side)
function determineSenderType(
  message: { senderId?: string; senderName?: string; senderRole?: string; sender_role?: string; content?: string },
  _currentUserEmail: string | undefined,
  _currentUserName: string,
  _sentMessageContents: Set<string>
): 'partner' | 'admin' {
  // Handle both camelCase (senderRole) and snake_case (sender_role) from backend
  const senderRole = (message.senderRole || message.sender_role || '').toLowerCase().trim();
  
  // In Partner Portal: Applicant = partner's own messages (right side)
  if (senderRole === 'applicant') {
    return 'partner';
  }
  
  // Everything else (Admin, ComplianceManager, Reviewer, etc.) = admin messages (left side)
  return 'admin';
}

export default function CustomerMessagesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [currentUserName, setCurrentUserName] = useState<string>('User');
  const [currentUserEmail, setCurrentUserEmail] = useState<string | undefined>(undefined);
  const [conversations, setConversations] = useState<ContextualConversation[]>([]);
  const [messages, setMessages] = useState<ContextualMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);
  const [currentThread, setCurrentThread] = useState<MessageThreadDto | null>(null);
  const [threadsPage] = useState<number>(1);
  const [messagesPage, setMessagesPage] = useState<number>(1);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  const [unreadTotal, setUnreadTotal] = useState<number>(0);
  const [applicationSections, setApplicationSections] = useState<ApplicationSection[]>(
    []
  );
  const [applicationDocuments, setApplicationDocuments] = useState<ApplicationDocument[]>(
    []
  );
  const [loadingContext, setLoadingContext] = useState<boolean>(false);
  const [, setIsTyping] = useState<Record<string, boolean>>({});
  const [signalRConnected, setSignalRConnected] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [userApplications, setUserApplications] = useState<UserCase[]>([]);
  const [loadingApplications, setLoadingApplications] = useState<boolean>(false);
  // Track message content sent by current user in this session (for proper alignment)
  const sentMessageContentsRef = useRef<Set<string>>(new Set());
  // Filter state for conversations
  const [conversationFilter, setConversationFilter] = useState<'all' | 'unread'>('all');
  // Refs to access current values in SignalR callbacks without re-initializing
  const currentConversationIdRef = useRef<string | null>(null);
  const currentApplicationIdRef = useRef<string | null>(null);
  const currentThreadRef = useRef<MessageThreadDto | null>(null);
  const currentUserEmailRef = useRef<string | undefined>(undefined);
  const currentUserNameRef = useRef<string>('User');

  useEffect(() => {
    // Use NextAuth session if available, otherwise fallback to getAuthUser
    if (session?.user) {
      console.info('[Messages] Setting user info from NextAuth session:', {
        name: session.user.name,
        email: session.user.email,
      });
      const name = session.user.name || 'User';
      const email = session.user.email || undefined;
      setCurrentUserName(name);
      setCurrentUserEmail(email);
      currentUserNameRef.current = name;
      currentUserEmailRef.current = email;
    } else {
      const user = getAuthUser();
      console.info('[Messages] Setting user info from getAuthUser:', {
        name: user.name,
        email: user.email,
      });
      setCurrentUserName(user.name);
      setCurrentUserEmail(user.email);
      currentUserNameRef.current = user.name;
      currentUserEmailRef.current = user.email;
    }
  }, [session]);

  // Keep refs in sync with state
  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
    currentApplicationIdRef.current = currentApplicationId;
    currentThreadRef.current = currentThread;
  }, [currentConversationId, currentApplicationId, currentThread]);

  // Initialize SignalR connection - only once on mount
  useEffect(() => {
    const initSignalR = async () => {
      try {
        await signalRService.connect();
        setSignalRConnected(true);

        // Set up event listeners
        const unsubscribeReceive = signalRService.on(
          'ReceiveMessage',
          async (_message: Record<string, unknown>) => {
            const message = _message as {
              id?: string;
              senderId?: string;
              senderName?: string;
              senderEmail?: string;
              senderRole?: string;
              content?: string;
              sentAt?: string;
              attachments?: unknown[];
              threadId?: string;
              applicationId?: string;
            };
            console.info('[Partner Messages] Received SignalR message:', message);
            console.info('[Partner Messages] SignalR message details:', {
              messageId: message.id,
              threadId: message.threadId,
              currentThreadId: currentConversationIdRef.current,
              matches: currentConversationIdRef.current === message.threadId,
            });

            // Use refs to get current values (avoids stale closures)
            const currentThreadId = currentConversationIdRef.current;
            const currentAppId = currentApplicationIdRef.current;
            const currentThreadData = currentThreadRef.current;
            const currentEmail = currentUserEmailRef.current;
            const currentName = currentUserNameRef.current;

            // Send email notification if message is from admin and user is not viewing messages
            // Only send if the message is not from the current user
            if (
              message.senderRole &&
              message.senderRole.toLowerCase() !== 'applicant' &&
              message.senderRole.toLowerCase() !== 'partner' &&
              currentEmail &&
              message.senderId &&
              message.senderId.toLowerCase() !== currentEmail.toLowerCase()
            ) {
              try {
                // Check if user is currently viewing the messages page
                const isViewingMessages = window.location.pathname.includes('/messages');
                
                // Only send email if user is not viewing messages
                if (!isViewingMessages) {
                  const { sendMessageNotification } = await import('@/lib/notificationService');
                  await sendMessageNotification({
                    to: currentEmail,
                    applicantName: currentName || 'Valued Partner',
                    caseId: message.applicationId,
                    message: (message.content as string)?.substring(0, 200) || 'You have a new message.',
                    senderName: message.senderName as string || 'Support Team',
                    link: `${window.location.origin}/partner/messages`,
                  }).catch((error) => {
                    // Log error but don't block message display
                    console.warn('Failed to send message notification email:', error);
                  });
                }
              } catch (error) {
                // Log error but don't block message display
                console.warn('Error sending message notification email:', error);
              }
            }

            // Determine if message is from admin or partner using helper function
            const senderType = determineSenderType(
              { 
                senderId: message.senderEmail || message.senderId, 
                senderName: message.senderName, 
                senderRole: message.senderRole,
                content: message.content 
              }, 
              currentEmail, 
              currentName, 
              sentMessageContentsRef.current
            );

            // If message is for current thread, add it immediately
            // Use string comparison to ensure exact match (handle both string and GUID formats)
            const messageThreadId = String(message.threadId || '').toLowerCase();
            const currentThreadIdStr = currentThreadId ? String(currentThreadId).toLowerCase() : '';
            const isForCurrentThread = currentThreadIdStr && messageThreadId && messageThreadId === currentThreadIdStr;
            
            if (isForCurrentThread) {
              // Get proper sender name - ALWAYS use thread info to ensure correct names for each side
              let senderDisplayName = '';
              
              if (senderType === 'partner') {
                // Partner messages: ALWAYS use current user's name to ensure consistency
                senderDisplayName = currentName || 'You';
              } else {
                // Admin messages: ALWAYS use thread's assignedAdminName to ensure consistency
                if (currentThreadData?.assignedAdminName) {
                  senderDisplayName = currentThreadData.assignedAdminName;
                } else if (message.senderName && message.senderName !== currentName) {
                  // Use senderName if it's different from current user's name (likely an admin name)
                  senderDisplayName = message.senderName;
                } else {
                  // Try to extract from email or use default
                  const senderEmail = message.senderEmail || message.senderId || '';
                  if (senderEmail && senderEmail.includes('@')) {
                    const emailParts = senderEmail.split('@');
                    senderDisplayName = emailParts[0].split('.').map(part => 
                      part.charAt(0).toUpperCase() + part.slice(1)
                    ).join(' ') || emailParts[0];
                  } else {
                    senderDisplayName = 'Mukuru Support';
                  }
                }
              }

              const contextualMessage: ContextualMessage = {
                id: message.id || '',
                senderId: message.senderEmail || message.senderId || '', // Use email if available, fallback to senderId
                senderName: senderDisplayName,
                senderType: senderType,
                content: message.content || '',
                timestamp: message.sentAt || new Date().toISOString(),
                status: 'sent',
                priority: 'normal',
                attachments:
                  (message.attachments as Array<{
                    id: string;
                    name: string;
                    type: string;
                    size: string;
                    url: string;
                  }>) || [],
                isRead: false,
                isStarred: false,
                tags: [],
                applicationId: message.applicationId || currentAppId || '',
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
                  (m) => m.id.startsWith('temp-') && 
                         m.content === message.content &&
                         Math.abs(new Date(m.timestamp).getTime() - new Date(messageSentAt).getTime()) < 5000
                );
                
                if (optimisticIndex >= 0) {
                  // Replace optimistic message with real one
                  const updated = [...prev];
                  updated[optimisticIndex] = contextualMessage;
                  return updated.sort(
                    (a, b) =>
                      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                  );
                }
                
                // Add new message and sort by timestamp - message appears instantly!
                return [...prev, contextualMessage].sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
              });
              
              // Note: Background refresh happens below to ensure consistency, but message is already visible
            }

            // Always refresh threads to update last message and unread counts
            setTimeout(async () => {
              try {
                const result = await getMyThreads(1, 20);
                const items = (result.items || []) as unknown as MessageThreadDto[];
                const mapped: ContextualConversation[] = items.map(
                  (t) =>
                    ({
                      id: t.id as any,
                      applicationId: t.applicationId as any,
                      partnerId: currentEmail ?? 'partner',
                      subject: t.applicationReference || (t.applicationId ? `Application ${String(t.applicationId).slice(0, 12)}...` : 'New Conversation'),
                      status: 'active',
                      priority: 'normal',
                      lastMessage: t.lastMessage?.content,
                      lastMessageTime: t.lastMessageAt as any as string,
                      unreadCount: t.unreadCount ?? 0,
                      tags: [],
                      createdAt: new Date().toISOString(),
                      contextSections: [],
                    }) as any
                );
                setConversations(mapped);

                // If the message is for the current thread, also reload messages to ensure consistency
                const currentThreadIdStr = currentConversationIdRef.current ? String(currentConversationIdRef.current).toLowerCase() : '';
                const messageThreadIdStr = String(message.threadId || '').toLowerCase();
                if (currentThreadIdStr && messageThreadIdStr && messageThreadIdStr === currentThreadIdStr && currentConversationIdRef.current) {
                  try {
                    const page = await getThreadMessages(currentConversationIdRef.current, 1, 50);
                    const items = page.items || [];
                    const mapped = items.map((m: MessageDto) => {
                      const senderType = determineSenderType(m, currentEmail, currentName, sentMessageContentsRef.current);
                      const mappedAttachments = (m.attachments || []).map((a) => ({
                        id: a.id,
                        name: a.fileName,
                        type: a.contentType,
                        size: String(a.fileSizeBytes),
                        url: a.storageUrl || '',
                      }));
                      // Determine sender email: for partner messages use current user email, for admin try to extract from senderId if it's an email
                      let displaySenderId = m.senderId || '';
                      if (senderType === 'partner') {
                        // Partner messages should show current user's email
                        displaySenderId = currentEmail || displaySenderId;
                      } else if (displaySenderId && !displaySenderId.includes('@')) {
                        // If senderId is a GUID (no @), try to get email from thread or use senderName
                        // For admin messages, we might not have email, so use senderName or a default
                        displaySenderId = currentThreadData?.assignedAdminName || m.senderName || 'Admin';
                      }
                      
                      return {
                        id: m.id || '',
                        senderId: displaySenderId, // Use email when available
                        senderName: m.senderName || '',
                        senderType: senderType,
                        content: m.content || '',
                        timestamp: m.sentAt || new Date().toISOString(),
                        status: (m.isRead ? 'read' : m.status) as any,
                        priority: 'normal',
                        attachments: mappedAttachments,
                        isRead: m.isRead || false,
                        isStarred: m.isStarred || false,
                        tags: [],
                        applicationId: currentAppId || '',
                        replyToMessageId: m.replyToMessageId,
                      };
                    }) as ContextualMessage[];
                    const sorted = mapped.sort(
                      (a, b) =>
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );
                    setMessages(sorted);
                  } catch (error) {
                    console.error(
                      'Failed to reload messages after SignalR update:',
                      error
                    );
                  }
                }
              } catch {
                // Silently handle thread refresh errors
              }
            }, 0);

            getUnreadCount()
              .then((r) => setUnreadTotal(r.count ?? 0))
              .catch(() => {});
          }
        );

        const unsubscribeTyping = signalRService.on(
          'UserTyping',
          (data: Record<string, unknown>) => {
            const typedData = data as { threadId?: string; userName?: string };
            const currentThreadId = currentConversationIdRef.current;
            if (currentThreadId && typedData.threadId === currentThreadId) {
              // Clear typing indicator after 3 seconds
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              typingTimeoutRef.current = setTimeout(() => {
                setIsTyping((prev: Record<string, boolean>) => {
                  const updated = { ...prev };
                  if (typedData.threadId) {
                    delete updated[typedData.threadId];
                  }
                  return updated;
                });
              }, 3000);
            }
          }
        );

        // Listen for connection state changes
        const unsubscribeReconnected = signalRService.on('Reconnected', () => {
          console.info('[Partner Messages] SignalR reconnected');
          setSignalRConnected(true);
          // Rejoin current thread if one is selected
          const threadId = currentConversationIdRef.current;
          if (threadId) {
            signalRService.joinThread(threadId).catch(() => {});
          }
        });

        const unsubscribeConnectionClosed = signalRService.on('ConnectionClosed', () => {
          console.warn('[Partner Messages] SignalR connection closed');
          setSignalRConnected(false);
        });

        return () => {
          unsubscribeReceive();
          unsubscribeTyping();
          unsubscribeReconnected();
          unsubscribeConnectionClosed();
          signalRService.disconnect();
        };
      } catch (error) {
        // SignalR is optional - messaging will work without real-time updates
        console.warn('[Partner Messages] SignalR not available (non-critical):', error);
        console.warn('[Partner Messages] Messaging will work without real-time updates');
        setSignalRConnected(false);
        // Continue - messaging page works without SignalR
      }
    };

    initSignalR();
  }, []); // Only run once on mount

  // Join/leave thread when selection changes
  useEffect(() => {
    if (!currentConversationId) return;
    
    // Wait for SignalR to be connected before joining
    if (!signalRConnected) {
      // If not connected, try to connect first
      signalRService.connect()
        .then(() => {
          if (signalRService.isConnected()) {
            setSignalRConnected(true);
            // Then join thread
            const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (
              guidRegex.test(currentConversationId) &&
              currentConversationId !== '00000000-0000-0000-0000-000000000000'
            ) {
              signalRService.joinThread(currentConversationId).catch(() => {});
            }
          }
        })
        .catch(() => {});
      return;
    }

    // Validate threadId is a valid GUID before joining
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (
      guidRegex.test(currentConversationId) &&
      currentConversationId !== '00000000-0000-0000-0000-000000000000'
    ) {
      console.info('[Partner Messages] Joining thread:', currentConversationId);
      signalRService.joinThread(currentConversationId).catch((error) => {
        console.warn('[Partner Messages] Failed to join thread:', error);
      });
      return () => {
        console.info('[Partner Messages] Leaving thread:', currentConversationId);
        signalRService.leaveThread(currentConversationId).catch(() => {});
      };
    } else {
      console.warn(
        '[Partner Messages] Invalid thread ID, skipping join:',
        currentConversationId
      );
    }
  }, [currentConversationId, signalRConnected]);

  // No mock application usage. Data comes from backend only.

  useEffect(() => {
    const isMountedRef = { current: true };
    // Load the user's threads from backend only
    (async () => {
      try {
        const result = await getMyThreads(threadsPage, 20);
        if (!isMountedRef.current) return;
        const items = (result.items || []) as unknown as MessageThreadDto[];
        const mapped: ContextualConversation[] = items.map(
          (t) =>
            ({
              id: t.id as any,
              applicationId: t.applicationId as any,
              partnerId: currentUserEmail ?? 'partner',
              subject: t.applicationReference || (t.applicationId ? `Application ${String(t.applicationId).slice(0, 12)}...` : 'New Conversation'),
              status: 'active',
              priority: 'normal',
              lastMessage: t.lastMessage?.content,
              lastMessageTime: t.lastMessageAt as any as string,
              unreadCount: t.unreadCount ?? 0,
              tags: [],
              createdAt: new Date().toISOString(),
              contextSections: [],
            }) as any
        );

        setConversations(mapped);
        if (mapped.length > 0) {
          setCurrentConversationId(mapped[0].id);
          setCurrentApplicationId(mapped[0].applicationId);
          // Store the first thread info for sender name resolution
          if (items.length > 0) {
            setCurrentThread(items[0]);
          }
        } else if (currentUserEmail) {
          // If no threads exist, try to get the user's case/application
          try {
            console.info('[Messages] Looking up user case for:', currentUserEmail);
            const userCase = await findUserCaseByEmail(currentUserEmail);
            console.info('[Messages] User case result:', userCase);

            if (userCase && userCase.caseId) {
              // Use application GUID if available, otherwise fall back to caseId
              // The sendMessage function will handle converting caseId to GUID if needed
              const applicationId = userCase.id || userCase.caseId;
              console.info('[Messages] Setting application ID:', applicationId);
              setCurrentApplicationId(applicationId);

              // Try to get thread for this application (use GUID if available)
              try {
                const thread = await getThreadByApplication(applicationId);
                if (thread) {
                  console.info('[Messages] Found existing thread:', thread.id);
                  setCurrentConversationId(thread.id);
                }
              } catch (threadError) {
                // Thread doesn't exist yet, will be created on first message
                console.info(
                  '[Messages] No thread exists yet for application, will be created on first message',
                  threadError
                );
              }
            } else {
              console.warn('[Messages] User case found but no caseId:', userCase);
            }
          } catch (error) {
            console.error('[Messages] Could not find user case:', error);
            // Even if case lookup fails, try to allow messaging by attempting to find case on send
          }
        }
      } catch (error) {
        // Log error details for debugging
        console.error('[Messages] Error loading threads:', error);
        if (error instanceof Error) {
          console.error('[Messages] Error message:', error.message);
          console.error('[Messages] Error stack:', error.stack);
        }
        // Keep empty state on error
        setConversations([]);
      }
    })();

    return () => {
      isMountedRef.current = false;
    };
  }, [currentUserEmail, threadsPage]);

  // Load messages for the selected conversation
  useEffect(() => {
    const isMountedRef = { current: true };
    const load = async () => {
      const threadId = currentConversationId;
      if (!threadId) return;
      try {
        const page = await getThreadMessages(threadId, messagesPage, 20);
        if (!isMountedRef.current) return;
        const items = page.items || [];
        const mapped = items.map((m: MessageDto) => {
          // Handle both camelCase and snake_case from backend
          const msgData = {
            ...m,
            senderId: m.senderId || m.sender_id || '',
            senderName: m.senderName || m.sender_name || '',
            senderRole: m.senderRole || m.sender_role || '',
            sentAt: m.sentAt || m.sent_at || '',
            isRead: m.isRead ?? m.is_read ?? false,
            isStarred: m.isStarred ?? m.is_starred ?? false,
          };
          
          const senderType = determineSenderType(msgData, currentUserEmail, currentUserName, sentMessageContentsRef.current);

          // Map attachments from backend format to frontend format
          const mappedAttachments = (m.attachments || []).map((a) => ({
            id: a.id,
            name: a.fileName,
            type: a.contentType,
            size: String(a.fileSizeBytes),
            url: a.storageUrl || '',
          }));

          // Get proper sender name - ALWAYS use thread info to ensure correct names for each side
          let senderDisplayName = '';
          
          if (senderType === 'partner') {
            // Partner messages: ALWAYS use current user's name to ensure consistency
            senderDisplayName = currentUserName || 'You';
          } else {
            // Admin messages: ALWAYS use thread's assignedAdminName to ensure consistency
            if (currentThread?.assignedAdminName) {
              senderDisplayName = currentThread.assignedAdminName;
            } else if (msgData.senderName && msgData.senderName !== currentUserName) {
              // Use senderName if it's different from current user's name (likely an admin name)
              senderDisplayName = msgData.senderName;
            } else {
              // Try to extract from email or use default
              const senderId = msgData.senderId || '';
              if (senderId && senderId.includes('@')) {
                const emailParts = senderId.split('@');
                senderDisplayName = emailParts[0].split('.').map(part => 
                  part.charAt(0).toUpperCase() + part.slice(1)
                ).join(' ') || emailParts[0];
              } else {
                senderDisplayName = 'Mukuru Support';
              }
            }
          }

          // Use senderEmail if available (from API response), otherwise use senderId
          // senderId from backend might be a GUID, but we want to display the email
          const senderEmail = (m as any).senderEmail || (m as any).sender_email;
          const displaySenderId = senderEmail || (msgData.senderId && msgData.senderId.includes('@') ? msgData.senderId : currentUserEmail) || msgData.senderId;
          
          return {
            id: m.id,
            senderId: displaySenderId, // Use email when available
            senderName: senderDisplayName,
            senderType: senderType,
            content: m.content,
            timestamp: msgData.sentAt,
            status: (msgData.isRead ? 'read' : m.status) as any,
            priority: 'normal',
            attachments: mappedAttachments,
            isRead: msgData.isRead,
            isStarred: msgData.isStarred,
            tags: [],
            applicationId: currentApplicationId || '',
            replyToMessageId: m.replyToMessageId || m.reply_to_message_id,
          };
        }) as ContextualMessage[];
        // Sort by timestamp: oldest first (ascending order)
        const sorted = [...mapped].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setMessages((prev) => {
          if (messagesPage === 1) {
            return sorted;
          } else {
            // Merge and sort: oldest at top, newest at bottom
            const merged = [...prev, ...sorted];
            return merged.sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          }
        });
        setHasMoreMessages((page as any).hasNextPage);

        // Best-effort mark unread as read
        items
          .filter((m) => !m.isRead)
          .forEach((m) => {
            markMessageRead(m.id).catch(() => {});
          });
      } catch {
        setMessages([]);
      }
    };
    load();

    // Poll for updates every 5s (only if SignalR is not connected)
    if (!signalRConnected) {
      const id = setInterval(load, 5000);
      return () => {
        isMountedRef.current = false;
        clearInterval(id);
      };
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [
    currentConversationId,
    currentApplicationId,
    messagesPage,
    currentUserEmail,
    currentUserName,
    currentThread,
    signalRConnected,
  ]);

  // Auto-retry SignalR connection every 30 seconds if disconnected
  useEffect(() => {
    if (signalRConnected) return; // Already connected

    const retryInterval = setInterval(async () => {
      console.info('[Partner Messages] Attempting to reconnect SignalR...');
      try {
        await signalRService.connect();
        if (signalRService.isConnected()) {
          console.info('[Partner Messages] SignalR reconnected successfully!');
          setSignalRConnected(true);
          // Rejoin thread if one is selected (use ref to get current value)
          const threadId = currentConversationIdRef.current;
          if (threadId) {
            await signalRService.joinThread(threadId);
          }
        }
      } catch (e) {
        console.debug('[Partner Messages] SignalR reconnection attempt failed:', e);
      }
    }, 30000); // Retry every 30 seconds

    return () => clearInterval(retryInterval);
  }, [signalRConnected]);

  // Load application sections and documents when application changes
  useEffect(() => {
    if (!currentApplicationId) {
      setApplicationSections([]);
      setApplicationDocuments([]);
      setLoadingContext(false);
      return;
    }

    const isMountedRef = { current: true };
    const loadContext = async () => {
      setLoadingContext(true);
      try {
        const [sections, documents] = await Promise.all([
          getApplicationSections(currentApplicationId),
          getApplicationDocuments(currentApplicationId),
        ]);

        if (isMountedRef.current) {
          setApplicationSections(sections);
          setApplicationDocuments(documents);
          setLoadingContext(false);
        }
      } catch (error) {
        console.error('Failed to load application context:', error);
        if (isMountedRef.current) {
          setApplicationSections([]);
          setApplicationDocuments([]);
          setLoadingContext(false);
        }
      }
    };

    loadContext();
    return () => {
      isMountedRef.current = false;
    };
  }, [currentApplicationId]);

  // Load user applications for selection
  useEffect(() => {
    // Wait for session to load
    if (sessionStatus === 'loading') {
      console.info('[Messages] Session is loading, waiting...');
      return;
    }

    // Get email from session or currentUserEmail
    const emailToUse = session?.user?.email || currentUserEmail;

    if (!emailToUse) {
      console.warn('[Messages] No user email available, cannot load applications');
      return;
    }

    console.info('[Messages] Loading user applications for:', emailToUse);
    const loadApplications = async () => {
      setLoadingApplications(true);
      try {
        console.info('[Messages] Calling getUserApplications() with email:', emailToUse);
        const apps = await getUserApplications(emailToUse);
        console.info(
          '[Messages] getUserApplications returned:',
          apps.length,
          'applications',
          apps
        );
        setUserApplications(apps);

        // If no application is currently selected and we have applications, select the first one
        if (!currentApplicationId && apps.length > 0) {
          const firstApp = apps[0];
          const appId = firstApp.id || firstApp.caseId;
          console.info('[Messages] Auto-selecting first application:', appId);
          setCurrentApplicationId(appId);

          // Try to get thread for this application
          try {
            const thread = await getThreadByApplication(appId);
            if (thread) {
              console.info('[Messages] Found thread for application:', thread.id);
              setCurrentConversationId(thread.id);
            }
          } catch (error) {
            // Thread doesn't exist yet, will be created on first message
            console.info(
              '[Messages] No thread exists for application, will be created on first message'
            );
          }
        } else if (apps.length === 0) {
          console.warn(
            '[Messages] No applications found for user. User may need to submit an application first.'
          );
        }
      } catch (error) {
        console.error('[Messages] Failed to load applications:', error);
        if (error instanceof Error) {
          console.error('[Messages] Error details:', error.message, error.stack);
        }
        setUserApplications([]);
      } finally {
        setLoadingApplications(false);
      }
    };

    loadApplications();
  }, [session, sessionStatus, currentUserEmail, currentApplicationId]); // Depend on session and currentUserEmail

  // Unread total polling
  useEffect(() => {
    const activeRef = { current: true };
    const refreshUnread = async () => {
      try {
        const r = await getUnreadCount();
        if (activeRef.current) setUnreadTotal(r.count ?? 0);
      } catch (error) {
        console.error('[Messages] Failed to refresh unread count:', error);
        if (error instanceof Error) {
          console.error('[Messages] Error details:', error.message);
        }
      }
    };
    refreshUnread();
    const id = setInterval(refreshUnread, 10000);
    return () => {
      activeRef.current = false;
      clearInterval(id);
    };
  }, []);

  const handleSendMessage = async (
    content: string,
    _context?: Record<string, unknown>,
    attachments: File[] = [],
    replyToMessageId?: string
  ) => {
    if (!content.trim() && attachments.length === 0) {
      console.warn('Cannot send message: missing content');
      return;
    }

    // If no applicationId is set, try to find it from the user's case
    let applicationIdToUse = currentApplicationId;

    if (!applicationIdToUse && currentUserEmail) {
      console.info('[Messages] No applicationId set, trying to find user case...');
      try {
        const userCase = await findUserCaseByEmail(currentUserEmail);
        if (userCase && userCase.caseId) {
          applicationIdToUse = userCase.id || userCase.caseId;
          console.info('[Messages] Found applicationId from case:', applicationIdToUse);
          setCurrentApplicationId(applicationIdToUse);
        } else {
          console.error('[Messages] User case not found or missing caseId');
          throw new Error(
            'No application found. Please ensure you have submitted an application.'
          );
        }
      } catch (error) {
        console.error('[Messages] Failed to find user case:', error);
        throw new Error(
          'Could not find your application. Please ensure you have submitted an application.'
        );
      }
    }

    if (!applicationIdToUse) {
      console.error('[Messages] Cannot send message: no applicationId available');
      throw new Error(
        'No application selected. Please ensure you have submitted an application.'
      );
    }

    // If no conversation exists yet, we'll create one by sending the message
    // The backend automatically creates a thread when sending the first message
    let threadId = currentConversationId;

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

    if (attachments.length > 0) {
      // Upload files to document service and get storage keys/URLs
      try {
        // Get partnerId from user email
        let partnerId = '';
        if (currentUserEmail) {
          const emailLower = currentUserEmail.toLowerCase();
          let hash = 0;
          for (let i = 0; i < emailLower.length; i++) {
            const char = emailLower.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
          }
          const hex = Math.abs(hash).toString(16).padStart(32, '0');
          partnerId = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
        }

        attachmentInfos = await Promise.all(
          attachments.map(async (file) => {
            try {
              const uploadResult = await uploadFileToDocumentService(
                applicationIdToUse,
                partnerId,
                file,
                99, // DocumentType.Other
                `Message attachment: ${file.name}`,
                currentUserEmail
              );

              return {
                fileName: file.name,
                contentType: file.type || 'application/octet-stream',
                fileSizeBytes: file.size,
                storageKey: uploadResult.storageKey,
                storageUrl: '',
                documentId: uploadResult.documentId,
                description: `Message attachment: ${file.name}`,
              };
            } catch (error) {
              console.error(`Failed to upload attachment ${file.name}:`, error);
              // Continue with placeholder if upload fails
              return {
                fileName: file.name,
                contentType: file.type || 'application/octet-stream',
                fileSizeBytes: file.size,
                storageKey: `messages/${applicationIdToUse}/${Date.now()}-${file.name}`,
                storageUrl: '',
                description: undefined,
              };
            }
          })
        );
      } catch (error) {
        console.error('Error uploading attachments:', error);
      }
    }

    // Track this message content as sent by current user
    sentMessageContentsRef.current.add(content.trim().toLowerCase());
    
    // Optimistic update
    const optimisticMsg: ContextualMessage = {
      id: `temp-${Date.now()}`,
      senderId: currentUserEmail ?? 'partner',
      senderName: currentUserName,
      senderType: 'partner',
      content,
      timestamp: new Date().toISOString(),
      status: 'sent',
      priority: 'normal',
      attachments: attachments.map((f, i) => ({
        id: `${i}`,
        name: f.name,
        type: f.type,
        size: `${f.size}`,
        url: '',
      })),
      isRead: false,
      isStarred: false,
      tags: [],
      applicationId: applicationIdToUse,
    };
    setMessages((prev) =>
      [...prev, optimisticMsg].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    );

    // Attempt to persist via backend
    try {
      const sendResult = await sendMessage(
        applicationIdToUse,
        content,
        undefined,
        replyToMessageId,
        attachmentInfos.length > 0 ? attachmentInfos : undefined
      );

      // If we didn't have a conversationId before, get it from the send result or fetch the thread
      if (!threadId && sendResult.threadId) {
        threadId = sendResult.threadId;
        setCurrentConversationId(threadId);
        currentConversationIdRef.current = threadId;
        // Join thread immediately after sending message
        if (signalRConnected && signalRService.isConnected()) {
          signalRService.joinThread(threadId).catch(() => {});
        }
      } else if (!threadId) {
        // Try to get thread by application ID
        try {
          const thread = await getThreadByApplication(applicationIdToUse);
          if (thread) {
            threadId = thread.id;
            setCurrentConversationId(threadId);
            currentConversationIdRef.current = threadId;
            // Join thread immediately after sending message
            if (signalRConnected && signalRService.isConnected()) {
              signalRService.joinThread(threadId).catch(() => {});
            }
          }
        } catch (error) {
          console.warn('Could not fetch thread after sending message:', error);
        }
      } else {
        // Ensure we're joined to the thread (in case connection was lost and restored)
        if (signalRConnected && signalRService.isConnected()) {
          signalRService.joinThread(threadId).catch(() => {});
        }
      }

      // Refresh messages after successful send to ensure proper sender type detection
      if (threadId) {
        // Wait a bit for SignalR to process, then reload
        // Capture applicationIdToUse in closure
        const capturedApplicationId = applicationIdToUse;
        setTimeout(async () => {
          try {
            const page = await getThreadMessages(threadId as string, 1, 50);
            const items = page.items || [];
            const mapped = items.map((m: MessageDto) => {
              const senderType = determineSenderType(m, currentUserEmail, currentUserName, sentMessageContentsRef.current);
              const mappedAttachments = (m.attachments || []).map((a) => ({
                id: a.id,
                name: a.fileName,
                type: a.contentType,
                size: String(a.fileSizeBytes),
                url: a.storageUrl || '',
              }));

              // Determine sender email: for partner messages use current user email
              let displaySenderId = m.senderId || '';
              if (senderType === 'partner') {
                displaySenderId = currentUserEmail || displaySenderId;
              } else if (displaySenderId && !displaySenderId.includes('@')) {
                // If senderId is a GUID, use senderName or default
                displaySenderId = m.senderName || 'Admin';
              }
              
              return {
                id: m.id,
                senderId: displaySenderId, // Use email when available
                senderName: m.senderName,
                senderType: senderType,
                content: m.content,
                timestamp: m.sentAt,
                status: (m.isRead ? 'read' : m.status) as any,
                priority: 'normal',
                attachments: mappedAttachments,
                isRead: m.isRead,
                isStarred: m.isStarred || false,
                tags: [],
                applicationId: capturedApplicationId,
                replyToMessageId: m.replyToMessageId,
              };
            }) as ContextualMessage[];

            // Sort and update messages
            const sorted = mapped.sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            setMessages(sorted);
            setMessagesPage(1);
          } catch (error) {
            console.error('Failed to refresh messages after send:', error);
          }
        }, 500);
      }

      // Update unread total after send
      getUnreadCount()
        .then((r) => setUnreadTotal(r.count ?? 0))
        .catch(() => {});

      // Refresh threads to update last message and show new thread if created
      const threadsResult = await getMyThreads(threadsPage, 20);
      const threadItems = (threadsResult.items || []) as unknown as MessageThreadDto[];
      const updatedThreads: ContextualConversation[] = threadItems.map(
        (t) =>
          ({
            id: t.id as any,
            applicationId: t.applicationId as any,
            partnerId: currentUserEmail ?? 'partner',
            subject: t.applicationReference || (t.applicationId ? `Application ${String(t.applicationId).slice(0, 12)}...` : 'New Conversation'),
            status: 'active',
            priority: 'normal',
            lastMessage: t.lastMessage?.content,
            lastMessageTime: t.lastMessageAt as any as string,
            unreadCount: t.unreadCount ?? 0,
            tags: [],
            createdAt: new Date().toISOString(),
            contextSections: [],
          }) as any
      );
      setConversations(updatedThreads);

      // If we just created a new thread, select it
      if (!currentConversationId && threadId) {
        setCurrentConversationId(threadId);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      // Show error banner would be handled by the component
    }
  };

  // With fallback above, we always render the designed page

  return (
    <Box h="100vh" maxH="100vh" overflow="hidden" bg="mukuru.background.light" display="flex" flexDirection="column">
      <Box flexShrink={0}>
        <PartnerHeader />
      </Box>

      {/* Full Height Messages Layout */}
      <Flex
        flex="1"
        minH="0"
        p="3"
        gap="3"
        overflow="hidden"
      >
        {/* Left Sidebar - Conversations */}
        <Card
          width="320px"
          minW="320px"
          h="100%"
          borderRadius="lg"
          border="1px solid"
          borderColor="mukuru.grey.light"
          display="flex"
          flexDirection="column"
          overflow="hidden"
          flexShrink={0}
          bg="mukuru.cards.white"
        >
          {/* Sidebar Header */}
          <Box
            px="3"
            py="2.5"
            borderBottom="1px solid"
            borderColor="mukuru.grey.light"
            bg="mukuru.cards.white"
            flexShrink={0}
          >
            <HStack justify="space-between" align="center" mb="2">
              <HStack gap="1.5" align="center">
                <MailIcon width="14px" height="14px" color="var(--chakra-colors-mukuru-buttons-primary)" />
                <Typography fontSize="xs" fontWeight="semibold" color="mukuru.text.primary">
                  Messages
                </Typography>
              </HStack>
              {signalRConnected ? (
                <Flex
                  bg="mukuru.teal"
                  px="1.5"
                  py="0.5"
                  borderRadius="full"
                  align="center"
                  gap="1"
                >
                  <Box w="5px" h="5px" borderRadius="full" bg="white" />
                  <Typography fontSize="9px" fontWeight="bold" color="mukuru.text.inverse">
                    Live
                  </Typography>
                </Flex>
              ) : (
                <Flex
                  as="button"
                  bg="#EF4444"
                  px="1.5"
                  py="0.5"
                  borderRadius="full"
                  align="center"
                  gap="1"
                  cursor="pointer"
                  onClick={async () => {
                    try {
                      await signalRService.reconnect();
                      setSignalRConnected(signalRService.isConnected());
                    } catch (e) {
                      console.warn('[Partner Messages] Failed to reconnect SignalR:', e);
                    }
                  }}
                  _hover={{ bg: '#DC2626' }}
                  transition="all 0.2s"
                  title="Click to retry connection"
                >
                  <Box w="5px" h="5px" borderRadius="full" bg="white" opacity={0.7} />
                  <Typography fontSize="9px" fontWeight="bold" color="white">
                    Offline
                  </Typography>
                </Flex>
              )}
            </HStack>
            {/* Filters */}
            <HStack gap="1.5">
              <Box 
                as="button"
                px="3" 
                py="1"
                borderRadius="full"
                bg={conversationFilter === 'all' ? '#F05423' : '#F3F4F6'}
                color={conversationFilter === 'all' ? 'white' : '#6B7280'}
                fontSize="xs"
                fontWeight="medium"
                cursor="pointer"
                onClick={() => setConversationFilter('all')}
              >
                All
              </Box>
              <Box 
                as="button"
                px="3" 
                py="1"
                borderRadius="full"
                bg={conversationFilter === 'unread' ? '#F05423' : '#F3F4F6'}
                color={conversationFilter === 'unread' ? 'white' : '#6B7280'}
                fontSize="xs"
                fontWeight="medium"
                cursor="pointer"
                onClick={() => setConversationFilter('unread')}
              >
                Unread
              </Box>
            </HStack>
          </Box>
          
          {/* Conversations List */}
          <Box flex="1" overflowY="auto" p="2" minH="0">
            <VStack align="stretch" gap="1">
              {(() => {
                const filteredConversations = conversationFilter === 'unread' 
                  ? conversations.filter(c => c.unreadCount > 0)
                  : conversations;
                
                if (filteredConversations.length === 0) {
                  return (
                    <Box 
                      display="flex"
                      flexDirection="column" 
                      alignItems="center" 
                      justifyContent="center" 
                      py="6"
                      px="3"
                    >
                      <ForwardToInboxIcon width="20px" height="20px" color="var(--chakra-colors-mukuru-grey-medium)" />
                      <Typography fontSize="xs" color="mukuru.grey.medium" textAlign="center" mt="2">
                        {conversationFilter === 'unread' ? 'No unread conversations' : 'No conversations yet'}
                      </Typography>
                    </Box>
                  );
                }
                
                return filteredConversations.map((c) => (
                  <Box
                    key={c.id}
                    p="2"
                    borderRadius="md"
                    cursor="pointer"
                    bg={currentConversationId === c.id ? 'mukuru.state.hover' : 'transparent'}
                    borderLeft="3px solid"
                    borderLeftColor={currentConversationId === c.id ? 'mukuru.buttons.primary' : 'transparent'}
                    onClick={() => {
                      setCurrentConversationId(c.id);
                      setCurrentApplicationId(c.applicationId);
                      setMessagesPage(1);
                    }}
                    _hover={{
                      bg: 'mukuru.state.hover',
                    }}
                    transition="all 0.1s ease"
                  >
                    <HStack gap="2">
                      <Flex
                        w="28px"
                        h="28px"
                        borderRadius="8px"
                        bg={currentConversationId === c.id ? 'mukuru.buttons.primary' : 'mukuru.teal'}
                        align="center"
                        justify="center"
                        flexShrink={0}
                      >
                        <UserIcon 
                          width="14px" 
                          height="14px" 
                          color="#fff" 
                        />
                      </Flex>
                      <VStack align="start" gap="0" flex="1" minW="0">
                        <Typography
                          fontSize="xs"
                          color="mukuru.text.primary"
                          fontWeight={c.unreadCount > 0 ? 'semibold' : 'normal'}
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                        >
                          {c.subject || 'New Conversation'}
                        </Typography>
                        <Typography fontSize="2xs" color="mukuru.grey.medium">
                          {c.lastMessageTime
                            ? new Date(c.lastMessageTime).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'No messages'}
                        </Typography>
                      </VStack>
                      {c.unreadCount > 0 && (
                        <Flex
                          w="18px"
                          h="18px"
                          borderRadius="full"
                          bg="mukuru.buttons.primary"
                          align="center"
                          justify="center"
                          flexShrink={0}
                        >
                          <Typography fontSize="9px" fontWeight="bold" color="mukuru.text.inverse">
                            {c.unreadCount}
                          </Typography>
                        </Flex>
                      )}
                    </HStack>
                  </Box>
                ));
              })()}
            </VStack>
          </Box>
        </Card>

            {/* Messages Panel */}
            <Box
              flex="1"
              minW="0"
              h="100%"
              borderRadius="lg"
              border="1px solid"
              borderColor="mukuru.grey.light"
              display="flex"
              flexDirection="column"
              overflow="hidden"
              bg="white"
            >
                  <EnhancedContextualMessaging
                    conversations={conversations}
                    messages={messages}
                    currentConversationId={currentConversationId ?? undefined}
                    currentApplicationId={currentApplicationId ?? undefined}
                    onSendMessage={handleSendMessage}
                    onReplyToMessage={async (messageId: string, content: string) => {
                      await handleSendMessage(content, undefined, [], messageId);
                    }}
                    onForwardMessage={async (
                      messageId: string,
                      toConversationId: string
                    ) => {
                      try {
                        const message = messages.find((m) => m.id === messageId);
                        if (!message) return;

                        const targetConversation = conversations.find(
                          (c) => c.id === toConversationId
                        );
                        if (!targetConversation) {
                          alert('Target conversation not found');
                          return;
                        }

                        const result = await forwardMessage(
                          messageId,
                          targetConversation.applicationId
                        );
                        if (result.success) {
                          alert('Message forwarded successfully');
                        } else {
                          alert(result.errorMessage || 'Failed to forward message');
                        }
                      } catch (error) {
                        console.error('Failed to forward message:', error);
                        alert('Failed to forward message');
                      }
                    }}
                    onStarMessage={async (messageId: string) => {
                      try {
                        await starMessage(messageId);
                        if (currentConversationId) {
                          const page = await getThreadMessages(
                            currentConversationId,
                            1,
                            50
                          );
                          const items = page.items || [];
                          const mapped = items.map((m: MessageDto) => {
                            const senderType = determineSenderType(m, currentUserEmail, currentUserName, sentMessageContentsRef.current);
                            const mappedAttachments = (m.attachments || []).map((a) => ({
                              id: a.id,
                              name: a.fileName,
                              type: a.contentType,
                              size: String(a.fileSizeBytes),
                              url: a.storageUrl || '',
                            }));
                            // Determine sender email: for partner messages use current user email
                            let displaySenderId = m.senderId || '';
                            if (senderType === 'partner') {
                              displaySenderId = currentUserEmail || displaySenderId;
                            } else if (displaySenderId && !displaySenderId.includes('@')) {
                              // If senderId is a GUID, use senderName or default
                              displaySenderId = m.senderName || 'Admin';
                            }
                            
                            return {
                              id: m.id,
                              senderId: displaySenderId, // Use email when available
                              senderName: m.senderName,
                              senderType: senderType,
                              content: m.content,
                              timestamp: m.sentAt,
                              status: (m.isRead ? 'read' : m.status) as any,
                              priority: 'normal',
                              attachments: mappedAttachments,
                              isRead: m.isRead,
                              isStarred: m.isStarred || false,
                              tags: [],
                              applicationId: currentApplicationId || '',
                              replyToMessageId: m.replyToMessageId,
                            };
                          }) as ContextualMessage[];
                          setMessages(
                            mapped.sort(
                              (a, b) =>
                                new Date(a.timestamp).getTime() -
                                new Date(b.timestamp).getTime()
                            )
                          );
                        }
                      } catch (error) {
                        console.error('Failed to star message:', error);
                      }
                    }}
                    onArchiveConversation={async (conversationId: string) => {
                      try {
                        const result = await archiveThread(conversationId, true);
                        if (result.success) {
                          const result = await getMyThreads(threadsPage, 20);
                          const items = (result.items ||
                            []) as unknown as MessageThreadDto[];
                          const mapped: ContextualConversation[] = items.map(
                            (t) =>
                              ({
                                id: t.id as any,
                                applicationId: t.applicationId as any,
                                partnerId: currentUserEmail ?? 'partner',
                                subject:
                                  t.applicationReference ||
                                  `Application ${t.applicationId}`,
                                status: 'active',
                                priority: 'normal',
                                lastMessage: t.lastMessage?.content,
                                lastMessageTime: t.lastMessageAt as any as string,
                                unreadCount: t.unreadCount ?? 0,
                                tags: [],
                                createdAt: new Date().toISOString(),
                                contextSections: [],
                              }) as any
                          );
                          setConversations(mapped);

                          if (currentConversationId === conversationId) {
                            setCurrentConversationId(null);
                          }
                        }
                      } catch (error) {
                        console.error('Failed to archive conversation:', error);
                        alert('Failed to archive conversation');
                      }
                    }}
                    onAssignConversation={async () => {}}
                    onTagConversation={async () => {}}
                    currentUser={{
                      id: currentUserEmail ?? 'partner',
                      name: currentUserName,
                      type: 'partner',
                    }}
                    applicationSections={applicationSections}
                    applicationDocuments={applicationDocuments}
                    loadingContext={loadingContext}
                    userApplications={userApplications}
                    loadingApplications={loadingApplications}
                    onApplicationSelect={async (applicationId: string) => {
                      setCurrentApplicationId(applicationId);
                      setCurrentConversationId(null);
                      setMessages([]);

                      // Try to get thread for this application
                      try {
                        const thread = await getThreadByApplication(applicationId);
                        if (thread) {
                          setCurrentConversationId(thread.id);
                        }
                      } catch (error) {
                        // Thread doesn't exist yet, will be created on first message
                        console.info(
                          '[Messages] No thread exists for selected application, will be created on first message'
                        );
                      }
                    }}
                  />
            </Box>
      </Flex>
    </Box>
  );
}
