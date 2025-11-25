;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="ca0e5a33-3a04-25cb-de8f-1a001819ccf0")}catch(e){}}();
module.exports = [
"[project]/src/services/utils/csvExport.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * CSV Export Utilities
 * Shared utilities for CSV export functionality
 */ /**
 * Escape CSV field to handle commas, quotes, and newlines
 */ __turbopack_context__.s([
    "createCsvBlob",
    ()=>createCsvBlob,
    "escapeCsvField",
    ()=>escapeCsvField
]);
function escapeCsvField(field) {
    if (!field) return '';
    const str = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}
function createCsvBlob(headers, rows) {
    const csvRows = [];
    // CSV Header
    csvRows.push(headers.join(','));
    // CSV Data
    rows.forEach((row)=>{
        csvRows.push(row.join(','));
    });
    const csvContent = csvRows.join('\n');
    return new Blob([
        csvContent
    ], {
        type: 'text/csv;charset=utf-8;'
    });
}
}),
];

//# debugId=ca0e5a33-3a04-25cb-de8f-1a001819ccf0
//# sourceMappingURL=src_services_utils_csvExport_ts_5ff67e85._.js.map