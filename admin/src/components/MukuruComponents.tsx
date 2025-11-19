"use client";

import { useEffect, useState } from "react";
import { Box, Flex, HStack, VStack, Container, Text, Image, Button } from "@chakra-ui/react";

// Note: @mukuru/mukuru-react-components is not available, using Chakra UI fallbacks
// Simple approach: Only use Mukuru components after a longer delay to ensure context is ready
export function ClientOnlyMukuruLogo(props: any) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Always use fallback since Mukuru components are not available
  return <Image src="/mukuru-logo.png" alt="Mukuru Logo" height="48px" width="auto" />;
}

export function ClientOnlyMukuruButton(props: any) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Always use fallback since Mukuru components are not available
  return (
    <Button 
      variant="solid" 
      size={props.size || "lg"}
      borderRadius={props.variant === 'primary' ? "28px" : "6px"}
      fontWeight="medium"
      fontSize={props.size === 'sm' ? "sm" : "lg"}
      px={props.size === 'sm' ? "4" : "10"}
      py={props.size === 'sm' ? "2" : "5"}
      bg="#FF6B35"
      color="white"
      _hover={{ bg: "#E55A2B" }}
      _active={{ bg: "#CC4A1F" }}
      {...props}
    >
      {props.children}
    </Button>
  );
}

export function ClientOnlyMukuruTypography(props: any) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Always use fallback since Mukuru components are not available
  return (
    <Text 
      as={props.levels === 'h1' ? 'h1' : props.levels === 'h2' ? 'h2' : props.levels === 'h3' ? 'h3' : 'p'}
      fontSize={props.levels === 'h1' ? '6xl' : props.levels === 'h2' ? '4xl' : props.levels === 'h3' ? '2xl' : 'lg'}
      fontWeight={props.levels === 'h1' || props.levels === 'h2' ? 'bold' : props.levels === 'h3' ? 'semibold' : 'normal'}
      color="gray.800"
      lineHeight={props.levels === 'h1' ? '1.1' : props.levels === 'h2' ? '1.2' : props.levels === 'h3' ? '1.3' : '1.6'}
      {...props}
    >
      {props.children}
    </Text>
  );
}