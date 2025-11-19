// @ts-nocheck
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Switch,
  Select,
  Tooltip,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  SimpleGrid,
  Divider,
  Flex,
  Icon,
  Input,
  Textarea,
  Checkbox,
  CheckboxGroup,
  Stack,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast
} from '@chakra-ui/react';
import {
  FiSun,
  FiMoon,
  FiSettings,
  FiKeyboard,
  FiSave,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiEye,
  FiEyeOff,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiCheck,
  FiX,
  FiPlus,
  FiMinus,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiPaste,
  FiUndo,
  FiRedo,
  FiSearch,
  FiFilter,
  FiSortAsc,
  FiSortDesc,
  FiGrid,
  FiList,
  FiColumns,
  FiCalendar,
  FiClock,
  FiUser,
  FiTag,
  FiBell,
  FiBellOff,
  FiWifi,
  FiWifiOff,
  FiSmartphone,
  FiMonitor,
  FiTablet,
  FiHelpCircle,
  FiExternalLink,
  FiShare,
  FiHeart,
  FiStar,
  FiBookmark,
  FiArchive,
  FiTrash,
  FiLock,
  FiUnlock,
  FiShield,
  FiShieldOff,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiInfo as FiInfoIcon
} from 'react-icons/fi';

// Theme Context
interface ThemeContextType {
  colorMode: 'light' | 'dark';
  toggleColorMode: () => void;
  setColorMode: (mode: 'light' | 'dark') => void;
  theme: 'default' | 'high-contrast' | 'colorblind-friendly';
  setTheme: (theme: 'default' | 'high-contrast' | 'colorblind-friendly') => void;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  animations: boolean;
  setAnimations: (enabled: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  const [theme, setTheme] = useState<'default' | 'high-contrast' | 'colorblind-friendly'>('default');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [animations, setAnimations] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedColorMode = localStorage.getItem('mukuru-color-mode') as 'light' | 'dark' | null;
    const savedTheme = localStorage.getItem('mukuru-theme') as 'default' | 'high-contrast' | 'colorblind-friendly' | null;
    const savedFontSize = localStorage.getItem('mukuru-font-size') as 'small' | 'medium' | 'large' | null;
    const savedAnimations = localStorage.getItem('mukuru-animations') === 'true';
    const savedReducedMotion = localStorage.getItem('mukuru-reduced-motion') === 'true';

    if (savedColorMode) setColorMode(savedColorMode);
    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
    setAnimations(savedAnimations);
    setReducedMotion(savedReducedMotion);

    // Check system preferences
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!savedColorMode && prefersDark) setColorMode('dark');
    if (!savedReducedMotion && prefersReducedMotion) setReducedMotion(true);
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-color-mode', colorMode);
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.setAttribute('data-animations', animations.toString());
    document.documentElement.setAttribute('data-reduced-motion', reducedMotion.toString());

