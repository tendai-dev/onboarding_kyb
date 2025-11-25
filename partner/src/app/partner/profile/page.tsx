"use client";

import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  SimpleGrid,
  Flex,
  Circle,
  Switch as ChakraSwitch,
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
import { Button, Typography, Card, Checkbox, MukuruLogo } from "@/lib/mukuruImports";
import { Input as ChakraInput } from "@chakra-ui/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { FiAlertCircle, FiCheckCircle, FiXCircle, FiInfo, FiX } from "react-icons/fi";
import { getAuthUser, getInitials, logout } from "@/lib/auth/session";
import { useSession } from "next-auth/react";
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

const MotionBox = motion.create(Box);

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

  // Get user from NextAuth session (like admin does)
  const { data: session } = useSession();
  const sessionUser = session?.user;
  
  // Fallback to getAuthUser if session not available
  const fallbackUser = getAuthUser();
  
  // Extract name parts from session or fallback
  const userName = sessionUser?.name || fallbackUser.name || "User";
  const userEmail = sessionUser?.email || fallbackUser.email || "";
  
  // Try to get givenName/familyName from session user first (Keycloak might provide these)
  // Then try fallback user, then extract from name
  let givenName = (sessionUser as any)?.givenName || fallbackUser.givenName || "";
  let familyName = (sessionUser as any)?.familyName || fallbackUser.familyName || "";
  
  // If still not available, extract from full name
  if (!givenName || !familyName) {
    const nameParts = userName.split(' ').filter(p => p.length > 0 && p !== "User");
    if (nameParts.length > 0 && !givenName) {
      givenName = nameParts[0];
    }
    if (nameParts.length > 1 && !familyName) {
      familyName = nameParts.slice(1).join(' ');
    }
  }
  
  const user = {
    name: userName,
    email: userEmail,
    givenName,
    familyName,
  };
  
  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack gap="4">
          <Spinner size="xl" color="orange.500" />
          <Typography color="gray.600">Loading profile...</Typography>
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
              <Typography fontWeight="semibold" fontSize="sm" color="gray.900">
                {toastState.title}
              </Typography>
              {toastState.description && (
                <Typography fontSize="sm" color="gray.700">
                  {toastState.description}
                </Typography>
              )}
            </VStack>
            <Button
              size="sm"
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
              <MukuruLogo height="32px" />
              <Typography color="gray.700" fontSize="sm" fontWeight="medium">Profile</Typography>
            </HStack>
            <HStack gap="4">
              <Button variant="secondary" size="sm" onClick={() => logout('http://localhost:3000/')}>Logout</Button>
              <Circle size="32px" bg="orange.500" color="white">
                <Typography fontSize="sm" fontWeight="bold">{getInitials(userName)}</Typography>
              </Circle>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="5xl" py="8" px={{ base: 4, md: 6 }}>
        <VStack gap="8" align="stretch" width="100%">
          {/* Page Header */}
          <Box>
            <Typography fontSize="2xl" fontWeight="bold" color="gray.900" mb="2">Profile Settings</Typography>
            <Typography color="gray.600" fontSize="sm">
              Manage your account information and preferences
            </Typography>
          </Box>

          {/* Profile Information */}
          <Card bg="white" width="100%">
            <Box p="5" borderBottom="1px" borderColor="gray.200" bg="gray.50">
              <Flex justify="space-between" align="center">
                <Box>
                  <Typography fontSize="lg" fontWeight="bold" color="gray.900" mb="1">Personal Information</Typography>
                  <Typography fontSize="xs" color="gray.600">
                    Your account details from Keycloak
                  </Typography>
                </Box>
                {!isEditing && (
                  <Button 
                    size="sm" 
                    variant="primary"
                    className="mukuru-primary-button"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </Flex>
            </Box>

            <Box p="8" width="100%">
                <Formik
                  key={`form-${givenName}-${familyName}-${userEmail}`}
                  initialValues={{
                    firstName: profile?.firstName || givenName || "",
                    lastName: profile?.lastName || familyName || "",
                    email: profile?.email || userEmail || "",
                    phone: profile?.phone || "",
                    companyName: profile?.companyName || caseSummary?.applicationData?.legalName || "",
                    country: profile?.country || caseSummary?.applicationData?.country || "South Africa",
                    entityType: profile?.entityType || caseSummary?.applicationData?.entityType || "Company"
                  }}
                  validationSchema={profileSchema}
                  onSubmit={handleSaveProfile}
                  enableReinitialize={true}
                >
                  {({ errors, touched, isSubmitting, values }) => {
                    // Debug: Log values to ensure they're populated
                    if (process.env.NODE_ENV === 'development') {
                      console.log('[Profile] Form values:', values);
                      console.log('[Profile] User data:', { givenName, familyName, userEmail });
                    }
                    return (
                    <Form style={{ width: '100%' }}>
                      <VStack gap="8" align="stretch" width="100%">
                        {/* Name Fields */}
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6" width="100%">
                          <Box width="100%">
                            <Typography fontSize="sm" fontWeight="semibold" color="gray.900" mb="3">
                              First Name
                            </Typography>
                            <Field name="firstName">
                              {({ field }: any) => {
                                const displayValue = field.value || givenName || "";
                                return (
                                <ChakraInput
                                  {...field}
                                  value={displayValue}
                                  readOnly={!isEditing}
                                  bg={isEditing ? "white" : "gray.50"}
                                  color="gray.900"
                                  width="100%"
                                  borderColor="gray.300"
                                  borderWidth="1px"
                                  px="4"
                                  py="3"
                                  fontSize="md"
                                  fontWeight={!isEditing ? "medium" : "normal"}
                                  height="44px"
                                  _placeholder={{ color: "gray.400" }}
                                  _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px orange.500" }}
                                  placeholder="Enter first name"
                                />
                              );
                              }}
                            </Field>
                            {errors.firstName && touched.firstName && (
                              <Typography color="red.500" fontSize="xs" mt="1">{String(errors.firstName)}</Typography>
                            )}
                          </Box>

                              <Box width="100%">
                                <Typography fontSize="sm" fontWeight="semibold" color="gray.900" mb="3">
                                  Last Name
                                </Typography>
                            <Field name="lastName">
                              {({ field }: any) => {
                                // Use field.value if set, otherwise use familyName, with fallback
                                const displayValue = field.value || familyName || (userName && userName !== "User" ? userName.split(' ').slice(1).join(' ') : "") || "";
                                return (
                                <ChakraInput
                                  {...field}
                                  value={displayValue}
                                  readOnly={!isEditing}
                                  bg={isEditing ? "white" : "gray.50"}
                                  color="gray.900"
                                  width="100%"
                                  borderColor="gray.300"
                                  borderWidth="1px"
                                  px="4"
                                  py="3"
                                  fontSize="md"
                                  fontWeight={!isEditing ? "medium" : "normal"}
                                  height="44px"
                                  _placeholder={{ color: "gray.400" }}
                                  _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px orange.500" }}
                                  placeholder="Enter last name"
                                />
                              );
                              }}
                            </Field>
                            {errors.lastName && touched.lastName && (
                              <Typography color="red.500" fontSize="xs" mt="1">{String(errors.lastName)}</Typography>
                            )}
                          </Box>
                        </SimpleGrid>

                        {/* Contact Fields */}
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6" width="100%">
                          <Box width="100%">
                            <Typography fontSize="sm" fontWeight="semibold" color="gray.900" mb="3">
                              Email Address
                            </Typography>
                            <Field name="email">
                              {({ field }: any) => (
                                <ChakraInput
                                  {...field}
                                  type="email"
                                  value={field.value || userEmail || ""}
                                  readOnly={true}
                                  bg="gray.100"
                                  color="gray.900"
                                  width="100%"
                                  borderColor="gray.300"
                                  borderWidth="1px"
                                  px="4"
                                  py="3"
                                  fontSize="md"
                                  fontWeight="medium"
                                  height="44px"
                                  _placeholder={{ color: "gray.400" }}
                                />
                              )}
                            </Field>
                            {errors.email && touched.email && (
                              <Typography color="red.500" fontSize="xs" mt="1">{String(errors.email)}</Typography>
                            )}
                          </Box>

                          <Box width="100%">
                            <Typography fontSize="sm" fontWeight="semibold" color="gray.900" mb="3">
                              Phone Number
                            </Typography>
                            <Field name="phone">
                              {({ field }: any) => (
                                <ChakraInput
                                  {...field}
                                  type="tel"
                                  value={field.value || ""}
                                  readOnly={!isEditing}
                                  bg={isEditing ? "white" : "gray.50"}
                                  color="gray.900"
                                  width="100%"
                                  borderColor="gray.300"
                                  borderWidth="1px"
                                  px="4"
                                  py="3"
                                  fontSize="md"
                                  fontWeight={!isEditing ? "medium" : "normal"}
                                  height="44px"
                                  _placeholder={{ color: "gray.400" }}
                                  _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px orange.500" }}
                                  placeholder="+27 12 345 6789"
                                />
                              )}
                            </Field>
                            {errors.phone && touched.phone && (
                              <Typography color="red.500" fontSize="xs" mt="1">{String(errors.phone)}</Typography>
                            )}
                          </Box>
                        </SimpleGrid>

                        <Separator borderColor="gray.200" my="4" />

                        {/* Company & Location Fields */}
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6" width="100%">
                          <Box width="100%">
                            <Typography fontSize="sm" fontWeight="semibold" color="gray.900" mb="3">
                              Company Name
                            </Typography>
                            <Field name="companyName">
                              {({ field }: any) => (
                                <ChakraInput
                                  {...field}
                                  value={field.value || ""}
                                  readOnly={!isEditing}
                                  bg={isEditing ? "white" : "gray.50"}
                                  color="gray.900"
                                  width="100%"
                                  borderColor="gray.300"
                                  borderWidth="1px"
                                  px="4"
                                  py="3"
                                  fontSize="md"
                                  fontWeight={!isEditing ? "medium" : "normal"}
                                  height="44px"
                                  _placeholder={{ color: "gray.400" }}
                                  _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px orange.500" }}
                                  placeholder="Enter company name"
                                />
                              )}
                            </Field>
                            {errors.companyName && touched.companyName && (
                              <Typography color="red.500" fontSize="xs" mt="1">{String(errors.companyName)}</Typography>
                            )}
                          </Box>

                          <Box width="100%">
                            <Typography fontSize="sm" fontWeight="semibold" color="gray.900" mb="3">
                              Country
                            </Typography>
                            <Field name="country">
                              {({ field }: any) => (
                                isEditing ? (
                                  <select
                                    {...field}
                                    value={field.value || "South Africa"}
                                    style={{
                                      width: '100%',
                                      padding: '12px 16px',
                                      borderRadius: '6px',
                                      border: '1px solid #D1D5DB',
                                      background: 'white',
                                      color: '#111827',
                                      fontSize: '16px',
                                      height: '44px',
                                    }}
                                  >
                                    <option value="South Africa">South Africa</option>
                                    <option value="Zimbabwe">Zimbabwe</option>
                                    <option value="Botswana">Botswana</option>
                                    <option value="Mozambique">Mozambique</option>
                                  </select>
                                ) : (
                                  <ChakraInput 
                                    {...field} 
                                    value={field.value || "South Africa"}
                                    readOnly 
                                    bg="gray.50" 
                                    color="gray.900" 
                                    width="100%" 
                                    borderColor="gray.300"
                                    borderWidth="1px"
                                    px="4"
                                    py="3"
                                    fontSize="md"
                                    fontWeight="medium"
                                    height="44px"
                                    _placeholder={{ color: "gray.400" }} 
                                  />
                                )
                              )}
                            </Field>
                            {errors.country && touched.country && (
                              <Typography color="red.500" fontSize="xs" mt="1">{String(errors.country)}</Typography>
                            )}
                          </Box>
                        </SimpleGrid>

                        {/* Entity Type Field */}
                        <Box width="100%">
                          <Typography fontSize="sm" fontWeight="semibold" color="gray.900" mb="3">
                            Entity Type
                          </Typography>
                          <Field name="entityType">
                            {({ field }: any) => (
                              <ChakraInput
                                {...field}
                                value={field.value || "Company"}
                                readOnly={true}
                                bg="gray.100"
                                color="gray.900"
                                width="100%"
                                borderColor="gray.300"
                                borderWidth="1px"
                                px="4"
                                py="3"
                                fontSize="md"
                                fontWeight="medium"
                                height="44px"
                                _placeholder={{ color: "gray.400" }}
                              />
                            )}
                          </Field>
                        </Box>

                        {isEditing && (
                          <HStack gap="3" pt="4" justify="flex-end" width="100%">
                            <Button 
                              variant="secondary" 
                              onClick={() => setIsEditing(false)}
                              size="sm"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="mukuru-primary-button"
                              loading={saving}
                              loadingText="Saving..."
                              size="sm"
                            >
                              Save Changes
                            </Button>
                          </HStack>
                        )}
                      </VStack>
                    </Form>
                    );
                  }}
                </Formik>
              </Box>
            </Card>

          {/* Notification Preferences */}
          <Card bg="white" width="100%">
            <Box p="5" borderBottom="1px" borderColor="gray.200" bg="gray.50">
              <Box>
                <Typography fontSize="lg" fontWeight="bold" color="gray.900" mb="1">Notification Preferences</Typography>
                <Typography fontSize="xs" color="gray.600">
                  Choose how you want to receive updates about your application
                </Typography>
              </Box>
            </Box>

            <Box p="8" width="100%">
              <VStack gap="6" align="stretch" width="100%">
                <HStack justify="space-between" align="center" width="100%" py="2">
                  <Box flex="1" minW="0">
                    <Typography fontWeight="semibold" color="gray.900" fontSize="md" mb="1">Email Notifications</Typography>
                    <Typography fontSize="sm" color="gray.600">
                      Receive updates via email
                    </Typography>
                  </Box>
                  <Box flexShrink={0} ml="4">
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
                  </Box>
                </HStack>

                <HStack justify="space-between" align="center" width="100%" py="2">
                  <Box flex="1" minW="0">
                    <Typography fontWeight="semibold" color="gray.900" fontSize="md" mb="1">SMS Notifications</Typography>
                    <Typography fontSize="sm" color="gray.600">
                      Receive updates via SMS
                    </Typography>
                  </Box>
                  <Box flexShrink={0} ml="4">
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
                  </Box>
                </HStack>

                <HStack justify="space-between" align="center" width="100%" py="2">
                  <Box flex="1" minW="0">
                    <Typography fontWeight="semibold" color="gray.900" fontSize="md" mb="1">Status Updates</Typography>
                    <Typography fontSize="sm" color="gray.600">
                      Get notified when your application status changes
                    </Typography>
                  </Box>
                  <Box flexShrink={0} ml="4">
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
                  </Box>
                </HStack>

                <HStack justify="space-between" align="center" width="100%" py="2">
                  <Box flex="1" minW="0">
                    <Typography fontWeight="semibold" color="gray.900" fontSize="md" mb="1">Marketing Communications</Typography>
                    <Typography fontSize="sm" color="gray.600">
                      Receive news and updates about Mukuru services
                    </Typography>
                  </Box>
                  <Box flexShrink={0} ml="4">
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
                  </Box>
                </HStack>
              </VStack>
            </Box>
          </Card>

          {/* Account Actions */}
          <Card bg="white" width="100%">
            <Box p="5" borderBottom="1px" borderColor="gray.200" bg="gray.50">
              <Typography fontSize="lg" fontWeight="bold" color="gray.900">Account Actions</Typography>
            </Box>

            <Box p="8" width="100%">
              <VStack gap="6" align="stretch" width="100%">
                {/* Change Password Row */}
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="space-between" 
                  width="100%" 
                  minH="48px"
                  py="2"
                >
                  <Box flex="1" minW="0" mr="4">
                    <Typography fontWeight="semibold" color="gray.900" fontSize="md" mb="1">
                      Change Password
                    </Typography>
                    <Typography fontSize="sm" color="gray.600">
                      Update your account password
                    </Typography>
                  </Box>
                  <Box flexShrink={0}>
                    <Button variant="secondary" size="sm" onClick={onPasswordDialogOpen}>
                      Change
                    </Button>
                  </Box>
                </Box>

                {/* Download Data Row */}
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="space-between" 
                  width="100%" 
                  minH="48px"
                  py="2"
                >
                  <Box flex="1" minW="0" mr="4">
                    <Typography fontWeight="semibold" color="gray.900" fontSize="md" mb="1">
                      Download Data
                    </Typography>
                    <Typography fontSize="sm" color="gray.600">
                      Download a copy of your application data
                    </Typography>
                  </Box>
                  <Box flexShrink={0}>
                    <Button variant="secondary" size="sm" onClick={handleDownloadData}>
                      Download
                    </Button>
                  </Box>
                </Box>

                <Separator borderColor="gray.200" my="2" />

                {/* Delete Account Row */}
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="space-between" 
                  width="100%" 
                  minH="48px"
                  py="2"
                >
                  <Box flex="1" minW="0" mr="4">
                    <Typography fontWeight="semibold" color="red.600" fontSize="md" mb="1">
                      Delete Account
                    </Typography>
                    <Typography fontSize="sm" color="gray.600">
                      Permanently delete your account and all data
                    </Typography>
                  </Box>
                  <Box flexShrink={0}>
                    <Button variant="secondary" size="sm" onClick={onDeleteDialogOpen} style={{ color: '#dc2626' }}>
                      Delete
                    </Button>
                  </Box>
                </Box>
              </VStack>
            </Box>
          </Card>

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
                    <Typography fontSize="sm" fontWeight="medium" color="gray.800">Current Password</Typography>
                    <ChakraInput
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
                    <Typography fontSize="sm" fontWeight="medium" color="gray.800">New Password</Typography>
                    <ChakraInput
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
                    <Typography fontSize="sm" fontWeight="medium" color="gray.800">Confirm New Password</Typography>
                    <ChakraInput
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
                <Button variant="secondary" onClick={onPasswordDialogClose} mr="2">
                  Cancel
                </Button>
                <Button className="mukuru-primary-button" onClick={handleChangePassword} fontWeight="medium">
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
                    <Typography fontSize="sm" fontWeight="medium" color="gray.800">Reason (optional)</Typography>
                    <ChakraInput
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
                <Button variant="secondary" onClick={onDeleteDialogClose} mr="2">
                  Cancel
                </Button>
                <Button onClick={handleDeleteAccount} fontWeight="medium" style={{ backgroundColor: '#dc2626', color: 'white' }}>
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
