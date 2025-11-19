"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text,
  SimpleGrid,
  Flex,
  Badge,
  Button,
  Image,
  Circle,
  Input,
  Switch as ChakraSwitch,
  Checkbox,
  Separator,
  Spinner,
  Alert,
  Icon,
  useDisclosure,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { FiAlertCircle, FiCheckCircle, FiXCircle, FiInfo, FiX } from "react-icons/fi";
import { getAuthUser, getInitials, logout } from "@/lib/auth/session";
import { 
  getUserProfile, 
  updateUserProfile, 
  getNotificationPreferences,
  updateNotificationPreferences,
  changePassword,
  downloadUserData,
  deleteUserAccount,
  getUserCaseSummary,
  findUserCaseByEmail,
  type UserProfile,
  type UserPreferences,
  type ChangePasswordRequest
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const MotionBox = motion(Box);

const profileSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string(),
  companyName: Yup.string(),
  country: Yup.string().required("Country is required"),
});

export default function PartnerProfilePage() {
  useRequireAuth();
  const { open: isPasswordDialogOpen, onOpen: onPasswordDialogOpen, onClose: onPasswordDialogClose } = useDisclosure();
  const { open: isDeleteDialogOpen, onOpen: onDeleteDialogOpen, onClose: onDeleteDialogClose } = useDisclosure();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<UserPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    statusUpdates: true,
    marketingCommunications: false
  });
  const [caseSummary, setCaseSummary] = useState<any>(null);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deleteReason, setDeleteReason] = useState('');
  const [toastState, setToastState] = useState<{ status: "success" | "error" | "info"; title: string; description?: string } | null>(null);

  // Toast helper function
  const showToast = (args: { status: "success" | "error" | "info"; title: string; description?: string }) => {
    setToastState(args);
    setTimeout(() => setToastState(null), args.status === 'error' ? 5000 : 3000);
  };

  // Load profile data from backend
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [profileData, prefs, summary] = await Promise.all([
          getUserProfile(),
          getNotificationPreferences(),
          getUserCaseSummary()
        ]);
        
        if (isMounted) {
          setProfile(profileData);
          setNotifications(prefs);
          setCaseSummary(summary);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        if (isMounted) {
          showToast({
            status: 'error',
            title: 'Failed to load profile',
            description: 'Could not load profile data. Please refresh the page.'
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();
    return () => { isMounted = false; };
  }, []);

  const handleSaveProfile = async (values: any) => {
    setSaving(true);
    try {
      const updated = await updateUserProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName,
        phone: values.phone,
        country: values.country,
        companyName: values.companyName,
        preferences: notifications
      });
      
      setProfile(updated);
      setIsEditing(false);
      showToast({
        status: 'success',
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.'
      });
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      showToast({
        status: 'error',
        title: 'Failed to save',
        description: error.message || 'Could not update profile. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = async (key: keyof UserPreferences, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    
    try {
      // Save immediately when toggled
      await updateNotificationPreferences(updated);
      showToast({
        status: 'success',
        title: 'Preferences updated',
        description: 'Your notification preferences have been saved.'
      });
    } catch (error: any) {
      // Revert on error
      setNotifications(notifications);
      showToast({
        status: 'error',
        title: 'Failed to update',
        description: error.message || 'Could not update preferences. Please try again.'
      });
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast({
        status: 'error',
        title: 'Passwords do not match'
      });
      return;
    }

    try {
      const result = await changePassword(passwordForm);
      if (result.success) {
        showToast({
          status: 'success',
          title: 'Password changed',
          description: 'Your password has been updated successfully.'
        });
        onPasswordDialogClose();
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error: any) {
      showToast({
        status: 'error',
        title: 'Failed to change password',
        description: error.message || 'Could not change password. Please try again.'
      });
    }
  };

  const handleDownloadData = async () => {
    try {
      const blob = await downloadUserData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mukuru-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToast({
        status: 'success',
        title: 'Data downloaded',
        description: 'Your data has been downloaded successfully.'
      });
    } catch (error: any) {
      showToast({
        status: 'error',
        title: 'Failed to download',
        description: error.message || 'Could not download your data. Please try again.'
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const result = await deleteUserAccount({ reason: deleteReason });
      if (result.success) {
        showToast({
          status: 'success',
          title: 'Account deleted',
          description: 'Your account has been permanently deleted.'
        });
        // Logout and redirect
        setTimeout(() => {
          logout('http://localhost:3000/');
        }, 2000);
      }
    } catch (error: any) {
      showToast({
        status: 'error',
        title: 'Failed to delete account',
        description: error.message || 'Could not delete your account. Please contact support.'
      });
    }
  };

  const user = getAuthUser();
  
  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack gap="4">
          <Spinner size="xl" color="orange.500" />
          <Text color="gray.600">Loading profile...</Text>
        </VStack>
      </Box>
    );
  }

  // Do not block the page if there is no application; render profile with auth data

  return (
    <Box minH="100vh" bg="gray.50" position="relative">
      {/* Toast Notification */}
      {toastState && (
        <Box
          position="fixed"
          top="4"
          right="4"
          zIndex={9999}
          maxW="400px"
          p="4"
          borderRadius="md"
          bg={toastState.status === 'success' ? 'green.50' : toastState.status === 'error' ? 'red.50' : 'blue.50'}
          border="1px"
          borderColor={toastState.status === 'success' ? 'green.200' : toastState.status === 'error' ? 'red.200' : 'blue.200'}
          boxShadow="lg"
        >
          <HStack gap="3" align="start">
            <Icon
              as={toastState.status === 'success' ? FiCheckCircle : toastState.status === 'error' ? FiXCircle : FiInfo}
              color={toastState.status === 'success' ? 'green.500' : toastState.status === 'error' ? 'red.500' : 'blue.500'}
              boxSize="5"
              flexShrink={0}
              mt="0.5"
            />
            <VStack align="start" gap="1" flex="1">
              <Text fontWeight="semibold" fontSize="sm" color="gray.900">
                {toastState.title}
              </Text>
              {toastState.description && (
                <Text fontSize="sm" color="gray.700">
                  {toastState.description}
                </Text>
              )}
            </VStack>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setToastState(null)}
              minW="auto"
              px="2"
            >
              <Icon as={FiX} boxSize="3" />
            </Button>
          </HStack>
        </Box>
      )}
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" py="4">
        <Container maxW="7xl">
          <Flex justify="space-between" align="center">
            <HStack gap="4">
              <Link href="/partner/dashboard">
                <Button variant="ghost" size="sm">← Back</Button>
              </Link>
              <Image src="/mukuru-logo.png" alt="Mukuru" height="32px" />
              <Text color="gray.700" fontSize="sm" fontWeight="medium">Profile</Text>
            </HStack>
            <HStack gap="4">
              <Button variant="outline" size="sm" onClick={() => logout('http://localhost:3000/')}>Logout</Button>
              <Circle size="32px" bg="orange.500" color="white">
                <Text fontSize="sm" fontWeight="bold">{getInitials(user.name)}</Text>
              </Circle>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="4xl" py="8">
        <VStack gap="8" align="stretch">
          {/* Page Header */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <VStack align="start" gap="4">
              <Text fontSize="3xl" fontWeight="bold" color="gray.900">Profile Settings</Text>
              <Text color="gray.700" fontSize="md">
                Manage your account information and preferences
              </Text>
            </VStack>
          </MotionBox>

          {/* Profile Information */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Box bg="white" borderRadius="xl" boxShadow="sm" overflow="hidden">
              <Box p="6" borderBottom="1px" borderColor="gray.100">
                <HStack justify="space-between">
                  <Text fontSize="xl" fontWeight="semibold" color="gray.900">Personal Information</Text>
                  <Button 
                    size="sm" 
                    variant={isEditing ? "solid" : "outline"}
                    colorScheme={isEditing ? "green" : "orange"}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </Button>
                </HStack>
              </Box>

              <Box p="6">
                <Formik
                  initialValues={{
                    firstName: profile?.firstName || user.givenName || "",
                    lastName: profile?.lastName || user.familyName || "",
                    email: profile?.email || user.email || "",
                    phone: profile?.phone || "",
                    companyName: profile?.companyName || caseSummary?.applicationData?.legalName || "",
                    country: profile?.country || caseSummary?.applicationData?.country || "South Africa",
                    entityType: profile?.entityType || caseSummary?.applicationData?.entityType || "Company"
                  }}
                  validationSchema={profileSchema}
                  onSubmit={handleSaveProfile}
                  enableReinitialize
                >
                  {({ errors, touched, isSubmitting }) => (
                    <Form>
                      <VStack gap="6">
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6" width="100%">
                          <VStack align="start" gap="2">
                            <Text fontSize="sm" fontWeight="medium" color="gray.800">
                              First Name
                            </Text>
                            <Field name="firstName">
                              {({ field }: any) => (
                                <Input
                                  {...field}
                                  readOnly={!isEditing}
                                  bg={isEditing ? "white" : "gray.50"}
                                  color="gray.800"
                                  _placeholder={{ color: "gray.500" }}
                                />
                              )}
                            </Field>
                            {errors.firstName && touched.firstName && (
                              <Text color="red.500" fontSize="sm">{String(errors.firstName)}</Text>
                            )}
                          </VStack>

                          <VStack align="start" gap="2">
                            <Text fontSize="sm" fontWeight="medium" color="gray.800">
                              Last Name
                            </Text>
                            <Field name="lastName">
                              {({ field }: any) => (
                                <Input
                                  {...field}
                                  readOnly={!isEditing}
                                  bg={isEditing ? "white" : "gray.50"}
                                  color="gray.800"
                                  _placeholder={{ color: "gray.500" }}
                                />
                              )}
                            </Field>
                            {errors.lastName && touched.lastName && (
                              <Text color="red.500" fontSize="sm">{String(errors.lastName)}</Text>
                            )}
                          </VStack>
                        </SimpleGrid>

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6" width="100%">
                          <VStack align="start" gap="2">
                            <Text fontSize="sm" fontWeight="medium" color="gray.800">
                              Email Address
                            </Text>
                            <Field name="email">
                              {({ field }: any) => (
                                <Input
                                  {...field}
                                  type="email"
                                  readOnly={true}
                                  bg="gray.50"
                                  color="gray.800"
                                  _placeholder={{ color: "gray.500" }}
                                />
                              )}
                            </Field>
                            <Text fontSize="xs" color="gray.600" fontWeight="medium">
                              Email cannot be changed. Contact support if you need to update your email address.
                            </Text>
                            {errors.email && touched.email && (
                              <Text color="red.500" fontSize="sm">{String(errors.email)}</Text>
                            )}
                          </VStack>

                          <VStack align="start" gap="2">
                            <Text fontSize="sm" fontWeight="medium" color="gray.800">
                              Phone Number
                            </Text>
                            <Field name="phone">
                              {({ field }: any) => (
                                <Input
                                  {...field}
                                  readOnly={!isEditing}
                                  bg={isEditing ? "white" : "gray.50"}
                                  color="gray.800"
                                  _placeholder={{ color: "gray.500" }}
                                />
                              )}
                            </Field>
                            {errors.phone && touched.phone && (
                              <Text color="red.500" fontSize="sm">{String(errors.phone)}</Text>
                            )}
                          </VStack>
                        </SimpleGrid>

                        <Separator />

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6" width="100%">
                          <VStack align="start" gap="2">
                            <Text fontSize="sm" fontWeight="medium" color="gray.800">
                              Company Name
                            </Text>
                            <Field name="companyName">
                              {({ field }: any) => (
                                <Input
                                  {...field}
                                  readOnly={!isEditing}
                                  bg={isEditing ? "white" : "gray.50"}
                                  color="gray.800"
                                  _placeholder={{ color: "gray.500" }}
                                />
                              )}
                            </Field>
                            {errors.companyName && touched.companyName && (
                              <Text color="red.500" fontSize="sm">{String(errors.companyName)}</Text>
                            )}
                          </VStack>

                          <VStack align="start" gap="2">
                            <Text fontSize="sm" fontWeight="medium" color="gray.800">
                              Entity Type
                            </Text>
                            <Field name="entityType">
                              {({ field }: any) => (
                                <Input
                                  {...field}
                                  readOnly={true}
                                  bg="gray.50"
                                  color="gray.800"
                                  _placeholder={{ color: "gray.500" }}
                                />
                              )}
                            </Field>
                            <Text fontSize="xs" color="gray.600" fontWeight="medium">
                              Contact support to change entity type
                            </Text>
                          </VStack>
                        </SimpleGrid>

                        <VStack align="start" gap="2" width="100%">
                          <Text fontSize="sm" fontWeight="medium" color="gray.800">
                            Country
                          </Text>
                          <Field name="country">
                            {({ field }: any) => (
                              isEditing ? (
                                <select
                                  {...field}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid',
                                    borderColor: 'var(--chakra-colors-gray-200)',
                                    background: 'white',
                                    color: 'var(--chakra-colors-gray-800)',
                                    fontSize: '14px',
                                  }}
                                >
                                  <option value="South Africa">South Africa</option>
                                  <option value="Zimbabwe">Zimbabwe</option>
                                  <option value="Botswana">Botswana</option>
                                  <option value="Mozambique">Mozambique</option>
                                </select>
                              ) : (
                                <Input {...field} readOnly bg="gray.50" color="gray.800" _placeholder={{ color: "gray.500" }} />
                              )
                            )}
                          </Field>
                          {errors.country && touched.country && (
                            <Text color="red.500" fontSize="sm">{String(errors.country)}</Text>
                          )}
                        </VStack>

                        {isEditing && (
                          <HStack gap="4" pt="4">
                            <Button 
                              type="submit" 
                              colorScheme="orange" 
                              loading={saving}
                              loadingText="Saving..."
                            >
                              Save Changes
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsEditing(false)}
                            >
                              Cancel
                            </Button>
                          </HStack>
                        )}
                      </VStack>
                    </Form>
                  )}
                </Formik>
              </Box>
            </Box>
          </MotionBox>

          {/* Notification Preferences */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Box bg="white" borderRadius="xl" boxShadow="sm" overflow="hidden">
              <Box p="6" borderBottom="1px" borderColor="gray.100">
                <Text fontSize="xl" fontWeight="semibold" color="gray.900">Notification Preferences</Text>
                <Text fontSize="sm" color="gray.700" mt="1">
                  Choose how you want to receive updates about your application
                </Text>
              </Box>

              <Box p="6">
                <VStack gap="4" align="stretch">
                  <HStack justify="space-between">
                    <VStack align="start" gap="1">
                      <Text fontWeight="medium" color="gray.800">Email Notifications</Text>
                      <Text fontSize="sm" color="gray.700">
                        Receive updates via email
                      </Text>
                    </VStack>
                    <ChakraSwitch.Root
                      checked={notifications.emailNotifications}
                      onCheckedChange={(details) => handleNotificationChange('emailNotifications', details.checked)}
                      colorScheme="orange"
                      size="md"
                    >
                      <ChakraSwitch.HiddenInput />
                      <ChakraSwitch.Control>
                        <ChakraSwitch.Thumb />
                      </ChakraSwitch.Control>
                    </ChakraSwitch.Root>
                  </HStack>

                  <HStack justify="space-between">
                    <VStack align="start" gap="1">
                      <Text fontWeight="medium" color="gray.800">SMS Notifications</Text>
                      <Text fontSize="sm" color="gray.700">
                        Receive updates via SMS
                      </Text>
                    </VStack>
                    <ChakraSwitch.Root
                      checked={notifications.smsNotifications}
                      onCheckedChange={(details) => handleNotificationChange('smsNotifications', details.checked)}
                      colorScheme="orange"
                      size="md"
                    >
                      <ChakraSwitch.HiddenInput />
                      <ChakraSwitch.Control>
                        <ChakraSwitch.Thumb />
                      </ChakraSwitch.Control>
                    </ChakraSwitch.Root>
                  </HStack>

                  <HStack justify="space-between">
                    <VStack align="start" gap="1">
                      <Text fontWeight="medium" color="gray.800">Status Updates</Text>
                      <Text fontSize="sm" color="gray.700">
                        Get notified when your application status changes
                      </Text>
                    </VStack>
                    <ChakraSwitch.Root
                      checked={notifications.statusUpdates}
                      onCheckedChange={(details) => handleNotificationChange('statusUpdates', details.checked)}
                      colorScheme="orange"
                      size="md"
                    >
                      <ChakraSwitch.HiddenInput />
                      <ChakraSwitch.Control>
                        <ChakraSwitch.Thumb />
                      </ChakraSwitch.Control>
                    </ChakraSwitch.Root>
                  </HStack>

                  <HStack justify="space-between">
                    <VStack align="start" gap="1">
                      <Text fontWeight="medium" color="gray.800">Marketing Communications</Text>
                      <Text fontSize="sm" color="gray.700">
                        Receive news and updates about Mukuru services
                      </Text>
                    </VStack>
                    <ChakraSwitch.Root
                      checked={notifications.marketingCommunications}
                      onCheckedChange={(details) => handleNotificationChange('marketingCommunications', details.checked)}
                      colorScheme="orange"
                      size="md"
                    >
                      <ChakraSwitch.HiddenInput />
                      <ChakraSwitch.Control>
                        <ChakraSwitch.Thumb />
                      </ChakraSwitch.Control>
                    </ChakraSwitch.Root>
                  </HStack>
                </VStack>
              </Box>
            </Box>
          </MotionBox>

          {/* Account Actions */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Box bg="white" borderRadius="xl" boxShadow="sm" overflow="hidden">
              <Box p="6" borderBottom="1px" borderColor="gray.100">
                <Text fontSize="xl" fontWeight="semibold" color="gray.900">Account Actions</Text>
              </Box>

              <Box p="6">
                <VStack gap="4" align="stretch">
                  <HStack justify="space-between">
                    <VStack align="start" gap="1">
                      <Text fontWeight="medium" color="gray.800">Change Password</Text>
                      <Text fontSize="sm" color="gray.700">
                        Update your account password
                      </Text>
                    </VStack>
                    <Button variant="outline" size="sm" onClick={onPasswordDialogOpen}>
                      Change Password
                    </Button>
                  </HStack>

                  <HStack justify="space-between">
                    <VStack align="start" gap="1">
                      <Text fontWeight="medium" color="gray.800">Download Data</Text>
                      <Text fontSize="sm" color="gray.700">
                        Download a copy of your application data
                      </Text>
                    </VStack>
                    <Button variant="outline" size="sm" onClick={handleDownloadData}>
                      Download
                    </Button>
                  </HStack>

                  <Separator />

                  <HStack justify="space-between">
                    <VStack align="start" gap="1">
                      <Text fontWeight="medium" color="red.600">Delete Account</Text>
                      <Text fontSize="sm" color="gray.600">
                        Permanently delete your account and all data
                      </Text>
                    </VStack>
                    <Button variant="outline" colorScheme="red" size="sm" onClick={onDeleteDialogOpen}>
                      Delete Account
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </Box>
          </MotionBox>

          {/* Change Password Dialog */}
          <DialogRoot open={isPasswordDialogOpen} onOpenChange={(e) => (e.open ? onPasswordDialogOpen() : onPasswordDialogClose())} modal={true}>
            <DialogBackdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
            <DialogContent 
              maxW="md" 
              position="fixed" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)" 
              zIndex={1500}
              bg="white"
              borderRadius="xl"
              boxShadow="xl"
              border="1px"
              borderColor="gray.200"
            >
              <DialogHeader borderBottom="1px" borderColor="gray.200" pb="4">
                <DialogTitle fontSize="lg" fontWeight="semibold" color="gray.900">Change Password</DialogTitle>
              </DialogHeader>
              <DialogBody pt="6">
                <VStack gap="4" align="stretch">
                  <VStack align="start" gap="2">
                    <Text fontSize="sm" fontWeight="medium" color="gray.800">Current Password</Text>
                    <Input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      bg="white"
                      color="gray.900"
                      borderColor="gray.300"
                      _placeholder={{ color: "gray.500" }}
                      _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px orange.500" }}
                    />
                  </VStack>
                  <VStack align="start" gap="2">
                    <Text fontSize="sm" fontWeight="medium" color="gray.800">New Password</Text>
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      bg="white"
                      color="gray.900"
                      borderColor="gray.300"
                      _placeholder={{ color: "gray.500" }}
                      _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px orange.500" }}
                    />
                  </VStack>
                  <VStack align="start" gap="2">
                    <Text fontSize="sm" fontWeight="medium" color="gray.800">Confirm New Password</Text>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      bg="white"
                      color="gray.900"
                      borderColor="gray.300"
                      _placeholder={{ color: "gray.500" }}
                      _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px orange.500" }}
                    />
                  </VStack>
                </VStack>
              </DialogBody>
              <DialogFooter borderTop="1px" borderColor="gray.200" pt="4">
                <Button variant="outline" onClick={onPasswordDialogClose} mr="2" color="gray.700" borderColor="gray.300" _hover={{ bg: "gray.50" }}>
                  Cancel
                </Button>
                <Button colorScheme="orange" onClick={handleChangePassword} fontWeight="medium">
                  Change Password
                </Button>
              </DialogFooter>
              <DialogCloseTrigger />
            </DialogContent>
          </DialogRoot>

          {/* Delete Account Dialog */}
          <DialogRoot open={isDeleteDialogOpen} onOpenChange={(e) => (e.open ? onDeleteDialogOpen() : onDeleteDialogClose())} modal={true}>
            <DialogBackdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
            <DialogContent 
              maxW="md" 
              position="fixed" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)" 
              zIndex={1500}
              bg="white"
              borderRadius="xl"
              boxShadow="xl"
              border="1px"
              borderColor="gray.200"
            >
              <DialogHeader borderBottom="1px" borderColor="gray.200" pb="4">
                <DialogTitle fontSize="lg" fontWeight="semibold" color="red.600">Delete Account</DialogTitle>
              </DialogHeader>
              <DialogBody pt="6">
                <VStack gap="4" align="stretch">
                  <Alert.Root status="error">
                    <Alert.Indicator>
                      <Icon as={FiAlertCircle} boxSize="5" color="red.500" />
                    </Alert.Indicator>
                    <Alert.Content>
                      <Alert.Title fontWeight="semibold" color="red.700">Warning</Alert.Title>
                      <Alert.Description fontSize="sm" color="red.700">This action cannot be undone. All your data will be permanently deleted.</Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                  <VStack align="start" gap="2">
                    <Text fontSize="sm" fontWeight="medium" color="gray.800">Reason (optional)</Text>
                    <Input
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Why are you deleting your account?"
                      bg="white"
                      color="gray.900"
                      borderColor="gray.300"
                      _placeholder={{ color: "gray.500" }}
                      _focus={{ borderColor: "red.500", boxShadow: "0 0 0 1px red.500" }}
                    />
                  </VStack>
                </VStack>
              </DialogBody>
              <DialogFooter borderTop="1px" borderColor="gray.200" pt="4">
                <Button variant="outline" onClick={onDeleteDialogClose} mr="2" color="gray.700" borderColor="gray.300" _hover={{ bg: "gray.50" }}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleDeleteAccount} fontWeight="medium">
                  Delete Account
                </Button>
              </DialogFooter>
              <DialogCloseTrigger />
            </DialogContent>
          </DialogRoot>
        </VStack>
      </Container>
    </Box>
  );
}
