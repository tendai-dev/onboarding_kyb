'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Box, VStack, HStack, Icon, Progress, Circle, Image } from '@chakra-ui/react';
import { Button, Typography, Tag } from '@/lib/mukuruImports';
import {
  FiUpload,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiCloud,
  FiDownload,
} from 'react-icons/fi';
import { SweetAlert } from '../utils/sweetAlert';

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<string>;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  multiple?: boolean;
  label?: string;
  description?: string;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  url?: string;
  error?: string;
  previewUrl?: string; // For image previews
}

export function FileUpload({
  onFileUpload,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  maxSize = 10, // 10MB default
  multiple = false,
  label = 'Upload Document',
  description = 'Drag and drop files here or click to browse',
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedFilesRef = useRef<UploadedFile[]>([]);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        await SweetAlert.error('File Validation Error', validationError);
        return;
      }

      const fileId = Math.random().toString(36).substr(2, 9);

      // Create preview URL for image files
      let previewUrl: string | undefined;
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      if (imageTypes.includes(fileExtension)) {
        previewUrl = URL.createObjectURL(file);
      }

      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        status: 'uploading',
        progress: 0,
        previewUrl,
      };

      setUploadedFiles((prev) => {
        const newFiles = [...prev, uploadedFile];
        uploadedFilesRef.current = newFiles;
        return newFiles;
      });

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadedFiles((prev) => {
            const newFiles = prev.map((f) =>
              f.id === fileId ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
            );
            uploadedFilesRef.current = newFiles;
            return newFiles;
          });
        }, 200);

        // Call the upload function
        const url = await onFileUpload(file);

        clearInterval(progressInterval);

        // Update file status to completed
        setUploadedFiles((prev) => {
          const newFiles = prev.map((f) =>
            f.id === fileId
              ? { ...f, status: 'completed' as const, progress: 100, url }
              : f
          );
          uploadedFilesRef.current = newFiles;
          return newFiles;
        });
      } catch (error) {
        setUploadedFiles((prev) => {
          const newFiles = prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          );
          uploadedFilesRef.current = newFiles;
          return newFiles;
        });
      }
    },
    [onFileUpload, maxSize, acceptedTypes]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (multiple) {
        files.forEach(handleFileUpload);
      } else {
        if (files[0]) {
          handleFileUpload(files[0]);
        }
      }
    },
    [handleFileUpload, multiple]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (multiple) {
      files.forEach(handleFileUpload);
    } else {
      if (files[0]) {
        handleFileUpload(files[0]);
      }
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      // Clean up object URL to prevent memory leaks
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      const newFiles = prev.filter((f) => f.id !== fileId);
      uploadedFilesRef.current = newFiles;
      return newFiles;
    });
  };

  const downloadFile = (uploadedFile: UploadedFile) => {
    if (uploadedFile.url) {
      window.open(uploadedFile.url, '_blank');
    } else if (uploadedFile.previewUrl) {
      const link = document.createElement('a');
      link.href = uploadedFile.previewUrl;
      link.download = uploadedFile.file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      uploadedFilesRef.current.forEach((file) => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, []);

  const getFileIcon = (file: UploadedFile) => {
    const extension = file.file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return '🖼️';
      default:
        return '📁';
    }
  };

  const isImageFile = (file: UploadedFile) => {
    const extension = '.' + file.file.name.split('.').pop()?.toLowerCase();
    const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageTypes.includes(extension);
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Icon as={FiUpload} boxSize="4" />;
      case 'completed':
        return <Icon as={FiCheck} boxSize="4" color="success.500" />;
      case 'error':
        return <Icon as={FiX} boxSize="4" color="error.500" />;
    }
  };

  // Unused helper function - kept for potential future use
  // const getStatusColor = (status: UploadedFile['status']) => {
  //   switch (status) {
  //     case 'uploading':
  //       return 'blue';
  //     case 'completed':
  //       return 'green';
  //     case 'error':
  //       return 'red';
  //   }
  // };

  return (
    <VStack gap="4" align="stretch">
      {/* Upload Area */}
      <Box
        border="2px dashed"
        borderColor={isDragOver ? 'info.400' : 'gray.300'}
        borderRadius="lg"
        p="8"
        textAlign="center"
        bg={isDragOver ? 'info.50' : 'gray.50'}
        cursor="pointer"
        transition="all 0.2s"
        _hover={{
          borderColor: 'info.400',
          bg: 'info.50',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <VStack gap="4">
          <Circle size="60px" bg="info.100" color="info.600">
            <Icon as={FiCloud} boxSize="8" />
          </Circle>

          <VStack gap="2">
            <Typography fontSize="lg" fontWeight="semibold" color="mukuru.text.primary">
              {label}
            </Typography>
            <Typography fontSize="sm" color="mukuru.text.primary">
              {description}
            </Typography>
            <Typography fontSize="xs" color="mukuru.grey.medium">
              Max file size: {maxSize}MB • Accepted: {acceptedTypes.join(', ')}
            </Typography>
          </VStack>

          <Button colorScheme="blue" variant="ghost" size="sm">
            <Icon as={FiUpload} />
            Choose Files
          </Button>
        </VStack>
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <VStack gap="3" align="stretch">
          <Typography fontSize="sm" fontWeight="medium" color="mukuru.text.primary">
            Uploaded Files ({uploadedFiles.length})
          </Typography>

          {uploadedFiles.map((uploadedFile) => (
            <Box
              key={uploadedFile.id}
              p="4"
              border="1px"
              borderColor="gray.200"
              borderRadius="md"
              bg="white"
            >
              <HStack justify="space-between" align="center">
                <HStack gap="3" flex="1">
                  {/* Image Preview or File Icon */}
                  {uploadedFile.previewUrl && isImageFile(uploadedFile) ? (
                    <Box
                      position="relative"
                      w="60px"
                      h="60px"
                      borderRadius="md"
                      overflow="hidden"
                      border="1px"
                      borderColor="gray.200"
                      flexShrink={0}
                    >
                      <Image
                        src={uploadedFile.previewUrl}
                        alt={uploadedFile.file.name}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                      />
                    </Box>
                  ) : (
                    <Typography fontSize="lg">{getFileIcon(uploadedFile)}</Typography>
                  )}

                  <VStack gap="1" align="start" flex="1">
                    <Typography
                      fontSize="sm"
                      fontWeight="medium"
                      color="mukuru.text.primary"
                    >
                      {uploadedFile.file.name}
                    </Typography>
                    <Typography fontSize="xs" color="mukuru.grey.medium">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </VStack>

                  <Tag variant="solid" size="md">
                    {uploadedFile.status}
                  </Tag>
                </HStack>

                <HStack gap="2">
                  {getStatusIcon(uploadedFile.status)}

                  {uploadedFile.status === 'error' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => removeFile(uploadedFile.id)}
                    >
                      <Icon as={FiX} />
                    </Button>
                  )}

                  {uploadedFile.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="green"
                      onClick={() => downloadFile(uploadedFile)}
                    >
                      <Icon as={FiDownload} />
                    </Button>
                  )}
                </HStack>
              </HStack>

              {/* Progress Bar */}
              {uploadedFile.status === 'uploading' && (
                <Box mt="3">
                  <Progress.Root
                    value={uploadedFile.progress}
                    colorScheme="blue"
                    size="sm"
                  >
                    <Progress.Track>
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                  <Typography fontSize="xs" color="gray.500" mt="1">
                    Uploading... {uploadedFile.progress}%
                  </Typography>
                </Box>
              )}

              {/* Error Message */}
              {uploadedFile.status === 'error' && uploadedFile.error && (
                <Box
                  mt="3"
                  p="2"
                  bg="error.50"
                  borderRadius="md"
                  border="1px"
                  borderColor="error.200"
                >
                  <HStack gap="2">
                    <Icon as={FiAlertCircle} color="error.500" boxSize="4" />
                    <Typography fontSize="sm" color="error.700">
                      {uploadedFile.error}
                    </Typography>
                  </HStack>
                </Box>
              )}

              {/* Success Message */}
              {uploadedFile.status === 'completed' && (
                <Box
                  mt="3"
                  p="2"
                  bg="success.50"
                  borderRadius="md"
                  border="1px"
                  borderColor="success.200"
                >
                  <HStack gap="2">
                    <Icon as={FiCheck} color="success.500" boxSize="4" />
                    <Typography fontSize="sm" color="success.700">
                      Ready to upload after case creation
                    </Typography>
                  </HStack>
                </Box>
              )}
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
