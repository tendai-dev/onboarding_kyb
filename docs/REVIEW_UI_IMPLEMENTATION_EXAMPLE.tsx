/**
 * Example Implementation: Wizard-Based Review Page
 * 
 * This demonstrates how to refactor the review page to handle 30+ requirements
 * using the wizard configuration structure.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabList, Tab, TabPanel } from '@chakra-ui/react';
import { fetchEntitySchema, type EntitySchema } from '../../../lib/entitySchemaRenderer';
import type { WizardStep } from '../../../services/entityConfigApi';

interface StepCompletion {
  status: 'complete' | 'partial' | 'incomplete';
  completedCount: number;
  totalCount: number;
  missingRequirements: string[];
}

interface ReviewStepProps {
  step: WizardStep;
  requirements: RenderableField[];
  applicationData: Record<string, unknown>;
  documents: Document[];
  onRequirementClick: (requirement: RenderableField) => void;
}

/**
 * Calculate completion status for a wizard step
 */
function calculateStepCompletion(
  step: WizardStep,
  sections: RenderableSection[],
  applicationData: Record<string, unknown>,
  documents: Document[]
): StepCompletion {
  // Find section matching this step
  const section = sections.find(s => s.id === step.id);
  if (!section) {
    return {
      status: 'incomplete',
      completedCount: 0,
      totalCount: 0,
      missingRequirements: []
    };
  }

  const requiredFields = section.fields.filter(f => f.isRequired);
  const totalCount = requiredFields.length;
  
  let completedCount = 0;
  const missingRequirements: string[] = [];

  requiredFields.forEach(field => {
    const isDocument = field.type === 'file' || field.type === 'File';
    let isSatisfied = false;

    if (isDocument) {
      // Check if document exists
      isSatisfied = documents.some(doc => 
        doc.requirementName === field.label ||
        doc.requirementName === field.code
      );
    } else {
      // Check if information field has value
      const appData = applicationData as Record<string, unknown>;
      if (appData?.metadataJson) {
        try {
          const metadata = typeof appData.metadataJson === 'string'
            ? JSON.parse(appData.metadataJson)
            : appData.metadataJson;
          
          const value = metadata[field.code] || appData[field.code];
          isSatisfied = value !== undefined && value !== null && value !== '';
        } catch {
          // Ignore parse errors
        }
      }
    }

    if (isSatisfied) {
      completedCount++;
    } else {
      missingRequirements.push(field.label);
    }
  });

  let status: 'complete' | 'partial' | 'incomplete';
  if (completedCount === totalCount) {
    status = 'complete';
  } else if (completedCount > 0) {
    status = 'partial';
  } else {
    status = 'incomplete';
  }

  return {
    status,
    completedCount,
    totalCount,
    missingRequirements
  };
}

/**
 * Get requirements for a specific wizard step
 */
function getRequirementsForStep(
  step: WizardStep,
  sections: RenderableSection[]
): RenderableField[] {
  const section = sections.find(s => s.id === step.id);
  return section?.fields || [];
}

/**
 * Individual Review Step Component
 * Handles rendering requirements for a single wizard step
 */
