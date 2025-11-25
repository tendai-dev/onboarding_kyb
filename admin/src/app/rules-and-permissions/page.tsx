"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Flex,
  Spinner,
  Textarea,
  Field,
  SimpleGrid,
  Tabs,
  Checkbox,
} from "@chakra-ui/react";
import { Search, Typography, Button, Tag, IconWrapper, AlertBar, Modal, ModalHeader, ModalBody, ModalFooter, Input } from "@/lib/mukuruImports";
import { FiLock, FiPlus, FiMail, FiUser, FiX, FiTrash2, FiEdit3, FiShield } from "react-icons/fi";
import AdminSidebar from "../../components/AdminSidebar";
import { useState, useEffect } from "react";
import { 
  rulesAndPermissionsApiService, 
  User, 
  Permission, 
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  AddPermissionToRoleRequest
} from "../../services/rulesAndPermissionsApi";
import { SweetAlert } from "../../utils/sweetAlert";

// Common permissions organized by category
const PERMISSION_CATEGORIES = [
  {
    category: "View Permissions",
    permissions: [
      { value: "view_dashboard", label: "View Dashboard" },
      { value: "view_reports", label: "View Reports" },
      { value: "view_applications", label: "View Applications" },
      { value: "view_work_queue", label: "View Work Queue" },
      { value: "view_messages", label: "View Messages" },
      { value: "view_audit_log", label: "View Audit Log" },
      { value: "view_entity_types", label: "View Entity Types" },
      { value: "view_users", label: "View Users" },
      { value: "view_roles", label: "View Roles" },
      { value: "view_requirements", label: "View Requirements" },
      { value: "view_checklists", label: "View Checklists" },
      { value: "view_notifications", label: "View Notifications" },
      { value: "view_risk_review", label: "View Risk Review" },
      { value: "view_approvals", label: "View Approvals" },
      { value: "view_refreshes", label: "View Refreshes" },
    ]
  },
  {
    category: "Create Permissions",
    permissions: [
      { value: "create_application", label: "Create Application" },
      { value: "create_entity_type", label: "Create Entity Type" },
      { value: "create_requirement", label: "Create Requirement" },
      { value: "create_role", label: "Create Role" },
      { value: "create_user", label: "Create User" },
      { value: "create_checklist", label: "Create Checklist" },
      { value: "create_notification", label: "Create Notification" },
    ]
  },
  {
    category: "Edit Permissions",
    permissions: [
      { value: "edit_application", label: "Edit Application" },
      { value: "edit_entity_type", label: "Edit Entity Type" },
      { value: "edit_requirement", label: "Edit Requirement" },
      { value: "edit_role", label: "Edit Role" },
      { value: "edit_user", label: "Edit User" },
      { value: "edit_checklist", label: "Edit Checklist" },
      { value: "edit_notification", label: "Edit Notification" },
    ]
  },
  {
    category: "Delete Permissions",
    permissions: [
      { value: "delete_application", label: "Delete Application" },
      { value: "delete_entity_type", label: "Delete Entity Type" },
      { value: "delete_requirement", label: "Delete Requirement" },
      { value: "delete_role", label: "Delete Role" },
      { value: "delete_user", label: "Delete User" },
      { value: "delete_checklist", label: "Delete Checklist" },
      { value: "delete_notification", label: "Delete Notification" },
    ]
  },
  {
    category: "Action Permissions",
    permissions: [
      { value: "approve_application", label: "Approve Application" },
      { value: "reject_application", label: "Reject Application" },
      { value: "assign_work_item", label: "Assign Work Item" },
      { value: "complete_work_item", label: "Complete Work Item" },
      { value: "grant_permission", label: "Grant Permission" },
      { value: "revoke_permission", label: "Revoke Permission" },
      { value: "assign_role", label: "Assign Role" },
      { value: "remove_role", label: "Remove Role" },
    ]
  },
  {
    category: "Admin Permissions",
    permissions: [
      { value: "admin_access", label: "Admin Access" },
      { value: "manage_users", label: "Manage Users" },
      { value: "manage_roles", label: "Manage Roles" },
      { value: "manage_permissions", label: "Manage Permissions" },
      { value: "manage_configuration", label: "Manage Configuration" },
      { value: "export_data", label: "Export Data" },
      { value: "import_data", label: "Import Data" },
    ]
  }
];

// Flattened list for backward compatibility
const AVAILABLE_PERMISSIONS = PERMISSION_CATEGORIES.flatMap(cat => cat.permissions);

// Common resources
const AVAILABLE_RESOURCES = [
  { value: "applications", label: "Applications" },
  { value: "entity_types", label: "Entity Types" },
  { value: "requirements", label: "Requirements" },
  { value: "roles", label: "Roles" },
  { value: "users", label: "Users" },
  { value: "reports", label: "Reports" },
  { value: "work_queue", label: "Work Queue" },
  { value: "messages", label: "Messages" },
  { value: "audit_log", label: "Audit Log" },
  { value: "checklists", label: "Checklists" },
  { value: "notifications", label: "Notifications" },
  { value: "risk_review", label: "Risk Review" },
  { value: "approvals", label: "Approvals" },
];

