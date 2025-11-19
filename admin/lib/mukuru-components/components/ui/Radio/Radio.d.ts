import type { RadioProps } from "./Radio.types";
import { type ReactNode } from "react";
/**
 * The Radio component allows users to select a single option from a group. Selecting a new option automatically deselects the previous one.
 */
export declare const Radio: import("react").ForwardRefExoticComponent<RadioProps & import("react").RefAttributes<HTMLInputElement>>;
/**
 * Group Wrapper
 */
export declare const RadioGroup: ({ children, label, ...props }: {
    children: ReactNode;
    label?: string;
    [key: string]: unknown;
}) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Radio.d.ts.map