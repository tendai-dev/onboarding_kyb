import type { RecipeVariantProps } from "@chakra-ui/react";
import { linkRecipe } from "configs/themes/link.recipe";
import type { AnchorHTMLAttributes, ReactNode } from "react";
export type LinkVariantProps = RecipeVariantProps<typeof linkRecipe>;
export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color">, LinkVariantProps {
    children?: ReactNode;
    /**
     * If true, the link will open in a new tab
     * @default false
     */
    external?: boolean;
    /**
     * If true, the link will be disabled
     * @default false
     */
    disabled?: boolean;
    /**
     * The weight of the link
     * @default "default"
     */
    weight?: "default" | "bold";
}
//# sourceMappingURL=Link.types.d.ts.map