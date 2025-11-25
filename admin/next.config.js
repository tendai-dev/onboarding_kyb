// Injected content via Sentry wizard below
const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'graph.microsoft.com',
      },
      {
        protocol: 'https',
        hostname: '**.microsoftonline.com',
      },
    ],
  },
  webpack: (config, { webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Use our compatibility shim instead of the direct anatomy module
      '@chakra-ui/react/anatomy': require.resolve('./src/lib/anatomy-compat.js'),
    };
    
    // Ignore problematic Switch component completely
    const emptySwitchPath = require.resolve('./src/lib/empty-switch.js');
    
    const emptyRecipePath = require.resolve('./src/lib/empty-switch-recipe.js');
    
    config.plugins.push(
      // Replace Switch component at any import path
      new webpack.NormalModuleReplacementPlugin(
        /@mukuru\/mukuru-react-components\/dist\/components\/ui\/Switch\/Switch\.js$/,
        emptySwitchPath
      ),
      // Replace switch recipe imports - this is critical for theme loading
      // Handle both relative (./switch.recipe.js) and absolute imports
      new webpack.NormalModuleReplacementPlugin(
        /switch\.recipe\.js$/,
        emptyRecipePath
      )
    );
    
    // Use alias to replace Switch at import level
    config.resolve.alias['@mukuru/mukuru-react-components/dist/components/ui/Switch'] = emptySwitchPath;
    config.resolve.alias['@mukuru/mukuru-react-components/dist/configs/themes/switch.recipe'] = require.resolve('./src/lib/empty-switch-recipe.js');
    config.resolve.alias['@mukuru/mukuru-react-components/dist/configs/themes/switch.recipe.js'] = require.resolve('./src/lib/empty-switch-recipe.js');
    
    return config;
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@chakra-ui/react', 'react-icons'],
  },
};

module.exports = withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces in production
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // Can be disabled if you are not experiencing any issues with ad-blockers.
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,
  }
);
