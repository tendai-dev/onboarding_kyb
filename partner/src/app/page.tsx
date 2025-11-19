"use client";

import { 
  Box, 
  Flex, 
  HStack, 
  VStack, 
  Container,
  Text,
  Image,
  Button,
  SimpleGrid,
  Icon,
  Spinner
} from "@chakra-ui/react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
// Removed: isAuthenticated import - using NextAuth session via useAuth() hook
import { useAuth } from "@/contexts/AuthContext";
import { 
  FiShield, 
  FiClock, 
  FiCheckCircle,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe
} from "react-icons/fi";

// Create motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionVStack = motion(VStack);
const MotionHStack = motion(HStack);
const MotionButton = motion(Button);

export default function Home() {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const router = useRouter();
  const { isAuthenticated: isAuth, isLoading: authLoading } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [shouldShowLanding, setShouldShowLanding] = useState(false);

  // SECURITY: Check authentication using NextAuth session (not localStorage)
  useEffect(() => {
    // Check authentication status using NextAuth session
    const checkAuthAndRedirect = async () => {
      // Wait a moment for auth state to initialize
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check authentication status from NextAuth
      // isAuth comes from useAuth() which should use NextAuth session
      if (!authLoading && isAuth) {
        router.replace("/partner/dashboard");
        return;
      }
      
      // Not authenticated, show the landing page
      setIsCheckingAuth(false);
      setShouldShowLanding(true);
    };

    checkAuthAndRedirect();
  }, [router, isAuth, authLoading]);

  // Show loading state while checking authentication
  // Don't show landing page until we're sure user is not authenticated
  if (isCheckingAuth || authLoading || !shouldShowLanding) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="white">
        <VStack gap={4}>
          <Spinner size="xl" color="#f76834" />
          <Text color="gray.600">Loading...</Text>
        </VStack>
      </Box>
    );
  }
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: 0 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      rotate: i % 2 === 0 ? -3 : 3,
      transition: {
        duration: 0.8,
        delay: i * 0.2,
        ease: "easeOut"
      }
    }),
    hover: {
      scale: 1.05,
      rotate: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  return (
    <MotionBox 
      minH="100vh" 
      bg="white" 
      position="relative"
      ref={containerRef}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Navigation */}
      <MotionFlex
        justify="space-between"
        align="center"
        px="8"
        py="6"
        position="absolute"
        top="0"
        left="0"
        right="0"
        zIndex="20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Logo */}
        <HStack gap="3">
          <Image src="/mukuru-logo.png" alt="Mukuru Logo" height="48px" width="auto" />
        </HStack>

        {/* Right Navigation Links */}
        <HStack gap="10">
          <Text 
            color="white" 
            fontWeight="medium" 
            cursor="pointer" 
            _hover={{ opacity: 0.8 }} 
            fontSize="lg"
            onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Benefits
          </Text>
          <Text 
            color="white" 
            fontWeight="medium" 
            cursor="pointer" 
            _hover={{ opacity: 0.8 }} 
            fontSize="lg"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Contact
          </Text>
        </HStack>
      </MotionFlex>

      {/* Main Content */}
      <MotionFlex minH="100vh" align="center" position="relative">
        {/* Left Section - White Background */}
        <MotionBox 
          flex="1" 
          px="12" 
          py="20" 
          position="relative" 
          zIndex="10"
          ref={heroRef}
        >
          <Container maxW="xl">
            <MotionVStack 
              align="start" 
              gap="8" 
              width="100%"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <Text
                  as="h1"
                  fontSize="6xl"
                  fontWeight="bold"
                  color="gray.800"
                  lineHeight="1.1"
                  whiteSpace="nowrap"
                >
                  Partner with Mukuru
                </Text>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Text
                  as="p"
                  fontSize="xl"
                  color="gray.600"
                  lineHeight="1.6"
                  maxW="l"
                  fontWeight="normal"
                >
                  Join Africa's leading microfinance network. Complete your business verification to access remittance and financial services for your partners.
                </Text>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                  <MotionButton
                    onClick={async () => {
                      // Use NextAuth signIn instead of legacy PKCE flow
                      // NextAuth handles OAuth flow and token storage in Redis
                      await signIn("keycloak", { 
                        callbackUrl: "/partner/dashboard",
                        redirect: true 
                      });
                    }}
                    variant="solid"
                    size="xl"
                    borderRadius="32px"
                    fontWeight="semibold"
                    fontSize="xl"
                    px="12"
                    py="6"
                    bg="gray.800"
                    color="white"
                    _hover={{ bg: "gray.700" }}
                    _active={{ bg: "gray.900" }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 12px 30px rgba(0, 0, 0, 0.3)"
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get Started Now
                  </MotionButton>
              </motion.div>
            </MotionVStack>
          </Container>
        </MotionBox>

        {/* Right Section - Orange Background with diagonal cut */}
        <MotionBox 
          flex="1" 
          position="relative" 
          minH="100vh"
          bg="linear-gradient(155deg, #f76834 0%, #e55a2b 100%)"
          clipPath="polygon(5% 0%, 100% 0%, 100% 100%, 0% 100%)"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Animated background circles */}
          <MotionBox
            position="absolute"
            top="10%"
            right="15%"
            width="140px"
            height="140px"
            borderRadius="50%"
            bg="rgba(255, 255, 255, 0.1)"
            opacity="0.6"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.6, 0.8, 0.6]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <MotionBox
            position="absolute"
            top="60%"
            right="5%"
            width="100px"
            height="100px"
            borderRadius="50%"
            bg="rgba(255, 255, 255, 0.08)"
            opacity="0.4"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </MotionBox>

        {/* Floating Cards positioned within the orange section */}
      {/* Top Card - Quick Verification */}
      <MotionBox
        position="absolute"
        top="25%"
        right="20%"
        bg="white"
        p="7"
        borderRadius="xl"
        boxShadow="xl"
        zIndex="15"
        width="320px"
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        custom={0}
        whileHover="hover"
        whileTap={{ scale: 0.95 }}
      >
        <VStack gap="4" align="start">
          <Box
            width="56px"
            height="56px"
            borderRadius="50%"
            bg="#FF6B00"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="2xl" color="white" fontWeight="bold">✓</Text>
          </Box>
          <VStack gap="2" align="start">
            <Text fontSize="xl" fontWeight="bold" color="gray.800">
              Quick Verification
            </Text>
            <Text fontSize="md" color="gray.600">
              Fast-track approval process
            </Text>
          </VStack>
        </VStack>
      </MotionBox>

      {/* Middle Card - Application Status */}
      <MotionBox
        position="absolute"
        top="45%"
        right="10%"
        bg="white"
        p="7"
        borderRadius="xl"
        boxShadow="xl"
        zIndex="15"
        width="320px"
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        custom={1}
        whileHover="hover"
        whileTap={{ scale: 0.95 }}
      >
        <VStack gap="4" align="start">
          <HStack justify="space-between" width="100%">
            <Text fontSize="xl" fontWeight="bold" color="gray.800">
              Application Status
            </Text>
            <Box
              width="24px"
              height="24px"
              bg="green.500"
              borderRadius="sm"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="sm" color="white">↗</Text>
            </Box>
          </HStack>
          
          {/* Bar Chart */}
          <HStack gap="3" align="end" height="70px">
            <Box width="14px" height="25px" bg="#FFB366" borderRadius="3px" />
            <Box width="14px" height="40px" bg="#FF8C42" borderRadius="3px" />
            <Box width="14px" height="55px" bg="#FF6B00" borderRadius="3px" />
            <Box width="14px" height="70px" bg="gray.800" borderRadius="3px" />
          </HStack>
        </VStack>
      </MotionBox>

      {/* Bottom Card - Progress Checklist */}
      <MotionBox
        position="absolute"
        top="65%"
        right="25%"
        bg="white"
        p="7"
        borderRadius="xl"
        boxShadow="xl"
        zIndex="15"
        width="320px"
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        custom={2}
        whileHover="hover"
        whileTap={{ scale: 0.95 }}
      >
        <VStack gap="4" align="start">
          {/* Progress Lines */}
          <HStack gap="4" width="100%">
            <Box width="18px" height="18px" bg="gray.300" borderRadius="sm" />
            <Box width="100%" height="3px" bg="gray.300" borderRadius="2px" />
          </HStack>
          <HStack gap="4" width="100%">
            <Box width="18px" height="18px" bg="gray.300" borderRadius="sm" />
            <Box width="100%" height="3px" bg="gray.300" borderRadius="2px" />
          </HStack>
          <HStack gap="4" width="100%">
            <Box width="18px" height="18px" bg="green.500" borderRadius="sm" />
            <Box width="100%" height="3px" bg="green.500" borderRadius="2px" />
          </HStack>
        </VStack>
      </MotionBox>
      </MotionFlex>

      {/* Why Partner with Mukuru Section */}
      <MotionBox
        id="benefits"
        py="20"
        bg="white"
        position="relative"
        zIndex="5"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <Container maxW="6xl">
          <MotionVStack gap="12" align="center">
            <MotionVStack gap="4" align="center" textAlign="center">
              <Text fontSize="4xl" fontWeight="bold" color="gray.800">
                Why Partner with Mukuru?
              </Text>
              <Text fontSize="xl" color="gray.600" maxW="3xl">
                Join thousands of businesses across Africa providing trusted financial services
              </Text>
            </MotionVStack>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} gap="8" width="100%">
              <MotionBox
                bg="white"
                p="8"
                borderRadius="xl"
                boxShadow="lg"
                textAlign="center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Box
                  width="80px"
                  height="80px"
                  border="3px"
                  borderColor="#f76834"
                  borderRadius="50%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb="6"
                >
                  <Icon as={FiShield} boxSize="8" color="#f76834" />
                </Box>
                <Text fontSize="xl" fontWeight="bold" color="gray.800" mb="4">
                  Trusted & Secure
                </Text>
                <Text color="gray.600">
                  Bank-level security protects your business information throughout verification
                </Text>
      </MotionBox>

              <MotionBox
                bg="white"
                p="8"
                borderRadius="xl"
                boxShadow="lg"
                textAlign="center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Box
                  width="80px"
                  height="80px"
                  border="3px"
                  borderColor="#f76834"
                  borderRadius="50%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb="6"
                >
                  <Icon as={FiClock} boxSize="8" color="#f76834" />
                </Box>
                <Text fontSize="xl" fontWeight="bold" color="gray.800" mb="4">
                  Fast Approval
                </Text>
                <Text color="gray.600">
                  Get approved quickly and start offering remittance services to your partners
                </Text>
      </MotionBox>

              <MotionBox
                bg="white"
                p="8"
                borderRadius="xl"
                boxShadow="lg"
                textAlign="center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Box
                  width="80px"
                  height="80px"
                  border="3px"
                  borderColor="#f76834"
                  borderRadius="50%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb="6"
                >
                  <Icon as={FiCheckCircle} boxSize="8" color="#f76834" />
                </Box>
                <Text fontSize="xl" fontWeight="bold" color="gray.800" mb="4">
                  Real-Time Tracking
                </Text>
                <Text color="gray.600">
                  Track your verification status and communicate with our compliance team
                </Text>
              </MotionBox>
            </SimpleGrid>
          </MotionVStack>
        </Container>
      </MotionBox>

      {/* Get in Touch Section */}
      <MotionBox
        id="contact"
        py="20"
        bg="gray.50"
        position="relative"
        zIndex="5"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Orange diagonal background */}
        <MotionBox
          position="absolute"
          top="0"
          right="0"
          width="75%"
          height="100%"
          bg="linear-gradient(135deg, #f76834 0%, #e55a2b 100%)"
          clipPath="polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)"
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        />
        
        <Container maxW="6xl" position="relative" zIndex="10">
          <MotionVStack gap="12" align="center">
            <MotionVStack gap="4" align="center" textAlign="center">
              <Text fontSize="4xl" fontWeight="bold" color="gray.800">
                Get in Touch
              </Text>
              <Text fontSize="xl" color="gray.600" maxW="3xl">
                Have questions? Our compliance team is here to help
              </Text>
            </MotionVStack>
            
            <SimpleGrid columns={{ base: 1, md: 4 }} gap="6" width="100%">
              <MotionBox
                bg="white"
                p="6"
                borderRadius="xl"
                boxShadow="lg"
                textAlign="center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Box
                  width="60px"
                  height="60px"
                  border="3px"
                  borderColor="#f76834"
                  borderRadius="50%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb="4"
                >
                  <Icon as={FiMail} boxSize="6" color="#f76834" />
                </Box>
                <Text fontSize="lg" fontWeight="bold" color="gray.800" mb="2">
                  Email Us
                </Text>
                <Text fontSize="sm" color="gray.600">
                  kyb@mukuru.com
                </Text>
              </MotionBox>
              
              <MotionBox
                bg="white"
                p="6"
                borderRadius="xl"
                boxShadow="lg"
                textAlign="center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Box
                  width="60px"
                  height="60px"
                  border="3px"
                  borderColor="#f76834"
                  borderRadius="50%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb="4"
                >
                  <Icon as={FiPhone} boxSize="6" color="#f76834" />
                </Box>
                <Text fontSize="lg" fontWeight="bold" color="gray.800" mb="2">
                  Call Us
                </Text>
                <Text fontSize="sm" color="gray.600">
                  +27 10 593 0849
                </Text>
              </MotionBox>
              
              <MotionBox
                bg="white"
                p="6"
                borderRadius="xl"
                boxShadow="lg"
                textAlign="center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Box
                  width="60px"
                  height="60px"
                  border="3px"
                  borderColor="#f76834"
                  borderRadius="50%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb="4"
                >
                  <Icon as={FiMapPin} boxSize="6" color="#f76834" />
                </Box>
                <Text fontSize="lg" fontWeight="bold" color="gray.800" mb="2">
                  Visit Us
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Johannesburg, South Africa
                </Text>
              </MotionBox>
              
              <MotionBox
                bg="white"
                p="6"
                borderRadius="xl"
                boxShadow="lg"
                textAlign="center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <Box
                  width="60px"
                  height="60px"
                  border="3px"
                  borderColor="#f76834"
                  borderRadius="50%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb="4"
                >
                  <Icon as={FiGlobe} boxSize="6" color="#f76834" />
                </Box>
                <Text fontSize="lg" fontWeight="bold" color="gray.800" mb="2">
                  Website
                </Text>
                <Text fontSize="sm" color="gray.600">
                  mukuru.com
                </Text>
              </MotionBox>
            </SimpleGrid>
          </MotionVStack>
        </Container>
      </MotionBox>

      {/* Footer */}
      <MotionBox
        py="8"
        bg="white"
        borderTop="1px"
        borderColor="gray.200"
        position="relative"
        zIndex="5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <Container maxW="6xl">
          <Flex justify="space-between" align="center">
            <Text fontSize="sm" color="gray.600">
              © 2025 Mukuru. All rights reserved.
            </Text>
            <HStack gap="6">
              {/* Footer links removed - pages not implemented yet */}
            </HStack>
          </Flex>
        </Container>
      </MotionBox>

    </MotionBox>
  );
}