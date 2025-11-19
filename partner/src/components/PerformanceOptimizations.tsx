// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Spinner,
  Flex,
  Icon,
  Button,
  Input,
  Select,
  Checkbox,
  Badge,
  Tooltip,
  useDisclosure,
  Textarea,
  Progress,
  Alert,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton
} from '@chakra-ui/react';
import {
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiFilter,
  FiSortAsc,
  FiSortDesc,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiEye,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiPlus,
  FiMinus,
  FiArrowUp,
  FiArrowDown,
  FiMoreVertical,
  FiGrid,
  FiList,
  FiColumns,
  FiCalendar,
  FiClock,
  FiUser,
  FiTag,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiSettings,
  FiSave,
  FiXCircle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

// Virtual Scrolling Component
interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  overscan = 5,
  onScroll
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    return { start: Math.max(0, start - overscan), end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  return (
    <Box
      ref={scrollElementRef}
      height={containerHeight}
      overflowY="auto"
      onScroll={handleScroll}
    >
      <Box height={totalHeight} position="relative">
        <Box
          position="absolute"
          top={offsetY}
          width="100%"
        >
          {visibleItems.map((item, index) => (
            <Box
              key={keyExtractor(item, visibleRange.start + index)}
              height={itemHeight}
            >
              {renderItem(item, visibleRange.start + index)}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// Lazy Loading Component
interface LazyLoadProps {
  children: React.ReactNode;
  height?: string;
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export function LazyLoad({
  children,
  height = "200px",
  placeholder,
  threshold = 0.1,
  rootMargin = "50px"
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoaded) {
          setIsVisible(true);
          setIsLoaded(true);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold, rootMargin, isLoaded]);

  return (
    <Box
      ref={elementRef}
      height={height}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', height: '100%' }}
        >
          {children}
        </motion.div>
      ) : (
        placeholder || (
          <VStack spacing="4">
            <Spinner size="lg" color="blue.500" />
            <Text color="gray.500" fontSize="sm">Loading...</Text>
          </VStack>
        )
      )}
    </Box>
  );
}

// Image Lazy Loading Component
interface LazyImageProps {
  src: string;
  alt: string;
  width?: string;
  height?: string;
  placeholder?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  width = "100%",
  height = "200px",
  placeholder,
  fallback,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <Box
      ref={imgRef}
      width={width}
      height={height}
      position="relative"
      overflow="hidden"
      borderRadius="md"
      bg="gray.100"
    >
      {isInView && (
        <>
          {!isLoaded && !hasError && (
            <Box
              position="absolute"
              top="0"
              left="0"
              width="100%"
              height="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="gray.100"
            >
              {placeholder ? (
                <img
                  src={placeholder}
                  alt="Loading..."
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Spinner size="lg" color="blue.500" />
              )}
            </Box>
          )}
          
          <img
            src={hasError ? fallback : src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
          />
        </>
      )}
    </Box>
  );
}

// Memoized Table Component
interface TableColumn<T> {
  key: keyof T;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, item: T, index: number) => React.ReactNode;
}

interface MemoizedTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  sortKey?: keyof T;
  sortDirection?: 'asc' | 'desc';
  rowHeight?: number;
  virtualScrolling?: boolean;
  onRowClick?: (item: T, index: number) => void;
  selectedRows?: string[];
  onRowSelect?: (item: T, selected: boolean) => void;
  selectable?: boolean;
}

export function MemoizedTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available",
  onSort,
  sortKey,
  sortDirection,
  rowHeight = 50,
  virtualScrolling = false,
  onRowClick,
  selectedRows = [],
  onRowSelect,
  selectable = false
}: MemoizedTableProps<T>) {
  const [internalSortKey, setInternalSortKey] = useState<keyof T | undefined>(sortKey);
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof T) => {
    const newDirection = internalSortKey === key && internalSortDirection === 'asc' ? 'desc' : 'asc';
    setInternalSortKey(key);
    setInternalSortDirection(newDirection);
    onSort?.(key, newDirection);
  };

  const sortedData = useMemo(() => {
    if (!internalSortKey) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[internalSortKey];
      const bVal = b[internalSortKey];
      
      if (aVal < bVal) return internalSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return internalSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, internalSortKey, internalSortDirection]);

  const renderRow = useCallback((item: T, index: number) => (
    <Flex
      key={item.id}
      height={rowHeight}
      align="center"
      px="4"
      borderBottom="1px"
      borderColor="gray.200"
      _hover={{ bg: "gray.50" }}
      cursor={onRowClick ? "pointer" : "default"}
      onClick={() => onRowClick?.(item, index)}
      bg={selectedRows.includes(item.id) ? "blue.50" : "transparent"}
    >
      {selectable && (
        <Checkbox
          isChecked={selectedRows.includes(item.id)}
          onChange={(e) => onRowSelect?.(item, e.target.checked)}
          mr="3"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      
      {columns.map((column) => (
        <Box
          key={String(column.key)}
          flex="1"
          minWidth="0"
          pr="4"
          width={column.width}
        >
          {column.render ? 
            column.render(item[column.key], item, index) : 
            <Text fontSize="sm" noOfLines={1}>
              {String(item[column.key] || '')}
            </Text>
          }
        </Box>
      ))}
    </Flex>
  ), [columns, rowHeight, onRowClick, selectedRows, onRowSelect, selectable]);

  if (loading) {
    return (
      <VStack spacing="4" py="8">
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.500">Loading data...</Text>
      </VStack>
    );
  }

  if (data.length === 0) {
    return (
      <VStack spacing="4" py="8">
        <Icon as={FiInfo} boxSize="8" color="gray.400" />
        <Text color="gray.500">{emptyMessage}</Text>
      </VStack>
    );
  }

  return (
    <Box border="1px" borderColor="gray.200" borderRadius="md" overflow="hidden">
      {/* Header */}
      <Flex
        bg="gray.50"
        px="4"
        py="3"
        borderBottom="1px"
        borderColor="gray.200"
        fontWeight="semibold"
        fontSize="sm"
        color="gray.700"
      >
        {selectable && <Box width="40px" />}
        
        {columns.map((column) => (
          <Box
            key={String(column.key)}
            flex="1"
            minWidth="0"
            pr="4"
            width={column.width}
            cursor={column.sortable ? "pointer" : "default"}
            onClick={() => column.sortable && handleSort(column.key)}
            _hover={column.sortable ? { color: "blue.500" } : {}}
          >
            <HStack spacing="1">
              <Text>{column.label}</Text>
              {column.sortable && (
                <Icon
                  as={
                    internalSortKey === column.key
                      ? internalSortDirection === 'asc'
                        ? FiSortAsc
                        : FiSortDesc
                      : FiChevronDown
                  }
                  boxSize="3"
                  color={internalSortKey === column.key ? "blue.500" : "gray.400"}
                />
              )}
            </HStack>
          </Box>
        ))}
      </Flex>

      {/* Body */}
      {virtualScrolling ? (
        <VirtualScroll
          items={sortedData}
          itemHeight={rowHeight}
          containerHeight={Math.min(data.length * rowHeight, 400)}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <Box maxHeight="400px" overflowY="auto">
          {sortedData.map((item, index) => renderRow(item, index))}
        </Box>
      )}
    </Box>
  );
}

// Debounced Search Component
interface DebouncedSearchProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  delay?: number;
  minLength?: number;
  loading?: boolean;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
}