const ReviewStep: React.FC<ReviewStepProps> = ({
  step,
  requirements,
  applicationData,
  documents
}) => {
  // Group requirements by type for better organization
  const groupedRequirements = useMemo(() => {
    const groups: Record<string, RenderableField[]> = {
      documents: [],
      information: [],
      other: []
    };

    requirements.forEach(req => {
      if (req.type === 'file' || req.type === 'File') {
        groups.documents.push(req);
      } else if (req.type === 'text' || req.type === 'Text') {
        groups.information.push(req);
      } else {
        groups.other.push(req);
      }
    });

    return groups;
  }, [requirements]);

  return (
    <Box>
      {/* Step Header */}
      <Box mb="24px">
        <Typography fontSize="20px" fontWeight="600" mb="8px">
          {step.title}
        </Typography>
        {step.subtitle && (
          <Typography fontSize="14px" color="mukuru.grey.medium">
            {step.subtitle}
          </Typography>
        )}
      </Box>

      {/* Information Fields Section */}
      {groupedRequirements.information.length > 0 && (
        <Box mb="24px">
          <Typography fontSize="16px" fontWeight="600" mb="16px">
            Information Fields
          </Typography>
          <VStack align="stretch" gap="12px">
            {groupedRequirements.information.map(field => (
              <InformationFieldCard
                key={field.code}
                field={field}
                applicationData={applicationData}
              />
            ))}
          </VStack>
        </Box>
      )}

      {/* Documents Section */}
      {groupedRequirements.documents.length > 0 && (
        <Box mb="24px">
          <Typography fontSize="16px" fontWeight="600" mb="16px">
            Documents
          </Typography>
          <VStack align="stretch" gap="12px">
            {groupedRequirements.documents.map(field => (
              <DocumentFieldCard
                key={field.code}
                field={field}
                documents={documents}
                onViewDocument={onRequirementClick}
              />
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

/**
 * Main Review Page with Wizard Step Navigation
 */
export default function WizardBasedReviewPage() {
  const [entitySchema, setEntitySchema] = useState<EntitySchema | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [stepCompletion, setStepCompletion] = useState<Record<string, StepCompletion>>({});
  const [applicationData, setApplicationData] = useState<Record<string, unknown>>({});
  const [documents, setDocuments] = useState<Document[]>([]);

  // Load entity schema with wizard configuration
  useEffect(() => {
    if (!workItem?.applicationId) return;

    const loadSchema = async () => {
      try {
        // Load application data
        const appResponse = await fetch(`/api/applications/${workItem.applicationId}`);
        const appData = await appResponse.json();
        setApplicationData(appData);

        // Extract entity type code
        const metadata = appData.metadataJson 
          ? JSON.parse(appData.metadataJson) 
          : {};
        const entityTypeCode = metadata.entity_type_code || metadata.entityTypeCode;

        if (entityTypeCode) {
          // Fetch schema with wizard configuration
          const schema = await fetchEntitySchema(entityTypeCode, appData, true);
          if (schema?.wizardConfiguration?.steps?.length) {
            setEntitySchema(schema);
            // Set first step as active
            setActiveStepId(schema.wizardConfiguration.steps[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading schema:', error);
      }
    };

    loadSchema();
  }, [workItem]);

  // Calculate completion status for each step
  useEffect(() => {
    if (entitySchema?.wizardConfiguration && entitySchema.sections) {
      const completion: Record<string, StepCompletion> = {};
      
      entitySchema.wizardConfiguration.steps.forEach(step => {
        completion[step.id] = calculateStepCompletion(
          step,
          entitySchema.sections,
          applicationData,
          documents
        );
      });

      setStepCompletion(completion);
    }
  }, [entitySchema, applicationData, documents]);

  const wizardSteps = entitySchema?.wizardConfiguration?.steps || [];
  const activeStep = wizardSteps.find(s => s.id === activeStepId);

  // Jump to first incomplete step
  const jumpToIncomplete = useCallback(() => {
    const incompleteStep = wizardSteps.find(step => {
      const completion = stepCompletion[step.id];
      return completion?.status !== 'complete';
    });
    if (incompleteStep) {
      setActiveStepId(incompleteStep.id);
    }
  }, [wizardSteps, stepCompletion]);

  if (!entitySchema || wizardSteps.length === 0) {
    return <Spinner />;
  }

  return (
    <Box>
      {/* Step Navigation Tabs */}
      <Box mb="24px" borderBottom="1px solid" borderColor="mukuru.grey.light">
        <Tabs value={activeStepId || undefined} onChange={setActiveStepId}>
          <TabList overflowX="auto" overflowY="hidden">
            {wizardSteps.map((step, index) => {
              const completion = stepCompletion[step.id];
              const isComplete = completion?.status === 'complete';
              const isPartial = completion?.status === 'partial';

              return (
                <Tab
                  key={step.id}
                  value={step.id}
                  position="relative"
                  _selected={{
                    borderBottomColor: 'mukuru.buttons.primary',
                    borderBottomWidth: '2px',
                    color: 'mukuru.buttons.primary'
                  }}
                >
                  <HStack gap="8px">
                    {/* Step Number with Status Indicator */}
                    <Box
                      w="24px"
                      h="24px"
                      borderRadius="full"
                      bg={
                        isComplete
                          ? 'mukuru.success'
                          : isPartial
                          ? 'mukuru.warning'
                          : 'mukuru.grey.light'
                      }
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontSize="12px"
                      fontWeight="600"
                    >
                      {isComplete ? <FiCheck size={14} /> : index + 1}
                    </Box>

                    <VStack align="flex-start" gap="2px">
                      <Typography fontSize="14px" fontWeight="500">
                        {step.title}
                      </Typography>
                      {completion && (
                        <Typography fontSize="11px" color="mukuru.grey.medium">
                          {completion.completedCount}/{completion.totalCount} complete
                        </Typography>
                      )}
                    </VStack>
                  </HStack>
                </Tab>
              );
            })}
          </TabList>

          {/* Step Content Panels */}
          {wizardSteps.map(step => {
            const requirements = getRequirementsForStep(step, entitySchema.sections);
            
            return (
              <TabPanel key={step.id} value={step.id} p="24px 0">
                <ReviewStep
                  step={step}
                  requirements={requirements}
                  applicationData={applicationData}
                  documents={documents}
                  onRequirementClick={(req) => {
                    // Handle requirement click (e.g., view document)
                    console.log('Requirement clicked:', req);
                  }}
                />
              </TabPanel>
            );
          })}
        </Tabs>
      </Box>

      {/* Quick Actions */}
      <Box mb="24px">
        <HStack gap="12px">
          <Button
            variant="secondary"
            onClick={jumpToIncomplete}
            leftIcon={<FiAlertTriangle />}
          >
            Jump to Missing
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              // Expand all sections
            }}
          >
            Expand All
          </Button>
        </HStack>
      </Box>

      {/* Overall Progress Summary */}
      <Box
        bg="white"
        borderRadius="12px"
        border="1px solid"
        borderColor="mukuru.grey.light"
        p="16px"
      >
        <HStack justify="space-between">
          <Typography fontSize="14px" fontWeight="600">
            Overall Progress
          </Typography>
          <Progress
            value={
              (Object.values(stepCompletion).reduce(
                (sum, c) => sum + c.completedCount,
                0
              ) /
                Object.values(stepCompletion).reduce(
                  (sum, c) => sum + c.totalCount,
                  0
                )) *
              100
            }
            colorScheme="orange"
            size="sm"
            width="200px"
          />
        </HStack>
      </Box>
    </Box>
  );
}

/**
 * Performance Optimization: Lazy Load Step Content
 */
function useLazyStepContent(stepId: string | null, requirements: RenderableField[]) {
  const [loadedSteps, setLoadedSteps] = useState<Set<string>>(new Set());
  const [stepData, setStepData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (stepId && !loadedSteps.has(stepId)) {
      // Simulate loading step data
      const loadStepData = async () => {
        // In real implementation, this might fetch additional data
        // or process requirements for this step
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setStepData(prev => ({
          ...prev,
          [stepId]: {
            requirements,
            loadedAt: new Date()
          }
        }));
        
        setLoadedSteps(prev => new Set([...prev, stepId]));
      };

      loadStepData();
    }
  }, [stepId, requirements, loadedSteps]);

  return {
    isLoaded: stepId ? loadedSteps.has(stepId) : false,
    stepData: stepId ? stepData[stepId] : null
  };
}

/**
 * Virtualized Requirement List for Performance
 * Use this when a step has 20+ requirements
 */
import { FixedSizeList } from 'react-window';

function VirtualizedRequirementList({ requirements }: { requirements: RenderableField[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const requirement = requirements[index];
    return (
      <div style={style}>
        <RequirementCard requirement={requirement} />
      </div>
    );
  };

  if (requirements.length < 20) {
    // Don't virtualize for small lists
    return (
      <VStack>
        {requirements.map(req => (
          <RequirementCard key={req.code} requirement={req} />
        ))}
      </VStack>
    );
  }

  return (
    <FixedSizeList
      height={600}
      itemCount={requirements.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

