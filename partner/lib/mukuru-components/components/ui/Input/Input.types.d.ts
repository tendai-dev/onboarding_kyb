import type { InputHTMLAttributes, ReactNode } from "react";
import type { RecipeVariantProps } from "@chakra-ui/react";
import type { inputSlotRecipe } from "../../../configs/themes/input.recipe";
/**
 * Variant props from recipe
 */
export type InputVariantProps = RecipeVariantProps<typeof inputSlotRecipe>;
/**
 * Props for Input component
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">, InputVariantProps {
    label?: string;
    assistiveText?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    error?: boolean;
}
//# sourceMappingURL=Input.types.d.ts.map