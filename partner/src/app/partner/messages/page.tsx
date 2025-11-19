"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  Flex,
  Button,
  Image,
  Circle,
  Input,
  Textarea
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { getAuthUser } from "@/lib/auth/session";
// Removed mockData import - using real backend data only
import { EnhancedContextualMessaging, type ContextualConversation, type ContextualMessage } from "@/components/EnhancedContextualMessaging";
import { getMyThreads, getThreadMessages, sendMessage, markMessageRead, getUnreadCount, getApplicationSections, getApplicationDocuments, forwardMessage, starMessage, archiveThread, findUserCaseByEmail, getThreadByApplication, type MessageDto, type MessageThreadDto, type PagedResult, type ApplicationSection, type ApplicationDocument } from "@/lib/api";
import { signalRService } from "@/lib/signalRService";
import { uploadFileToDocumentService } from "@/lib/documentUpload";

const MotionBox = motion(Box);

export default function CustomerMessagesPage() {
  const [currentUserName, setCurrentUserName] = useState<string>("User");
  const [currentUserEmail, setCurrentUserEmail] = useState<string | undefined>(undefined);
  const [conversations, setConversations] = useState<ContextualConversation[]>([]);
  const [messages, setMessages] = useState<ContextualMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);
  const [threadsPage, setThreadsPage] = useState<number>(1);
  const [threadsPaged, setThreadsPaged] = useState<PagedResult<MessageThreadDto> | null>(null);
  const [messagesPage, setMessagesPage] = useState<number>(1);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  const [unreadTotal, setUnreadTotal] = useState<number>(0);
  const [applicationSections, setApplicationSections] = useState<ApplicationSection[]>([]);
  const [applicationDocuments, setApplicationDocuments] = useState<ApplicationDocument[]>([]);
  const [loadingContext, setLoadingContext] = useState<boolean>(false);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [isTyping, setIsTyping] = useState<{ [threadId: string]: { userName: string } }>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    setCurrentUserName(user.name);
    setCurrentUserEmail(user.email);
  }, []);

  // Initialize SignalR connection
  useEffect(() => {
    const initSignalR = async () => {
      try {
        await signalRService.connect();
        setSignalRConnected(true);

        // Set up event listeners
        const unsubscribeReceive = signalRService.on("ReceiveMessage", async (message: any) => {
          console.log('[Partner Messages] Received SignalR message:', message);
          
          // Determine if message is from admin or partner based on email domain and sender info
          const senderNameLower = (message.senderName || '').toLowerCase();
          const senderEmail = (message.senderEmail || message.senderId || '').toLowerCase();
          const currentUserEmailLower = (currentUserEmail || '').toLowerCase();
          
          // Check if message is from current user
          const isFromCurrentUser = senderEmail === currentUserEmailLower || 
                                   senderNameLower === (currentUserName || '').toLowerCase();
          
          // Determine if message is from admin
          const isFromAdmin = senderNameLower.includes('@mukuru.com') || 
                             senderEmail.includes('@mukuru.com') ||
                             message.senderRole === 'Admin' || 
                             message.senderRole === 'ComplianceManager';
          
          // If message is for current thread, add it immediately
          if (currentConversationId && message.threadId === currentConversationId) {
            const contextualMessage: ContextualMessage = {
              id: message.id,
              senderId: message.senderId,
              senderName: message.senderName,
              senderType: isFromAdmin ? 'admin' : 'partner',
              content: message.content,
              timestamp: message.sentAt,
              status: 'sent',
              priority: 'normal',
              attachments: message.attachments || [],
              isRead: false,
              isStarred: false,
              tags: [],
              applicationId: message.applicationId || currentApplicationId || ''
            };
            
            setMessages(prev => {
              // Check if message already exists (avoid duplicates)
              if (prev.some(m => m.id === message.id)) {
                return prev;
              }
              return [...prev, contextualMessage].sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
            });
          }
          
          // If message is for a different thread but we have it in our list, refresh that thread
          // Also refresh threads to update last message and unread counts
          const refreshThreads = async () => {
            try {
              const result = await getMyThreads(threadsPage, 20);
              const items = (result.items || []) as unknown as MessageThreadDto[];
              const mapped: ContextualConversation[] = items.map(t => ({
                id: t.id as any,
                applicationId: t.applicationId as any,
                partnerId: currentUserEmail ?? "partner",
                subject: t.applicationReference || `Application ${t.applicationId}`,
                status: 'active',
                priority: 'normal',
                lastMessage: t.lastMessage?.content,
                lastMessageTime: (t.lastMessageAt as any) as string,
                unreadCount: t.unreadCount ?? 0,
                tags: [],
                createdAt: new Date().toISOString(),
                contextSections: []
              } as any));
              setConversations(mapped);
              
              // If the message is for the current thread, also reload messages to ensure consistency
              if (currentConversationId && message.threadId === currentConversationId) {
                try {
                  const page = await getThreadMessages(currentConversationId, 1, 50);
                  const items = page.items || [];
                  const mapped = items.map((m: MessageDto) => {
                    const senderNameLower = (m.senderName || '').toLowerCase();
                    const isFromAdmin = senderNameLower.includes('@mukuru.com') || 
                                       m.senderRole === 'Admin' || 
                                       m.senderRole === 'ComplianceManager';
                    return {
                      id: m.id,
                      senderId: m.senderId,
                      senderName: m.senderName,
                      senderType: isFromAdmin ? 'admin' : 'partner',
                      content: m.content,
                      timestamp: m.sentAt,
                      status: (m.isRead ? 'read' : m.status) as any,
                      priority: 'normal',
                      attachments: [],
                      isRead: m.isRead,
                      isStarred: false,
                      tags: [],
                      applicationId: currentApplicationId || ''
                    };
                  }) as ContextualMessage[];
                  const sorted = mapped.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                  setMessages(sorted);
                } catch (e) {
                  console.error('Failed to reload messages after SignalR update:', e);
                }
              }
            } catch (e) {
              console.error('Failed to refresh threads:', e);
            }
          };
          
          refreshThreads();
          getUnreadCount().then(r => setUnreadTotal(r.count ?? 0)).catch(() => {});
        });

        const unsubscribeTyping = signalRService.on("UserTyping", (data: { userId: string; userName: string; threadId: string }) => {
          if (currentConversationId && data.threadId === currentConversationId) {
            setIsTyping(prev => ({ ...prev, [data.threadId]: { userName: data.userName } }));
            
            // Clear typing indicator after 3 seconds
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(prev => {
                const updated = { ...prev };
                delete updated[data.threadId];
                return updated;
              });
            }, 3000);
          }
        });

        return () => {
          unsubscribeReceive();
          unsubscribeTyping();
          signalRService.disconnect();
        };
      } catch (error) {
        console.error('[Partner Messages] Failed to connect SignalR:', error);
        setSignalRConnected(false);
      }
    };

    initSignalR();
  }, [currentConversationId, currentUserEmail, threadsPage]);

  // Join/leave thread when selection changes
  useEffect(() => {
    if (currentConversationId && signalRConnected) {
      // Validate threadId is a valid GUID before joining
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (guidRegex.test(currentConversationId) && currentConversationId !== '00000000-0000-0000-0000-000000000000') {
        signalRService.joinThread(currentConversationId).catch(error => {
          console.error('[Partner Messages] Failed to join thread:', error);
        });
        return () => {
          signalRService.leaveThread(currentConversationId).catch(error => {
            console.error('[Partner Messages] Failed to leave thread:', error);
          });
        };
      } else {
        console.warn('[Partner Messages] Invalid thread ID, skipping join:', currentConversationId);
      }
    }
  }, [currentConversationId, signalRConnected]);

  // No mock application usage. Data comes from backend only.

  useEffect(() => {
    let isMounted = true;
    // Load the user's threads from backend only
    (async () => {
      try {
        const result = await getMyThreads(threadsPage, 20);
        if (!isMounted) return;
        const items = (result.items || []) as unknown as MessageThreadDto[];
        const mapped: ContextualConversation[] = items.map(t => ({
          id: t.id as any,
          applicationId: t.applicationId as any,
          partnerId: currentUserEmail ?? "partner",
          subject: t.applicationReference || `Application ${t.applicationId}`,
          status: 'active',
          priority: 'normal',
          lastMessage: t.lastMessage?.content,
          lastMessageTime: (t.lastMessageAt as any) as string,
          unreadCount: t.unreadCount ?? 0,
          tags: [],
          createdAt: new Date().toISOString(),
          contextSections: []
        } as any));

        setConversations(mapped);
        setThreadsPaged(result as any);
        if (mapped.length > 0) {
          setCurrentConversationId(mapped[0].id);
          setCurrentApplicationId(mapped[0].applicationId);
        } else if (currentUserEmail) {
          // If no threads exist, try to get the user's case/application
          try {
            const userCase = await findUserCaseByEmail(currentUserEmail);
            if (userCase && userCase.caseId) {
              setCurrentApplicationId(userCase.caseId);
              // Try to get thread for this application
              try {
                const thread = await getThreadByApplication(userCase.caseId);
                if (thread) {
                  setCurrentConversationId(thread.id);
                }
              } catch (e) {
                // Thread doesn't exist yet, will be created on first message
                console.log('No thread exists yet for application, will be created on first message');
              }
            }
          } catch (e) {
            console.log('Could not find user case:', e);
          }
        }
      } catch (e) {
        // Keep empty state on error
        setConversations([]);
      }
    })();

    return () => { isMounted = false; };
  }, [currentUserEmail, threadsPage]);

  // Load messages for the selected conversation
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const threadId = currentConversationId;
      if (!threadId) return;
      try {
        const page = await getThreadMessages(threadId, messagesPage, 20);
        if (!isMounted) return;
        const items = page.items || [];
        const mapped = items.map((m: MessageDto) => {
          // Determine if message is from admin or partner based on email domain, name, and role
          const senderNameLower = (m.senderName || '').toLowerCase();
          const senderIdLower = (m.senderId || '').toLowerCase();
          const currentUserEmailLower = (currentUserEmail || '').toLowerCase();
          
          // Check email domain first (most reliable)
          const hasMukuruEmail = senderNameLower.includes('@mukuru.com') || 
                                senderIdLower.includes('@mukuru.com');
          const hasKurasikaEmail = senderNameLower.includes('@kurasika.com') || 
                                  senderIdLower.includes('@kurasika.com');
          
          // Admin detection: check role first, then email domain, then name patterns
          const adminNames = ['tendai gatahwa', 'tendai', 'admin', 'compliance', 'mukuru'];
          
          // Check if admin by name
          const isAdminByName = adminNames.some(name => senderNameLower.includes(name));
          
          // Determine if message is from admin
          const isFromAdmin = (m.senderRole === 'Admin' || 
                              m.senderRole === 'ComplianceManager') ||
                             hasMukuruEmail ||
                             (isAdminByName && !hasKurasikaEmail);
          
          // For partner view: partner messages are 'partner', admin messages are 'admin'
          const senderType = isFromAdmin ? 'admin' : 'partner';
          
          return {
            id: m.id,
            senderId: m.senderId,
            senderName: m.senderName,
            senderType: senderType,
            content: m.content,
            timestamp: m.sentAt,
            status: (m.isRead ? 'read' : m.status) as any,
            priority: 'normal',
            attachments: [],
            isRead: m.isRead,
            isStarred: false,
            tags: [],
            applicationId: currentApplicationId || ''
          };
        }) as ContextualMessage[];
        // Sort by timestamp: oldest first (ascending order)
        const sorted = [...mapped].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(prev => {
          if (messagesPage === 1) {
            return sorted;
          } else {
            // Merge and sort: oldest at top, newest at bottom
            const merged = [...prev, ...sorted];
            return merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          }
        });
        setHasMoreMessages((page as any).hasNextPage);

        // Best-effort mark unread as read
        items.filter(m => !m.isRead).forEach(m => {
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
      return () => { isMounted = false; clearInterval(id); };
    }
    return () => { isMounted = false; };
  }, [currentConversationId, currentApplicationId, messagesPage, currentUserEmail, signalRConnected]);

  // Load application sections and documents when application changes
  useEffect(() => {
    if (!currentApplicationId) {
      setApplicationSections([]);
      setApplicationDocuments([]);
      setLoadingContext(false);
      return;
    }

    let isMounted = true;
    const loadContext = async () => {
      setLoadingContext(true);
      try {
        const [sections, documents] = await Promise.all([
          getApplicationSections(currentApplicationId),
          getApplicationDocuments(currentApplicationId)
        ]);
        
        if (isMounted) {
          setApplicationSections(sections);
          setApplicationDocuments(documents);
          setLoadingContext(false);
        }
      } catch (error) {
        console.error('Failed to load application context:', error);
        if (isMounted) {
          setApplicationSections([]);
          setApplicationDocuments([]);
          setLoadingContext(false);
        }
      }
    };

    loadContext();
    return () => { isMounted = false; };
  }, [currentApplicationId]);

  // Unread total polling
  useEffect(() => {
    let active = true;
    const refreshUnread = async () => {
      try {
        const r = await getUnreadCount();
        if (active) setUnreadTotal(r.count ?? 0);
      } catch {}
    };
    refreshUnread();
    const id = setInterval(refreshUnread, 10000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const handleSendMessage = async (content: string, _context?: any, attachments: File[] = [], replyToMessageId?: string) => {
    if ((!content.trim() && attachments.length === 0) || !currentApplicationId) {
      console.warn('Cannot send message: missing applicationId or content');
      return;
    }
    
    // If no conversation exists yet, we'll create one by sending the message
    // The backend automatically creates a thread when sending the first message
    let threadId = currentConversationId;
    
    // Upload attachments first if any
    let attachmentInfos: Array<{ fileName: string; contentType: string; fileSizeBytes: number; storageKey: string; storageUrl: string; documentId?: string; description?: string }> = [];
    
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
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
          }
          const hex = Math.abs(hash).toString(16).padStart(32, '0');
          partnerId = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
        }
        
        attachmentInfos = await Promise.all(attachments.map(async (file) => {
          try {
            const uploadResult = await uploadFileToDocumentService(
              currentApplicationId,
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
              description: `Message attachment: ${file.name}`
            };
          } catch (error) {
            console.error(`Failed to upload attachment ${file.name}:`, error);
            // Continue with placeholder if upload fails
            return {
              fileName: file.name,
              contentType: file.type || 'application/octet-stream',
              fileSizeBytes: file.size,
              storageKey: `messages/${currentApplicationId}/${Date.now()}-${file.name}`,
              storageUrl: '',
              description: undefined
            };
          }
        }));
      } catch (error) {
        console.error('Error uploading attachments:', error);
      }
    }
    
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
      attachments: attachments.map((f, i) => ({ id: `${i}`, name: f.name, type: f.type, size: `${f.size}`, url: '' })),
      isRead: false,
      isStarred: false,
      tags: [],
      applicationId: currentApplicationId
    };
    setMessages(prev => [...prev, optimisticMsg].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));

    // Attempt to persist via backend
    try {
      const sendResult = await sendMessage(currentApplicationId, content, undefined, replyToMessageId, attachmentInfos.length > 0 ? attachmentInfos : undefined);
      
      // If we didn't have a conversationId before, get it from the send result or fetch the thread
      if (!threadId && sendResult.threadId) {
        threadId = sendResult.threadId;
        setCurrentConversationId(threadId);
      } else if (!threadId) {
        // Try to get thread by application ID
        try {
          const thread = await getThreadByApplication(currentApplicationId);
          if (thread) {
            threadId = thread.id;
            setCurrentConversationId(threadId);
          }
        } catch (e) {
          console.warn('Could not fetch thread after sending message:', e);
        }
      }
      
      // Refresh messages after successful send to ensure proper sender type detection
      if (threadId) {
        // Wait a bit for SignalR to process, then reload
        setTimeout(async () => {
          try {
            const page = await getThreadMessages(threadId as string, 1, 50);
            const items = page.items || [];
            const mapped = items.map((m: MessageDto) => {
              const senderNameLower = (m.senderName || '').toLowerCase();
              const senderIdLower = (m.senderId || '').toLowerCase();
              const currentUserEmailLower = currentUserEmail ? currentUserEmail.toLowerCase() : '';
              
              // Check if message is from current user (for reference, not used in senderType)
              // const isFromCurrentUser = senderIdLower === currentUserEmailLower || 
              //                          senderNameLower === (currentUserName || '').toLowerCase();
              
              // Determine if message is from admin
              const isFromAdmin = senderNameLower.includes('@mukuru.com') || 
                                 senderIdLower.includes('@mukuru.com') ||
                                 m.senderRole === 'Admin' || 
                                 m.senderRole === 'ComplianceManager';
              
              // For partner view: partner messages are 'partner', admin messages are 'admin'
              const senderType = isFromAdmin ? 'admin' : 'partner';
              
              return {
                id: m.id,
                senderId: m.senderId,
                senderName: m.senderName,
                senderType: senderType,
                content: m.content,
                timestamp: m.sentAt,
                status: (m.isRead ? 'read' : m.status) as any,
                priority: 'normal',
                attachments: [],
                isRead: m.isRead,
                isStarred: false,
                tags: [],
                applicationId: currentApplicationId
              };
            }) as ContextualMessage[];
            
            // Sort and update messages
            const sorted = mapped.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            setMessages(sorted);
            setMessagesPage(1);
          } catch (error) {
            console.error('Failed to refresh messages after send:', error);
          }
        }, 500);
      }
      
      // Update unread total after send
      getUnreadCount().then(r => setUnreadTotal(r.count ?? 0)).catch(() => {});
      
      // Refresh threads to update last message and show new thread if created
      const threadsResult = await getMyThreads(threadsPage, 20);
      const threadItems = (threadsResult.items || []) as unknown as MessageThreadDto[];
      const updatedThreads: ContextualConversation[] = threadItems.map(t => ({
        id: t.id as any,
        applicationId: t.applicationId as any,
        partnerId: currentUserEmail ?? "partner",
        subject: t.applicationReference || `Application ${t.applicationId}`,
        status: 'active',
        priority: 'normal',
        lastMessage: t.lastMessage?.content,
        lastMessageTime: (t.lastMessageAt as any) as string,
        unreadCount: t.unreadCount ?? 0,
        tags: [],
        createdAt: new Date().toISOString(),
        contextSections: []
      } as any));
      setConversations(updatedThreads);
      
      // If we just created a new thread, select it
      if (!currentConversationId && threadId) {
        setCurrentConversationId(threadId);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      // Show error banner would be handled by the component
    }
  };

  const noop = async () => {};

  // With fallback above, we always render the designed page

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" py="4">
        <Container maxW="7xl">
          <Flex justify="space-between" align="center">
            <HStack gap="4">
              <Link href="/partner/dashboard">
                <Button variant="ghost" size="sm">← Back</Button>
              </Link>
              <Image src="/mukuru-logo.png" alt="Mukuru" height="32px" />
              <Text color="gray.600" fontSize="sm">Messages</Text>
            </HStack>
            <HStack gap="4">
              <Circle size="32px" bg="orange.500" color="white">
                <Text fontSize="sm" fontWeight="bold">JD</Text>
              </Circle>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Messages Container - Fixed height, no page scrolling */}
      <Box 
        height="calc(100vh - 80px)" 
        display="flex" 
        flexDirection="column"
        overflow="hidden"
      >
        <Container maxW="7xl" flex="1" display="flex" flexDirection="column" py="4" overflow="hidden">
          {/* Page Header - Fixed */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            mb="3"
            flexShrink={0}
          >
            <VStack align="start" gap="1">
              <Text fontSize="xl" fontWeight="semibold" color="gray.900">Messages</Text>
              <Text fontSize="xs" color="gray.600">Communicate with our team regarding your application.</Text>
            </VStack>
          </MotionBox>

          {/* Messages Container - Takes remaining space */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            flex="1"
            display="flex"
            overflow="hidden"
            minH="0"
          >
            <Flex gap="6" width="100%" height="100%" overflow="hidden">
              {/* Threads Sidebar - Independent scroll */}
              <Box 
                width="320px" 
                bg="white" 
                borderRadius="lg" 
                boxShadow="sm"
                border="1px"
                borderColor="gray.200"
                display="flex"
                flexDirection="column"
                overflow="hidden"
              >
                <Box p="3" borderBottom="1px" borderColor="gray.200" bg="gray.50" flexShrink={0}>
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" fontWeight="semibold" color="gray.900">My Threads</Text>
                    {unreadTotal > 0 && (
                      <Box 
                        px="2" 
                        py="0.5" 
                        borderRadius="full" 
                        bg="orange.500" 
                        color="white" 
                        fontSize="2xs" 
                        fontWeight="bold"
                        minW="18px"
                        textAlign="center"
                      >
                        {unreadTotal}
                      </Box>
                    )}
                  </HStack>
                </Box>
                <VStack align="stretch" gap="1.5" flex="1" overflowY="auto" p="3">
                  {conversations.length === 0 ? (
                    <Box p="6" textAlign="center">
                      <Text fontSize="xs" color="gray.500" fontWeight="medium">No conversations yet</Text>
                      <Text fontSize="2xs" color="gray.400" mt="1">Messages will appear here</Text>
                    </Box>
                  ) : (
                    conversations.map((c) => (
                      <Box
                        key={c.id}
                        p="3"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor={currentConversationId === c.id ? "#3182ce" : "gray.200"}
                        bg={currentConversationId === c.id ? "blue.50" : "white"}
                        cursor="pointer"
                        boxShadow={currentConversationId === c.id ? "0 2px 8px rgba(49, 130, 206, 0.15)" : "0 1px 3px rgba(0, 0, 0, 0.05)"}
                        onClick={() => {
                          setCurrentConversationId(c.id);
                          setCurrentApplicationId(c.applicationId);
                          setMessagesPage(1);
                        }}
                        _hover={{ 
                          bg: currentConversationId === c.id ? "blue.50" : "gray.50",
                          borderColor: currentConversationId === c.id ? "#3182ce" : "gray.300",
                          boxShadow: currentConversationId === c.id ? "0 4px 12px rgba(49, 130, 206, 0.2)" : "0 2px 6px rgba(0, 0, 0, 0.1)",
                          transform: "translateY(-1px)"
                        }}
                        transition="all 0.2s ease"
                        position="relative"
                      >
                        {/* Active indicator */}
                        {currentConversationId === c.id && (
                          <Box
                            position="absolute"
                            left="0"
                            top="0"
                            bottom="0"
                            width="3px"
                            bg="#3182ce"
                            borderRadius="lg"
                          />
                        )}
                        <VStack align="stretch" gap="2">
                          <HStack justify="space-between" align="start" gap="2">
                            <VStack align="start" gap="0.5" flex="1" minW="0">
                              <HStack gap="1.5" align="center" width="100%">
                                <Box
                                  width="8px"
                                  height="8px"
                                  borderRadius="full"
                                  bg={currentConversationId === c.id ? "#3182ce" : "gray.400"}
                                  flexShrink={0}
                                />
                                <Text 
                                  fontSize="xs" 
                                  color={currentConversationId === c.id ? "gray.900" : "gray.800"} 
                                  fontWeight={currentConversationId === c.id ? "semibold" : "medium"}
                                  lineHeight="1.3"
                                  overflow="hidden"
                                  textOverflow="ellipsis"
                                  display="-webkit-box"
                                  style={{ WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                                >
                                  {c.subject || `Application ${c.applicationId?.slice(0, 8)}...`}
                                </Text>
                              </HStack>
                              <Text 
                                fontSize="2xs" 
                                color={currentConversationId === c.id ? "gray.600" : "gray.500"}
                                ml="3.5"
                              >
                                {c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleString('en-US', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                }) : 'No messages'}
                              </Text>
                            </VStack>
                            {c.unreadCount > 0 && (
                              <Box 
                                px="2" 
                                py="0.5" 
                                borderRadius="full" 
                                bg="orange.500" 
                                color="white" 
                                fontSize="2xs" 
                                fontWeight="bold"
                                flexShrink={0}
                                minW="20px"
                                textAlign="center"
                                boxShadow="0 2px 4px rgba(237, 137, 54, 0.3)"
                              >
                                {c.unreadCount}
                              </Box>
                            )}
                          </HStack>
                          {c.lastMessage && (
                            <Box 
                              ml="3.5"
                              p="2"
                              bg={currentConversationId === c.id ? "white" : "gray.50"}
                              borderRadius="sm"
                              border="1px"
                              borderColor={currentConversationId === c.id ? "blue.100" : "gray.100"}
                            >
                              <Text 
                                fontSize="2xs" 
                                color="gray.600" 
                                overflow="hidden"
                                textOverflow="ellipsis"
                                whiteSpace="nowrap"
                                lineHeight="1.4"
                              >
                                {c.lastMessage}
                              </Text>
                            </Box>
                          )}
                        </VStack>
                      </Box>
                    ))
                  )}
                </VStack>
              </Box>

              {/* Messages Surface - Independent scroll */}
              <Box 
                flex="1" 
                bg="white" 
                borderRadius="xl" 
                boxShadow="sm" 
                display="flex" 
                flexDirection="column"
                overflow="hidden"
                minH="0"
              >
                {/* Load older button */}
                {hasMoreMessages && (
                  <Box p="3" borderBottom="1px" borderColor="gray.200" bg="gray.50" flexShrink={0}>
                    <Button size="sm" variant="outline" onClick={() => setMessagesPage(p => p + 1)}>Load older messages</Button>
                  </Box>
                )}
                <Box flex="1" display="flex" flexDirection="column" overflow="hidden" minH="0">
                  <EnhancedContextualMessaging
                    conversations={conversations}
                    messages={messages}
                    currentConversationId={currentConversationId ?? undefined}
                    currentApplicationId={currentApplicationId ?? undefined}
                    onSendMessage={handleSendMessage}
                    onReplyToMessage={async (messageId: string, content: string) => {
                      await handleSendMessage(content, undefined, [], messageId);
                    }}
                    onForwardMessage={async (messageId: string, toConversationId: string) => {
                      try {
                        const message = messages.find(m => m.id === messageId);
                        if (!message) return;
                        
                        const targetConversation = conversations.find(c => c.id === toConversationId);
                        if (!targetConversation) {
                          alert('Target conversation not found');
                          return;
                        }
                        
                        const result = await forwardMessage(messageId, targetConversation.applicationId);
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
                          const page = await getThreadMessages(currentConversationId, 1, 50);
                          const items = page.items || [];
                          const mapped = items.map((m: MessageDto) => ({
                            id: m.id,
                            senderId: m.senderId,
                            senderName: m.senderName,
                            senderType: (() => {
                              const senderNameLower = (m.senderName || '').toLowerCase();
                              const isFromAdmin = senderNameLower.includes('@mukuru.com') || 
                                                 m.senderRole === 'Admin' || 
                                                 m.senderRole === 'ComplianceManager';
                              return isFromAdmin ? 'admin' : 'partner';
                            })(),
                            content: m.content,
                            timestamp: m.sentAt,
                            status: (m.isRead ? 'read' : m.status) as any,
                            priority: 'normal',
                            attachments: [],
                            isRead: m.isRead,
                            isStarred: false,
                            tags: [],
                            applicationId: currentApplicationId
                          })) as ContextualMessage[];
                          setMessages(mapped.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
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
                          const items = (result.items || []) as unknown as MessageThreadDto[];
                          const mapped: ContextualConversation[] = items.map(t => ({
                            id: t.id as any,
                            applicationId: t.applicationId as any,
                            partnerId: currentUserEmail ?? "partner",
                            subject: t.applicationReference || `Application ${t.applicationId}`,
                            status: 'active',
                            priority: 'normal',
                            lastMessage: t.lastMessage?.content,
                            lastMessageTime: (t.lastMessageAt as any) as string,
                            unreadCount: t.unreadCount ?? 0,
                            tags: [],
                            createdAt: new Date().toISOString(),
                            contextSections: []
                          } as any));
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
                    currentUser={{ id: currentUserEmail ?? 'partner', name: currentUserName, type: 'partner' }}
                    applicationSections={applicationSections}
                    applicationDocuments={applicationDocuments}
                    loadingContext={loadingContext}
                  />
                </Box>
              </Box>
            </Flex>
          </MotionBox>
        </Container>
      </Box>
    </Box>
  );
}
