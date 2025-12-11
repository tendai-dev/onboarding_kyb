// Compatibility shim for Chakra UI anatomy
// Simply re-export the anatomy module - it already has .keys() method
// This shim exists to ensure consistent module resolution

import anatomy from '@chakra-ui/react/anatomy';
export default anatomy;
export * from '@chakra-ui/react/anatomy';
