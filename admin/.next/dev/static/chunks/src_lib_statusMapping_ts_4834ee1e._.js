;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="6e05d24d-e598-b5ef-e457-e2cd96b52178")}catch(e){}}();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/statusMapping.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Status Mapping Utilities
 * Pure functions for mapping between frontend and backend statuses
 * These can be tested without mocks
 */ /**
 * Map frontend status to backend status for application status updates
 */ __turbopack_context__.s([
    "generateGuidFromString",
    ()=>generateGuidFromString,
    "getStatusEndpoint",
    ()=>getStatusEndpoint,
    "isGuid",
    ()=>isGuid,
    "mapFrontendStatusToBackend",
    ()=>mapFrontendStatusToBackend,
    "normalizeUserIdToGuid",
    ()=>normalizeUserIdToGuid
]);
function mapFrontendStatusToBackend(status) {
    const statusMap = {
        'SUBMITTED': 'Submitted',
        'IN PROGRESS': 'InProgress',
        'RISK REVIEW': 'PendingReview',
        'COMPLETE': 'Approved',
        'APPROVED': 'Approved',
        'DECLINED': 'Rejected',
        'REJECTED': 'Rejected'
    };
    return statusMap[status] || status;
}
function getStatusEndpoint(status) {
    const backendStatus = mapFrontendStatusToBackend(status);
    if (backendStatus === 'Approved') {
        return 'approve';
    } else if (backendStatus === 'Rejected') {
        return 'reject';
    } else {
        return 'status';
    }
}
function isGuid(id) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
function generateGuidFromString(input) {
    let hash = 0;
    for(let i = 0; i < input.length; i++){
        const char = input.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(32, '0');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}
function normalizeUserIdToGuid(userId) {
    if (isGuid(userId)) {
        return userId;
    }
    return generateGuidFromString(userId);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# debugId=6e05d24d-e598-b5ef-e457-e2cd96b52178
//# sourceMappingURL=src_lib_statusMapping_ts_4834ee1e._.js.map