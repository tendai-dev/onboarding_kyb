"use client";

// Wrapper components for Input and Tabs that are not yet exported from @mukuru/mukuru-react-components
// NOTE: These components are not yet exported from the main npm package (@mukuru/mukuru-react-components@1.0.44)
// We use Chakra UI's components and create wrappers that match Mukuru styling
// Once Input and Tabs are added to the package exports, we can remove this file

import { Tabs, Input as ChakraInput, Field } from "@chakra-ui/react";
import { forwardRef } from "react";
import type React from "react";

// Re-export Chakra UI Tabs components with Mukuru naming
export const TabsRoot = Tabs.Root;
export const TabsList = Tabs.List;
export const TabsTrigger = Tabs.Trigger;
export const TabsContent = Tabs.Content;
export const TabsIndicator = forwardRef<HTMLDivElement, React.ComponentProps<typeof Tabs.Indicator>>(
  (props, ref) => <Tabs.Indicator ref={ref} rounded="l2" {...props} />
);
TabsIndicator.displayName = "TabsIndicator";

// Create a simple Input wrapper that matches Mukuru Input API
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, size, ...props }, ref) => {
  // Filter out size if it's a number (Chakra expects string size values)
  const { size: _, ...chakraProps } = props as any;
  if (size && typeof size === 'string') {
    (chakraProps as any).size = size;
  }
  
  if (label) {
    return (
      <Field.Root>
        <Field.Label>{label}</Field.Label>
        <ChakraInput ref={ref} {...(chakraProps as any)} />
      </Field.Root>
    );
  }
  return <ChakraInput ref={ref} {...(chakraProps as any)} />;
});
Input.displayName = "Input";

