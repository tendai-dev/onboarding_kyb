// Compatibility shim for Chakra UI anatomy
// Simply re-export the anatomy module - it already has .keys() method
// This shim exists to ensure consistent module resolution

module.exports = require('@chakra-ui/react/anatomy');
module.exports.default = require('@chakra-ui/react/anatomy');
