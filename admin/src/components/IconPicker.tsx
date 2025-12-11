'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Input,
} from '@chakra-ui/react';
// Import components directly from Mukuru package
import { Typography, Button } from '@mukuru/mukuru-react-components';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;
import * as FiIcons from 'react-icons/fi';
import { IconType } from 'react-icons';
import { FiX } from 'react-icons/fi';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

// Get all Feather icons from react-icons/fi
const allIcons = Object.entries(FiIcons).filter(
  ([name]) => name.startsWith('Fi') && name !== 'FiIconContext'
) as [string, IconType][];

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('orange.50', 'orange.900');
  const selectedBorder = useColorModeValue('orange.500', 'orange.400');

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    if (!searchQuery) return allIcons;
    const query = searchQuery.toLowerCase();
    return allIcons.filter(([name]) => name.toLowerCase().includes(query));
  }, [searchQuery]);

  const handleSelectIcon = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Get the selected icon component
  const SelectedIcon = value && (FiIcons[value as keyof typeof FiIcons] as IconType);

  return (
    <>
      {/* Icon Display Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          padding: '1rem',
          border: `1px solid ${borderColor}`,
          borderRadius: '0.5rem',
          background: bgColor,
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.2s',
        }}
      >
        <HStack justify="space-between">
          <HStack gap="3">
            {SelectedIcon ? (
              <>
                <Box color="orange.500" fontSize="2xl">
                  <SelectedIcon />
                </Box>
                <Typography fontSize="sm" fontWeight="medium">
                  {value}
                </Typography>
              </>
            ) : (
              <Typography fontSize="sm" color="gray.500">
                Click to select an icon
              </Typography>
            )}
          </HStack>
          <Typography fontSize="xs" color="gray.500">
            {filteredIcons.length} icons available
          </Typography>
        </HStack>
      </button>

      {/* Icon Picker Modal */}
      {isOpen && (
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
          onClick={() => setIsOpen(false)}
        >
          <Box
            bg="white"
            borderRadius="xl"
            maxW="800px"
            w="90%"
            maxH="80vh"
            overflow="hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <HStack justify="space-between" p="6" borderBottom="1px" borderColor="gray.200">
              <Typography fontSize="xl" fontWeight="bold">
                Select an Icon
              </Typography>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'transparent',
                }}
              >
                <FiX size={20} />
              </button>
            </HStack>

            {/* Body */}
            <VStack align="stretch" gap="4" p="6">
              {/* Search Input */}
              <Input
                placeholder="Search icons... (e.g., home, user, file)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="md"
                borderRadius="lg"
              />

              {/* Icon Grid */}
              <Box maxH="400px" overflowY="auto" pr="2">
                {filteredIcons.length > 0 ? (
                  <SimpleGrid columns={6} gap="2">
                    {filteredIcons.map(([iconName, IconComponent]) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => handleSelectIcon(iconName)}
                        style={{
                          padding: '0.75rem',
                          border: `1px solid ${value === iconName ? selectedBorder : borderColor}`,
                          borderRadius: '0.5rem',
                          background: value === iconName ? selectedBg : bgColor,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Box fontSize="2xl" color={value === iconName ? 'orange.500' : 'gray.600'}>
                          <IconComponent />
                        </Box>
                        <Typography
                          fontSize="9px"
                          color="gray.500"
                          textAlign="center"
                          width="100%"
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {iconName.replace('Fi', '')}
                        </Typography>
                      </button>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Box py="8" textAlign="center">
                    <Typography color="gray.500">
                      No icons found matching &quot;{searchQuery}&quot;
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Selected Icon Info */}
              {value && (
                <Box p="3" bg="gray.50" borderRadius="md">
                  <Typography fontSize="xs" color="gray.600">
                    Selected: <strong>{value}</strong>
                  </Typography>
                </Box>
              )}
            </VStack>

            {/* Footer */}
            <HStack justify="flex-end" p="6" borderTop="1px" borderColor="gray.200" gap="2">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              {value && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                >
                  Clear Selection
                </Button>
              )}
            </HStack>
          </Box>
        </Box>
      )}
    </>
  );
}
