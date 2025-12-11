/* eslint-disable security/detect-object-injection */
'use client';

import React, { useState, useEffect } from 'react';
import { Box, HStack, VStack, Spinner, Flex, Image } from '@chakra-ui/react';
import { Typography, Button } from '@mukuru/mukuru-react-components';
import { FiDownload, FiX, FiFile } from 'react-icons/fi';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string | null;
  fileName: string;
  documentType?: string;
  fileSize?: number;
  onDownload?: () => void;
}

export function DocumentViewer({
  isOpen,
  onClose,
  documentUrl,
  fileName,
  documentType,
  fileSize,
  onDownload,
}: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [iframeFailed, setIframeFailed] = useState(false);

  useEffect(() => {
    if (isOpen && documentUrl) {
      setLoading(true);
      setIframeFailed(false);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, documentUrl]);

  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif'];
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return imageExtensions.includes(ext);
  };

  const canDisplayInIframe = (fileName: string): boolean => {
    const iframeExtensions = ['.pdf', '.html', '.htm', '.txt', '.csv'];
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return iframeExtensions.includes(ext);
  };

  const canUseGoogleViewer = (fileName: string): boolean => {
    const googleViewerExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return googleViewerExtensions.includes(ext);
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="rgba(17, 24, 39, 0.7)"
        backdropFilter="blur(4px)"
        zIndex={9998}
        onClick={onClose}
      />
      
      {/* Modal */}
      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        bg="white"
        borderRadius="16px"
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)"
        zIndex={9999}
        w="95vw"
        maxW="1400px"
        h="92vh"
        maxH="92vh"
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <Box
          p="20px 24px"
          borderBottom="1px solid"
          borderColor="#E9E9EA"
          bg="#FAFBFC"
        >
          <Flex justify="space-between" align="flex-start" gap="16px">
            {/* File Info */}
            <VStack align="start" gap="4px" flex="1" minW="0">
              <Typography 
                fontSize="16px" 
                fontWeight="600" 
                color="#373A36"
                style={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  maxWidth: '100%'
                }}
              >
                {fileName}
              </Typography>
              <HStack gap="8px">
                {documentType && (
                  <Box px="8px" py="2px" bg="#F1F5F9" borderRadius="4px">
                    <Typography fontSize="11px" fontWeight="500" color="#64748B">
                      {documentType}
                    </Typography>
                  </Box>
                )}
                {fileSize && (
                  <Typography fontSize="12px" color="#64748B">
                    {formatFileSize(fileSize)}
                  </Typography>
                )}
              </HStack>
            </VStack>
            
            {/* Action Buttons */}
            <HStack gap="8px" flexShrink={0}>
              {onDownload && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onDownload}
                  borderRadius="8px"
                >
                  <HStack gap="6px">
                    <FiDownload size={14} />
                    <Typography fontSize="13px" fontWeight="500" color="#373A36">Download</Typography>
                  </HStack>
                </Button>
              )}
              <Box
                as="button"
                onClick={onClose}
                w="32px"
                h="32px"
                borderRadius="8px"
                bg="#F1F5F9"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                _hover={{ bg: '#E2E8F0' }}
                transition="background 0.2s"
              >
                <FiX size={18} color="#64748B" />
              </Box>
            </HStack>
          </Flex>
        </Box>

        {/* Content */}
        <Box flex="1" overflow="auto" bg="#F8FAFC" h="calc(92vh - 100px)">
          {loading && !documentUrl ? (
            <Flex justify="center" align="center" minH="300px">
              <VStack gap="16px">
                <Spinner size="lg" color="#F05423" />
                <Typography fontSize="14px" color="#64748B">Loading document...</Typography>
              </VStack>
            </Flex>
          ) : documentUrl ? (
            isImageFile(fileName) ? (
              <Box p="24px" display="flex" justifyContent="center" alignItems="center" h="100%" minH="calc(92vh - 140px)">
                <Image
                  src={documentUrl}
                  alt={fileName}
                  maxW="100%"
                  maxH="calc(92vh - 180px)"
                  objectFit="contain"
                  borderRadius="12px"
                  boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)"
                  onLoad={() => setLoading(false)}
                  onError={() => setLoading(false)}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              </Box>
            ) : canDisplayInIframe(fileName) ? (
              <Box p="24px" position="relative" h="100%" minH="calc(92vh - 140px)">
                <iframe
                  src={`${documentUrl}#toolbar=1&navpanes=0&scrollbar=1&zoom=100`}
                  style={{
                    width: '100%',
                    height: 'calc(92vh - 180px)',
                    border: 'none',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                  }}
                  title={fileName}
                  onLoad={() => setLoading(false)}
                  onError={() => { setLoading(false); setIframeFailed(true); }}
                />
                {loading && (
                  <Flex
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    justify="center"
                    align="center"
                    bg="white"
                    p="20px"
                    borderRadius="12px"
                    boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
                  >
                    <VStack gap="12px">
                      <Spinner size="lg" color="#F05423" />
                      <Typography fontSize="13px" color="#64748B">Loading PDF...</Typography>
                    </VStack>
                  </Flex>
                )}
              </Box>
            ) : (
              /* Non-previewable file type - show nice download prompt */
              <Flex justify="center" align="center" minH="300px" p="32px">
                <VStack gap="24px" align="center" maxW="420px">
                  {/* File Icon */}
                  <Box
                    w="72px"
                    h="72px"
                    borderRadius="16px"
                    bg="#FFF5F2"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiFile size={32} color="#F05423" />
                  </Box>
                  
                  {/* File Info */}
                  <VStack gap="12px" align="center">
                    <Typography 
                      fontSize="15px" 
                      fontWeight="600" 
                      color="#373A36"
                      textAlign="center"
                      style={{ wordBreak: 'break-word', maxWidth: '100%' }}
                    >
                      {fileName}
                    </Typography>
                    
                    {/* File type badge */}
                    <Box px="12px" py="4px" bg="#F1F5F9" borderRadius="6px">
                      <Typography fontSize="12px" fontWeight="500" color="#64748B">
                        {fileName.substring(fileName.lastIndexOf('.') + 1).toUpperCase()} Document
                      </Typography>
                    </Box>
                    
                    <Typography fontSize="13px" color="#64748B" textAlign="center" lineHeight="1.6">
                      This file type cannot be previewed in the browser.
                      <br />
                      Download the file to open it in the appropriate application.
                    </Typography>
                  </VStack>
                  
                  {/* Download Button */}
                  <Button
                    variant="primary"
                    size="md"
                    onClick={onDownload}
                    className="mukuru-primary-button"
                    borderRadius="10px"
                    h="44px"
                    px="24px"
                  >
                    <HStack gap="8px">
                      <FiDownload size={16} />
                      <Typography fontSize="14px" fontWeight="500" color="white">Download File</Typography>
                    </HStack>
                  </Button>
                </VStack>
              </Flex>
            )
          ) : (
            <Flex justify="center" align="center" minH="300px">
              <Typography fontSize="14px" color="#64748B">Document not available</Typography>
            </Flex>
          )}
        </Box>
      </Box>
    </>
  );
}