export default function RulesAndPermissionsPage() {
  const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [granting, setGranting] = useState(false);
  const [permissionForm, setPermissionForm] = useState({
    permissionName: "",
    resource: "",
    description: "",
  });

  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showManagePermissionsModal, setShowManagePermissionsModal] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: "",
    displayName: "",
    description: "",
  });
  const [permissionToAdd, setPermissionToAdd] = useState({
    permissionName: "",
    resource: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "users") {
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
      setError("Please select a user and enter a permission name");
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to grant permission';
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke permission';
      setError(errorMessage);
      console.error('Error revoking permission:', err);
      await SweetAlert.error('Revoke Failed', errorMessage);
    }
  };

  const handleCreateRole = async () => {
    if (!roleForm.name.trim() || !roleForm.displayName.trim()) {
      setError("Please enter role name and display name");
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
      setError("Please enter a display name");
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
      setError("Please select at least one permission");
      return;
    }

    try {
      setError(null);
      SweetAlert.loading('Adding...', 'Please wait while we add the permissions.');
      
      // Add all selected permissions
      const promises = Array.from(selectedPermissions).map(permissionName =>
        rulesAndPermissionsApiService.addPermissionToRole(selectedRole.id, {
          permissionName,
          resource: permissionToAdd.resource || undefined,
        })
      );
      
      await Promise.all(promises);
      
      await loadRoles();
      SweetAlert.close();
      await SweetAlert.success('Added!', `${selectedPermissions.size} permission(s) have been added to the role successfully.`);
      setSelectedPermissions(new Set());
      setPermissionToAdd({ permissionName: "", resource: "" });
    } catch (err) {
      SweetAlert.close();
      const errorMessage = err instanceof Error ? err.message : 'Failed to add permission';
      setError(errorMessage);
      console.error('Error adding permission:', err);
      await SweetAlert.error('Add Failed', errorMessage);
    }
  };

  const handlePermissionToggle = (permissionValue: string) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permissionValue)) {
        newSet.delete(permissionValue);
      } else {
        newSet.add(permissionValue);
      }
      return newSet;
    });
  };

  const handleRemovePermissionFromRole = async (roleId: string, permissionId: string, permissionName: string) => {
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
      await SweetAlert.success('Removed!', 'Permission has been removed from the role successfully.');
    } catch (err) {
      SweetAlert.close();
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove permission';
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
      await SweetAlert.success('Assigned!', 'Role has been assigned to the user successfully.');
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
      await SweetAlert.success('Removed!', 'Role has been removed from the user successfully.');
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
    const permissionMap = new Map<string, { permissionName: string; resource?: string }>();
    
    roles.forEach(role => {
      role.permissions.forEach(perm => {
        // Create a unique key for permission name + resource combination
        const key = perm.resource 
          ? `${perm.permissionName}::${perm.resource}`
          : perm.permissionName;
        
        if (!permissionMap.has(key)) {
          permissionMap.set(key, {
            permissionName: perm.permissionName,
            resource: perm.resource || undefined
          });
        }
      });
    });
    
    // Convert to array of {value, label, resource} for dropdown
    return Array.from(permissionMap.values()).map(perm => {
      const label = perm.resource 
        ? `${perm.permissionName} (${perm.resource})`
        : perm.permissionName;
      
      return {
        value: perm.permissionName,
        label: label,
        resource: perm.resource
      };
    }).sort((a, b) => a.label.localeCompare(b.label));
  };

  const openGrantModal = (user: User) => {
    setSelectedUser(user);
    setPermissionForm({ permissionName: "", resource: "", description: "" });
    setShowGrantModal(true);
    // Ensure roles are loaded to get permissions
    if (roles.length === 0) {
      loadRoles();
    }
  };

  const closeGrantModal = () => {
    setShowGrantModal(false);
    setSelectedUser(null);
    setPermissionForm({ permissionName: "", resource: "", description: "" });
  };

  const openCreateRoleModal = () => {
    setRoleForm({ name: "", displayName: "", description: "" });
    setShowCreateRoleModal(true);
  };

  const closeCreateRoleModal = () => {
    setShowCreateRoleModal(false);
    setRoleForm({ name: "", displayName: "", description: "" });
  };

  const openEditRoleModal = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      displayName: role.displayName,
      description: role.description || "",
    });
    setShowEditRoleModal(true);
  };

  const closeEditRoleModal = () => {
    setShowEditRoleModal(false);
    setSelectedRole(null);
    setRoleForm({ name: "", displayName: "", description: "" });
  };

  const openManagePermissionsModal = (role: Role) => {
    setSelectedRole(role);
    setPermissionToAdd({ permissionName: "", resource: "" });
    
    // Pre-select permissions that are already assigned to this role
    const existingPermissionNames = new Set<string>();
    if (role.permissions && role.permissions.length > 0) {
      role.permissions.forEach((perm: any) => {
        const permName = perm.permissionName || perm.permission_name || perm.PermissionName;
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
    setPermissionToAdd({ permissionName: "", resource: "" });
    setSelectedPermissions(new Set());
  };

  const openAssignRoleModal = (user: User) => {
    setSelectedUser(user);
    setShowAssignRoleModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (usersLoading && activeTab === "users") {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="280px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <Spinner size="xl" color="orange.500" />
            <Typography color="gray.600">Loading users and permissions...</Typography>
          </VStack>
        </Box>
      </Flex>
    );
  }

  if (rolesLoading && activeTab === "roles") {
    return (
      <Flex minH="100vh" bg="gray.50">
        <AdminSidebar />
        <Box flex="1" ml="280px" display="flex" alignItems="center" justifyContent="center">
          <VStack gap="4">
            <Spinner size="xl" color="orange.500" />
            <Typography color="gray.600">Loading roles...</Typography>
          </VStack>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="gray.50">
      <AdminSidebar />
      <Box flex="1" ml="240px">
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py="6">
          <Container maxW="8xl">
            <Flex justify="space-between" align="center">
              <HStack gap="3" align="center">
                <IconWrapper><FiLock size={24} color="#FF6B35" /></IconWrapper>
                <VStack align="start" gap="1">
                  <Typography as="h1" fontSize="2xl" fontWeight="bold" color="black">
                    Rules and Permissions
                  </Typography>
                  <Typography color="black" fontSize="md">
                    Manage roles, permissions, and user access
                  </Typography>
                </VStack>
              </HStack>
            </Flex>
          </Container>
        </Box>

        {error && (
          <Container maxW="8xl" py="4">
            <AlertBar
              status="error"
              title="Error!"
              description={error}
              icon={<IconWrapper><FiLock size={20} /></IconWrapper>}
            />
          </Container>
        )}

        <Container maxW="8xl" py="6">
          <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value as "roles" | "users")}>
            <Tabs.List>
              <Tabs.Trigger value="roles">Roles</Tabs.Trigger>
              <Tabs.Trigger value="users">Users</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="roles">
              <VStack gap="4" align="stretch" mt="4">
                <Flex justify="space-between" align="center">
                  <Box flex="1" maxW="400px" mr="4">
                    <Search
                      placeholder="Search roles by name..."
                      onSearchChange={(query) => setSearchTerm(query)}
                    />
                  </Box>
                  <Button
                    variant="primary"
                    onClick={openCreateRoleModal}
                  >
                    <IconWrapper><FiPlus size={16} /></IconWrapper>
                    Create Role
                  </Button>
                </Flex>

                {filteredRoles.length === 0 ? (
                  <Box bg="white" borderRadius="xl" border="1px" borderColor="gray.200" p="8" textAlign="center">
                    <VStack gap="2">
                      <IconWrapper><FiShield size={32} color="#A0AEC0" /></IconWrapper>
                      <Typography color="black">No roles found</Typography>
                    </VStack>
                  </Box>
                ) : (
                  <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
                    {filteredRoles.map((role) => (
                      <Box
                        key={role.id}
                        bg="white"
                        borderRadius="lg"
                        border="1px"
                        borderColor="#E5E7EB"
                        p="6"
                        _hover={{ 
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          borderColor: "#F05423"
                        }}
                        transition="all 0.2s"
                      >
                        <VStack align="stretch" gap="4">
                          <Flex justify="space-between" align="start">
                            <VStack align="start" gap="2" flex="1">
                              <Typography fontSize="xl" fontWeight="bold" color="#111827">
                                {role.displayName}
                              </Typography>
                              <Typography fontSize="sm" color="#6B7280" fontFamily="mono">
                                {role.name}
                              </Typography>
                              {role.description && (
                                <Typography fontSize="sm" color="#4B5563" mt="1" lineHeight="1.5">
                                  {role.description}
                                </Typography>
                              )}
                            </VStack>
                            <Tag 
                              variant={role.isActive ? "success" : "inactive"}
                              style={{
                                backgroundColor: role.isActive ? '#10B981' : '#EF4444',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              {role.isActive ? "Active" : "Inactive"}
                            </Tag>
                          </Flex>

                          <Box 
                            bg="#F9FAFB" 
                            borderRadius="md" 
                            p="4"
                            border="1px"
                            borderColor="#E5E7EB"
                          >
                            <Typography fontSize="sm" fontWeight="semibold" color="#111827" mb="3">
                              Permissions ({role.permissions.length})
                            </Typography>
                            {role.permissions.length === 0 ? (
                              <Tag 
                                variant="info" 
                                size="md" 
                                style={{
                                  backgroundColor: '#F3F4F6',
                                  color: '#6B7280',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '13px'
                                }}
                              >
                                No permissions
                              </Tag>
                            ) : (
                              <Box 
                                maxH="120px" 
                                overflowY="auto"
                                style={{
                                  scrollbarWidth: 'thin',
                                  scrollbarColor: '#D1D5DB #F9FAFB'
                                }}
                              >
                              <HStack gap="2" wrap="wrap">
                                  {role.permissions.slice(0, 8).map((permission) => (
                                  <Tag
                                    key={permission.id}
                                    variant="info"
                                    size="md"
                                      style={{
                                        backgroundColor: '#EEF2FF',
                                        color: '#4F46E5',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        border: '1px solid #E0E7FF'
                                      }}
                                  >
                                    {permission.permissionName}
                                    {permission.resource && ` (${permission.resource})`}
                                  </Tag>
                                ))}
                                  {role.permissions.length > 8 && (
                                    <Tag
                                      variant="info"
                                      size="md"
                                      style={{
                                        backgroundColor: '#F3F4F6',
                                        color: '#6B7280',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                      }}
                                    >
                                      +{role.permissions.length - 8} more
                                    </Tag>
                                  )}
                              </HStack>
                              </Box>
                            )}
                          </Box>

                          <HStack gap="2" justify="flex-end" pt="2" borderTop="1px" borderColor="#E5E7EB">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => openManagePermissionsModal(role)}
                            >
                              <IconWrapper><FiPlus size={16} /></IconWrapper>
                              Manage Permissions
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openEditRoleModal(role)}
                              style={{
                                backgroundColor: 'white',
                                color: '#374151',
                                border: '1px solid #D1D5DB',
                                fontWeight: '500',
                                padding: '8px 16px',
                                borderRadius: '6px'
                              }}
                            >
                              <IconWrapper><FiEdit3 size={16} /></IconWrapper>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRole(role.id, role.displayName)}
                              style={{
                                backgroundColor: 'transparent',
                                color: '#EF4444',
                                fontWeight: '500',
                                padding: '8px 12px',
                                borderRadius: '6px'
                              }}
                              _hover={{ bg: '#FEF2F2' }}
                            >
                              <IconWrapper><FiTrash2 size={16} /></IconWrapper>
                            </Button>
                          </HStack>
                        </VStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </VStack>
            </Tabs.Content>

            <Tabs.Content value="users">
              <VStack gap="6" align="stretch" mt="4">
                <Box bg="white" borderRadius="lg" border="1px" borderColor="#E5E7EB" p="4" boxShadow="sm">
              <Search
                placeholder="Search users by email or name..."
                onSearchChange={(query) => setSearchTerm(query)}
              />
            </Box>

            {filteredUsers.length === 0 ? (
              <Box bg="white" borderRadius="xl" border="1px" borderColor="gray.200" p="8" textAlign="center">
                <VStack gap="2">
                  <IconWrapper><FiUser size={32} color="#A0AEC0" /></IconWrapper>
                      <Typography color="black">No users found</Typography>
                </VStack>
              </Box>
            ) : (
              <VStack gap="4" align="stretch">
                {filteredUsers.map((user) => (
                  <Box
                    key={user.id}
                    bg="white"
                    borderRadius="xl"
                    border="1px"
                    borderColor="#E5E7EB"
                    p="8"
                    boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                    _hover={{ 
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      borderColor: "#F05423",
                      transform: "translateY(-2px)"
                    }}
                    transition="all 0.3s ease"
                  >
                    <Flex direction="column" gap="6">
                      {/* Header Section */}
                      <Flex justify="space-between" align="start" pb="4" borderBottom="2px" borderColor="#F3F4F6">
                      <VStack align="start" gap="3" flex="1">
                        <HStack gap="3" align="center">
                            <Box
                              bg="#FEF3F2"
                              borderRadius="full"
                              p="2"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <IconWrapper><FiMail size={20} color="#F05423" /></IconWrapper>
                            </Box>
                            <VStack align="start" gap="0">
                              <Typography fontSize="xl" fontWeight="bold" color="#111827">
                            {user.email}
                          </Typography>
                          {user.name && (
                                <Typography color="#6B7280" fontSize="sm" fontWeight="400">
                                  {user.name}
                            </Typography>
                          )}
                            </VStack>
                        </HStack>
                        
                          <HStack gap="6" mt="2">
                          <Box>
                              <Typography fontSize="xs" color="#9CA3AF" mb="1" fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                                First Login
                              </Typography>
                              <Typography fontSize="sm" color="#111827" fontWeight="600">
                                {user.firstLoginAt ? new Date(user.firstLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                            </Typography>
                          </Box>
                          <Box>
                              <Typography fontSize="xs" color="#9CA3AF" mb="1" fontWeight="500" textTransform="uppercase" letterSpacing="0.5px">
                                Last Login
                              </Typography>
                              <Typography fontSize="sm" color="#111827" fontWeight="600">
                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                            </Typography>
                          </Box>
                          </HStack>
                        </VStack>

                        <HStack gap="2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openAssignRoleModal(user)}
                            style={{
                              backgroundColor: 'white',
                              color: '#374151',
                              border: '1px solid #D1D5DB',
                              fontWeight: '600',
                              padding: '10px 18px',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }}
                            _hover={{ 
                              backgroundColor: '#F9FAFB',
                              borderColor: '#9CA3AF'
                            }}
                          >
                            <IconWrapper><FiPlus size={16} /></IconWrapper>
                            Assign Role
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => openGrantModal(user)}
                            style={{
                              fontWeight: '600',
                              padding: '10px 18px',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }}
                          >
                            <IconWrapper><FiPlus size={16} /></IconWrapper>
                            Grant Permission
                          </Button>
                        </HStack>
                      </Flex>

                      {/* Roles Section */}
                      <Box>
                        <HStack justify="space-between" align="center" mb="3">
                          <Typography fontSize="sm" fontWeight="bold" color="#111827" textTransform="uppercase" letterSpacing="0.5px">
                            Roles
                              </Typography>
                          <Tag
                            style={{
                              backgroundColor: '#EEF2FF',
                              color: '#4F46E5',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            {user.roles.length}
                          </Tag>
                        </HStack>
                              {user.roles.length === 0 ? (
                          <Box 
                            bg="#F9FAFB" 
                            borderRadius="lg" 
                            p="4"
                            border="1px dashed #D1D5DB"
                            textAlign="center"
                          >
                            <Typography color="#9CA3AF" fontSize="sm">
                              No roles assigned
                            </Typography>
                          </Box>
                        ) : (
                          <HStack gap="2" wrap="wrap">
                                  {user.roles.map((userRole) => (
                              <HStack 
                                key={userRole.id} 
                                gap="2"
                                bg="#EEF2FF"
                                borderRadius="lg"
                                p="2"
                                border="1px solid #E0E7FF"
                                _hover={{ bg: '#E0E7FF' }}
                                transition="all 0.2s"
                              >
                                      <Tag
                                        variant="info"
                                        size="md"
                                  style={{
                                    backgroundColor: 'transparent',
                                    color: '#4F46E5',
                                    padding: '0',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    border: 'none'
                                  }}
                                      >
                                        {userRole.roleDisplayName}
                                      </Tag>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRemoveRoleFromUser(userRole.id, userRole.roleDisplayName)}
                                  style={{
                                    minWidth: 'auto',
                                    padding: '2px 4px',
                                    backgroundColor: 'transparent',
                                    height: '20px',
                                    width: '20px'
                                  }}
                                  _hover={{ bg: '#FEF2F2' }}
                                >
                                  <IconWrapper><FiX size={12} color="#EF4444" /></IconWrapper>
                                      </Button>
                                    </HStack>
                                  ))}
                                </HStack>
                              )}
                            </Box>

                      {/* Permissions Section */}
                      <Box>
                        <HStack justify="space-between" align="center" mb="3">
                          <Typography fontSize="sm" fontWeight="bold" color="#111827" textTransform="uppercase" letterSpacing="0.5px">
                            Permissions
                          </Typography>
                          <Tag
                            style={{
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            {user.permissions.filter(p => p.isActive).length}
                          </Tag>
                        </HStack>
                          {user.permissions.filter(p => p.isActive).length === 0 ? (
                          <Box 
                            bg="#F9FAFB" 
                            borderRadius="lg" 
                            p="4"
                            border="1px dashed #D1D5DB"
                            textAlign="center"
                          >
                            <Typography color="#9CA3AF" fontSize="sm">
                              No permissions assigned
                            </Typography>
                          </Box>
                        ) : (
                          <Box 
                            bg="#F9FAFB"
                            borderRadius="lg"
                            p="4"
                            border="1px solid #E5E7EB"
                          >
                            <Box 
                              maxH="240px" 
                              overflowY="auto"
                              style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#D1D5DB #F9FAFB'
                              }}
                            >
                              <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} gap="2">
                              {user.permissions
                                .filter(p => p.isActive)
                                  .slice(0, 24)
                                .map((permission) => (
                                    <HStack 
                                      key={permission.id} 
                                      gap="1"
                                      bg="white"
                                      borderRadius="md"
                                      p="2"
                                      border="1px solid #E5E7EB"
                                      justify="space-between"
                                      _hover={{ 
                                        borderColor: '#F05423',
                                        bg: '#FEF3F2'
                                      }}
                                      transition="all 0.2s"
                                    >
                                      <Box flex="1" minW="0">
                                        <Typography
                                          fontSize="12px"
                                          fontWeight="500"
                                          color="#111827"
                                          title={permission.permissionName + (permission.resource ? ` (${permission.resource})` : '')}
                                          style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                          }}
                                    >
                                      {permission.permissionName}
                                          {permission.resource && (
                                            <span style={{ color: '#6B7280', fontSize: '11px' }}>
                                              {' '}({permission.resource})
                                            </span>
                                          )}
                                        </Typography>
                                      </Box>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRevokePermission(permission.id, permission.permissionName)}
                                        style={{
                                          minWidth: 'auto',
                                          padding: '2px 4px',
                                          backgroundColor: 'transparent',
                                          flexShrink: 0,
                                          height: '20px',
                                          width: '20px'
                                        }}
                                        _hover={{ bg: '#FEF2F2' }}
                                      >
                                        <IconWrapper><FiX size={12} color="#EF4444" /></IconWrapper>
                                    </Button>
                                  </HStack>
                                ))}
                              </SimpleGrid>
                              {user.permissions.filter(p => p.isActive).length > 24 && (
                                <Box mt="3" textAlign="center">
                                  <Tag
                                    variant="info"
                              size="md"
                                    style={{
                                      backgroundColor: '#F3F4F6',
                                      color: '#6B7280',
                                      padding: '6px 14px',
                                      borderRadius: '8px',
                                      fontSize: '13px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    +{user.permissions.filter(p => p.isActive).length - 24} more permissions
                                  </Tag>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>
            </Tabs.Content>
          </Tabs.Root>
        </Container>
      </Box>

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
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <Box
            bg="white"
            borderRadius="xl"
            p="6"
            maxW="500px"
            width="90%"
            onClick={(e) => e.stopPropagation()}
            boxShadow="xl"
          >
            <VStack gap="4" align="stretch">
              <HStack justify="space-between" align="center">
                <Typography fontSize="xl" fontWeight="bold" color="black">
                  Create Role
                </Typography>
                <Button variant="ghost" size="sm" onClick={closeCreateRoleModal}>
                  <IconWrapper><FiX size={16} /></IconWrapper>
                </Button>
              </HStack>

              <Field.Root required>
                <Field.Label color="black" fontWeight="medium">Role Name (Internal)</Field.Label>
                <Input
                  placeholder="e.g., admin, reviewer"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  color="black"
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label color="black" fontWeight="medium">Display Name</Field.Label>
                <Input
                  placeholder="e.g., Administrator, Reviewer"
                  value={roleForm.displayName}
                  onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
                  color="black"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label color="black" fontWeight="medium">Description (Optional)</Field.Label>
                <Textarea
                  placeholder="Describe what this role allows..."
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={3}
                  color="black"
                  _placeholder={{ color: 'gray.500' }}
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
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <Box
            bg="white"
            borderRadius="xl"
            p="6"
            maxW="500px"
            width="90%"
            onClick={(e) => e.stopPropagation()}
            boxShadow="xl"
          >
            <VStack gap="4" align="stretch">
              <HStack justify="space-between" align="center">
                <Typography fontSize="xl" fontWeight="bold" color="black">
                  Edit Role
                </Typography>
                <Button variant="ghost" size="sm" onClick={closeEditRoleModal}>
                  <IconWrapper><FiX size={16} /></IconWrapper>
                </Button>
              </HStack>

              <Field.Root required>
                <Field.Label color="black" fontWeight="medium">Display Name</Field.Label>
                <Input
                  value={roleForm.displayName}
                  onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
                  color="black"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label color="black" fontWeight="medium">Description (Optional)</Field.Label>
                <Textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={3}
                  color="black"
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
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <Box
            bg="white"
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
              zIndex: 10000
            }}
          >
            <VStack gap="4" align="stretch">
              <HStack justify="space-between" align="center">
                <Typography fontSize="xl" fontWeight="bold" color="black">
                  Manage Permissions - {selectedRole.displayName}
                </Typography>
                <Button variant="ghost" size="sm" onClick={closeManagePermissionsModal}>
                  <IconWrapper><FiX size={16} /></IconWrapper>
                </Button>
              </HStack>

              <Box>
                <Typography 
                  fontSize="sm" 
                  fontWeight="bold" 
                  mb="3"
                  style={{
                    color: '#000000',
                    fontSize: '14px',
                    fontWeight: '600',
                    WebkitTextFillColor: '#000000'
                  }}
                >
                  Current Permissions ({selectedRole.permissions.length}):
                </Typography>
                {selectedRole.permissions.length === 0 ? (
                  <Box
                    p="4"
                    bg="gray.50"
                    borderRadius="md"
                    border="1px"
                    borderColor="gray.200"
                    mb="4"
                  >
                    <Typography 
                      style={{
                        color: '#000000',
                        fontSize: '14px',
                        WebkitTextFillColor: '#000000'
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
                    borderColor="#E5E7EB"
                    borderRadius="md"
                    p="3"
                    bg="white"
                    mb="4"
                    className="current-permissions-list"
                    style={{
                      maxHeight: '250px',
                      overflowY: 'auto',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      color: '#000000'
                    }}
                  >
                    <SimpleGrid columns={2} gap="2">
                    {selectedRole.permissions.map((permission) => (
                        <HStack 
                          key={permission.id} 
                          justify="space-between" 
                          p="2.5" 
                          bg="#F9FAFB" 
                          borderRadius="md"
                          border="1px"
                          borderColor="#E5E7EB"
                          _hover={{ bg: "#F3F4F6", borderColor: "#F05423" }}
                          transition="all 0.2s"
                          data-permission-item
                          style={{
                            backgroundColor: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            padding: '10px',
                            color: '#000000'
                          }}
                        >
                          <Box flex="1" style={{ color: '#000000' }}>
                            <span
                              style={{
                                color: '#000000 !important',
                                fontSize: '13px',
                                fontWeight: '500',
                                lineHeight: '20px',
                                WebkitTextFillColor: '#000000 !important',
                                display: 'block',
                                fontFamily: 'inherit'
                              }}
                            >
                              {(permission as any).permissionName || (permission as any).permission_name || 'Unnamed Permission'}
                              {((permission as any).resource || (permission as any).Resource) && (
                                <span
                                  style={{
                                    color: '#000000 !important',
                                    fontSize: '11px',
                                    marginLeft: '6px',
                                    fontWeight: '400',
                                    opacity: '0.7',
                                    WebkitTextFillColor: '#000000 !important',
                                    fontFamily: 'inherit'
                                  }}
                                >
                                  ({((permission as any).resource || (permission as any).Resource)})
                                </span>
                              )}
                            </span>
                          </Box>
                <Button
                          size="sm"
                  variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePermissionFromRole(selectedRole.id, permission.id, permission.permissionName);
                            }}
                            minW="auto"
                            p="1"
                            _hover={{ bg: "red.50" }}
                            style={{
                              minWidth: 'auto',
                              padding: '4px',
                              backgroundColor: 'transparent'
                            }}
                          >
                            <IconWrapper>
                              <FiX size={14} color="#EF4444" />
                            </IconWrapper>
                        </Button>
                      </HStack>
                    ))}
                    </SimpleGrid>
                  </Box>
                )}
              </Box>

              <Box borderTop="2px" borderColor="#E5E7EB" pt="6" mt="6">
                <Typography fontSize="md" fontWeight="bold" color="#111827" mb="4">
                  Add Permissions
                </Typography>
                
                <Field.Root mb="4">
                  <Field.Label>Resource (Optional)</Field.Label>
                  <select
                    value={permissionToAdd.resource}
                    onChange={(e) => setPermissionToAdd({ ...permissionToAdd, resource: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: 'white',
                      color: '#000000',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none'
                    }}
                  >
                    <option value="" style={{ color: '#000000', backgroundColor: 'white' }}>None</option>
                    {AVAILABLE_RESOURCES.map((resource) => (
                      <option key={resource.value} value={resource.value} style={{ color: '#000000', backgroundColor: 'white' }}>
                        {resource.label}
                      </option>
                    ))}
                  </select>
                </Field.Root>

                <Box 
                  maxH="450px" 
                  overflowY="auto" 
                  border="1px" 
                  borderColor="#E5E7EB" 
                  borderRadius="lg" 
                  p="5"
                  bg="white"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#D1D5DB #F9FAFB'
                  }}
                >
                  <VStack gap="5" align="stretch">
                    {PERMISSION_CATEGORIES.map((category) => (
                      <Box key={category.category}>
                        <Typography 
                          fontSize="sm" 
                          fontWeight="bold" 
                          color="#111827" 
                          mb="3"
                          style={{
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: '#6B7280'
                          }}
                        >
                          {category.category}
                        </Typography>
                        <SimpleGrid columns={2} gap="3">
                          {category.permissions.map((perm) => {
                            // Check if this permission is already assigned to the role
                            const isAlreadyAssigned = selectedRole?.permissions?.some((rolePerm: any) => {
                              const rolePermName = rolePerm.permissionName || rolePerm.permission_name || rolePerm.PermissionName;
                              return rolePermName === perm.value;
                            }) || false;
                            
                            // Check if it's selected for adding (but not yet saved)
                            const isSelectedForAdding = selectedPermissions.has(perm.value);
                            
                            // Checkbox should be checked if it's already assigned OR selected for adding
                            const isChecked = isAlreadyAssigned || isSelectedForAdding;
                            
                            return (
                              <HStack 
                                key={perm.value} 
                                gap="3" 
                                align="start"
                                p="3"
                                borderRadius="lg"
                                bg={isAlreadyAssigned ? "#FEF3F2" : "white"}
                                border={isAlreadyAssigned ? "2px solid #F05423" : "1px solid #E5E7EB"}
                                _hover={isAlreadyAssigned ? { bg: "#FEF3F2" } : { bg: "#F9FAFB", borderColor: "#D1D5DB" }}
                                transition="all 0.2s"
                                style={{
                                  boxShadow: isAlreadyAssigned ? '0 1px 3px 0 rgba(240, 84, 35, 0.1)' : 'none'
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
                                    zIndex: 10
                                  }}
                                >
                              <Checkbox.Root
                                    checked={isChecked}
                                    onCheckedChange={(details) => {
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
                                      cursor: isAlreadyAssigned ? 'default' : 'pointer',
                                      pointerEvents: 'auto',
                                      position: 'relative',
                                      zIndex: 11
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
                                        backgroundColor: isChecked ? '#F05423' : 'white',
                                        borderColor: isChecked ? '#F05423' : '#D1D5DB',
                                        borderWidth: '2px',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '4px',
                                        cursor: isAlreadyAssigned ? 'default' : 'pointer',
                                        pointerEvents: 'auto',
                                        position: 'relative',
                                        zIndex: 12
                                      }}
                                    >
                                      <Checkbox.Indicator
                                        style={{
                                          color: 'white',
                                          fontSize: '14px',
                                          fontWeight: 'bold'
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
                                    pointerEvents: 'auto'
                                  }}
                                >
                                  <Typography 
                                    fontSize="sm" 
                                    cursor={isAlreadyAssigned ? 'default' : 'pointer'} 
                                    style={{
                                      color: isAlreadyAssigned ? '#F05423' : '#111827',
                                      fontWeight: isAlreadyAssigned ? '600' : '500',
                                      pointerEvents: 'auto',
                                      lineHeight: '1.5'
                                    }}
                                  >
                                {perm.label}
                                    {isAlreadyAssigned && (
                                      <span
                                        style={{
                                          color: '#F05423',
                                          fontSize: '11px',
                                          marginLeft: '8px',
                                          fontWeight: '600',
                                          backgroundColor: '#FEF3F2',
                                          padding: '3px 8px',
                                          borderRadius: '6px',
                                          border: '1px solid #F05423'
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
                        <Box borderTop="1px" borderColor="gray.200" mt="3" />
                      </Box>
                    ))}
                  </VStack>
                </Box>

                <Box 
                  bg="#F9FAFB" 
                  borderRadius="lg" 
                  p="4" 
                  mb="4"
                  border="1px"
                  borderColor="#E5E7EB"
                >
                  <Typography fontSize="sm" color="#6B7280" fontWeight="500">
                    {selectedPermissions.size > 0 ? (
                      <span style={{ color: '#F05423', fontWeight: '600' }}>
                        {selectedPermissions.size} permission{selectedPermissions.size !== 1 ? 's' : ''} selected
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
                  <Typography 
                    as="span" 
                    fontWeight="600"
                >
                  Add {selectedPermissions.size > 0 ? `${selectedPermissions.size} ` : ''}Permission{selectedPermissions.size !== 1 ? 's' : ''}
                  </Typography>
                </Button>
              </Box>

              <HStack gap="3" justify="flex-end" mt="4">
                <Button 
                  variant="primary"
                  onClick={closeManagePermissionsModal}
                >
                  <Typography 
                    as="span" 
                    fontWeight="600"
                  >
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
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <Box
            bg="white"
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
              zIndex: 10000
            }}
          >
            <VStack gap="6" align="stretch">
              <HStack justify="space-between" align="center" pb="4" borderBottom="2px" borderColor="#F3F4F6">
                <Typography fontSize="2xl" fontWeight="bold" color="#111827">
                  Assign Role
                </Typography>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAssignRoleModal(false)}
                  style={{
                    minWidth: 'auto',
                    padding: '8px'
                  }}
                  _hover={{ bg: '#F3F4F6' }}
                >
                  <IconWrapper><FiX size={20} color="#6B7280" /></IconWrapper>
                </Button>
              </HStack>

              <Box 
                bg="#FEF3F2" 
                borderRadius="lg" 
                p="4"
                border="1px"
                borderColor="#F05423"
              >
                <HStack gap="3" align="center">
                  <Box
                    bg="#F05423"
                    borderRadius="full"
                    p="2"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <IconWrapper><FiMail size={18} color="white" /></IconWrapper>
                  </Box>
                  <VStack align="start" gap="0">
                    <Typography fontSize="xs" color="#92400E" fontWeight="600" textTransform="uppercase" letterSpacing="0.5px">
                      User
                    </Typography>
                    <Typography fontWeight="700" fontSize="md" color="#111827">
                      {selectedUser.email}
                    </Typography>
                    {selectedUser.name && (
                      <Typography fontSize="sm" color="#6B7280" mt="0.5">
                        {selectedUser.name}
                      </Typography>
                    )}
                  </VStack>
                </HStack>
              </Box>

              <Box>
                <HStack justify="space-between" align="center" mb="4">
                  <Typography fontSize="sm" fontWeight="bold" color="#111827" textTransform="uppercase" letterSpacing="0.5px">
                    Available Roles
                </Typography>
                  <Tag
                    style={{
                      backgroundColor: '#EEF2FF',
                      color: '#4F46E5',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {roles.filter(r => r.isActive && !selectedUser.roles.some(ur => ur.roleId === r.id)).length} available
                  </Tag>
                </HStack>
                {roles.filter(r => r.isActive && !selectedUser.roles.some(ur => ur.roleId === r.id)).length === 0 ? (
                  <Box 
                    bg="#F9FAFB" 
                    borderRadius="lg" 
                    p="6"
                    border="1px dashed #D1D5DB"
                    textAlign="center"
                  >
                    <Typography color="#9CA3AF" fontSize="sm">
                      No available roles to assign. All roles have been assigned to this user.
                    </Typography>
                  </Box>
                ) : (
                  <SimpleGrid columns={1} gap="3" maxH="450px" overflowY="auto" pr="2"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#D1D5DB #F9FAFB'
                    }}
                  >
                    {roles
                      .filter(r => r.isActive && !selectedUser.roles.some(ur => ur.roleId === r.id))
                      .map((role) => (
                        <Box
                          key={role.id}
                          bg="white"
                          borderRadius="xl"
                          p="5"
                          border="2px"
                          borderColor="#E5E7EB"
                          cursor="pointer"
                          position="relative"
                          _hover={{ 
                            borderColor: "#F05423",
                            bg: "#FEF3F2",
                            boxShadow: "0 4px 6px -1px rgba(240, 84, 35, 0.1)"
                          }}
                          transition="all 0.2s ease"
                          onClick={() => handleAssignRoleToUser(role.id)}
                        >
                          <Flex justify="space-between" align="start" gap="4">
                            <VStack align="start" gap="2" flex="1" minW="0">
                              <Typography 
                                fontWeight="700" 
                                fontSize="lg"
                                color="#111827"
                                lineHeight="1.3"
                              >
                                {role.displayName}
                              </Typography>
                            {role.description && (
                                <Typography 
                                  fontSize="sm" 
                                  color="#6B7280"
                                  lineHeight="1.5"
                                >
                                  {role.description}
                                </Typography>
                              )}
                              <HStack gap="2" mt="2" wrap="wrap">
                                <Tag
                                  style={{
                                    backgroundColor: '#EEF2FF',
                                    color: '#4F46E5',
                                    padding: '5px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    border: '1px solid #E0E7FF'
                                  }}
                                >
                                  {role.permissions?.length || 0} permissions
                                </Tag>
                                <Tag
                                  style={{
                                    backgroundColor: '#F3F4F6',
                                    color: '#6B7280',
                                    padding: '5px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    fontFamily: 'monospace'
                                  }}
                                >
                                  {role.name}
                                </Tag>
                              </HStack>
                          </VStack>
                            <Box
                              bg="#F05423"
                              borderRadius="full"
                              p="3"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              flexShrink={0}
                              style={{
                                width: '40px',
                                height: '40px'
                              }}
                              _hover={{
                                bg: '#E04513',
                                transform: 'scale(1.1)'
                              }}
                              transition="all 0.2s"
                            >
                              <IconWrapper><FiPlus size={20} color="white" /></IconWrapper>
                            </Box>
                          </Flex>
                        </Box>
                      ))}
                  </SimpleGrid>
                )}
              </Box>

              <HStack gap="3" justify="flex-end" pt="4" borderTop="2px" borderColor="#F3F4F6">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowAssignRoleModal(false)}
                  style={{
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    fontWeight: '600',
                    padding: '10px 20px',
                    borderRadius: '8px'
                  }}
                  _hover={{ 
                    backgroundColor: '#F9FAFB',
                    borderColor: '#9CA3AF'
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
            WebkitBackdropFilter: 'blur(8px)'
          }}
                >
          <Box
            bg="white"
            borderRadius="xl"
            p="6"
            maxW="500px"
            width="90%"
            onClick={(e) => e.stopPropagation()}
            boxShadow="xl"
          >
            <VStack gap="4" align="stretch">
              <HStack justify="space-between" align="center">
                <Typography fontSize="xl" fontWeight="bold" color="black">
                  Grant Permission
                </Typography>
                <Button variant="ghost" size="sm" onClick={closeGrantModal}>
                  <IconWrapper><FiX size={16} /></IconWrapper>
                </Button>
              </HStack>

              <Box>
                <Typography fontSize="sm" color="black" mb="2">User:</Typography>
                <Typography fontWeight="medium" fontSize="md" color="black">{selectedUser.email}</Typography>
              </Box>

              <Field.Root required>
                <Field.Label color="black" fontWeight="medium">Permission Name</Field.Label>
                {roles.length === 0 ? (
                  <Box p="4" bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                    <Typography fontSize="sm" color="gray.600">
                      No roles found. Please create a role with permissions first.
                    </Typography>
                  </Box>
                ) : getAvailablePermissionsFromRoles().length === 0 ? (
                  <Box p="4" bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                    <Typography fontSize="sm" color="gray.600">
                      No permissions found in existing roles. Please add permissions to roles first.
                    </Typography>
                  </Box>
                ) : (
                  <select
                    value={permissionForm.resource 
                      ? `${permissionForm.permissionName}::${permissionForm.resource}`
                      : permissionForm.permissionName}
                    onChange={(e) => {
                      const selected = getAvailablePermissionsFromRoles().find(p => {
                        const optionValue = p.resource 
                          ? `${p.value}::${p.resource}`
                          : p.value;
                        return optionValue === e.target.value;
                      });
                      if (selected) {
                        setPermissionForm({ 
                          permissionName: selected.value,
                          resource: selected.resource || "",
                          description: ""
                        });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: 'white',
                      color: '#000000'
                    }}
                  >
                    <option value="" style={{ color: '#000000', backgroundColor: 'white' }}>Select a permission from existing roles</option>
                    {getAvailablePermissionsFromRoles().map((perm, index) => {
                      const optionValue = perm.resource 
                        ? `${perm.value}::${perm.resource}`
                        : perm.value;
                      return (
                        <option key={`${perm.value}-${perm.resource || 'none'}-${index}`} value={optionValue} style={{ color: '#000000', backgroundColor: 'white' }}>
                          {perm.label}
                        </option>
                      );
                    })}
                  </select>
                )}
              </Field.Root>

              <Field.Root>
                <Field.Label color="black" fontWeight="medium">Resource (Optional)</Field.Label>
                <Input
                  placeholder="Resource (auto-filled from selected permission)"
                  value={permissionForm.resource}
                  onChange={(e) =>
                    setPermissionForm({ ...permissionForm, resource: e.target.value })
                  }
                  color="black"
                />
                <Typography fontSize="xs" color="gray.500" mt="1">
                  Resource is automatically set from the selected permission if available, but can be overridden if needed.
                </Typography>
              </Field.Root>

              <Field.Root>
                <Field.Label color="black" fontWeight="medium">Description (Optional)</Field.Label>
                <Textarea
                  placeholder="Describe what this permission allows..."
                  value={permissionForm.description}
                  onChange={(e) =>
                    setPermissionForm({ ...permissionForm, description: e.target.value })
                  }
                  rows={3}
                  color="black"
                  _placeholder={{ color: 'black' }}
                />
              </Field.Root>

              <HStack gap="3" justify="flex-end" mt="4">
                <Button variant="ghost" onClick={closeGrantModal}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGrantPermission}
                  disabled={granting}
                >
                  {granting ? "Granting..." : "Grant Permission"}
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}
    </Flex>
  );
}
