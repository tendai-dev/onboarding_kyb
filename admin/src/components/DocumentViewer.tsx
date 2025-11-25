'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Spinner,
  Flex,
  Image,
} from '@chakra-ui/react';
import { Typography, Button, Modal, ModalHeader, ModalBody, IconWrapper } from '@/lib/mukuruImports';
import { FiDownload, FiX, FiFileText } from 'react-icons/fi';

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
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
      // Loading will be set to false when image/iframe actually loads (via onLoad handlers)
      // No artificial delay - let the actual load events control the loading state
      return () => {
        // Restore body scrolling when modal closes
        document.body.style.overflow = '';
      };
    } else {
      // Restore body scrolling when modal is closed
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

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="large"
      header={
        <HStack justify="space-between" align="center" w="full">
          <VStack align="start" gap="0">
            <Typography fontSize="lg" fontWeight="700" color="black">
              {fileName}
            </Typography>
            <Typography fontSize="sm" color="black">
              {documentType && `${documentType} • `}
              {fileSize && formatFileSize(fileSize)}
            </Typography>
          </VStack>
          <HStack gap="2">
            {onDownload && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onDownload}
              >
                <IconWrapper><FiDownload size={16} /></IconWrapper>
                Download
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <IconWrapper><FiX size={16} /></IconWrapper>
            </Button>
          </HStack>
        </HStack>
      }
    >
      <Box p="0" overflow="hidden" flex="1" display="flex" flexDirection="column" maxH="90vh">
            {loading && !documentUrl ? (
              <Flex justify="center" align="center" minH="400px">
                <VStack gap="4">
                  <Spinner size="xl" color="orange.500" />
                  <Typography color="black">Loading document...</Typography>
                </VStack>
              </Flex>
            ) : documentUrl ? (
              isImageFile(fileName) ? (
                <Box p="4" bg="gray.50" display="flex" justifyContent="center" alignItems="center" minH="400px">
                  <Image
                    src={documentUrl}
                    alt={fileName}
                    maxW="100%"
                    maxH="70vh"
                    objectFit="contain"
                    borderRadius="md"
                    onLoad={() => {
                      setLoading(false);
                      console.log('Image loaded successfully');
                    }}
                    onError={(e) => {
                      setLoading(false);
                      console.error('Image failed to load:', e);
                      console.error('Image URL:', documentUrl);
                    }}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                </Box>
              ) : canDisplayInIframe(fileName) ? (
                <Box 
                  p="2" 
                  bg="gray.50" 
                  flex="1" 
                  position="relative" 
                  display="flex" 
                  flexDirection="column"
                  overflow="auto"
                  minH="0"
                >
                  <iframe
                    src={`${documentUrl}#toolbar=1&navpanes=0&scrollbar=1&zoom=120`}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      minHeight: '600px'
                    }}
                    title={fileName}
                    onLoad={() => {
                      setLoading(false);
                      console.log('PDF iframe loaded successfully');
                    }}
                    onError={(e) => {
                      setLoading(false);
                      setIframeFailed(true);
                      console.error('PDF iframe failed to load:', e);
                      console.error('PDF URL:', documentUrl);
                    }}
                  />
                  {!loading && !iframeFailed && (
                    <Box
                      position="absolute"
                      bottom="4"
                      left="50%"
                      transform="translateX(-50%)"
                      bg="orange.50"
                      border="1px solid"
                      borderColor="orange.200"
                      borderRadius="md"
                      p="3"
                      maxW="90%"
                      zIndex={5}
                    >
                      <HStack gap="2" justify="center">
                        <Typography fontSize="sm" color="black">
                          PDF not displaying?
                        </Typography>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (onDownload) {
                              onDownload();
                            } else {
                              window.open(documentUrl, '_blank');
                            }
                          }}
                        >
                          Open in New Tab
                        </Button>
                      </HStack>
                    </Box>
                  )}
                  {iframeFailed && (
                    <Box p="8" textAlign="center" minH="400px" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                      <IconWrapper><FiFileText size={64} color="black" /></IconWrapper>
                      <Typography fontSize="lg" fontWeight="medium" color="black" mb="2" mt="4">
                        {fileName}
                      </Typography>
                      <Typography color="black" mb="6" textAlign="center" maxW="400px">
                        Your browser cannot display PDFs inline. Click the button below to open the PDF in a new tab.
                      </Typography>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => {
                          if (onDownload) {
                            onDownload();
                          } else {
                            window.open(documentUrl, '_blank');
                          }
                        }}
                      >
                        <IconWrapper><FiDownload size={16} /></IconWrapper>
                        Open PDF in New Tab
                      </Button>
                    </Box>
                  )}
                  {loading && (
                    <Flex 
                      position="absolute" 
                      top="50%" 
                      left="50%" 
                      transform="translate(-50%, -50%)"
                      justify="center" 
                      align="center"
                      zIndex={10}
                      bg="white"
                      p="4"
                      borderRadius="md"
                      boxShadow="md"
                    >
                      <VStack gap="4">
                        <Spinner size="xl" color="orange.500" />
                        <Typography color="black">Loading PDF...</Typography>
                      </VStack>
                    </Flex>
                  )}
                </Box>
              ) : (
                <Box p="4" bg="gray.50" minH="400px">
                  <VStack gap="4" align="center" justify="center" minH="400px">
                    <IconWrapper><FiFileText size={48} color="black" /></IconWrapper>
                    <Typography fontSize="lg" fontWeight="medium" color="black">
                      {fileName}
                    </Typography>
                    <Typography fontSize="sm" color="black" textAlign="center">
                      This file type cannot be previewed in the browser.
                      <br />
                      Click the download button to view it.
                    </Typography>
                    <Button
                      variant="primary"
                      onClick={onDownload}
                    >
                      <IconWrapper><FiDownload size={16} /></IconWrapper>
                      Download to View
                    </Button>
                  </VStack>
                </Box>
              )
            ) : (
              <Flex justify="center" align="center" minH="400px">
                <VStack gap="4">
                  <Typography color="black">Document not available</Typography>
                </VStack>
              </Flex>
            )}
      </Box>
    </Modal>
  );
}

