// Empty module to replace problematic Mukuru Switch component
// This prevents the Switch component from causing runtime errors
const Switch = () => null;
Switch.Root = () => null;
Switch.Control = () => null;
Switch.Thumb = () => null;
Switch.Indicator = () => null;

module.exports = Switch;
module.exports.default = Switch;
