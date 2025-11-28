;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="d661d5a6-3ef2-9575-deef-7d6cdd2b435a")}catch(e){}}();
module.exports=[872194,a=>{"use strict";function b(a){if(!a)return"";let b=String(a);return b.includes(",")||b.includes('"')||b.includes("\n")?`"${b.replace(/"/g,'""')}"`:b}function c(a,b){let c=[];return c.push(a.join(",")),b.forEach(a=>{c.push(a.join(","))}),new Blob([c.join("\n")],{type:"text/csv;charset=utf-8;"})}a.s(["createCsvBlob",()=>c,"escapeCsvField",()=>b])}];

//# debugId=d661d5a6-3ef2-9575-deef-7d6cdd2b435a
//# sourceMappingURL=src_services_utils_csvExport_ts_5ff67e85._.js.map