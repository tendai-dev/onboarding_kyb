"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Badge,
  Icon,
  Flex,
  Spinner,
  Avatar,
} from "@chakra-ui/react";
import { 
  FiSend, 
  FiPaperclip, 
  FiClock,
  FiUser,
  FiMessageSquare,
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiPlus,
  FiCheck,
  FiCheckCircle,
  FiStar,
  FiX,
  FiTrash2,
  FiCornerUpRight,
  FiShare2,
  FiArchive,
  FiDownload,
  FiFileText
} from "react-icons/fi";
import { SweetAlert } from "../../utils/sweetAlert";
import { useState, useEffect, useRef } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { messagingApi, MessageDto, MessageThreadDto } from "../../lib/messagingApi";
import { signalRService } from "../../lib/signalRService";
import { pushNotificationService } from "../../lib/pushNotifications";
import { messageTemplatesService } from "../../lib/messageTemplates";
import { messageExportService } from "../../lib/messageExport";
import { uploadFileToDocumentService } from "../../lib/documentUpload";
import Link from "next/link";

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
  const [threads, setThreads] = useState<MessageThreadDto[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThreadDto | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterArchived, setFilterArchived] = useState<boolean>(false);
  const [filterStarred, setFilterStarred] = useState<boolean>(false);
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState({
    applicationId: "",
    content: "",
    receiverId: ""
  });
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [isTyping, setIsTyping] = useState<{ [threadId: string]: { userName: string } }>({});
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DisplayMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<DisplayMessage | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [attachmentUploadProgress, setAttachmentUploadProgress] = useState<{ [fileName: string]: number }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize SignalR connection
  useEffect(() => {
    const initSignalR = async () => {
      try {
        await signalRService.connect();
        setSignalRConnected(true);

        // Set up event listeners
        const unsubscribeReceive = signalRService.on("ReceiveMessage", async (message: any) => {
          console.log('[Admin Messages] Received SignalR message:', message);
          
          // Show push notification for new messages
          if (document.hidden || !selectedThread || message.threadId !== selectedThread.id) {
            try {
              await pushNotificationService.showMessageNotification(
                message.senderName || 'Admin',
                message.content || 'New message',
                message.threadId
              );
            } catch (error) {
              console.error('[Messages] Failed to show notification:', error);
            }
          }
          
          // If message is for current thread, add it immediately
          if (selectedThread && message.threadId === selectedThread.id) {
            // Determine sender type more accurately
            const senderNameLower = (message.senderName || '').toLowerCase();
            const senderEmail = (message.senderEmail || message.senderId || '').toLowerCase();
            
            // Determine if message is from admin
            const isFromAdmin = senderNameLower.includes('@mukuru.com') || 
                               senderEmail.includes('@mukuru.com') ||
                               message.senderRole === 'Admin' || 
                               message.senderRole === 'ComplianceManager';
            
            const displayMessage: DisplayMessage = {
              id: message.id,
              sender: message.senderName,
              senderType: isFromAdmin ? 'ADMIN' : 'PARTNER',
              subject: getSubjectFromThread(selectedThread),
              content: message.content,
              timestamp: message.sentAt,
              applicationId: message.applicationId || selectedThread.applicationId,
              attachments: message.attachments || [],
              isRead: false,
              isStarred: false,
              priority: determinePriority({ content: message.content } as MessageDto),
              threadId: message.threadId
            };
            
            setMessages(prev => {
              // Check if message already exists (avoid duplicates)
              if (prev.some(m => m.id === message.id)) {
                return prev;
              }
              return [...prev, displayMessage].sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
            });
            
            // Scroll to bottom
            setTimeout(() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
              }
            }, 100);
            
            // Also reload messages from backend to ensure consistency and proper sender type
            setTimeout(async () => {
              try {
                await loadThreadMessages(selectedThread.id);
              } catch (error) {
                console.error('[Admin Messages] Failed to reload messages after SignalR update:', error);
              }
            }, 500);
          }
          
          // Refresh threads to update last message and unread counts
          loadThreads();
          loadUnreadCount();
        });

        const unsubscribeSent = signalRService.on("MessageSent", (message: any) => {
          // Message was sent successfully via SignalR
          if (selectedThread && message.threadId === selectedThread.id) {
            loadThreadMessages(selectedThread.id);
          }
          loadThreads();
          loadUnreadCount();
        });

        const unsubscribeTyping = signalRService.on("UserTyping", (data: { userId: string; userName: string; threadId: string }) => {
          if (selectedThread && data.threadId === selectedThread.id) {
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

        const unsubscribeRead = signalRService.on("MessageRead", (messageId: string) => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isRead: true } : msg
          ));
        });

        return () => {
          unsubscribeReceive();
          unsubscribeSent();
          unsubscribeTyping();
          unsubscribeRead();
          signalRService.disconnect();
        };
      } catch (error) {
        console.error('[Messages] Failed to connect SignalR:', error);
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
      if (guidRegex.test(selectedThread.id) && selectedThread.id !== '00000000-0000-0000-0000-000000000000') {
        signalRService.joinThread(selectedThread.id).catch(error => {
          console.error('[Messages] Failed to join thread:', error);
        });
        return () => {
          signalRService.leaveThread(selectedThread.id).catch(error => {
            console.error('[Messages] Failed to leave thread:', error);
          });
        };
      } else {
        console.warn('[Messages] Invalid thread ID, skipping join:', selectedThread.id);
      }
    }
  }, [selectedThread, signalRConnected]);

  useEffect(() => {
    // Diagnostic: Check identity (non-critical, failures are OK)
    const checkIdentity = async () => {
      try {
        const response = await fetch('/api/proxy/messaging/api/v1/messages/diagnostic/identity');
        if (response.ok) {
          const identity = await response.json();
          console.log('[Messages] Identity Diagnostic:', identity);
        } else {
          // Non-critical - endpoint might not be available in all environments
          console.warn('[Messages] Identity diagnostic endpoint returned:', response.status);
        }
      } catch (err) {
        // Non-critical - just log and continue
        console.warn('[Messages] Failed to get identity (non-critical):', err);
      }
    };
    checkIdentity();
    
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

  useEffect(() => {
    if (selectedThread && selectedThread.id) {
      // Only load if we're not already loading to prevent loops
      if (!loadingMessages) {
        loadThreadMessages(selectedThread.id);
      }
      // Update newMessage with the current thread's applicationId
      setNewMessage(prev => ({
        ...prev,
        applicationId: selectedThread.applicationId
      }));
    }
  }, [selectedThread?.id]); // Only depend on thread ID to prevent unnecessary reloads

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("[Messages] Loading threads...");
      // Use getAllThreads for admin to see all messages
      let result;
      try {
        result = await messagingApi.getAllThreads(1, 100);
        console.log("[Messages] Using getAllThreads - loaded all threads");
      } catch (allThreadsError) {
        // Fallback to getMyThreads if getAllThreads fails (e.g., not admin)
        console.warn("[Messages] getAllThreads failed, falling back to getMyThreads:", allThreadsError);
        result = await messagingApi.getMyThreads(1, 100);
      }
      console.log("[Messages] Threads loaded:", {
        totalCount: result.totalCount,
        itemsCount: result.items?.length || 0,
        items: result.items
      });
      setThreads(result.items || []);
      // Clear error if successful
      if (result.items && result.items.length >= 0) {
        setError(null);
      }
      // Log if no threads found
      if (!result.items || result.items.length === 0) {
        console.warn("[Messages] No threads found. TotalCount:", result.totalCount);
      }
    } catch (err) {
      if (typeof window !== 'undefined') {
        const { clientSentry } = await import('../../lib/sentry-client');
        clientSentry.reportError(err, {
          tags: { error_type: 'messages', operation: 'load_threads' },
          level: 'error',
        });
      }
      const errorMessage = err instanceof Error ? err.message : "Failed to load messages";
      // Check if it's a connection error
      if (errorMessage.includes('connect') || errorMessage.includes('unavailable') || errorMessage.includes('ECONNREFUSED')) {
        setError("Cannot connect to messaging service. Please ensure the backend messaging service is running on port 8087.");
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
      const displayMessages: DisplayMessage[] = (result.items || []).map((msg: MessageDto) => {
        // Determine sender type based on email domain, name, and role
        const senderNameLower = (msg.senderName || '').toLowerCase();
        const senderIdLower = (msg.senderId || '').toLowerCase();
        const senderRole = (msg.senderRole || '').trim();
        const roleUpper = senderRole.toUpperCase();
        
        // Check email domain first (most reliable)
        const hasMukuruEmail = senderNameLower.includes('@mukuru.com') || 
                              senderIdLower.includes('@mukuru.com');
        const hasKurasikaEmail = senderNameLower.includes('@kurasika.com') || 
                                senderIdLower.includes('@kurasika.com');
        
        // Admin detection: check role first, then email domain, then name patterns
        const adminNames = ['tendai gatahwa', 'tendai', 'admin', 'compliance', 'mukuru'];
        const customerNames = ['alpha tembo', 'alpha', 'customer', 'applicant'];
        
        // Check if admin by name
        const isAdminByName = adminNames.some(name => senderNameLower.includes(name));
        
        // Check if customer by name
        const isCustomerByName = customerNames.some(name => senderNameLower.includes(name));
        
        // Determine if admin: check role first, then email domain, then name
        const isAdmin = (senderRole === 'Admin' || 
                        senderRole === 'ComplianceManager' ||
                        roleUpper === 'ADMIN' ||
                        roleUpper === 'COMPLIANCEMANAGER' ||
                        roleUpper.includes('ADMIN') || 
                        roleUpper.includes('COMPLIANCE')) ||
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
          applicationId: selectedThread?.applicationId || "",
          attachments: msg.attachments?.map(a => ({
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
      });
      // Sort messages by timestamp: oldest first (ascending order)
      const sortedMessages = displayMessages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(sortedMessages);
      
      // Mark unread messages as read (don't await to avoid blocking)
      const unreadMessages = displayMessages.filter(m => !m.isRead);
      if (unreadMessages.length > 0) {
        // Mark as read in background without blocking
        Promise.all(unreadMessages.map(msg => 
          messagingApi.markMessageRead(msg.id).catch(err => 
            console.warn("Failed to mark message as read:", err)
          )
        )).then(() => {
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
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const mapSenderRole = (role: string, senderName?: string): 'ADMIN' | 'PARTNER' | 'CUSTOMER' => {
    const upperRole = role.toUpperCase();
    if (upperRole.includes('ADMIN')) return 'ADMIN';
    if (upperRole.includes('PARTNER')) return 'PARTNER';
    
    // Check email domain to determine if admin or customer
    if (senderName) {
      const nameLower = senderName.toLowerCase();
      if (nameLower.includes('@mukuru.com')) return 'ADMIN';
      if (nameLower.includes('@kurasika.com')) return 'CUSTOMER';
    }
    
    return 'CUSTOMER';
  };

  // Determine if message is from admin (for alignment)
  // In admin view: admin messages go on the right, customer messages on the left
  // NOTE: Backend is storing all messages with sender_role='Applicant', so we detect by name
  const isFromAdmin = (message: DisplayMessage): boolean => {
    if (!message.sender) return false;
    
    const senderLower = message.sender.toLowerCase();
    
    // Check senderType first (if backend ever fixes it)
    if (message.senderType === 'ADMIN') {
      return true;
    }
    
    // Check for @mukuru.com email domain
    if (senderLower.includes('@mukuru.com')) {
      return true;
    }
    
    // Check for known admin names (since backend role is broken)
    // Admin names: Tendai Gatahwa, or any name that doesn't match customer patterns
    const adminNames = ['tendai gatahwa', 'tendai', 'admin', 'compliance', 'mukuru'];
    const customerNames = ['alpha tembo', 'alpha', 'customer', 'applicant'];
    
    // If it matches admin name patterns, it's admin
    if (adminNames.some(name => senderLower.includes(name))) {
      return true;
    }
    
    // If it matches customer name patterns, it's NOT admin
    if (customerNames.some(name => senderLower.includes(name))) {
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
    if (!thread) return "No Subject";
    return `Application ${thread.applicationReference || thread.applicationId}`;
  };

  const determinePriority = (msg: MessageDto): 'LOW' | 'MEDIUM' | 'HIGH' => {
    // Determine priority based on content or other factors
    const content = msg.content.toLowerCase();
    if (content.includes('urgent') || content.includes('asap') || content.includes('immediate')) {
      return 'HIGH';
    }
    return 'MEDIUM';
  };

  const handleSendMessage = async () => {
    if ((!newMessage.content.trim() && selectedAttachments.length === 0) || !selectedThread) {
      await SweetAlert.warning("Message Required", "Please enter a message or attach a file");
      return;
    }

    try {
      setSending(true);
      setError(null);
      
      // Upload attachments first if any
      let attachmentInfos: Array<{ fileName: string; contentType: string; fileSizeBytes: number; storageKey: string; storageUrl: string; documentId?: string; description?: string }> = [];
      
      if (selectedAttachments.length > 0) {
        // Upload files to document service and get storage keys/URLs
        setUploadingAttachments(true);
        setAttachmentUploadProgress({});
        
        try {
          attachmentInfos = await Promise.all(selectedAttachments.map(async (file, index) => {
            try {
              // Update progress
              setAttachmentUploadProgress(prev => ({ ...prev, [file.name]: 50 }));
              
              const uploadResult = await uploadFileToDocumentService(
                selectedThread.applicationId,
                file,
                `Message attachment: ${file.name}`,
                undefined // Will be extracted from session
              );
              
              // Mark as complete
              setAttachmentUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
              
              return {
                fileName: file.name,
                contentType: file.type || 'application/octet-stream',
                fileSizeBytes: file.size,
                storageKey: uploadResult.storageKey,
                storageUrl: uploadResult.storageUrl || '',
                documentId: uploadResult.documentId,
                description: `Message attachment: ${file.name}`
              };
            } catch (error) {
              console.error(`Failed to upload attachment ${file.name}:`, error);
              setAttachmentUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // -1 indicates error
              
              // Ask user if they want to continue without this attachment
              const shouldContinue = await SweetAlert.confirm(
                "Upload Failed",
                `Failed to upload "${file.name}". Do you want to continue sending the message without this attachment?`,
                "Continue Without It",
                "Cancel",
                "warning"
              );
              
              if (!shouldContinue.isConfirmed) {
                throw new Error("User cancelled message send due to attachment upload failure");
              }
              
              // Continue with placeholder if user chooses to proceed
              return {
                fileName: file.name,
                contentType: file.type || 'application/octet-stream',
                fileSizeBytes: file.size,
                storageKey: `messages/${selectedThread.applicationId}/${Date.now()}-${file.name}`,
                storageUrl: '',
                description: undefined
              };
            }
          }));
        } catch (error) {
          console.error('Error uploading attachments:', error);
          if (error instanceof Error && error.message.includes("User cancelled")) {
            setUploadingAttachments(false);
            setAttachmentUploadProgress({});
            return; // User cancelled, don't send message
          }
          await SweetAlert.warning("Upload Warning", "Some attachments failed to upload. The message will be sent without attachments.");
        } finally {
          setUploadingAttachments(false);
          setAttachmentUploadProgress({});
        }
      }
      
      console.log('Sending message:', {
        applicationId: selectedThread.applicationId,
        content: newMessage.content.substring(0, 50) + '...',
        receiverId: newMessage.receiverId || 'none',
        replyToMessageId: replyingTo?.id,
        attachmentsCount: attachmentInfos.length
      });

      const result = await messagingApi.sendMessage(
        selectedThread.applicationId,
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
        setNewMessage({ applicationId: "", content: "", receiverId: "" });
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
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
          }, 100);
        }, 500);
      } else {
        throw new Error(result.errorMessage || "Failed to send message");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);
      await SweetAlert.error("Failed to Send", errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleComposeNew = () => {
    setShowCompose(true);
    setSelectedThread(null);
    setMessages([]);
  };

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = 
      thread.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.applicationReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.applicationId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "ALL" || 
      (filterType === "UNREAD" && thread.unreadCount > 0) ||
      (filterType === "ACTIVE" && thread.isActive);
    
    const matchesArchived = filterArchived ? thread.isArchived : !thread.isArchived;
    const matchesStarred = filterStarred ? thread.isStarred : true;
    
    return matchesSearch && matchesFilter && matchesArchived && matchesStarred;
  });

  // Filter and sort messages: oldest at top, newest at bottom
  const filteredMessages = messages
    .filter(message => {
      if (!messageSearchTerm) return true;
      const search = messageSearchTerm.toLowerCase();
      return (
        message.content.toLowerCase().includes(search) ||
        message.sender.toLowerCase().includes(search) ||
        message.subject.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      // Sort by timestamp: oldest first (ascending order)
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'red';
      case 'MEDIUM': return 'orange';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  };

  const getSenderTypeColor = (type: string) => {
    switch (type) {
      case 'ADMIN': return 'blue';
      case 'PARTNER': return 'green';
      case 'CUSTOMER': return 'purple';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Box height="100vh" overflow="hidden" display="flex">
        <AdminSidebar />
        <Box ml="240px" p="8" bg="gray.50" h="100vh" flex="1" display="flex" alignItems="center" justifyContent="center">
          <Spinner size="xl" color="orange.500" />
        </Box>
      </Box>
    );
  }

  return (
    <Box height="100vh" overflow="hidden" display="flex">
      <AdminSidebar />
      <Box ml="240px" bg="gray.50" h="100vh" display="flex" flexDirection="column" overflow="hidden" flex="1">
        <Container maxW="full" flex="1" display="flex" flexDirection="column" p="6" overflow="hidden" minH="0">
          <VStack gap="4" align="stretch" flex="1" minH="0" overflow="hidden">
            {/* Header */}
            <Flex justify="space-between" align="center" flexShrink={0}>
              <VStack align="start" gap="1">
                <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                  Messages
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Communicate with partners and customers
                </Text>
              </VStack>
              
              <HStack gap="3">
                <Button
                  bg="gray.800"
                  color="white"
                  size="sm"
                  _hover={{ bg: "gray.700" }}
                  disabled
                  fontWeight="normal"
                >
                  {unreadCount} Unread
                </Button>
                {signalRConnected ? (
                  <Badge colorScheme="green" variant="solid" fontSize="xs" px="2" py="1" borderRadius="md">
                    ● Live
                  </Badge>
                ) : (
                  <Badge colorScheme="gray" variant="solid" fontSize="xs" px="2" py="1" borderRadius="md">
                    Offline
                  </Badge>
                )}
                <Button
                  bg="black"
                  color="white"
                  size="sm"
                  _hover={{ bg: "gray.800" }}
                  onClick={handleComposeNew}
                  fontWeight="normal"
                >
                  <HStack gap="2">
                    <Icon as={FiPlus} />
                    <Text>New Message</Text>
                  </HStack>
                </Button>
                <Button
                  variant="outline"
                  bg="white"
                  size="sm"
                  onClick={() => {
                    loadThreads();
                    loadUnreadCount();
                    if (selectedThread) {
                      loadThreadMessages(selectedThread.id);
                    }
                  }}
                  fontWeight="normal"
                >
                  <HStack gap="2">
                    <Icon as={FiRefreshCw} />
                    <Text>Refresh</Text>
                  </HStack>
                </Button>
              </HStack>
            </Flex>

            {/* Success Alert */}
            {sendSuccess && (
              <Box p="3" bg="green.50" borderRadius="md" border="1px" borderColor="green.200" flexShrink={0}>
                <HStack gap="2">
                  <Icon as={FiCheckCircle} color="green.500" boxSize="4" flexShrink="0" />
                  <Text fontSize="sm" fontWeight="medium" color="green.800">Message sent successfully!</Text>
                </HStack>
              </Box>
            )}

            {/* Error Alert */}
            {error && (
              <Box p="3" bg="red.50" borderRadius="md" border="1px" borderColor="red.200" flexShrink={0}>
                <HStack gap="2" justify="space-between" align="start">
                  <HStack gap="2" flex="1">
                    <Icon as={FiAlertCircle} color="red.500" boxSize="4" flexShrink="0" />
                    <VStack align="start" gap="1" flex="1">
                      <Text fontSize="sm" fontWeight="medium" color="red.800">Error loading messages</Text>
                      <Text fontSize="xs" color="red.700">{error}</Text>
                    </VStack>
                  </HStack>
                  <Button
                    size="xs"
                    colorScheme="red"
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      loadThreads();
                      loadUnreadCount();
                    }}
                  >
                    Retry
                  </Button>
                </HStack>
              </Box>
            )}

            {/* Main Content Area - Two Column Layout */}
            <Flex gap="4" flex="1" minH="0" align="stretch" overflow="hidden">
              {/* Threads List - Left Panel */}
              <Box width="380px" bg="white" borderRadius="lg" boxShadow="sm" border="1px" borderColor="gray.200" display="flex" flexDirection="column" overflow="hidden" flexShrink={0}>
                {/* Search and Filter */}
                <Box p="3" borderBottom="1px" borderColor="gray.200" bg="gray.50" flexShrink={0}>
                  <VStack gap="2" align="stretch">
                    <HStack gap="2" align="center">
                      <Icon as={FiSearch} color="gray.400" boxSize="4" flexShrink={0} />
                      <Input
                        placeholder="Search messages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg="white"
                        borderRadius="md"
                        size="sm"
                        pl="2"
                      />
                    </HStack>
                    <HStack gap="2">
                      <Icon as={FiFilter} color="gray.400" boxSize="4" />
                       <select
                         value={filterType}
                         onChange={(e) => setFilterType(e.target.value)}
                         style={{
                           padding: "6px 12px",
                           borderRadius: "6px",
                           border: "1px solid #E2E8F0",
                           backgroundColor: "white",
                           fontSize: "13px",
                           width: "100%",
                           cursor: "pointer",
                           color: "#000000"
                         }}
                       >
                        <option value="ALL">All Messages</option>
                        <option value="UNREAD">Unread</option>
                        <option value="ACTIVE">Active</option>
                      </select>
                    </HStack>
                    <HStack gap="2">
                      <Button
                        size="xs"
                        variant={filterArchived ? "solid" : "outline"}
                        colorScheme={filterArchived ? "orange" : "gray"}
                        onClick={() => setFilterArchived(!filterArchived)}
                        fontSize="xs"
                      >
                        <Icon as={FiArchive} boxSize="3" />
                        <Text ml="1">{filterArchived ? "Show Archived" : "Hide Archived"}</Text>
                      </Button>
                      <Button
                        size="xs"
                        variant={filterStarred ? "solid" : "outline"}
                        colorScheme={filterStarred ? "yellow" : "gray"}
                        onClick={() => setFilterStarred(!filterStarred)}
                        fontSize="xs"
                      >
                        <Icon as={FiStar} boxSize="3" fill={filterStarred ? "currentColor" : "none"} />
                        <Text ml="1">Starred</Text>
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
                
                {/* Threads List */}
                <Box flex="1" overflowY="auto" minH="0" p="2">
                  {filteredThreads.length === 0 && !loading ? (
                    <Flex justify="center" align="center" height="100%" minH="300px">
                      <VStack gap="3">
                        <Icon as={FiMessageSquare} boxSize="10" color="gray.300" />
                        <Text color="gray.500" fontSize="sm" fontWeight="medium">No messages found</Text>
                        {searchTerm || filterType !== "ALL" ? (
                          <Text color="gray.400" fontSize="xs">Try adjusting your search or filter</Text>
                        ) : (
                          <Text color="gray.400" fontSize="xs">Messages will appear here when available</Text>
                        )}
                      </VStack>
                    </Flex>
                  ) : filteredThreads.length === 0 && loading ? (
                    <Flex justify="center" align="center" height="100%" minH="300px">
                      <Spinner size="lg" color="orange.500" />
                    </Flex>
                  ) : (
                    <VStack gap="2" align="stretch">
                      {filteredThreads.map((thread) => (
                        <Box
                          key={thread.id}
                          p="3"
                          borderRadius="md"
                          cursor="pointer"
                          bg={thread.id === selectedThread?.id ? "orange.50" : "white"}
                          border="1px"
                          borderColor={thread.id === selectedThread?.id ? "orange.200" : "gray.200"}
                          _hover={{ 
                            bg: thread.id === selectedThread?.id ? "orange.50" : "gray.50",
                            borderColor: thread.id === selectedThread?.id ? "orange.300" : "gray.300"
                          }}
                          onClick={() => setSelectedThread(thread)}
                          transition="all 0.2s"
                          position="relative"
                        >
                          {thread.id === selectedThread?.id && (
                            <Box
                              position="absolute"
                              left="0"
                              top="0"
                              bottom="0"
                              width="3px"
                              bg="orange.500"
                              borderRadius="md"
                            />
                          )}
                          <VStack gap="2" align="stretch">
                            <Flex justify="space-between" align="start">
                              <HStack gap="2" flex="1" minW="0">
                                {thread.unreadCount > 0 && (
                                  <Box
                                    px="2"
                                    py="0.5"
                                    borderRadius="full"
                                    bg="orange.500"
                                    color="white"
                                    fontSize="2xs"
                                    fontWeight="bold"
                                    minW="20px"
                                    textAlign="center"
                                  >
                                    {thread.unreadCount}
                                  </Box>
                                )}
                                <Text fontSize="xs" fontWeight="semibold" color="gray.700" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                                  {thread.applicantName}
                                </Text>
                              </HStack>
                              <Text fontSize="2xs" color="gray.500" flexShrink={0} ml="2">
                                {new Date(thread.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </Text>
                            </Flex>
                            
                            {thread.lastMessage && (
                              <Text fontSize="xs" color="gray.600" lineHeight="1.4" style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden"
                              }}>
                                {thread.lastMessage.content}
                              </Text>
                            )}
                            
                            <HStack gap="2" fontSize="2xs" color="gray.500">
                              <Badge
                                colorScheme="purple"
                                variant="subtle"
                                fontSize="2xs"
                                px="1.5"
                                py="0.5"
                              >
                                {thread.applicationReference || thread.applicationId.substring(0, 8)}
                              </Badge>
                              <Text>•</Text>
                              <Text>{thread.messageCount} msgs</Text>
                            </HStack>
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
              </Box>

              {/* Message Details - Right Panel */}
              <Box flex="1" bg="white" borderRadius="lg" boxShadow="sm" border="1px" borderColor="gray.200" display="flex" flexDirection="column" overflow="hidden" minW="0">
                {selectedThread ? (
                  <>
                    {/* Thread Header */}
                    <Box p="4" borderBottom="1px" borderColor="gray.200" bg="gray.50" flexShrink={0}>
                      <VStack gap="2" align="stretch">
                        <Flex justify="space-between" align="start">
                          <VStack align="start" gap="1">
                            <Text fontSize="md" fontWeight="semibold" color="gray.900">
                              {getSubjectFromThread(selectedThread)}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {selectedThread.applicantName}
                            </Text>
                          </VStack>
                          <Link href={`/applications/${selectedThread.applicationId}`}>
                            <Button size="sm" variant="outline" fontSize="xs">
                              View Application
                            </Button>
                          </Link>
                        </Flex>
                        
                        <HStack gap="4" fontSize="xs" color="gray.600">
                          <HStack gap="1">
                            <Icon as={FiUser} boxSize="3" />
                            <Text>Assigned: {selectedThread.assignedAdminName || "Unassigned"}</Text>
                          </HStack>
                          <HStack gap="1">
                            <Icon as={FiMessageSquare} boxSize="3" />
                            <Text>{selectedThread.messageCount} messages</Text>
                          </HStack>
                        </HStack>
                      </VStack>
                    </Box>

                    {/* Messages List */}
                    <Box flex="1" overflowY="auto" p="4" bg="gray.50" minH="0" display="flex" flexDirection="column">
                      {/* Message Search */}
                      {messages.length > 0 && (
                        <Box mb="3" flexShrink={0}>
                          <HStack gap="2" align="center">
                            <Icon as={FiSearch} color="gray.400" boxSize="4" flexShrink={0} />
                            <Input
                              placeholder="Search messages in thread..."
                              value={messageSearchTerm}
                              onChange={(e) => setMessageSearchTerm(e.target.value)}
                              bg="white"
                              borderRadius="md"
                              size="sm"
                              pl="2"
                            />
                          </HStack>
                        </Box>
                      )}
                      {loadingMessages ? (
                        <Flex justify="center" align="center" h="200px">
                          <Spinner size="md" color="orange.500" />
                        </Flex>
                      ) : filteredMessages.length === 0 ? (
                        <Flex justify="center" align="center" height="100%" minH="300px">
                          <VStack gap="3">
                            <Icon as={FiMessageSquare} boxSize="10" color="gray.300" />
                            <Text color="gray.500" fontSize="sm" fontWeight="medium">
                              {messageSearchTerm ? "No messages match your search" : "No messages in this thread"}
                            </Text>
                            {messageSearchTerm && (
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => setMessageSearchTerm("")}
                              >
                                Clear Search
                              </Button>
                            )}
                          </VStack>
                        </Flex>
                      ) : (
                      <VStack gap="3" align="stretch">
                        {filteredMessages.map((message) => {
                          const isAdmin = isFromAdmin(message);
                          // Debug logging
                          if (filteredMessages.indexOf(message) < 2) {
                            console.log('[Messages] Rendering message:', {
                              sender: message.sender,
                              senderType: message.senderType,
                              isAdmin,
                              willAlignRight: isAdmin
                            });
                          }
                          return (
                            <Flex
                              key={message.id}
                              justify={isAdmin ? "flex-end" : "flex-start"}
                              align="flex-start"
                              gap="2"
                              px="2"
                            >
                              {!isAdmin && (
                                <Avatar.Root size="sm">
                                  <Avatar.Fallback bg="blue.500">
                                    {message.sender.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                  </Avatar.Fallback>
                                </Avatar.Root>
                              )}
                              <Box
                                maxW="70%"
                                p="3"
                                bg={isAdmin ? "orange.500" : "white"}
                                color={isAdmin ? "white" : "gray.800"}
                                borderRadius="lg"
                                boxShadow="sm"
                                border={isAdmin ? "none" : "1px"}
                                borderColor={isAdmin ? "transparent" : "gray.200"}
                                position="relative"
                              >
                                <VStack gap="1.5" align="stretch">
                                  <Flex justify="space-between" align="center" gap="2">
                                    <Text fontSize="xs" fontWeight="semibold" color={isAdmin ? "white" : "gray.800"}>
                                      {message.sender.split(',')[0].trim()}
                                    </Text>
                                    <Text fontSize="2xs" color={isAdmin ? "orange.100" : "gray.500"}>
                                      {new Date(message.timestamp).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </Text>
                                  </Flex>
                                  
                                  <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight="1.5" color={isAdmin ? "white" : "gray.700"}>
                                    {message.content}
                                  </Text>
                              
                                  {message.attachments && message.attachments.length > 0 && (
                                    <Box mt="2" p="2" bg={isAdmin ? "orange.600" : "blue.50"} borderRadius="md" border={isAdmin ? "none" : "1px"} borderColor={isAdmin ? "transparent" : "blue.100"}>
                                      <VStack gap="2" align="stretch">
                                        {message.attachments.map((attachment, idx) => (
                                          <HStack key={idx} gap="2" justify="space-between">
                                            <HStack gap="2" flex="1" minW="0">
                                              <Icon as={FiPaperclip} boxSize="3" color={isAdmin ? "white" : "blue.600"} flexShrink={0} />
                                              <VStack align="start" gap="0" flex="1" minW="0">
                                                <Text fontSize="2xs" color={isAdmin ? "white" : "blue.700"} fontWeight="medium" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                                                  {attachment.fileName || `Attachment ${idx + 1}`}
                                                </Text>
                                                <Text fontSize="2xs" color={isAdmin ? "orange.100" : "blue.600"}>
                                                  {(attachment.fileSizeBytes / 1024).toFixed(1)} KB
                                                </Text>
                                              </VStack>
                                            </HStack>
                                            {(attachment.storageUrl || attachment.storageKey) && (
                                              <Button
                                                size="xs"
                                                variant={isAdmin ? "solid" : "outline"}
                                                fontSize="2xs"
                                                bg={isAdmin ? "orange.700" : undefined}
                                                color={isAdmin ? "white" : undefined}
                                                _hover={{ bg: isAdmin ? "orange.800" : undefined }}
                                                onClick={async () => {
                                                  try {
                                                    let downloadUrl = attachment.storageUrl;
                                                    
                                                    // If no storageUrl, generate one from storageKey
                                                    if (!downloadUrl && attachment.storageKey) {
                                                      try {
                                                        const response = await fetch(`/api/proxy/api/v1/documents/download/${encodeURIComponent(attachment.storageKey)}`);
                                                        if (response.ok) {
                                                          const result = await response.json();
                                                          downloadUrl = result.url || result.downloadUrl || '';
                                                        }
                                                      } catch (error) {
                                                        console.error('Failed to get download URL:', error);
                                                      }
                                                    }
                                                    
                                                    // If we have documentId, try to get download URL from document service
                                                    if (!downloadUrl && attachment.documentId) {
                                                      try {
                                                        const response = await fetch(`/api/proxy/api/v1/documents/${attachment.documentId}/download`);
                                                        if (response.ok) {
                                                          const result = await response.json();
                                                          downloadUrl = result.url || result.downloadUrl || '';
                                                        }
                                                      } catch (error) {
                                                        console.error('Failed to get document download URL:', error);
                                                      }
                                                    }
                                                    
                                                    if (downloadUrl) {
                                                      window.open(downloadUrl, '_blank');
                                                    } else {
                                                      await SweetAlert.warning("Download Unavailable", "Download URL is not available for this attachment.");
                                                    }
                                                  } catch (error) {
                                                    console.error('Error downloading attachment:', error);
                                                    await SweetAlert.error("Download Failed", "Failed to download attachment. Please try again.");
                                                  }
                                                }}
                                                flexShrink={0}
                                              >
                                                <Icon as={FiDownload} boxSize="3" />
                                                <Text ml="1">Download</Text>
                                              </Button>
                                            )}
                                          </HStack>
                                        ))}
                                      </VStack>
                                    </Box>
                                  )}
                                  
                                  {/* Reply context */}
                                  {message.replyToMessageId && (
                                    <Box mt="2" p="2" bg={isAdmin ? "orange.600" : "gray.100"} borderRadius="md" borderLeft={isAdmin ? "none" : "3px"} borderColor={isAdmin ? "transparent" : "blue.400"}>
                                      <Text fontSize="2xs" color={isAdmin ? "orange.100" : "gray.600"} fontStyle="italic" style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden"
                                      }}>
                                        Replying to: {messages.find(m => m.id === message.replyToMessageId)?.content.substring(0, 100) || 'Previous message'}
                                      </Text>
                                    </Box>
                                  )}
                                  
                                  {/* Message actions */}
                                  <HStack gap="1" mt="2" justify="flex-end">
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      color={isAdmin ? "white" : "gray.600"}
                                      _hover={{ bg: isAdmin ? "orange.600" : "gray.100" }}
                                      onClick={() => setReplyingTo(message)}
                                      title="Reply"
                                    >
                                      <Icon as={FiCornerUpRight} />
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      color={isAdmin ? "white" : "gray.600"}
                                      _hover={{ bg: isAdmin ? "orange.600" : "gray.100" }}
                                      onClick={() => setForwardingMessage(message)}
                                      title="Forward"
                                    >
                                      <Icon as={FiShare2} />
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      color={isAdmin ? "white" : "gray.600"}
                                      _hover={{ bg: isAdmin ? "orange.600" : "gray.100" }}
                                      onClick={async () => {
                                        try {
                                          const result = await messagingApi.starMessage(message.id);
                                          if (result.success) {
                                            // Refresh messages to show updated star status
                                            if (selectedThread) {
                                              await loadThreadMessages(selectedThread.id);
                                            }
                                          }
                                        } catch (error) {
                                          console.error('Failed to star message:', error);
                                        }
                                      }}
                                      title={message.isStarred ? "Unstar" : "Star"}
                                    >
                                      <Icon 
                                        as={FiStar} 
                                        color={message.isStarred ? "yellow.500" : (isAdmin ? "white" : "gray.400")}
                                        fill={message.isStarred ? "yellow.500" : "none"}
                                      />
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      color={isAdmin ? "white" : "red.600"}
                                      _hover={{ bg: isAdmin ? "orange.600" : "red.50" }}
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
                                          SweetAlert.loading('Deleting...', 'Please wait while we delete the message.');
                                          const deleteResult = await messagingApi.deleteMessage(message.id);
                                          if (deleteResult.success) {
                                            // Remove message from list
                                            setMessages(prev => prev.filter(m => m.id !== message.id));
                                            // Refresh threads
                                            await loadThreads();
                                            SweetAlert.close();
                                            await SweetAlert.success('Deleted!', 'Message has been deleted successfully.');
                                          } else {
                                            SweetAlert.close();
                                            await SweetAlert.error('Delete Failed', deleteResult.errorMessage || 'Failed to delete message');
                                          }
                                        } catch (error) {
                                          console.error('Failed to delete message:', error);
                                          SweetAlert.close();
                                          await SweetAlert.error('Delete Failed', 'Failed to delete message. Please try again.');
                                        }
                                      }}
                                      title="Delete"
                                    >
                                      <Icon as={FiTrash2} />
                                    </Button>
                                  </HStack>
                                </VStack>
                              </Box>
                              {isAdmin && (
                                <Avatar.Root size="sm">
                                  <Avatar.Fallback bg="orange.500">
                                    {message.sender.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                  </Avatar.Fallback>
                                </Avatar.Root>
                              )}
                            </Flex>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </VStack>
                    )}
                  </Box>

                    {/* Reply Section */}
                    <Box p="3" borderTop="1px" borderColor="gray.200" bg="white" flexShrink={0}>
                      <VStack gap="2" align="stretch">
                        {/* Reply context */}
                        {replyingTo && (
                          <Box p="2" bg="blue.50" borderRadius="md" borderLeft="3px" borderColor="blue.400">
                            <HStack justify="space-between">
                              <VStack align="start" gap="0" flex="1" minW="0">
                                <Text fontSize="2xs" fontWeight="semibold" color="blue.800">
                                  Replying to {replyingTo.sender}
                                </Text>
                                <Text fontSize="2xs" color="blue.600" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                                  {replyingTo.content.substring(0, 100)}
                                </Text>
                              </VStack>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => setReplyingTo(null)}
                                flexShrink={0}
                              >
                                <Icon as={FiX} boxSize="3" />
                              </Button>
                            </HStack>
                          </Box>
                        )}
                        
                        <Textarea
                          placeholder={replyingTo ? `Reply to ${replyingTo.sender}...` : "Type your message..."}
                          value={newMessage.content}
                          onChange={(e) => {
                            setNewMessage(prev => ({ ...prev, content: e.target.value }));
                            // Send typing indicator
                            if (selectedThread && signalRConnected && e.target.value.length > 0) {
                              signalRService.sendTypingIndicator(selectedThread.id);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          size="sm"
                          rows={3}
                          resize="none"
                          fontSize="sm"
                          color="black"
                          _focus={{ color: "black" }}
                          _placeholder={{ color: "gray.400" }}
                        />
                      
                        {/* Selected attachments */}
                        {selectedAttachments.length > 0 && (
                          <VStack gap="1.5" align="stretch">
                            {selectedAttachments.map((file, idx) => {
                              const progress = attachmentUploadProgress[file.name];
                              const hasError = progress === -1;
                              const isUploading = progress !== undefined && progress > 0 && progress < 100;
                              
                              return (
                                <HStack key={idx} p="2" bg={hasError ? "red.50" : "gray.50"} borderRadius="md" justify="space-between" border={hasError ? "1px" : "none"} borderColor={hasError ? "red.200" : "transparent"}>
                                  <HStack gap="2" flex="1" minW="0">
                                    <Icon as={FiPaperclip} boxSize="3" flexShrink="0" color={hasError ? "red.500" : "gray.600"} />
                                    <VStack align="start" gap="0" flex="1" minW="0">
                                      <Text fontSize="xs" fontWeight="medium" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" color={hasError ? "red.700" : "gray.800"}>
                                        {file.name}
                                      </Text>
                                      <HStack gap="2" align="center">
                                        <Text fontSize="2xs" color={hasError ? "red.600" : "gray.500"}>
                                          {(file.size / 1024).toFixed(1)} KB
                                        </Text>
                                        {isUploading && (
                                          <Text fontSize="2xs" color="blue.600">
                                            {progress}%
                                          </Text>
                                        )}
                                        {hasError && (
                                          <Text fontSize="2xs" color="red.600" fontWeight="medium">
                                            Upload failed
                                          </Text>
                                        )}
                                      </HStack>
                                    </VStack>
                                  </HStack>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedAttachments(prev => prev.filter((_, i) => i !== idx));
                                      setAttachmentUploadProgress(prev => {
                                        const updated = { ...prev };
                                        delete updated[file.name];
                                        return updated;
                                      });
                                    }}
                                    flexShrink={0}
                                    colorScheme={hasError ? "red" : "gray"}
                                  >
                                    <Icon as={FiX} boxSize="3" />
                                  </Button>
                                </HStack>
                              );
                            })}
                          </VStack>
                        )}
                        
                        {/* Typing indicator */}
                        {selectedThread && isTyping[selectedThread.id] && (
                          <Text fontSize="2xs" color="gray.500" fontStyle="italic">
                            {isTyping[selectedThread.id].userName} is typing...
                          </Text>
                        )}
                        
                        <HStack justify="space-between" gap="2">
                          <HStack gap="2" flex="1">
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setSelectedAttachments(prev => [...prev, ...files]);
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              fontSize="xs"
                            >
                              <HStack gap="1.5">
                                <Icon as={FiPaperclip} boxSize="3" />
                                <Text>Attach</Text>
                              </HStack>
                            </Button>
                            {selectedThread && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const result = await messagingApi.archiveThread(selectedThread.id, !selectedThread.isArchived);
                                    if (result.success) {
                                      await loadThreads();
                                      if (result.isArchived) {
                                        setSelectedThread(null);
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Failed to archive thread:', error);
                                    await SweetAlert.error('Archive Failed', 'Failed to archive thread. Please try again.');
                                  }
                                }}
                                fontSize="xs"
                              >
                                <Icon as={FiArchive} boxSize="3" />
                                <Text ml="1.5">{selectedThread.isArchived ? "Unarchive" : "Archive"}</Text>
                              </Button>
                            )}
                          </HStack>
                          
                          <Button
                            colorScheme="orange"
                            size="sm"
                            onClick={handleSendMessage}
                            disabled={sending || uploadingAttachments}
                            fontSize="xs"
                          >
                            <HStack gap="1.5">
                              {(sending || uploadingAttachments) ? <Spinner size="xs" /> : <Icon as={FiSend} boxSize="3" />}
                              <Text>
                                {uploadingAttachments ? "Uploading..." : sending ? "Sending..." : "Send"}
                              </Text>
                            </HStack>
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                </>
                  ) : showCompose ? (
                    <Flex justify="center" align="center" height="100%">
                      <VStack gap="4" p="8">
                        <Text fontSize="md" fontWeight="semibold" color="gray.800">
                          Compose New Message
                        </Text>
                        <Text fontSize="sm" color="gray.600" textAlign="center">
                          To send a message, please select a thread or navigate to an application to start a conversation.
                        </Text>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCompose(false)}
                        >
                          Cancel
                        </Button>
                      </VStack>
                    </Flex>
                  ) : (
                    <Flex justify="center" align="center" height="100%">
                      <VStack gap="3">
                        <Icon as={FiMessageSquare} boxSize="10" color="gray.300" />
                        <Text fontSize="sm" color="gray.500" fontWeight="medium">
                          Select a message to view details
                        </Text>
                      </VStack>
                    </Flex>
                  )}
                </Box>
              </Flex>
            </VStack>
          </Container>
        </Box>

      {/* Forward Message Modal */}
      {forwardingMessage && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex="1000"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setForwardingMessage(null)}
        >
          <Box
            bg="white"
            borderRadius="xl"
            p="6"
            maxW="600px"
            width="90%"
            onClick={(e) => e.stopPropagation()}
            boxShadow="xl"
          >
            <VStack gap="4" align="stretch">
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                  Forward Message
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setForwardingMessage(null)}
                >
                  <Icon as={FiX} />
                </Button>
              </HStack>

              <Box p="3" bg="gray.50" borderRadius="md" borderLeft="3px" borderColor="blue.400">
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                  Original Message:
                </Text>
                <Text fontSize="sm" color="gray.600" mb="1">
                  From: {forwardingMessage.sender}
                </Text>
                <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap">
                  {forwardingMessage.content}
                </Text>
              </Box>

              <VStack gap="3" align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                    To Application ID:
                  </Text>
                  <Input
                    placeholder="Enter application ID (GUID)"
                    value={newMessage.receiverId || ""}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, receiverId: e.target.value }))}
                  />
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                    Additional Message (Optional):
                  </Text>
                  <Textarea
                    placeholder="Add any additional context..."
                    value={newMessage.content}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    color="black"
                    _focus={{ color: "black" }}
                    _placeholder={{ color: "gray.400" }}
                  />
                </Box>
              </VStack>

              <HStack justify="flex-end" gap="3" pt="2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setForwardingMessage(null);
                    setNewMessage({ applicationId: "", content: "", receiverId: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="orange"
                  onClick={async () => {
                    if (!newMessage.receiverId?.trim()) {
                      await SweetAlert.warning("Application ID Required", "Please enter an application ID to forward to");
                      return;
                    }

                    try {
                      setSending(true);
                      const result = await messagingApi.forwardMessage(
                        forwardingMessage.id,
                        newMessage.receiverId.trim(),
                        undefined,
                        newMessage.content.trim() || undefined
                      );

                      if (result.success) {
                        await SweetAlert.success("Message Forwarded", "The message has been forwarded successfully.");
                        setForwardingMessage(null);
                        setNewMessage({ applicationId: "", content: "", receiverId: "" });
                        await loadThreads();
                      } else {
                        throw new Error(result.errorMessage || "Failed to forward message");
                      }
                    } catch (error) {
                      console.error("Failed to forward message:", error);
                      await SweetAlert.error("Forward Failed", error instanceof Error ? error.message : "Failed to forward message");
                    } finally {
                      setSending(false);
                    }
                  }}
                  disabled={sending}
                >
                  {sending ? <Spinner size="sm" /> : <Icon as={FiShare2} />}
                  <Text ml="2">{sending ? "Forwarding..." : "Forward"}</Text>
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}
    </Box>
  );
}
