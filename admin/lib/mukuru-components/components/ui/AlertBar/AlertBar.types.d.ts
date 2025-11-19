import type { RecipeVariantProps } from "@chakra-ui/react";
import type { BaseHTMLAttributes, ReactNode } from "react";
import type { alertBarRecipe } from "../../../configs/themes/alertBar.recipe";
export type AlertBarVariantProps = RecipeVariantProps<typeof alertBarRecipe>;
export type AlertBarStatus = "info" | "success" | "warning" | "error";
export interface AlertBarProps extends Omit<BaseHTMLAttributes<HTMLDivElement>, "title">, AlertBarVariantProps {
    /**
     * The status/type of the alert
     */
    status: AlertBarStatus;
    /**
     * Main title text for the alert
     */
    title: ReactNode;
    /**
     * Optional description text
     */
    description?: ReactNode;
    /**
     * Whether to show an icon for the status
     */
    showIcon?: boolean;
    /**
     * Whether to show a close button
     */
    showClose?: boolean;
    /**
     * Custom action button element
     */
    action?: ReactNode;
    /**
     * Callback when close button is clicked
     */
    onClose?: () => void;
    /**
     * Custom icon to override default status icon
     */
    icon?: ReactNode;
}
//# sourceMappingURL=AlertBar.types.d.ts.map