export function DebouncedSearch({
  placeholder = "Search...",
  onSearch,
  delay = 300,
  minLength = 2,
  loading = false,
  suggestions = [],
  onSuggestionSelect
}: DebouncedSearchProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.length >= minLength) {
      timeoutRef.current = setTimeout(() => {
        onSearch(query);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, delay, minLength, onSearch]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSuggestionSelect?.(suggestion);
  };

  return (
    <Box position="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        rightElement={
          loading ? (
            <Spinner size="sm" color="blue.500" />
          ) : (
            <Icon as={FiSearch} color="gray.400" />
          )
        }
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <Box
          position="absolute"
          top="100%"
          left="0"
          right="0"
          bg="white"
          border="1px"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="lg"
          zIndex="1000"
          maxHeight="200px"
          overflowY="auto"
        >
          {suggestions.map((suggestion, index) => (
            <Box
              key={index}
              px="3"
              py="2"
              cursor="pointer"
              _hover={{ bg: "gray.50" }}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <Text fontSize="sm">{suggestion}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// Performance Monitor Component
interface PerformanceMonitorProps {
  onPerformanceData?: (data: PerformanceData) => void;
  interval?: number;
}

interface PerformanceData {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  componentCount: number;
}

export function PerformanceMonitor({
  onPerformanceData,
  interval = 1000
}: PerformanceMonitorProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    componentCount: 0
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measurePerformance = () => {
      const currentTime = performance.now();
      frameCount++;

      if (currentTime - lastTime >= interval) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        const memoryUsage = (performance as any).memory ? 
          (performance as any).memory.usedJSHeapSize / 1024 / 1024 : 0;

        const renderTime = performance.now() - currentTime;
        const componentCount = document.querySelectorAll('[data-component]').length;

        const data: PerformanceData = {
          fps,
          memoryUsage,
          renderTime,
          componentCount
        };

        setPerformanceData(data);
        onPerformanceData?.(data);

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measurePerformance);
    };

    animationId = requestAnimationFrame(measurePerformance);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [interval, onPerformanceData]);

  return (
    <Box
      position="fixed"
      bottom="4"
      left="4"
      bg="black"
      color="white"
      p="2"
      borderRadius="md"
      fontSize="xs"
      fontFamily="mono"
      zIndex="9999"
    >
      <VStack spacing="1" align="start">
        <Text>FPS: {performanceData.fps}</Text>
        <Text>Memory: {performanceData.memoryUsage.toFixed(1)}MB</Text>
        <Text>Render: {performanceData.renderTime.toFixed(2)}ms</Text>
        <Text>Components: {performanceData.componentCount}</Text>
      </VStack>
    </Box>
  );
}

// Bundle Size Optimizer Hook
export function useBundleOptimization() {
  const [isOptimized, setIsOptimized] = useState(false);
  const [optimizationTips, setOptimizationTips] = useState<string[]>([]);

  useEffect(() => {
    // Check for common optimization opportunities
    const tips: string[] = [];

    // Check for unused imports
    if (typeof window !== 'undefined') {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      
      if (scripts.length > 10) {
        tips.push('Consider code splitting to reduce initial bundle size');
      }
      
      if (stylesheets.length > 5) {
        tips.push('Consider consolidating CSS files');
      }
    }

    // Check for large images
    const images = Array.from(document.querySelectorAll('img'));
    const largeImages = images.filter(img => {
      const rect = img.getBoundingClientRect();
      return rect.width > 1000 || rect.height > 1000;
    });

    if (largeImages.length > 0) {
      tips.push('Consider optimizing large images for web');
    }

    setOptimizationTips(tips);
    setIsOptimized(tips.length === 0);
  }, []);

  return {
    isOptimized,
    optimizationTips,
    optimizeBundle: () => {
      // Implement bundle optimization logic
      console.log('Bundle optimization triggered');
    }
  };
}
