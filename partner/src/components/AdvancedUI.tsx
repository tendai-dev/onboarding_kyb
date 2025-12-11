'use client';
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  IconButton,
  Wrap,
  WrapItem,
  Icon,
  CloseButton,
} from '@chakra-ui/react';
import { Button, Typography, Tooltip, Input } from '@/lib/mukuruImports';
import { FormControl, FormLabel } from '@/lib/mukuruComponentWrappers';
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
  FiX,
  FiPlus,
  FiChevronDown,
  FiCalendar,
  FiCheck,
  FiXCircle,
  FiInfo,
  FiAlertTriangle,
  FiCheckCircle,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

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
  showToolbar = true,
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
    onClick,
  }: {
    icon: React.ReactNode;
    command?: string;
    value?: string;
    tooltip: string;
    onClick?: () => void;
  }) => (
    <Tooltip content={tooltip}>
      <IconButton
        size="sm"
        variant="ghost"
        onClick={onClick || (() => execCommand(command!, value))}
        aria-label={tooltip}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );

  return (
    <VStack align="stretch" gap="0">
      {showToolbar && !readOnly && (
        <HStack
          p="2"
          bg="mukuru.background.light"
          border="1px"
          borderColor="mukuru.grey.light"
          borderBottom="none"
          borderRadius="md"
          borderBottomRadius="0"
          wrap="wrap"
        >
          <ToolbarButton icon={<FiBold />} command="bold" tooltip="Bold" />
          <ToolbarButton icon={<FiItalic />} command="italic" tooltip="Italic" />
          <ToolbarButton icon={<FiUnderline />} command="underline" tooltip="Underline" />

          <Box width="1px" height="20px" bg="mukuru.grey.light" />

          <ToolbarButton
            icon={<FiAlignLeft />}
            command="justifyLeft"
            tooltip="Align Left"
          />
          <ToolbarButton
            icon={<FiAlignCenter />}
            command="justifyCenter"
            tooltip="Align Center"
          />
          <ToolbarButton
            icon={<FiAlignRight />}
            command="justifyRight"
            tooltip="Align Right"
          />

          <Box width="1px" height="20px" bg="mukuru.grey.light" />

          <ToolbarButton
            icon={<FiList />}
            command="insertUnorderedList"
            tooltip="Bullet List"
          />
          <ToolbarButton
            icon={<FiList />}
            command="insertOrderedList"
            tooltip="Numbered List"
          />

          <Box width="1px" height="20px" bg="mukuru.grey.light" />

          <ToolbarButton
            icon={<FiLink />}
            command=""
            tooltip="Insert Link"
            onClick={insertLink}
          />
          <ToolbarButton
            icon={<FiImage />}
            command=""
            tooltip="Insert Image"
            onClick={insertImage}
          />
          <ToolbarButton
            icon={<FiTable />}
            command="insertTable"
            tooltip="Insert Table"
          />
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
        borderColor={isFocused ? 'mukuru.buttons.primary' : 'mukuru.grey.light'}
        borderRadius="md"
        borderTopRadius={showToolbar ? '0' : 'md'}
        bg="white"
        _focus={{ outline: 'none' }}
        _placeholder={{ color: '#D0D0D0' }}
        dangerouslySetInnerHTML={{
          __html: value || `<div style="color: #D0D0D0;">${placeholder}</div>`,
        }}
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
  error,
}: AdvancedDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [selectedTime, setSelectedTime] = useState({
    hours: value?.getHours() || 0,
    minutes: value?.getMinutes() || 0,
  });
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');

  const timezones = ['UTC', 'GMT', 'EST', 'PST', 'CET', 'JST', 'AEST', 'IST'];

  const formatDate = (_date: Record<string, unknown>) => {
    const date = _date instanceof Date ? _date : new Date(String(_date));
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
    setSelectedTime((prev) => ({ ...prev, [field]: value }));
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
    // const lastDay = new Date(year, month + 1, 0);
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
          variant="ghost"
          width="full"
          justifyContent="space-between"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
        >
          {value ? (
            <HStack>
              <Icon as={FiCalendar} />
              <Typography>
                {formatDate(value as unknown as Record<string, unknown>)}
                {showTime && ` ${formatTime(value.getHours(), value.getMinutes())}`}
                {showTimezone && ` ${selectedTimezone}`}
              </Typography>
            </HStack>
          ) : (
            <Typography color="mukuru.grey.medium">{placeholder}</Typography>
          )}
        </Button>
        {isOpen && (
          <Box
            p="4"
            minWidth="320px"
            position="absolute"
            mt="2"
            bg="white"
            border="1px"
            borderColor="mukuru.grey.light"
            borderRadius="md"
            boxShadow="md"
            zIndex={10}
          >
            <VStack align="stretch" gap="4">
              {/* Calendar */}
              <Box>
                <Typography fontSize="sm" fontWeight="semibold" mb="2">
                  Select Date
                </Typography>
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(7, 1fr)"
                  gap="1"
                  fontSize="sm"
                >
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Typography key={day} textAlign="center" fontWeight="semibold" p="2">
                      {day}
                    </Typography>
                  ))}
                  {generateCalendarDays().map((day, index) => {
                    const isSelected =
                      selectedDate && day.toDateString() === selectedDate.toDateString();
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isDisabled =
                      (minDate && day < minDate) || (maxDate && day > maxDate);

                    return (
                      <Button
                        key={index}
                        size="sm"
                        variant={isSelected ? 'primary' : 'ghost'}
                        colorScheme={isSelected ? 'primary' : undefined}
                        disabled={isDisabled}
                        onClick={() => handleDateSelect(day)}
                        bg={isToday ? 'info.50' : undefined}
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
                  <Typography fontSize="sm" fontWeight="semibold" mb="2">
                    Select Time
                  </Typography>
                  <HStack gap="4">
                    <VStack gap="2">
                      <Typography fontSize="xs" color="mukuru.text.primary">
                        Hours
                      </Typography>
                      <select
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.875rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #e2e8f0',
                        }}
                        value={selectedTime.hours}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleTimeChange('hours', parseInt(e.target.value))
                        }
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </VStack>
                    <VStack gap="2">
                      <Typography fontSize="xs" color="mukuru.text.primary">
                        Minutes
                      </Typography>
                      <select
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.875rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #e2e8f0',
                        }}
                        value={selectedTime.minutes}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleTimeChange('minutes', parseInt(e.target.value))
                        }
                      >
                        {Array.from({ length: 60 }, (_, i) => (
                          <option key={i} value={i}>
                            {i.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </VStack>
                  </HStack>
                </Box>
              )}

              {/* Timezone Selection */}
              {showTimezone && (
                <Box>
                  <Typography fontSize="sm" fontWeight="semibold" mb="2">
                    Timezone
                  </Typography>
                  <select
                    style={{
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #e2e8f0',
                    }}
                    value={selectedTimezone}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setSelectedTimezone(e.target.value)
                    }
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </Box>
              )}

              {/* Actions */}
              <HStack justify="space-between">
                <Button size="sm" variant="ghost" onClick={handleClear}>
                  Clear
                </Button>
                <HStack>
                  <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" colorScheme="primary" onClick={handleApply}>
                    Apply
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </Box>
        )}
      </Box>

      {error && (
        <Typography fontSize="sm" color="error.500" mt="1">
          {error}
        </Typography>
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
  error,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newOption, setNewOption] = useState('');

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter((option) => value.includes(option.value));

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
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
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <FormControl isRequired={required} isInvalid={!!error}>
      {label && <FormLabel>{label}</FormLabel>}

      <VStack align="stretch" gap="2">
        {/* Selected Items */}
        {selectedOptions.length > 0 && (
          <Wrap>
            {selectedOptions.map((option) => (
              <WrapItem key={option.value}>
                <Box
                  as="span"
                  display="inline-flex"
                  alignItems="center"
                  gap="2"
                  px="3"
                  py="1"
                  bg="info.100"
                  color="info.800"
                  borderRadius="full"
                  fontSize="sm"
                >
                  <Typography color="mukuru.text.primary">{option.label}</Typography>
                  <CloseButton size="sm" onClick={() => handleRemove(option.value)} />
                </Box>
              </WrapItem>
            ))}
          </Wrap>
        )}

        {/* Dropdown */}
        <Box position="relative">
          <Button
            variant="ghost"
            width="full"
            justifyContent="space-between"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
          >
            <HStack width="full" justifyContent="space-between">
              <Typography
                color={
                  selectedOptions.length === 0
                    ? 'mukuru.grey.medium'
                    : 'mukuru.text.primary'
                }
              >
                {selectedOptions.length === 0
                  ? placeholder
                  : `${selectedOptions.length} selected`}
              </Typography>
              <Icon as={FiChevronDown} />
            </HStack>
          </Button>
          {isOpen && (
            <Box
              maxHeight="300px"
              overflowY="auto"
              position="absolute"
              mt="2"
              bg="white"
              border="1px"
              borderColor="mukuru.grey.light"
              borderRadius="md"
              boxShadow="md"
              zIndex={10}
              width="full"
            >
              <VStack align="stretch" gap="0">
                {/* Search */}
                {searchable && (
                  <Box p="2" borderBottom="1px" borderColor="border.default">
                    <Input
                      placeholder="Search options..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Box>
                )}

                {/* Options */}
                {filteredOptions.map((option) => (
                  <Box
                    key={option.value}
                    as="button"
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    style={{
                      cursor: option.disabled ? 'not-allowed' : 'pointer',
                      opacity: option.disabled ? 0.5 : 1,
                    }}
                    textAlign="left"
                    bg={value.includes(option.value) ? 'info.50' : undefined}
                  >
                    <HStack
                      width="full"
                      justify="space-between"
                      p="2"
                      _hover={{ bg: 'mukuru.background.light' }}
                    >
                      <Typography color="mukuru.text.primary">{option.label}</Typography>
                      {value.includes(option.value) && (
                        <Icon as={FiCheck} color="mukuru.buttons.primary" />
                      )}
                    </HStack>
                  </Box>
                ))}

                {/* Create New Option */}
                {creatable && newOption.trim() && (
                  <Box>
                    <Box height="1px" bg="mukuru.grey.light" />
                    <Box as="button" onClick={handleCreate} width="full">
                      <HStack p="2" _hover={{ bg: 'gray.50' }}>
                        <Icon as={FiPlus} />
                        <Typography color="mukuru.text.primary">
                          Create &quot;{newOption}&quot;
                        </Typography>
                      </HStack>
                    </Box>
                  </Box>
                )}

                {/* New Option Input */}
                {creatable && (
                  <Box p="2" borderTop="1px" borderColor="border.default">
                    <HStack>
                      <Input
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
                        onClick={handleCreate}
                        disabled={!newOption.trim()}
                        aria-label="Add option"
                      >
                        <Icon as={FiPlus} />
                      </IconButton>
                    </HStack>
                  </Box>
                )}
              </VStack>
            </Box>
          )}
        </Box>
      </VStack>

      {error && (
        <Typography fontSize="sm" color="error.500" mt="1">
          {error}
        </Typography>
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
  height = '20px',
  width = '100%',
  borderRadius = '4px',
  lines = 1,
  spacing = '8px',
}: LoadingSkeletonProps) {
  return (
    <VStack align="stretch" gap={spacing}>
      {Array.from({ length: lines }, (_, index) => (
        <MotionBox
          key={index}
          height={height}
          width={width}
          borderRadius={borderRadius}
          bg="mukuru.grey.light"
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
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
  _onClose: (id: string) => void;
}

export function Toast({
  id,
  title,
  description,
  status,
  duration = 5000,
  _onClose: onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <FiCheckCircle />;
      case 'error':
        return <FiXCircle />;
      case 'warning':
        return <FiAlertTriangle />;
      case 'info':
        return <FiInfo />;
      default:
        return <FiInfo />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'warning':
        return 'orange';
      case 'info':
        return 'blue';
      default:
        return 'blue';
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
      borderColor="border.default"
      borderRadius="md"
      boxShadow="lg"
      maxWidth="400px"
      minWidth="300px"
    >
      <HStack align="start" gap="3">
        <Box
          color={`${getStatusColor()}.500`}
          boxSize="5"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
        >
          {getStatusIcon()}
        </Box>
        <VStack align="start" gap="1" flex="1">
          <Typography fontWeight="semibold" fontSize="sm">
            {title}
          </Typography>
          {description && (
            <Typography fontSize="sm" color="mukuru.text.primary">
              {description}
            </Typography>
          )}
        </VStack>
        <IconButton
          size="sm"
          variant="ghost"
          onClick={() => onClose(id)}
          aria-label="Close notification"
        >
          <Icon as={FiX} />
        </IconButton>
      </HStack>
    </MotionBox>
  );
}

// Toast Container
interface ToastContainerProps {
  toasts: ToastProps[];
  _onClose: (id: string) => void;
}

export function ToastContainer({ toasts, _onClose: onClose }: ToastContainerProps) {
  return (
    <Box position="fixed" top="4" right="4" zIndex="9999" maxWidth="400px">
      <VStack align="stretch" gap="2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} _onClose={onClose} />
          ))}
        </AnimatePresence>
      </VStack>
    </Box>
  );
}
