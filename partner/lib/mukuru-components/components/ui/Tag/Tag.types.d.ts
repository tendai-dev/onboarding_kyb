import type { RecipeVariantProps } from "@chakra-ui/react";
import type { tagRecipe } from "../../../configs/themes/tag.recipe";
import type { BaseHTMLAttributes } from "react";
export type TagVariantProps = RecipeVariantProps<typeof tagRecipe>;
export interface TagProps extends BaseHTMLAttributes<HTMLSpanElement>, TagVariantProps {
}
//# sourceMappingURL=Tag.types.d.ts.map