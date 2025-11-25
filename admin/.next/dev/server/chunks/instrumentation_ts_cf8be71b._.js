;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="cbd35aac-ce7c-3672-aec8-763e1d2bd4fb")}catch(e){}}();
module.exports = [
"[project]/instrumentation.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// This file configures the initialization of Sentry for edge features (middleware, edge routes, etc).
// The config you add here will be used whenever one of the edge features is loaded.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
__turbopack_context__.s([
    "register",
    ()=>register
]);
globalThis["_sentryNextJsVersion"] = "16.0.3";
async function register() {
    if ("TURBOPACK compile-time truthy", 1) {
        await __turbopack_context__.A("[project]/sentry.server.config.ts [instrumentation] (ecmascript, async loader)");
    }
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
}
}),
];

//# debugId=cbd35aac-ce7c-3672-aec8-763e1d2bd4fb
//# sourceMappingURL=instrumentation_ts_cf8be71b._.js.map