import type { ModalProps, ModalHeaderProps, ModalBodyProps, ModalFooterProps } from "./Modal.types";
/**
 * Modal Header component
 * Displays the title and optional close button
 */
export declare const ModalHeader: import("react").ForwardRefExoticComponent<ModalHeaderProps & import("react").RefAttributes<HTMLDivElement>>;
/**
 * Modal Body component
 * Contains the main content of the modal
 */
export declare const ModalBody: import("react").ForwardRefExoticComponent<ModalBodyProps & import("react").RefAttributes<HTMLDivElement>>;
/**
 * Modal Footer component
 * Contains action buttons and footer content
 */
export declare const ModalFooter: import("react").ForwardRefExoticComponent<ModalFooterProps & import("react").RefAttributes<HTMLDivElement>>;
/**
 * The Modal component displays content in a focused overlay on top of the main UI.
 * It supports both small and large layouts, and is used for actions such as editing details,
 * confirming changes, or collecting additional information without navigating away.
 *
 * Built on top of Chakra UI v3's Dialog component with SDS-specific styling.
 */
export declare const Modal: import("react").ForwardRefExoticComponent<ModalProps & import("react").RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Modal.d.ts.map