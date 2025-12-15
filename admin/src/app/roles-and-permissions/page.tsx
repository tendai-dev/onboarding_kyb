'use client';

import {
  Box,
  VStack,
  HStack,
  Flex,
  Spinner,
  Textarea,
  Field,
  SimpleGrid,
  Checkbox,
} from '@chakra-ui/react';
// Import components directly from Mukuru package
import {
  Search,
  Typography,
  Button,
  Tag,
  IconWrapper,
  AlertBar,
  DataTable,
} from '@mukuru/mukuru-react-components';
import type { ColumnConfig } from '@mukuru/mukuru-react-components';
// Import wrapper components (not yet in npm package)
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsIndicator,
  Input,
} from '@/lib/mukuruComponentWrappers';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;
import { useRouter } from 'next/navigation';
import {
  FiLock,
  FiPlus,
  FiMail,
  FiUser,
  FiX,
  FiTrash2,
  FiEdit3,
  FiShield,
} from 'react-icons/fi';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';
import { useState, useEffect } from 'react';
import {
  rulesAndPermissionsApiService,
  User,
  Role,
} from '../../services/rulesAndPermissionsApi';
import { SweetAlert } from '../../utils/sweetAlert';

// Common permissions organized by category
const PERMISSION_CATEGORIES = [
  {
    category: 'View Permissions',
    permissions: [
      { value: 'view_dashboard', label: 'View Dashboard' },
      { value: 'view_reports', label: 'View Reports' },
      { value: 'view_applications', label: 'View Applications' },
      { value: 'view_work_queue', label: 'View Work Queue' },
      { value: 'view_messages', label: 'View Messages' },
      { value: 'view_audit_log', label: 'View Audit Log' },
      { value: 'view_entity_types', label: 'View Entity Types' },
      { value: 'view_users', label: 'View Users' },
      { value: 'view_roles', label: 'View Roles' },
      { value: 'view_requirements', label: 'View Requirements' },
      { value: 'view_checklists', label: 'View Checklists' },
      { value: 'view_notifications', label: 'View Notifications' },
      { value: 'view_risk_review', label: 'View Risk Review' },
      { value: 'view_approvals', label: 'View Approvals' },
      { value: 'view_refreshes', label: 'View Refreshes' },
    ],
  },
  {
    category: 'Create Permissions',
    permissions: [
      { value: 'create_application', label: 'Create Application' },
      { value: 'create_entity_type', label: 'Create Entity Type' },
      { value: 'create_requirement', label: 'Create Requirement' },
      { value: 'create_role', label: 'Create Role' },
      { value: 'create_user', label: 'Create User' },
      { value: 'create_checklist', label: 'Create Checklist' },
      { value: 'create_notification', label: 'Create Notification' },
    ],
  },
  {
    category: 'Edit Permissions',
    permissions: [
      { value: 'edit_application', label: 'Edit Application' },
      { value: 'edit_entity_type', label: 'Edit Entity Type' },
      { value: 'edit_requirement', label: 'Edit Requirement' },
      { value: 'edit_role', label: 'Edit Role' },
      { value: 'edit_user', label: 'Edit User' },
      { value: 'edit_checklist', label: 'Edit Checklist' },
      { value: 'edit_notification', label: 'Edit Notification' },
    ],
  },
  {
    category: 'Delete Permissions',
    permissions: [
      { value: 'delete_application', label: 'Delete Application' },
      { value: 'delete_entity_type', label: 'Delete Entity Type' },
      { value: 'delete_requirement', label: 'Delete Requirement' },
      { value: 'delete_role', label: 'Delete Role' },
      { value: 'delete_user', label: 'Delete User' },
      { value: 'delete_checklist', label: 'Delete Checklist' },
      { value: 'delete_notification', label: 'Delete Notification' },
    ],
  },
  {
    category: 'Action Permissions',
    permissions: [
      { value: 'approve_application', label: 'Approve Application' },
      { value: 'reject_application', label: 'Reject Application' },
      { value: 'assign_work_item', label: 'Assign Work Item' },
      { value: 'complete_work_item', label: 'Complete Work Item' },
      { value: 'grant_permission', label: 'Grant Permission' },
      { value: 'revoke_permission', label: 'Revoke Permission' },
      { value: 'assign_role', label: 'Assign Role' },
      { value: 'remove_role', label: 'Remove Role' },
    ],
  },
  {
    category: 'Admin Permissions',
    permissions: [
      { value: 'admin_access', label: 'Admin Access' },
      { value: 'manage_users', label: 'Manage Users' },
      { value: 'manage_roles', label: 'Manage Roles' },
      { value: 'manage_permissions', label: 'Manage Permissions' },
      { value: 'manage_configuration', label: 'Manage Configuration' },
      { value: 'export_data', label: 'Export Data' },
      { value: 'import_data', label: 'Import Data' },
    ],
  },
];

// Flattened list for backward compatibility (currently unused but kept for future use)
// const AVAILABLE_PERMISSIONS = PERMISSION_CATEGORIES.flatMap((cat) => cat.permissions);

// Common resources
const AVAILABLE_RESOURCES = [
  { value: 'applications', label: 'Applications' },
  { value: 'entity_types', label: 'Entity Types' },
  { value: 'requirements', label: 'Requirements' },
  { value: 'roles', label: 'Roles' },
  { value: 'users', label: 'Users' },
  { value: 'reports', label: 'Reports' },
  { value: 'work_queue', label: 'Work Queue' },
  { value: 'messages', label: 'Messages' },
  { value: 'audit_log', label: 'Audit Log' },
  { value: 'checklists', label: 'Checklists' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'risk_review', label: 'Risk Review' },
  { value: 'approvals', label: 'Approvals' },
];

