// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  Tooltip,
  Badge,
  Flex,
  useDisclosure,
  Switch,
  Checkbox,
  CheckboxGroup,
  Stack,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  Alert,
  AlertTitle,
  AlertDescription,
  Spinner,
  Icon
} from '@chakra-ui/react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiLink,
  FiImage,
  FiTable,
  FiCode,
  FiSave,
  FiX,
  FiPlus,
  FiMinus,
  FiChevronDown,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiTag,
  FiSearch,
  FiFilter,
  FiDownload,
  FiUpload,
  FiEye,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiXCircle,
  FiInfo,
  FiAlertTriangle,
  FiCheckCircle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

// Rich Text Editor Component
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  readOnly?: boolean;
  showToolbar?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  height = '200px',
  readOnly = false,
  showToolbar = true
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const ToolbarButton = ({ 
    icon, 
    command, 
    value, 
    tooltip, 
    onClick 
  }: {
    icon: React.ReactNode;
    command?: string;
    value?: string;
    tooltip: string;
    onClick?: () => void;
  }) => (
    <Tooltip label={tooltip}>
      <IconButton
        size="sm"
        variant="ghost"
        icon={icon}
        onClick={onClick || (() => execCommand(command!, value))}
        aria-label={tooltip}
      />
    </Tooltip>
  );

  return (
    <VStack align="stretch" spacing="0">
      {showToolbar && !readOnly && (
        <HStack
          p="2"
          bg="gray.50"
          border="1px"
          borderColor="gray.200"
          borderBottom="none"
          borderRadius="md"
          borderRadiusBottom="none"
          wrap="wrap"
        >
          <ToolbarButton icon={<FiBold />} command="bold" tooltip="Bold" />
          <ToolbarButton icon={<FiItalic />} command="italic" tooltip="Italic" />
          <ToolbarButton icon={<FiUnderline />} command="underline" tooltip="Underline" />
          
          <Divider orientation="vertical" height="20px" />
          
          <ToolbarButton icon={<FiAlignLeft />} command="justifyLeft" tooltip="Align Left" />
          <ToolbarButton icon={<FiAlignCenter />} command="justifyCenter" tooltip="Align Center" />
          <ToolbarButton icon={<FiAlignRight />} command="justifyRight" tooltip="Align Right" />
          
          <Divider orientation="vertical" height="20px" />
          
          <ToolbarButton icon={<FiList />} command="insertUnorderedList" tooltip="Bullet List" />
          <ToolbarButton icon={<FiList />} command="insertOrderedList" tooltip="Numbered List" />
          
          <Divider orientation="vertical" height="20px" />
          
          <ToolbarButton icon={<FiLink />} command="" tooltip="Insert Link" onClick={insertLink} />
          <ToolbarButton icon={<FiImage />} command="" tooltip="Insert Image" onClick={insertImage} />
          <ToolbarButton icon={<FiTable />} command="insertTable" tooltip="Insert Table" />
          <ToolbarButton icon={<FiCode />} command="insertHTML" tooltip="Insert Code" />
        </HStack>
      )}
      
      <Box
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        p="3"
        minHeight={height}
        border="1px"
        borderColor={isFocused ? "blue.300" : "gray.200"}
        borderRadius="md"
        borderRadiusTop={showToolbar ? "none" : "md"}
        bg="white"
        _focus={{ outline: "none" }}
        _placeholder={{ color: "gray.400" }}
        dangerouslySetInnerHTML={{ __html: value || `<div style="color: #9CA3AF;">${placeholder}</div>` }}
        style={{ outline: 'none' }}
      />
    </VStack>
  );
}

// Advanced Date Picker Component
interface AdvancedDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  showTime?: boolean;
  showTimezone?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
}

