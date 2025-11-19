"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Icon, 
  Button,
  Progress,
  Badge,
  Circle,
  Image
} from "@chakra-ui/react";
import { 
  FiUpload, 
  FiFile, 
  FiCheck, 
  FiX, 
  FiAlertCircle,
  FiCloud
} from "react-icons/fi";
import { SweetAlert } from "../utils/sweetAlert";

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
  label = "Upload Document",
  description = "Drag and drop files here or click to browse"
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

  const handleFileUpload = useCallback(async (file: File) => {
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
      previewUrl
    };

    setUploadedFiles(prev => {
      const newFiles = [...prev, uploadedFile];
      uploadedFilesRef.current = newFiles;
      return newFiles;
    });

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => {
          const newFiles = prev.map(f => 
            f.id === fileId 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          );
          uploadedFilesRef.current = newFiles;
          return newFiles;
        });
      }, 200);

      // Call the upload function
      const url = await onFileUpload(file);

      clearInterval(progressInterval);

      // Update file status to completed
      setUploadedFiles(prev => {
        const newFiles = prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'completed' as const, progress: 100, url }
            : f
        );
        uploadedFilesRef.current = newFiles;
        return newFiles;
      });
    } catch (error) {
      setUploadedFiles(prev => {
        const newFiles = prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                status: 'error' as const, 
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : f
        );
        uploadedFilesRef.current = newFiles;
        return newFiles;
      });
    }
  }, [onFileUpload, maxSize, acceptedTypes]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (multiple) {
      files.forEach(handleFileUpload);
    } else {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload, multiple]);

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
      handleFileUpload(files[0]);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      // Clean up object URL to prevent memory leaks
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      const newFiles = prev.filter(f => f.id !== fileId);
      uploadedFilesRef.current = newFiles;
      return newFiles;
    });
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      uploadedFilesRef.current.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, []);

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
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

  const isImageFile = (file: File) => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageTypes.includes(extension);
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Icon as={FiUpload} boxSize="4" />;
      case 'completed':
        return <Icon as={FiCheck} boxSize="4" color="green.500" />;
      case 'error':
        return <Icon as={FiX} boxSize="4" color="red.500" />;
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'blue';
      case 'completed':
        return 'green';
      case 'error':
        return 'red';
    }
  };

  return (
    <VStack gap="4" align="stretch">
      {/* Upload Area */}
      <Box
        border="2px dashed"
        borderColor={isDragOver ? "blue.400" : "gray.300"}
        borderRadius="lg"
        p="8"
        textAlign="center"
        bg={isDragOver ? "blue.50" : "gray.50"}
        cursor="pointer"
        transition="all 0.2s"
        _hover={{
          borderColor: "blue.400",
          bg: "blue.50"
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <VStack gap="4">
          <Circle size="60px" bg="blue.100" color="blue.600">
            <Icon as={FiCloud} boxSize="8" />
          </Circle>
          
          <VStack gap="2">
            <Text fontSize="lg" fontWeight="semibold" color="gray.700">
              {label}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {description}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Max file size: {maxSize}MB • Accepted: {acceptedTypes.join(', ')}
            </Text>
          </VStack>

          <Button
            colorScheme="blue"
            variant="outline"
            size="sm"
          >
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
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            Uploaded Files ({uploadedFiles.length})
          </Text>
          
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
                  {uploadedFile.previewUrl && isImageFile(uploadedFile.file) ? (
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
                    <Text fontSize="lg">{getFileIcon(uploadedFile.file)}</Text>
                  )}
                  
                  <VStack gap="1" align="start" flex="1">
                    <Text fontSize="sm" fontWeight="medium" color="gray.800">
                      {uploadedFile.file.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </VStack>

                  <Badge colorScheme={getStatusColor(uploadedFile.status)}>
                    {uploadedFile.status}
                  </Badge>
                </HStack>

                <HStack gap="2">
                  {getStatusIcon(uploadedFile.status)}
                  
                  {uploadedFile.status === 'error' && (
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => removeFile(uploadedFile.id)}
                    >
                      <Icon as={FiX} />
                    </Button>
                  )}
                  
                  {uploadedFile.status === 'completed' && (
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="green"
                      onClick={() => removeFile(uploadedFile.id)}
                    >
                      <Icon as={FiX} />
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
                  <Text fontSize="xs" color="gray.500" mt="1">
                    Uploading... {uploadedFile.progress}%
                  </Text>
                </Box>
              )}

              {/* Error Message */}
              {uploadedFile.status === 'error' && uploadedFile.error && (
                <Box mt="3" p="2" bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
                  <HStack gap="2">
                    <Icon as={FiAlertCircle} color="red.500" boxSize="4" />
                    <Text fontSize="sm" color="red.700">
                      {uploadedFile.error}
                    </Text>
                  </HStack>
                </Box>
              )}

              {/* Success Message */}
              {uploadedFile.status === 'completed' && (
                <Box mt="3" p="2" bg="green.50" borderRadius="md" border="1px" borderColor="green.200">
                  <HStack gap="2">
                    <Icon as={FiCheck} color="green.500" boxSize="4" />
                    <Text fontSize="sm" color="green.700">
                      Ready to upload after case creation
                    </Text>
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
