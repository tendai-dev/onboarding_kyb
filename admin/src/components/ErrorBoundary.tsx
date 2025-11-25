"use client";

import React from "react";
import { Box, VStack } from "@chakra-ui/react";
import { Typography, Button } from "@/lib/mukuruImports";
import * as Sentry from "@sentry/nextjs";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="gray.50"
          p="8"
        >
          <VStack gap="4" maxW="600px" textAlign="center">
            <Typography fontSize="2xl" fontWeight="bold" color="red.600">
              Something went wrong
            </Typography>
            <Typography color="gray.600">
              An unexpected error occurred. Our team has been notified and is working on a fix.
            </Typography>
            {process.env.NODE_ENV === "development" && (
              <Box
                p="4"
                bg="red.50"
                borderRadius="md"
                border="1px"
                borderColor="red.200"
                textAlign="left"
                maxW="100%"
                overflow="auto"
              >
                <Typography fontSize="sm" fontFamily="mono" color="red.800">
                  {this.state.error.toString()}
                  {this.state.error.stack && (
                    <Box as="pre" mt="2" fontSize="xs" whiteSpace="pre-wrap">
                      {this.state.error.stack}
                    </Box>
                  )}
                </Typography>
              </Box>
            )}
            <Button variant="primary" onClick={this.resetError}>
              Try Again
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = "/dashboard"}>
              Go to Dashboard
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

