'use client';

import { useState, useEffect } from 'react';
import { Box, VStack, HStack, Switch } from '@chakra-ui/react';
import { Button, Typography, Card } from '@/lib/mukuruImports';
import {
  getEmailPreferences,
  saveEmailPreferences,
  resetEmailPreferences,
  type EmailPreferences,
} from '@/lib/emailPreferences';
import { getEmailStatistics } from '@/lib/emailAnalytics';

export function EmailPreferencesComponent() {
  const [preferences, setPreferences] = useState<EmailPreferences>(getEmailPreferences());
  const [statistics, setStatistics] = useState(getEmailStatistics());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Update statistics periodically
    const interval = setInterval(() => {
      setStatistics(getEmailStatistics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleToggle = (key: keyof EmailPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    setSaved(false);
  };

  const handleSave = () => {
    saveEmailPreferences(preferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    resetEmailPreferences();
    setPreferences(getEmailPreferences());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card p="6" borderRadius="xl" boxShadow="md" bg="white" width="100%">
      <VStack gap="6" align="stretch">
        <Typography fontSize="xl" fontWeight="bold" color="gray.800">
          Email Notification Preferences
        </Typography>

        <VStack gap="4" align="stretch">
          <HStack justify="space-between" align="center">
            <VStack align="start" gap="1">
              <Typography fontSize="md" fontWeight="medium" color="gray.700">
                Welcome Emails
              </Typography>
              <Typography fontSize="sm" color="gray.500">
                Receive welcome email when application is submitted
              </Typography>
            </VStack>
            <Switch.Root
              checked={preferences.welcome}
              onCheckedChange={() => handleToggle('welcome')}
              size="md"
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>

          <HStack justify="space-between" align="center">
            <VStack align="start" gap="1">
              <Typography fontSize="md" fontWeight="medium" color="gray.700">
                Status Updates
              </Typography>
              <Typography fontSize="sm" color="gray.500">
                Receive emails when application status changes
              </Typography>
            </VStack>
            <Switch.Root
              checked={preferences.statusUpdates}
              onCheckedChange={() => handleToggle('statusUpdates')}
              size="md"
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>

          <HStack justify="space-between" align="center">
            <VStack align="start" gap="1">
              <Typography fontSize="md" fontWeight="medium" color="gray.700">
                Acknowledgement Requests
              </Typography>
              <Typography fontSize="sm" color="gray.500">
                Receive email when acknowledgement is required
              </Typography>
            </VStack>
            <Switch.Root
              checked={preferences.acknowledgements}
              onCheckedChange={() => handleToggle('acknowledgements')}
              size="md"
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>

          <HStack justify="space-between" align="center">
            <VStack align="start" gap="1">
              <Typography fontSize="md" fontWeight="medium" color="gray.700">
                Message Notifications
              </Typography>
              <Typography fontSize="sm" color="gray.500">
                Receive email when you get a new message
              </Typography>
            </VStack>
            <Switch.Root
              checked={preferences.messages}
              onCheckedChange={() => handleToggle('messages')}
              size="md"
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>

          <HStack justify="space-between" align="center">
            <VStack align="start" gap="1">
              <Typography fontSize="md" fontWeight="medium" color="gray.700">
                Marketing Emails
              </Typography>
              <Typography fontSize="sm" color="gray.500">
                Receive promotional and marketing emails
              </Typography>
            </VStack>
            <Switch.Root
              checked={preferences.marketing}
              onCheckedChange={() => handleToggle('marketing')}
              size="md"
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>
        </VStack>

        <HStack gap="3" justify="flex-end">
          <Button
            variant="secondary"
            onClick={handleReset}
            size="sm"
          >
            Reset to Defaults
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            size="sm"
            bg={saved ? 'green.500' : 'mukuru.buttons.primary'}
            _hover={{ bg: saved ? 'green.600' : 'mukuru.buttons.inactive.orange' }}
          >
            {saved ? 'Saved!' : 'Save Preferences'}
          </Button>
        </HStack>

        {/* Email Statistics */}
        {statistics.total > 0 && (
          <Box
            mt="4"
            pt="4"
            borderTop="1px solid"
            borderColor="gray.200"
          >
            <Typography fontSize="sm" fontWeight="medium" color="gray.600" mb="3">
              Email Statistics
            </Typography>
            <VStack gap="2" align="stretch" fontSize="sm">
              <HStack justify="space-between">
                <Typography color="gray.600">Total Emails:</Typography>
                <Typography fontWeight="medium">{statistics.total}</Typography>
              </HStack>
              <HStack justify="space-between">
                <Typography color="gray.600">Delivery Rate:</Typography>
                <Typography fontWeight="medium">{statistics.deliveryRate.toFixed(1)}%</Typography>
              </HStack>
              <HStack justify="space-between">
                <Typography color="gray.600">Open Rate:</Typography>
                <Typography fontWeight="medium">{statistics.openRate.toFixed(1)}%</Typography>
              </HStack>
              <HStack justify="space-between">
                <Typography color="gray.600">Click Rate:</Typography>
                <Typography fontWeight="medium">{statistics.clickRate.toFixed(1)}%</Typography>
              </HStack>
            </VStack>
          </Box>
        )}
      </VStack>
    </Card>
  );
}

