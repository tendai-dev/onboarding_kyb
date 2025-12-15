'use client';

import { Box, VStack, HStack, Flex, Spinner, SimpleGrid } from '@chakra-ui/react';
// Import components directly from Mukuru package
import {
  Typography,
  Button,
  Card,
  Tag,
  IconWrapper,
  AlertBar,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Dropdown,
} from '@mukuru/mukuru-react-components';
// Import wrapper components (not yet in npm package)
import { Input } from '@/lib/mukuruComponentWrappers';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;
import { useParams, useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiShield,
  FiClock,
  FiX,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi';
import AdminSidebar from '../../../../components/AdminSidebar';
import PortalHeader from '../../../../components/PortalHeader';
import { useSidebar } from '../../../../contexts/SidebarContext';
import { useState, useEffect } from 'react';
import {
  rulesAndPermissionsApiService,
  User,
  Role,
} from '../../../../services/rulesAndPermissionsApi';
import { SweetAlert } from '../../../../utils/sweetAlert';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { condensed } = useSidebar();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  // Color mode values
  const bgColor = useColorModeValue('mukuru.background.light', 'mukuru.background.dark');
  const cardBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');
  const mutedTextColor = useColorModeValue('mukuru.grey.medium', 'mukuru.grey.400');

  // State
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [showGrantPermissionModal, setShowGrantPermissionModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [permissionForm, setPermissionForm] = useState({
    permissionName: '',
    resource: '',
    description: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // Load user and roles
  useEffect(() => {
    if (resolvedParams?.id) {
      loadUser();
      loadRoles();
    }
  }, [resolvedParams?.id]);

  const loadUser = async () => {
    if (!resolvedParams?.id) return;
    try {
      setLoading(true);
      setError(null);
      const userData = await rulesAndPermissionsApiService.getUserById(resolvedParams.id);
      if (!userData) {
        setError('User not found');
        return;
      }
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user';
      setError(errorMessage);
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await rulesAndPermissionsApiService.getAllRoles(true);
      setRoles(data.filter((r) => r.isActive));
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  };

  // Get all permissions for user (direct + from roles)
  const getUserAllPermissions = (userData: User) => {
    const permissionMap = new Map<
      string,
      {
        permissionName: string;
        resource?: string;
        source: 'direct' | 'role';
        roleName?: string;
        permissionId?: string;
      }
    >();

    // Add direct user permissions
    userData.permissions
      .filter((p) => p.isActive)
      .forEach((perm) => {
        const key = perm.resource
          ? `${perm.permissionName}::${perm.resource}`
          : perm.permissionName;
        if (!permissionMap.has(key)) {
          permissionMap.set(key, {
            permissionName: perm.permissionName,
            resource: perm.resource || undefined,
            source: 'direct',
            permissionId: perm.id,
          });
        }
      });

    // Add permissions from user's roles
    userData.roles
      .filter((r) => r.isActive)
      .forEach((userRole) => {
        const role = roles.find(
          (r) => r.id === userRole.roleId || r.name === userRole.roleName
        );
        if (role) {
          role.permissions
            .filter((p) => p.isActive)
            .forEach((perm) => {
              const key = perm.resource
                ? `${perm.permissionName}::${perm.resource}`
                : perm.permissionName;
              if (!permissionMap.has(key)) {
                permissionMap.set(key, {
                  permissionName: perm.permissionName,
                  resource: perm.resource || undefined,
                  source: 'role',
                  roleName: role.displayName,
                });
              }
            });
        }
      });

    return Array.from(permissionMap.values()).sort((a, b) =>
      a.permissionName.localeCompare(b.permissionName)
    );
  };

  const handleAssignRole = async () => {
    if (!user || !selectedRoleId) {
      setError('Please select a role');
      return;
    }

    try {
      setActionLoading(true);
      await rulesAndPermissionsApiService.assignRoleToUser(user.id, selectedRoleId);
      await SweetAlert.success(
        'Role Assigned',
        'The role has been successfully assigned to the user.'
      );
      setShowAssignRoleModal(false);
      setSelectedRoleId('');
      await loadUser();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
      await SweetAlert.error('Error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveRole = async (userRoleId: string, roleName: string) => {
    if (!user) return;

    const result = await SweetAlert.confirm(
      'Remove Role?',
      `Are you sure you want to remove the role "${roleName}" from this user?`,
      'Yes, remove it',
      'Cancel',
      'warning'
    );

    if (!result.isConfirmed) return;

    try {
      setActionLoading(true);
      await rulesAndPermissionsApiService.removeRoleFromUser(user.id, userRoleId);
      await SweetAlert.success(
        'Role Removed',
        'The role has been successfully removed from the user.'
      );
      await loadUser();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove role';
      await SweetAlert.error('Error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGrantPermission = async () => {
    if (!user || !permissionForm.permissionName.trim()) {
      setError('Please enter a permission name');
      return;
    }

    try {
      setActionLoading(true);
      await rulesAndPermissionsApiService.grantPermission(user.id, {
        permissionName: permissionForm.permissionName,
        resource: permissionForm.resource || undefined,
        description: permissionForm.description || undefined,
      });
      await SweetAlert.success(
        'Permission Granted',
        'The permission has been successfully granted to the user.'
      );
      setShowGrantPermissionModal(false);
      setPermissionForm({ permissionName: '', resource: '', description: '' });
      await loadUser();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to grant permission';
      await SweetAlert.error('Error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokePermission = async (permissionId: string, permissionName: string) => {
    if (!user) return;

    const result = await SweetAlert.confirm(
      'Revoke Permission?',
      `Are you sure you want to revoke the permission "${permissionName}" from this user?`,
      'Yes, revoke it',
      'Cancel',
      'warning'
    );

    if (!result.isConfirmed) return;

    try {
      setActionLoading(true);
      await rulesAndPermissionsApiService.revokePermission(permissionId);
      await SweetAlert.success(
        'Permission Revoked',
        'The permission has been successfully revoked from the user.'
      );
      await loadUser();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to revoke permission';
      await SweetAlert.error('Error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Get available roles (roles not already assigned to user)
  const getAvailableRoles = () => {
    if (!user) return roles;
    const assignedRoleIds = new Set(
      user.roles.filter((r) => r.isActive).map((r) => r.roleId)
    );
    return roles.filter((r) => !assignedRoleIds.has(r.id));
  };

  // Mukuru theme colors (matching work-queue page)
  const bgColorNew = 'mukuru.grey.100';
  const cardBgNew = 'mukuru.white';
  const borderColorNew = 'mukuru.stroke';

  // Loading state
  if (loading) {
    return (
      <Box minH="100vh" bg={bgColorNew}>
        <AdminSidebar />
        <PortalHeader />
        <Box
          ml={condensed ? '72px' : '280px'}
          pt="90px"
          minH="100vh"
          bg={bgColorNew}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" color="#F05423" />
        </Box>
      </Box>
    );
  }

  // Error state
  if (error && !user) {
    return (
      <Box minH="100vh" bg={bgColorNew}>
        <AdminSidebar />
        <PortalHeader />
        <Box
          ml={condensed ? '72px' : '280px'}
          pt="90px"
          minH="100vh"
          bg={bgColorNew}
          px="24px"
          py="24px"
        >
          <AlertBar status="error" title="Error" description={error} />
          <Button
            mt="16px"
            variant="secondary"
            onClick={() => router.push('/roles-and-permissions')}
          >
            <IconWrapper>
              <FiArrowLeft size={16} />
            </IconWrapper>
            Back to Roles and Permissions
          </Button>
        </Box>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  const allPermissions = getUserAllPermissions(user);
  const availableRoles = getAvailableRoles();
  const activeRoles = user.roles.filter((r) => r.isActive);

  return (
    <Box minH="100vh" bg={bgColorNew}>
      <AdminSidebar />
      <PortalHeader />

      {/* Main Content Area */}
      <Box
        ml={condensed ? '72px' : '280px'}
        pt="90px"
        minH="100vh"
        bg={bgColorNew}
        transition="margin-left 0.3s ease"
      >
        {/* Page Header */}
        <Box
          px="24px"
          pt="24px"
          pb="16px"
          bg={cardBgNew}
          borderBottom="1px solid"
          borderColor={borderColorNew}
        >
          {/* Back Button */}
          <HStack gap="12px" align="center" mb="16px">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/roles-and-permissions')}
            >
              <IconWrapper>
                <FiArrowLeft size={18} />
              </IconWrapper>
            </Button>
            <Typography fontSize="14px" color="mukuru.grey.600">
              Back to Roles and Permissions
            </Typography>
          </HStack>

          {/* User Title Section */}
          <Flex justify="space-between" align="center" gap="32px">
            {/* Left: User Info */}
            <HStack gap="14px" align="center">
              <Box
                w="44px"
                h="44px"
                borderRadius="10px"
                bg="#FFF5F0"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <FiUser size={22} color="#F05423" />
              </Box>
              <VStack align="start" gap="0px">
                <Typography
                  fontSize="18px"
                  fontWeight="600"
                  color="#111827"
                  lineHeight="1.3"
                >
                  {user.name || user.email}
                </Typography>
                <Typography fontSize="12px" color="#9CA3AF">
                  User Details and Permissions Management
                </Typography>
              </VStack>
            </HStack>

            {/* Right: Role Tags + Assign Button */}
            <HStack gap="12px" align="center" flexShrink={0}>
              {user.roles && user.roles.filter((r) => r.isActive).length > 0 && (
                <HStack gap="8px">
                  {user.roles
                    .filter((r) => r.isActive)
                    .map((userRole) => (
                      <Box
                        key={userRole.id}
                        px="10px"
                        py="5px"
                        bg="#FEF3F2"
                        border="1px solid #FEE4E2"
                        borderRadius="6px"
                        display="flex"
                        alignItems="center"
                      >
                        <Typography
                          fontSize="12px"
                          fontWeight="500"
                          color="#D92D20"
                          whiteSpace="nowrap"
                        >
                          {userRole.roleDisplayName || userRole.roleName}
                        </Typography>
                      </Box>
                    ))}
                </HStack>
              )}
              <Button
                size="md"
                variant="primary"
                onClick={() => setShowAssignRoleModal(true)}
                disabled={availableRoles.length === 0 || actionLoading}
              >
                <IconWrapper>
                  <FiPlus size={16} />
                </IconWrapper>
                Assign Role
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* Content Section */}
        <Box px="24px" py="24px" bg={bgColorNew}>
          {/* Error Alert */}
          {error && (
            <Box mb="16px">
              <AlertBar
                status="error"
                title="Error"
                description={error}
                onClose={() => setError(null)}
              />
            </Box>
          )}

          {/* User Information Card */}
          <Box
            bg={cardBgNew}
            borderRadius="8px"
            border="1px solid"
            borderColor={borderColorNew}
            mb="24px"
            overflow="hidden"
          >
            {/* Card Header */}
            <Box
              px="20px"
              py="16px"
              borderBottom="1px solid"
              borderColor={borderColorNew}
              bg="#FAFAFA"
            >
              <Typography fontSize="15px" fontWeight="600" color="#111827">
                User Information
              </Typography>
            </Box>

            {/* Card Content */}
            <Box px="20px" py="16px">
              <VStack align="stretch" gap="0">
                {/* Full Name Row */}
                <Flex
                  py="12px"
                  borderBottom="1px solid"
                  borderColor="#F0F0F0"
                  align="center"
                >
                  <HStack gap="12px" w="180px" flexShrink={0}>
                    <Box w="20px" display="flex" justifyContent="center">
                      <FiUser size={16} color="#6B7280" />
                    </Box>
                    <Typography fontSize="13px" fontWeight="500" color="#6B7280">
                      Full Name
                    </Typography>
                  </HStack>
                  <Typography fontSize="13px" fontWeight="500" color="#111827">
                    {user.name || 'Not provided'}
                  </Typography>
                </Flex>

                {/* Email Row */}
                <Flex
                  py="12px"
                  borderBottom="1px solid"
                  borderColor="#F0F0F0"
                  align="center"
                >
                  <HStack gap="12px" w="180px" flexShrink={0}>
                    <Box w="20px" display="flex" justifyContent="center">
                      <FiMail size={16} color="#6B7280" />
                    </Box>
                    <Typography fontSize="13px" fontWeight="500" color="#6B7280">
                      Email Address
                    </Typography>
                  </HStack>
                  <Typography fontSize="13px" fontWeight="500" color="#111827">
                    {user.email}
                  </Typography>
                </Flex>

                {/* First Login Row */}
                <Flex
                  py="12px"
                  borderBottom="1px solid"
                  borderColor="#F0F0F0"
                  align="center"
                >
                  <HStack gap="12px" w="180px" flexShrink={0}>
                    <Box w="20px" display="flex" justifyContent="center">
                      <FiClock size={16} color="#6B7280" />
                    </Box>
                    <Typography fontSize="13px" fontWeight="500" color="#6B7280">
                      First Login
                    </Typography>
                  </HStack>
                  <Typography fontSize="13px" fontWeight="500" color="#111827">
                    {user.firstLoginAt
                      ? new Date(user.firstLoginAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never logged in'}
                  </Typography>
                </Flex>

                {/* Last Login Row */}
                <Flex py="12px" align="center">
                  <HStack gap="12px" w="180px" flexShrink={0}>
                    <Box w="20px" display="flex" justifyContent="center">
                      <FiClock size={16} color="#6B7280" />
                    </Box>
                    <Typography fontSize="13px" fontWeight="500" color="#6B7280">
                      Last Login
                    </Typography>
                  </HStack>
                  <Typography fontSize="13px" fontWeight="500" color="#111827">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never logged in'}
                  </Typography>
                </Flex>
              </VStack>
            </Box>
          </Box>

          {/* Permissions Card */}
          <Box
            bg={cardBgNew}
            borderRadius="8px"
            border="1px solid"
            borderColor={borderColorNew}
            overflow="hidden"
          >
            {/* Card Header */}
            <Box
              px="20px"
              py="16px"
              borderBottom="1px solid"
              borderColor={borderColorNew}
              bg="#FAFAFA"
            >
              <Flex justify="space-between" align="center">
                <HStack gap="12px" align="center">
                  <FiShield size={18} color="#F05423" />
                  <Typography fontSize="15px" fontWeight="600" color="#111827">
                    Permissions
                  </Typography>
                  <Tag variant="info" style={{ fontSize: '12px', padding: '2px 8px' }}>
                    {allPermissions.length}
                  </Tag>
                </HStack>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowGrantPermissionModal(true)}
                  disabled={actionLoading}
                >
                  <IconWrapper>
                    <FiPlus size={14} />
                  </IconWrapper>
                  Grant Permission
                </Button>
              </Flex>
            </Box>

            {/* Permissions Grid */}
            <Box px="20px" py="16px">
              {allPermissions.length === 0 ? (
                <Box
                  p="24px"
                  textAlign="center"
                  borderRadius="8px"
                  bg="#F9FAFB"
                  border="1px dashed"
                  borderColor="#E5E7EB"
                >
                  <Typography fontSize="13px" color="#6B7280" fontStyle="italic">
                    No permissions assigned to this user
                  </Typography>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} gap="12px">
                  {allPermissions.map((perm, index) => (
                    <Box
                      key={`${perm.permissionName}-${perm.resource || ''}-${index}`}
                      p="12px"
                      bg="#F9FAFB"
                      borderRadius="6px"
                      border="1px solid"
                      borderColor="#E5E7EB"
                      _hover={{ borderColor: '#F05423', boxShadow: 'sm' }}
                      transition="all 0.2s"
                    >
                      <VStack align="stretch" gap="4px">
                        <Flex justify="space-between" align="flex-start">
                          <Typography
                            fontSize="12px"
                            fontWeight="600"
                            color="#111827"
                            style={{ fontFamily: 'monospace' }}
                          >
                            {perm.permissionName}
                          </Typography>
                          {perm.source === 'direct' && perm.permissionId && (
                            <button
                              onClick={() =>
                                handleRevokePermission(
                                  perm.permissionId!,
                                  perm.permissionName
                                )
                              }
                              disabled={actionLoading}
                              style={{
                                padding: '4px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '4px',
                              }}
                            >
                              <FiX size={12} color="#EF4444" />
                            </button>
                          )}
                        </Flex>
                        <HStack gap="6px" align="center" flexWrap="wrap">
                          <Tag
                            variant={perm.source === 'direct' ? 'success' : 'inactive'}
                            style={{ fontSize: '10px', padding: '2px 6px' }}
                          >
                            {perm.source === 'direct' ? 'Direct' : 'From Role'}
                          </Tag>
                          {perm.roleName && (
                            <Typography fontSize="10px" color="#9CA3AF">
                              via {perm.roleName}
                            </Typography>
                          )}
                        </HStack>
                      </VStack>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Assign Role Modal */}
      <Modal
        isOpen={showAssignRoleModal}
        onClose={() => {
          setShowAssignRoleModal(false);
          setSelectedRoleId('');
        }}
        size="large"
      >
        <ModalHeader>
          <Typography fontSize="xl" fontWeight="semibold">
            Assign Role to User
          </Typography>
        </ModalHeader>
        <ModalBody>
          <VStack gap={4} align="stretch" w="100%">
            <Box w="100%">
              <Typography fontSize="sm" fontWeight="medium" color={textColor} mb={3}>
                Select Role
              </Typography>
              <Box
                w="100%"
                border="1px solid"
                borderColor={borderColor}
                borderRadius="md"
                bg={cardBg}
                overflow="hidden"
              >
                <select
                  value={selectedRoleId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setSelectedRoleId(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    color: 'inherit',
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                >
                  <option value="">-- Select a role --</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.displayName} ({role.name})
                    </option>
                  ))}
                </select>
              </Box>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack gap={3}>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAssignRoleModal(false);
                setSelectedRoleId('');
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignRole}
              disabled={!selectedRoleId || actionLoading}
            >
              {actionLoading ? 'Assigning...' : 'Assign Role'}
            </Button>
          </HStack>
        </ModalFooter>
      </Modal>

      {/* Grant Permission Modal */}
      <Modal
        isOpen={showGrantPermissionModal}
        onClose={() => {
          setShowGrantPermissionModal(false);
          setPermissionForm({ permissionName: '', resource: '', description: '' });
        }}
        size="large"
      >
        <ModalHeader>
          <Typography fontSize="xl" fontWeight="semibold">
            Grant Permission to User
          </Typography>
        </ModalHeader>
        <ModalBody>
          <VStack gap={4} align="stretch" w="100%">
            <Box w="100%">
              <Typography fontSize="sm" fontWeight="medium" color={textColor} mb={3}>
                Permission Name <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <Box w="100%">
                <Input
                  placeholder="e.g., view_dashboard"
                  value={permissionForm.permissionName}
                  onChange={(e) =>
                    setPermissionForm({
                      ...permissionForm,
                      permissionName: e.target.value,
                    })
                  }
                />
              </Box>
            </Box>
            <Box w="100%">
              <Typography fontSize="sm" fontWeight="medium" color={textColor} mb={3}>
                Resource (optional)
              </Typography>
              <Box w="100%">
                <Input
                  placeholder="e.g., applications"
                  value={permissionForm.resource}
                  onChange={(e) =>
                    setPermissionForm({ ...permissionForm, resource: e.target.value })
                  }
                />
              </Box>
            </Box>
            <Box w="100%">
              <Typography fontSize="sm" fontWeight="medium" color={textColor} mb={3}>
                Description (optional)
              </Typography>
              <Box w="100%">
                <Input
                  placeholder="Permission description"
                  value={permissionForm.description}
                  onChange={(e) =>
                    setPermissionForm({ ...permissionForm, description: e.target.value })
                  }
                />
              </Box>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack gap={3}>
            <Button
              variant="secondary"
              onClick={() => {
                setShowGrantPermissionModal(false);
                setPermissionForm({ permissionName: '', resource: '', description: '' });
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleGrantPermission}
              disabled={!permissionForm.permissionName.trim() || actionLoading}
            >
              {actionLoading ? 'Granting...' : 'Grant Permission'}
            </Button>
          </HStack>
        </ModalFooter>
      </Modal>
    </Box>
  );
}
