import type { StackProps } from "@chakra-ui/react";
import type React from "react";
export interface NavbarProps extends Omit<StackProps, "children"> {
    leftComponent?: React.ReactNode;
    centerComponent?: React.ReactNode;
    rightComponent?: React.ReactNode;
    sticky?: boolean;
}
//# sourceMappingURL=Navbar.types.d.ts.map