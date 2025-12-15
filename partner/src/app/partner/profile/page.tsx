'use client';
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Icon,
  useDisclosure,
} from '@chakra-ui/react';
import {
  Button,
  Typography,
  Card,
  MukuruLogo,
  AlertBar,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  PhoneInput,
} from '@/lib/mukuruImports';
import Link from 'next/link';
import { PartnerHeader } from '@/components/PartnerHeader';
import { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { FiCheckCircle, FiXCircle, FiInfo, FiX, FiLogOut } from 'react-icons/fi';
import { getAuthUser, getInitials } from '@/lib/auth/session';
import { useSession, signOut } from 'next-auth/react';
import {
  getUserProfile,
  updateUserProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
  changePassword,
  downloadUserData,
  deleteUserAccount,
  getUserCaseSummary,
  type UserProfile,
  type UserPreferences,
  type ChangePasswordRequest,
} from '@/lib/api';
import { useRequireAuth } from '@/hooks/useRequireAuth';

// MotionBox removed - not used

const profileSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string(),
  companyName: Yup.string(),
  country: Yup.string().required('Country is required'),
});

export default function PartnerProfilePage() {
  useRequireAuth();
  const {
    open: isPasswordDialogOpen,
    onOpen: onPasswordDialogOpen,
    onClose: onPasswordDialogClose,
  } = useDisclosure();
  const {
    open: isDeleteDialogOpen,
    onOpen: onDeleteDialogOpen,
    onClose: onDeleteDialogClose,
  } = useDisclosure();

  const handleDeleteDialogClose = () => {
    setDeleteConfirmation('');
    setDeleteReason('');
    onDeleteDialogClose();
  };

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<UserPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    statusUpdates: true,
    marketingCommunications: false,
  });
  const [caseSummary, setCaseSummary] = useState<any>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('GB'); // Default to GB (+44)
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [toastState, setToastState] = useState<{
    status: 'success' | 'error' | 'info';
    title: string;
    description?: string;
  } | null>(null);

  // Toast helper function
  const showToast = (args: {
    status: 'success' | 'error' | 'info';
    title: string;
    description?: string;
  }) => {
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
          getUserCaseSummary(),
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
            description: 'Could not load profile data. Please refresh the page.',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveProfile = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const updated = await updateUserProfile({
        firstName: values.firstName as string,
        lastName: values.lastName as string,
        middleName: values.middleName as string | undefined,
        phone: values.phone as string | undefined,
        country: values.country as string | undefined,
        companyName: values.companyName as string | undefined,
        preferences: notifications,
      });

      setProfile(updated);
      setIsEditing(false);
      showToast({
        status: 'success',
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      showToast({
        status: 'error',
        title: 'Failed to save',
        description: error.message || 'Could not update profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);

    try {
      // Save immediately when toggled
      await updateNotificationPreferences(updated);
      showToast({
        status: 'success',
        title: 'Preferences updated',
        description: 'Your notification preferences have been saved.',
      });
    } catch (error: any) {
      // Revert on error
      setNotifications(notifications);
      showToast({
        status: 'error',
        title: 'Failed to update',
        description: error.message || 'Could not update preferences. Please try again.',
      });
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast({
        status: 'error',
        title: 'Passwords do not match',
      });
      return;
    }

    try {
      const result = await changePassword(passwordForm);
      if (result.success) {
        showToast({
          status: 'success',
          title: 'Password changed',
          description: 'Your password has been updated successfully.',
        });
        onPasswordDialogClose();
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error: any) {
      showToast({
        status: 'error',
        title: 'Failed to change password',
        description: error.message || 'Could not change password. Please try again.',
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
        description: 'Your data has been downloaded successfully.',
      });
    } catch (error: any) {
      showToast({
        status: 'error',
        title: 'Failed to download',
        description: error.message || 'Could not download your data. Please try again.',
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Clear any local storage/session storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      // Use NextAuth signOut with redirect
      await signOut({ 
        callbackUrl: '/auth/login',
        redirect: true 
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if signOut fails
      window.location.href = '/auth/login';
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const result = await deleteUserAccount({ reason: deleteReason });
      if (result.success) {
        showToast({
          status: 'success',
          title: 'Account deleted',
          description: 'Your account has been permanently deleted.',
        });
        // Logout and redirect
        setTimeout(() => {
          handleLogout();
        }, 2000);
      }
    } catch (error: any) {
      showToast({
        status: 'error',
        title: 'Failed to delete account',
        description:
          error.message || 'Could not delete your account. Please contact support.',
      });
    }
  };

  // Get user from NextAuth session (like admin does)
  const { data: session } = useSession();
  const sessionUser = session?.user;

  // Fallback to getAuthUser if session not available
  const fallbackUser = getAuthUser();

  // Extract name parts from session or fallback
  const userName = sessionUser?.name || fallbackUser.name || 'User';
  const userEmail = sessionUser?.email || fallbackUser.email || '';

  // Try to get givenName/familyName from session user first (Keycloak might provide these)
  // Then try fallback user, then extract from name
  let givenName = (sessionUser as any)?.givenName || fallbackUser.givenName || '';
  let familyName = (sessionUser as any)?.familyName || fallbackUser.familyName || '';

  // If still not available, extract from full name
  if (!givenName || !familyName) {
    const nameParts = userName.split(' ').filter((p) => p.length > 0 && p !== 'User');
    if (nameParts.length > 0 && !givenName) {
      givenName = nameParts[0];
    }
    if (nameParts.length > 1 && !familyName) {
      familyName = nameParts.slice(1).join(' ');
    }
  }

  // User object removed - not used

  if (loading) {
    return (
      <Box
        minH="100vh"
        bg="mukuru.background.light"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack gap="5">
          <Spinner size="xl" color="mukuru.buttons.primary" />
          <Typography color="mukuru.text.primary" fontSize="lg" fontWeight="500">
            Loading profile...
          </Typography>
        </VStack>
      </Box>
    );
  }

  // Do not block the page if there is no application; render profile with auth data

  return (
    <Box minH="100vh" bg="mukuru.background.light" position="relative">
      <PartnerHeader />
      {/* Toast Notification */}
      {toastState && (
        <Box
          position="fixed"
          top="4"
          right="4"
          zIndex={9999}
          maxW="400px"
          borderRadius="lg"
          bg="white"
          border="1px solid"
          borderColor={
            toastState.status === 'success'
              ? 'mukuru.text.success'
              : toastState.status === 'error'
                ? 'mukuru.text.error'
                : 'mukuru.teal'
          }
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
          overflow="hidden"
        >
          <Box
            h="4px"
            w="100%"
            bg={
              toastState.status === 'success'
                ? 'mukuru.text.success'
                : toastState.status === 'error'
                  ? 'mukuru.text.error'
                  : 'mukuru.teal'
            }
          />
          <Box p="4">
            <HStack gap="3" align="start">
              <Icon
                as={
                  toastState.status === 'success'
                    ? FiCheckCircle
                    : toastState.status === 'error'
                      ? FiXCircle
                      : FiInfo
                }
                color={
                  toastState.status === 'success'
                    ? 'mukuru.text.success'
                    : toastState.status === 'error'
                      ? 'mukuru.text.error'
                      : 'mukuru.teal'
                }
                boxSize="5"
                flexShrink={0}
                mt="0.5"
              />
              <VStack align="start" gap="1" flex="1">
                <Typography fontWeight="semibold" fontSize="sm" color="mukuru.text.primary">
                  {toastState.title}
                </Typography>
                {toastState.description && (
                  <Typography fontSize="sm" color="mukuru.grey.mediumDark">
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
        </Box>
      )}
      <Container maxW="6xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6, lg: 8 }}>
        <VStack gap={{ base: 6, md: 8 }} align="stretch" width="100%">
          {/* Page Header */}
          <VStack align="start" gap="3" mb={{ base: 2, md: 4 }} width="100%">
            <Typography fontSize="3xl" fontWeight="bold" color="mukuru.text.primary">
              Profile Settings
            </Typography>
            <Typography color="mukuru.grey.mediumDark" fontSize="md" mt="0">
              Manage your account information and preferences
            </Typography>
          </VStack>

          {/* Profile Information */}
          <Card
            bg="mukuru.cards.white"
            width="100%"
            minH="auto"
            borderRadius="lg"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.08)"
            overflow="visible"
            borderColor="mukuru.grey.light"
            borderWidth="1px"
            style={{ height: 'auto', minHeight: 'auto', maxHeight: 'none' }}
            css={{
              height: 'auto !important',
              minHeight: 'auto !important',
              maxHeight: 'none !important',
            }}
          >
            <Box p={{ base: 5, md: 6 }} borderBottom="1px" borderColor="mukuru.grey.light" bg="mukuru.cards.white">
              <Flex
                justify="space-between"
                align={{ base: 'start', md: 'center' }}
                flexWrap={{ base: 'wrap', md: 'nowrap' }}
                gap="4"
              >
                <VStack align="start" gap="2" flex="1" minW="0">
                  <Typography fontSize="xl" fontWeight="bold" color="mukuru.text.primary">
                    Personal Information
                  </Typography>
                  <Typography fontSize="sm" color="mukuru.grey.mediumDark" mt="0">
                    Your account details from Keycloak
                  </Typography>
                </VStack>
                {!isEditing && (
                  <Button
                    size="md"
                    variant="primary"
                    className="mukuru-primary-button"
                    onClick={() => setIsEditing(true)}
                    flexShrink={0}
                    px="6"
                  >
                    Edit Profile
                  </Button>
                )}
              </Flex>
            </Box>

            <Box
              p={{ base: 5, md: 6, lg: 8 }}
              width="100%"
              display="block"
              visibility="visible"
              bg="mukuru.cards.white"
            >
              <Formik
                key={`form-${givenName}-${familyName}-${userEmail}`}
                initialValues={{
                  firstName: profile?.firstName || givenName || '',
                  lastName: profile?.lastName || familyName || '',
                  email: profile?.email || userEmail || '',
                  phone: profile?.phone || '',
                  companyName:
                    profile?.companyName || caseSummary?.applicationData?.legalName || '',
                  country:
                    profile?.country ||
                    caseSummary?.applicationData?.country ||
                    'South Africa',
                  entityType:
                    profile?.entityType ||
                    caseSummary?.applicationData?.entityType ||
                    'Company',
                }}
                validationSchema={profileSchema}
                onSubmit={handleSaveProfile}
                enableReinitialize={true}
              >
                {({ errors, touched, values }) => {
                  // Debug: Log values to ensure they're populated
                  if (process.env.NODE_ENV === 'development') {
                    console.info('[Profile] Form values:', values);
                    console.info('[Profile] User data:', {
                      givenName,
                      familyName,
                      userEmail,
                    });
                  }
                  return (
                    <Form style={{ width: '100%' }}>
                      <VStack gap={{ base: 4, md: 6 }} align="stretch" width="100%">
                        {/* Name Fields */}
                        <SimpleGrid
                          columns={{ base: 1, md: 2 }}
                          gap={{ base: 4, md: 6 }}
                          width="100%"
                        >
                          <Box width="100%">
                            <Typography
                              fontSize="sm"
                              fontWeight="600"
                              color="mukuru.text.primary"
                              mb="2"
                            >
                              First Name
                            </Typography>
                            <Field name="firstName">
                              {({ field }: { field: Record<string, unknown> }) => {
                                const displayValue =
                                  (field.value as string) || givenName || '';
                                return (
                                  <Input
                                    {...(field as Record<string, unknown>)}
                                    value={displayValue}
                                    readOnly={!isEditing}
                                    placeholder="Enter first name"
                                  />
                                );
                              }}
                            </Field>
                            {errors.firstName && touched.firstName && (
                              <Typography color="mukuru.text.error" fontSize="xs" mt="1">
                                {String(errors.firstName)}
                              </Typography>
                            )}
                          </Box>

                          <Box width="100%">
                            <Typography
                              fontSize="sm"
                              fontWeight="600"
                              color="mukuru.text.primary"
                              mb="2"
                            >
                              Last Name
                            </Typography>
                            <Field name="lastName">
                              {({ field }: { field: Record<string, unknown> }) => {
                                // Use field.value if set, otherwise use familyName, with fallback
                                const displayValue =
                                  (field.value as string) ||
                                  familyName ||
                                  (userName && userName !== 'User'
                                    ? userName.split(' ').slice(1).join(' ')
                                    : '') ||
                                  '';
                                return (
                                  <Input
                                    {...(field as Record<string, unknown>)}
                                    value={displayValue}
                                    readOnly={!isEditing}
                                    placeholder="Enter last name"
                                  />
                                );
                              }}
                            </Field>
                            {errors.lastName && touched.lastName && (
                              <Typography color="mukuru.text.error" fontSize="xs" mt="1">
                                {String(errors.lastName)}
                              </Typography>
                            )}
                          </Box>
                        </SimpleGrid>

                        {/* Contact Fields */}
                        <SimpleGrid
                          columns={{ base: 1, md: 2 }}
                          gap={{ base: 4, md: 6 }}
                          width="100%"
                        >
                          <Box width="100%">
                            <Typography
                              fontSize="sm"
                              fontWeight="600"
                              color="mukuru.text.primary"
                              mb="2"
                            >
                              Email Address
                            </Typography>
                            <Field name="email">
                              {({ field }: { field: Record<string, unknown> }) => (
                                <Input
                                  {...(field as Record<string, unknown>)}
                                  type="email"
                                  value={(field.value as string) || userEmail || ''}
                                  readOnly={true}
                                />
                              )}
                            </Field>
                            {errors.email && touched.email && (
                              <Typography color="mukuru.text.error" fontSize="xs" mt="1">
                                {String(errors.email)}
                              </Typography>
                            )}
                          </Box>

                          <Box width="100%">
                            <Typography
                              fontSize="sm"
                              fontWeight="600"
                              color="mukuru.text.primary"
                              mb="2"
                            >
                              Phone Number
                            </Typography>
                            <Box className="phone-input-wrapper" width="100%">
                              <Field name="phone">
                                {({ field }: { field: Record<string, unknown> }) => (
                                  <PhoneInput
                                    value={(field.value as string) || ''}
                                    onChange={(
                                      val: string | React.ChangeEvent<HTMLInputElement>
                                    ) => {
                                      const stringValue =
                                        typeof val === 'string' ? val : val.target.value;
                                      const onChange = field.onChange as
                                        | ((
                                            e: React.ChangeEvent<HTMLInputElement>
                                          ) => void)
                                        | undefined;
                                      onChange?.({
                                        target: { value: stringValue },
                                      } as React.ChangeEvent<HTMLInputElement>);
                                    }}
                                    onCountryCodeChange={(countryCode: string) => {
                                      if (
                                        countryCode &&
                                        countryCode !== selectedCountryCode
                                      ) {
                                        setSelectedCountryCode(countryCode);
                                      }
                                    }}
                                    disabled={!isEditing}
                                    placeholder="Enter phone number"
                                  />
                                )}
                              </Field>
                            </Box>
                            {errors.phone && touched.phone && (
                              <Typography color="mukuru.text.error" fontSize="xs" mt="1">
                                {String(errors.phone)}
                              </Typography>
                            )}
                          </Box>
                        </SimpleGrid>

                        <Separator borderColor="mukuru.grey.light" my={{ base: 4, md: 6 }} />

                        {/* Company & Location Fields */}
                        <SimpleGrid
                          columns={{ base: 1, md: 2 }}
                          gap={{ base: 4, md: 6 }}
                          width="100%"
                        >
                          <Box width="100%">
                            <Typography
                              fontSize="sm"
                              fontWeight="600"
                              color="mukuru.text.primary"
                              mb="2"
                            >
                              Company Name
                            </Typography>
                            <Field name="companyName">
                              {({ field }: { field: Record<string, unknown> }) => (
                                <Input
                                  {...(field as Record<string, unknown>)}
                                  value={(field.value as string) || ''}
                                  readOnly={!isEditing}
                                  placeholder="Enter company name"
                                />
                              )}
                            </Field>
                            {errors.companyName && touched.companyName && (
                              <Typography color="mukuru.text.error" fontSize="xs" mt="1">
                                {String(errors.companyName)}
                              </Typography>
                            )}
                          </Box>

                          <Box width="100%">
                            <Typography
                              fontSize="sm"
                              fontWeight="600"
                              color="mukuru.text.primary"
                              mb="2"
                            >
                              Country
                            </Typography>
                            <Field name="country">
                              {({ field }: { field: Record<string, unknown> }) =>
                                isEditing ? (
                                  <select
                                    {...(field as Record<string, unknown>)}
                                    value={(field.value as string) || 'South Africa'}
                                    style={{
                                      width: '100%',
                                      padding: '12px 16px',
                                      borderRadius: '6px',
                                      border: '1px solid var(--mukuru-grey-light)',
                                      background: 'var(--mukuru-white)',
                                      color: 'var(--mukuru-text-primary)',
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
                                  <Input
                                    {...(field as Record<string, unknown>)}
                                    value={(field.value as string) || 'South Africa'}
                                    readOnly
                                  />
                                )
                              }
                            </Field>
                            {errors.country && touched.country && (
                              <Typography color="mukuru.text.error" fontSize="xs" mt="1">
                                {String(errors.country)}
                              </Typography>
                            )}
                          </Box>
                        </SimpleGrid>

                        {/* Entity Type Field */}
                        <Box width="100%">
                          <Typography
                            fontSize="sm"
                            fontWeight="600"
                            color="mukuru.text.primary"
                            mb="2"
                          >
                            Entity Type
                          </Typography>
                          <Field name="entityType">
                            {({ field }: { field: Record<string, unknown> }) => (
                              <Input
                                {...(field as Record<string, unknown>)}
                                value={(field.value as string) || 'Company'}
                                readOnly={true}
                              />
                            )}
                          </Field>
                        </Box>

                        {isEditing && (
                          <HStack
                            gap="3"
                            pt={{ base: 4, md: 6 }}
                            justify="flex-end"
                            width="100%"
                            flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                            borderTop="1px"
                            borderColor="mukuru.grey.light"
                            mt="4"
                          >
                            <Button
                              variant="secondary"
                              onClick={() => setIsEditing(false)}
                              size="md"
                              width={{ base: '100%', sm: 'auto' }}
                              px="6"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              className="mukuru-primary-button"
                              loading={saving}
                              loadingText="Saving..."
                              size="md"
                              width={{ base: '100%', sm: 'auto' }}
                              px="6"
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
          <Card
            bg="mukuru.cards.white"
            width="100%"
            minH="auto"
            borderRadius="lg"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.08)"
            overflow="visible"
            borderColor="mukuru.grey.light"
            borderWidth="1px"
            style={{ height: 'auto', minHeight: 'auto', maxHeight: 'none' }}
            css={{
              height: 'auto !important',
              minHeight: 'auto !important',
              maxHeight: 'none !important',
            }}
          >
            <Box
              p={{ base: 5, md: 6 }}
              borderBottom="1px"
              borderColor="mukuru.grey.light"
              bg="mukuru.cards.white"
            >
              <VStack align="start" gap="2">
                <Typography fontSize="xl" fontWeight="bold" color="mukuru.text.primary">
                  Notification Preferences
                </Typography>
                <Typography fontSize="sm" color="mukuru.grey.mediumDark" mt="0">
                  Choose how you want to receive updates about your application
                </Typography>
              </VStack>
            </Box>

            <Box
              p={{ base: 5, md: 6, lg: 8 }}
              width="100%"
              display="block"
              visibility="visible"
              bg="mukuru.cards.white"
            >
              <VStack gap="0" align="stretch" width="100%">
                <HStack
                  justify="space-between"
                  align="center"
                  width="100%"
                  py={{ base: 4, md: 5 }}
                  borderBottom="1px"
                  borderColor="mukuru.grey.light"
                  flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                  gap={{ base: 3, sm: 0 }}
                >
                  <VStack align="start" gap="1" flex="1" minW="0" pr={{ base: 0, sm: 4 }}>
                    <Typography fontWeight="600" color="mukuru.text.primary" fontSize="md">
                      Email Notifications
                    </Typography>
                    <Typography fontSize="sm" color="mukuru.grey.mediumDark" mt="0">
                      Receive updates via email
                    </Typography>
                  </VStack>
                  <Box flexShrink={0}>
                    <ChakraSwitch.Root
                      checked={notifications.emailNotifications}
                      onCheckedChange={(details) =>
                        handleNotificationChange('emailNotifications', details.checked)
                      }
                      size="md"
                    >
                      <ChakraSwitch.HiddenInput />
                      <ChakraSwitch.Control>
                        <ChakraSwitch.Thumb />
                      </ChakraSwitch.Control>
                    </ChakraSwitch.Root>
                  </Box>
                </HStack>

                <HStack
                  justify="space-between"
                  align="center"
                  width="100%"
                  py={{ base: 4, md: 5 }}
                  borderBottom="1px"
                  borderColor="mukuru.grey.light"
                  flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                  gap={{ base: 3, sm: 0 }}
                >
                  <VStack align="start" gap="1" flex="1" minW="0" pr={{ base: 0, sm: 4 }}>
                    <Typography fontWeight="600" color="mukuru.text.primary" fontSize="md">
                      SMS Notifications
                    </Typography>
                    <Typography fontSize="sm" color="mukuru.grey.mediumDark" mt="0">
                      Receive updates via SMS
                    </Typography>
                  </VStack>
                  <Box flexShrink={0}>
                    <ChakraSwitch.Root
                      checked={notifications.smsNotifications}
                      onCheckedChange={(details) =>
                        handleNotificationChange('smsNotifications', details.checked)
                      }
                      size="md"
                    >
                      <ChakraSwitch.HiddenInput />
                      <ChakraSwitch.Control>
                        <ChakraSwitch.Thumb />
                      </ChakraSwitch.Control>
                    </ChakraSwitch.Root>
                  </Box>
                </HStack>

                <HStack
                  justify="space-between"
                  align="center"
                  width="100%"
                  py={{ base: 4, md: 5 }}
                  flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                  gap={{ base: 3, sm: 0 }}
                >
                  <VStack align="start" gap="1" flex="1" minW="0" pr={{ base: 0, sm: 4 }}>
                    <Typography fontWeight="600" color="mukuru.text.primary" fontSize="md">
                      Status Updates
                    </Typography>
                    <Typography fontSize="sm" color="mukuru.grey.mediumDark" mt="0">
                      Get notified when your application status changes
                    </Typography>
                  </VStack>
                  <Box flexShrink={0}>
                    <ChakraSwitch.Root
                      checked={notifications.statusUpdates}
                      onCheckedChange={(details) =>
                        handleNotificationChange('statusUpdates', details.checked)
                      }
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
          <Card
            bg="mukuru.cards.white"
            width="100%"
            minH="auto"
            borderRadius="lg"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.08)"
            overflow="visible"
            borderColor="mukuru.grey.light"
            borderWidth="1px"
            style={{ height: 'auto', minHeight: 'auto', maxHeight: 'none' }}
            css={{
              height: 'auto !important',
              minHeight: 'auto !important',
              maxHeight: 'none !important',
            }}
          >
            <Box
              p={{ base: 5, md: 6 }}
              borderBottom="1px"
              borderColor="mukuru.grey.light"
              bg="mukuru.cards.white"
            >
              <Typography fontSize="xl" fontWeight="bold" color="mukuru.text.primary">
                Account Actions
              </Typography>
            </Box>

            <Box
              p={{ base: 5, md: 6, lg: 8 }}
              width="100%"
              display="block"
              visibility="visible"
              bg="mukuru.cards.white"
            >
              <VStack gap="0" align="stretch" width="100%">
                {/* Change Password Row */}
                <HStack
                  justify="space-between"
                  align="center"
                  width="100%"
                  py={{ base: 4, md: 5 }}
                  borderBottom="1px"
                  borderColor="mukuru.grey.light"
                  flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                  gap={{ base: 3, sm: 0 }}
                >
                  <VStack align="start" gap="1" flex="1" minW="0" pr={{ base: 0, sm: 4 }}>
                    <Typography fontWeight="600" color="mukuru.text.primary" fontSize="md">
                      Change Password
                    </Typography>
                    <Typography fontSize="sm" color="mukuru.grey.mediumDark" mt="0">
                      Update your account password
                    </Typography>
                  </VStack>
                  <Box flexShrink={0}>
                    <Button
                      variant="primary"
                      className="mukuru-primary-button"
                      size="md"
                      onClick={onPasswordDialogOpen}
                      px="6"
                    >
                      Change
                    </Button>
                  </Box>
                </HStack>

                {/* Marketing Communications Row */}
                <HStack
                  justify="space-between"
                  align="center"
                  width="100%"
                  py={{ base: 4, md: 5 }}
                  borderBottom="1px"
                  borderColor="mukuru.grey.light"
                  flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                  gap={{ base: 3, sm: 0 }}
                >
                  <VStack align="start" gap="1" flex="1" minW="0" pr={{ base: 0, sm: 4 }}>
                    <Typography fontWeight="600" color="mukuru.text.primary" fontSize="md">
                      Marketing Communications
                    </Typography>
                    <Typography fontSize="sm" color="mukuru.grey.mediumDark" mt="0">
                      Receive news and updates about Mukuru services
                    </Typography>
                  </VStack>
                  <Box flexShrink={0}>
                    <ChakraSwitch.Root
                      checked={notifications.marketingCommunications}
                      onCheckedChange={(details) =>
                        handleNotificationChange(
                          'marketingCommunications',
                          details.checked
                        )
                      }
                      size="md"
                    >
                      <ChakraSwitch.HiddenInput />
                      <ChakraSwitch.Control>
                        <ChakraSwitch.Thumb />
                      </ChakraSwitch.Control>
                    </ChakraSwitch.Root>
                  </Box>
                </HStack>

                {/* Download Data Row */}
                <HStack
                  justify="space-between"
                  align="center"
                  width="100%"
                  py={{ base: 4, md: 5 }}
                  borderBottom="1px"
                  borderColor="mukuru.grey.light"
                  flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                  gap={{ base: 3, sm: 0 }}
                >
                  <VStack align="start" gap="1" flex="1" minW="0" pr={{ base: 0, sm: 4 }}>
                    <Typography fontWeight="600" color="mukuru.text.primary" fontSize="md">
                      Download Data
                    </Typography>
                    <Typography fontSize="sm" color="mukuru.grey.mediumDark" mt="0">
                      Download a copy of your application data
                    </Typography>
                  </VStack>
                  <Box flexShrink={0}>
                    <Button
                      variant="primary"
                      className="mukuru-primary-button"
                      size="md"
                      onClick={handleDownloadData}
                      px="6"
                    >
                      Download
                    </Button>
                  </Box>
                </HStack>

                {/* Logout Row */}
                <HStack
                  justify="space-between"
                  align="center"
                  width="100%"
                  py={{ base: 4, md: 5 }}
                  borderBottom="1px"
                  borderColor="mukuru.grey.light"
                  flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                  gap={{ base: 3, sm: 0 }}
                >
                  <VStack align="start" gap="1" flex="1" minW="0" pr={{ base: 0, sm: 4 }}>
                    <Typography fontWeight="600" color="mukuru.text.primary" fontSize="md">
                      Logout
                    </Typography>
                    <Typography fontSize="sm" color="mukuru.grey.mediumDark" mt="0">
                      Sign out of your account
                    </Typography>
                  </VStack>
                  <Box flexShrink={0}>
                    <Button
                      variant="primary"
                      className="mukuru-primary-button"
                      size="md"
                      onClick={handleLogout}
                      px="6"
                    >
                      <HStack gap="2">
                        <Icon as={FiLogOut} color="white" boxSize="4" />
                        <Typography color="white" fontWeight="500">Logout</Typography>
                      </HStack>
                    </Button>
                  </Box>
                </HStack>

                {/* Delete Account Row */}
                <HStack
                  justify="space-between"
                  align="center"
                  width="100%"
                  py={{ base: 4, md: 5 }}
                  borderWidth="2px"
                  borderColor="mukuru.text.error"
                  borderRadius="md"
                  px={{ base: 4, md: 5 }}
                  bg="rgba(239, 68, 68, 0.02)"
                  flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                  gap={{ base: 3, sm: 0 }}
                  mt="4"
                >
                  <VStack align="start" gap="1" flex="1" minW="0" pr={{ base: 0, sm: 4 }}>
                    <Typography fontWeight="600" color="mukuru.text.error" fontSize="md">
                      Delete Account
                    </Typography>
                    <Typography fontSize="sm" color="mukuru.grey.mediumDark" mt="0">
                      Permanently delete your account and all data
                    </Typography>
                  </VStack>
                  <Box flexShrink={0}>
                    <Button
                      variant="primary"
                      className="mukuru-primary-button"
                      size="md"
                      onClick={onDeleteDialogOpen}
                      bg="mukuru.text.error"
                      _hover={{ bg: 'mukuru.text.error.dark' }}
                      px="6"
                    >
                      Delete
                    </Button>
                  </Box>
                </HStack>
              </VStack>
            </Box>
          </Card>

          {/* Change Password Modal */}
          <Modal
            isOpen={isPasswordDialogOpen}
            onClose={onPasswordDialogClose}
            title="Change Password"
          >
            <ModalBody>
              <VStack gap="5" align="stretch">
                <VStack align="start" gap="2">
                  <Typography fontSize="sm" fontWeight="600" color="mukuru.text.primary">
                    Current Password
                  </Typography>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Enter current password"
                  />
                </VStack>
                <VStack align="start" gap="2">
                  <Typography fontSize="sm" fontWeight="600" color="mukuru.text.primary">
                    New Password
                  </Typography>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    placeholder="Enter new password"
                  />
                </VStack>
                <VStack align="start" gap="2">
                  <Typography fontSize="sm" fontWeight="600" color="mukuru.text.primary">
                    Confirm New Password
                  </Typography>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                  />
                </VStack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <HStack gap="3" width="100%" justify="flex-end">
                <Button variant="secondary" onClick={onPasswordDialogClose} size="md">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="mukuru-primary-button"
                  onClick={handleChangePassword}
                  size="md"
                >
                  Change Password
                </Button>
              </HStack>
            </ModalFooter>
          </Modal>

          {/* Delete Account Modal */}
          <Modal
            isOpen={isDeleteDialogOpen}
            onClose={handleDeleteDialogClose}
            title="Delete Account"
          >
            <ModalBody>
              <VStack gap="5" align="stretch">
                <AlertBar
                  status="error"
                  title="Warning"
                  description="This action cannot be undone. All your data will be permanently deleted."
                />
                <VStack align="start" gap="2">
                  <Typography fontSize="sm" fontWeight="600" color="mukuru.text.primary">
                    Reason (optional)
                  </Typography>
                  <Input
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Why are you deleting your account?"
                  />
                </VStack>
                <VStack align="start" gap="2">
                  <Typography fontSize="sm" fontWeight="600" color="mukuru.text.error">
                    Type "DELETE" to confirm
                  </Typography>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type DELETE to confirm"
                  />
                </VStack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <HStack gap="3" width="100%" justify="flex-end">
                <Button variant="secondary" onClick={handleDeleteDialogClose} size="md">
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  variant="primary"
                  className="mukuru-primary-button"
                  size="md"
                  disabled={deleteConfirmation !== 'DELETE'}
                  bg="mukuru.text.error"
                  _hover={{ bg: 'mukuru.text.error.dark' }}
                  opacity={deleteConfirmation !== 'DELETE' ? 0.5 : 1}
                >
                  Delete Account
                </Button>
              </HStack>
            </ModalFooter>
          </Modal>
        </VStack>
      </Container>
    </Box>
  );
}