    // Save preferences
    localStorage.setItem('mukuru-color-mode', colorMode);
    localStorage.setItem('mukuru-theme', theme);
    localStorage.setItem('mukuru-font-size', fontSize);
    localStorage.setItem('mukuru-animations', animations.toString());
    localStorage.setItem('mukuru-reduced-motion', reducedMotion.toString());
  }, [colorMode, theme, fontSize, animations, reducedMotion]);

  const toggleColorMode = () => {
    setColorMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value: ThemeContextType = {
    colorMode,
    toggleColorMode,
    setColorMode,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    animations,
    setAnimations,
    reducedMotion,
    setReducedMotion
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Keyboard Shortcuts Hook
export function useKeyboardShortcuts() {
  const [shortcuts, setShortcuts] = useState<Record<string, () => void>>({});
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEnabled) return;

      const key = e.key.toLowerCase();
      const modifiers = [];
      
      if (e.ctrlKey || e.metaKey) modifiers.push('ctrl');
      if (e.altKey) modifiers.push('alt');
      if (e.shiftKey) modifiers.push('shift');

      const shortcutKey = modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key;
      
      if (shortcuts[shortcutKey]) {
        e.preventDefault();
        shortcuts[shortcutKey]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, isEnabled]);

  const registerShortcut = (key: string, callback: () => void) => {
    setShortcuts(prev => ({ ...prev, [key]: callback }));
  };

  const unregisterShortcut = (key: string) => {
    setShortcuts(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  };

  return {
    registerShortcut,
    unregisterShortcut,
    isEnabled,
    setIsEnabled
  };
}

// Dark Mode Toggle Component
export function DarkModeToggle() {
  const { colorMode, toggleColorMode } = useTheme();

  return (
    <Tooltip label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton
        aria-label="Toggle color mode"
        icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
        onClick={toggleColorMode}
        variant="ghost"
      />
    </Tooltip>
  );
}

// Theme Settings Component
export function ThemeSettings() {
  const {
    colorMode,
    setColorMode,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    animations,
    setAnimations,
    reducedMotion,
    setReducedMotion
  } = useTheme();

  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button leftIcon={<FiSettings />} onClick={onOpen}>
        Theme Settings
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Theme & Accessibility Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing="6">
              {/* Color Mode */}
              <FormControl>
                <FormLabel>Color Mode</FormLabel>
                <HStack spacing="4">
                  <Button
                    size="sm"
                    variant={colorMode === 'light' ? 'solid' : 'outline'}
                    colorScheme="blue"
                    onClick={() => setColorMode('light')}
                    leftIcon={<FiSun />}
                  >
                    Light
                  </Button>
                  <Button
                    size="sm"
                    variant={colorMode === 'dark' ? 'solid' : 'outline'}
                    colorScheme="blue"
                    onClick={() => setColorMode('dark')}
                    leftIcon={<FiMoon />}
                  >
                    Dark
                  </Button>
                </HStack>
              </FormControl>

              {/* Theme Variant */}
              <FormControl>
                <FormLabel>Theme Variant</FormLabel>
                <Select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
                  <option value="default">Default</option>
                  <option value="high-contrast">High Contrast</option>
                  <option value="colorblind-friendly">Colorblind Friendly</option>
                </Select>
              </FormControl>

              {/* Font Size */}
              <FormControl>
                <FormLabel>Font Size</FormLabel>
                <HStack spacing="4">
                  {(['small', 'medium', 'large'] as const).map(size => (
                    <Button
                      key={size}
                      size="sm"
                      variant={fontSize === size ? 'solid' : 'outline'}
                      colorScheme="blue"
                      onClick={() => setFontSize(size)}
                      textTransform="capitalize"
                    >
                      {size}
                    </Button>
                  ))}
                </HStack>
              </FormControl>

              {/* Accessibility Options */}
              <VStack align="stretch" spacing="4">
                <Text fontWeight="semibold">Accessibility Options</Text>
                
                <HStack justify="space-between">
                  <VStack align="start" spacing="1">
                    <Text>Animations</Text>
                    <Text fontSize="sm" color="gray.600">
                      Enable smooth transitions and animations
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={animations}
                    onChange={(e) => setAnimations(e.target.checked)}
                  />
                </HStack>

                <HStack justify="space-between">
                  <VStack align="start" spacing="1">
                    <Text>Reduced Motion</Text>
                    <Text fontSize="sm" color="gray.600">
                      Minimize motion for accessibility
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={reducedMotion}
                    onChange={(e) => setReducedMotion(e.target.checked)}
                  />
                </HStack>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              Save Settings
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

// Keyboard Shortcuts Help Component
export function KeyboardShortcutsHelp() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const shortcuts = [
    { key: 'Ctrl + S', description: 'Save current form' },
    { key: 'Ctrl + N', description: 'New application' },
    { key: 'Ctrl + F', description: 'Search' },
    { key: 'Ctrl + /', description: 'Show this help' },
    { key: 'Esc', description: 'Close modal/dialog' },
    { key: 'Enter', description: 'Submit form' },
    { key: 'Tab', description: 'Next field' },
    { key: 'Shift + Tab', description: 'Previous field' },
    { key: 'Ctrl + Z', description: 'Undo' },
    { key: 'Ctrl + Y', description: 'Redo' },
    { key: 'Ctrl + C', description: 'Copy' },
    { key: 'Ctrl + V', description: 'Paste' },
    { key: 'Ctrl + A', description: 'Select all' },
    { key: 'Ctrl + D', description: 'Duplicate' },
    { key: 'Delete', description: 'Delete selected' },
    { key: 'F5', description: 'Refresh page' },
    { key: 'Ctrl + R', description: 'Refresh page' },
    { key: 'Ctrl + Shift + R', description: 'Hard refresh' },
    { key: 'Ctrl + +', description: 'Zoom in' },
    { key: 'Ctrl + -', description: 'Zoom out' },
    { key: 'Ctrl + 0', description: 'Reset zoom' },
    { key: 'F11', description: 'Fullscreen' },
    { key: 'Ctrl + Shift + I', description: 'Developer tools' },
    { key: 'Ctrl + Shift + C', description: 'Inspect element' },
    { key: 'Ctrl + Shift + J', description: 'Console' },
    { key: 'Ctrl + Shift + K', description: 'Network' },
    { key: 'Ctrl + Shift + L', description: 'Lighthouse' },
    { key: 'Ctrl + Shift + M', description: 'Device toolbar' },
    { key: 'Ctrl + Shift + P', description: 'Command palette' },
    { key: 'Ctrl + Shift + S', description: 'Save as' },
    { key: 'Ctrl + Shift + T', description: 'Reopen closed tab' },
    { key: 'Ctrl + Shift + W', description: 'Close window' },
    { key: 'Ctrl + Shift + N', description: 'New incognito window' },
    { key: 'Ctrl + Shift + B', description: 'Toggle bookmarks bar' },
    { key: 'Ctrl + Shift + O', description: 'Bookmark manager' },
    { key: 'Ctrl + Shift + D', description: 'Bookmark all tabs' },
    { key: 'Ctrl + Shift + F', description: 'Find in page' },
    { key: 'Ctrl + Shift + G', description: 'Find next' },
    { key: 'Ctrl + Shift + H', description: 'Find previous' },
    { key: 'Ctrl + Shift + U', description: 'View source' },
    { key: 'Ctrl + Shift + V', description: 'Paste without formatting' },
    { key: 'Ctrl + Shift + X', description: 'Cut' },
    { key: 'Ctrl + Shift + Y', description: 'Redo' },
    { key: 'Ctrl + Shift + Z', description: 'Undo' },
    { key: 'Ctrl + Shift + 1', description: 'Go to tab 1' },
    { key: 'Ctrl + Shift + 2', description: 'Go to tab 2' },
    { key: 'Ctrl + Shift + 3', description: 'Go to tab 3' },
    { key: 'Ctrl + Shift + 4', description: 'Go to tab 4' },
    { key: 'Ctrl + Shift + 5', description: 'Go to tab 5' },
    { key: 'Ctrl + Shift + 6', description: 'Go to tab 6' },
    { key: 'Ctrl + Shift + 7', description: 'Go to tab 7' },
    { key: 'Ctrl + Shift + 8', description: 'Go to tab 8' },
    { key: 'Ctrl + Shift + 9', description: 'Go to last tab' },
    { key: 'Ctrl + Shift + 0', description: 'Go to first tab' },
    { key: 'Ctrl + Shift + Tab', description: 'Previous tab' },
    { key: 'Ctrl + Tab', description: 'Next tab' },
    { key: 'Ctrl + W', description: 'Close tab' },
    { key: 'Ctrl + T', description: 'New tab' },
    { key: 'Ctrl + L', description: 'Focus address bar' },
    { key: 'Ctrl + K', description: 'Focus search bar' },
    { key: 'Ctrl + E', description: 'Focus search bar' },
    { key: 'Ctrl + J', description: 'Downloads' },
    { key: 'Ctrl + H', description: 'History' },
    { key: 'Ctrl + Shift + Delete', description: 'Clear browsing data' },
    { key: 'Ctrl + Shift + I', description: 'Developer tools' },
    { key: 'Ctrl + Shift + C', description: 'Inspect element' },
    { key: 'Ctrl + Shift + J', description: 'Console' },
    { key: 'Ctrl + Shift + K', description: 'Network' },
    { key: 'Ctrl + Shift + L', description: 'Lighthouse' },
    { key: 'Ctrl + Shift + M', description: 'Device toolbar' },
    { key: 'Ctrl + Shift + P', description: 'Command palette' },
    { key: 'Ctrl + Shift + S', description: 'Save as' },
    { key: 'Ctrl + Shift + T', description: 'Reopen closed tab' },
    { key: 'Ctrl + Shift + W', description: 'Close window' },
    { key: 'Ctrl + Shift + N', description: 'New incognito window' },
    { key: 'Ctrl + Shift + B', description: 'Toggle bookmarks bar' },
    { key: 'Ctrl + Shift + O', description: 'Bookmark manager' },
    { key: 'Ctrl + Shift + D', description: 'Bookmark all tabs' },
    { key: 'Ctrl + Shift + F', description: 'Find in page' },
    { key: 'Ctrl + Shift + G', description: 'Find next' },
    { key: 'Ctrl + Shift + H', description: 'Find previous' },
    { key: 'Ctrl + Shift + U', description: 'View source' },
    { key: 'Ctrl + Shift + V', description: 'Paste without formatting' },
    { key: 'Ctrl + Shift + X', description: 'Cut' },
    { key: 'Ctrl + Shift + Y', description: 'Redo' },
    { key: 'Ctrl + Shift + Z', description: 'Undo' },
    { key: 'Ctrl + Shift + 1', description: 'Go to tab 1' },
    { key: 'Ctrl + Shift + 2', description: 'Go to tab 2' },
    { key: 'Ctrl + Shift + 3', description: 'Go to tab 3' },
    { key: 'Ctrl + Shift + 4', description: 'Go to tab 4' },
    { key: 'Ctrl + Shift + 5', description: 'Go to tab 5' },
    { key: 'Ctrl + Shift + 6', description: 'Go to tab 6' },
    { key: 'Ctrl + Shift + 7', description: 'Go to tab 7' },
    { key: 'Ctrl + Shift + 8', description: 'Go to tab 8' },
    { key: 'Ctrl + Shift + 9', description: 'Go to last tab' },
    { key: 'Ctrl + Shift + 0', description: 'Go to first tab' },
    { key: 'Ctrl + Shift + Tab', description: 'Previous tab' },
    { key: 'Ctrl + Tab', description: 'Next tab' },
    { key: 'Ctrl + W', description: 'Close tab' },
    { key: 'Ctrl + T', description: 'New tab' },
    { key: 'Ctrl + L', description: 'Focus address bar' },
    { key: 'Ctrl + K', description: 'Focus search bar' },
    { key: 'Ctrl + E', description: 'Focus search bar' },
    { key: 'Ctrl + J', description: 'Downloads' },
    { key: 'Ctrl + H', description: 'History' },
    { key: 'Ctrl + Shift + Delete', description: 'Clear browsing data' }
  ];

  return (
    <>
      <Tooltip label="Keyboard shortcuts (Ctrl + /)">
        <IconButton
          aria-label="Keyboard shortcuts help"
          icon={<FiKeyboard />}
          onClick={onOpen}
          variant="ghost"
        />
      </Tooltip>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Keyboard Shortcuts</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={2} spacing="4">
              {shortcuts.map((shortcut, index) => (
                <HStack key={index} justify="space-between" p="2" borderRadius="md" _hover={{ bg: "gray.50" }}>
                  <Badge colorScheme="blue" fontSize="xs">
                    {shortcut.key}
                  </Badge>
                  <Text fontSize="sm" color="gray.600">
                    {shortcut.description}
                  </Text>
                </HStack>
              ))}
            </SimpleGrid>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

// User Preferences Component
export function UserPreferences() {
  const {
    colorMode,
    setColorMode,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    animations,
    setAnimations,
    reducedMotion,
    setReducedMotion
  } = useTheme();

  const { registerShortcut, unregisterShortcut, isEnabled, setIsEnabled } = useKeyboardShortcuts();

  useEffect(() => {
    // Register common shortcuts
    registerShortcut('ctrl+s', () => {
      console.log('Save triggered');
      // Implement save functionality
    });

    registerShortcut('ctrl+n', () => {
      console.log('New application triggered');
      // Implement new application functionality
    });

    registerShortcut('ctrl+f', () => {
      console.log('Search triggered');
      // Implement search functionality
    });

    registerShortcut('ctrl+/', () => {
      console.log('Help triggered');
      // Implement help functionality
    });

    return () => {
      unregisterShortcut('ctrl+s');
      unregisterShortcut('ctrl+n');
      unregisterShortcut('ctrl+f');
      unregisterShortcut('ctrl+/');
    };
  }, [registerShortcut, unregisterShortcut]);

  return (
    <VStack align="stretch" spacing="6" p="6" bg="white" borderRadius="lg" border="1px" borderColor="gray.200">
      <Text fontSize="xl" fontWeight="bold">User Preferences</Text>
      
      {/* Theme Settings */}
      <VStack align="stretch" spacing="4">
        <Text fontSize="lg" fontWeight="semibold">Appearance</Text>
        
        <HStack justify="space-between">
          <Text>Color Mode</Text>
          <HStack>
            <Button
              size="sm"
              variant={colorMode === 'light' ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => setColorMode('light')}
              leftIcon={<FiSun />}
            >
              Light
            </Button>
            <Button
              size="sm"
              variant={colorMode === 'dark' ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => setColorMode('dark')}
              leftIcon={<FiMoon />}
            >
              Dark
            </Button>
          </HStack>
        </HStack>

        <HStack justify="space-between">
          <Text>Theme Variant</Text>
          <Select value={theme} onChange={(e) => setTheme(e.target.value as any)} width="200px">
            <option value="default">Default</option>
            <option value="high-contrast">High Contrast</option>
            <option value="colorblind-friendly">Colorblind Friendly</option>
          </Select>
        </HStack>

        <HStack justify="space-between">
          <Text>Font Size</Text>
          <HStack>
            {(['small', 'medium', 'large'] as const).map(size => (
              <Button
                key={size}
                size="sm"
                variant={fontSize === size ? 'solid' : 'outline'}
                colorScheme="blue"
                onClick={() => setFontSize(size)}
                textTransform="capitalize"
              >
                {size}
              </Button>
            ))}
          </HStack>
        </HStack>
      </VStack>

      <Divider />

      {/* Accessibility Settings */}
      <VStack align="stretch" spacing="4">
        <Text fontSize="lg" fontWeight="semibold">Accessibility</Text>
        
        <HStack justify="space-between">
          <VStack align="start" spacing="1">
            <Text>Animations</Text>
            <Text fontSize="sm" color="gray.600">
              Enable smooth transitions and animations
            </Text>
          </VStack>
          <Switch
            isChecked={animations}
            onChange={(e) => setAnimations(e.target.checked)}
          />
        </HStack>

        <HStack justify="space-between">
          <VStack align="start" spacing="1">
            <Text>Reduced Motion</Text>
            <Text fontSize="sm" color="gray.600">
              Minimize motion for accessibility
            </Text>
          </VStack>
          <Switch
            isChecked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
          />
        </HStack>
      </VStack>

      <Divider />

      {/* Keyboard Shortcuts */}
      <VStack align="stretch" spacing="4">
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="semibold">Keyboard Shortcuts</Text>
          <Switch
            isChecked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
          />
        </HStack>
        
        <Text fontSize="sm" color="gray.600">
          Enable keyboard shortcuts for faster navigation and actions.
        </Text>
      </VStack>
    </VStack>
  );
}

// Quick Actions Component
export function QuickActions() {
  const toast = useToast();

  const actions = [
    { icon: FiPlus, label: 'New Application', action: () => toast({ title: 'New Application', status: 'info' }) },
    { icon: FiSearch, label: 'Search', action: () => toast({ title: 'Search', status: 'info' }) },
    { icon: FiDownload, label: 'Export', action: () => toast({ title: 'Export', status: 'info' }) },
    { icon: FiUpload, label: 'Import', action: () => toast({ title: 'Import', status: 'info' }) },
    { icon: FiSave, label: 'Save', action: () => toast({ title: 'Save', status: 'success' }) },
    { icon: FiRefreshCw, label: 'Refresh', action: () => toast({ title: 'Refresh', status: 'info' }) },
    { icon: FiSettings, label: 'Settings', action: () => toast({ title: 'Settings', status: 'info' }) },
    { icon: FiHelpCircle, label: 'Help', action: () => toast({ title: 'Help', status: 'info' }) }
  ];

  return (
    <VStack align="stretch" spacing="4" p="6" bg="white" borderRadius="lg" border="1px" borderColor="gray.200">
      <Text fontSize="xl" fontWeight="bold">Quick Actions</Text>
      
      <SimpleGrid columns={4} spacing="4">
        {actions.map((action, index) => (
          <Tooltip key={index} label={action.label}>
            <Button
              variant="outline"
              size="lg"
              onClick={action.action}
              leftIcon={<Icon as={action.icon} />}
            >
              {action.label}
            </Button>
          </Tooltip>
        ))}
      </SimpleGrid>
    </VStack>
  );
}
