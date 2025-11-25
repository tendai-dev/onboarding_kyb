"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PortalNavigationSidebar } from "@/lib/mukuruImports";
import {
  ProductIcon,
  UserIcon,
  PartnerIcon,
  DocumentIcon,
  SettingsIcon,
  HelpIcon,
  AppIcon,
  FileOpenIcon,
  NotificationIcon,
  MailIcon,
  FilterIcon,
  WarningIcon,
} from "@/lib/mukuruImports";
import { Box } from "@chakra-ui/react";
import { useSidebar } from "../contexts/SidebarContext";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { condensed, setCondensed } = useSidebar();
  const [activeItemId, setActiveItemId] = useState("dashboard");

  // Update activeItemId based on pathname
  useEffect(() => {
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
  }, [pathname]);

  const navigationItems = useMemo(() => [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <ProductIcon width="20" height="20" />,
      onClick: () => {
        setActiveItemId("dashboard");
        router.push("/dashboard");
      },
    },
    {
      id: "work-queue",
      label: "Work Queue",
      icon: <FilterIcon width="20" height="20" />,
      onClick: () => {
        setActiveItemId("work-queue");
        router.push("/work-queue");
      },
    },
    {
      id: "applications",
      label: "Applications",
      icon: <AppIcon width="20" height="20" />,
      onClick: () => {
        setActiveItemId("applications");
        router.push("/applications");
      },
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: <DocumentIcon width="20" height="20" />,
      onClick: () => {
        setActiveItemId("reviews");
        router.push("/review");
      },
      subItems: [
        {
          id: "risk-review",
          label: "Risk Review",
          onClick: () => {
            setActiveItemId("reviews");
            router.push("/risk-review");
          },
        },
        {
          id: "approvals",
          label: "Approvals",
          onClick: () => {
            setActiveItemId("reviews");
            router.push("/approvals");
          },
        },
      ],
    },
    {
      id: "documents",
      label: "Documents",
      icon: <FileOpenIcon width="20" height="20" />,
      onClick: () => {
        setActiveItemId("documents");
        router.push("/documents");
      },
    },
    {
      id: "configuration",
      label: "Configuration",
      icon: <SettingsIcon width="20" height="20" />,
      onClick: () => {
        setActiveItemId("configuration");
        router.push("/requirements");
      },
      subItems: [
        {
          id: "requirements",
          label: "Requirements",
          onClick: () => {
            setActiveItemId("configuration");
            router.push("/requirements");
          },
        },
        {
          id: "entity-types",
          label: "Entity Types",
          onClick: () => {
            setActiveItemId("configuration");
            router.push("/entity-types");
          },
        },
        {
          id: "checklists",
          label: "Checklists",
          onClick: () => {
            setActiveItemId("configuration");
            router.push("/checklists");
          },
        },
        {
          id: "wizard-configurations",
          label: "Wizard Configurations",
          onClick: () => {
            setActiveItemId("configuration");
            router.push("/wizard-configurations");
          },
        },
        {
          id: "rules-and-permissions",
          label: "Rules & Permissions",
          onClick: () => {
            setActiveItemId("configuration");
            router.push("/rules-and-permissions");
          },
        },
      ],
    },
    {
      id: "system",
      label: "System",
      icon: <WarningIcon width="20" height="20" />,
      onClick: () => {
        setActiveItemId("system");
        router.push("/audit-log");
      },
      subItems: [
        {
          id: "audit-log",
          label: "Audit Log",
          onClick: () => {
            setActiveItemId("system");
            router.push("/audit-log");
          },
        },
        {
          id: "messages",
          label: "Messages",
          onClick: () => {
            setActiveItemId("system");
            router.push("/messages");
          },
        },
        {
          id: "notifications",
          label: "Notifications",
          onClick: () => {
            setActiveItemId("system");
            router.push("/notifications");
          },
        },
        {
          id: "data-migration",
          label: "Data Migration",
          onClick: () => {
            setActiveItemId("system");
            router.push("/data-migration");
          },
        },
        {
          id: "refreshes",
          label: "Refreshes",
          onClick: () => {
            setActiveItemId("system");
            router.push("/refreshes");
          },
        },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      icon: <DocumentIcon width="20" height="20" />,
      onClick: () => {
        setActiveItemId("reports");
        router.push("/reports");
      },
    },
    {
      id: "profile",
      label: "Profile",
      icon: <UserIcon width="20" height="20" />,
      onClick: () => {
        setActiveItemId("profile");
        router.push("/profile");
      },
    },
  ], [router]);

  const helpCentreItem = {
    id: "help-centre",
    label: "Help Centre",
    icon: <HelpIcon width="20" height="20" />,
    onClick: () => {
      console.log("Help Centre");
      // Add help centre navigation if needed
    },
  };

  return (
    <Box
      position="fixed"
      left="0"
      top="0"
      height="100vh"
      width={condensed ? "72px" : "280px"}
      borderRight="1px solid"
      borderColor="rgba(55, 58, 54, 0.15)"
      zIndex="1000"
      className="sidebar-wrapper"
      bg="#F9FAFB"
      overflowY="auto"
      transition="width 0.3s ease"
    >
      <PortalNavigationSidebar
        navigationItems={navigationItems}
        helpCentreItem={helpCentreItem}
        {...({ activeItemId } as any)}
        condensed={condensed}
        onToggleCollapse={setCondensed}
        onLogoClick={() => {
          setActiveItemId("dashboard");
          router.push("/dashboard");
        }}
        expandedWidth="280px"
        condensedWidth="72px"
      />
    </Box>
  );
}
