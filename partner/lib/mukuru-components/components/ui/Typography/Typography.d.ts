import type { TypographyProps } from "./Typography.types";
/**
 *  The Typography component wraps Chakra’s primitive text elements with SDS typography styles. It uses Madera as the primary font with `'Madera', 'Helvetica Neue', 'Arial', sans-serif'` as fallbacks for consistent rendering across platforms and supports`fontSize`, `fontWeight`, and `lineHeight` tokens as defined in the Figma design system.
 *
 * The Madera font is self-hosted and should be loaded via our global styles. Make sure the fallback stack is applied in CSS and theme configuration to ensure graceful degradation.
 *
 */
export declare const Typography: import("react").ForwardRefExoticComponent<TypographyProps & import("react").RefAttributes<HTMLElement>>;
//# sourceMappingURL=Typography.d.ts.map