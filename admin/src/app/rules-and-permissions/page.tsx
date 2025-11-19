"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Flex,
  Icon,
  Spinner,
  Alert,
  AlertTitle,
  AlertDescription,
  Badge,
  Textarea,
  Field,
  SimpleGrid,
  Tabs,
  Checkbox,
} from "@chakra-ui/react";
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
    setSelectedPermissions(new Set());
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
            <Text color="gray.600">Loading users and permissions...</Text>
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
            <Text color="gray.600">Loading roles...</Text>
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
                <Icon as={FiLock} boxSize="6" color="orange.500" />
                <VStack align="start" gap="1">
                  <Text as="h1" fontSize="2xl" fontWeight="bold" color="black">
                    Rules and Permissions
                  </Text>
                  <Text color="black" fontSize="md">
                    Manage roles, permissions, and user access
                  </Text>
                </VStack>
              </HStack>
            </Flex>
          </Container>
        </Box>

        {error && (
          <Container maxW="8xl" py="4">
            <Alert.Root status="error" borderRadius="md">
              <Icon as={FiLock} />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert.Root>
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
                  <Box bg="white" borderRadius="xl" border="1px" borderColor="gray.200" p="4" flex="1" mr="4">
                    <Input
                      placeholder="Search roles by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      size="md"
                      _placeholder={{ color: 'black' }}
                    />
                  </Box>
                  <Button
                    colorScheme="orange"
                    onClick={openCreateRoleModal}
                  >
                    <Icon as={FiPlus} mr="2" />
                    Create Role
                  </Button>
                </Flex>

                {filteredRoles.length === 0 ? (
                  <Box bg="white" borderRadius="xl" border="1px" borderColor="gray.200" p="8" textAlign="center">
                    <VStack gap="2">
                      <Icon as={FiShield} boxSize="8" color="gray.400" />
                      <Text color="black">No roles found</Text>
                    </VStack>
                  </Box>
                ) : (
                  <SimpleGrid columns={{ base: 1, lg: 2 }} gap="4">
                    {filteredRoles.map((role) => (
                      <Box
                        key={role.id}
                        bg="white"
                        borderRadius="xl"
                        border="1px"
                        borderColor="gray.200"
                        p="6"
                        _hover={{ boxShadow: "md" }}
                        transition="all 0.2s"
                      >
                        <VStack align="stretch" gap="4">
                          <Flex justify="space-between" align="start">
                            <VStack align="start" gap="1" flex="1">
                              <Text fontSize="lg" fontWeight="bold" color="black">
                                {role.displayName}
                              </Text>
                              <Text fontSize="sm" color="black">
                                {role.name}
                              </Text>
                              {role.description && (
                                <Text fontSize="sm" color="black" mt="2">
                                  {role.description}
                                </Text>
                              )}
                            </VStack>
                            <Badge colorScheme={role.isActive ? "green" : "gray"} size="sm">
                              {role.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </Flex>

                          <Box>
                            <Text fontSize="sm" fontWeight="semibold" color="black" mb="2">
                              Permissions ({role.permissions.length}):
                            </Text>
                            {role.permissions.length === 0 ? (
                              <Badge colorScheme="gray" size="sm" color="black">No permissions</Badge>
                            ) : (
                              <HStack gap="2" wrap="wrap">
                                {role.permissions.map((permission) => (
                                  <Badge
                                    key={permission.id}
                                    colorScheme="blue"
                                    size="sm"
                                    px="2"
                                    py="1"
                                    borderRadius="md"
                                  >
                                    {permission.permissionName}
                                    {permission.resource && ` (${permission.resource})`}
                                  </Badge>
                                ))}
                              </HStack>
                            )}
                          </Box>

                          <HStack gap="2" justify="flex-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openManagePermissionsModal(role)}
                            >
                              <Icon as={FiPlus} mr="2" />
                              Manage Permissions
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditRoleModal(role)}
                            >
                              <Icon as={FiEdit3} mr="2" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="red"
                              onClick={() => handleDeleteRole(role.id, role.displayName)}
                            >
                              <Icon as={FiTrash2} />
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
              <VStack gap="4" align="stretch" mt="4">
            <Box bg="white" borderRadius="xl" border="1px" borderColor="gray.200" p="4">
              <Input
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="md"
                    _placeholder={{ color: 'black' }}
              />
            </Box>

            {filteredUsers.length === 0 ? (
              <Box bg="white" borderRadius="xl" border="1px" borderColor="gray.200" p="8" textAlign="center">
                <VStack gap="2">
                  <Icon as={FiUser} boxSize="8" color="gray.400" />
                      <Text color="black">No users found</Text>
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
                    borderColor="gray.200"
                    p="4"
                    _hover={{ boxShadow: "md" }}
                    transition="all 0.2s"
                  >
                    <Flex justify="space-between" align="start">
                      <VStack align="start" gap="3" flex="1">
                        <HStack gap="3" align="center">
                              <Icon as={FiMail} color="black" />
                              <Text fontSize="lg" fontWeight="bold" color="black">
                            {user.email}
                          </Text>
                          {user.name && (
                                <Text color="black" fontSize="md">
                              ({user.name})
                            </Text>
                          )}
                        </HStack>
                        
                        <SimpleGrid columns={2} gap="4" width="100%">
                          <Box>
                                <Text fontSize="xs" color="black" mb="1">First Login</Text>
                                <Text fontSize="sm" color="black">
                              {new Date(user.firstLoginAt).toLocaleDateString()}
                            </Text>
                          </Box>
                          <Box>
                                <Text fontSize="xs" color="black" mb="1">Last Login</Text>
                                <Text fontSize="sm" color="black">
                              {new Date(user.lastLoginAt).toLocaleDateString()}
                            </Text>
                          </Box>
                        </SimpleGrid>

                        <Box width="100%">
                              <Text fontSize="sm" fontWeight="semibold" color="black" mb="2">
                                Roles ({user.roles.length}):
                              </Text>
                              {user.roles.length === 0 ? (
                                <Badge colorScheme="gray" size="sm" color="black">No roles</Badge>
                              ) : (
                                <HStack gap="2" wrap="wrap" mb="3">
                                  {user.roles.map((userRole) => (
                                    <HStack key={userRole.id} gap="1">
                                      <Badge
                                        colorScheme="purple"
                                        size="sm"
                                        px="2"
                                        py="1"
                                        borderRadius="md"
                                      >
                                        {userRole.roleDisplayName}
                                      </Badge>
                                      <Button
                                        size="xs"
                                        variant="ghost"
                                        colorScheme="red"
                                        onClick={() => handleRemoveRoleFromUser(userRole.id, userRole.roleDisplayName)}
                                      >
                                        <Icon as={FiX} />
                                      </Button>
                                    </HStack>
                                  ))}
                                </HStack>
                              )}
                            </Box>

                            <Box width="100%">
                              <Text fontSize="sm" fontWeight="semibold" color="black" mb="2">
                            Permissions ({user.permissions.filter(p => p.isActive).length}):
                          </Text>
                          {user.permissions.filter(p => p.isActive).length === 0 ? (
                                <Badge colorScheme="gray" size="sm" color="black">No permissions</Badge>
                          ) : (
                            <HStack gap="2" wrap="wrap">
                              {user.permissions
                                .filter(p => p.isActive)
                                .map((permission) => (
                                  <HStack key={permission.id} gap="1">
                                    <Badge
                                      colorScheme="blue"
                                      size="sm"
                                      px="2"
                                      py="1"
                                      borderRadius="md"
                                    >
                                      {permission.permissionName}
                                      {permission.resource && ` (${permission.resource})`}
                                    </Badge>
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      colorScheme="red"
                                      onClick={() => handleRevokePermission(permission.id, permission.permissionName)}
                                    >
                                      <Icon as={FiX} />
                                    </Button>
                                  </HStack>
                                ))}
                            </HStack>
                          )}
                        </Box>
                      </VStack>

                      <HStack gap="2">
                            <Button
                              size="md"
                              colorScheme="purple"
                              onClick={() => openAssignRoleModal(user)}
                            >
                              <Icon as={FiPlus} mr="2" />
                              Assign Role
                            </Button>
                        <Button
                          size="md"
                          colorScheme="orange"
                          onClick={() => openGrantModal(user)}
                        >
                          <Icon as={FiPlus} mr="2" />
                          Grant Permission
                        </Button>
                      </HStack>
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
          bg="blackAlpha.600"
          zIndex="1000"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={closeCreateRoleModal}
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
                <Text fontSize="xl" fontWeight="bold" color="black">
                  Create Role
                </Text>
                <Button variant="ghost" size="sm" onClick={closeCreateRoleModal}>
                  <Icon as={FiX} />
                </Button>
              </HStack>

              <Field.Root required>
                <Field.Label color="black" fontWeight="medium">Role Name (Internal)</Field.Label>
                <Input
                  placeholder="e.g., admin, reviewer"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  color="black"
                  _placeholder={{ color: 'gray.500' }}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label color="black" fontWeight="medium">Display Name</Field.Label>
                <Input
                  placeholder="e.g., Administrator, Reviewer"
                  value={roleForm.displayName}
                  onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
                  color="black"
                  _placeholder={{ color: 'gray.500' }}
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
                <Button colorScheme="orange" onClick={handleCreateRole}>
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
          bg="blackAlpha.600"
          zIndex="1000"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={closeEditRoleModal}
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
                <Text fontSize="xl" fontWeight="bold" color="black">
                  Edit Role
                </Text>
                <Button variant="ghost" size="sm" onClick={closeEditRoleModal}>
                  <Icon as={FiX} />
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
                <Button colorScheme="orange" onClick={handleUpdateRole}>
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
          bg="blackAlpha.600"
          zIndex="1000"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={closeManagePermissionsModal}
        >
          <Box
            bg="white"
            borderRadius="xl"
            p="6"
            maxW="600px"
            width="90%"
            onClick={(e) => e.stopPropagation()}
            boxShadow="xl"
          >
            <VStack gap="4" align="stretch">
              <HStack justify="space-between" align="center">
                <Text fontSize="xl" fontWeight="bold" color="black">
                  Manage Permissions - {selectedRole.displayName}
                </Text>
                <Button variant="ghost" size="sm" onClick={closeManagePermissionsModal}>
                  <Icon as={FiX} />
                </Button>
              </HStack>

              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="black" mb="2">
                  Current Permissions:
                </Text>
                {selectedRole.permissions.length === 0 ? (
                  <Text color="black" fontSize="sm">No permissions assigned</Text>
                ) : (
                  <VStack gap="2" align="stretch" mb="4">
                    {selectedRole.permissions.map((permission) => (
                      <HStack key={permission.id} justify="space-between" p="2" bg="gray.50" borderRadius="md">
                        <Text fontSize="sm">
                          {permission.permissionName}
                          {permission.resource && ` (${permission.resource})`}
                </Text>
                <Button
                          size="xs"
                  variant="ghost"
                          colorScheme="red"
                          onClick={() => handleRemovePermissionFromRole(selectedRole.id, permission.id, permission.permissionName)}
                        >
                          <Icon as={FiX} />
                        </Button>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </Box>

              <Box borderTop="1px" borderColor="gray.200" pt="4">
                <Text fontSize="sm" fontWeight="semibold" color="black" mb="3">
                  Add Permissions:
                </Text>
                
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
                  maxH="400px" 
                  overflowY="auto" 
                  border="1px" 
                  borderColor="gray.200" 
                  borderRadius="md" 
                  p="4"
                  bg="gray.50"
                >
                  <VStack gap="4" align="stretch">
                    {PERMISSION_CATEGORIES.map((category) => (
                      <Box key={category.category}>
                        <Text fontSize="sm" fontWeight="bold" color="black" mb="2">
                          {category.category}
                        </Text>
                        <SimpleGrid columns={2} gap="2">
                          {category.permissions.map((perm) => (
                            <HStack key={perm.value} gap="2" align="start">
                              <Checkbox.Root
                                checked={selectedPermissions.has(perm.value)}
                                onCheckedChange={() => handlePermissionToggle(perm.value)}
                                colorScheme="orange"
                              >
                                <Checkbox.Control>
                                  <Checkbox.Indicator />
                                </Checkbox.Control>
                              </Checkbox.Root>
                              <Text fontSize="sm" color="black" cursor="pointer" onClick={() => handlePermissionToggle(perm.value)}>
                                {perm.label}
                              </Text>
                            </HStack>
                          ))}
                        </SimpleGrid>
                        <Box borderTop="1px" borderColor="gray.200" mt="3" />
                      </Box>
                    ))}
                  </VStack>
                </Box>

                <Text fontSize="xs" color="black" mt="2" mb="3">
                  {selectedPermissions.size} permission(s) selected
                </Text>

                <Button 
                  colorScheme="orange" 
                  onClick={handleAddPermissionToRole}
                  disabled={selectedPermissions.size === 0}
                  width="full"
                >
                  Add {selectedPermissions.size > 0 ? `${selectedPermissions.size} ` : ''}Permission{selectedPermissions.size !== 1 ? 's' : ''}
                </Button>
              </Box>

              <HStack gap="3" justify="flex-end" mt="4">
                <Button variant="ghost" onClick={closeManagePermissionsModal}>
                  Close
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
          bg="blackAlpha.600"
          zIndex="1000"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setShowAssignRoleModal(false)}
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
                <Text fontSize="xl" fontWeight="bold" color="black">
                  Assign Role
                </Text>
                <Button variant="ghost" size="sm" onClick={() => setShowAssignRoleModal(false)}>
                  <Icon as={FiX} />
                </Button>
              </HStack>

              <Box>
                <Text fontSize="sm" color="black" mb="2">User:</Text>
                <Text fontWeight="medium" fontSize="md" color="black">{selectedUser.email}</Text>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="black" mb="2">
                  Available Roles:
                </Text>
                {roles.filter(r => r.isActive && !selectedUser.roles.some(ur => ur.roleId === r.id)).length === 0 ? (
                  <Text color="black" fontSize="sm">No available roles to assign</Text>
                ) : (
                  <VStack gap="2" align="stretch">
                    {roles
                      .filter(r => r.isActive && !selectedUser.roles.some(ur => ur.roleId === r.id))
                      .map((role) => (
                        <Button
                          key={role.id}
                          variant="outline"
                          justifyContent="flex-start"
                          onClick={() => handleAssignRoleToUser(role.id)}
                        >
                          <VStack align="start" gap="1" flex="1">
                            <Text fontWeight="medium">{role.displayName}</Text>
                            {role.description && (
                              <Text fontSize="xs" color="gray.500">{role.description}</Text>
                            )}
                          </VStack>
                        </Button>
                      ))}
                  </VStack>
                )}
              </Box>

              <HStack gap="3" justify="flex-end" mt="4">
                <Button variant="ghost" onClick={() => setShowAssignRoleModal(false)}>
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
          bg="blackAlpha.600"
          zIndex="1000"
          display="flex"
          alignItems="center"
          justifyContent="center"
                  onClick={closeGrantModal}
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
                <Text fontSize="xl" fontWeight="bold" color="black">
                  Grant Permission
                </Text>
                <Button variant="ghost" size="sm" onClick={closeGrantModal}>
                  <Icon as={FiX} />
                </Button>
              </HStack>

              <Box>
                <Text fontSize="sm" color="black" mb="2">User:</Text>
                <Text fontWeight="medium" fontSize="md" color="black">{selectedUser.email}</Text>
              </Box>

              <Field.Root required>
                <Field.Label color="black" fontWeight="medium">Permission Name</Field.Label>
                {roles.length === 0 ? (
                  <Box p="4" bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                    <Text fontSize="sm" color="gray.600">
                      No roles found. Please create a role with permissions first.
                    </Text>
                  </Box>
                ) : getAvailablePermissionsFromRoles().length === 0 ? (
                  <Box p="4" bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                    <Text fontSize="sm" color="gray.600">
                      No permissions found in existing roles. Please add permissions to roles first.
                    </Text>
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
                <Text fontSize="xs" color="gray.500" mt="1">
                  Resource is automatically set from the selected permission if available, but can be overridden if needed.
                </Text>
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
                  colorScheme="orange"
                  onClick={handleGrantPermission}
                  loading={granting}
                  loadingText="Granting..."
                >
                  Grant Permission
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}
    </Flex>
  );
}
