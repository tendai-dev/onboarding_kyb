;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="a22ebe27-0826-91a7-049d-59c61418167e")}catch(e){}}();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/AdminSidebar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdminSidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruImports$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/mukuruImports.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$PortalNavigationSidebar$2f$PortalNavigationSidebar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/PortalNavigationSidebar/PortalNavigationSidebar.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ProductIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Icons/ProductIcon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$UserIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Icons/UserIcon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$DocumentIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Icons/DocumentIcon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$SettingsIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Icons/SettingsIcon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$HelpIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Icons/HelpIcon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$AppIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Icons/AppIcon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$FileOpenIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Icons/FileOpenIcon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$FilterIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Icons/FilterIcon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$WarningIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Icons/WarningIcon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/box/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$SidebarContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/SidebarContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
function AdminSidebar() {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { condensed, setCondensed } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$SidebarContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSidebar"])();
    const [activeItemId, setActiveItemId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("dashboard");
    // Update activeItemId based on pathname
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminSidebar.useEffect": ()=>{
            if (pathname === "/dashboard") {
                setActiveItemId("dashboard");
            } else if (pathname?.startsWith("/work-queue")) {
                setActiveItemId("work-queue");
            } else if (pathname?.startsWith("/applications")) {
                setActiveItemId("applications");
            } else if (pathname?.startsWith("/review") || pathname?.startsWith("/risk-review") || pathname?.startsWith("/approvals")) {
                setActiveItemId("reviews");
            } else if (pathname?.startsWith("/documents")) {
                setActiveItemId("documents");
            } else if (pathname?.startsWith("/requirements")) {
                setActiveItemId("requirements");
            } else if (pathname?.startsWith("/entity-types")) {
                setActiveItemId("entity-types");
            } else if (pathname?.startsWith("/checklists")) {
                setActiveItemId("checklists");
            } else if (pathname?.startsWith("/wizard-configurations")) {
                setActiveItemId("wizard-configurations");
            } else if (pathname?.startsWith("/rules-and-permissions")) {
                setActiveItemId("rules-and-permissions");
            } else if (pathname?.startsWith("/audit-log")) {
                setActiveItemId("audit-log");
            } else if (pathname?.startsWith("/messages")) {
                setActiveItemId("messages");
            } else if (pathname?.startsWith("/notifications")) {
                setActiveItemId("notifications");
            } else if (pathname?.startsWith("/data-migration")) {
                setActiveItemId("data-migration");
            } else if (pathname?.startsWith("/refreshes")) {
                setActiveItemId("refreshes");
            } else if (pathname?.startsWith("/reports")) {
                setActiveItemId("reports");
            } else if (pathname?.startsWith("/profile")) {
                setActiveItemId("profile");
            } else if (pathname?.startsWith("/settings")) {
                setActiveItemId("settings");
            }
        }
    }["AdminSidebar.useEffect"], [
        pathname
    ]);
    const navigationItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AdminSidebar.useMemo[navigationItems]": ()=>[
                {
                    id: "dashboard",
                    label: "Dashboard",
                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ProductIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProductIcon"], {
                        width: "20",
                        height: "20"
                    }, void 0, false, {
                        fileName: "[project]/src/components/AdminSidebar.tsx",
                        lineNumber: 74,
                        columnNumber: 13
                    }, this),
                    onClick: {
                        "AdminSidebar.useMemo[navigationItems]": ()=>{
                            setActiveItemId("dashboard");
                            router.push("/dashboard");
                        }
                    }["AdminSidebar.useMemo[navigationItems]"]
                },
                {
                    id: "work-queue",
                    label: "Work Queue",
                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$FilterIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FilterIcon"], {
                        width: "20",
                        height: "20"
                    }, void 0, false, {
                        fileName: "[project]/src/components/AdminSidebar.tsx",
                        lineNumber: 83,
                        columnNumber: 13
                    }, this),
                    onClick: {
                        "AdminSidebar.useMemo[navigationItems]": ()=>{
                            setActiveItemId("work-queue");
                            router.push("/work-queue");
                        }
                    }["AdminSidebar.useMemo[navigationItems]"]
                },
                {
                    id: "applications",
                    label: "Applications",
                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$AppIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AppIcon"], {
                        width: "20",
                        height: "20"
                    }, void 0, false, {
                        fileName: "[project]/src/components/AdminSidebar.tsx",
                        lineNumber: 92,
                        columnNumber: 13
                    }, this),
                    onClick: {
                        "AdminSidebar.useMemo[navigationItems]": ()=>{
                            setActiveItemId("applications");
                            router.push("/applications");
                        }
                    }["AdminSidebar.useMemo[navigationItems]"]
                },
                {
                    id: "reviews",
                    label: "Reviews",
                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$DocumentIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DocumentIcon"], {
                        width: "20",
                        height: "20"
                    }, void 0, false, {
                        fileName: "[project]/src/components/AdminSidebar.tsx",
                        lineNumber: 101,
                        columnNumber: 13
                    }, this),
                    onClick: {
                        "AdminSidebar.useMemo[navigationItems]": ()=>{
                            setActiveItemId("reviews");
                            router.push("/review");
                        }
                    }["AdminSidebar.useMemo[navigationItems]"],
                    subItems: [
                        {
                            id: "risk-review",
                            label: "Risk Review",
                            onClick: {
                                "AdminSidebar.useMemo[navigationItems]": ()=>{
                                    setActiveItemId("reviews");
                                    router.push("/risk-review");
                                }
                            }["AdminSidebar.useMemo[navigationItems]"]
                        },
                        {
                            id: "approvals",
                            label: "Approvals",
                            onClick: {
                                "AdminSidebar.useMemo[navigationItems]": ()=>{
                                    setActiveItemId("reviews");
                                    router.push("/approvals");
                                }
                            }["AdminSidebar.useMemo[navigationItems]"]
                        }
                    ]
                },
                {
                    id: "documents",
                    label: "Documents",
                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$FileOpenIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FileOpenIcon"], {
                        width: "20",
                        height: "20"
                    }, void 0, false, {
                        fileName: "[project]/src/components/AdminSidebar.tsx",
                        lineNumber: 128,
                        columnNumber: 13
                    }, this),
                    onClick: {
                        "AdminSidebar.useMemo[navigationItems]": ()=>{
                            setActiveItemId("documents");
                            router.push("/documents");
                        }
                    }["AdminSidebar.useMemo[navigationItems]"]
                },
                {
                    id: "configuration",
                    label: "Configuration",
                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$SettingsIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SettingsIcon"], {
                        width: "20",
                        height: "20"
                    }, void 0, false, {
                        fileName: "[project]/src/components/AdminSidebar.tsx",
                        lineNumber: 137,
                        columnNumber: 13
                    }, this),
                    onClick: {
                        "AdminSidebar.useMemo[navigationItems]": ()=>{
                            setActiveItemId("configuration");
                            router.push("/requirements");
                        }
                    }["AdminSidebar.useMemo[navigationItems]"],
                    subItems: [
                        {
                            id: "requirements",
                            label: "Requirements",
                            onClick: {
                                "AdminSidebar.useMemo[navigationItems]": ()=>{
                                    setActiveItemId("configuration");
                                    router.push("/requirements");
                                }
                            }["AdminSidebar.useMemo[navigationItems]"]
                        },
                        {
                            id: "entity-types",
                            label: "Entity Types",
                            onClick: {
                                "AdminSidebar.useMemo[navigationItems]": ()=>{
                                    setActiveItemId("configuration");
                                    router.push("/entity-types");
                                }
                            }["AdminSidebar.useMemo[navigationItems]"]
                        },
                        {
                            id: "checklists",
                            label: "Checklists",
                            onClick: {
                                "AdminSidebar.useMemo[navigationItems]": ()=>{
                                    setActiveItemId("configuration");
                                    router.push("/checklists");
                                }
                            }["AdminSidebar.useMemo[navigationItems]"]
                        },
                        {
                            id: "wizard-configurations",
                            label: "Wizard Configurations",
                            onClick: {
                                "AdminSidebar.useMemo[navigationItems]": ()=>{
                                    setActiveItemId("configuration");
                                    router.push("/wizard-configurations");
                                }
                            }["AdminSidebar.useMemo[navigationItems]"]
                        },
                        {
                            id: "rules-and-permissions",
                            label: "Rules & Permissions",
                            onClick: {
                                "AdminSidebar.useMemo[navigationItems]": ()=>{
                                    setActiveItemId("configuration");
                                    router.push("/rules-and-permissions");
                                }
                            }["AdminSidebar.useMemo[navigationItems]"]
                        }
                    ]
                },
                {
                    id: "system",
                    label: "System",
                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$WarningIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WarningIcon"], {
                        width: "20",
                        height: "20"
                    }, void 0, false, {
                        fileName: "[project]/src/components/AdminSidebar.tsx",
                        lineNumber: 188,
                        columnNumber: 13
                    }, this),
                    onClick: {
                        "AdminSidebar.useMemo[navigationItems]": ()=>{
                            setActiveItemId("system");
                            router.push("/audit-log");
                        }
                    }["AdminSidebar.useMemo[navigationItems]"],
                    subItems: [
                        {
                            id: "audit-log",
                            label: "Audit Log",
                            onClick: {
                                "AdminSidebar.useMemo[navigationItems]": ()=>{
                                    setActiveItemId("system");
                                    router.push("/audit-log");
                                }
                            }["AdminSidebar.useMemo[navigationItems]"]
                        },
                        {
                            id: "messages",
                            label: "Messages",
                            onClick: {
                                "AdminSidebar.useMemo[navigationItems]": ()=>{
                                    setActiveItemId("system");
                                    router.push("/messages");
                                }
                            }["AdminSidebar.useMemo[navigationItems]"]
                        },
                        {
                            id: "notifications",
                            label: "Notifications",
                            onClick: {
                                "AdminSidebar.useMemo[navigationItems]": ()=>{
                                    setActiveItemId("system");
                                    router.push("/notifications");
                                }
                            }["AdminSidebar.useMemo[navigationItems]"]
                        },
                        {
                            id: "data-migration",
                            label: "Data Migration",
                            onClick: {
                                "AdminSidebar.useMemo[navigationItems]": ()=>{
                                    setActiveItemId("system");
                                    router.push("/data-migration");
                                }
                            }["AdminSidebar.useMemo[navigationItems]"]
                        },
                        {
                            id: "refreshes",
                            label: "Refreshes",
                            onClick: {
                                "AdminSidebar.useMemo[navigationItems]": ()=>{
                                    setActiveItemId("system");
                                    router.push("/refreshes");
                                }
                            }["AdminSidebar.useMemo[navigationItems]"]
                        }
                    ]
                },
                {
                    id: "reports",
                    label: "Reports",
                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$DocumentIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DocumentIcon"], {
                        width: "20",
                        height: "20"
                    }, void 0, false, {
                        fileName: "[project]/src/components/AdminSidebar.tsx",
                        lineNumber: 239,
                        columnNumber: 13
                    }, this),
                    onClick: {
                        "AdminSidebar.useMemo[navigationItems]": ()=>{
                            setActiveItemId("reports");
                            router.push("/reports");
                        }
                    }["AdminSidebar.useMemo[navigationItems]"]
                },
                {
                    id: "profile",
                    label: "Profile",
                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$UserIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserIcon"], {
                        width: "20",
                        height: "20"
                    }, void 0, false, {
                        fileName: "[project]/src/components/AdminSidebar.tsx",
                        lineNumber: 248,
                        columnNumber: 13
                    }, this),
                    onClick: {
                        "AdminSidebar.useMemo[navigationItems]": ()=>{
                            setActiveItemId("profile");
                            router.push("/profile");
                        }
                    }["AdminSidebar.useMemo[navigationItems]"]
                }
            ]
    }["AdminSidebar.useMemo[navigationItems]"], [
        router
    ]);
    const helpCentreItem = {
        id: "help-centre",
        label: "Help Centre",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$HelpIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HelpIcon"], {
            width: "20",
            height: "20"
        }, void 0, false, {
            fileName: "[project]/src/components/AdminSidebar.tsx",
            lineNumber: 259,
            columnNumber: 11
        }, this),
        onClick: ()=>{
            console.log("Help Centre");
        // Add help centre navigation if needed
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
        position: "fixed",
        left: "0",
        top: "0",
        height: "100vh",
        width: condensed ? "72px" : "280px",
        borderRight: "1px solid",
        borderColor: "rgba(55, 58, 54, 0.15)",
        zIndex: "1000",
        className: "sidebar-wrapper",
        bg: "#F9FAFB",
        overflowY: "auto",
        transition: "width 0.3s ease",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$PortalNavigationSidebar$2f$PortalNavigationSidebar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PortalNavigationSidebar"], {
            navigationItems: navigationItems,
            helpCentreItem: helpCentreItem,
            ...{
                activeItemId
            },
            condensed: condensed,
            onToggleCollapse: setCondensed,
            onLogoClick: ()=>{
                setActiveItemId("dashboard");
                router.push("/dashboard");
            },
            expandedWidth: "280px",
            condensedWidth: "72px"
        }, void 0, false, {
            fileName: "[project]/src/components/AdminSidebar.tsx",
            lineNumber: 281,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/AdminSidebar.tsx",
        lineNumber: 267,
        columnNumber: 5
    }, this);
}
_s(AdminSidebar, "96kUPpnlMkZIlCO7O/5APGzEV+0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$SidebarContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSidebar"]
    ];
});
_c = AdminSidebar;
var _c;
__turbopack_context__.k.register(_c, "AdminSidebar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/PortalHeader.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PortalHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/react.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruImports$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/mukuruImports.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$ProfileMenu$2f$ProfileMenu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/ProfileMenu/ProfileMenu.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/IconWrapper/IconWrapper.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/box/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/h-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/flex/flex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/button/button.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fi/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$SidebarContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/SidebarContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
function PortalHeader() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { data: session } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSession"])();
    const { condensed, setCondensed } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$SidebarContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSidebar"])();
    const userName = session?.user?.name || "Admin";
    const userEmail = session?.user?.email || "admin@mukuru.com";
    // Extract first name for greeting (lowercase as shown in screenshot)
    const firstName = userName.split(" ")[0]?.toLowerCase() || "admin";
    // Calculate left offset based on sidebar state
    const sidebarWidth = condensed ? "72px" : "280px";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
        position: "fixed",
        top: "0",
        left: sidebarWidth,
        right: "0",
        height: "90px",
        bg: "white",
        zIndex: "999",
        px: "6",
        py: "4",
        pl: "6",
        transition: "left 0.3s ease, width 0.3s ease",
        className: "portal-header",
        borderBottom: "1px solid",
        borderColor: "rgba(55, 58, 54, 0.15)",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
            justify: "space-between",
            align: "center",
            width: "full",
            height: "full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                    gap: "4",
                    align: "center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        variant: "ghost",
                        onClick: ()=>setCondensed(!condensed),
                        p: "2",
                        borderRadius: "full",
                        minW: "40px",
                        h: "40px",
                        bg: "gray.100",
                        _hover: {
                            bg: "gray.200"
                        },
                        "aria-label": "Toggle sidebar",
                        border: "none",
                        _focus: {
                            boxShadow: "none",
                            outline: "none"
                        },
                        _active: {
                            bg: "gray.200"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiArrowLeft"], {
                                size: 20,
                                color: "#F05423"
                            }, void 0, false, {
                                fileName: "[project]/src/components/PortalHeader.tsx",
                                lineNumber: 59,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/PortalHeader.tsx",
                            lineNumber: 58,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/PortalHeader.tsx",
                        lineNumber: 44,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/PortalHeader.tsx",
                    lineNumber: 42,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                    gap: "4",
                    align: "center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$ProfileMenu$2f$ProfileMenu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProfileMenu"], {
                        user: userName,
                        menuItems: [
                            {
                                id: 0,
                                label: userEmail,
                                value: "email"
                            },
                            {
                                id: 1,
                                label: "My Profile",
                                value: "profile",
                                onSelect: ()=>router.push("/profile")
                            },
                            {
                                id: 2,
                                label: "Settings",
                                value: "settings",
                                onSelect: ()=>router.push("/settings")
                            },
                            {
                                id: 3,
                                label: "Log Out",
                                value: "logout",
                                onSelect: ()=>router.push("/api/auth/logout")
                            }
                        ]
                    }, void 0, false, {
                        fileName: "[project]/src/components/PortalHeader.tsx",
                        lineNumber: 66,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/PortalHeader.tsx",
                    lineNumber: 65,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/PortalHeader.tsx",
            lineNumber: 40,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/PortalHeader.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
_s(PortalHeader, "FE6OaI7DRZU+Hz34bE3UEKaxdsA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSession"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$SidebarContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSidebar"]
    ];
});
_c = PortalHeader;
var _c;
__turbopack_context__.k.register(_c, "PortalHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/logger.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Centralized logging utility
 * Replaces console.log/warn/error with proper logging that can be controlled
 * and integrated with Sentry in production
 */ __turbopack_context__.s([
    "Logger",
    ()=>Logger,
    "logger",
    ()=>logger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/sentry.ts [app-client] (ecmascript)");
;
class Logger {
    isDevelopment = ("TURBOPACK compile-time value", "development") === 'development';
    isProduction = ("TURBOPACK compile-time value", "development") === 'production';
    /**
   * Log debug messages (only in development)
   */ debug(message, ...args) {
        if (this.isDevelopment) {
            // eslint-disable-next-line no-console
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
    /**
   * Log info messages
   */ info(message, ...args) {
        if (this.isDevelopment) {
            // eslint-disable-next-line no-console
            console.info(`[INFO] ${message}`, ...args);
        }
        // Add breadcrumb in production for debugging
        if (this.isProduction) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addBreadcrumb"])(message, 'info', 'info', {
                args
            });
        }
    }
    /**
   * Log warning messages
   */ warn(message, options) {
        // eslint-disable-next-line no-console
        console.warn(`[WARN] ${message}`);
        // Report to Sentry in production
        if (this.isProduction) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reportWarning"])(message, {
                tags: options?.tags,
                extra: options?.extra
            });
        }
    }
    /**
   * Log error messages
   */ error(error, message, options) {
        const errorMessage = message || (error instanceof Error ? error.message : String(error));
        // eslint-disable-next-line no-console
        console.error(`[ERROR] ${errorMessage}`, error);
        // Report to Sentry
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reportError"])(error, {
            tags: options?.tags,
            extra: options?.extra,
            level: options?.level || 'error'
        });
    }
    /**
   * Log with context (replaces console.log with structured logging)
   */ log(message, context, level = 'info') {
        if (this.isDevelopment) {
            // eslint-disable-next-line no-console
            console.log(`[${level.toUpperCase()}] ${message}`, context || '');
        }
        // Add breadcrumb in production
        if (this.isProduction && level !== 'debug') {
            const sentryLevel = level === 'warn' ? 'warning' : level === 'error' ? 'error' : 'info';
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sentry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addBreadcrumb"])(message, 'log', sentryLevel, context);
        }
    }
}
const logger = new Logger();
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/work-queue/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WorkQueuePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/box/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/v-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/h-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/simple-grid/simple-grid.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/flex/flex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$container$2f$container$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/container/container.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$textarea$2f$textarea$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/textarea/textarea.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$field$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Field$3e$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/field/namespace.js [app-client] (ecmascript) <export * as Field>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/avatar/namespace.js [app-client] (ecmascript) <export * as Avatar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruImports$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/mukuruImports.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Typography/Typography.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Card/Card.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Button/Button.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Search$2f$Search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Search/Search.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$AlertBar$2f$AlertBar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/AlertBar/AlertBar.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tag$2f$Tag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Tag/Tag.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$DataTable$2f$DataTable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/DataTable/DataTable.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/IconWrapper/IconWrapper.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruComponentWrappers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mukuruComponentWrappers.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Modal/Modal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Checkbox$2f$Checkbox$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Checkbox/Checkbox.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Icons/ChevronRightIcon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Tooltip/Tooltip.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$DeleteIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@mukuru/mukuru-react-components/dist/components/ui/Icons/DeleteIcon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AdminSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/AdminSidebar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PortalHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/PortalHeader.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$SidebarContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/SidebarContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fi/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/react.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/logger.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
function WorkQueuePage() {
    _s();
    const { data: session } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSession"])();
    const { condensed } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$SidebarContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSidebar"])();
    const [viewType, setViewType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('all');
    const [statusFilter, setStatusFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('ALL');
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [applications, setApplications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false); // Start as false - DataTable manages its own loading
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [stats, setStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        total: 0,
        submitted: 0,
        inProgress: 0,
        riskReview: 0,
        complete: 0,
        declined: 0
    });
    // Modal states
    const [assignModalOpen, setAssignModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [selectedApp, setSelectedApp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [assignToSelf, setAssignToSelf] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [assignToUserId, setAssignToUserId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [assignToUserName, setAssignToUserName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [actionModalOpen, setActionModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [actionType, setActionType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [actionNotes, setActionNotes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [declineReason, setDeclineReason] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [commentsModalOpen, setCommentsModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [historyModalOpen, setHistoryModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [comments, setComments] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [history, setHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [newComment, setNewComment] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [sortConfig, setSortConfig] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [refreshKey, setRefreshKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    // Toast notifications - using AlertBar for now (can be enhanced later)
    const [toast, setToast] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const showToast = (title, description, type = 'info', duration = 5000)=>{
        setToast({
            title,
            description,
            type
        });
        setTimeout(()=>setToast(null), duration);
    };
    // Get current user info - memoize to prevent recreation on every render
    const currentUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "WorkQueuePage.useMemo[currentUser]": ()=>({
                id: session?.user?.email || '',
                name: session?.user?.name || 'Admin',
                email: session?.user?.email || ''
            })
    }["WorkQueuePage.useMemo[currentUser]"], [
        session?.user?.email,
        session?.user?.name
    ]);
    // Removed loadApplications - DataTable handles data fetching via fetchData
    // Handler for search changes - Search component handles debouncing internally (500ms)
    // Note: DataTable handles data fetching via fetchData, so we just update the search term
    const handleSearchChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WorkQueuePage.useCallback[handleSearchChange]": (query)=>{
            setSearchTerm(query);
        // DataTable will automatically refetch when key changes
        }
    }["WorkQueuePage.useCallback[handleSearchChange]"], []);
    const handleExport = async ()=>{
        try {
            const blob = await workQueueApi.exportWorkItems({
                searchTerm: searchTerm || undefined,
                status: statusFilter !== 'ALL' ? statusFilter : undefined
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `work-queue-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('Export successful', 'Work queue data has been exported to CSV', 'success', 3000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to export work queue';
            showToast('Export failed', errorMessage, 'error', 5000);
        }
    };
    const openAssignModal = (app)=>{
        setSelectedApp(app);
        setAssignToSelf(true);
        setAssignToUserId("");
        setAssignToUserName("");
        setAssignModalOpen(true);
    };
    const handleAssign = async ()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] handleAssign called', {
            selectedApp,
            assignToSelf
        });
        if (!selectedApp) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error(new Error('No selected app'), '[WorkQueue] No selected app');
            showToast('Assignment failed', 'No work item selected', 'error', 3000);
            return;
        }
        // Prevent assignment of completed or declined work items
        // Check both frontend status and backend status for reliability
        const isCompleted = selectedApp.status === 'COMPLETE' || selectedApp.status === 'DECLINED' || selectedApp.backendStatus === 'Completed' || selectedApp.backendStatus === 'Declined' || selectedApp.backendStatus === 'Cancelled';
        if (isCompleted) {
            showToast('Assignment not allowed', 'Cannot assign a work item that is already completed or declined.', 'error', 5000);
            setAssignModalOpen(false);
            return;
        }
        try {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] Starting assignment process');
            // For "assign to self", we need to get the user ID from the JWT token (sub claim)
            // This matches what the backend uses for "My Items" queries
            let userId;
            let userName;
            if (assignToSelf) {
                // Get the JWT token's "sub" claim from the session
                // The backend uses this for "My Items" queries, so we need to match it
                try {
                    const sessionResponse = await fetch('/api/auth/session');
                    const sessionData = await sessionResponse.json();
                    // Try to decode the JWT token to get the "sub" claim
                    // If we can't get it, fall back to email-based GUID (for backwards compatibility)
                    if (sessionData?.accessToken) {
                        try {
                            // Decode JWT token (base64url decode the payload)
                            const tokenParts = sessionData.accessToken.split('.');
                            if (tokenParts.length === 3) {
                                const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
                                if (payload.sub) {
                                    userId = payload.sub;
                                    userName = currentUser.name;
                                } else {
                                    // Fallback to email-based GUID
                                    userId = currentUser.id;
                                    userName = currentUser.name;
                                }
                            } else {
                                userId = currentUser.id;
                                userName = currentUser.name;
                            }
                        } catch  {
                            // If JWT decode fails, use email-based GUID
                            userId = currentUser.id;
                            userName = currentUser.name;
                        }
                    } else {
                        userId = currentUser.id;
                        userName = currentUser.name;
                    }
                } catch  {
                    // If session fetch fails, use email-based GUID
                    userId = currentUser.id;
                    userName = currentUser.name;
                }
            } else {
                userId = assignToUserId;
                userName = assignToUserName;
            }
            if (!userId || !userName) {
                showToast('Assignment failed', 'Please select an assignee', 'error', 3000);
                return;
            }
            // Use workItemId (GUID) for API calls
            const workItemId = selectedApp.workItemId || selectedApp.id;
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] Calling assignWorkItem API', {
                workItemId,
                userId,
                userName,
                selectedAppWorkItemId: selectedApp.workItemId,
                selectedAppId: selectedApp.id,
                isWorkItemIdGuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workItemId)
            });
            // Validate that workItemId is a GUID
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workItemId)) {
                throw new Error(`Invalid work item ID format: ${workItemId}. Expected a GUID.`);
            }
            await workQueueApi.assignWorkItem(workItemId, userId, userName);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('[WorkQueue] Assignment API call successful');
            showToast('Assignment successful', `Work item assigned to ${userName}`, 'success', 3000);
            // If assigning to self, offer to start review
            if (assignToSelf) {
                const startReview = window.confirm(`You've assigned this application to yourself. Would you like to start reviewing it now?`);
                if (startReview) {
                    await handleStartReview(selectedApp.id);
                }
            }
            setAssignModalOpen(false);
            // Trigger DataTable refresh
            setRefreshKey((prev)=>prev + 1);
            calculateStats();
        } catch (err) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error(err, '[WorkQueue] Assignment error');
            let errorMessage = err instanceof Error ? err.message : 'Failed to assign work item';
            // Provide user-friendly error messages
            if (errorMessage.includes('Cannot assign completed work item') || errorMessage.includes('completed work item')) {
                errorMessage = 'Cannot assign a work item that is already completed.';
            } else if (errorMessage.includes('Cannot assign declined work item') || errorMessage.includes('declined work item')) {
                errorMessage = 'Cannot assign a work item that has been declined.';
            }
            showToast('Assignment failed', errorMessage, 'error', 5000);
        }
    };
    const handleUnassign = async (appId)=>{
        try {
            // Find the application to get the actual workItemId (GUID)
            const app = applications.find((a)=>a.id === appId || a.workItemId === appId);
            const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
            await workQueueApi.unassignWorkItem(workItemId);
            showToast('Unassigned successfully', 'Work item has been unassigned', 'success', 3000);
            // Trigger DataTable refresh
            setRefreshKey((prev)=>prev + 1);
            calculateStats();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to unassign work item';
            showToast('Unassign failed', errorMessage, 'error', 5000);
        }
    };
    const handleStartReview = async (appId)=>{
        try {
            // Find the application to get the actual workItemId (GUID)
            const app = applications.find((a)=>a.id === appId || a.workItemId === appId);
            const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
            // Check if review is already started (status is InProgress)
            // Backend only allows start-review when status is "Assigned"
            const isAlreadyInProgress = app?.backendStatus === 'InProgress' || app?.status === 'IN PROGRESS';
            // Only call start-review API if status is "Assigned"
            // If already "InProgress", just navigate to review page
            if (app?.backendStatus === 'Assigned') {
                // Start the review - this will change status from "Assigned" to "InProgress"
                await workQueueApi.startReview(workItemId);
                showToast('Review started', 'Redirecting to review page...', 'success', 2000);
            } else if (isAlreadyInProgress) {
                // Already in progress, just navigate (don't call API)
                showToast('Opening review', 'Redirecting to review page...', 'info', 1500);
            } else {
                // Status is neither Assigned nor InProgress - show error
                showToast('Cannot start review', `Work item must be in "Assigned" status to start review. Current status: ${app?.backendStatus || app?.status}`, 'error', 5000);
                return; // Don't navigate
            }
            // Navigate to review page after a short delay
            setTimeout(()=>{
                window.location.href = `/review/${workItemId}`;
            }, 500);
        } catch (err) {
            // Extract error message from API response
            let errorMessage = 'Failed to start review';
            if (err instanceof Error) {
                errorMessage = err.message;
                // Try to extract more details from error response
                try {
                    const errorData = JSON.parse(err.message);
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch  {
                // Not JSON, use the message as is
                }
            }
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error(err, '[WorkQueue] Error starting review');
            showToast('Failed to start review', errorMessage, 'error', 5000);
        }
    };
    const openActionModal = (app, type)=>{
        setSelectedApp(app);
        setActionType(type);
        setActionNotes("");
        setDeclineReason("");
        setActionModalOpen(true);
    };
    const handleAction = async ()=>{
        if (!selectedApp || !actionType) return;
        try {
            // Use workItemId (GUID) for API calls
            const workItemId = selectedApp.workItemId || selectedApp.id;
            switch(actionType){
                case 'start-review':
                    await workQueueApi.startReview(workItemId);
                    break;
                case 'approve':
                    await workQueueApi.approveWorkItem(workItemId, actionNotes);
                    break;
                case 'decline':
                    if (!declineReason.trim()) {
                        showToast('Decline failed', 'Please provide a reason for declining', 'error', 3000);
                        return;
                    }
                    await workQueueApi.declineWorkItem(workItemId, declineReason);
                    break;
                case 'complete':
                    await workQueueApi.completeWorkItem(workItemId, actionNotes);
                    break;
            }
            showToast('Action successful', `${actionType.replace('-', ' ')} completed successfully`, 'success', 3000);
            setActionModalOpen(false);
            // Trigger DataTable refresh
            setRefreshKey((prev)=>prev + 1);
            calculateStats();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to ${actionType}`;
            showToast('Action failed', errorMessage, 'error', 5000);
        }
    };
    const handleSubmitForApproval = async (appId, notes)=>{
        try {
            // Find the application to get the actual workItemId (GUID)
            const app = applications.find((a)=>a.id === appId || a.workItemId === appId);
            const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
            await workQueueApi.submitForApproval(workItemId, notes);
            showToast('Submitted for approval', 'Work item has been submitted for approval', 'success', 3000);
            // Trigger DataTable refresh
            setRefreshKey((prev)=>prev + 1);
            calculateStats();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to submit for approval';
            showToast('Submission failed', errorMessage, 'error', 5000);
        }
    };
    const handleMarkForRefresh = async (appId)=>{
        try {
            // Find the application to get the actual workItemId (GUID)
            const app = applications.find((a)=>a.id === appId || a.workItemId === appId);
            const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
            await workQueueApi.markForRefresh(workItemId);
            showToast('Marked for refresh', 'Work item has been marked for refresh', 'success', 3000);
            // Trigger DataTable refresh
            setRefreshKey((prev)=>prev + 1);
            calculateStats();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to mark for refresh';
            showToast('Failed', errorMessage, 'error', 5000);
        }
    };
    const loadComments = async (appId)=>{
        try {
            // Find the application to get the actual workItemId (GUID)
            const app = applications.find((a)=>a.id === appId || a.workItemId === appId);
            const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
            const commentsData = await workQueueApi.getWorkItemComments(workItemId);
            setComments(commentsData);
        } catch (err) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error(err, 'Error loading comments');
            setComments([]);
        }
    };
    const loadHistory = async (appId)=>{
        try {
            // Find the application to get the actual workItemId (GUID)
            const app = applications.find((a)=>a.id === appId || a.workItemId === appId);
            const workItemId = app?.workItemId || appId; // Use workItemId if available, fallback to appId
            const historyData = await workQueueApi.getWorkItemHistory(workItemId);
            setHistory(historyData);
        } catch (err) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error(err, 'Error loading history');
            setHistory([]);
        }
    };
    const handleAddComment = async ()=>{
        if (!selectedApp || !newComment.trim()) return;
        try {
            // Use workItemId (GUID) for API calls
            const workItemId = selectedApp.workItemId || selectedApp.id;
            await workQueueApi.addComment(workItemId, newComment);
            showToast('Comment added', 'Your comment has been added', 'success', 3000);
            setNewComment("");
            loadComments(workItemId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
            showToast('Failed to add comment', errorMessage, 'error', 5000);
        }
    };
    const openCommentsModal = async (app)=>{
        setSelectedApp(app);
        setCommentsModalOpen(true);
        await loadComments(app.id);
    };
    const openHistoryModal = async (app)=>{
        setSelectedApp(app);
        setHistoryModalOpen(true);
        await loadHistory(app.id);
    };
    const getStatusBgColor = (status)=>{
        switch(status){
            case 'SUBMITTED':
                return 'blue.500';
            case 'IN PROGRESS':
                return 'orange.500';
            case 'RISK REVIEW':
                return 'red.500';
            case 'COMPLETE':
                return 'green.500';
            case 'INCOMPLETE':
                return 'purple.500';
            case 'DECLINED':
                return 'red.500';
            default:
                return 'gray.500';
        }
    };
    const getPriorityColor = (priority)=>{
        switch(priority?.toLowerCase()){
            case 'low':
                return 'green';
            case 'medium':
                return 'yellow';
            case 'high':
                return 'orange';
            case 'urgent':
                return 'red';
            default:
                return 'gray';
        }
    };
    const getRiskColor = (riskLevel)=>{
        switch(riskLevel?.toLowerCase()){
            case 'low':
                return 'green';
            case 'medium':
                return 'yellow';
            case 'high':
                return 'orange';
            case 'critical':
                return 'red';
            default:
                return 'gray';
        }
    };
    const filteredApplications = applications;
    // Stats calculation - memoized to avoid recalculating on every render
    const calculateStats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WorkQueuePage.useCallback[calculateStats]": async ()=>{
            try {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] Calculating stats...');
                const allResult = await workQueueApi.getWorkItems({
                    pageSize: 1000
                });
                setStats({
                    total: allResult.total,
                    submitted: allResult.data.filter({
                        "WorkQueuePage.useCallback[calculateStats]": (app)=>app.status === 'SUBMITTED'
                    }["WorkQueuePage.useCallback[calculateStats]"]).length,
                    inProgress: allResult.data.filter({
                        "WorkQueuePage.useCallback[calculateStats]": (app)=>app.status === 'IN PROGRESS'
                    }["WorkQueuePage.useCallback[calculateStats]"]).length,
                    riskReview: allResult.data.filter({
                        "WorkQueuePage.useCallback[calculateStats]": (app)=>app.status === 'RISK REVIEW'
                    }["WorkQueuePage.useCallback[calculateStats]"]).length,
                    complete: allResult.data.filter({
                        "WorkQueuePage.useCallback[calculateStats]": (app)=>app.status === 'COMPLETE'
                    }["WorkQueuePage.useCallback[calculateStats]"]).length,
                    declined: allResult.data.filter({
                        "WorkQueuePage.useCallback[calculateStats]": (app)=>app.status === 'DECLINED'
                    }["WorkQueuePage.useCallback[calculateStats]"]).length
                });
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] Stats calculated', {
                    total: allResult.total
                });
            } catch (err) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error(err, '[WorkQueue] Error calculating stats');
            // Don't show error toast for stats - it's not critical
            }
        }
    }["WorkQueuePage.useCallback[calculateStats]"], []);
    // Load stats on mount and when viewType changes (debounced to avoid rapid calls)
    const statsTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WorkQueuePage.useEffect": ()=>{
            if (statsTimeoutRef.current) {
                clearTimeout(statsTimeoutRef.current);
            }
            statsTimeoutRef.current = setTimeout({
                "WorkQueuePage.useEffect": ()=>{
                    calculateStats();
                }
            }["WorkQueuePage.useEffect"], 500); // Debounce stats calculation
            return ({
                "WorkQueuePage.useEffect": ()=>{
                    if (statsTimeoutRef.current) {
                        clearTimeout(statsTimeoutRef.current);
                    }
                }
            })["WorkQueuePage.useEffect"];
        }
    }["WorkQueuePage.useEffect"], [
        calculateStats,
        viewType
    ]);
    // Async mode fetchData function for DataTable
    // Use useCallback to memoize and include viewType and statusFilter in dependencies
    const fetchData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WorkQueuePage.useCallback[fetchData]": async (params)=>{
            try {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] fetchData started');
                setLoading(true);
                setError(null);
                const search = params.search || searchTerm || '';
                const statusParam = params.status;
                const status = Array.isArray(statusParam) ? statusParam[0] : statusParam;
                // Use statusFilter from state if not provided in params, or if statusFilter is set
                const effectiveStatus = status || (statusFilter !== 'ALL' ? statusFilter : undefined);
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] fetchData called', {
                    viewType,
                    effectiveStatus,
                    search,
                    params
                });
                let result;
                if (viewType === 'my-items') {
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] Fetching my items...');
                    result = await workQueueApi.getMyWorkItems(1, 1000);
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] My items result', {
                        count: result.data.length,
                        total: result.total
                    });
                    if (result.data.length === 0) {
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] No items from getMyWorkItems, trying fallback filter');
                        const allResult = await workQueueApi.getWorkItems({
                            pageSize: 1000
                        });
                        const filtered = allResult.data.filter({
                            "WorkQueuePage.useCallback[fetchData].filtered": (app)=>{
                                const matchesId = app.assignedTo === currentUser.id || app.assignedTo === currentUser.email || app.assignedTo?.toLowerCase() === currentUser.email?.toLowerCase();
                                const matchesName = app.assignedToName === currentUser.name || app.assignedToName?.toLowerCase() === currentUser.name?.toLowerCase();
                                return matchesId || matchesName;
                            }
                        }["WorkQueuePage.useCallback[fetchData].filtered"]);
                        result = {
                            data: filtered,
                            total: filtered.length
                        };
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] Fallback filter found', {
                            count: filtered.length
                        });
                    }
                } else if (viewType === 'pending-approvals') {
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] Fetching pending approvals...');
                    const pendingResult = await workQueueApi.getPendingApprovals(1, 1000);
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] Pending approvals result', {
                        count: pendingResult.data.length,
                        total: pendingResult.total
                    });
                    return pendingResult.data.map(mapWorkItemToApplication);
                } else {
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] Fetching all items...', {
                        search,
                        effectiveStatus
                    });
                    result = await workQueueApi.getWorkItems({
                        searchTerm: search || undefined,
                        status: effectiveStatus,
                        pageSize: 1000
                    });
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] All items result', {
                        count: result.data.length,
                        total: result.total
                    });
                }
                // Update applications state for compatibility
                setApplications(result.data);
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].debug('[WorkQueue] fetchData completed successfully', {
                    count: result.data.length
                });
                return result.data;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load work queue items';
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error(err, '[WorkQueue] Error in fetchData', {
                    tags: {
                        error_type: 'fetch_data'
                    },
                    extra: {
                        message: err instanceof Error ? err.message : String(err),
                        stack: err instanceof Error ? err.stack : undefined,
                        viewType,
                        statusFilter,
                        searchTerm
                    }
                });
                setError(errorMessage);
                setToast({
                    title: 'Error loading work queue',
                    description: errorMessage,
                    type: 'error'
                });
                setTimeout({
                    "WorkQueuePage.useCallback[fetchData]": ()=>setToast(null)
                }["WorkQueuePage.useCallback[fetchData]"], 5000);
                return [];
            } finally{
                setLoading(false);
            }
        }
    }["WorkQueuePage.useCallback[fetchData]"], [
        viewType,
        statusFilter,
        currentUser,
        searchTerm
    ]);
    const handleSortChange = (field, direction)=>{
        setSortConfig({
            field,
            direction
        });
    };
    // Removed early loading return - DataTable handles its own loading state
    // Prepare DataTable columns
    const columns = [
        {
            field: 'workItemNumber',
            header: 'Work Item #',
            sortable: true,
            width: '90px',
            minWidth: '90px',
            render: (value, row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                    fontSize: "sm",
                    fontWeight: "semibold",
                    color: "gray.900",
                    children: row.workItemNumber || row.id.substring(0, 8)
                }, void 0, false, {
                    fileName: "[project]/src/app/work-queue/page.tsx",
                    lineNumber: 688,
                    columnNumber: 9
                }, this)
        },
        {
            field: 'legalName',
            header: 'Applicant Name',
            sortable: true,
            width: '150px',
            minWidth: '150px',
            render: (value)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                    fontSize: "sm",
                    color: "gray.800",
                    fontWeight: "medium",
                    style: {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    },
                    children: value || 'N/A'
                }, void 0, false, {
                    fileName: "[project]/src/app/work-queue/page.tsx",
                    lineNumber: 700,
                    columnNumber: 9
                }, this)
        },
        {
            field: 'entityType',
            header: 'Entity Type',
            sortable: true,
            width: '100px',
            minWidth: '100px',
            render: (value)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                    fontSize: "sm",
                    color: "gray.700",
                    style: {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    },
                    children: value || 'N/A'
                }, void 0, false, {
                    fileName: "[project]/src/app/work-queue/page.tsx",
                    lineNumber: 712,
                    columnNumber: 9
                }, this)
        },
        {
            field: 'country',
            header: 'Country',
            sortable: true,
            width: '80px',
            minWidth: '80px',
            render: (value)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                    fontSize: "sm",
                    color: "gray.700",
                    children: value || 'N/A'
                }, void 0, false, {
                    fileName: "[project]/src/app/work-queue/page.tsx",
                    lineNumber: 724,
                    columnNumber: 9
                }, this)
        },
        {
            field: 'status',
            header: 'Status',
            sortable: true,
            width: '110px',
            minWidth: '110px',
            render: (value)=>{
                const status = value;
                const statusVariantMap = {
                    'SUBMITTED': 'info',
                    'IN PROGRESS': 'warning',
                    'RISK REVIEW': 'warning',
                    'COMPLETE': 'success',
                    'DECLINED': 'inactive'
                };
                const variant = statusVariantMap[status] || 'info';
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tag$2f$Tag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tag"], {
                    variant: variant,
                    size: "md",
                    appearance: "transparent",
                    children: status
                }, void 0, false, {
                    fileName: "[project]/src/app/work-queue/page.tsx",
                    lineNumber: 746,
                    columnNumber: 11
                }, this);
            }
        },
        {
            field: 'assignedToName',
            header: 'Assigned To',
            sortable: true,
            width: '120px',
            minWidth: '120px',
            render: (value, row)=>{
                const assignedTo = value || row.assignedTo || "Unassigned";
                const isAssigned = assignedTo !== "Unassigned";
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                    gap: "2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            w: "6",
                            h: "6",
                            borderRadius: "full",
                            bg: isAssigned ? "orange.200" : "gray.200",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiUser"], {
                                    size: 12,
                                    color: isAssigned ? "#DD6B20" : "#9CA3AF"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 774,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/work-queue/page.tsx",
                                lineNumber: 773,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 763,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                            fontSize: "sm",
                            color: isAssigned ? "gray.800" : "gray.500",
                            fontWeight: isAssigned ? "medium" : "normal",
                            fontStyle: !isAssigned ? "italic" : "normal",
                            style: {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            },
                            children: assignedTo
                        }, void 0, false, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 777,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/work-queue/page.tsx",
                    lineNumber: 762,
                    columnNumber: 11
                }, this);
            }
        },
        {
            field: 'priority',
            header: 'Priority',
            sortable: true,
            width: '90px',
            minWidth: '90px',
            render: (value)=>{
                if (!value) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                    fontSize: "sm",
                    color: "gray.500",
                    children: "-"
                }, void 0, false, {
                    fileName: "[project]/src/app/work-queue/page.tsx",
                    lineNumber: 797,
                    columnNumber: 32
                }, this);
                const priority = value.toLowerCase();
                const priorityVariantMap = {
                    'low': 'success',
                    'medium': 'info',
                    'high': 'warning',
                    'urgent': 'warning'
                };
                const variant = priorityVariantMap[priority] || 'info';
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tag$2f$Tag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tag"], {
                    variant: variant,
                    size: "md",
                    appearance: "transparent",
                    children: value
                }, void 0, false, {
                    fileName: "[project]/src/app/work-queue/page.tsx",
                    lineNumber: 807,
                    columnNumber: 15
                }, this);
            }
        },
        {
            field: 'riskLevel',
            header: 'Risk',
            sortable: true,
            width: '80px',
            minWidth: '80px',
            render: (value)=>{
                if (!value) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                    fontSize: "sm",
                    color: "gray.500",
                    children: "-"
                }, void 0, false, {
                    fileName: "[project]/src/app/work-queue/page.tsx",
                    lineNumber: 820,
                    columnNumber: 32
                }, this);
                const risk = value.toLowerCase();
                const riskVariantMap = {
                    'low': 'success',
                    'medium': 'info',
                    'high': 'warning',
                    'critical': 'warning'
                };
                const variant = riskVariantMap[risk] || 'info';
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tag$2f$Tag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tag"], {
                    variant: variant,
                    size: "md",
                    appearance: "transparent",
                    children: value
                }, void 0, false, {
                    fileName: "[project]/src/app/work-queue/page.tsx",
                    lineNumber: 830,
                    columnNumber: 15
                }, this);
            }
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
        minH: "100vh",
        bg: "gray.50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AdminSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/work-queue/page.tsx",
                lineNumber: 840,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PortalHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/work-queue/page.tsx",
                lineNumber: 841,
                columnNumber: 7
            }, this),
            toast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                position: "fixed",
                top: "20px",
                right: "20px",
                zIndex: 10000,
                maxW: "400px",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$AlertBar$2f$AlertBar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertBar"], {
                    status: toast.type,
                    title: toast.title,
                    description: toast.description,
                    onClose: ()=>setToast(null)
                }, void 0, false, {
                    fileName: "[project]/src/app/work-queue/page.tsx",
                    lineNumber: 852,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/work-queue/page.tsx",
                lineNumber: 845,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                flex: "1",
                ml: condensed ? "72px" : "280px",
                mt: "90px",
                minH: "calc(100vh - 90px)",
                width: condensed ? "calc(100% - 72px)" : "calc(100% - 280px)",
                bg: "gray.50",
                overflowX: "hidden",
                transition: "margin-left 0.3s ease, width 0.3s ease",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                        bg: "white",
                        borderBottom: "1px",
                        borderColor: "gray.200",
                        boxShadow: "sm",
                        width: "full",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$container$2f$container$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Container"], {
                            maxW: "100%",
                            px: "8",
                            py: "6",
                            width: "full",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                    justify: "space-between",
                                    align: "center",
                                    mb: "4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                            align: "start",
                                            gap: "2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                    fontSize: "3xl",
                                                    fontWeight: "bold",
                                                    color: "gray.900",
                                                    children: "Work Queue"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 876,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                    fontSize: "md",
                                                    color: "gray.600",
                                                    fontWeight: "normal",
                                                    children: "Manage and track work items across all onboarding cases"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 879,
                                                    columnNumber: 15
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 875,
                                            columnNumber: 13
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                            gap: "3",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "primary",
                                                size: "sm",
                                                onClick: handleExport,
                                                className: "mukuru-primary-button",
                                                style: {
                                                    color: 'white',
                                                    backgroundColor: '#F05423',
                                                    border: 'none',
                                                    borderWidth: 0,
                                                    borderStyle: 'none',
                                                    borderColor: '#F05423',
                                                    outline: 'none',
                                                    outlineWidth: 0,
                                                    boxShadow: 'none',
                                                    WebkitBoxShadow: 'none',
                                                    MozBoxShadow: 'none'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiDownload"], {
                                                            size: 16
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 904,
                                                            columnNumber: 19
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                        lineNumber: 903,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            color: 'white'
                                                        },
                                                        children: "Export"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                        lineNumber: 906,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                lineNumber: 884,
                                                columnNumber: 15
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 883,
                                            columnNumber: 13
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 874,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruComponentWrappers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsRoot"], {
                                    defaultValue: viewType,
                                    onValueChange: (details)=>setViewType(details.value),
                                    variant: "line",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruComponentWrappers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsList"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruComponentWrappers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsTrigger"], {
                                                value: "all",
                                                children: "All Items"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                lineNumber: 914,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruComponentWrappers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsTrigger"], {
                                                value: "my-items",
                                                children: "My Items"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                lineNumber: 915,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruComponentWrappers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsTrigger"], {
                                                value: "pending-approvals",
                                                children: "Pending Approvals"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                lineNumber: 916,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruComponentWrappers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsIndicator"], {
                                                rounded: "l2"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                lineNumber: 917,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                        lineNumber: 913,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 912,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 873,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 872,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                        flex: "1",
                        bg: "gray.50",
                        width: "full",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruComponentWrappers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsRoot"], {
                            defaultValue: viewType,
                            onValueChange: (details)=>setViewType(details.value),
                            variant: "line",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruComponentWrappers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsContent"], {
                                    value: "all",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$container$2f$container$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Container"], {
                                        maxW: "100%",
                                        px: "8",
                                        py: "8",
                                        width: "full",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                            gap: "4",
                                            align: "stretch",
                                            width: "full",
                                            children: [
                                                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$AlertBar$2f$AlertBar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertBar"], {
                                                    status: "error",
                                                    title: "Error loading work queue",
                                                    description: error
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 931,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                    gap: "2",
                                                    wrap: "wrap",
                                                    mb: "2",
                                                    mt: "0",
                                                    pt: "0",
                                                    className: "status-filter-buttons",
                                                    style: {
                                                        border: 'none',
                                                        outline: 'none'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            onClick: ()=>setStatusFilter('ALL'),
                                                            role: "button",
                                                            tabIndex: 0,
                                                            onKeyDown: (e)=>{
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    setStatusFilter('ALL');
                                                                }
                                                            },
                                                            className: `status-filter-btn ${statusFilter === 'ALL' ? "mukuru-primary-button" : "mukuru-secondary-button"}`,
                                                            style: {
                                                                color: 'white',
                                                                background: statusFilter === 'ALL' ? '#F05423' : '#111827',
                                                                backgroundColor: statusFilter === 'ALL' ? '#F05423' : '#111827',
                                                                border: `1px solid ${statusFilter === 'ALL' ? '#F05423' : '#111827'}`,
                                                                borderWidth: '1px',
                                                                borderStyle: 'solid',
                                                                borderColor: statusFilter === 'ALL' ? '#F05423' : '#111827',
                                                                outline: '0',
                                                                outlineWidth: '0',
                                                                outlineStyle: 'none',
                                                                outlineColor: 'transparent',
                                                                boxShadow: 'none',
                                                                borderRadius: '8px',
                                                                padding: '8px 16px',
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                minHeight: '36px',
                                                                margin: 0,
                                                                userSelect: 'none',
                                                                WebkitTapHighlightColor: 'transparent',
                                                                backgroundClip: 'border-box',
                                                                WebkitBackgroundClip: 'border-box'
                                                            },
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    color: 'white'
                                                                },
                                                                children: "All"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                lineNumber: 980,
                                                                columnNumber: 19
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 940,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            onClick: ()=>setStatusFilter('SUBMITTED'),
                                                            role: "button",
                                                            tabIndex: 0,
                                                            onKeyDown: (e)=>{
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    setStatusFilter('SUBMITTED');
                                                                }
                                                            },
                                                            className: `status-filter-btn ${statusFilter === 'SUBMITTED' ? "mukuru-primary-button" : "mukuru-secondary-button"}`,
                                                            style: {
                                                                color: 'white',
                                                                background: statusFilter === 'SUBMITTED' ? '#F05423' : '#111827',
                                                                backgroundColor: statusFilter === 'SUBMITTED' ? '#F05423' : '#111827',
                                                                border: `1px solid ${statusFilter === 'SUBMITTED' ? '#F05423' : '#111827'}`,
                                                                borderWidth: '1px',
                                                                borderStyle: 'solid',
                                                                borderColor: statusFilter === 'SUBMITTED' ? '#F05423' : '#111827',
                                                                outline: '0',
                                                                outlineWidth: '0',
                                                                outlineStyle: 'none',
                                                                outlineColor: 'transparent',
                                                                boxShadow: 'none',
                                                                borderRadius: '8px',
                                                                padding: '8px 16px',
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                minHeight: '36px',
                                                                margin: 0,
                                                                userSelect: 'none',
                                                                WebkitTapHighlightColor: 'transparent',
                                                                backgroundClip: 'border-box',
                                                                WebkitBackgroundClip: 'border-box'
                                                            },
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    color: 'white'
                                                                },
                                                                children: [
                                                                    "Submitted (",
                                                                    stats.submitted,
                                                                    ")"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                lineNumber: 1022,
                                                                columnNumber: 19
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 982,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            onClick: ()=>setStatusFilter('IN PROGRESS'),
                                                            role: "button",
                                                            tabIndex: 0,
                                                            onKeyDown: (e)=>{
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    setStatusFilter('IN PROGRESS');
                                                                }
                                                            },
                                                            className: `status-filter-btn ${statusFilter === 'IN PROGRESS' ? "mukuru-primary-button" : "mukuru-secondary-button"}`,
                                                            style: {
                                                                color: 'white',
                                                                background: statusFilter === 'IN PROGRESS' ? '#F05423' : '#111827',
                                                                backgroundColor: statusFilter === 'IN PROGRESS' ? '#F05423' : '#111827',
                                                                border: `1px solid ${statusFilter === 'IN PROGRESS' ? '#F05423' : '#111827'}`,
                                                                borderWidth: '1px',
                                                                borderStyle: 'solid',
                                                                borderColor: statusFilter === 'IN PROGRESS' ? '#F05423' : '#111827',
                                                                outline: '0',
                                                                outlineWidth: '0',
                                                                outlineStyle: 'none',
                                                                outlineColor: 'transparent',
                                                                boxShadow: 'none',
                                                                borderRadius: '8px',
                                                                padding: '8px 16px',
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                minHeight: '36px',
                                                                margin: 0,
                                                                userSelect: 'none',
                                                                WebkitTapHighlightColor: 'transparent',
                                                                backgroundClip: 'border-box',
                                                                WebkitBackgroundClip: 'border-box'
                                                            },
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    color: 'white'
                                                                },
                                                                children: [
                                                                    "In Progress (",
                                                                    stats.inProgress,
                                                                    ")"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                lineNumber: 1064,
                                                                columnNumber: 19
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1024,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            onClick: ()=>setStatusFilter('RISK REVIEW'),
                                                            role: "button",
                                                            tabIndex: 0,
                                                            onKeyDown: (e)=>{
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    setStatusFilter('RISK REVIEW');
                                                                }
                                                            },
                                                            className: `status-filter-btn ${statusFilter === 'RISK REVIEW' ? "mukuru-primary-button" : "mukuru-secondary-button"}`,
                                                            style: {
                                                                color: 'white',
                                                                background: statusFilter === 'RISK REVIEW' ? '#F05423' : '#111827',
                                                                backgroundColor: statusFilter === 'RISK REVIEW' ? '#F05423' : '#111827',
                                                                border: `1px solid ${statusFilter === 'RISK REVIEW' ? '#F05423' : '#111827'}`,
                                                                borderWidth: '1px',
                                                                borderStyle: 'solid',
                                                                borderColor: statusFilter === 'RISK REVIEW' ? '#F05423' : '#111827',
                                                                outline: '0',
                                                                outlineWidth: '0',
                                                                outlineStyle: 'none',
                                                                outlineColor: 'transparent',
                                                                boxShadow: 'none',
                                                                borderRadius: '8px',
                                                                padding: '8px 16px',
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                minHeight: '36px',
                                                                margin: 0,
                                                                userSelect: 'none',
                                                                WebkitTapHighlightColor: 'transparent',
                                                                backgroundClip: 'border-box',
                                                                WebkitBackgroundClip: 'border-box'
                                                            },
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    color: 'white'
                                                                },
                                                                children: [
                                                                    "Risk Review (",
                                                                    stats.riskReview,
                                                                    ")"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                lineNumber: 1106,
                                                                columnNumber: 19
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1066,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            onClick: ()=>setStatusFilter('COMPLETE'),
                                                            role: "button",
                                                            tabIndex: 0,
                                                            onKeyDown: (e)=>{
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    setStatusFilter('COMPLETE');
                                                                }
                                                            },
                                                            className: `status-filter-btn ${statusFilter === 'COMPLETE' ? "mukuru-primary-button" : "mukuru-secondary-button"}`,
                                                            style: {
                                                                color: 'white',
                                                                background: statusFilter === 'COMPLETE' ? '#F05423' : '#111827',
                                                                backgroundColor: statusFilter === 'COMPLETE' ? '#F05423' : '#111827',
                                                                border: `1px solid ${statusFilter === 'COMPLETE' ? '#F05423' : '#111827'}`,
                                                                borderWidth: '1px',
                                                                borderStyle: 'solid',
                                                                borderColor: statusFilter === 'COMPLETE' ? '#F05423' : '#111827',
                                                                outline: '0',
                                                                outlineWidth: '0',
                                                                outlineStyle: 'none',
                                                                outlineColor: 'transparent',
                                                                boxShadow: 'none',
                                                                borderRadius: '8px',
                                                                padding: '8px 16px',
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                minHeight: '36px',
                                                                margin: 0,
                                                                userSelect: 'none',
                                                                WebkitTapHighlightColor: 'transparent',
                                                                backgroundClip: 'border-box',
                                                                WebkitBackgroundClip: 'border-box'
                                                            },
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    color: 'white'
                                                                },
                                                                children: [
                                                                    "Complete (",
                                                                    stats.complete,
                                                                    ")"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                lineNumber: 1148,
                                                                columnNumber: 19
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1108,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            onClick: ()=>setStatusFilter('DECLINED'),
                                                            role: "button",
                                                            tabIndex: 0,
                                                            onKeyDown: (e)=>{
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    setStatusFilter('DECLINED');
                                                                }
                                                            },
                                                            className: `status-filter-btn ${statusFilter === 'DECLINED' ? "mukuru-primary-button" : "mukuru-secondary-button"}`,
                                                            style: {
                                                                color: 'white',
                                                                background: statusFilter === 'DECLINED' ? '#F05423' : '#111827',
                                                                backgroundColor: statusFilter === 'DECLINED' ? '#F05423' : '#111827',
                                                                border: `1px solid ${statusFilter === 'DECLINED' ? '#F05423' : '#111827'}`,
                                                                borderWidth: '1px',
                                                                borderStyle: 'solid',
                                                                borderColor: statusFilter === 'DECLINED' ? '#F05423' : '#111827',
                                                                outline: '0',
                                                                outlineWidth: '0',
                                                                outlineStyle: 'none',
                                                                outlineColor: 'transparent',
                                                                boxShadow: 'none',
                                                                borderRadius: '8px',
                                                                padding: '8px 16px',
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                minHeight: '36px',
                                                                margin: 0,
                                                                userSelect: 'none',
                                                                WebkitTapHighlightColor: 'transparent',
                                                                backgroundClip: 'border-box',
                                                                WebkitBackgroundClip: 'border-box'
                                                            },
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    color: 'white'
                                                                },
                                                                children: [
                                                                    "Declined (",
                                                                    stats.declined,
                                                                    ")"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                lineNumber: 1190,
                                                                columnNumber: 19
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1150,
                                                            columnNumber: 17
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 939,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SimpleGrid"], {
                                                    columns: {
                                                        base: 2,
                                                        md: 3,
                                                        lg: 6
                                                    },
                                                    gap: "4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            onClick: ()=>setStatusFilter('ALL'),
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "mukuru.orange.100/20",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiTrendingUp"], {
                                                                                            color: "#F05423",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1207,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1206,
                                                                                        columnNumber: 21
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1205,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Total"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1210,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1204,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1215,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1214,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1203,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "gray.800",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.total.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1218,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1196,
                                                            columnNumber: 15
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            onClick: ()=>setStatusFilter('SUBMITTED'),
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "blue.100",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiClock"], {
                                                                                            color: "#3182CE",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1234,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1233,
                                                                                        columnNumber: 21
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1232,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Submitted"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1237,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1231,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1242,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1241,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1230,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "blue.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.submitted.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1245,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1223,
                                                            columnNumber: 15
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            onClick: ()=>setStatusFilter('IN PROGRESS'),
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "mukuru.orange.100/20",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiRefreshCw"], {
                                                                                            color: "#F05423",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1261,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1260,
                                                                                        columnNumber: 21
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1259,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "In Progress"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1264,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1258,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1269,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1268,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1257,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "orange.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.inProgress.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1272,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1250,
                                                            columnNumber: 15
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            onClick: ()=>setStatusFilter('RISK REVIEW'),
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "red.100",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiAlertTriangle"], {
                                                                                            color: "#E53E3E",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1288,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1287,
                                                                                        columnNumber: 21
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1286,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Risk Review"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1291,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1285,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1296,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1295,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1284,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "orange.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.riskReview.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1299,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1277,
                                                            columnNumber: 15
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            onClick: ()=>setStatusFilter('COMPLETE'),
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "green.100",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheckCircle"], {
                                                                                            color: "#38A169",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1315,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1314,
                                                                                        columnNumber: 21
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1313,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Complete"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1318,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1312,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1323,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1322,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1311,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "green.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.complete.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1326,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1304,
                                                            columnNumber: 15
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            onClick: ()=>setStatusFilter('DECLINED'),
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "red.100",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiXCircle"], {
                                                                                            color: "#C53030",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1342,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1341,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1340,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Declined"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1345,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1339,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1350,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1349,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1338,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "red.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.declined.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1353,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1331,
                                                            columnNumber: 15
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 1195,
                                                    columnNumber: 13
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                    bg: "white",
                                                    borderRadius: "xl",
                                                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                                                    border: "1px solid",
                                                    borderColor: "gray.100",
                                                    overflow: "hidden",
                                                    color: "gray.900",
                                                    className: "work-queue-table-wrapper",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$DataTable$2f$DataTable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DataTable"], {
                                                        fetchData: fetchData,
                                                        columns: columns,
                                                        tableId: "work-queue",
                                                        sortConfig: sortConfig ?? undefined,
                                                        onSortChange: handleSortChange,
                                                        showActions: true,
                                                        actionColumn: {
                                                            header: 'Actions',
                                                            width: '120px',
                                                            render: (row, index)=>{
                                                                const app = row;
                                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        display: "flex",
                                                                        gap: "6px",
                                                                        alignItems: "center",
                                                                        justifyContent: "flex-end"
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "View",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                                                href: app.applicationId ? `/applications/${app.applicationId}` : `/applications/${app.id}`,
                                                                                style: {
                                                                                    textDecoration: 'none'
                                                                                },
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                    style: {
                                                                                        background: "none",
                                                                                        border: "none",
                                                                                        padding: "6px",
                                                                                        cursor: "pointer",
                                                                                        color: "#E8590C",
                                                                                        display: "flex",
                                                                                        alignItems: "center",
                                                                                        justifyContent: "center",
                                                                                        minWidth: "28px",
                                                                                        height: "28px"
                                                                                    },
                                                                                    "aria-label": "View",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiEye"], {
                                                                                            size: 14
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1402,
                                                                                            columnNumber: 52
                                                                                        }, void 0)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1402,
                                                                                        columnNumber: 39
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1387,
                                                                                    columnNumber: 37
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1386,
                                                                                columnNumber: 35
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1385,
                                                                            columnNumber: 33
                                                                        }, void 0),
                                                                        app.assignedTo && (app.assignedTo === currentUser.id || app.assignedToName === currentUser.name) && (app.backendStatus === 'Assigned' || app.backendStatus === 'InProgress') && app.status !== 'COMPLETE' && app.status !== 'DECLINED' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "Review",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                style: {
                                                                                    background: "none",
                                                                                    border: "none",
                                                                                    padding: "8px",
                                                                                    cursor: "pointer",
                                                                                    color: "#E8590C",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center"
                                                                                },
                                                                                onClick: ()=>handleStartReview(app.id),
                                                                                "aria-label": "Review",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiPlay"], {
                                                                                        size: 16
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1426,
                                                                                        columnNumber: 52
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1426,
                                                                                    columnNumber: 39
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1412,
                                                                                columnNumber: 37
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1411,
                                                                            columnNumber: 35
                                                                        }, void 0),
                                                                        !app.assignedTo && app.status !== 'COMPLETE' && app.status !== 'DECLINED' && app.backendStatus !== 'Completed' && app.backendStatus !== 'Declined' && app.backendStatus !== 'Cancelled' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "Assign",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                style: {
                                                                                    background: "none",
                                                                                    border: "none",
                                                                                    padding: "8px",
                                                                                    cursor: "pointer",
                                                                                    color: "#E8590C",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center"
                                                                                },
                                                                                onClick: ()=>openAssignModal(app),
                                                                                "aria-label": "Assign",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiUser"], {
                                                                                        size: 16
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1451,
                                                                                        columnNumber: 52
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1451,
                                                                                    columnNumber: 39
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1437,
                                                                                columnNumber: 37
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1436,
                                                                            columnNumber: 35
                                                                        }, void 0),
                                                                        app.status === 'IN PROGRESS' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "Complete",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                style: {
                                                                                    background: "none",
                                                                                    border: "none",
                                                                                    padding: "8px",
                                                                                    cursor: "pointer",
                                                                                    color: "#E8590C",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center"
                                                                                },
                                                                                onClick: ()=>openActionModal(app, 'complete'),
                                                                                "aria-label": "Complete",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheck"], {
                                                                                        size: 16
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1471,
                                                                                        columnNumber: 52
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1471,
                                                                                    columnNumber: 39
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1457,
                                                                                columnNumber: 37
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1456,
                                                                            columnNumber: 35
                                                                        }, void 0),
                                                                        app.status === 'RISK REVIEW' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                                    content: "Approve",
                                                                                    showArrow: true,
                                                                                    variant: "light",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                        style: {
                                                                                            background: "none",
                                                                                            border: "none",
                                                                                            padding: "8px",
                                                                                            cursor: "pointer",
                                                                                            color: "#E8590C",
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            justifyContent: "center"
                                                                                        },
                                                                                        onClick: ()=>openActionModal(app, 'approve'),
                                                                                        "aria-label": "Approve",
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheck"], {
                                                                                                size: 16
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                                lineNumber: 1492,
                                                                                                columnNumber: 54
                                                                                            }, void 0)
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1492,
                                                                                            columnNumber: 41
                                                                                        }, void 0)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1478,
                                                                                        columnNumber: 39
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1477,
                                                                                    columnNumber: 37
                                                                                }, void 0),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                                    content: "Decline",
                                                                                    showArrow: true,
                                                                                    variant: "light",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                        style: {
                                                                                            background: "none",
                                                                                            border: "none",
                                                                                            padding: "8px",
                                                                                            cursor: "pointer",
                                                                                            color: "#E8590C",
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            justifyContent: "center"
                                                                                        },
                                                                                        onClick: ()=>openActionModal(app, 'decline'),
                                                                                        "aria-label": "Decline",
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$DeleteIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DeleteIcon"], {}, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1510,
                                                                                            columnNumber: 41
                                                                                        }, void 0)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1496,
                                                                                        columnNumber: 39
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1495,
                                                                                    columnNumber: 37
                                                                                }, void 0)
                                                                            ]
                                                                        }, void 0, true),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "Mark for Refresh",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                style: {
                                                                                    background: "none",
                                                                                    border: "none",
                                                                                    padding: "8px",
                                                                                    cursor: "pointer",
                                                                                    color: "#E8590C",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center"
                                                                                },
                                                                                onClick: ()=>handleMarkForRefresh(app.id),
                                                                                "aria-label": "Mark for Refresh",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiRefreshCw"], {
                                                                                        size: 16
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1530,
                                                                                        columnNumber: 50
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1530,
                                                                                    columnNumber: 37
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1516,
                                                                                columnNumber: 35
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1515,
                                                                            columnNumber: 33
                                                                        }, void 0)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1384,
                                                                    columnNumber: 31
                                                                }, void 0);
                                                            }
                                                        },
                                                        emptyState: {
                                                            message: "No work queue items found",
                                                            content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                                gap: "4",
                                                                py: "8",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiFile"], {
                                                                            size: 48,
                                                                            color: "#9CA3AF"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1542,
                                                                            columnNumber: 33
                                                                        }, void 0)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                        lineNumber: 1541,
                                                                        columnNumber: 21
                                                                    }, void 0),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                        fontSize: "lg",
                                                                        fontWeight: "semibold",
                                                                        color: "gray.700",
                                                                        children: "No work queue items found"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                        lineNumber: 1544,
                                                                        columnNumber: 31
                                                                    }, void 0),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                        fontSize: "sm",
                                                                        color: "gray.600",
                                                                        textAlign: "center",
                                                                        maxW: "400px",
                                                                        children: error ? `Error loading work queue: ${error}. Please check your connection and try again.` : viewType === 'my-items' ? "You don't have any assigned work items. Work items will appear here once they are assigned to you." : viewType === 'pending-approvals' ? "No items are pending approval. Items requiring approval will appear here." : "Work items are automatically created when onboarding cases are submitted. Submit a new case to see work items here."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                        lineNumber: 1547,
                                                                        columnNumber: 31
                                                                    }, void 0)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                lineNumber: 1540,
                                                                columnNumber: 29
                                                            }, void 0)
                                                        }
                                                    }, `work-queue-${viewType}-${statusFilter}-${searchTerm}-${refreshKey}`, false, {
                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                        lineNumber: 1370,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 1360,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 928,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                        lineNumber: 927,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 926,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruComponentWrappers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsContent"], {
                                    value: "my-items",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$container$2f$container$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Container"], {
                                        maxW: "8xl",
                                        px: "8",
                                        py: "8",
                                        width: "full",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                            gap: "6",
                                            align: "stretch",
                                            width: "full",
                                            children: [
                                                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$AlertBar$2f$AlertBar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertBar"], {
                                                    status: "error",
                                                    title: "Error loading work queue",
                                                    description: error
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 1570,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SimpleGrid"], {
                                                    columns: {
                                                        base: 2,
                                                        md: 3,
                                                        lg: 6
                                                    },
                                                    gap: "4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "mukuru.orange.100/20",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiTrendingUp"], {
                                                                                            color: "#F05423",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1589,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1588,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1587,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Total"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1592,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1586,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1597,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1596,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1585,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "gray.800",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.total.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1600,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1579,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "blue.100",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiClock"], {
                                                                                            color: "#3182CE",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1615,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1614,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1613,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Submitted"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1618,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1612,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1623,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1622,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1611,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "blue.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.submitted.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1626,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1605,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "mukuru.orange.100/20",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiRefreshCw"], {
                                                                                            color: "#F05423",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1641,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1640,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1639,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "In Progress"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1644,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1638,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1649,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1648,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1637,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "orange.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.inProgress.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1652,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1631,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "red.100",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiAlertTriangle"], {
                                                                                            color: "#E53E3E",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1667,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1666,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1665,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Risk Review"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1670,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1664,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1675,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1674,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1663,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "orange.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.riskReview.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1678,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1657,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "green.100",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheckCircle"], {
                                                                                            color: "#38A169",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1693,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1692,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1691,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Complete"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1696,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1690,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1701,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1700,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1689,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "green.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.complete.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1704,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1683,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "red.100",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiXCircle"], {
                                                                                            color: "#C53030",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1719,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1718,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1717,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Declined"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1722,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1716,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1727,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1726,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1715,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "red.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.declined.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1730,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1709,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 1578,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                    mb: "4",
                                                    width: "100%",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                        width: "100%",
                                                        maxW: "800px",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Search$2f$Search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Search"], {
                                                            placeholder: "Search by Name or Email...",
                                                            onSearchChange: handleSearchChange
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1739,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                        lineNumber: 1738,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 1737,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                    bg: "white",
                                                    borderRadius: "xl",
                                                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                                                    border: "1px solid",
                                                    borderColor: "gray.100",
                                                    overflow: "hidden",
                                                    color: "gray.900",
                                                    className: "work-queue-table-wrapper",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$DataTable$2f$DataTable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DataTable"], {
                                                        fetchData: fetchData,
                                                        columns: columns,
                                                        tableId: "work-queue",
                                                        sortConfig: sortConfig ?? undefined,
                                                        onSortChange: handleSortChange,
                                                        showActions: true,
                                                        actionColumn: {
                                                            header: 'Actions',
                                                            width: '120px',
                                                            render: (row, index)=>{
                                                                const app = row;
                                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        display: "flex",
                                                                        gap: "6px",
                                                                        alignItems: "center",
                                                                        justifyContent: "flex-end"
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "View",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                                                href: app.applicationId ? `/applications/${app.applicationId}` : `/applications/${app.id}`,
                                                                                style: {
                                                                                    textDecoration: 'none'
                                                                                },
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                    style: {
                                                                                        background: "none",
                                                                                        border: "none",
                                                                                        padding: "6px",
                                                                                        cursor: "pointer",
                                                                                        color: "#E8590C",
                                                                                        display: "flex",
                                                                                        alignItems: "center",
                                                                                        justifyContent: "center",
                                                                                        minWidth: "28px",
                                                                                        height: "28px"
                                                                                    },
                                                                                    "aria-label": "View",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiEye"], {
                                                                                            size: 14
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1789,
                                                                                            columnNumber: 52
                                                                                        }, void 0)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1789,
                                                                                        columnNumber: 39
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1774,
                                                                                    columnNumber: 37
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1773,
                                                                                columnNumber: 35
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1772,
                                                                            columnNumber: 33
                                                                        }, void 0),
                                                                        app.assignedTo && (app.assignedTo === currentUser.id || app.assignedToName === currentUser.name) && (app.backendStatus === 'Assigned' || app.backendStatus === 'InProgress') && app.status !== 'COMPLETE' && app.status !== 'DECLINED' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "Review",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                style: {
                                                                                    background: "none",
                                                                                    border: "none",
                                                                                    padding: "8px",
                                                                                    cursor: "pointer",
                                                                                    color: "#E8590C",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center"
                                                                                },
                                                                                onClick: ()=>handleStartReview(app.id),
                                                                                "aria-label": "Review",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiPlay"], {
                                                                                        size: 16
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1813,
                                                                                        columnNumber: 52
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1813,
                                                                                    columnNumber: 39
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1799,
                                                                                columnNumber: 37
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1798,
                                                                            columnNumber: 35
                                                                        }, void 0),
                                                                        !app.assignedTo && app.status !== 'COMPLETE' && app.status !== 'DECLINED' && app.backendStatus !== 'Completed' && app.backendStatus !== 'Declined' && app.backendStatus !== 'Cancelled' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "Assign",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                style: {
                                                                                    background: "none",
                                                                                    border: "none",
                                                                                    padding: "8px",
                                                                                    cursor: "pointer",
                                                                                    color: "#E8590C",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center"
                                                                                },
                                                                                onClick: ()=>openAssignModal(app),
                                                                                "aria-label": "Assign",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiUser"], {
                                                                                        size: 16
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1838,
                                                                                        columnNumber: 52
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1838,
                                                                                    columnNumber: 39
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1824,
                                                                                columnNumber: 37
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1823,
                                                                            columnNumber: 35
                                                                        }, void 0),
                                                                        app.status === 'IN PROGRESS' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "Complete",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                style: {
                                                                                    background: "none",
                                                                                    border: "none",
                                                                                    padding: "8px",
                                                                                    cursor: "pointer",
                                                                                    color: "#E8590C",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center"
                                                                                },
                                                                                onClick: ()=>openActionModal(app, 'complete'),
                                                                                "aria-label": "Complete",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheck"], {
                                                                                        size: 16
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1858,
                                                                                        columnNumber: 52
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1858,
                                                                                    columnNumber: 39
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1844,
                                                                                columnNumber: 37
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1843,
                                                                            columnNumber: 35
                                                                        }, void 0),
                                                                        app.status === 'RISK REVIEW' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                                    content: "Approve",
                                                                                    showArrow: true,
                                                                                    variant: "light",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                        style: {
                                                                                            background: "none",
                                                                                            border: "none",
                                                                                            padding: "8px",
                                                                                            cursor: "pointer",
                                                                                            color: "#E8590C",
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            justifyContent: "center"
                                                                                        },
                                                                                        onClick: ()=>openActionModal(app, 'approve'),
                                                                                        "aria-label": "Approve",
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheck"], {
                                                                                                size: 16
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                                lineNumber: 1879,
                                                                                                columnNumber: 54
                                                                                            }, void 0)
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1879,
                                                                                            columnNumber: 41
                                                                                        }, void 0)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1865,
                                                                                        columnNumber: 39
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1864,
                                                                                    columnNumber: 37
                                                                                }, void 0),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                                    content: "Decline",
                                                                                    showArrow: true,
                                                                                    variant: "light",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                        style: {
                                                                                            background: "none",
                                                                                            border: "none",
                                                                                            padding: "8px",
                                                                                            cursor: "pointer",
                                                                                            color: "#E8590C",
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            justifyContent: "center"
                                                                                        },
                                                                                        onClick: ()=>openActionModal(app, 'decline'),
                                                                                        "aria-label": "Decline",
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$DeleteIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DeleteIcon"], {}, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1897,
                                                                                            columnNumber: 41
                                                                                        }, void 0)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1883,
                                                                                        columnNumber: 39
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1882,
                                                                                    columnNumber: 37
                                                                                }, void 0)
                                                                            ]
                                                                        }, void 0, true),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "Mark for Refresh",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                style: {
                                                                                    background: "none",
                                                                                    border: "none",
                                                                                    padding: "8px",
                                                                                    cursor: "pointer",
                                                                                    color: "#E8590C",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center"
                                                                                },
                                                                                onClick: ()=>handleMarkForRefresh(app.id),
                                                                                "aria-label": "Mark for Refresh",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiRefreshCw"], {
                                                                                        size: 16
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1917,
                                                                                        columnNumber: 50
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1917,
                                                                                    columnNumber: 37
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1903,
                                                                                columnNumber: 35
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1902,
                                                                            columnNumber: 33
                                                                        }, void 0)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1771,
                                                                    columnNumber: 31
                                                                }, void 0);
                                                            }
                                                        },
                                                        emptyState: {
                                                            message: "No work queue items found",
                                                            content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                                gap: "4",
                                                                py: "8",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiFile"], {
                                                                            size: 48,
                                                                            color: "#9CA3AF"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1929,
                                                                            columnNumber: 33
                                                                        }, void 0)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                        lineNumber: 1928,
                                                                        columnNumber: 31
                                                                    }, void 0),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                        fontSize: "lg",
                                                                        fontWeight: "semibold",
                                                                        color: "gray.700",
                                                                        children: "No work queue items found"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                        lineNumber: 1931,
                                                                        columnNumber: 31
                                                                    }, void 0),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                        fontSize: "sm",
                                                                        color: "gray.600",
                                                                        textAlign: "center",
                                                                        maxW: "400px",
                                                                        children: "Work items will appear here once they are created"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                        lineNumber: 1934,
                                                                        columnNumber: 31
                                                                    }, void 0)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                lineNumber: 1927,
                                                                columnNumber: 29
                                                            }, void 0)
                                                        }
                                                    }, `work-queue-${viewType}-${statusFilter}-${searchTerm}-${refreshKey}`, false, {
                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                        lineNumber: 1757,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 1747,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 1567,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                        lineNumber: 1566,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 1565,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruComponentWrappers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsContent"], {
                                    value: "pending-approvals",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$container$2f$container$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Container"], {
                                        maxW: "100%",
                                        px: "8",
                                        py: "8",
                                        width: "full",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                            gap: "6",
                                            align: "stretch",
                                            width: "full",
                                            children: [
                                                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$AlertBar$2f$AlertBar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertBar"], {
                                                    status: "error",
                                                    title: "Error loading work queue",
                                                    description: error
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 1951,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SimpleGrid"], {
                                                    columns: {
                                                        base: 2,
                                                        md: 3,
                                                        lg: 6
                                                    },
                                                    gap: "4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "mukuru.orange.100/20",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiTrendingUp"], {
                                                                                            color: "#F05423",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1970,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1969,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1968,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Total"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1973,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1967,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 1978,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1977,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1966,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "gray.800",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.total.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1981,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1960,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "blue.100",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiClock"], {
                                                                                            color: "#3182CE",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 1996,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 1995,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1994,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Submitted"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 1999,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 1993,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 2004,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2003,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 1992,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "blue.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.submitted.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 2007,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 1986,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "mukuru.orange.100/20",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiRefreshCw"], {
                                                                                            color: "#F05423",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 2022,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 2021,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2020,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "In Progress"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2025,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2019,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 2030,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2029,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 2018,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "orange.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.inProgress.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 2033,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 2012,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "red.100",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiAlertTriangle"], {
                                                                                            color: "#E53E3E",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 2048,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 2047,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2046,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Risk Review"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2051,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2045,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 2056,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2055,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 2044,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "orange.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.riskReview.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 2059,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 2038,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "green.100",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheckCircle"], {
                                                                                            color: "#38A169",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 2074,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 2073,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2072,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Complete"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2077,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2071,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 2082,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2081,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 2070,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "green.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.complete.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 2085,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 2064,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Card$2f$Card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                                            width: "full",
                                                            bg: "white",
                                                            style: {
                                                                cursor: 'pointer'
                                                            },
                                                            className: "stats-card",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    w: "100%",
                                                                    h: "100%",
                                                                    mb: "4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                                                            alignItems: "center",
                                                                            gap: "12px",
                                                                            my: "auto",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                                                    bg: "red.100",
                                                                                    height: "36px",
                                                                                    width: "36px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiXCircle"], {
                                                                                            color: "#C53030",
                                                                                            height: "24px",
                                                                                            width: "24px"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 2100,
                                                                                            columnNumber: 33
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 2099,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2098,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                                    color: "gray.800",
                                                                                    fontSize: "16px",
                                                                                    fontWeight: "black",
                                                                                    lineHeight: "24px",
                                                                                    children: "Declined"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2103,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2097,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            justifySelf: "flex-end",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$ChevronRightIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChevronRightIcon"], {
                                                                                color: "#F05423",
                                                                                width: "20px",
                                                                                height: "20px"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 2108,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2107,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 2096,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                    color: "red.600",
                                                                    fontFamily: "Madera",
                                                                    fontSize: "30px",
                                                                    fontWeight: "black",
                                                                    letterSpacing: "0%",
                                                                    lineHeight: "40px",
                                                                    children: stats.declined.toLocaleString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 2111,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 2090,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 1959,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                    mb: "4",
                                                    width: "100%",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                        width: "100%",
                                                        maxW: "800px",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Search$2f$Search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Search"], {
                                                            placeholder: "Search by Name or Email...",
                                                            onSearchChange: handleSearchChange
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                            lineNumber: 2120,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                        lineNumber: 2119,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 2118,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                    bg: "white",
                                                    borderRadius: "xl",
                                                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                                                    border: "1px solid",
                                                    borderColor: "gray.100",
                                                    overflow: "hidden",
                                                    color: "gray.900",
                                                    className: "work-queue-table-wrapper",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$DataTable$2f$DataTable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DataTable"], {
                                                        fetchData: fetchData,
                                                        columns: columns,
                                                        tableId: "work-queue",
                                                        sortConfig: sortConfig ?? undefined,
                                                        onSortChange: handleSortChange,
                                                        showActions: true,
                                                        actionColumn: {
                                                            header: 'Actions',
                                                            width: '120px',
                                                            render: (row, index)=>{
                                                                const app = row;
                                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        display: "flex",
                                                                        gap: "6px",
                                                                        alignItems: "center",
                                                                        justifyContent: "flex-end"
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "View",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                                                href: app.applicationId ? `/applications/${app.applicationId}` : `/applications/${app.id}`,
                                                                                style: {
                                                                                    textDecoration: 'none'
                                                                                },
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                    style: {
                                                                                        background: "none",
                                                                                        border: "none",
                                                                                        padding: "6px",
                                                                                        cursor: "pointer",
                                                                                        color: "#E8590C",
                                                                                        display: "flex",
                                                                                        alignItems: "center",
                                                                                        justifyContent: "center",
                                                                                        minWidth: "28px",
                                                                                        height: "28px"
                                                                                    },
                                                                                    "aria-label": "View",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiEye"], {
                                                                                            size: 14
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 2170,
                                                                                            columnNumber: 52
                                                                                        }, void 0)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 2170,
                                                                                        columnNumber: 39
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2155,
                                                                                    columnNumber: 37
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 2154,
                                                                                columnNumber: 35
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2153,
                                                                            columnNumber: 33
                                                                        }, void 0),
                                                                        app.assignedTo && (app.assignedTo === currentUser.id || app.assignedToName === currentUser.name) && (app.backendStatus === 'Assigned' || app.backendStatus === 'InProgress') && app.status !== 'COMPLETE' && app.status !== 'DECLINED' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "Review",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                style: {
                                                                                    background: "none",
                                                                                    border: "none",
                                                                                    padding: "8px",
                                                                                    cursor: "pointer",
                                                                                    color: "#E8590C",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center"
                                                                                },
                                                                                onClick: ()=>handleStartReview(app.id),
                                                                                "aria-label": "Review",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiPlay"], {
                                                                                        size: 16
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 2194,
                                                                                        columnNumber: 52
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2194,
                                                                                    columnNumber: 39
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 2180,
                                                                                columnNumber: 37
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2179,
                                                                            columnNumber: 35
                                                                        }, void 0),
                                                                        !app.assignedTo && app.status !== 'COMPLETE' && app.status !== 'DECLINED' && app.backendStatus !== 'Completed' && app.backendStatus !== 'Declined' && app.backendStatus !== 'Cancelled' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "Assign",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                style: {
                                                                                    background: "none",
                                                                                    border: "none",
                                                                                    padding: "8px",
                                                                                    cursor: "pointer",
                                                                                    color: "#E8590C",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center"
                                                                                },
                                                                                onClick: ()=>openAssignModal(app),
                                                                                "aria-label": "Assign",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiUser"], {
                                                                                        size: 16
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 2219,
                                                                                        columnNumber: 52
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2219,
                                                                                    columnNumber: 39
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 2205,
                                                                                columnNumber: 37
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2204,
                                                                            columnNumber: 35
                                                                        }, void 0),
                                                                        app.status === 'IN PROGRESS' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "Complete",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                style: {
                                                                                    background: "none",
                                                                                    border: "none",
                                                                                    padding: "8px",
                                                                                    cursor: "pointer",
                                                                                    color: "#E8590C",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center"
                                                                                },
                                                                                onClick: ()=>openActionModal(app, 'complete'),
                                                                                "aria-label": "Complete",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheck"], {
                                                                                        size: 16
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 2239,
                                                                                        columnNumber: 52
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2239,
                                                                                    columnNumber: 39
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 2225,
                                                                                columnNumber: 37
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2224,
                                                                            columnNumber: 35
                                                                        }, void 0),
                                                                        app.status === 'RISK REVIEW' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                                    content: "Approve",
                                                                                    showArrow: true,
                                                                                    variant: "light",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                        style: {
                                                                                            background: "none",
                                                                                            border: "none",
                                                                                            padding: "8px",
                                                                                            cursor: "pointer",
                                                                                            color: "#E8590C",
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            justifyContent: "center"
                                                                                        },
                                                                                        onClick: ()=>openActionModal(app, 'approve'),
                                                                                        "aria-label": "Approve",
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheck"], {
                                                                                                size: 16
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                                lineNumber: 2260,
                                                                                                columnNumber: 54
                                                                                            }, void 0)
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 2260,
                                                                                            columnNumber: 41
                                                                                        }, void 0)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 2246,
                                                                                        columnNumber: 39
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2245,
                                                                                    columnNumber: 37
                                                                                }, void 0),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                                    content: "Decline",
                                                                                    showArrow: true,
                                                                                    variant: "light",
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                        style: {
                                                                                            background: "none",
                                                                                            border: "none",
                                                                                            padding: "8px",
                                                                                            cursor: "pointer",
                                                                                            color: "#E8590C",
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            justifyContent: "center"
                                                                                        },
                                                                                        onClick: ()=>openActionModal(app, 'decline'),
                                                                                        "aria-label": "Decline",
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Icons$2f$DeleteIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DeleteIcon"], {}, void 0, false, {
                                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                            lineNumber: 2278,
                                                                                            columnNumber: 41
                                                                                        }, void 0)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 2264,
                                                                                        columnNumber: 39
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2263,
                                                                                    columnNumber: 37
                                                                                }, void 0)
                                                                            ]
                                                                        }, void 0, true),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Tooltip$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                                            content: "Mark for Refresh",
                                                                            showArrow: true,
                                                                            variant: "light",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                style: {
                                                                                    background: "none",
                                                                                    border: "none",
                                                                                    padding: "8px",
                                                                                    cursor: "pointer",
                                                                                    color: "#E8590C",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center"
                                                                                },
                                                                                onClick: ()=>handleMarkForRefresh(app.id),
                                                                                "aria-label": "Mark for Refresh",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiRefreshCw"], {
                                                                                        size: 16
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                        lineNumber: 2298,
                                                                                        columnNumber: 50
                                                                                    }, void 0)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                    lineNumber: 2298,
                                                                                    columnNumber: 37
                                                                                }, void 0)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                                lineNumber: 2284,
                                                                                columnNumber: 35
                                                                            }, void 0)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2283,
                                                                            columnNumber: 33
                                                                        }, void 0)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                                    lineNumber: 2152,
                                                                    columnNumber: 31
                                                                }, void 0);
                                                            }
                                                        },
                                                        emptyState: {
                                                            message: "No work queue items found",
                                                            content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                                gap: "4",
                                                                py: "8",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiFile"], {
                                                                            size: 48,
                                                                            color: "#9CA3AF"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                                                            lineNumber: 2310,
                                                                            columnNumber: 25
                                                                        }, void 0)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                        lineNumber: 2309,
                                                                        columnNumber: 23
                                                                    }, void 0),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                        fontSize: "lg",
                                                                        fontWeight: "semibold",
                                                                        color: "gray.700",
                                                                        children: "No work queue items found"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                        lineNumber: 2312,
                                                                        columnNumber: 23
                                                                    }, void 0),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                        fontSize: "sm",
                                                                        color: "gray.600",
                                                                        textAlign: "center",
                                                                        maxW: "400px",
                                                                        children: "Work items will appear here once they are created"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                                        lineNumber: 2315,
                                                                        columnNumber: 23
                                                                    }, void 0)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                lineNumber: 2308,
                                                                columnNumber: 21
                                                            }, void 0)
                                                        }
                                                    }, `work-queue-${viewType}-${statusFilter}-${searchTerm}-${refreshKey}`, false, {
                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                        lineNumber: 2138,
                                                        columnNumber: 15
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 2128,
                                                    columnNumber: 13
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 1948,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                        lineNumber: 1947,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 1946,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 925,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 924,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/work-queue/page.tsx",
                lineNumber: 861,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Modal"], {
                isOpen: assignModalOpen,
                onClose: ()=>setAssignModalOpen(false),
                title: "Assign Work Item",
                size: "small",
                closeOnBackdropClick: true,
                closeOnEsc: true,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModalHeader"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            gap: "3",
                            align: "center",
                            mb: "1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                    p: "2",
                                    borderRadius: "lg",
                                    _focus: {
                                        boxShadow: 'none',
                                        outline: 'none',
                                        border: 'none',
                                        borderWidth: 0,
                                        borderStyle: 'none',
                                        borderColor: 'transparent'
                                    },
                                    _focusVisible: {
                                        boxShadow: 'none',
                                        outline: 'none',
                                        border: 'none',
                                        borderWidth: 0,
                                        borderStyle: 'none',
                                        borderColor: 'transparent'
                                    },
                                    _active: {
                                        boxShadow: 'none',
                                        outline: 'none',
                                        border: 'none',
                                        borderWidth: 0,
                                        borderStyle: 'none',
                                        borderColor: 'transparent'
                                    },
                                    _hover: {
                                        boxShadow: 'none',
                                        outline: 'none',
                                        border: 'none',
                                        borderWidth: 0,
                                        borderStyle: 'none',
                                        borderColor: 'transparent'
                                    },
                                    bgGradient: "linear(to-br, orange.100, orange.200)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiUserCheck"], {
                                            size: 16,
                                            color: "#DD6B20"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2353,
                                            columnNumber: 28
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                        lineNumber: 2353,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2341,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                    align: "start",
                                    gap: "0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                            fontSize: "lg",
                                            fontWeight: "700",
                                            color: "gray.900",
                                            children: "Assign Work Item"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2356,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                            fontSize: "sm",
                                            color: "gray.600",
                                            mt: "0.5",
                                            children: "Assign this work item to a user"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2359,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2355,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 2340,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 2339,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModalBody"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                            gap: "5",
                            align: "stretch",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                    fontSize: "sm",
                                    color: "gray.700",
                                    children: [
                                        "Assign work item: ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: selectedApp?.workItemNumber || selectedApp?.id
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2368,
                                            columnNumber: 37
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2367,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$field$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Field$3e$__["Field"].Root, {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$field$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Field$3e$__["Field"].Label, {
                                            fontSize: "sm",
                                            fontWeight: "600",
                                            color: "gray.700",
                                            mb: "2",
                                            children: "Assign to"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2371,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Checkbox$2f$Checkbox$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Checkbox"], {
                                            checked: assignToSelf,
                                            onCheckedChange: (details)=>{
                                                setAssignToSelf(details.checked === true);
                                                if (details.checked === true) {
                                                    setAssignToUserId(currentUser.id);
                                                    setAssignToUserName(currentUser.name);
                                                }
                                            },
                                            children: [
                                                "Assign to me (",
                                                currentUser.name,
                                                ")"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2374,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2370,
                                    columnNumber: 17
                                }, this),
                                !assignToSelf && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruComponentWrappers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                    label: "User ID",
                                    value: assignToUserId,
                                    onChange: (e)=>setAssignToUserId(e.target.value),
                                    placeholder: "Enter user ID"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2388,
                                    columnNumber: 21
                                }, this),
                                !assignToSelf && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mukuruComponentWrappers$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                    label: "User Name",
                                    value: assignToUserName,
                                    onChange: (e)=>setAssignToUserName(e.target.value),
                                    placeholder: "Enter user name"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2396,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 2366,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 2365,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModalFooter"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            gap: "3",
                            justify: "flex-end",
                            w: "full",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    type: "button",
                                    variant: "secondary",
                                    size: "sm",
                                    onClick: ()=>setAssignModalOpen(false),
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2407,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    type: "button",
                                    variant: "primary",
                                    className: "mukuru-primary-button",
                                    size: "sm",
                                    onClick: handleAssign,
                                    children: "Assign"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2415,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 2406,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 2405,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/work-queue/page.tsx",
                lineNumber: 2331,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Modal"], {
                isOpen: actionModalOpen,
                onClose: ()=>setActionModalOpen(false),
                title: actionType === 'start-review' ? 'Start Review' : actionType === 'approve' ? 'Approve Work Item' : actionType === 'decline' ? 'Decline Work Item' : actionType === 'complete' ? 'Complete Work Item' : '',
                size: "small",
                closeOnBackdropClick: true,
                closeOnEsc: true,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModalHeader"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                            fontSize: "lg",
                            fontWeight: "700",
                            color: "gray.900",
                            children: [
                                actionType === 'start-review' && 'Start Review',
                                actionType === 'approve' && 'Approve Work Item',
                                actionType === 'decline' && 'Decline Work Item',
                                actionType === 'complete' && 'Complete Work Item'
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 2443,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 2442,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModalBody"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                            gap: "5",
                            align: "stretch",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                    fontSize: "sm",
                                    color: "gray.700",
                                    children: [
                                        "Work Item: ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: selectedApp?.workItemNumber || selectedApp?.id
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2453,
                                            columnNumber: 30
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2452,
                                    columnNumber: 17
                                }, this),
                                actionType === 'decline' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$field$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Field$3e$__["Field"].Root, {
                                    required: true,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$field$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Field$3e$__["Field"].Label, {
                                            fontSize: "sm",
                                            fontWeight: "600",
                                            color: "gray.700",
                                            mb: "2",
                                            children: "Reason for Decline"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2457,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$textarea$2f$textarea$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Textarea"], {
                                            value: declineReason,
                                            onChange: (e)=>setDeclineReason(e.target.value),
                                            placeholder: "Please provide a reason for declining this application...",
                                            rows: 4,
                                            borderRadius: "md",
                                            borderWidth: "1.5px",
                                            borderColor: "gray.300",
                                            fontSize: "sm",
                                            color: "gray.900",
                                            _focus: {
                                                borderColor: "red.400",
                                                boxShadow: "0 0 0 1px red.400"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2460,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2456,
                                    columnNumber: 19
                                }, this),
                                (actionType === 'approve' || actionType === 'complete') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$field$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Field$3e$__["Field"].Root, {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$field$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Field$3e$__["Field"].Label, {
                                            fontSize: "sm",
                                            fontWeight: "600",
                                            color: "gray.700",
                                            mb: "2",
                                            children: [
                                                "Notes ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                    as: "span",
                                                    fontSize: "sm",
                                                    color: "gray.400",
                                                    fontWeight: "400",
                                                    children: "(Optional)"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                                    lineNumber: 2480,
                                                    columnNumber: 29
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2479,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$textarea$2f$textarea$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Textarea"], {
                                            value: actionNotes,
                                            onChange: (e)=>setActionNotes(e.target.value),
                                            placeholder: "Add any notes or comments...",
                                            rows: 4,
                                            borderRadius: "md",
                                            borderWidth: "1.5px",
                                            borderColor: "gray.300",
                                            fontSize: "sm",
                                            color: "gray.900",
                                            _focus: {
                                                borderColor: "green.400",
                                                boxShadow: "0 0 0 1px green.400"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2482,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2478,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 2451,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 2450,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModalFooter"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            gap: "3",
                            justify: "flex-end",
                            w: "full",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "secondary",
                                    size: "sm",
                                    onClick: ()=>setActionModalOpen(false),
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2503,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "primary",
                                    size: "sm",
                                    onClick: handleAction,
                                    disabled: actionType === 'decline' && !declineReason.trim(),
                                    children: [
                                        actionType === 'start-review' && 'Start Review',
                                        actionType === 'approve' && 'Approve',
                                        actionType === 'decline' && 'Decline',
                                        actionType === 'complete' && 'Complete'
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2510,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 2502,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 2501,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/work-queue/page.tsx",
                lineNumber: 2429,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Modal"], {
                isOpen: commentsModalOpen,
                onClose: ()=>setCommentsModalOpen(false),
                size: "large",
                closeOnBackdropClick: true,
                closeOnEsc: true,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModalHeader"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            gap: "3",
                            align: "center",
                            mb: "1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                    p: "2",
                                    borderRadius: "lg",
                                    _focus: {
                                        boxShadow: 'none',
                                        outline: 'none',
                                        border: 'none',
                                        borderWidth: 0,
                                        borderStyle: 'none',
                                        borderColor: 'transparent'
                                    },
                                    _focusVisible: {
                                        boxShadow: 'none',
                                        outline: 'none',
                                        border: 'none',
                                        borderWidth: 0,
                                        borderStyle: 'none',
                                        borderColor: 'transparent'
                                    },
                                    _active: {
                                        boxShadow: 'none',
                                        outline: 'none',
                                        border: 'none',
                                        borderWidth: 0,
                                        borderStyle: 'none',
                                        borderColor: 'transparent'
                                    },
                                    _hover: {
                                        boxShadow: 'none',
                                        outline: 'none',
                                        border: 'none',
                                        borderWidth: 0,
                                        borderStyle: 'none',
                                        borderColor: 'transparent'
                                    },
                                    bgGradient: "linear(to-br, blue.100, blue.200)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$IconWrapper$2f$IconWrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IconWrapper"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiMessageSquare"], {
                                            size: 16,
                                            color: "#3182CE"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2547,
                                            columnNumber: 28
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                        lineNumber: 2547,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2535,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                    align: "start",
                                    gap: "0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                            fontSize: "lg",
                                            fontWeight: "700",
                                            color: "gray.900",
                                            children: [
                                                "Comments - ",
                                                selectedApp?.workItemNumber || selectedApp?.id
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2550,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                            fontSize: "sm",
                                            color: "gray.600",
                                            mt: "0.5",
                                            children: "View and add comments for this work item"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2553,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2549,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 2534,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 2533,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModalBody"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                            gap: "5",
                            align: "stretch",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                    maxH: "400px",
                                    overflowY: "auto",
                                    children: comments.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                        color: "gray.600",
                                        fontSize: "sm",
                                        children: "No comments yet"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                        lineNumber: 2563,
                                        columnNumber: 25
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                        gap: "3",
                                        align: "stretch",
                                        children: comments.map((comment, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                p: "3",
                                                bg: "gray.50",
                                                borderRadius: "md",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                        justify: "space-between",
                                                        mb: "2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                fontWeight: "semibold",
                                                                fontSize: "sm",
                                                                color: "gray.900",
                                                                children: comment.createdBy || 'Unknown'
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                lineNumber: 2569,
                                                                columnNumber: 33
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                                fontSize: "xs",
                                                                color: "gray.600",
                                                                children: new Date(comment.createdAt).toLocaleString()
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                                lineNumber: 2570,
                                                                columnNumber: 33
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                        lineNumber: 2568,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                        fontSize: "sm",
                                                        color: "gray.700",
                                                        children: comment.text
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                        lineNumber: 2574,
                                                        columnNumber: 31
                                                    }, this)
                                                ]
                                            }, idx, true, {
                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                lineNumber: 2567,
                                                columnNumber: 25
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                        lineNumber: 2565,
                                        columnNumber: 21
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2561,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$field$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Field$3e$__["Field"].Root, {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$field$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Field$3e$__["Field"].Label, {
                                            fontSize: "sm",
                                            fontWeight: "600",
                                            color: "gray.700",
                                            mb: "2",
                                            children: "Add Comment"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2581,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$textarea$2f$textarea$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Textarea"], {
                                            value: newComment,
                                            onChange: (e)=>setNewComment(e.target.value),
                                            placeholder: "Enter your comment...",
                                            rows: 3,
                                            borderRadius: "md",
                                            borderWidth: "1.5px",
                                            borderColor: "gray.300",
                                            fontSize: "sm",
                                            color: "gray.900",
                                            _focus: {
                                                borderColor: "orange.400",
                                                boxShadow: "0 0 0 1px orange.400"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/work-queue/page.tsx",
                                            lineNumber: 2584,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2580,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "primary",
                                    className: "mukuru-primary-button",
                                    size: "sm",
                                    onClick: handleAddComment,
                                    disabled: !newComment.trim(),
                                    children: "Add Comment"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/work-queue/page.tsx",
                                    lineNumber: 2600,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 2560,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 2559,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModalFooter"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "secondary",
                            size: "sm",
                            onClick: ()=>setCommentsModalOpen(false),
                            children: "Close"
                        }, void 0, false, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 2612,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 2611,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/work-queue/page.tsx",
                lineNumber: 2526,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Modal"], {
                isOpen: historyModalOpen,
                onClose: ()=>setHistoryModalOpen(false),
                title: `History - ${selectedApp?.workItemNumber || selectedApp?.id}`,
                size: "large",
                closeOnBackdropClick: true,
                closeOnEsc: true,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModalHeader"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                            fontSize: "lg",
                            fontWeight: "700",
                            color: "gray.900",
                            children: [
                                "History - ",
                                selectedApp?.workItemNumber || selectedApp?.id
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 2632,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 2631,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModalBody"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            maxH: "500px",
                            overflowY: "auto",
                            children: history.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                color: "gray.600",
                                fontSize: "sm",
                                children: "No history available"
                            }, void 0, false, {
                                fileName: "[project]/src/app/work-queue/page.tsx",
                                lineNumber: 2639,
                                columnNumber: 25
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                gap: "2",
                                align: "stretch",
                                children: history.map((entry, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                        p: "3",
                                        borderLeft: "3px",
                                        borderColor: "orange.500",
                                        bg: "gray.50",
                                        borderRadius: "md",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                justify: "space-between",
                                                mb: "1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                        fontWeight: "semibold",
                                                        fontSize: "sm",
                                                        color: "gray.900",
                                                        children: entry.action || entry.description
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                        lineNumber: 2645,
                                                        columnNumber: 31
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                        fontSize: "xs",
                                                        color: "gray.600",
                                                        children: new Date(entry.timestamp || entry.createdAt).toLocaleString()
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                                        lineNumber: 2646,
                                                        columnNumber: 31
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                lineNumber: 2644,
                                                columnNumber: 25
                                            }, this),
                                            entry.performedBy && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typography"], {
                                                fontSize: "xs",
                                                color: "gray.600",
                                                children: [
                                                    "By: ",
                                                    entry.performedBy
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/work-queue/page.tsx",
                                                lineNumber: 2651,
                                                columnNumber: 31
                                            }, this)
                                        ]
                                    }, idx, true, {
                                        fileName: "[project]/src/app/work-queue/page.tsx",
                                        lineNumber: 2643,
                                        columnNumber: 23
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/app/work-queue/page.tsx",
                                lineNumber: 2641,
                                columnNumber: 19
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 2637,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 2636,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Modal$2f$Modal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModalFooter"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mukuru$2f$mukuru$2d$react$2d$components$2f$dist$2f$components$2f$ui$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "secondary",
                            size: "sm",
                            onClick: ()=>setHistoryModalOpen(false),
                            children: "Close"
                        }, void 0, false, {
                            fileName: "[project]/src/app/work-queue/page.tsx",
                            lineNumber: 2660,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/work-queue/page.tsx",
                        lineNumber: 2659,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/work-queue/page.tsx",
                lineNumber: 2623,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/work-queue/page.tsx",
        lineNumber: 839,
        columnNumber: 5
    }, this);
}
_s(WorkQueuePage, "TTLwnpbgLOR3iSA5INpjTEeUHn4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSession"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$SidebarContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSidebar"]
    ];
});
_c = WorkQueuePage;
var _c;
__turbopack_context__.k.register(_c, "WorkQueuePage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# debugId=a22ebe27-0826-91a7-049d-59c61418167e
//# sourceMappingURL=src_2464e8bd._.js.map