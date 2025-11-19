export declare const tabsSlotRecipe: import("@chakra-ui/react").SlotRecipeDefinition<"root" | "indicator" | "content" | "list" | "trigger" | "contentGroup", {
    fitted: {
        true: {
            list: {
                display: "flex";
            };
            trigger: {
                flex: number;
                textAlign: "center";
                justifyContent: "center";
            };
        };
    };
    justify: {
        start: {
            list: {
                justifyContent: "flex-start";
            };
        };
        center: {
            list: {
                justifyContent: "center";
            };
        };
        end: {
            list: {
                justifyContent: "flex-end";
            };
        };
    };
    size: {
        sm: {
            root: {
                "--tabs-height": "sizes.9";
                "--tabs-content-padding": "spacing.3";
            };
            trigger: {
                py: "1";
                px: "3";
                textStyle: "sm";
            };
        };
        md: {
            root: {
                "--tabs-height": "sizes.10";
                "--tabs-content-padding": "spacing.4";
            };
            trigger: {
                py: "2";
                px: "4";
                textStyle: "sm";
            };
        };
        lg: {
            root: {
                "--tabs-height": "sizes.11";
                "--tabs-content-padding": "spacing.4.5";
            };
            trigger: {
                py: "2";
                px: "4.5";
                textStyle: "md";
            };
        };
    };
    variant: {
        line: {
            list: {
                display: "flex";
                borderColor: "border";
                _horizontal: {
                    borderBottomWidth: "1px";
                };
                _vertical: {
                    borderEndWidth: "1px";
                };
            };
            trigger: {
                fontWeight: number;
                fontSize: "16px";
                lineHeight: "14px";
                padding: "20px 24px 22px 24px";
                height: "auto";
                color: "colors.mukuru.grey.600";
                _hover: {
                    color: "mukuru.orange.200";
                    layerStyle: "indicator.bottom";
                    "--indicator-offset-y": "0px";
                    "--indicator-color": "colors.mukuru.grey.800";
                    _selected: {
                        color: "mukuru.orange.200";
                        "--indicator-color": "colors.mukuru.orange.200";
                    };
                };
                _disabled: {
                    _active: {
                        bg: "initial";
                    };
                };
                _selected: {
                    border: number;
                    color: "mukuru.orange.200";
                    _horizontal: {
                        layerStyle: "indicator.bottom";
                        "--indicator-offset-y": "0px";
                        "--indicator-color": "colors.mukuru.orange.200";
                    };
                    _vertical: {
                        layerStyle: "indicator.end";
                        "--indicator-offset-x": "-1px";
                    };
                };
            };
        };
        subtle: {
            trigger: {
                borderRadius: "var(--tabs-trigger-radius)";
                color: "fg.muted";
                _selected: {
                    bg: "colorPalette.subtle";
                    color: "colorPalette.fg";
                };
            };
        };
        enclosed: {
            list: {
                bg: "bg.muted";
                padding: "1";
                borderRadius: "l3";
                minH: "calc(var(--tabs-height) - 4px)";
            };
            trigger: {
                justifyContent: "center";
                color: "fg.muted";
                borderRadius: "var(--tabs-trigger-radius)";
                _selected: {
                    bg: "bg";
                    color: "colorPalette.fg";
                    shadow: "xs";
                };
            };
        };
        outline: {
            list: {
                "--line-thickness": "1px";
                "--line-offset": "calc(var(--line-thickness) * -1)";
                borderColor: "border";
                display: "flex";
                _horizontal: {
                    _before: {
                        content: "\"\"";
                        position: "absolute";
                        bottom: "0px";
                        width: "100%";
                        borderBottomWidth: "var(--line-thickness)";
                        borderBottomColor: "border";
                    };
                };
                _vertical: {
                    _before: {
                        content: "\"\"";
                        position: "absolute";
                        insetInline: "var(--line-offset)";
                        height: "calc(100% - calc(var(--line-thickness) * 2))";
                        borderEndWidth: "var(--line-thickness)";
                        borderEndColor: "border";
                    };
                };
            };
            trigger: {
                color: "fg.muted";
                borderWidth: "1px";
                borderColor: "transparent";
                _selected: {
                    bg: "currentBg";
                    color: "colorPalette.fg";
                };
                _horizontal: {
                    borderTopRadius: "var(--tabs-trigger-radius)";
                    marginBottom: "var(--line-offset)";
                    marginEnd: {
                        _notLast: "var(--line-offset)";
                    };
                    _selected: {
                        borderColor: "border";
                        borderBottomColor: "transparent";
                    };
                };
                _vertical: {
                    borderStartRadius: "var(--tabs-trigger-radius)";
                    marginEnd: "var(--line-offset)";
                    marginBottom: {
                        _notLast: "var(--line-offset)";
                    };
                    _selected: {
                        borderColor: "border";
                        borderEndColor: "transparent";
                    };
                };
            };
        };
        plain: {
            trigger: {
                color: "fg.muted";
                _selected: {
                    color: "colorPalette.fg";
                };
                borderRadius: "var(--tabs-trigger-radius)";
                "&[data-selected][data-ssr]": {
                    bg: "var(--tabs-indicator-bg)";
                    shadow: "var(--tabs-indicator-shadow)";
                    borderRadius: "var(--tabs-indicator-radius)";
                };
            };
        };
    };
}>;
//# sourceMappingURL=tabs.recipe.d.ts.map