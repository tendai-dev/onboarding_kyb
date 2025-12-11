import type { PropsWithChildren } from 'react';
import type {
  RecipeVariantProps,
  RadioGroup as ChakraRadioGroup,
} from '@chakra-ui/react';
import type { radioRecipe } from '../../../configs/themes/radio.recipe';
/**
 * Variant props from recipe
 */
export type RadioVariantProps = RecipeVariantProps<typeof radioRecipe>;
/**
 * Props for Radio component
 */
export interface RadioProps
  extends PropsWithChildren<ChakraRadioGroup.ItemProps>,
    RadioVariantProps {}
//# sourceMappingURL=Radio.types.d.ts.map
