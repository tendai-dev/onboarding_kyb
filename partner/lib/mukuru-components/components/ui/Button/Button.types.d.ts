import type { RecipeVariantProps, ButtonProps as ChakraButtonProps } from "@chakra-ui/react";
import type { buttonRecipe } from "../../../configs/themes/button.recipe";
import type { ReactNode } from "react";
export type ButtonVariantProps = RecipeVariantProps<typeof buttonRecipe>;
export interface ButtonProps extends Omit<ChakraButtonProps, "color" | "size" | "variant">, ButtonVariantProps {
    children?: ReactNode;
    disabled?: boolean;
    loading?: boolean;
    loadingText?: ReactNode;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}
//# sourceMappingURL=Button.types.d.ts.map