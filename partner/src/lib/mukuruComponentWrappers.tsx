'use client';
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Wrapper components for Input and Tabs that are not yet exported from @mukuru/mukuru-react-components
// NOTE: These components are not yet exported from the main npm package (@mukuru/mukuru-react-components@1.0.44)
// We use Chakra UI's components and create wrappers that match Mukuru styling
// Once Input and Tabs are added to the package exports, we can remove this file

import { Tabs, Input as ChakraInput, Field, Box } from '@chakra-ui/react';
import { Typography } from '@/lib/mukuruImports';
import { forwardRef } from 'react';
import type React from 'react';

// Re-export Chakra UI Tabs components with Mukuru naming
export const TabsRoot = Tabs.Root;
export const TabsList = Tabs.List;
export const TabsTrigger = Tabs.Trigger;
export const TabsContent = Tabs.Content;
export const TabsIndicator = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Tabs.Indicator>
>((props, ref) => <Tabs.Indicator ref={ref} rounded="l2" {...props} />);
TabsIndicator.displayName = 'TabsIndicator';

// Create a simple Input wrapper that matches Mukuru Input API
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, size, ...props }, ref) => {
    // Filter out size if it's a number (Chakra expects string size values)
    const chakraProps = { ...props } as any;
    if (size && typeof size === 'string') {
      chakraProps.size = size;
    }

    if (label) {
      return (
        <Field.Root>
          <Field.Label>
            <Typography
              color="mukuru.text.primary"
              fontSize="sm"
              fontWeight="medium"
              mb="1"
            >
              {label}
            </Typography>
          </Field.Label>
          <ChakraInput
            ref={ref}
            color="mukuru.text.primary"
            _placeholder={{ color: '#D0D0D0' }}
            {...(chakraProps as any)}
          />
        </Field.Root>
      );
    }
    return (
      <ChakraInput
        ref={ref}
        color="mukuru.text.primary"
        _placeholder={{ color: '#9CA3AF' }}
        {...(chakraProps as any)}
      />
    );
  }
);
Input.displayName = 'Input';

// FormControl wrapper for Chakra UI v3 compatibility
interface FormControlProps {
  children: React.ReactNode;
  isInvalid?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  [key: string]: any;
}

export const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
  (
    {
      children,
      isInvalid: _isInvalid,
      isRequired: _isRequired,
      isDisabled: _isDisabled,
      ...props
    },
    ref
  ) => {
    return (
      <Box ref={ref} {...props}>
        {children as React.ReactNode}
      </Box>
    );
  }
);
FormControl.displayName = 'FormControl';

// FormHelperText wrapper
interface FormHelperTextProps {
  children: React.ReactNode;
  id?: string;
  [key: string]: any;
}

export const FormHelperText = forwardRef<HTMLDivElement, FormHelperTextProps>(
  ({ children, ...props }, ref) => {
    return (
      <Typography ref={ref} fontSize="xs" color="mukuru.text.primary" mt="1" {...props}>
        {children as React.ReactNode}
      </Typography>
    );
  }
);
FormHelperText.displayName = 'FormHelperText';

// FormErrorMessage wrapper
interface FormErrorMessageProps {
  children: React.ReactNode;
  [key: string]: any;
}

export const FormErrorMessage = forwardRef<HTMLDivElement, FormErrorMessageProps>(
  ({ children, ...props }, ref) => {
    return (
      <Typography ref={ref} fontSize="xs" color="red.500" mt="1" {...props}>
        {children as React.ReactNode}
      </Typography>
    );
  }
);
FormErrorMessage.displayName = 'FormErrorMessage';

// FormLabel wrapper
interface FormLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  [key: string]: any;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ children, htmlFor, ...props }, ref) => {
    return (
      <Typography
        ref={ref as any}
        as="label"
        fontSize="sm"
        fontWeight="medium"
        color="mukuru.text.primary"
        mb="1"
        display="block"
        {...(props as any)}
        {...(htmlFor ? { htmlFor } : {})}
      >
        {children as React.ReactNode}
      </Typography>
    );
  }
);
FormLabel.displayName = 'FormLabel';