export default function RulesAndPermissionsPage() {
  const { condensed } = useSidebar();
  const router = useRouter();
  // Color mode values for dark/light mode support
  const bgColor = useColorModeValue('mukuru.background.light', 'mukuru.background.dark');
  const cardBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const headerBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [granting, setGranting] = useState(false);
  const [permissionForm, setPermissionForm] = useState({
    permissionName: '',
    resource: '',
    description: '',
  });

  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showManagePermissionsModal, setShowManagePermissionsModal] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: '',
    displayName: '',
    description: '',
  });
  const [permissionToAdd, setPermissionToAdd] = useState({
    permissionName: '',
    resource: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else {
      loadRoles();
    }
  }, [activeTab]);

  // Load roles when component mounts to have permissions available
  useEffect(() => {
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setError(null);
      const data = await rulesAndPermissionsApiService.getAllUsers(true);
      setUsers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      console.error('Error loading users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      setError(null);
      const data = await rulesAndPermissionsApiService.getAllRoles(true);
      setRoles(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load roles';
      setError(errorMessage);
      console.error('Error loading roles:', err);
    } finally {
      setRolesLoading(false);
    }
  };

  const handleGrantPermission = async () => {
    if (!selectedUser || !permissionForm.permissionName.trim()) {
      setError('Please select a user and enter a permission name');
      return;
    }

    try {
      setGranting(true);
      setError(null);
      SweetAlert.loading('Granting...', 'Please wait while we grant the permission.');
      await rulesAndPermissionsApiService.grantPermission(selectedUser.id, {
        permissionName: permissionForm.permissionName,
        resource: permissionForm.resource || undefined,
        description: permissionForm.description || undefined,
      });

      await loadUsers();
      SweetAlert.close();
      await SweetAlert.success('Granted!', 'Permission has been granted successfully.');
      closeGrantModal();
    } catch (err) {
      SweetAlert.close();
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to grant permission';
      setError(errorMessage);
      console.error('Error granting permission:', err);
      await SweetAlert.error('Grant Failed', errorMessage);
    } finally {
      setGranting(false);
    }
  };

  const handleRevokePermission = async (permissionId: string, permissionName: string) => {
    const result = await SweetAlert.confirm(
      'Revoke Permission',
      `Are you sure you want to revoke the permission "${permissionName}"?`,
      'Yes, revoke it!',
      'Cancel',
      'warning'
    );

    if (!result.isConfirmed) return;

    try {
      setError(null);
      SweetAlert.loading('Revoking...', 'Please wait while we revoke the permission.');
      await rulesAndPermissionsApiService.revokePermission(permissionId);
      await loadUsers();
      SweetAlert.close();
      await SweetAlert.success('Revoked!', 'Permission has been revoked successfully.');
    } catch (err) {
      SweetAlert.close();
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to revoke permission';
      setError(errorMessage);
      console.error('Error revoking permission:', err);
      await SweetAlert.error('Revoke Failed', errorMessage);
    }
  };

  const handleCreateRole = async () => {
    if (!roleForm.name.trim() || !roleForm.displayName.trim()) {
      setError('Please enter role name and display name');
      return;
    }

    try {
      setError(null);
      SweetAlert.loading('Creating...', 'Please wait while we create the role.');
      await rulesAndPermissionsApiService.createRole({
        name: roleForm.name,
        displayName: roleForm.displayName,
        description: roleForm.description || undefined,
      });

      await loadRoles();
      SweetAlert.close();
      await SweetAlert.success('Created!', 'Role has been created successfully.');
      closeCreateRoleModal();
    } catch (err) {
      SweetAlert.close();
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      setError(errorMessage);
      console.error('Error creating role:', err);
      await SweetAlert.error('Create Failed', errorMessage);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole || !roleForm.displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    try {
      setError(null);
      SweetAlert.loading('Updating...', 'Please wait while we update the role.');
      await rulesAndPermissionsApiService.updateRole(selectedRole.id, {
        displayName: roleForm.displayName,
        description: roleForm.description || undefined,
      });

      await loadRoles();
      SweetAlert.close();
      await SweetAlert.success('Updated!', 'Role has been updated successfully.');
      closeEditRoleModal();
    } catch (err) {
      SweetAlert.close();
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setError(errorMessage);
      console.error('Error updating role:', err);
      await SweetAlert.error('Update Failed', errorMessage);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    const result = await SweetAlert.confirm(
      'Delete Role',
      `Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`,
      'Yes, delete it!',
      'Cancel',
      'warning'
    );

    if (!result.isConfirmed) return;

    try {
      setError(null);
      SweetAlert.loading('Deleting...', 'Please wait while we delete the role.');
      await rulesAndPermissionsApiService.deleteRole(roleId);
      await loadRoles();
      SweetAlert.close();
      await SweetAlert.success('Deleted!', 'Role has been deleted successfully.');
    } catch (err) {
      SweetAlert.close();
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      setError(errorMessage);
      console.error('Error deleting role:', err);
      await SweetAlert.error('Delete Failed', errorMessage);
    }
  };

  const handleAddPermissionToRole = async () => {
    if (!selectedRole || selectedPermissions.size === 0) {
      setError('Please select at least one permission');
      return;
    }

    try {
      setError(null);
      SweetAlert.loading('Adding...', 'Please wait while we add the permissions.');

      // Add all selected permissions
      const promises = Array.from(selectedPermissions).map((permissionName) =>
        rulesAndPermissionsApiService.addPermissionToRole(selectedRole.id, {
          permissionName,
          resource: permissionToAdd.resource || undefined,
        })
      );

      await Promise.all(promises);

      await loadRoles();
      SweetAlert.close();
      await SweetAlert.success(
        'Added!',
        `${selectedPermissions.size} permission(s) have been added to the role successfully.`
      );
      setSelectedPermissions(new Set());
      setPermissionToAdd({ permissionName: '', resource: '' });
    } catch (err) {
      SweetAlert.close();
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add permission';
      setError(errorMessage);
      console.error('Error adding permission:', err);
      await SweetAlert.error('Add Failed', errorMessage);
    }
  };

  const handlePermissionToggle = (permissionValue: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionValue)) {
        newSet.delete(permissionValue);
      } else {
        newSet.add(permissionValue);
      }
      return newSet;
    });
  };

  const handleRemovePermissionFromRole = async (
    roleId: string,
    permissionId: string,
    permissionName: string
  ) => {
    const result = await SweetAlert.confirm(
      'Remove Permission',
      `Are you sure you want to remove the permission "${permissionName}" from this role?`,
      'Yes, remove it!',
      'Cancel',
      'warning'
    );

    if (!result.isConfirmed) return;

    try {
      setError(null);
      SweetAlert.loading('Removing...', 'Please wait while we remove the permission.');
      await rulesAndPermissionsApiService.removePermissionFromRole(roleId, permissionId);
      await loadRoles();
      SweetAlert.close();
      await SweetAlert.success(
        'Removed!',
        'Permission has been removed from the role successfully.'
      );
    } catch (err) {
      SweetAlert.close();
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove permission';
      setError(errorMessage);
      console.error('Error removing permission:', err);
      await SweetAlert.error('Remove Failed', errorMessage);
    }
  };

  const handleAssignRoleToUser = async (roleId: string) => {
    if (!selectedUser) return;

    try {
      setError(null);
      SweetAlert.loading('Assigning...', 'Please wait while we assign the role.');
      await rulesAndPermissionsApiService.assignRoleToUser(selectedUser.id, roleId);
      await loadUsers();
      SweetAlert.close();
      await SweetAlert.success(
        'Assigned!',
        'Role has been assigned to the user successfully.'
      );
      setShowAssignRoleModal(false);
    } catch (err) {
      SweetAlert.close();
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
      setError(errorMessage);
      console.error('Error assigning role:', err);
      await SweetAlert.error('Assign Failed', errorMessage);
    }
  };

  const handleRemoveRoleFromUser = async (userRoleId: string, roleName: string) => {
    const result = await SweetAlert.confirm(
      'Remove Role',
      `Are you sure you want to remove the role "${roleName}" from this user?`,
      'Yes, remove it!',
      'Cancel',
      'warning'
    );

    if (!result.isConfirmed) return;

    if (!selectedUser) return;

    try {
      setError(null);
      SweetAlert.loading('Removing...', 'Please wait while we remove the role.');
      await rulesAndPermissionsApiService.removeRoleFromUser(selectedUser.id, userRoleId);
      await loadUsers();
      SweetAlert.close();
      await SweetAlert.success(
        'Removed!',
        'Role has been removed from the user successfully.'
      );
    } catch (err) {
      SweetAlert.close();
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove role';
      setError(errorMessage);
      console.error('Error removing role:', err);
      await SweetAlert.error('Remove Failed', errorMessage);
    }
  };

  // Get all unique permissions from existing roles
  const getAvailablePermissionsFromRoles = () => {
    const permissionMap = new Map<
      string,
      { permissionName: string; resource?: string }
    >();

    roles.forEach((role) => {
      role.permissions.forEach((perm) => {
        // Create a unique key for permission name + resource combination
        const key = perm.resource
          ? `${perm.permissionName}::${perm.resource}`
          : perm.permissionName;

        if (!permissionMap.has(key)) {
          permissionMap.set(key, {
            permissionName: perm.permissionName,
            resource: perm.resource || undefined,
          });
        }
      });
    });

    // Convert to array of {value, label, resource} for dropdown
    return Array.from(permissionMap.values())
      .map((perm) => {
        const label = perm.resource
          ? `${perm.permissionName} (${perm.resource})`
          : perm.permissionName;

        return {
          value: perm.permissionName,
          label: label,
          resource: perm.resource,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  // Get all permissions for a user (direct + from roles)
  const getUserAllPermissions = (user: User) => {
    const permissionMap = new Map<
      string,
      {
        permissionName: string;
        resource?: string;
        source: 'direct' | 'role';
        roleName?: string;
      }
    >();

    // Add direct user permissions
    user.permissions
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
          });
        }
      });

    // Add permissions from user's roles
    user.roles
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
              // Note: If permission exists from both direct and role, we keep the direct one
              // and mark it as 'direct' (can be revoked). Role permissions are additive.
            });
        }
      });

    return Array.from(permissionMap.values()).sort((a, b) =>
      a.permissionName.localeCompare(b.permissionName)
    );
  };

  const openGrantModal = (user: User) => {
    setSelectedUser(user);
    setPermissionForm({ permissionName: '', resource: '', description: '' });
    setShowGrantModal(true);
    // Ensure roles are loaded to get permissions
    if (roles.length === 0) {
      loadRoles();
    }
  };

  const closeGrantModal = () => {
    setShowGrantModal(false);
    setSelectedUser(null);
    setPermissionForm({ permissionName: '', resource: '', description: '' });
  };

  const openCreateRoleModal = () => {
    setRoleForm({ name: '', displayName: '', description: '' });
    setShowCreateRoleModal(true);
  };

  const closeCreateRoleModal = () => {
    setShowCreateRoleModal(false);
    setRoleForm({ name: '', displayName: '', description: '' });
  };

  const openEditRoleModal = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
    });
    setShowEditRoleModal(true);
  };

  const closeEditRoleModal = () => {
    setShowEditRoleModal(false);
    setSelectedRole(null);
    setRoleForm({ name: '', displayName: '', description: '' });
  };

  const openManagePermissionsModal = (role: Role) => {
    setSelectedRole(role);
    setPermissionToAdd({ permissionName: '', resource: '' });

    // Pre-select permissions that are already assigned to this role
    const existingPermissionNames = new Set<string>();
    if (role.permissions && role.permissions.length > 0) {
      role.permissions.forEach((perm) => {
        const permName = perm.permissionName;
        if (permName) {
          existingPermissionNames.add(permName);
        }
      });
    }

    setSelectedPermissions(existingPermissionNames);
    setShowManagePermissionsModal(true);
  };

  const closeManagePermissionsModal = () => {
    setShowManagePermissionsModal(false);
    setSelectedRole(null);
    setPermissionToAdd({ permissionName: '', resource: '' });
    setSelectedPermissions(new Set());
  };

  const openAssignRoleModal = (user: User) => {
    setSelectedUser(user);
    setShowAssignRoleModal(true);
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Define columns for Users DataTable
  const userColumns: ColumnConfig<User>[] = [
    {
      field: 'email',
      header: 'Email',
      sortable: true,
      width: '250px',
      minWidth: '250px',
      render: (value) => (
        <Typography
          fontSize="xs"
          color="mukuru.text.primary"
          fontWeight="medium"
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={(value as string) || 'N/A'}
        >
          {(value as string) || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'name',
      header: 'Name',
      sortable: true,
      width: '200px',
      minWidth: '200px',
      render: (value) => (
        <Typography
          fontSize="xs"
          color="mukuru.text.primary"
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={(value as string) || 'N/A'}
        >
          {(value as string) || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'roles',
      header: 'Roles',
      sortable: false,
      width: '120px',
      minWidth: '120px',
      render: (value, row) => {
        const rolesCount = row.roles?.length || 0;
        return (
          <Tag variant="info" size="md" style={{ fontSize: '10px', padding: '1px 6px' }}>
            {rolesCount} {rolesCount === 1 ? 'Role' : 'Roles'}
          </Tag>
        );
      },
    },
    {
      field: 'permissions',
      header: 'Permissions',
      sortable: false,
      width: '120px',
      minWidth: '120px',
      render: (value, row) => {
        const permissionsCount = row.permissions?.length || 0;
        return (
          <Tag variant="info" size="md" style={{ fontSize: '10px', padding: '1px 6px' }}>
            {permissionsCount} {permissionsCount === 1 ? 'Permission' : 'Permissions'}
          </Tag>
        );
      },
    },
    {
      field: 'lastLoginAt',
      header: 'Last Login',
      sortable: true,
      width: '150px',
      minWidth: '150px',
      render: (value) => (
        <Typography fontSize="xs" color="mukuru.grey.medium">
          {value
            ? new Date(value as string).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Never'}
        </Typography>
      ),
    },
    {
      field: 'firstLoginAt',
      header: 'First Login',
      sortable: true,
      width: '150px',
      minWidth: '150px',
      render: (value) => (
        <Typography fontSize="xs" color="mukuru.grey.medium">
          {value
            ? new Date(value as string).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Never'}
        </Typography>
      ),
    },
  ];

  // Mukuru theme colors (matching work-queue page)
  const bgColorNew = 'mukuru.grey.100';
  const cardBgNew = 'mukuru.white';
  const borderColorNew = 'mukuru.stroke';

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
        <Box px="24px" pt="24px" pb="16px" bg={cardBgNew}>
          <Flex justify="space-between" align="center">
            <VStack align="start" gap="2px">
              <Typography fontSize="24px" fontWeight="700" color={textColor}>
                Roles and Permissions
              </Typography>
              <Typography fontSize="14px" color="mukuru.grey.600">
                Manage roles, permissions, and user access
              </Typography>
            </VStack>
          </Flex>
        </Box>

        {/* Tab Filters */}
        <Box
          px="24px"
          bg={cardBgNew}
          borderBottom="1px solid"
          borderColor={borderColorNew}
        >
          {error && (
            <Box mb="12px">
              <AlertBar status="error" title="Error" description={error} />
            </Box>
          )}
          <TabsRoot
            value={activeTab}
            onValueChange={(details) => setActiveTab(details.value as 'roles' | 'users')}
          >
            <TabsList>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsIndicator />
            </TabsList>
          </TabsRoot>
        </Box>

        {/* Search Row */}
        <Box
          px="24px"
          py="12px"
          bg={cardBgNew}
          borderBottom="1px solid"
          borderColor={borderColorNew}
        >
          <Flex justify="space-between" align="center">
            <Box maxW="400px" flex="1">
              <Search
                placeholder={
                  activeTab === 'roles'
                    ? 'Search roles...'
                    : 'Search users by email or name...'
                }
                onSearchChange={(query) => setSearchTerm(query)}
              />
            </Box>
            {activeTab === 'roles' && (
              <Button variant="primary" size="md" onClick={openCreateRoleModal}>
                <IconWrapper>
                  <FiPlus size={16} />
                </IconWrapper>
                Create Role
              </Button>
            )}
          </Flex>
        </Box>

        {/* Content Section */}
        <Box px="24px" py="20px" bg={bgColorNew}>
          {activeTab === 'roles' && (
            <>
              {rolesLoading ? (
                <Flex justify="center" align="center" h="200px">
                  <Spinner size="xl" color="#F05423" />
                </Flex>
              ) : filteredRoles.length === 0 ? (
                <Box
                  bg={cardBgNew}
                  borderRadius="8px"
                  border="1px solid"
                  borderColor={borderColorNew}
                  p="48px"
                  textAlign="center"
                >
                  <VStack gap="8px">
                    <FiShield size={32} color="#9CA3AF" />
                    <Typography fontSize="14px" color="#6B7280">
                      No roles found
                    </Typography>
                  </VStack>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, lg: 2 }} gap="16px">
                  {filteredRoles.map((role) => (
                    <Box
                      key={role.id}
                      bg={cardBgNew}
                      borderRadius="8px"
                      border="1px solid"
                      borderColor={borderColorNew}
                      overflow="hidden"
                      _hover={{ boxShadow: 'sm', borderColor: '#F05423' }}
                      transition="all 0.2s"
                      display="flex"
                      flexDirection="column"
                    >
                      {/* Card Header */}
                      <Box px="20px" py="16px">
                        <Flex justify="space-between" align="flex-start" gap="16px">
                          <VStack align="start" gap="2px" flex="1" minW={0}>
                            <Typography fontSize="15px" fontWeight="600" color="#111827">
                              {role.displayName}
                            </Typography>
                            <Typography
                              fontSize="11px"
                              color="#9CA3AF"
                              style={{ fontFamily: 'monospace' }}
                            >
                              {role.name}
                            </Typography>
                            {role.description && (
                              <Typography
                                fontSize="12px"
                                color="#6B7280"
                                mt="6px"
                                lineHeight="1.4"
                              >
                                {role.description}
                              </Typography>
                            )}
                          </VStack>
                          <Box
                            px="10px"
                            py="4px"
                            bg={role.isActive ? '#ECFDF5' : '#FEF2F2'}
                            borderRadius="4px"
                            flexShrink={0}
                          >
                            <Typography
                              fontSize="11px"
                              fontWeight="600"
                              color={role.isActive ? '#059669' : '#DC2626'}
                            >
                              {role.isActive ? 'Active' : 'Inactive'}
                            </Typography>
                          </Box>
                        </Flex>
                      </Box>

                      {/* Permissions Section */}
                      <Box
                        px="20px"
                        py="14px"
                        bg="#F9FAFB"
                        borderTop="1px solid"
                        borderColor="#F0F0F0"
                        flex="1"
                      >
                        <Typography
                          fontSize="12px"
                          fontWeight="600"
                          color="#374151"
                          mb="10px"
                        >
                          Permissions ({role.permissions.length})
                        </Typography>
                        {role.permissions.length === 0 ? (
                          <Typography fontSize="11px" color="#9CA3AF" fontStyle="italic">
                            No permissions assigned
                          </Typography>
                        ) : (
                          <Flex gap="6px" wrap="wrap">
                            {role.permissions.slice(0, 6).map((permission) => (
                              <Box
                                key={permission.id}
                                px="8px"
                                py="3px"
                                bg="#FFF7ED"
                                border="1px solid #FED7AA"
                                borderRadius="4px"
                              >
                                <Typography
                                  fontSize="10px"
                                  fontWeight="500"
                                  color="#C2410C"
                                  whiteSpace="nowrap"
                                >
                                  {permission.permissionName}
                                </Typography>
                              </Box>
                            ))}
                            {role.permissions.length > 6 && (
                              <Box px="8px" py="3px" bg="#F3F4F6" borderRadius="4px">
                                <Typography
                                  fontSize="10px"
                                  fontWeight="500"
                                  color="#6B7280"
                                >
                                  +{role.permissions.length - 6} more
                                </Typography>
                              </Box>
                            )}
                          </Flex>
                        )}
                      </Box>

                      {/* Card Footer */}
                      <Box
                        px="20px"
                        py="12px"
                        borderTop="1px solid"
                        borderColor="#F0F0F0"
                        bg={cardBgNew}
                      >
                        <Flex gap="8px" justify="flex-end" align="center">
                          <button
                            onClick={() => openManagePermissionsModal(role)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '7px 14px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: '#F05423',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <span style={{ color: '#FFFFFF' }}>Manage Permissions</span>
                          </button>
                          <button
                            onClick={() => openEditRoleModal(role)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: '#374151',
                              background: 'white',
                              border: '1px solid #E5E7EB',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <FiEdit3 size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id, role.displayName)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              background: '#FEF2F2',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <FiTrash2 size={14} color="#DC2626" />
                          </button>
                        </Flex>
                      </Box>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </>
          )}

          {activeTab === 'users' && (
            <>
              {usersLoading ? (
                <Flex justify="center" align="center" h="200px">
                  <Spinner size="xl" color="#F05423" />
                </Flex>
              ) : (
                <Box
                  bg={cardBgNew}
                  borderRadius="8px"
                  border="1px solid"
                  borderColor={borderColorNew}
                  overflow="hidden"
                  className="users-table-card"
                >
                  <style>{`
                    .users-table-card table {
                      width: 100% !important;
                      border-collapse: collapse !important;
                      table-layout: auto !important;
                    }
                    .users-table-card thead {
                      background: #FAFAFA !important;
                    }
                    .users-table-card thead th {
                      font-size: 11px !important;
                      font-weight: 600 !important;
                      padding: 14px 16px !important;
                      text-transform: uppercase !important;
                      letter-spacing: 0.5px !important;
                      color: #666 !important;
                      border-bottom: 1px solid #E0E0E0 !important;
                      white-space: nowrap !important;
                    }
                    .users-table-card thead th * {
                      background: none !important;
                      border: none !important;
                      padding: 0 !important;
                      margin: 0 !important;
                    }
                    .users-table-card tbody tr {
                      border-bottom: 1px solid #F0F0F0 !important;
                    }
                    .users-table-card tbody tr:hover {
                      background-color: #FAFAFA !important;
                    }
                    .users-table-card tbody td {
                      padding: 12px 16px !important;
                      font-size: 13px !important;
                      color: #333 !important;
                    }
                  `}</style>
                  <DataTable
                    data={filteredUsers as unknown as Record<string, unknown>[]}
                    columns={
                      userColumns as unknown as ColumnConfig<Record<string, unknown>>[]
                    }
                    onRowClick={(row, _index) => {
                      const user = row as unknown as User;
                      router.push(`/roles-and-permissions/users/${user.id}`);
                    }}
                    emptyState={{
                      message: searchTerm
                        ? 'No users match your search criteria'
                        : 'No users found',
                    }}
                  />
                </Box>
              )}
            </>
          )}

          {/* Create Role Modal */}
          {showCreateRoleModal && (
            <Box
              position="fixed"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="rgba(0, 0, 0, 0.6)"
              zIndex="1000"
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={closeCreateRoleModal}
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <Box
                bg="var(--mukuru-cards-white)"
                borderRadius="xl"
                p="6"
                maxW="500px"
                width="90%"
                onClick={(e) => e.stopPropagation()}
                boxShadow="xl"
              >
                <VStack gap="4" align="stretch">
                  <HStack justify="space-between" align="center">
                    <Typography
                      fontSize="xl"
                      fontWeight="bold"
                      color="var(--mukuru-text-primary)"
                    >
                      Create Role
                    </Typography>
                    <Button variant="ghost" size="sm" onClick={closeCreateRoleModal}>
                      <IconWrapper>
                        <FiX size={16} />
                      </IconWrapper>
                    </Button>
                  </HStack>

                  <Field.Root required>
                    <Field.Label color="var(--mukuru-text-primary)" fontWeight="medium">
                      Role Name (Internal)
                    </Field.Label>
                    <Input
                      placeholder="e.g., admin, reviewer"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      color="var(--mukuru-text-primary)"
                    />
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label color="var(--mukuru-text-primary)" fontWeight="medium">
                      Display Name
                    </Field.Label>
                    <Input
                      placeholder="e.g., Administrator, Reviewer"
                      value={roleForm.displayName}
                      onChange={(e) =>
                        setRoleForm({ ...roleForm, displayName: e.target.value })
                      }
                      color="var(--mukuru-text-primary)"
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color="var(--mukuru-text-primary)" fontWeight="medium">
                      Description (Optional)
                    </Field.Label>
                    <Textarea
                      placeholder="Describe what this role allows..."
                      value={roleForm.description}
                      onChange={(e) =>
                        setRoleForm({ ...roleForm, description: e.target.value })
                      }
                      rows={3}
                      color="var(--mukuru-text-primary)"
                      _placeholder={{ color: 'var(--mukuru-text-input)' }}
                    />
                  </Field.Root>

                  <HStack gap="3" justify="flex-end" mt="4">
                    <Button variant="ghost" onClick={closeCreateRoleModal}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleCreateRole}>
                      Create Role
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </Box>
          )}

          {/* Edit Role Modal */}
          {showEditRoleModal && selectedRole && (
            <Box
              position="fixed"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="rgba(0, 0, 0, 0.6)"
              zIndex="1000"
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={closeEditRoleModal}
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <Box
                bg="var(--mukuru-cards-white)"
                borderRadius="xl"
                p="6"
                maxW="500px"
                width="90%"
                onClick={(e) => e.stopPropagation()}
                boxShadow="xl"
              >
                <VStack gap="4" align="stretch">
                  <HStack justify="space-between" align="center">
                    <Typography
                      fontSize="xl"
                      fontWeight="bold"
                      color="var(--mukuru-text-primary)"
                    >
                      Edit Role
                    </Typography>
                    <Button variant="ghost" size="sm" onClick={closeEditRoleModal}>
                      <IconWrapper>
                        <FiX size={16} />
                      </IconWrapper>
                    </Button>
                  </HStack>

                  <Field.Root required>
                    <Field.Label color="var(--mukuru-text-primary)" fontWeight="medium">
                      Display Name
                    </Field.Label>
                    <Input
                      value={roleForm.displayName}
                      onChange={(e) =>
                        setRoleForm({ ...roleForm, displayName: e.target.value })
                      }
                      color="var(--mukuru-text-primary)"
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color="var(--mukuru-text-primary)" fontWeight="medium">
                      Description (Optional)
                    </Field.Label>
                    <Textarea
                      value={roleForm.description}
                      onChange={(e) =>
                        setRoleForm({ ...roleForm, description: e.target.value })
                      }
                      rows={3}
                      color="var(--mukuru-text-primary)"
                    />
                  </Field.Root>

                  <HStack gap="3" justify="flex-end" mt="4">
                    <Button variant="ghost" onClick={closeEditRoleModal}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleUpdateRole}>
                      Update Role
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </Box>
          )}

          {/* Manage Permissions Modal */}
          {showManagePermissionsModal && selectedRole && (
            <Box
              position="fixed"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="rgba(0, 0, 0, 0.6)"
              zIndex={9999}
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={closeManagePermissionsModal}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <Box
                bg="var(--mukuru-cards-white)"
                borderRadius="xl"
                p="6"
                maxW="800px"
                maxH="90vh"
                width="90%"
                onClick={(e) => e.stopPropagation()}
                boxShadow="xl"
                overflowY="auto"
                style={{
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  zIndex: 10000,
                }}
              >
                <VStack gap="4" align="stretch">
                  <HStack justify="space-between" align="center">
                    <Typography
                      fontSize="xl"
                      fontWeight="bold"
                      color="var(--mukuru-text-primary)"
                    >
                      Manage Permissions - {selectedRole.displayName}
                    </Typography>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeManagePermissionsModal}
                    >
                      <IconWrapper>
                        <FiX size={16} />
                      </IconWrapper>
                    </Button>
                  </HStack>

                  <Box>
                    <Typography
                      fontSize="sm"
                      fontWeight="bold"
                      mb="3"
                      style={{
                        color: 'var(--mukuru-text-primary)',
                        fontSize: '14px',
                        fontWeight: '600',
                        WebkitTextFillColor: 'var(--mukuru-text-primary)',
                      }}
                    >
                      Current Permissions ({selectedRole.permissions.length}):
                    </Typography>
                    {selectedRole.permissions.length === 0 ? (
                      <Box
                        p="4"
                        bg="var(--mukuru-state-hover)"
                        borderRadius="md"
                        border="1px"
                        borderColor="var(--mukuru-grey-light)"
                        mb="4"
                      >
                        <Typography
                          style={{
                            color: 'var(--mukuru-text-primary)',
                            fontSize: '14px',
                            WebkitTextFillColor: 'var(--mukuru-text-primary)',
                          }}
                        >
                          No permissions assigned
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        maxH="250px"
                        overflowY="auto"
                        border="1px"
                        borderColor="var(--mukuru-grey-light)"
                        borderRadius="md"
                        p="3"
                        bg="var(--mukuru-cards-white)"
                        mb="4"
                        className="current-permissions-list"
                        style={{
                          maxHeight: '250px',
                          overflowY: 'auto',
                          backgroundColor: 'var(--mukuru-cards-white)',
                          border: '1px solid var(--mukuru-grey-light)',
                          color: 'var(--mukuru-text-primary)',
                        }}
                      >
                        <SimpleGrid columns={2} gap="2">
                          {selectedRole.permissions.map((permission) => (
                            <HStack
                              key={permission.id}
                              justify="space-between"
                              p="2.5"
                              bg="var(--mukuru-state-hover)"
                              borderRadius="md"
                              border="1px"
                              borderColor="var(--mukuru-grey-light)"
                              _hover={{
                                bg: 'var(--mukuru-state-hover)',
                                borderColor: 'var(--mukuru-primary)',
                              }}
                              transition="all 0.2s"
                              data-permission-item
                              style={{
                                backgroundColor: 'var(--mukuru-state-hover)',
                                border: '1px solid var(--mukuru-grey-light)',
                                padding: '10px',
                                color: 'var(--mukuru-text-primary)',
                              }}
                            >
                              <Box
                                flex="1"
                                style={{ color: 'var(--mukuru-text-primary)' }}
                              >
                                <span
                                  style={{
                                    color: 'var(--mukuru-text-primary) !important',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    lineHeight: '20px',
                                    WebkitTextFillColor:
                                      'var(--mukuru-text-primary) !important',
                                    display: 'block',
                                    fontFamily: 'inherit',
                                  }}
                                >
                                  {permission.permissionName || 'Unnamed Permission'}
                                  {permission.resource && (
                                    <span
                                      style={{
                                        color: 'var(--mukuru-text-primary) !important',
                                        fontSize: '11px',
                                        marginLeft: '6px',
                                        fontWeight: '400',
                                        opacity: '0.7',
                                        WebkitTextFillColor:
                                          'var(--mukuru-text-primary) !important',
                                        fontFamily: 'inherit',
                                      }}
                                    >
                                      ({permission.resource})
                                    </span>
                                  )}
                                </span>
                              </Box>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePermissionFromRole(
                                    selectedRole.id,
                                    permission.id,
                                    permission.permissionName
                                  );
                                }}
                                minW="auto"
                                p="1"
                                _hover={{ bg: 'var(--mukuru-state-hover-card)' }}
                                style={{
                                  minWidth: 'auto',
                                  padding: '4px',
                                  backgroundColor: 'transparent',
                                }}
                              >
                                <IconWrapper>
                                  <FiX size={14} color="var(--mukuru-text-error-dark)" />
                                </IconWrapper>
                              </Button>
                            </HStack>
                          ))}
                        </SimpleGrid>
                      </Box>
                    )}
                  </Box>

                  <Box
                    borderTop="2px"
                    borderColor="var(--mukuru-grey-light)"
                    pt="6"
                    mt="6"
                  >
                    <Typography
                      fontSize="md"
                      fontWeight="bold"
                      color="var(--mukuru-text-primary)"
                      mb="4"
                    >
                      Add Permissions
                    </Typography>

                    <Field.Root mb="4">
                      <Field.Label>Resource (Optional)</Field.Label>
                      <select
                        value={permissionToAdd.resource}
                        onChange={(e) =>
                          setPermissionToAdd({
                            ...permissionToAdd,
                            resource: e.target.value,
                          })
                        }
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '14px',
                          borderRadius: '6px',
                          border: '1px solid var(--mukuru-grey-light)',
                          backgroundColor: 'var(--mukuru-cards-white)',
                          color: 'var(--mukuru-text-primary)',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          appearance: 'none',
                        }}
                      >
                        <option
                          value=""
                          style={{
                            color: 'var(--mukuru-text-primary)',
                            backgroundColor: 'var(--mukuru-cards-white)',
                          }}
                        >
                          None
                        </option>
                        {AVAILABLE_RESOURCES.map((resource) => (
                          <option
                            key={resource.value}
                            value={resource.value}
                            style={{
                              color: 'var(--mukuru-text-primary)',
                              backgroundColor: 'var(--mukuru-cards-white)',
                            }}
                          >
                            {resource.label}
                          </option>
                        ))}
                      </select>
                    </Field.Root>

                    <Box
                      maxH="450px"
                      overflowY="auto"
                      border="1px"
                      borderColor="var(--mukuru-grey-light)"
                      borderRadius="lg"
                      p="5"
                      bg="var(--mukuru-cards-white)"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor:
                          'var(--mukuru-grey-light) var(--mukuru-state-hover)',
                      }}
                    >
                      <VStack gap="5" align="stretch">
                        {PERMISSION_CATEGORIES.map((category) => (
                          <Box key={category.category}>
                            <Typography
                              fontSize="sm"
                              fontWeight="bold"
                              color="var(--mukuru-text-primary)"
                              mb="3"
                              style={{
                                fontSize: '13px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                color: 'var(--mukuru-grey-medium)',
                              }}
                            >
                              {category.category}
                            </Typography>
                            <SimpleGrid columns={2} gap="3">
                              {category.permissions.map((perm) => {
                                // Check if this permission is already assigned to the role
                                const isAlreadyAssigned =
                                  selectedRole?.permissions?.some((rolePerm) => {
                                    const rolePermName = rolePerm.permissionName;
                                    return rolePermName === perm.value;
                                  }) || false;

                                // Check if it's selected for adding (but not yet saved)
                                const isSelectedForAdding = selectedPermissions.has(
                                  perm.value
                                );

                                // Checkbox should be checked if it's already assigned OR selected for adding
                                const isChecked =
                                  isAlreadyAssigned || isSelectedForAdding;

                                return (
                                  <HStack
                                    key={perm.value}
                                    gap="3"
                                    align="start"
                                    p="3"
                                    borderRadius="lg"
                                    bg={
                                      isAlreadyAssigned
                                        ? 'var(--mukuru-state-hover-card)'
                                        : 'var(--mukuru-cards-white)'
                                    }
                                    border={
                                      isAlreadyAssigned
                                        ? '2px solid var(--mukuru-primary)'
                                        : '1px solid var(--mukuru-grey-light)'
                                    }
                                    _hover={
                                      isAlreadyAssigned
                                        ? { bg: 'var(--mukuru-state-hover-card)' }
                                        : {
                                            bg: 'var(--mukuru-state-hover)',
                                            borderColor: 'var(--mukuru-grey-medium)',
                                          }
                                    }
                                    transition="all 0.2s"
                                    style={{
                                      boxShadow: isAlreadyAssigned
                                        ? '0 1px 3px 0 rgba(240, 84, 35, 0.1)'
                                        : 'none',
                                    }}
                                  >
                                    <Box
                                      flexShrink={0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isAlreadyAssigned) {
                                          handlePermissionToggle(perm.value);
                                        }
                                      }}
                                      style={{
                                        paddingTop: '2px',
                                        cursor: isAlreadyAssigned ? 'default' : 'pointer',
                                        pointerEvents: 'auto',
                                        position: 'relative',
                                        zIndex: 10,
                                      }}
                                    >
                                      <Checkbox.Root
                                        checked={isChecked}
                                        onCheckedChange={(_details) => {
                                          if (!isAlreadyAssigned) {
                                            handlePermissionToggle(perm.value);
                                          }
                                        }}
                                        colorScheme="orange"
                                        id={`permission-checkbox-${perm.value}`}
                                        name={`permission-checkbox-${perm.value}`}
                                        value={perm.value}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!isAlreadyAssigned) {
                                            handlePermissionToggle(perm.value);
                                          }
                                        }}
                                        style={{
                                          cursor: isAlreadyAssigned
                                            ? 'default'
                                            : 'pointer',
                                          pointerEvents: 'auto',
                                          position: 'relative',
                                          zIndex: 11,
                                        }}
                                      >
                                        <Checkbox.Control
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isAlreadyAssigned) {
                                              handlePermissionToggle(perm.value);
                                            }
                                          }}
                                          style={{
                                            backgroundColor: isChecked
                                              ? 'var(--mukuru-primary)'
                                              : 'var(--mukuru-cards-white)',
                                            borderColor: isChecked
                                              ? 'var(--mukuru-primary)'
                                              : 'var(--mukuru-grey-light)',
                                            borderWidth: '2px',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '4px',
                                            cursor: isAlreadyAssigned
                                              ? 'default'
                                              : 'pointer',
                                            pointerEvents: 'auto',
                                            position: 'relative',
                                            zIndex: 12,
                                          }}
                                        >
                                          <Checkbox.Indicator
                                            style={{
                                              color: 'var(--mukuru-text-inverse)',
                                              fontSize: '14px',
                                              fontWeight: 'bold',
                                            }}
                                          >
                                            ✓
                                          </Checkbox.Indicator>
                                        </Checkbox.Control>
                                      </Checkbox.Root>
                                    </Box>
                                    <Box
                                      flex="1"
                                      onClick={(e) => {
                                        if (!isAlreadyAssigned) {
                                          e.stopPropagation();
                                          handlePermissionToggle(perm.value);
                                        }
                                      }}
                                      style={{
                                        cursor: isAlreadyAssigned ? 'default' : 'pointer',
                                        pointerEvents: 'auto',
                                      }}
                                    >
                                      <Typography
                                        fontSize="sm"
                                        cursor={isAlreadyAssigned ? 'default' : 'pointer'}
                                        style={{
                                          color: isAlreadyAssigned
                                            ? 'var(--mukuru-primary)'
                                            : 'var(--mukuru-text-primary)',
                                          fontWeight: isAlreadyAssigned ? '600' : '500',
                                          pointerEvents: 'auto',
                                          lineHeight: '1.5',
                                        }}
                                      >
                                        {perm.label}
                                        {isAlreadyAssigned && (
                                          <span
                                            style={{
                                              color: 'var(--mukuru-primary)',
                                              fontSize: '11px',
                                              marginLeft: '8px',
                                              fontWeight: '600',
                                              backgroundColor:
                                                'var(--mukuru-state-hover-card)',
                                              padding: '3px 8px',
                                              borderRadius: '6px',
                                              border: '1px solid var(--mukuru-primary)',
                                            }}
                                          >
                                            ✓ Assigned
                                          </span>
                                        )}
                                      </Typography>
                                    </Box>
                                  </HStack>
                                );
                              })}
                            </SimpleGrid>
                            <Box
                              borderTop="1px"
                              borderColor="var(--mukuru-grey-light)"
                              mt="3"
                            />
                          </Box>
                        ))}
                      </VStack>
                    </Box>

                    <Box
                      bg="var(--mukuru-state-hover)"
                      borderRadius="lg"
                      p="4"
                      mb="4"
                      border="1px"
                      borderColor="var(--mukuru-grey-light)"
                    >
                      <Typography
                        fontSize="sm"
                        color="var(--mukuru-grey-medium)"
                        fontWeight="500"
                      >
                        {selectedPermissions.size > 0 ? (
                          <span
                            style={{
                              color: 'var(--mukuru-primary)',
                              fontWeight: '600',
                            }}
                          >
                            {selectedPermissions.size} permission
                            {selectedPermissions.size !== 1 ? 's' : ''} selected
                          </span>
                        ) : (
                          'No permissions selected'
                        )}
                      </Typography>
                    </Box>

                    <Button
                      variant="primary"
                      onClick={handleAddPermissionToRole}
                      disabled={selectedPermissions.size === 0}
                      width="full"
                    >
                      <Typography as="span" fontWeight="600">
                        Add{' '}
                        {selectedPermissions.size > 0
                          ? `${selectedPermissions.size} `
                          : ''}
                        Permission{selectedPermissions.size !== 1 ? 's' : ''}
                      </Typography>
                    </Button>
                  </Box>

                  <HStack gap="3" justify="flex-end" mt="4">
                    <Button variant="primary" onClick={closeManagePermissionsModal}>
                      <Typography as="span" fontWeight="600">
                        Close
                      </Typography>
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </Box>
          )}

          {/* Assign Role Modal */}
          {showAssignRoleModal && selectedUser && (
            <Box
              position="fixed"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="rgba(0, 0, 0, 0.6)"
              zIndex={9999}
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={() => setShowAssignRoleModal(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <Box
                bg="var(--mukuru-cards-white)"
                borderRadius="xl"
                p="8"
                maxW="700px"
                maxH="90vh"
                width="90%"
                onClick={(e) => e.stopPropagation()}
                boxShadow="2xl"
                overflowY="auto"
                style={{
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  zIndex: 10000,
                }}
              >
                <VStack gap="6" align="stretch">
                  <HStack
                    justify="space-between"
                    align="center"
                    pb="4"
                    borderBottom="2px"
                    borderColor="var(--mukuru-grey-light)"
                  >
                    <Typography
                      fontSize="2xl"
                      fontWeight="bold"
                      color="var(--mukuru-text-primary)"
                    >
                      Assign Role
                    </Typography>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAssignRoleModal(false)}
                      style={{
                        minWidth: 'auto',
                        padding: '8px',
                      }}
                      _hover={{ bg: 'var(--mukuru-state-hover)' }}
                    >
                      <IconWrapper>
                        <FiX size={20} color="var(--mukuru-grey-medium)" />
                      </IconWrapper>
                    </Button>
                  </HStack>

                  <Box
                    bg="var(--mukuru-state-hover-card)"
                    borderRadius="lg"
                    p="4"
                    border="1px"
                    borderColor="var(--mukuru-primary)"
                  >
                    <HStack gap="3" align="center">
                      <Box
                        bg="var(--mukuru-primary)"
                        borderRadius="full"
                        p="2"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <IconWrapper>
                          <FiMail size={18} color="var(--mukuru-text-inverse)" />
                        </IconWrapper>
                      </Box>
                      <VStack align="start" gap="0">
                        <Typography
                          fontSize="xs"
                          color="var(--mukuru-text-alert)"
                          fontWeight="600"
                          textTransform="uppercase"
                          letterSpacing="0.5px"
                        >
                          User
                        </Typography>
                        <Typography
                          fontWeight="700"
                          fontSize="md"
                          color="var(--mukuru-text-primary)"
                        >
                          {selectedUser.email}
                        </Typography>
                        {selectedUser.name && (
                          <Typography
                            fontSize="sm"
                            color="var(--mukuru-grey-medium)"
                            mt="0.5"
                          >
                            {selectedUser.name}
                          </Typography>
                        )}
                      </VStack>
                    </HStack>
                  </Box>

                  <Box>
                    <HStack justify="space-between" align="center" mb="4">
                      <Typography
                        fontSize="sm"
                        fontWeight="bold"
                        color="var(--mukuru-text-primary)"
                        textTransform="uppercase"
                        letterSpacing="0.5px"
                      >
                        Available Roles
                      </Typography>
                      <Tag
                        style={{
                          backgroundColor: 'var(--mukuru-state-hover-card)',
                          color: 'var(--mukuru-text-primary)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: '1px solid var(--mukuru-primary)',
                        }}
                      >
                        {
                          roles.filter(
                            (r) =>
                              r.isActive &&
                              !selectedUser.roles.some((ur) => ur.roleId === r.id)
                          ).length
                        }{' '}
                        available
                      </Tag>
                    </HStack>
                    {roles.filter(
                      (r) =>
                        r.isActive && !selectedUser.roles.some((ur) => ur.roleId === r.id)
                    ).length === 0 ? (
                      <Box
                        bg="var(--mukuru-state-hover)"
                        borderRadius="lg"
                        p="6"
                        border="1px dashed var(--mukuru-grey-light)"
                        textAlign="center"
                      >
                        <Typography color="var(--mukuru-grey-medium)" fontSize="sm">
                          No available roles to assign. All roles have been assigned to
                          this user.
                        </Typography>
                      </Box>
                    ) : (
                      <SimpleGrid
                        columns={1}
                        gap="3"
                        maxH="450px"
                        overflowY="auto"
                        pr="2"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor:
                            'var(--mukuru-grey-light) var(--mukuru-state-hover)',
                        }}
                      >
                        {roles
                          .filter(
                            (r) =>
                              r.isActive &&
                              !selectedUser.roles.some((ur) => ur.roleId === r.id)
                          )
                          .map((role) => (
                            <Box
                              key={role.id}
                              bg="var(--mukuru-cards-white)"
                              borderRadius="xl"
                              p="5"
                              border="2px"
                              borderColor="var(--mukuru-grey-light)"
                              cursor="pointer"
                              position="relative"
                              _hover={{
                                borderColor: 'var(--mukuru-primary)',
                                bg: 'var(--mukuru-state-hover-card)',
                                boxShadow: '0 4px 6px -1px rgba(240, 84, 35, 0.1)',
                              }}
                              transition="all 0.2s ease"
                              onClick={() => handleAssignRoleToUser(role.id)}
                            >
                              <Flex justify="space-between" align="start" gap="4">
                                <VStack align="start" gap="2" flex="1" minW="0">
                                  <Typography
                                    fontWeight="700"
                                    fontSize="lg"
                                    color="var(--mukuru-text-primary)"
                                    lineHeight="1.3"
                                  >
                                    {role.displayName}
                                  </Typography>
                                  {role.description && (
                                    <Typography
                                      fontSize="sm"
                                      color="var(--mukuru-grey-medium)"
                                      lineHeight="1.5"
                                    >
                                      {role.description}
                                    </Typography>
                                  )}
                                  <HStack gap="2" mt="2" wrap="wrap">
                                    <Tag
                                      style={{
                                        backgroundColor: 'var(--mukuru-state-hover-card)',
                                        color: 'var(--mukuru-text-primary)',
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        border: '1px solid var(--mukuru-primary)',
                                      }}
                                    >
                                      {role.permissions?.length || 0} permissions
                                    </Tag>
                                    <Tag
                                      style={{
                                        backgroundColor: 'var(--mukuru-state-hover)',
                                        color: 'var(--mukuru-grey-medium)',
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        fontFamily: 'monospace',
                                      }}
                                    >
                                      {role.name}
                                    </Tag>
                                  </HStack>
                                </VStack>
                                <Box
                                  bg="var(--mukuru-primary)"
                                  borderRadius="full"
                                  p="3"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  flexShrink={0}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                  }}
                                  _hover={{
                                    bg: 'var(--mukuru-primary)',
                                    opacity: 0.9,
                                    transform: 'scale(1.1)',
                                  }}
                                  transition="all 0.2s"
                                >
                                  <IconWrapper>
                                    <FiPlus
                                      size={20}
                                      color="var(--mukuru-text-inverse)"
                                    />
                                  </IconWrapper>
                                </Box>
                              </Flex>
                            </Box>
                          ))}
                      </SimpleGrid>
                    )}
                  </Box>

                  <HStack
                    gap="3"
                    justify="flex-end"
                    pt="4"
                    borderTop="2px"
                    borderColor="var(--mukuru-grey-light)"
                  >
                    <Button
                      variant="ghost"
                      onClick={() => setShowAssignRoleModal(false)}
                      style={{
                        backgroundColor: 'var(--mukuru-white)',
                        color: 'var(--mukuru-text-primary)',
                        border: '1px solid var(--mukuru-grey-light)',
                        fontWeight: '600',
                        padding: '10px 20px',
                        borderRadius: '8px',
                      }}
                      _hover={{
                        backgroundColor: 'var(--mukuru-state-hover)',
                        borderColor: 'var(--mukuru-grey-medium)',
                      }}
                    >
                      Cancel
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </Box>
          )}

          {/* Grant Permission Modal */}
          {showGrantModal && selectedUser && (
            <Box
              position="fixed"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="rgba(0, 0, 0, 0.6)"
              zIndex="1000"
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={closeGrantModal}
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <Box
                bg="var(--mukuru-cards-white)"
                borderRadius="xl"
                p="6"
                maxW="500px"
                width="90%"
                onClick={(e) => e.stopPropagation()}
                boxShadow="xl"
              >
                <VStack gap="4" align="stretch">
                  <HStack justify="space-between" align="center">
                    <Typography
                      fontSize="xl"
                      fontWeight="bold"
                      color="var(--mukuru-text-primary)"
                    >
                      Grant Permission
                    </Typography>
                    <Button variant="ghost" size="sm" onClick={closeGrantModal}>
                      <IconWrapper>
                        <FiX size={16} />
                      </IconWrapper>
                    </Button>
                  </HStack>

                  <Box>
                    <Typography fontSize="sm" color="var(--mukuru-text-primary)" mb="2">
                      User:
                    </Typography>
                    <Typography
                      fontWeight="medium"
                      fontSize="md"
                      color="var(--mukuru-text-primary)"
                    >
                      {selectedUser.email}
                    </Typography>
                  </Box>

                  <Field.Root required>
                    <Field.Label
                      color="var(--mukuru-text-primary)"
                      fontWeight="medium"
                      style={{
                        textAlign: 'left',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Permission Name
                    </Field.Label>
                    {roles.length === 0 ? (
                      <Box
                        p="4"
                        bg="var(--mukuru-state-hover)"
                        borderRadius="md"
                        border="1px"
                        borderColor="var(--mukuru-grey-light)"
                      >
                        <Typography
                          fontSize="sm"
                          color="var(--mukuru-grey-medium)"
                          style={{ textAlign: 'left' }}
                        >
                          No roles found. Please create a role with permissions first.
                        </Typography>
                      </Box>
                    ) : getAvailablePermissionsFromRoles().length === 0 ? (
                      <Box
                        p="4"
                        bg="var(--mukuru-state-hover)"
                        borderRadius="md"
                        border="1px"
                        borderColor="var(--mukuru-grey-light)"
                      >
                        <Typography
                          fontSize="sm"
                          color="var(--mukuru-grey-medium)"
                          style={{ textAlign: 'left' }}
                        >
                          No permissions found in existing roles. Please add permissions
                          to roles first.
                        </Typography>
                      </Box>
                    ) : (
                      <select
                        value={
                          permissionForm.resource
                            ? `${permissionForm.permissionName}::${permissionForm.resource}`
                            : permissionForm.permissionName
                        }
                        onChange={(e) => {
                          const selected = getAvailablePermissionsFromRoles().find(
                            (p) => {
                              const optionValue = p.resource
                                ? `${p.value}::${p.resource}`
                                : p.value;
                              return optionValue === e.target.value;
                            }
                          );
                          if (selected) {
                            setPermissionForm({
                              permissionName: selected.value,
                              resource: selected.resource || '',
                              description: '',
                            });
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '14px',
                          borderRadius: '6px',
                          border: '1px solid var(--mukuru-grey-light)',
                          backgroundColor: 'var(--mukuru-cards-white)',
                          color: 'var(--mukuru-text-primary)',
                          textAlign: 'left',
                        }}
                      >
                        <option
                          value=""
                          style={{
                            color: 'var(--mukuru-text-primary)',
                            backgroundColor: 'var(--mukuru-cards-white)',
                            textAlign: 'left',
                          }}
                        >
                          Select a permission from existing roles
                        </option>
                        {getAvailablePermissionsFromRoles().map((perm, index) => {
                          const optionValue = perm.resource
                            ? `${perm.value}::${perm.resource}`
                            : perm.value;
                          return (
                            <option
                              key={`${perm.value}-${perm.resource || 'none'}-${index}`}
                              value={optionValue}
                              style={{
                                color: 'var(--mukuru-text-primary)',
                                backgroundColor: 'var(--mukuru-cards-white)',
                                textAlign: 'left',
                              }}
                            >
                              {perm.label}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </Field.Root>

                  <Field.Root>
                    <Field.Label
                      color="var(--mukuru-text-primary)"
                      fontWeight="medium"
                      style={{
                        textAlign: 'left',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Resource (Optional)
                    </Field.Label>
                    <Input
                      placeholder="Resource (auto-filled from selected permission)"
                      value={permissionForm.resource}
                      onChange={(e) =>
                        setPermissionForm({
                          ...permissionForm,
                          resource: e.target.value,
                        })
                      }
                      color="var(--mukuru-text-primary)"
                      style={{ textAlign: 'left' }}
                    />
                    <Typography
                      fontSize="xs"
                      color="var(--mukuru-grey-medium)"
                      mt="1"
                      style={{ textAlign: 'left' }}
                    >
                      Resource is automatically set from the selected permission if
                      available, but can be overridden if needed.
                    </Typography>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label
                      color="var(--mukuru-text-primary)"
                      fontWeight="medium"
                      style={{
                        textAlign: 'left',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Description (Optional)
                    </Field.Label>
                    <Textarea
                      placeholder="Describe what this permission allows..."
                      value={permissionForm.description}
                      onChange={(e) =>
                        setPermissionForm({
                          ...permissionForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      color="var(--mukuru-text-primary)"
                      _placeholder={{ color: 'var(--mukuru-text-input)' }}
                      style={{ textAlign: 'left', resize: 'vertical' }}
                    />
                  </Field.Root>

                  <HStack gap="3" justify="flex-end" mt="4" align="center">
                    <Button
                      variant="ghost"
                      onClick={closeGrantModal}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleGrantPermission}
                      disabled={granting}
                      bg="var(--mukuru-primary)"
                      style={{
                        color: 'var(--mukuru-text-inverse)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {granting ? 'Granting...' : 'Grant Permission'}
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
