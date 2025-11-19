/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@chakra-ui/react/anatomy': '@chakra-ui/anatomy',
    };
    return config;
  },
};

module.exports = nextConfig;
