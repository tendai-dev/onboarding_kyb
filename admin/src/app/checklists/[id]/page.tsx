'use client';

import {
  Box,
  VStack,
  HStack,
  Flex,
  Spinner,
  Textarea,
  Checkbox as ChakraCheckbox,
} from '@chakra-ui/react';
import {
  Typography,
  Button,
  Tag,
  IconWrapper,
  Card,
  AlertBar,
} from '@mukuru/mukuru-react-components';
import { Input } from '@/lib/mukuruComponentWrappers';
const useColorModeValue = <T,>(light: T, _dark: T): T => light;
import {
  FiCheckSquare,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiPlus,
  FiClock,
  FiArrowLeft,
  FiSave,
  FiX,
  FiFileText,
} from 'react-icons/fi';
import { useState, useEffect, use } from 'react';
import { SweetAlert } from '../../../utils/sweetAlert';
import AdminSidebar from '../../../components/AdminSidebar';
import PortalHeader from '../../../components/PortalHeader';
import { useSidebar } from '../../../contexts/SidebarContext';
import { checklistApiService } from '../../../services/checklistApi';
import { useRouter } from 'next/navigation';
import { logger } from '../../../lib/logger';

interface Checklist {
  id: string;
  name: string;
  entityType: string;
  description: string;
  items: ChecklistItem[];
  lastUpdated: string;
  isActive: boolean;
  version: string;
  createdBy: string;
}

interface ChecklistItem {
  id: string;
  description: string;
  isRequired: boolean;
  category: string;
  order: number;
  guidelines?: string;
}

