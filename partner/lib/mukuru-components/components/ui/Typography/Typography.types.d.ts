import type { HTMLChakraProps, RecipeVariantProps } from "@chakra-ui/react";
import type { typographyRecipe } from "../../../configs/themes/typography.recipe";
/**
 * Variant props from recipe
 */
export type TypographyVariantProps = RecipeVariantProps<typeof typographyRecipe>;
/**
 * Props for Typography component
 */
export interface TypographyProps extends HTMLChakraProps<"p">, TypographyVariantProps {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: number | string;
}
//# sourceMappingURL=Typography.types.d.ts.map