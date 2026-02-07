'use client';

import { Box, VStack, Flex, HStack } from '@chakra-ui/react';
import {
  Typography,
  Button,
  AlertBar,
  ArrowLeftIcon,
  Tag,
  IconWrapper,
} from '@mukuru/mukuru-react-components';
import { FiPlus, FiTrash2, FiCheckSquare } from 'react-icons/fi';
import AdminSidebar from '../../../components/AdminSidebar';
import PortalHeader from '../../../components/PortalHeader';
import { useSidebar } from '../../../contexts/SidebarContext';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { entityConfigApiService, EntityType } from '../../../services/entityConfigApi';

interface CaseOption {
  id: string;
  caseId: string;
  businessName: string;
  applicantName: string;
  partnerId: string;
  status: string;
}

export default function CreateChecklistPage() {
  const router = useRouter();
  const { condensed } = useSidebar();

  const [formData, setFormData] = useState({
    caseId: '',
    type: '',
    partnerId: '',
  });

  // Items state for adding custom items
  interface ChecklistItemInput {
    id: string;
    description: string;
    category: string;
    isRequired: boolean;
  }
  const [items, setItems] = useState<ChecklistItemInput[]>([]);
  const [newItem, setNewItem] = useState({
    description: '',
    category: '',
    isRequired: false,
  });

  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search states for dropdowns
  const [caseSearch, setCaseSearch] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [caseDropdownOpen, setCaseDropdownOpen] = useState(false);
  const [partnerDropdownOpen, setPartnerDropdownOpen] = useState(false);
  
  // Refs for click-outside detection
  const caseDropdownRef = useRef<HTMLDivElement>(null);
  const partnerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEntityTypes();
    loadCases();
  }, []);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (caseDropdownRef.current && !caseDropdownRef.current.contains(event.target as Node)) {
        setCaseDropdownOpen(false);
      }
      if (partnerDropdownRef.current && !partnerDropdownRef.current.contains(event.target as Node)) {
        setPartnerDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const loadCases = async () => {
    try {
      setLoadingCases(true);
      const response = await fetch('/api/applications?pageSize=100');
      if (response.ok) {
        const data = await response.json();
        const caseOptions: CaseOption[] = (data.items || []).map((item: any) => ({
          id: item.id,
          caseId: item.caseId || item.id,
          businessName: item.businessLegalName || item.business_legal_name || '',
          applicantName: `${item.applicantFirstName || ''} ${item.applicantLastName || ''}`.trim(),
          partnerId: item.partnerId || item.partner_id || '',
          status: item.status || '',
        }));
        setCases(caseOptions);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoadingCases(false);
    }
  };

  const loadEntityTypes = async () => {
    try {
      setLoading(true);
      const types = await entityConfigApiService.getEntityTypes();
      setEntityTypes(types);
    } catch (err) {
      console.error('Failed to load entity types:', err);
      // Use fallback entity types
      setEntityTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.caseId || !formData.type) {
      setError('Please fill in all required fields (Case ID and Type)');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      console.log('[CreateChecklist] Starting creation with items:', items.length, items);

      // Step 1: Create the checklist (backend expects snake_case)
      const response = await fetch('/api/checklist/checklists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          case_id: formData.caseId,
          type: formData.type,
          partner_id: formData.partnerId || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          throw new Error(errorData.message || 'A checklist already exists for this case. Each case can only have one checklist.');
        }
        throw new Error(errorData.error || errorData.message || errorData.details || 'Failed to create checklist');
      }

      const createResult = await response.json();
      // Backend returns snake_case: checklist_id
      const checklistId = createResult.checklist_id || createResult.checklistId;
      console.log('[CreateChecklist] Checklist created with ID:', checklistId, 'Full response:', createResult);

      // Step 2: If there are items, update the checklist to add them (backend expects snake_case)
      if (items.length > 0 && checklistId) {
        console.log('[CreateChecklist] Adding items to checklist:', items);
        const itemsPayload = {
          type: formData.type,
          status: 'InProgress',
          items: items.map((item, index) => ({
            name: item.description,
            description: item.description,
            category: item.category,
            is_required: item.isRequired,
            order: index + 1,
            notes: '',
          })),
        };
        console.log('[CreateChecklist] PUT payload:', JSON.stringify(itemsPayload));
        
        const updateResponse = await fetch(`/api/checklist/checklists/${checklistId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(itemsPayload),
        });

        console.log('[CreateChecklist] PUT response status:', updateResponse.status);
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error('[CreateChecklist] Failed to add items:', errorText);
        } else {
          const updateResult = await updateResponse.json();
          console.log('[CreateChecklist] Items added successfully:', updateResult);
        }
      } else {
        console.log('[CreateChecklist] No items to add or no checklistId');
      }

      router.push('/checklists');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create checklist';
      setError(errorMessage);
      console.error('[CreateChecklist] Error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Use entity types from database, with fallback to hardcoded values if none loaded
  const checklistTypes = entityTypes.length > 0
    ? entityTypes.map((et) => ({
        value: et.code || et.id,
        label: et.displayName || et.code || 'Unknown',
      }))
    : [
        { value: 'PrivateCompany', label: 'Private Company' },
        { value: 'NPO', label: 'Non-Profit Organization (NPO)' },
        { value: 'Government', label: 'Government Entity' },
        { value: 'PubliclyListed', label: 'Publicly Listed Company' },
        { value: 'Corporate', label: 'Corporate' },
      ];

  // Filter cases based on search
  const filteredCases = useMemo(() => {
    if (!caseSearch) return cases;
    const search = caseSearch.toLowerCase();
    return cases.filter(c => 
      c.id.toLowerCase().includes(search) ||
      c.caseId.toLowerCase().includes(search) ||
      c.businessName.toLowerCase().includes(search) ||
      c.applicantName.toLowerCase().includes(search)
    );
  }, [cases, caseSearch]);

  // Get unique partners from cases
  const uniquePartners = useMemo(() => {
    const partnerMap = new Map<string, string>();
    cases.forEach(c => {
      if (c.partnerId && !partnerMap.has(c.partnerId)) {
        partnerMap.set(c.partnerId, c.businessName || c.applicantName || c.partnerId);
      }
    });
    return Array.from(partnerMap.entries()).map(([id, name]) => ({ id, name }));
  }, [cases]);

  // Filter partners based on search
  const filteredPartners = useMemo(() => {
    if (!partnerSearch) return uniquePartners;
    const search = partnerSearch.toLowerCase();
    return uniquePartners.filter(p => 
      p.id.toLowerCase().includes(search) ||
      p.name.toLowerCase().includes(search)
    );
  }, [uniquePartners, partnerSearch]);

  // Get selected case display text
  const selectedCaseDisplay = useMemo(() => {
    if (!formData.caseId) return '';
    const selectedCase = cases.find(c => c.id === formData.caseId);
    if (selectedCase) {
      return selectedCase.businessName || selectedCase.applicantName || selectedCase.caseId;
    }
    return formData.caseId;
  }, [formData.caseId, cases]);

  // Get selected partner display text
  const selectedPartnerDisplay = useMemo(() => {
    if (!formData.partnerId) return '';
    const selectedPartner = uniquePartners.find(p => p.id === formData.partnerId);
    return selectedPartner?.name || formData.partnerId;
  }, [formData.partnerId, uniquePartners]);

  // Handle case selection
  const handleCaseSelect = useCallback((caseItem: CaseOption) => {
    setFormData(prev => ({ 
      ...prev, 
      caseId: caseItem.id,
      partnerId: caseItem.partnerId || prev.partnerId 
    }));
    setCaseSearch('');
    setCaseDropdownOpen(false);
  }, []);

  // Handle partner selection
  const handlePartnerSelect = useCallback((partner: { id: string; name: string }) => {
    setFormData(prev => ({ ...prev, partnerId: partner.id }));
    setPartnerSearch('');
    setPartnerDropdownOpen(false);
  }, []);

  // Add new item to the list
  const addItem = useCallback(() => {
    if (!newItem.description.trim() || !newItem.category.trim()) {
      setError('Please fill in both description and category for the item');
      return;
    }
    setItems(prev => [...prev, {
      id: `temp-${Date.now()}`,
      description: newItem.description,
      category: newItem.category,
      isRequired: newItem.isRequired,
    }]);
    setNewItem({ description: '', category: '', isRequired: false });
    setError(null);
  }, [newItem]);

  // Remove item from the list
  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  return (
    <Flex minH="100vh" bg="#F3F4F6">
      <AdminSidebar />
      <PortalHeader />

      <Box
        flex="1"
        ml={condensed ? '72px' : '280px'}
        mt="90px"
        minH="calc(100vh - 90px)"
        width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
        transition="margin-left 0.3s ease, width 0.3s ease"
        p="32px"
        bg="#F3F4F6"
      >
        {/* Back Link */}
        <HStack
          gap="6px"
          mb="16px"
          cursor="pointer"
          onClick={() => router.push('/checklists')}
          w="fit-content"
          _hover={{ opacity: 0.7 }}
        >
          <ArrowLeftIcon color="mukuru.grey.medium" />
          <Typography fontSize="14px" color="mukuru.grey.medium">
            Back
          </Typography>
        </HStack>

        {/* Page Title */}
        <Typography
          as="h1"
          fontSize="28px"
          fontWeight="700"
          color="mukuru.text.primary"
          mb="4px"
        >
          Create Checklist
        </Typography>
        <Typography fontSize="14px" color="mukuru.grey.medium" mb="32px">
          Create a new onboarding checklist for a case. Checklists help track the completion of required documents and information.
        </Typography>

        {/* Error Alert */}
        {error && (
          <Box mb="24px">
            <AlertBar status="error" title="Error" description={error} />
          </Box>
        )}

        {/* Form Card */}
        <Box
          bg="white"
          borderRadius="12px"
          border="1px solid #E5E7EB"
          p="28px"
          mb="24px"
          boxShadow="0 2px 8px rgba(0,0,0,0.06)"
        >
          <Typography
            fontSize="16px"
            fontWeight="600"
            color="mukuru.text.primary"
            mb="20px"
          >
            Checklist Details
          </Typography>

          <VStack align="stretch" gap="20px">
            {/* Case ID Field - Searchable Dropdown */}
            <Box position="relative" ref={caseDropdownRef}>
              <Typography
                fontSize="13px"
                fontWeight="500"
                color="mukuru.text.primary"
                mb="8px"
              >
                Select Case <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <Box position="relative">
                {formData.caseId ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    p="12px 16px"
                    border="1px solid #10B981"
                    borderRadius="6px"
                    bg="#F0FDF4"
                    height="46px"
                  >
                    <Typography fontSize="14px" fontWeight="500" color="#059669">
                      ✓ {selectedCaseDisplay}
                    </Typography>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, caseId: '', partnerId: '' }));
                        setCaseSearch('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6B7280',
                        fontSize: '14px',
                        padding: '4px 8px',
                      }}
                    >
                      Change
                    </button>
                  </Box>
                ) : (
                  <>
                    <input
                      value={caseSearch}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setCaseSearch(e.target.value);
                        if (!caseDropdownOpen) setCaseDropdownOpen(true);
                      }}
                      onFocus={() => setCaseDropdownOpen(true)}
                      placeholder={loadingCases ? 'Loading cases...' : 'Search and select a case...'}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        paddingRight: '40px',
                        fontSize: '14px',
                        border: '1px solid #D0D5DD',
                        borderRadius: '6px',
                        backgroundColor: loadingCases ? '#F3F4F6' : 'white',
                        color: '#1D2939',
                        outline: 'none',
                        height: '46px',
                      }}
                    />
                  </>
                )}
                {caseDropdownOpen && !formData.caseId && (
                  <Box
                    position="absolute"
                    top="100%"
                    left="0"
                    right="0"
                    bg="white"
                    border="1px solid #D0D5DD"
                    borderRadius="6px"
                    boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                    maxH="250px"
                    overflowY="auto"
                    zIndex={100}
                    mt="4px"
                  >
                    {filteredCases.length === 0 ? (
                      <Box p="12px" color="#9CA3AF" fontSize="14px" textAlign="center">
                        {loadingCases ? 'Loading...' : 'No cases found'}
                      </Box>
                    ) : (
                      filteredCases.slice(0, 20).map((caseItem) => (
                        <Box
                          key={caseItem.id}
                          p="10px 16px"
                          cursor="pointer"
                          _hover={{ bg: '#F3F4F6' }}
                          onClick={() => handleCaseSelect(caseItem)}
                          borderBottom="1px solid #F3F4F6"
                        >
                          <Typography fontSize="14px" fontWeight="500" color="#1D2939">
                            {caseItem.businessName || caseItem.applicantName || 'Unnamed'}
                          </Typography>
                          <Typography fontSize="12px" color="#9CA3AF">
                            ID: {caseItem.caseId || caseItem.id} • Status: {caseItem.status}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                )}
              </Box>
              <Typography fontSize="12px" color="mukuru.grey.medium" mt="8px">
                {formData.caseId ? 'Case selected. Click "Change" to select a different case.' : 'Search and select an onboarding case from the dropdown'}
              </Typography>
            </Box>

            {/* Checklist Type Field */}
            <Box>
              <Typography
                fontSize="13px"
                fontWeight="500"
                color="mukuru.text.primary"
                mb="8px"
              >
                Checklist Type <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <select
                value={formData.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData((prev) => ({ ...prev, type: e.target.value }))
                }
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #D0D5DD',
                  borderRadius: '6px',
                  backgroundColor: loading ? '#F3F4F6' : 'white',
                  color: '#1D2939',
                  outline: 'none',
                  cursor: loading ? 'wait' : 'pointer',
                  height: '46px',
                }}
              >
                <option value="">{loading ? 'Loading entity types...' : 'Select a checklist type...'}</option>
                {checklistTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <Typography fontSize="12px" color="mukuru.grey.medium" mt="8px">
                The type of entity determines which checklist items are required
              </Typography>
            </Box>

            {/* Partner ID Field (Optional) - Searchable Dropdown */}
            <Box position="relative" ref={partnerDropdownRef}>
              <Typography
                fontSize="13px"
                fontWeight="500"
                color="mukuru.text.primary"
                mb="8px"
              >
                Partner ID (Optional)
              </Typography>
              <Box position="relative">
                <input
                  value={partnerDropdownOpen ? partnerSearch : (selectedPartnerDisplay || formData.partnerId)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setPartnerSearch(e.target.value);
                    if (!partnerDropdownOpen) setPartnerDropdownOpen(true);
                  }}
                  onFocus={() => setPartnerDropdownOpen(true)}
                  placeholder="Search partners or enter ID..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    paddingRight: '40px',
                    fontSize: '14px',
                    border: '1px solid #D0D5DD',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#1D2939',
                    outline: 'none',
                    height: '46px',
                  }}
                />
                {formData.partnerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, partnerId: '' }));
                      setPartnerSearch('');
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9CA3AF',
                      fontSize: '18px',
                    }}
                  >
                    ×
                  </button>
                )}
                {partnerDropdownOpen && (
                  <Box
                    position="absolute"
                    top="100%"
                    left="0"
                    right="0"
                    bg="white"
                    border="1px solid #D0D5DD"
                    borderRadius="6px"
                    boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                    maxH="200px"
                    overflowY="auto"
                    zIndex={100}
                    mt="4px"
                  >
                    {filteredPartners.length === 0 ? (
                      <Box p="12px" color="#9CA3AF" fontSize="14px" textAlign="center">
                        {uniquePartners.length === 0 ? 'No partners available' : 'No matching partners'}
                      </Box>
                    ) : (
                      filteredPartners.map((partner) => (
                        <Box
                          key={partner.id}
                          p="10px 16px"
                          cursor="pointer"
                          _hover={{ bg: '#F3F4F6' }}
                          onClick={() => handlePartnerSelect(partner)}
                          borderBottom="1px solid #F3F4F6"
                        >
                          <Typography fontSize="14px" fontWeight="500" color="#1D2939">
                            {partner.name}
                          </Typography>
                          <Typography fontSize="12px" color="#9CA3AF">
                            ID: {partner.id.substring(0, 20)}...
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                )}
              </Box>
              <Typography fontSize="12px" color="mukuru.grey.medium" mt="8px">
                Auto-filled when you select a case, or search to select a different partner
              </Typography>
            </Box>
          </VStack>
        </Box>

        {/* Checklist Items Card */}
        <Box
          bg="white"
          borderRadius="12px"
          border="1px solid #E5E7EB"
          mb="24px"
          boxShadow="0 2px 8px rgba(0,0,0,0.06)"
          overflow="hidden"
        >
          <Box px="28px" py="16px" borderBottom="1px solid #E5E7EB" bg="#FAFAFA">
            <Flex justify="space-between" align="center">
              <Typography fontSize="16px" fontWeight="600" color="mukuru.text.primary">
                Checklist Items
              </Typography>
              <Tag variant="info">{items.length} {items.length === 1 ? 'item' : 'items'}</Tag>
            </Flex>
          </Box>

          {/* Items List */}
          <Box>
            {items.length === 0 ? (
              <Box py="32px" textAlign="center">
                <Typography fontSize="14px" color="#6B7280">No items added yet</Typography>
                <Typography fontSize="13px" color="#9CA3AF" mt="4px">Add items using the form below</Typography>
              </Box>
            ) : (
              <VStack gap="0" align="stretch">
                {items.map((item, index) => (
                  <Box
                    key={item.id}
                    px="28px"
                    py="12px"
                    borderBottom={index < items.length - 1 ? "1px solid #E5E7EB" : "none"}
                    _hover={{ bg: '#F9FAFB' }}
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
                        <Typography fontSize="14px" fontWeight="500" color="#1D2939" flex="1">
                          {item.description}
                        </Typography>
                      </HStack>
                      <HStack gap="8px" flexShrink={0}>
                        <Tag variant="info" style={{ fontSize: '11px' }}>{item.category}</Tag>
                        {item.isRequired && <Tag variant="danger" style={{ fontSize: '11px' }}>Required</Tag>}
                        <button
                          onClick={() => removeItem(item.id)}
                          style={{
                            padding: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <FiTrash2 size={14} color="#DC2626" />
                        </button>
                      </HStack>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>

          {/* Add Item Form */}
          <Box px="28px" py="16px" borderTop="1px solid #E5E7EB" bg="#FAFAFA">
            <Typography fontSize="14px" fontWeight="600" color="#1D2939" mb="12px">
              <HStack gap="6px">
                <FiPlus size={16} color="#F05423" />
                Add New Item
              </HStack>
            </Typography>
            <Flex gap="12px" flexWrap="wrap" align="flex-end">
              <Box flex="2" minW="200px">
                <Typography fontSize="12px" fontWeight="500" color="#6B7280" mb="4px">
                  Description *
                </Typography>
                <input
                  placeholder="Enter item description..."
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #D0D5DD',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    outline: 'none',
                  }}
                />
              </Box>
              <Box flex="1" minW="150px">
                <Typography fontSize="12px" fontWeight="500" color="#6B7280" mb="4px">
                  Category *
                </Typography>
                <input
                  placeholder="e.g., Documents"
                  value={newItem.category}
                  onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #D0D5DD',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    outline: 'none',
                  }}
                />
              </Box>
              <HStack
                gap="8px"
                px="12px"
                py="10px"
                bg={newItem.isRequired ? 'rgba(240, 84, 35, 0.1)' : 'white'}
                borderRadius="6px"
                border="1px solid"
                borderColor={newItem.isRequired ? '#F05423' : '#D0D5DD'}
                cursor="pointer"
                onClick={() => setNewItem(prev => ({ ...prev, isRequired: !prev.isRequired }))}
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
                <Typography fontSize="13px" fontWeight="500" color="#1D2939">
                  Required
                </Typography>
              </HStack>
              <Button variant="secondary" size="sm" onClick={addItem}>
                <FiPlus size={14} />
                Add
              </Button>
            </Flex>
          </Box>
        </Box>

        {/* Info Card */}
        <Box
          bg="#FFF7ED"
          borderRadius="12px"
          border="1px solid #FDBA74"
          p="20px"
          mb="24px"
        >
          <Typography fontSize="14px" fontWeight="600" color="#9A3412" mb="8px">
            About Checklists
          </Typography>
          <Typography fontSize="13px" color="#C2410C" lineHeight="1.6">
            Checklists can be created with custom items, or they will be automatically populated 
            with default items based on the entity type selected. Each checklist tracks the completion 
            status of required documents and information for the KYB onboarding process.
          </Typography>
        </Box>

        {/* Action Buttons */}
        <HStack justify="flex-end" gap="12px" mt="24px">
          <Button
            onClick={() => router.push('/checklists')}
            variant="secondary"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            variant="primary"
            disabled={saving || !formData.caseId || !formData.type}
            loading={saving}
          >
            {saving ? 'Creating...' : 'Create Checklist'}
          </Button>
        </HStack>
      </Box>
    </Flex>
  );
}