export default function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { condensed } = useSidebar();
  const router = useRouter();
  const { id } = use(params);

  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');

  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    description: '',
    category: '',
    isRequired: false,
    guidelines: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalChecklist, setOriginalChecklist] = useState<Checklist | null>(null);

  useEffect(() => {
    if (id) {
      loadChecklist();
    }
  }, [id]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use getChecklistById for better performance and to ensure items are loaded
      const found = await checklistApiService.getChecklistById(id);
      
      if (found) {
        logger.debug('[ChecklistDetailPage] Found checklist', {
          id: found.id,
          itemCount: found.items.length,
        });
        console.log('[ChecklistDetailPage] Loaded checklist with items:', found.items);
        setChecklist(found);
        setOriginalChecklist(JSON.parse(JSON.stringify(found)));
      } else {
        logger.error(
          new Error('Checklist not found'),
          '[ChecklistDetailPage] Checklist not found',
          {
            tags: { error_type: 'checklist_not_found' },
            extra: { id },
          }
        );
        setError('Checklist not found');
      }
    } catch (err) {
      logger.error(err, 'Failed to load checklist', {
        tags: { error_type: 'checklist_load_error' },
      });
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load checklist. Please ensure the backend services are running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'Private Company':
        return 'info';
      case 'NPO':
        return 'success';
      case 'Government':
        return 'warning';
      case 'Publicly Listed':
        return 'danger';
      default:
        return 'info';
    }
  };

  const addNewItem = async () => {
    if (!newItem.description || !newItem.category) {
      await SweetAlert.warning('Validation Error', 'Please fill in description and category');
      return;
    }

    if (!checklist) return;

    const item: ChecklistItem = {
      id: `ITEM-${Date.now()}`,
      description: newItem.description,
      category: newItem.category,
      isRequired: newItem.isRequired,
      order: checklist.items.length + 1,
      guidelines: newItem.guidelines,
    };

    // Create updated checklist with new item
    const updatedChecklist = {
      ...checklist,
      items: [...checklist.items, item],
      lastUpdated: new Date().toISOString(),
    };

    // Save immediately to backend
    try {
      setSaving(true);
      await checklistApiService.updateChecklist(checklist.id, {
        name: updatedChecklist.name,
        entityType: updatedChecklist.entityType,
        description: updatedChecklist.description,
        items: updatedChecklist.items,
        isActive: updatedChecklist.isActive,
      });
      
      setChecklist(updatedChecklist);
      setOriginalChecklist(JSON.parse(JSON.stringify(updatedChecklist)));
      setNewItem({ description: '', category: '', isRequired: false, guidelines: '' });
      setHasChanges(false);
      await SweetAlert.success('Item Added', 'The new item has been added and saved.');
    } catch (err) {
      logger.error(err, 'Failed to add item');
      await SweetAlert.error('Failed', 'Failed to add item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!checklist) return;

    const result = await SweetAlert.confirm(
      'Remove Item',
      'Are you sure you want to remove this item from the checklist?',
      'Yes, remove it',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    // Create updated checklist without the item
    const updatedChecklist = {
      ...checklist,
      items: checklist.items.filter((item) => item.id !== itemId),
      lastUpdated: new Date().toISOString(),
    };

    // Save immediately to backend
    try {
      setSaving(true);
      await checklistApiService.updateChecklist(checklist.id, {
        name: updatedChecklist.name,
        entityType: updatedChecklist.entityType,
        description: updatedChecklist.description,
        items: updatedChecklist.items,
        isActive: updatedChecklist.isActive,
      });
      
      setChecklist(updatedChecklist);
      setOriginalChecklist(JSON.parse(JSON.stringify(updatedChecklist)));
      setHasChanges(false);
      await SweetAlert.success('Item Removed', 'The item has been removed and saved.');
    } catch (err) {
      logger.error(err, 'Failed to remove item');
      await SweetAlert.error('Failed', 'Failed to remove item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!checklist) return;

    try {
      const exportData = {
        name: checklist.name,
        entityType: checklist.entityType,
        description: checklist.description,
        version: checklist.version,
        isActive: checklist.isActive,
        items: checklist.items.map((item, index) => ({
          order: index + 1,
          description: item.description,
          category: item.category,
          isRequired: item.isRequired,
          guidelines: item.guidelines || '',
        })),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${checklist.name.replace(/\s+/g, '_')}_checklist.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await SweetAlert.success('Exported!', 'Checklist has been exported successfully.');
    } catch (err) {
      logger.error(err, 'Failed to export checklist');
      await SweetAlert.error('Export Failed', 'Failed to export checklist.');
    }
  };

  const handleSave = async () => {
    if (!checklist) return;

    try {
      setSaving(true);
      await checklistApiService.updateChecklist(checklist.id, {
        name: checklist.name,
        entityType: checklist.entityType,
        description: checklist.description,
        items: checklist.items,
        isActive: checklist.isActive,
      });
      setOriginalChecklist(JSON.parse(JSON.stringify(checklist)));
      setHasChanges(false);
      setIsEditing(false);
      await SweetAlert.success('Saved!', 'Checklist has been updated successfully.');
    } catch (err) {
      logger.error(err, 'Failed to save checklist');
      await SweetAlert.error('Save Failed', 'Failed to save checklist. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = async () => {
    if (hasChanges) {
      const result = await SweetAlert.confirm(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        'Yes, discard',
        'Keep editing'
      );
      if (!result.isConfirmed) return;
    }

    if (originalChecklist) {
      setChecklist(JSON.parse(JSON.stringify(originalChecklist)));
    }
    setHasChanges(false);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  // Loading State
  if (loading) {
    return (
      <Box minH="100vh" bg="mukuru.grey.100">
        <AdminSidebar />
        <PortalHeader />
        <Box
          ml={condensed ? '72px' : '280px'}
          pt="90px"
          minH="100vh"
          bg="mukuru.grey.100"
          transition="margin-left 0.3s ease"
        >
          <Flex justify="center" align="center" h="400px">
            <VStack gap="4">
              <Spinner size="xl" color="#F05423" />
              <Typography color="mukuru.grey.600">Loading checklist...</Typography>
            </VStack>
          </Flex>
        </Box>
      </Box>
    );
  }

  // Error State
  if (error || !checklist) {
    return (
      <Box minH="100vh" bg="mukuru.grey.100">
        <AdminSidebar />
        <PortalHeader />
        <Box
          ml={condensed ? '72px' : '280px'}
          pt="90px"
          minH="100vh"
          bg="mukuru.grey.100"
          transition="margin-left 0.3s ease"
        >
          <Box px="24px" py="24px">
            <AlertBar
              status="error"
              title="Error loading checklist"
              description={error || 'Checklist not found'}
            />
            <Button
              variant="secondary"
              mt="4"
              onClick={() => router.push('/checklists')}
              className="mukuru-secondary-button"
            >
              <IconWrapper>
                <FiArrowLeft size={16} />
              </IconWrapper>
              Back to Checklists
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="mukuru.background.light">
      <AdminSidebar />
      <PortalHeader />

      {/* Main Content Area */}
      <Box
        ml={condensed ? '72px' : '280px'}
        pt="90px"
        minH="100vh"
        bg="mukuru.background.light"
        transition="margin-left 0.3s ease"
      >
        {/* Page Header - Clean like requirements page */}
        <Box px="24px" pt="24px" pb="16px" bg="mukuru.cards.white">
          <Flex justify="space-between" align="center">
            <VStack align="start" gap="2px">
              <HStack gap="12px" align="center">
                <Box
                  as="button"
                  onClick={() => router.push('/checklists')}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  w="32px"
                  h="32px"
                  borderRadius="6px"
                  bg="mukuru.grey.light"
                  cursor="pointer"
                  transition="all 0.2s ease"
                  _hover={{ bg: 'mukuru.grey.medium' }}
                >
                  <FiArrowLeft size={16} color="#374151" />
                </Box>
                <Typography fontSize="24px" fontWeight="700" color={textColor}>
                  {checklist.name}
                </Typography>
                {checklist.isActive && (
                  <Tag variant="success" style={{ fontSize: '12px' }}>Active</Tag>
                )}
              </HStack>
              <Typography fontSize="14px" color="mukuru.grey.600" pl="44px">
                {checklist.description}
              </Typography>
            </VStack>

            {/* Action Buttons */}
            <HStack gap="12px">
              <Button
                variant="secondary"
                size="md"
                onClick={handleExport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FiDownload size={16} />
                Export
              </Button>

              {isEditing ? (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: saving || !hasChanges ? 0.6 : 1,
                    }}
                  >
                    <FiSave size={16} />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsEditing(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FiEdit size={16} />
                  Edit
                </Button>
              )}
            </HStack>
          </Flex>
        </Box>

        {/* Info Bar */}
        <Box px="24px" py="12px" bg="mukuru.cards.white" borderBottom="1px solid" borderColor={borderColor}>
          <HStack gap="24px" flexWrap="wrap">
            <HStack gap="8px">
              <Tag variant={getEntityTypeColor(checklist.entityType)}>
                {checklist.entityType}
              </Tag>
            </HStack>
            <HStack gap="6px">
              <FiCheckSquare size={14} color="#6B7280" />
              <Typography fontSize="13px" color="mukuru.grey.600">{checklist.items.length} items</Typography>
            </HStack>
            <HStack gap="6px">
              <FiCheckSquare size={14} color="#F05423" />
              <Typography fontSize="13px" color="mukuru.grey.600">{checklist.items.filter((item) => item.isRequired).length} required</Typography>
            </HStack>
            <HStack gap="6px">
              <FiClock size={14} color="#6B7280" />
              <Typography fontSize="13px" color="mukuru.grey.600">{formatDate(checklist.lastUpdated)}</Typography>
            </HStack>
          </HStack>
        </Box>

        {/* Content Section */}
        <Box px="24px" py="16px" bg="mukuru.background.light" flex="1" display="flex" flexDirection="column">
          {/* Existing Items List */}
          <Box
            bg="mukuru.cards.white"
            borderRadius="8px"
            border="1px solid"
            borderColor={borderColor}
            overflow="hidden"
          >
            <Box px="20px" py="14px" borderBottom="1px solid" borderColor={borderColor} bg="mukuru.grey.light">
              <Flex justify="space-between" align="center">
                <Typography fontSize="15px" fontWeight="600" color={textColor}>
                  Checklist Items
                </Typography>
                <Tag variant="info">{checklist.items.length} {checklist.items.length === 1 ? 'item' : 'items'}</Tag>
              </Flex>
            </Box>
            <Box>
              {checklist.items.length === 0 ? (
                <Box py="48px" textAlign="center">
                  <Typography fontSize="14px" color="#6B7280">No items in this checklist yet</Typography>
                  <Typography fontSize="13px" color="#9CA3AF" mt="4px">Add items using the form below</Typography>
                </Box>
              ) : (
                <VStack gap="0" align="stretch">
                  {checklist.items.map((item, index) => (
                    <Box
                      key={item.id}
                      px="20px"
                      py="14px"
                      borderBottom={index < checklist.items.length - 1 ? "1px solid" : "none"}
                      borderColor={borderColor}
                      _hover={{ bg: 'mukuru.grey.50' }}
                      transition="background 0.2s"
                    >
                      <Flex justify="space-between" align="center" gap="16px">
                        <HStack gap="12px" flex="1">
                          <Box
                            w="28px"
                            h="28px"
                            borderRadius="6px"
                            bg={item.isRequired ? '#FFF4ED' : '#F3F4F6'}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <Typography fontSize="12px" fontWeight="600" color={item.isRequired ? '#F05423' : '#6B7280'}>
                              {index + 1}
                            </Typography>
                          </Box>
                          <VStack align="start" gap="2px" flex="1">
                            <Typography fontSize="14px" fontWeight="500" color={textColor}>
                              {item.description}
                            </Typography>
                            {item.guidelines && (
                              <Typography fontSize="12px" color="#6B7280">{item.guidelines}</Typography>
                            )}
                          </VStack>
                        </HStack>
                        <HStack gap="8px" flexShrink={0}>
                          <Tag variant="info" style={{ fontSize: '11px' }}>{item.category || 'Other'}</Tag>
                          {item.isRequired && <Tag variant="danger" style={{ fontSize: '11px' }}>Required</Tag>}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                            style={{ padding: '4px', minWidth: '28px', height: '28px' }}
                          >
                            <FiTrash2 size={14} color="#DC2626" />
                          </Button>
                        </HStack>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </Box>

          {/* Add New Item Section */}
          <Box
            mt="16px"
            bg="mukuru.cards.white"
            borderRadius="8px"
            border="1px solid"
            borderColor={borderColor}
            p="20px"
          >
            <Typography fontSize="15px" fontWeight="600" color={textColor} mb="16px">
              <HStack gap="8px">
                <FiPlus size={18} color="#F05423" />
                Add New Item
              </HStack>
            </Typography>
            <Flex gap="16px" flexWrap="wrap" align="flex-end">
              <Box flex="2" minW="200px">
                <Typography fontSize="12px" fontWeight="500" color="#6B7280" mb="4px">
                  Description *
                </Typography>
                <Input
                  placeholder="Enter item description..."
                  value={newItem.description}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                />
              </Box>
              <Box flex="1" minW="150px">
                <Typography fontSize="12px" fontWeight="500" color="#6B7280" mb="4px">
                  Category *
                </Typography>
                <Input
                  placeholder="e.g., Documents"
                  value={newItem.category}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
                />
              </Box>
              <HStack
                gap="8px"
                px="12px"
                py="8px"
                bg={newItem.isRequired ? 'rgba(240, 84, 35, 0.1)' : '#F9FAFB'}
                borderRadius="6px"
                border="1px solid"
                borderColor={newItem.isRequired ? '#F05423' : '#E5E7EB'}
                cursor="pointer"
                onClick={() => setNewItem((prev) => ({ ...prev, isRequired: !prev.isRequired }))}
              >
                <Box
                  w="16px"
                  h="16px"
                  borderRadius="3px"
                  border="2px solid"
                  borderColor={newItem.isRequired ? '#F05423' : '#D1D5DB'}
                  bg={newItem.isRequired ? '#F05423' : 'white'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {newItem.isRequired && <FiCheckSquare size={10} color="white" />}
                </Box>
                <Typography fontSize="13px" fontWeight="500" color={textColor}>
                  Required
                </Typography>
              </HStack>
              <Button variant="primary" size="md" onClick={addNewItem}>
                <FiPlus size={16} />
                Add Item
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
