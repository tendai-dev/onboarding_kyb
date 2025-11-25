// Empty switch recipe to replace the problematic Mukuru switch recipe
// This prevents the switchAnatomy.keys error
// Using CommonJS format for webpack compatibility
// This must match the structure expected by Chakra UI v3
const switchSlotRecipe = {
  base: {},
  variants: {},
  defaultVariants: {},
  slots: {
    root: {},
    control: {},
    thumb: {},
    label: {}
  }
};

module.exports = { switchSlotRecipe };
module.exports.switchSlotRecipe = switchSlotRecipe;
module.exports.default = { switchSlotRecipe };