export function AdvancedDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  showTime = false,
  showTimezone = false,
  minDate,
  maxDate,
  disabled = false,
  required = false,
  label,
  error
}: AdvancedDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [selectedTime, setSelectedTime] = useState({
    hours: value?.getHours() || 0,
    minutes: value?.getMinutes() || 0
  });
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');

  const timezones = [
    'UTC', 'GMT', 'EST', 'PST', 'CET', 'JST', 'AEST', 'IST'
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (hours: number, minutes: number) => {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeChange = (field: 'hours' | 'minutes', value: number) => {
    setSelectedTime(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    if (selectedDate) {
      const finalDate = new Date(selectedDate);
      if (showTime) {
        finalDate.setHours(selectedTime.hours, selectedTime.minutes);
      }
      onChange(finalDate);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange(null);
    setIsOpen(false);
  };

  const generateCalendarDays = () => {
    if (!selectedDate) return [];
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  return (
    <FormControl isRequired={required} isInvalid={!!error}>
      {label && <FormLabel>{label}</FormLabel>}
      
      <Box position="relative">
        <Button
          rightIcon={<FiChevronDown />}
          variant="outline"
          width="full"
          justifyContent="space-between"
          isDisabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
        >
          {value ? (
            <HStack>
              <Icon as={FiCalendar} />
              <Text>
                {formatDate(value)}
                {showTime && ` ${formatTime(value.getHours(), value.getMinutes())}`}
                {showTimezone && ` ${selectedTimezone}`}
              </Text>
            </HStack>
          ) : (
            <Text color="gray.500">{placeholder}</Text>
          )}
        </Button>
        {isOpen && (
        <Box p="4" minWidth="320px" position="absolute" mt="2" bg="white" border="1px" borderColor="gray.200" borderRadius="md" boxShadow="md" zIndex={10}>
          <VStack align="stretch" spacing="4">
            {/* Calendar */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb="2">Select Date</Text>
              <Box
                display="grid"
                gridTemplateColumns="repeat(7, 1fr)"
                gap="1"
                fontSize="sm"
              >
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Text key={day} textAlign="center" fontWeight="semibold" p="2">
                    {day}
                  </Text>
                ))}
                {generateCalendarDays().map((day, index) => {
                  const isCurrentMonth = day.getMonth() === selectedDate?.getMonth();
                  const isSelected = selectedDate && 
                    day.toDateString() === selectedDate.toDateString();
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isDisabled = (minDate && day < minDate) || (maxDate && day > maxDate);
                  
                  return (
                    <Button
                      key={index}
                      size="sm"
                      variant={isSelected ? "solid" : "ghost"}
                      colorScheme={isSelected ? "blue" : undefined}
                      isDisabled={isDisabled}
                      onClick={() => handleDateSelect(day)}
                      bg={isToday ? "blue.50" : undefined}
                      color={!isCurrentMonth ? "gray.400" : undefined}
                    >
                      {day.getDate()}
                    </Button>
                  );
                })}
              </Box>
            </Box>
            
            {/* Time Selection */}
            {showTime && (
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb="2">Select Time</Text>
                <HStack spacing="4">
                  <VStack spacing="2">
                    <Text fontSize="xs">Hours</Text>
                    <Select
                      size="sm"
                      value={selectedTime.hours}
                      onChange={(e) => handleTimeChange('hours', parseInt(e.target.value))}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </Select>
                  </VStack>
                  <VStack spacing="2">
                    <Text fontSize="xs">Minutes</Text>
                    <Select
                      size="sm"
                      value={selectedTime.minutes}
                      onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value))}
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </Select>
                  </VStack>
                </HStack>
              </Box>
            )}
            
            {/* Timezone Selection */}
            {showTimezone && (
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb="2">Timezone</Text>
                <Select
                  size="sm"
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </Select>
              </Box>
            )}
            
            {/* Actions */}
            <HStack justify="space-between">
              <Button size="sm" variant="ghost" onClick={handleClear}>
                Clear
              </Button>
              <HStack>
                <Button size="sm" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" colorScheme="blue" onClick={handleApply}>
                  Apply
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </Box>
        )}
      </Box>
      
      {error && (
        <Text fontSize="sm" color="red.500" mt="1">
          {error}
        </Text>
      )}
    </FormControl>
  );
}

