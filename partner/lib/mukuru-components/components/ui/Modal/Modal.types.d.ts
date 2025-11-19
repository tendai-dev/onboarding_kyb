import type { RecipeVariantProps } from "@chakra-ui/react";
import { modalRecipe } from "../../../configs/themes/modal.recipe";
import type { ReactNode } from "react";
export type ModalVariantProps = RecipeVariantProps<typeof modalRecipe>;
export interface ModalProps extends ModalVariantProps {
    /**
     * Whether the modal is open
     */
    isOpen: boolean;
    /**
     * Callback fired when the modal is closed
     */
    onClose: () => void;
    /**
     * The content of the modal
     */
    children: ReactNode;
    /**
     * The title/heading of the modal
     */
    title?: string;
    /**
     * Whether to show the close button in the header
     */
    showCloseButton?: boolean;
    /**
     * Footer content (typically buttons like Cancel/Save)
     */
    footer?: ReactNode;
    /**
     * Whether clicking on the backdrop should close the modal
     */
    closeOnBackdropClick?: boolean;
    /**
     * Whether pressing Escape should close the modal
     */
    closeOnEsc?: boolean;
    /**
     * Custom header content (overrides title if provided)
     */
    header?: ReactNode;
    /**
     * Whether the modal content should be scrollable
     */
    scrollable?: boolean;
    /**
     * The size variant of the modal
     */
    size?: "small" | "large";
    /**
     * The variant of the modal
     */
    variant?: "default" | "with-scroll";
}
export interface ModalHeaderProps {
    children: ReactNode;
    showCloseButton?: boolean;
    onClose?: () => void;
}
export interface ModalBodyProps {
    children: ReactNode;
    scrollable?: boolean;
}
export interface ModalFooterProps {
    children: ReactNode;
}
//# sourceMappingURL=Modal.types.d.ts.map