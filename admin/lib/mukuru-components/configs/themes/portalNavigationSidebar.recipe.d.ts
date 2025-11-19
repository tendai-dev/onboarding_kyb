export declare const portalNavigationSidebarRecipe: import("@chakra-ui/react").SlotRecipeDefinition<"root" | "tooltip" | "navigation" | "navigationList" | "navigationItem" | "navigationItemContent" | "navigationItemIcon" | "subNavigationItem" | "divider" | "logoContainer" | "logo" | "toggleButton" | "navigationItemLabel" | "navigationItemExpand" | "subNavigation" | "helpCentre" | "flyoutContent", {
    variant: {
        expanded: {
            navigationItemIcon: {
                display: "flex";
            };
            navigationItemLabel: {
                display: "block";
            };
            navigationItemExpand: {
                display: "flex";
            };
            navigationItemContent: {
                _hover: {
                    backgroundColor: "transparent";
                };
            };
            subNavigation: {
                display: "block";
            };
            subNavigationItem: {
                fontSize: "16px";
                paddingLeft: "48px";
            };
        };
        condensed: {
            logoContainer: {
                justifyContent: "center";
            };
            navigationItem: {
                position: "relative";
                _hover: {
                    "& .flyout-trigger": {
                        display: "block";
                    };
                };
            };
            navigationItemContent: {
                justifyContent: "center";
                padding: "12px 8px";
                position: "relative";
                borderRadius: "20px";
                _hover: {
                    fontWeight: "700";
                    backgroundColor: "mukuru.orange.500";
                };
            };
            navigationItemIcon: {
                display: "flex";
                marginRight: number;
            };
            navigationItemLabel: {
                display: "none";
            };
            navigationItemExpand: {
                display: "none";
            };
            subNavigation: {
                display: "none";
            };
            subNavigationItem: {
                backgroundColor: "transparent";
                padding: "12px 16px";
                width: "100%";
                margin: "0";
                fontSize: "16px";
                textAlign: "left";
                fontWeight: "500";
                justifyContent: "flex-start";
                borderRadius: "4px";
                _hover: {
                    backgroundColor: "transparent";
                    fontWeight: "700";
                };
            };
            helpCentre: {
                display: "flex";
                justifyContent: "center";
            };
        };
    };
    state: {
        active: {
            navigationItemContent: {
                backgroundColor: "mukuru.primary";
                color: "mukuru.white";
                _hover: {
                    backgroundColor: "mukuru.primary";
                    color: "mukuru.white";
                };
            };
            subNavigationItem: {
                backgroundColor: "mukuru.buttons.inactive.orange";
                color: "mukuru.primary";
                _hover: {
                    backgroundColor: "mukuru.buttons.inactive.orange";
                    color: "mukuru.primary";
                };
            };
        };
        expanded: {
            navigationItemExpand: {
                transform: "rotate(180deg)";
            };
        };
    };
}>;
//# sourceMappingURL=portalNavigationSidebar.recipe.d.ts.map