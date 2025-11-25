/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
};

module.exports = nextConfig;