// Multi-Select with Search and Tagging
interface MultiSelectProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  creatable?: boolean;
  maxItems?: number;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options',
  searchable = true,
  creatable = false,
  maxItems,
  disabled = false,
  required = false,
  label,
  error
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newOption, setNewOption] = useState('');

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter(option => value.includes(option.value));

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else if (!maxItems || value.length < maxItems) {
      onChange([...value, optionValue]);
    }
  };

  const handleCreate = () => {
    if (newOption.trim() && creatable) {
      const newValue = newOption.trim().toLowerCase().replace(/\s+/g, '-');
      if (!value.includes(newValue)) {
        onChange([...value, newValue]);
      }
      setNewOption('');
    }
  };

  const handleRemove = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  return (
    <FormControl isRequired={required} isInvalid={!!error}>
      {label && <FormLabel>{label}</FormLabel>}
      
      <VStack align="stretch" spacing="2">
        {/* Selected Items */}
        {selectedOptions.length > 0 && (
          <Wrap>
            {selectedOptions.map(option => (
              <WrapItem key={option.value}>
                <Tag size="md" colorScheme="blue" borderRadius="full">
                  <TagLabel>{option.label}</TagLabel>
                  <TagCloseButton onClick={() => handleRemove(option.value)} />
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        )}
        
        {/* Dropdown */}
        <Box position="relative">
          <Button
            rightIcon={<FiChevronDown />}
            variant="outline"
            width="full"
            justifyContent="space-between"
            isDisabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
          >
            <Text color={selectedOptions.length === 0 ? "gray.500" : "inherit"}>
              {selectedOptions.length === 0 ? placeholder : `${selectedOptions.length} selected`}
            </Text>
          </Button>
          {isOpen && (
          <Box maxHeight="300px" overflowY="auto" position="absolute" mt="2" bg="white" border="1px" borderColor="gray.200" borderRadius="md" boxShadow="md" zIndex={10} width="full">
            <VStack align="stretch" spacing="0">
              {/* Search */}
              {searchable && (
                <Box p="2" borderBottom="1px" borderColor="gray.200">
                  <Input
                    size="sm"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Box>
              )}
              
              {/* Options */}
              {filteredOptions.map(option => (
                <Box
                  key={option.value}
                  as="button"
                  onClick={() => handleSelect(option.value)}
                  disabled={option.disabled}
                  textAlign="left"
                  bg={value.includes(option.value) ? "blue.50" : undefined}
                >
                  <HStack width="full" justify="space-between" p="2" _hover={{ bg: "gray.50" }}>
                    <Text>{option.label}</Text>
                    {value.includes(option.value) && (
                      <Icon as={FiCheck} color="blue.500" />
                    )}
                  </HStack>
                </Box>
              ))}
              
              {/* Create New Option */}
              {creatable && newOption.trim() && (
                <Box>
                  <Divider />
                  <Box as="button" onClick={handleCreate} width="full">
                    <HStack p="2" _hover={{ bg: "gray.50" }}>
                      <Icon as={FiPlus} />
                      <Text>Create "{newOption}"</Text>
                    </HStack>
                  </Box>
                </Box>
              )}
              
              {/* New Option Input */}
              {creatable && (
                <Box p="2" borderTop="1px" borderColor="gray.200">
                  <HStack>
                    <Input
                      size="sm"
                      placeholder="Add new option..."
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreate();
                        }
                      }}
                    />
                    <IconButton
                      size="sm"
                      icon={<FiPlus />}
                      onClick={handleCreate}
                      isDisabled={!newOption.trim()}
                    />
                  </HStack>
                </Box>
              )}
            </VStack>
          </Box>
          )}
        </Box>
      </VStack>
      
      {error && (
        <Text fontSize="sm" color="red.500" mt="1">
          {error}
        </Text>
      )}
    </FormControl>
  );
}

// Loading Skeleton Component
interface LoadingSkeletonProps {
  height?: string;
  width?: string;
  borderRadius?: string;
  lines?: number;
  spacing?: string;
}

export function LoadingSkeleton({
  height = "20px",
  width = "100%",
  borderRadius = "4px",
  lines = 1,
  spacing = "8px"
}: LoadingSkeletonProps) {
  return (
    <VStack align="stretch" spacing={spacing}>
      {Array.from({ length: lines }, (_, index) => (
        <Box
          key={index}
          height={height}
          width={width}
          borderRadius={borderRadius}
          bg="gray.200"
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </VStack>
  );
}

// Toast Notification System
interface ToastProps {
  id: string;
  title: string;
  description?: string;
  status: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, title, description, status, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <FiCheckCircle />;
      case 'error': return <FiXCircle />;
      case 'warning': return <FiAlertTriangle />;
      case 'info': return <FiInfo />;
      default: return <FiInfo />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'blue';
      default: return 'blue';
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3 }}
      p="4"
      bg="white"
      border="1px"
      borderColor="gray.200"
      borderRadius="md"
      boxShadow="lg"
      maxWidth="400px"
      minWidth="300px"
    >
      <HStack align="start" spacing="3">
        <Icon as={getStatusIcon()} color={`${getStatusColor()}.500`} boxSize="5" />
        <VStack align="start" spacing="1" flex="1">
          <Text fontWeight="semibold" fontSize="sm">
            {title}
          </Text>
          {description && (
            <Text fontSize="sm" color="gray.600">
              {description}
            </Text>
          )}
        </VStack>
        <IconButton
          size="sm"
          variant="ghost"
          icon={<FiX />}
          onClick={() => onClose(id)}
          aria-label="Close notification"
        />
      </HStack>
    </MotionBox>
  );
}

// Toast Container
interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <Box
      position="fixed"
      top="4"
      right="4"
      zIndex="9999"
      maxWidth="400px"
    >
      <VStack align="stretch" spacing="2">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast key={toast.id} {...toast} onClose={onClose} />
          ))}
        </AnimatePresence>
      </VStack>
    </Box>
  );
}
