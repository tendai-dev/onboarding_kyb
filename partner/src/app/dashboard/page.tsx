'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Spinner } from '@chakra-ui/react';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual partner dashboard
    router.replace('/partner/dashboard');
  }, [router]);

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="mukuru.background.dark"
    >
      <Spinner size="xl" color="mukuru.buttons.primary" />
    </Box>
  );
}
