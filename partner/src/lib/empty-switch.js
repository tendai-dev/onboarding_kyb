// Empty module to replace problematic Mukuru Switch component
// This prevents the Switch component from causing runtime errors

const Switch = () => null;
Switch.displayName = 'Switch';
Switch.Root = () => null;
Switch.Root.displayName = 'Switch.Root';
Switch.Control = () => null;
Switch.Control.displayName = 'Switch.Control';
Switch.Thumb = () => null;
Switch.Thumb.displayName = 'Switch.Thumb';
Switch.Indicator = () => null;
Switch.Indicator.displayName = 'Switch.Indicator';

module.exports = Switch;
module.exports.default = Switch;
