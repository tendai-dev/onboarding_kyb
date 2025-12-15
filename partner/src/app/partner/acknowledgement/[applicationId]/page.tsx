'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { Button, Typography, Card } from '@/lib/mukuruImports';
import { PartnerHeader } from '@/components/PartnerHeader';
import { useAuth } from '@/contexts/AuthContext';
import {
  TickCircleIcon,
  DownloadIcon,
  ErrorIcon,
  SecureIcon,
  ArrowLeftIcon,
} from '@mukuru/mukuru-react-components';
import { FiClock, FiBarChart2, FiEye, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface AcknowledgementStatus {
  status: 'pending' | 'document_ready' | 'sent' | 'signed' | 'declined' | 'self_acknowledged';
  documentId?: string;
  signedAt?: string;
  signedBy?: string;
  error?: string;
  selfSigned?: boolean;
}

interface ApplicationData {
  id: string;
  name: string;
  applicantName: string;
  applicantEmail: string;
  companyName: string;
  status: string;
  createdAt: string;
}

export default function AcknowledgementPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.applicationId as string;
  const { user: authUser } = useAuth();

  const [acknowledgementStatus, setAcknowledgementStatus] = useState<AcknowledgementStatus>({ status: 'pending' });
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState({
    accuracy: false,
    terms: false,
    obligations: false,
  });
  const [documentDetails, setDocumentDetails] = useState<any>(null);
  const [documentHistory, setDocumentHistory] = useState<any[]>([]);
  const [documentAnalytics, setDocumentAnalytics] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [signingLink, setSigningLink] = useState<string | null>(null);

  // Current user for navbar
  const currentUser = {
    name: authUser?.name || applicationData?.applicantName || 'User',
    email: authUser?.email || applicationData?.applicantEmail || '',
    companyName: applicationData?.companyName || '',
  };

  // Fetch application data
  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        setIsLoadingApp(true);
        const response = await fetch(`/api/proxy/api/v1/applications/${applicationId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setApplicationData({
            id: applicationId,
            name: data.businessLegalName || data.name || 'Application',
            applicantName: data.applicantFirstName 
              ? `${data.applicantFirstName} ${data.applicantLastName || ''}`.trim()
              : 'Applicant',
            applicantEmail: data.applicantEmail || '',
            companyName: data.businessLegalName || data.name || '',
            status: data.status || 'Unknown',
            createdAt: data.createdAt || new Date().toISOString(),
          });
        } else {
          // If API fails, use fallback data from auth context
          console.warn('Application API returned', response.status, '- using fallback data');
          const fallbackName = authUser?.name || 'Applicant';
          const fallbackEmail = authUser?.email || '';
          setApplicationData({
            id: applicationId,
            name: applicationId,
            applicantName: fallbackName,
            applicantEmail: fallbackEmail,
            companyName: '',
            status: 'Unknown',
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error fetching application:', err);
        // Use fallback data on error
        const fallbackName = authUser?.name || 'Applicant';
        const fallbackEmail = authUser?.email || '';
        setApplicationData({
          id: applicationId,
          name: applicationId,
          applicantName: fallbackName,
          applicantEmail: fallbackEmail,
          companyName: '',
          status: 'Unknown',
          createdAt: new Date().toISOString(),
        });
      } finally {
        setIsLoadingApp(false);
      }
    };

    if (applicationId) {
      fetchApplicationData();
      checkAcknowledgementStatus();
    }
  }, [applicationId, authUser]);

  const checkAcknowledgementStatus = async () => {
    try {
      const response = await fetch(`/api/acknowledgement/${applicationId}/status`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const previousStatus = acknowledgementStatus.status;
        setAcknowledgementStatus(data);
        
        // Send confirmation email when acknowledgement status changes to signed
        if (
          (data.status === 'signed' || data.status === 'self_acknowledged') &&
          previousStatus !== 'signed' &&
          previousStatus !== 'self_acknowledged'
        ) {
          try {
            const { sendCustomNotification } = await import('@/lib/notificationService');
            const { generateStatusUpdateEmail, generatePlainTextEmail } = await import('@/lib/emailTemplates');
            
            const htmlContent = generateStatusUpdateEmail({
              applicantName: applicationData?.applicantName || currentUser.name,
              caseId: applicationId,
              caseNumber: applicationData?.id || applicationId,
              status: 'Acknowledgement Signed',
              message: 'Your acknowledgement has been successfully signed and your application is now complete.',
              link: `${window.location.origin}/partner/dashboard`,
            });
            
            const textContent = generatePlainTextEmail({
              applicantName: applicationData?.applicantName || currentUser.name,
              caseId: applicationId,
              caseNumber: applicationData?.id || applicationId,
              status: 'Acknowledgement Signed',
              message: 'Your acknowledgement has been successfully signed and your application is now complete.',
              link: `${window.location.origin}/partner/dashboard`,
            }, 'status');
            
            await sendCustomNotification(
              applicationData?.applicantEmail || currentUser.email || '',
              `Acknowledgement Signed - Case ${applicationData?.id || applicationId}`,
              htmlContent,
              textContent
            );
            
            console.info('Acknowledgement confirmation email sent');
          } catch (error) {
            // Log error but don't block user flow
            console.warn('Failed to send acknowledgement confirmation email:', error);
          }
        }
        
        // If document exists, fetch premium details
        if (data.documentId) {
          fetchDocumentDetails(data.documentId);
        }
      } else if (response.status === 404) {
        setAcknowledgementStatus({ status: 'pending' });
      } else {
        // For other errors, log but don't show error to user
        console.warn('Status check returned:', response.status);
      }
    } catch (err) {
      console.error('Error checking status:', err);
      // Don't set error state here - status check failures shouldn't block the UI
    }
  };

  const fetchDocumentDetails = async (documentId: string) => {
    try {
      const response = await fetch(`/api/signnow/document/${documentId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDocumentDetails(data);
      } else {
        // If document details can't be fetched, that's okay - we'll just show basic status
        console.warn('Could not fetch document details:', response.status);
      }
    } catch (err) {
      console.error('Error fetching document details:', err);
      // Don't show error to user - document details are optional
    }
  };

  const fetchDocumentHistory = async (documentId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/signnow/document/${documentId}/history`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDocumentHistory(Array.isArray(data) ? data : []);
        setShowHistory(true);
      }
    } catch (err) {
      console.error('Error fetching document history:', err);
      setError('Failed to load document history');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocumentAnalytics = async (documentId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/signnow/document/${documentId}/analytics`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDocumentAnalytics(data);
        setShowAnalytics(true);
      }
    } catch (err) {
      console.error('Error fetching document analytics:', err);
      setError('Failed to load document analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAndSendAcknowledgement = async () => {
    // Calculate allTermsAgreed here to ensure we have the latest value
    const allTermsChecked = agreedToTerms.accuracy && agreedToTerms.terms && agreedToTerms.obligations;
    
    console.log('generateAndSendAcknowledgement called', {
      allTermsChecked,
      applicationData: !!applicationData,
      agreedToTerms,
    });

    // Check if all terms are agreed
    if (!allTermsChecked) {
      console.warn('Not all terms agreed:', agreedToTerms);
      setError('Please confirm all terms before signing');
      return;
    }

    // Use application data or fallback to auth user data
    const applicantName = applicationData?.applicantName || authUser?.name || 'Applicant';
    const applicantEmail = applicationData?.applicantEmail || authUser?.email || '';
    const companyName = applicationData?.companyName || '';

    if (!applicantEmail) {
      setError('Unable to determine applicant email. Please ensure you are logged in.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Generating acknowledgement:', {
        applicationId,
        applicantName,
        applicantEmail,
        companyName,
      });

      const response = await fetch(`/api/acknowledgement/${applicationId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          applicantName,
          applicantEmail,
          companyName,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to generate acknowledgement';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        console.error('Acknowledgement generation error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Acknowledgement generated:', data);

      // Clear any previous errors on successful generation
      setError(null);

      if (data.selfSigned) {
        setAcknowledgementStatus({
          status: 'self_acknowledged',
          documentId: data.documentId,
          signedAt: data.signedAt || new Date().toISOString(),
          signedBy: data.signedBy || applicantName,
        });
        
        // Send confirmation email when acknowledgement is signed
        try {
          const { sendCustomNotification } = await import('@/lib/notificationService');
          const { generateStatusUpdateEmail, generatePlainTextEmail } = await import('@/lib/emailTemplates');
          
          const htmlContent = generateStatusUpdateEmail({
            applicantName: applicationData?.applicantName || applicantName,
            caseId: applicationId,
            caseNumber: applicationData?.id || applicationId,
            status: 'Acknowledgement Signed',
            message: 'Your acknowledgement has been successfully signed and your application is now complete.',
            link: `${window.location.origin}/partner/dashboard`,
          });
          
          const textContent = generatePlainTextEmail({
            applicantName: applicationData?.applicantName || applicantName,
            caseId: applicationId,
            caseNumber: applicationData?.id || applicationId,
            status: 'Acknowledgement Signed',
            message: 'Your acknowledgement has been successfully signed and your application is now complete.',
            link: `${window.location.origin}/partner/dashboard`,
          }, 'status');
          
          await sendCustomNotification(
            applicationData?.applicantEmail || currentUser.email || '',
            `Acknowledgement Signed - Case ${applicationData?.id || applicationId}`,
            htmlContent,
            textContent
          );
          
          console.info('Acknowledgement confirmation email sent');
        } catch (error) {
          // Log error but don't block user flow
          console.warn('Failed to send acknowledgement confirmation email:', error);
        }
        
        // Fetch document details after creation
        if (data.documentId) {
          fetchDocumentDetails(data.documentId);
        }
      } else if (data.embeddedSigning && data.signingLink) {
        // Show embedded signing iframe
        setSigningLink(data.signingLink);
        setAcknowledgementStatus({
          status: 'document_ready',
          documentId: data.documentId,
        });
        // Fetch document details after creation
        if (data.documentId) {
          fetchDocumentDetails(data.documentId);
        }
      } else {
        setAcknowledgementStatus({
          status: 'sent',
          documentId: data.documentId,
        });
        // Fetch document details after creation
        if (data.documentId) {
          fetchDocumentDetails(data.documentId);
        }
      }
    } catch (err) {
      console.error('Error in generateAndSendAcknowledgement:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate acknowledgement';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDocument = async () => {
    if (!acknowledgementStatus.documentId) {
      setError('Document not available for download yet. Please wait a moment and try again.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      const response = await fetch(`/api/acknowledgement/${applicationId}/download`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to download document';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acknowledgement-${applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Clear error on success
      setError(null);
    } catch (err) {
      console.error('Download error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download document';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const allTermsAgreed = agreedToTerms.accuracy && agreedToTerms.terms && agreedToTerms.obligations;
  const isCompleted = acknowledgementStatus.status === 'signed' || acknowledgementStatus.status === 'self_acknowledged';

  if (isLoadingApp) {
    return (
      <Box minH="100vh" bg="mukuru.background.light">
        <PartnerHeader />
        <Flex justify="center" align="center" minH="calc(100vh - 80px)">
          <VStack gap="4">
            <Spinner size="xl" color="mukuru.teal" />
            <Typography color="mukuru.grey.medium">Loading...</Typography>
          </VStack>
        </Flex>
      </Box>
    );
  }

  const termsCount = Object.values(agreedToTerms).filter(Boolean).length;

  return (
    <Box minH="100vh" bg="linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)">
      <PartnerHeader />
      
      <Flex justify="center" align="flex-start" minH="calc(100vh - 80px)" py={{ base: '6', md: '12' }} px="4">
        <Box w="100%" maxW="520px">
          {/* Back Link */}
          <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <HStack 
              as="button"
              onClick={() => router.push('/partner/dashboard')}
              gap="2" 
              mb="6" 
              color="mukuru.grey.medium"
              _hover={{ color: 'mukuru.teal' }}
              transition="color 0.2s"
              cursor="pointer"
            >
              <ArrowLeftIcon width={16} height={16} />
              <Typography fontSize="sm">Back to Dashboard</Typography>
            </HStack>
          </MotionBox>

          {/* Main Card */}
          <MotionBox 
            initial={{ opacity: 0, y: 20, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Box
              bg="white"
              borderRadius="24px"
              boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)"
              overflow="hidden"
            >
              {/* Header Section */}
              <Box 
                bg={isCompleted ? 'linear-gradient(135deg, #008080 0%, #006666 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'}
                px="8" 
                py="10" 
                textAlign="center"
              >
                <MotionBox
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <Box
                    w="80px"
                    h="80px"
                    mx="auto"
                    mb="5"
                    borderRadius="full"
                    bg={isCompleted ? 'rgba(255,255,255,0.2)' : 'white'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow={isCompleted ? 'none' : '0 4px 12px rgba(0, 128, 128, 0.15)'}
                  >
                    {isCompleted ? (
                      <TickCircleIcon width={40} height={40} color="white" />
                    ) : (
                      <SecureIcon width={40} height={40} color="#008080" />
                    )}
                  </Box>
                </MotionBox>
                
                <Typography 
                  fontSize="2xl" 
                  fontWeight="bold" 
                  color={isCompleted ? 'white' : 'mukuru.charcoal'}
                  mb="2"
                >
                  {isCompleted ? 'All Done!' : 'Final Acknowledgement'}
                </Typography>
                <Typography 
                  fontSize="sm" 
                  color={isCompleted ? 'rgba(255,255,255,0.85)' : 'mukuru.grey.medium'}
                >
                  {isCompleted 
                    ? 'Your acknowledgement has been successfully recorded'
                    : applicationData?.companyName || 'Complete your application'
                  }
                </Typography>
              </Box>

              {/* Content Section */}
              <Box px="8" py="8">
                {/* Success State */}
                {isCompleted ? (
                  <VStack gap="4">
                    <Box
                      w="100%"
                      p="5"
                      borderRadius="16px"
                      bg="rgba(0, 128, 128, 0.06)"
                      border="1px dashed"
                      borderColor="mukuru.teal"
                    >
                      <VStack gap="2">
                        <Typography fontSize="sm" color="mukuru.grey.medium">
                          Signed by
                        </Typography>
                        <Typography fontWeight="semibold" color="mukuru.charcoal">
                          {applicationData?.applicantName}
                        </Typography>
                        <Typography fontSize="xs" color="mukuru.grey.medium">
                          {new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </Typography>
                      </VStack>
                    </Box>
                    
                    <HStack gap="3" width="100%">
                      <Button
                        variant="primary"
                        flex="1"
                        size="md"
                        onClick={downloadDocument}
                        disabled={isLoading}
                        leftIcon={<DownloadIcon width={18} height={18} />}
                      >
                        Download
                      </Button>
                      {acknowledgementStatus.documentId && (
                        <>
                          <Button
                            variant="secondary"
                            size="md"
                            onClick={() => fetchDocumentHistory(acknowledgementStatus.documentId!)}
                            disabled={isLoading}
                            leftIcon={<FiClock size={16} />}
                          >
                            History
                          </Button>
                          <Button
                            variant="secondary"
                            size="md"
                            onClick={() => fetchDocumentAnalytics(acknowledgementStatus.documentId!)}
                            disabled={isLoading}
                            leftIcon={<FiBarChart2 size={16} />}
                          >
                            Analytics
                          </Button>
                        </>
                      )}
                    </HStack>
                    
                    <Button
                      variant="ghost"
                      width="100%"
                      onClick={() => router.push('/partner/dashboard')}
                    >
                      Return to Dashboard
                    </Button>
                  </VStack>
                ) : (
                  <VStack align="stretch" gap="5">
                    {/* Progress Header */}
                    <HStack justify="space-between" align="center">
                      <Typography fontSize="sm" fontWeight="medium" color="mukuru.charcoal">
                        Confirm the following
                      </Typography>
                      <HStack gap="1">
                        <Typography fontSize="sm" fontWeight="bold" color="mukuru.teal">
                          {termsCount}
                        </Typography>
                        <Typography fontSize="sm" color="mukuru.grey.medium">
                          / 3
                        </Typography>
                      </HStack>
                    </HStack>

                    {/* Progress Bar */}
                    <Box h="4px" bg="mukuru.grey.light" borderRadius="full" overflow="hidden">
                      <MotionBox
                        h="100%"
                        bg="linear-gradient(90deg, #008080 0%, #00a0a0 100%)"
                        borderRadius="full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(termsCount / 3) * 100}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </Box>

                    {/* Terms */}
                    <VStack align="stretch" gap="3">
                      {[
                        { key: 'accuracy', title: 'Accuracy of Information', desc: 'All information provided is accurate and complete to the best of my knowledge.' },
                        { key: 'terms', title: 'Legal & Product Terms', desc: 'I agree to the applicable legal terms and product conditions.' },
                        { key: 'obligations', title: 'Obligations & Responsibilities', desc: 'I understand and accept my obligations as outlined.' },
                      ].map((term, index) => (
                        <MotionBox
                          key={term.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + index * 0.1 }}
                        >
                          <Box
                            as="label"
                            display="flex"
                            alignItems="flex-start"
                            gap="4"
                            p="4"
                            borderRadius="16px"
                            border="2px solid"
                            borderColor={agreedToTerms[term.key as keyof typeof agreedToTerms] ? 'mukuru.teal' : 'transparent'}
                            bg={agreedToTerms[term.key as keyof typeof agreedToTerms] ? 'rgba(0, 128, 128, 0.04)' : 'mukuru.background.light'}
                            cursor="pointer"
                            transition="all 0.2s ease"
                            _hover={{ 
                              bg: agreedToTerms[term.key as keyof typeof agreedToTerms] ? 'rgba(0, 128, 128, 0.06)' : 'rgba(0, 128, 128, 0.02)',
                              transform: 'translateY(-1px)'
                            }}
                          >
                            {/* Custom Checkbox */}
                            <Box
                              w="24px"
                              h="24px"
                              borderRadius="8px"
                              border="2px solid"
                              borderColor={agreedToTerms[term.key as keyof typeof agreedToTerms] ? 'mukuru.teal' : 'mukuru.grey.light'}
                              bg={agreedToTerms[term.key as keyof typeof agreedToTerms] ? 'mukuru.teal' : 'white'}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              flexShrink={0}
                              mt="1"
                              transition="all 0.2s"
                            >
                              {agreedToTerms[term.key as keyof typeof agreedToTerms] && (
                                <MotionBox
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                >
                                  <TickCircleIcon width={14} height={14} color="white" />
                                </MotionBox>
                              )}
                            </Box>
                            <input
                              type="checkbox"
                              checked={agreedToTerms[term.key as keyof typeof agreedToTerms]}
                              onChange={(e) => setAgreedToTerms(prev => ({ ...prev, [term.key]: e.target.checked }))}
                              style={{ display: 'none' }}
                            />
                            <VStack align="start" gap="1" flex="1">
                              <Typography fontWeight="semibold" color="mukuru.charcoal" fontSize="sm">
                                {term.title}
                              </Typography>
                              <Typography fontSize="xs" color="mukuru.grey.medium" lineHeight="1.5">
                                {term.desc}
                              </Typography>
                            </VStack>
                          </Box>
                        </MotionBox>
                      ))}
                    </VStack>

                    {/* Error */}
                    {error && (
                      <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Box p="4" borderRadius="12px" bg="rgba(220, 53, 69, 0.08)" border="1px solid rgba(220, 53, 69, 0.2)">
                          <HStack gap="3">
                            <ErrorIcon width={18} height={18} color="#dc3545" />
                            <Typography fontSize="sm" color="#dc3545">{error}</Typography>
                          </HStack>
                        </Box>
                      </MotionBox>
                    )}

                    {/* SignNow Embedded Signing */}
                    {signingLink && (
                      <MotionBox 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <VStack gap="4" align="stretch">
                          <Typography fontSize="sm" fontWeight="medium" color="mukuru.charcoal" textAlign="center">
                            Please sign the document below
                          </Typography>
                          <Box
                            borderRadius="12px"
                            overflow="hidden"
                            border="1px solid"
                            borderColor="mukuru.grey.light"
                            bg="white"
                          >
                            <iframe
                              src={signingLink}
                              width="100%"
                              height="500px"
                              style={{ border: 'none' }}
                              title="Sign Document"
                              allow="camera; microphone"
                            />
                          </Box>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              // Check if document was signed
                              setSigningLink(null);
                              setAcknowledgementStatus({
                                status: 'self_acknowledged',
                                documentId: acknowledgementStatus.documentId,
                                signedAt: new Date().toISOString(),
                                signedBy: applicationData?.applicantName || 'Applicant',
                              });
                            }}
                          >
                            I have completed signing
                          </Button>
                        </VStack>
                      </MotionBox>
                    )}

                    {/* Submit Button */}
                    <MotionBox
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button
                        variant="primary"
                        width="100%"
                        size="md"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const allTermsChecked = agreedToTerms.accuracy && agreedToTerms.terms && agreedToTerms.obligations;
                          console.log('Button clicked', { 
                            allTermsChecked, 
                            isLoading, 
                            applicationData: !!applicationData,
                            agreedToTerms,
                            allTermsAgreed
                          });
                          if (allTermsChecked && !isLoading) {
                            generateAndSendAcknowledgement();
                          } else {
                            console.warn('Button click ignored:', {
                              allTermsChecked,
                              isLoading
                            });
                            if (!allTermsChecked) {
                              setError('Please confirm all 3 terms before signing');
                            }
                          }
                        }}
                        disabled={!allTermsAgreed || isLoading}
                        leftIcon={isLoading ? <Spinner size="sm" /> : <SecureIcon width={18} height={18} />}
                      >
                        {isLoading ? 'Processing...' : 'Sign & Complete'}
                      </Button>
                      {!allTermsAgreed && (
                        <Typography fontSize="xs" color="mukuru.grey.medium" textAlign="center" mt="2">
                          Please confirm all 3 terms above ({termsCount}/3)
                        </Typography>
                      )}
                    </MotionBox>

                    {/* Security Note */}
                    <HStack justify="center" gap="2" pt="2">
                      <Box color="mukuru.grey.medium">
                        <SecureIcon width={14} height={14} />
                      </Box>
                      <Typography fontSize="xs" color="mukuru.grey.medium">
                        Your signature is legally binding and secure
                      </Typography>
                    </HStack>

                    {/* Premium Features - Document Status */}
                    {acknowledgementStatus.documentId && (
                      <MotionBox
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        mt="4"
                      >
                        <Box
                          p="4"
                          borderRadius="12px"
                          bg="mukuru.background.light"
                          border="1px solid"
                          borderColor="mukuru.grey.light"
                        >
                          <HStack justify="space-between" mb="3">
                            <Typography fontSize="sm" fontWeight="semibold" color="mukuru.charcoal">
                              Document Status
                            </Typography>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => checkAcknowledgementStatus()}
                              leftIcon={<FiRefreshCw size={12} />}
                            >
                              Refresh
                            </Button>
                          </HStack>
                          {documentDetails && (
                            <VStack align="stretch" gap="2">
                              <HStack justify="space-between">
                                <Typography fontSize="xs" color="mukuru.grey.medium">
                                  Status:
                                </Typography>
                                <Typography fontSize="xs" fontWeight="semibold" color="mukuru.teal">
                                  {documentDetails.status || 'pending'}
                                </Typography>
                              </HStack>
                              {documentDetails.page_count && (
                                <HStack justify="space-between">
                                  <Typography fontSize="xs" color="mukuru.grey.medium">
                                    Pages:
                                  </Typography>
                                  <Typography fontSize="xs" color="mukuru.charcoal">
                                    {documentDetails.page_count}
                                  </Typography>
                                </HStack>
                              )}
                              <HStack gap="2" mt="2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => fetchDocumentHistory(acknowledgementStatus.documentId!)}
                                  leftIcon={<FiClock size={12} />}
                                >
                                  View History
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => fetchDocumentAnalytics(acknowledgementStatus.documentId!)}
                                  leftIcon={<FiBarChart2 size={12} />}
                                >
                                  View Analytics
                                </Button>
                              </HStack>
                            </VStack>
                          )}
                        </Box>
                      </MotionBox>
                    )}
                  </VStack>
                )}
              </Box>
            </Box>
          </MotionBox>

          {/* Document History Modal */}
          {showHistory && acknowledgementStatus.documentId && (
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              position="fixed"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="rgba(0,0,0,0.5)"
              zIndex={1000}
              display="flex"
              alignItems="center"
              justifyContent="center"
              p="4"
              onClick={() => setShowHistory(false)}
            >
              <Box
                bg="white"
                borderRadius="16px"
                p="6"
                maxW="600px"
                w="100%"
                maxH="80vh"
                overflow="auto"
                onClick={(e) => e.stopPropagation()}
              >
                <HStack justify="space-between" mb="4">
                  <Typography fontSize="lg" fontWeight="bold">
                    Document History
                  </Typography>
                  <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                    ×
                  </Button>
                </HStack>
                {documentHistory.length === 0 ? (
                  <Typography color="mukuru.grey.medium">No history available</Typography>
                ) : (
                  <VStack align="stretch" gap="3">
                    {documentHistory.map((item, index) => (
                      <Box key={index} p="3" bg="mukuru.background.light" borderRadius="8px">
                        <HStack justify="space-between" mb="2">
                          <Typography fontSize="sm" fontWeight="semibold">
                            {item.action}
                          </Typography>
                          <Typography fontSize="xs" color="mukuru.grey.medium">
                            {new Date(item.timestamp * 1000).toLocaleString()}
                          </Typography>
                        </HStack>
                        {item.user_email && (
                          <Typography fontSize="xs" color="mukuru.grey.medium">
                            By: {item.user_email}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </MotionBox>
          )}

          {/* Document Analytics Modal */}
          {showAnalytics && acknowledgementStatus.documentId && documentAnalytics && (
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              position="fixed"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="rgba(0,0,0,0.5)"
              zIndex={1000}
              display="flex"
              alignItems="center"
              justifyContent="center"
              p="4"
              onClick={() => setShowAnalytics(false)}
            >
              <Box
                bg="white"
                borderRadius="16px"
                p="6"
                maxW="600px"
                w="100%"
                maxH="80vh"
                overflow="auto"
                onClick={(e) => e.stopPropagation()}
              >
                <HStack justify="space-between" mb="4">
                  <Typography fontSize="lg" fontWeight="bold">
                    Document Analytics
                  </Typography>
                  <Button variant="ghost" size="sm" onClick={() => setShowAnalytics(false)}>
                    ×
                  </Button>
                </HStack>
                <VStack align="stretch" gap="4">
                  <Box>
                    <Typography fontSize="sm" fontWeight="semibold" mb="3">
                      Overview
                    </Typography>
                    <HStack gap="4">
                      <Box>
                        <Typography fontSize="xs" color="mukuru.grey.medium">
                          Views
                        </Typography>
                        <Typography fontSize="lg" fontWeight="bold" color="mukuru.teal">
                          {documentAnalytics.views || 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography fontSize="xs" color="mukuru.grey.medium">
                          Completion Rate
                        </Typography>
                        <Typography fontSize="lg" fontWeight="bold" color="mukuru.teal">
                          {documentAnalytics.completion_rate 
                            ? `${(documentAnalytics.completion_rate * 100).toFixed(1)}%`
                            : 'N/A'}
                        </Typography>
                      </Box>
                    </HStack>
                  </Box>
                  {documentAnalytics.signers && documentAnalytics.signers.length > 0 && (
                    <Box>
                      <Typography fontSize="sm" fontWeight="semibold" mb="3">
                        Signers
                      </Typography>
                      <VStack align="stretch" gap="2">
                        {documentAnalytics.signers.map((signer: any, index: number) => (
                          <Box key={index} p="3" bg="mukuru.background.light" borderRadius="8px">
                            <Typography fontSize="sm" fontWeight="medium">
                              {signer.email}
                            </Typography>
                            {signer.signed_at && (
                              <Typography fontSize="xs" color="mukuru.grey.medium">
                                Signed: {new Date(signer.signed_at * 1000).toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Box>
            </MotionBox>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
