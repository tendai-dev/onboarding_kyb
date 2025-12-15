'use client';

import {
  Box,
  VStack,
  Spinner,
  Flex,
  SimpleGrid,
  HStack,
  Input,
  Switch,
  Separator,
} from '@chakra-ui/react';
// Import components directly from Mukuru package
import { Typography, Button, Card, IconWrapper } from '@mukuru/mukuru-react-components';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiSettings,
  FiBell,
  FiShield,
  FiEye,
  FiSave,
  FiEdit2,
  FiX,
} from 'react-icons/fi';
import AdminSidebar from '../../components/AdminSidebar';
import PortalHeader from '../../components/PortalHeader';
import { useSidebar } from '../../contexts/SidebarContext';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { condensed } = useSidebar();
  const router = useRouter();

  // Color mode values for dark/light mode support
  const bgColor = useColorModeValue('mukuru.background.light', 'mukuru.background.dark');
  const cardBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const textColor = useColorModeValue('mukuru.text.primary', 'mukuru.text.inverse');
  const headerBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const borderColor = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');

  // Account Settings State
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
  });
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Notification Settings State
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    applicationUpdates: true,
    documentStatus: true,
    messages: true,
    systemAlerts: false,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Security Settings State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Appearance Settings State
  const [appearance, setAppearance] = useState({
    theme: 'light',
    language: 'en',
    compactMode: false,
  });
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);

  // Initialize account data from session
  useEffect(() => {
    if (session?.user) {
      setAccountData({
        name: session.user.name || '',
        email: session.user.email || '',
      });
    }
  }, [session]);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minH="100vh">
        <Spinner size="xl" color="orange.500" />
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  // Account Settings Handlers
  const handleSaveAccount = async () => {
    setIsSavingAccount(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsEditingAccount(false);
      console.log('Account data saved:', accountData);
    } catch (error) {
      console.error('Failed to save account data:', error);
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Notification Settings Handlers
  const handleNotificationToggle = async (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    setIsSavingNotifications(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('Notification preferences updated:', updated);
    } catch (error) {
      setNotifications(notifications);
      console.error('Failed to update notifications:', error);
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Security Settings Handlers
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Password changed');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordFields(false);
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Appearance Settings Handlers
  const handleAppearanceChange = async (
    key: keyof typeof appearance,
    value: string | boolean
  ) => {
    const updated = { ...appearance, [key]: value };
    setAppearance(updated);
    setIsSavingAppearance(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('Appearance preferences updated:', updated);
    } catch (error) {
      setAppearance(appearance);
      console.error('Failed to update appearance:', error);
    } finally {
      setIsSavingAppearance(false);
    }
  };

  return (
    <Flex minH="100vh" bg={bgColor}>
      <AdminSidebar />
      <PortalHeader />

      {/* Main Content */}
      <Box
        flex="1"
        ml={condensed ? '72px' : '280px'}
        mt="90px"
        minH="calc(100vh - 90px)"
        width={condensed ? 'calc(100% - 72px)' : 'calc(100% - 280px)'}
        p="8"
        bg="gray.50"
      >
        <VStack align="stretch" gap="8" maxW="1400px" mx="auto">
          {/* Page Header - Improved spacing */}
          <Box>
            <Typography fontSize="3xl" fontWeight="bold" color={textColor} mb="2">
              Settings
            </Typography>
            <Typography
              fontSize="md"
              color={useColorModeValue('mukuru.grey.mediumDark', 'mukuru.grey.300')}
              fontWeight="normal"
            >
              Manage your account settings and preferences
            </Typography>
          </Box>

          {/* Settings Cards - Improved grid and card styling */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6" width="full">
            {/* Account Settings Card */}
            <Card
              bg={cardBg}
              width="full"
              display="flex"
              flexDirection="column"
              boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
              border="1px solid"
              borderColor="#E5E7EB"
              borderRadius="12px"
              overflow="hidden"
            >
              {/* Card Header */}
              <Box
                p="6"
                borderBottom="1px solid"
                borderColor="gray.200"
                bg={cardBg}
                width="full"
              >
                <VStack align="start" gap="2" width="full">
                  <HStack gap="3" width="full">
                    <IconWrapper>
                      <FiSettings size={22} color="#F05423" />
                    </IconWrapper>
                    <Typography fontSize="xl" fontWeight="bold" color={textColor}>
                      Account Settings
                    </Typography>
                  </HStack>
                  <Typography
                    fontSize="sm"
                    color={useColorModeValue('mukuru.grey.mediumDark', 'mukuru.grey.300')}
                    pl="35px"
                    fontWeight="normal"
                  >
                    Manage your account information and preferences
                  </Typography>
                </VStack>
              </Box>

              {/* Card Body */}
              <Box p="6" width="full" flex="1" bg="white">
                <VStack align="stretch" gap="5" width="full">
                  {/* Full Name Field */}
                  <Box width="full">
                    <Typography
                      fontSize="sm"
                      fontWeight="semibold"
                      color="gray.700"
                      mb="2"
                    >
                      Full Name
                    </Typography>
                    {isEditingAccount ? (
                      <Input
                        value={accountData.name}
                        onChange={(e) =>
                          setAccountData({ ...accountData, name: e.target.value })
                        }
                        placeholder="Enter your name"
                        size="md"
                        borderColor="gray.300"
                        _focus={{
                          borderColor: '#F05423',
                          boxShadow: '0 0 0 1px #F05423',
                        }}
                      />
                    ) : (
                      <Box
                        p="3"
                        borderRadius="md"
                        bg="gray.50"
                        border="1px solid"
                        borderColor="gray.200"
                        minH="40px"
                        display="flex"
                        alignItems="center"
                      >
                        <Typography fontSize="sm" color="gray.700">
                          {accountData.name || 'Not set'}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Email Field */}
                  <Box width="full">
                    <Typography
                      fontSize="sm"
                      fontWeight="semibold"
                      color="gray.700"
                      mb="2"
                    >
                      Email Address
                    </Typography>
                    {isEditingAccount ? (
                      <Input
                        type="email"
                        value={accountData.email}
                        onChange={(e) =>
                          setAccountData({ ...accountData, email: e.target.value })
                        }
                        placeholder="Enter your email"
                        size="md"
                        borderColor="gray.300"
                        _focus={{
                          borderColor: '#F05423',
                          boxShadow: '0 0 0 1px #F05423',
                        }}
                      />
                    ) : (
                      <Box
                        p="3"
                        borderRadius="md"
                        bg="gray.50"
                        border="1px solid"
                        borderColor="gray.200"
                        minH="40px"
                        display="flex"
                        alignItems="center"
                      >
                        <Typography fontSize="sm" color="gray.700">
                          {accountData.email || 'Not set'}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Action Buttons */}
                  <HStack gap="3" width="full" pt="2">
                    {isEditingAccount ? (
                      <>
                        <Button
                          variant="primary"
                          onClick={handleSaveAccount}
                          disabled={isSavingAccount}
                          size="md"
                          style={{ backgroundColor: '#F05423', color: 'white' }}
                          flex="1"
                        >
                          <IconWrapper>
                            <FiSave size={16} color="white" />
                          </IconWrapper>
                          {isSavingAccount ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setIsEditingAccount(false);
                            setAccountData({
                              name: session?.user?.name || '',
                              email: session?.user?.email || '',
                            });
                          }}
                          size="md"
                          border="1px solid"
                          borderColor="gray.300"
                        >
                          <IconWrapper>
                            <FiX size={16} />
                          </IconWrapper>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => setIsEditingAccount(true)}
                        size="md"
                        style={{ color: '#F05423', border: '1px solid #F05423' }}
                        width="full"
                      >
                        <IconWrapper>
                          <FiEdit2 size={16} color="#F05423" />
                        </IconWrapper>
                        Edit Account Information
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </Box>
            </Card>

            {/* Notification Settings Card */}
            <Card
              bg={cardBg}
              width="full"
              display="flex"
              flexDirection="column"
              boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
              border="1px solid"
              borderColor="#E5E7EB"
              borderRadius="12px"
              overflow="hidden"
            >
              {/* Card Header */}
              <Box
                p="6"
                borderBottom="1px solid"
                borderColor="gray.200"
                bg={cardBg}
                width="full"
              >
                <VStack align="start" gap="2" width="full">
                  <HStack gap="3" width="full">
                    <IconWrapper>
                      <FiBell size={22} color="#F05423" />
                    </IconWrapper>
                    <Typography fontSize="xl" fontWeight="bold" color="gray.800">
                      Notifications
                    </Typography>
                  </HStack>
                  <Typography
                    fontSize="sm"
                    color="gray.600"
                    pl="35px"
                    fontWeight="normal"
                  >
                    Configure your notification preferences
                  </Typography>
                </VStack>
              </Box>

              {/* Card Body */}
              <Box p="6" width="full" flex="1" bg="white">
                <VStack align="stretch" gap="4" width="full">
                  {/* Email Notifications */}
                  <HStack justify="space-between" width="full" py="2">
                    <VStack align="start" gap="1" flex="1">
                      <Typography fontSize="sm" fontWeight="semibold" color="gray.700">
                        Email Notifications
                      </Typography>
                      <Typography fontSize="xs" color="gray.500" fontWeight="normal">
                        Receive notifications via email
                      </Typography>
                    </VStack>
                    <Switch.Root
                      checked={notifications.emailNotifications}
                      onCheckedChange={() =>
                        handleNotificationToggle('emailNotifications')
                      }
                      disabled={isSavingNotifications}
                      size="md"
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>

                  <Separator borderColor="gray.200" />

                  {/* Push Notifications */}
                  <HStack justify="space-between" width="full" py="2">
                    <VStack align="start" gap="1" flex="1">
                      <Typography fontSize="sm" fontWeight="semibold" color="gray.700">
                        Push Notifications
                      </Typography>
                      <Typography fontSize="xs" color="gray.500" fontWeight="normal">
                        Receive browser push notifications
                      </Typography>
                    </VStack>
                    <Switch.Root
                      checked={notifications.pushNotifications}
                      onCheckedChange={() =>
                        handleNotificationToggle('pushNotifications')
                      }
                      disabled={isSavingNotifications}
                      size="md"
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>

                  <Separator borderColor="gray.200" />

                  {/* Application Updates */}
                  <HStack justify="space-between" width="full" py="2">
                    <VStack align="start" gap="1" flex="1">
                      <Typography fontSize="sm" fontWeight="semibold" color="gray.700">
                        Application Updates
                      </Typography>
                      <Typography fontSize="xs" color="gray.500" fontWeight="normal">
                        Notify when applications are updated
                      </Typography>
                    </VStack>
                    <Switch.Root
                      checked={notifications.applicationUpdates}
                      onCheckedChange={() =>
                        handleNotificationToggle('applicationUpdates')
                      }
                      disabled={isSavingNotifications}
                      size="md"
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>

                  <Separator borderColor="gray.200" />

                  {/* Document Status */}
                  <HStack justify="space-between" width="full" py="2">
                    <VStack align="start" gap="1" flex="1">
                      <Typography fontSize="sm" fontWeight="semibold" color="gray.700">
                        Document Status
                      </Typography>
                      <Typography fontSize="xs" color="gray.500" fontWeight="normal">
                        Notify when document status changes
                      </Typography>
                    </VStack>
                    <Switch.Root
                      checked={notifications.documentStatus}
                      onCheckedChange={() => handleNotificationToggle('documentStatus')}
                      disabled={isSavingNotifications}
                      size="md"
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>

                  <Separator borderColor="gray.200" />

                  {/* Messages */}
                  <HStack justify="space-between" width="full" py="2">
                    <VStack align="start" gap="1" flex="1">
                      <Typography fontSize="sm" fontWeight="semibold" color="gray.700">
                        Messages
                      </Typography>
                      <Typography fontSize="xs" color="gray.500" fontWeight="normal">
                        Notify when you receive messages
                      </Typography>
                    </VStack>
                    <Switch.Root
                      checked={notifications.messages}
                      onCheckedChange={() => handleNotificationToggle('messages')}
                      disabled={isSavingNotifications}
                      size="md"
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>

                  <Separator borderColor="gray.200" />

                  {/* System Alerts */}
                  <HStack justify="space-between" width="full" py="2">
                    <VStack align="start" gap="1" flex="1">
                      <Typography fontSize="sm" fontWeight="semibold" color="gray.700">
                        System Alerts
                      </Typography>
                      <Typography fontSize="xs" color="gray.500" fontWeight="normal">
                        Receive critical system alerts
                      </Typography>
                    </VStack>
                    <Switch.Root
                      checked={notifications.systemAlerts}
                      onCheckedChange={() => handleNotificationToggle('systemAlerts')}
                      disabled={isSavingNotifications}
                      size="md"
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>
                </VStack>
              </Box>
            </Card>

            {/* Security Settings Card */}
            <Card
              bg={cardBg}
              width="full"
              display="flex"
              flexDirection="column"
              boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
              border="1px solid"
              borderColor="#E5E7EB"
              borderRadius="12px"
              overflow="hidden"
            >
              {/* Card Header */}
              <Box
                p="6"
                borderBottom="1px solid"
                borderColor="gray.200"
                bg={cardBg}
                width="full"
              >
                <VStack align="start" gap="2" width="full">
                  <HStack gap="3" width="full">
                    <IconWrapper>
                      <FiShield size={22} color="#F05423" />
                    </IconWrapper>
                    <Typography fontSize="xl" fontWeight="bold" color="gray.800">
                      Security
                    </Typography>
                  </HStack>
                  <Typography
                    fontSize="sm"
                    color="gray.600"
                    pl="35px"
                    fontWeight="normal"
                  >
                    Manage your security settings and password
                  </Typography>
                </VStack>
              </Box>

              {/* Card Body */}
              <Box p="6" width="full" flex="1" bg="white">
                <VStack align="stretch" gap="5" width="full">
                  {!showPasswordFields ? (
                    <>
                      <Typography fontSize="sm" color="gray.600" mb="2">
                        Change your password to keep your account secure.
                      </Typography>
                      <Button
                        variant="primary"
                        onClick={() => setShowPasswordFields(true)}
                        size="md"
                        style={{ backgroundColor: '#F05423', color: 'white' }}
                        width="full"
                      >
                        Change Password
                      </Button>
                    </>
                  ) : (
                    <>
                      <Box width="full">
                        <Typography
                          fontSize="sm"
                          fontWeight="semibold"
                          color="gray.700"
                          mb="2"
                        >
                          Current Password
                        </Typography>
                        <Input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          placeholder="Enter current password"
                          size="md"
                          borderColor="gray.300"
                          _focus={{
                            borderColor: '#F05423',
                            boxShadow: '0 0 0 1px #F05423',
                          }}
                        />
                      </Box>

                      <Box width="full">
                        <Typography
                          fontSize="sm"
                          fontWeight="semibold"
                          color="gray.700"
                          mb="2"
                        >
                          New Password
                        </Typography>
                        <Input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          placeholder="Enter new password (min 8 characters)"
                          size="md"
                          borderColor="gray.300"
                          _focus={{
                            borderColor: '#F05423',
                            boxShadow: '0 0 0 1px #F05423',
                          }}
                        />
                      </Box>

                      <Box width="full">
                        <Typography
                          fontSize="sm"
                          fontWeight="semibold"
                          color="gray.700"
                          mb="2"
                        >
                          Confirm New Password
                        </Typography>
                        <Input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          placeholder="Confirm new password"
                          size="md"
                          borderColor="gray.300"
                          _focus={{
                            borderColor: '#F05423',
                            boxShadow: '0 0 0 1px #F05423',
                          }}
                        />
                      </Box>

                      <HStack gap="3" width="full" pt="2">
                        <Button
                          variant="primary"
                          onClick={handleChangePassword}
                          disabled={isChangingPassword}
                          size="md"
                          style={{ backgroundColor: '#F05423', color: 'white' }}
                          flex="1"
                        >
                          {isChangingPassword ? 'Changing...' : 'Change Password'}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowPasswordFields(false);
                            setPasswordData({
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: '',
                            });
                          }}
                          size="md"
                          border="1px solid"
                          borderColor="gray.300"
                        >
                          <IconWrapper>
                            <FiX size={16} />
                          </IconWrapper>
                          Cancel
                        </Button>
                      </HStack>
                    </>
                  )}
                </VStack>
              </Box>
            </Card>

            {/* Appearance Settings Card */}
            <Card
              bg={cardBg}
              width="full"
              display="flex"
              flexDirection="column"
              boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
              border="1px solid"
              borderColor="#E5E7EB"
              borderRadius="12px"
              overflow="hidden"
            >
              {/* Card Header */}
              <Box
                p="6"
                borderBottom="1px solid"
                borderColor="gray.200"
                bg={cardBg}
                width="full"
              >
                <VStack align="start" gap="2" width="full">
                  <HStack gap="3" width="full">
                    <IconWrapper>
                      <FiEye size={22} color="#F05423" />
                    </IconWrapper>
                    <Typography fontSize="xl" fontWeight="bold" color="gray.800">
                      Appearance
                    </Typography>
                  </HStack>
                  <Typography
                    fontSize="sm"
                    color="gray.600"
                    pl="35px"
                    fontWeight="normal"
                  >
                    Customize the look and feel of your dashboard
                  </Typography>
                </VStack>
              </Box>

              {/* Card Body */}
              <Box p="6" width="full" flex="1" bg="white">
                <VStack align="stretch" gap="5" width="full">
                  {/* Theme Selection */}
                  <Box width="full">
                    <Typography
                      fontSize="sm"
                      fontWeight="semibold"
                      color="gray.700"
                      mb="3"
                    >
                      Theme
                    </Typography>
                    <HStack gap="2" width="full">
                      <Button
                        variant={appearance.theme === 'light' ? 'primary' : 'ghost'}
                        onClick={() => handleAppearanceChange('theme', 'light')}
                        size="md"
                        flex="1"
                        style={
                          appearance.theme === 'light'
                            ? { backgroundColor: '#F05423', color: 'white' }
                            : { border: '1px solid #E5E7EB' }
                        }
                      >
                        Light
                      </Button>
                      <Button
                        variant={appearance.theme === 'dark' ? 'primary' : 'ghost'}
                        onClick={() => handleAppearanceChange('theme', 'dark')}
                        size="md"
                        flex="1"
                        style={
                          appearance.theme === 'dark'
                            ? { backgroundColor: '#F05423', color: 'white' }
                            : { border: '1px solid #E5E7EB' }
                        }
                      >
                        Dark
                      </Button>
                      <Button
                        variant={appearance.theme === 'auto' ? 'primary' : 'ghost'}
                        onClick={() => handleAppearanceChange('theme', 'auto')}
                        size="md"
                        flex="1"
                        style={
                          appearance.theme === 'auto'
                            ? { backgroundColor: '#F05423', color: 'white' }
                            : { border: '1px solid #E5E7EB' }
                        }
                      >
                        Auto
                      </Button>
                    </HStack>
                  </Box>

                  <Separator borderColor="gray.200" />

                  {/* Language Selection */}
                  <Box width="full">
                    <Typography
                      fontSize="sm"
                      fontWeight="semibold"
                      color="gray.700"
                      mb="3"
                    >
                      Language
                    </Typography>
                    <HStack gap="2" width="full">
                      <Button
                        variant={appearance.language === 'en' ? 'primary' : 'ghost'}
                        onClick={() => handleAppearanceChange('language', 'en')}
                        size="md"
                        flex="1"
                        style={
                          appearance.language === 'en'
                            ? { backgroundColor: '#F05423', color: 'white' }
                            : { border: '1px solid #E5E7EB' }
                        }
                      >
                        English
                      </Button>
                      <Button
                        variant={appearance.language === 'es' ? 'primary' : 'ghost'}
                        onClick={() => handleAppearanceChange('language', 'es')}
                        size="md"
                        flex="1"
                        style={
                          appearance.language === 'es'
                            ? { backgroundColor: '#F05423', color: 'white' }
                            : { border: '1px solid #E5E7EB' }
                        }
                      >
                        Español
                      </Button>
                    </HStack>
                  </Box>

                  <Separator borderColor="gray.200" />

                  {/* Compact Mode */}
                  <HStack justify="space-between" width="full" py="2">
                    <VStack align="start" gap="1" flex="1">
                      <Typography fontSize="sm" fontWeight="semibold" color="gray.700">
                        Compact Mode
                      </Typography>
                      <Typography fontSize="xs" color="gray.500" fontWeight="normal">
                        Use a more compact layout
                      </Typography>
                    </VStack>
                    <Switch.Root
                      checked={appearance.compactMode}
                      onCheckedChange={(details) =>
                        handleAppearanceChange('compactMode', details.checked === true)
                      }
                      disabled={isSavingAppearance}
                      size="md"
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>
                </VStack>
              </Box>
            </Card>
          </SimpleGrid>
        </VStack>
      </Box>
    </Flex>
  );
}
