'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Spinner,
  SimpleGrid,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

interface WorkItem {
  id: string;
  workItemId: string;
  workItemNumber: string;
  applicationId: string;
  caseId: string;
  applicantName: string;
  businessName?: string;
  entityType: string;
  entityTypeDisplayName?: string;
  status: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  priority: string;
}

export default function InReviewPage() {
  const router = useRouter();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadInReviewItems();
  }, [refreshKey]);

  const loadInReviewItems = async () => {
    try {
      setLoading(true);
      // Fetch both Assigned and InProgress items
      // Assigned items that are assigned to someone are ready for review
      const [assignedResponse, inProgressResponse] = await Promise.all([
        fetch('/api/workqueue?status=Assigned'),
        fetch('/api/workqueue?status=InProgress'),
      ]);

      const assignedData = assignedResponse.ok
        ? await assignedResponse.json()
        : { items: [] };
      const inProgressData = inProgressResponse.ok
        ? await inProgressResponse.json()
        : { items: [] };

      // Combine both lists and remove duplicates
      const allItems = [...(assignedData.items || []), ...(inProgressData.items || [])];
      const uniqueItems = allItems.filter(
        (item, index, self) =>
          index ===
          self.findIndex((t) => t.workItemId === item.workItemId || t.id === item.id)
      );

      setWorkItems(uniqueItems);
    } catch (error) {
      console.error('Failed to load in-review items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (item: WorkItem) => {
    // Navigate to review page at step 2 (Documents & Requirements)
    router.push(`/review/${item.workItemId}?step=2`);
  };

  return (
    <Box minH="100vh" bg="mukuru.background.light" p={6}>
      <Container maxW="7xl">
        <VStack align="stretch" gap={6}>
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2} color="mukuru.text.primary">
              In Review
            </Heading>
            <Text color="mukuru.text.secondary" fontSize="md">
              Applications currently being reviewed for completeness and accuracy
            </Text>
          </Box>

          {/* Stats */}
          <HStack gap={4}>
            <Box bg="white" p={4} borderRadius="md" boxShadow="sm" flex={1}>
              <Text fontSize="sm" color="mukuru.text.secondary">
                Total In Review
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="mukuru.buttons.primary">
                {workItems.length}
              </Text>
            </Box>
            <Box bg="white" p={4} borderRadius="md" boxShadow="sm" flex={1}>
              <Text fontSize="sm" color="mukuru.text.secondary">
                Assigned to Me
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="mukuru.buttons.primary">
                {workItems.filter((item) => item.assignedTo === 'Current User').length}
              </Text>
            </Box>
          </HStack>

          {/* Items Grid */}
          <Box bg="white" borderRadius="md" boxShadow="sm" p={6}>
            {loading ? (
              <Box textAlign="center" py={10}>
                <Spinner size="xl" color="mukuru.buttons.primary" />
              </Box>
            ) : workItems.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color="mukuru.text.secondary">No applications in review</Text>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                {workItems.map((item) => (
                  <Box
                    key={item.id}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor="gray.200"
                    _hover={{ boxShadow: 'md', borderColor: 'mukuru.buttons.primary' }}
                  >
                    <VStack align="stretch" gap={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="bold">
                          {item.workItemNumber || item.applicationId}
                        </Text>
                        <Badge colorScheme="blue" fontSize="xs">
                          {item.priority || 'NORMAL'}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color="mukuru.text.secondary">
                        {item.applicantName || 'N/A'}
                      </Text>
                      <Text fontSize="xs" color="mukuru.text.secondary">
                        {item.entityTypeDisplayName || item.entityType || 'N/A'}
                      </Text>
                      <Text fontSize="xs" color="mukuru.text.secondary">
                        Assigned: {item.assignedToName || 'Unassigned'}
                      </Text>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        width="full"
                        onClick={() => handleReview(item)}
                      >
                        Review
                      </Button>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
