module.exports = [
"[project]/src/lib/auth/session.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// SECURITY: Tokens are now stored server-side in Redis via NextAuth
// This file provides compatibility functions that use NextAuth session instead of localStorage
// All token access is handled server-side by the API proxy
__turbopack_context__.s([
    "buildLogoutUrl",
    ()=>buildLogoutUrl,
    "clearSession",
    ()=>clearSession,
    "getAccessToken",
    ()=>getAccessToken,
    "getAuthUser",
    ()=>getAuthUser,
    "getInitials",
    ()=>getInitials,
    "isAuthenticated",
    ()=>isAuthenticated,
    "isTokenExpired",
    ()=>isTokenExpired,
    "logout",
    ()=>logout,
    "refreshToken",
    ()=>refreshToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/react/index.js [app-ssr] (ecmascript)");
;
function isAuthenticated() {
    if ("TURBOPACK compile-time truthy", 1) return false;
    //TURBOPACK unreachable
    ;
    // Check if session cookie exists (basic check)
    // For accurate authentication status, use useSession() hook
    const cookies = undefined;
    const hasSessionCookie = undefined;
}
async function getAccessToken() {
    // SECURITY: Do not return tokens from frontend
    // Tokens are stored server-side in Redis and injected by the proxy
    console.warn('[SECURITY] getAccessToken() called - tokens are server-side only. Use API proxy instead.');
    return null;
}
async function refreshToken() {
    // Token refresh is handled server-side by NextAuth
    // No action needed from frontend
    console.warn('[SECURITY] refreshToken() called - token refresh is handled server-side by NextAuth');
    return false;
}
function getAuthUser() {
    if ("TURBOPACK compile-time truthy", 1) {
        return {
            name: 'User'
        };
    }
    //TURBOPACK unreachable
    ;
}
function clearSession() {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
/**
 * Redirect to login page
 */ function redirectToLogin() {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
function buildLogoutUrl(postLogoutRedirectUri) {
    // NextAuth handles logout, but if needed for Keycloak direct logout:
    const keycloakIssuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || 'https://keycloak-staging.app-stg.mukuru.io/realms/mukuru';
    const base = `${keycloakIssuer}/protocol/openid-connect/logout`;
    const url = new URL(base);
    url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
    return url.toString();
}
function logout(postLogoutRedirectUri = '/auth/login') {
    // Use NextAuth signOut which handles session cleanup
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signOut"])({
        callbackUrl: postLogoutRedirectUri
    });
}
function getInitials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}
function isTokenExpired(bufferSeconds = 120) {
    // Token expiration is handled server-side by NextAuth
    // This function is deprecated
    console.warn('[DEPRECATED] isTokenExpired() - token expiration is handled server-side');
    return false;
}
}),
"[project]/src/components/EnhancedContextualMessaging.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EnhancedContextualMessaging",
    ()=>EnhancedContextualMessaging
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/box/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/v-stack.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/h-stack.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/text/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/button/button.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$textarea$2f$textarea$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/textarea/textarea.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/avatar/namespace.js [app-ssr] (ecmascript) <export * as Avatar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/badge/badge.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/flex/flex.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/icon/icon.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$spinner$2f$spinner$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/spinner/spinner.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/hooks/use-disclosure.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/dialog/dialog.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fi/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
const MotionBox = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].create(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"]);
const MotionVStack = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].create(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"]);
function EnhancedContextualMessaging({ conversations, messages, currentConversationId, currentApplicationId, onSendMessage, onReplyToMessage, onForwardMessage, onStarMessage, onArchiveConversation, onAssignConversation, onTagConversation, currentUser, applicationSections = [], applicationDocuments = [], loadingContext = false }) {
    const [newMessage, setNewMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [selectedContext, setSelectedContext] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [filterPriority, setFilterPriority] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("all");
    const [filterStatus, setFilterStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("all");
    const [isSending, setIsSending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [selectedAttachments, setSelectedAttachments] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [replyToMessage, setReplyToMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const { open: isContextOpen, onOpen: onContextOpen, onClose: onContextClose } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDisclosure"])();
    const { open: isAttachmentOpen, onOpen: onAttachmentOpen, onClose: onAttachmentClose } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDisclosure"])();
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [banner, setBanner] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const currentConversation = conversations.find((c)=>c.id === currentConversationId);
    // Filter messages by conversation/thread, sort by timestamp (oldest first for display)
    const currentMessages = messages.filter((m)=>!currentConversationId || m.applicationId === currentApplicationId || m.applicationId === currentConversation?.applicationId).sort((a, b)=>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [
        currentMessages
    ]);
    const handleSendMessage = async ()=>{
        if (!newMessage.trim() && selectedAttachments.length === 0) return;
        // Check if we have an application ID
        if (!currentApplicationId) {
            setBanner({
                status: 'error',
                message: 'Please select an application to send a message'
            });
            setTimeout(()=>setBanner(null), 3000);
            return;
        }
        setIsSending(true);
        try {
            await onSendMessage(newMessage, selectedContext, selectedAttachments);
            setNewMessage("");
            setSelectedContext(null);
            setSelectedAttachments([]);
            setReplyToMessage(null);
        } catch (error) {
            setBanner({
                status: 'error',
                message: 'Failed to send message'
            });
            setTimeout(()=>setBanner(null), 3000);
        } finally{
            setIsSending(false);
        }
    };
    const handleFileSelect = (event)=>{
        const files = Array.from(event.target.files || []);
        setSelectedAttachments((prev)=>[
                ...prev,
                ...files
            ]);
    };
    const removeAttachment = (index)=>{
        setSelectedAttachments((prev)=>prev.filter((_, i)=>i !== index));
    };
    const getContextualSections = ()=>{
        return applicationSections.map((section)=>({
                id: section.id,
                title: section.title,
                type: 'section',
                fields: section.fields
            }));
    };
    const getContextualDocuments = ()=>{
        return applicationDocuments.map((doc)=>({
                id: doc.id,
                title: doc.name || 'Document',
                type: doc.type || 'document',
                status: doc.status || 'unknown',
                url: doc.url
            }));
    };
    const getPriorityColor = (priority)=>{
        switch(priority){
            case 'urgent':
                return 'red';
            case 'high':
                return 'orange';
            case 'normal':
                return 'blue';
            case 'low':
                return 'gray';
            default:
                return 'gray';
        }
    };
    const getStatusColor = (status)=>{
        switch(status){
            case 'sent':
                return 'blue';
            case 'delivered':
                return 'green';
            case 'read':
                return 'green';
            default:
                return 'gray';
        }
    };
    const formatFileSize = (bytes)=>{
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = [
            'Bytes',
            'KB',
            'MB',
            'GB'
        ];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    const getFileIcon = (type)=>{
        if (type.startsWith('image/')) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiImage"];
        if (type.startsWith('video/')) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiVideo"];
        if (type.includes('pdf')) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiFileText"];
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiFile"];
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minH: "0",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                p: "3",
                borderBottom: "1px",
                borderColor: "gray.200",
                bg: "white",
                flexShrink: 0,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "2",
                    align: "stretch",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                            justify: "space-between",
                            align: "center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                    align: "start",
                                    gap: "0.5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "md",
                                            fontWeight: "semibold",
                                            color: "gray.900",
                                            children: "Application Communication"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                            lineNumber: 293,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "xs",
                                            color: "gray.600",
                                            fontWeight: "normal",
                                            children: currentApplicationId ? `Application ${currentApplicationId.slice(0, 8)}...` : 'No application selected'
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                            lineNumber: 296,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 292,
                                    columnNumber: 13
                                }, this),
                                currentMessages.filter((m)=>!m.isRead && m.senderType !== currentUser.type).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Badge"], {
                                    colorScheme: "orange",
                                    variant: "solid",
                                    px: "1.5",
                                    py: "0.5",
                                    borderRadius: "full",
                                    fontSize: "2xs",
                                    fontWeight: "semibold",
                                    children: [
                                        currentMessages.filter((m)=>!m.isRead && m.senderType !== currentUser.type).length,
                                        " Unread"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 302,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                            lineNumber: 291,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                            gap: "2",
                            align: "center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                    fontSize: "xs",
                                    color: "gray.600",
                                    fontWeight: "medium",
                                    children: "Reference:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 318,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                    size: "xs",
                                    variant: "outline",
                                    onClick: onContextOpen,
                                    borderColor: "gray.300",
                                    _hover: {
                                        bg: "gray.50",
                                        borderColor: "gray.400"
                                    },
                                    height: "24px",
                                    fontSize: "xs",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Icon"], {
                                            as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiMapPin"],
                                            mr: "1",
                                            boxSize: "3"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                            lineNumber: 328,
                                            columnNumber: 15
                                        }, this),
                                        selectedContext ? selectedContext.title : "Select Context"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 319,
                                    columnNumber: 13
                                }, this),
                                selectedContext && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Badge"], {
                                    colorScheme: "blue",
                                    variant: "subtle",
                                    fontSize: "2xs",
                                    children: selectedContext.type
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 332,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                            lineNumber: 317,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                    lineNumber: 290,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                lineNumber: 289,
                columnNumber: 7
            }, this),
            banner && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                p: "3",
                bg: banner.status === 'success' ? 'green.50' : 'red.50',
                border: "1px",
                borderColor: banner.status === 'success' ? 'green.200' : 'red.200',
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                    fontSize: "sm",
                    color: banner.status === 'success' ? 'green.700' : 'red.700',
                    children: banner.message
                }, void 0, false, {
                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                    lineNumber: 343,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                lineNumber: 342,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                flex: "1",
                overflowY: "auto",
                p: "4",
                bg: "gray.50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "2.5",
                    align: "stretch",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                            children: currentMessages.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                p: "8",
                                textAlign: "center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Icon"], {
                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiMessageSquare"],
                                        boxSize: "8",
                                        color: "gray.300",
                                        mb: "3"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                        lineNumber: 353,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "sm",
                                        color: "gray.500",
                                        fontWeight: "medium",
                                        children: "No messages yet"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                        lineNumber: 354,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "xs",
                                        color: "gray.400",
                                        mt: "1",
                                        children: "Start the conversation below"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                        lineNumber: 355,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                lineNumber: 352,
                                columnNumber: 15
                            }, this) : currentMessages.map((message)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MotionBox, {
                                    initial: {
                                        opacity: 0,
                                        y: 4
                                    },
                                    animate: {
                                        opacity: 1,
                                        y: 0
                                    },
                                    exit: {
                                        opacity: 0,
                                        y: -4
                                    },
                                    transition: {
                                        duration: 0.1
                                    },
                                    children: (()=>{
                                        // In partner view: partner messages go on RIGHT, admin messages on LEFT
                                        const isFromCurrentUser = message.senderType === 'partner' || currentUser.type === 'partner' && message.senderType !== 'admin';
                                        const isFromAdmin = message.senderType === 'admin';
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Flex"], {
                                            justify: isFromCurrentUser ? "flex-end" : "flex-start",
                                            gap: "2",
                                            align: "flex-start",
                                            maxW: "75%",
                                            ml: isFromCurrentUser ? "auto" : "0",
                                            mr: !isFromCurrentUser ? "auto" : "0",
                                            children: [
                                                !isFromCurrentUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                    size: "sm",
                                                    flexShrink: 0,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Fallback, {
                                                        bg: isFromAdmin ? "orange.500" : "blue.500",
                                                        color: "white",
                                                        fontSize: "xs",
                                                        fontWeight: "semibold",
                                                        children: message.senderName.charAt(0).toUpperCase()
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                        lineNumber: 384,
                                                        columnNumber: 29
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                    lineNumber: 383,
                                                    columnNumber: 27
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                    maxW: "100%",
                                                    p: "2.5",
                                                    bg: isFromCurrentUser ? "blue.500" : isFromAdmin ? "orange.500" : "white",
                                                    bgGradient: isFromCurrentUser ? "linear(to-br, blue.500, blue.600)" : isFromAdmin ? "linear(to-br, orange.500, orange.600)" : undefined,
                                                    color: isFromCurrentUser || isFromAdmin ? "white" : "gray.900",
                                                    borderRadius: "lg",
                                                    boxShadow: isFromCurrentUser ? "0 2px 8px rgba(49, 130, 206, 0.2)" : isFromAdmin ? "0 2px 8px rgba(237, 137, 54, 0.2)" : "0 1px 4px rgba(0, 0, 0, 0.06)",
                                                    border: isFromCurrentUser || isFromAdmin ? "none" : "1px solid",
                                                    borderColor: isFromCurrentUser || isFromAdmin ? "transparent" : "gray.200",
                                                    _hover: {
                                                        boxShadow: isFromCurrentUser ? "0 3px 10px rgba(49, 130, 206, 0.25)" : isFromAdmin ? "0 3px 10px rgba(237, 137, 54, 0.25)" : "0 2px 6px rgba(0, 0, 0, 0.08)"
                                                    },
                                                    transition: "all 0.2s ease",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                                        gap: "1.5",
                                                        align: "stretch",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                                                justify: "space-between",
                                                                align: "start",
                                                                gap: "2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                                                        gap: "1.5",
                                                                        align: "center",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                                                width: "4px",
                                                                                height: "4px",
                                                                                borderRadius: "full",
                                                                                bg: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.6)" : "blue.500",
                                                                                flexShrink: 0
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                lineNumber: 408,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                                                                align: "start",
                                                                                gap: "0",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                                                        fontSize: "xs",
                                                                                        fontWeight: "medium",
                                                                                        color: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.95)" : "gray.700",
                                                                                        letterSpacing: "0.1px",
                                                                                        children: message.senderName
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                        lineNumber: 416,
                                                                                        columnNumber: 35
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                                                        fontSize: "2xs",
                                                                                        color: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.75)" : "gray.500",
                                                                                        children: new Date(message.timestamp).toLocaleString('en-US', {
                                                                                            month: 'numeric',
                                                                                            day: 'numeric',
                                                                                            hour: 'numeric',
                                                                                            minute: '2-digit',
                                                                                            hour12: true
                                                                                        })
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                        lineNumber: 424,
                                                                                        columnNumber: 35
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                lineNumber: 415,
                                                                                columnNumber: 33
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                        lineNumber: 407,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Badge"], {
                                                                        bg: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.2)" : "gray.100",
                                                                        color: isFromCurrentUser || isFromAdmin ? "white" : "gray.600",
                                                                        variant: "solid",
                                                                        fontSize: "2xs",
                                                                        px: "1.5",
                                                                        py: "0.5",
                                                                        borderRadius: "sm",
                                                                        fontWeight: "medium",
                                                                        backdropFilter: "blur(4px)",
                                                                        children: message.isRead ? "✓ Read" : "Sent"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                        lineNumber: 438,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                lineNumber: 406,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                                pt: "0.5",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                                    fontSize: "sm",
                                                                    whiteSpace: "pre-wrap",
                                                                    lineHeight: "1.5",
                                                                    color: isFromCurrentUser || isFromAdmin ? "white" : "gray.800",
                                                                    fontWeight: "normal",
                                                                    children: message.content
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                    lineNumber: 455,
                                                                    columnNumber: 31
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                lineNumber: 454,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                                                gap: "0.5",
                                                                pt: "1.5",
                                                                borderTop: "1px",
                                                                borderColor: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.15)" : "gray.100",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                                        size: "xs",
                                                                        variant: "ghost",
                                                                        color: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.85)" : "gray.600",
                                                                        onClick: ()=>setReplyToMessage(message),
                                                                        _hover: {
                                                                            bg: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.12)" : "gray.100",
                                                                            color: isFromCurrentUser || isFromAdmin ? "white" : "gray.700"
                                                                        },
                                                                        fontSize: "2xs",
                                                                        px: "1.5",
                                                                        py: "0.5",
                                                                        h: "auto",
                                                                        minH: "auto",
                                                                        fontWeight: "normal",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Icon"], {
                                                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiCornerUpLeft"],
                                                                                mr: "1",
                                                                                boxSize: "2.5"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                lineNumber: 484,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            "Reply"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                        lineNumber: 468,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                                        size: "xs",
                                                                        variant: "ghost",
                                                                        color: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.85)" : "gray.600",
                                                                        onClick: ()=>onStarMessage(message.id),
                                                                        _hover: {
                                                                            bg: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.12)" : "gray.100",
                                                                            color: isFromCurrentUser || isFromAdmin ? "white" : "gray.700"
                                                                        },
                                                                        fontSize: "2xs",
                                                                        px: "1.5",
                                                                        py: "0.5",
                                                                        h: "auto",
                                                                        minH: "auto",
                                                                        fontWeight: "normal",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Icon"], {
                                                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiStar"],
                                                                                mr: "1",
                                                                                boxSize: "2.5"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                lineNumber: 503,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            "Star"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                        lineNumber: 487,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                                        size: "xs",
                                                                        variant: "ghost",
                                                                        color: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.85)" : "gray.600",
                                                                        _hover: {
                                                                            bg: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.12)" : "gray.100",
                                                                            color: isFromCurrentUser || isFromAdmin ? "white" : "gray.700"
                                                                        },
                                                                        fontSize: "2xs",
                                                                        px: "1.5",
                                                                        py: "0.5",
                                                                        h: "auto",
                                                                        minH: "auto",
                                                                        fontWeight: "normal",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Icon"], {
                                                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiCornerUpRight"],
                                                                                mr: "1",
                                                                                boxSize: "2.5"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                lineNumber: 521,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            "Forward"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                        lineNumber: 506,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                lineNumber: 467,
                                                                columnNumber: 29
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                        lineNumber: 404,
                                                        columnNumber: 27
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                    lineNumber: 389,
                                                    columnNumber: 25
                                                }, this),
                                                isFromCurrentUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                    size: "sm",
                                                    flexShrink: 0,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Fallback, {
                                                        bg: "#f76834",
                                                        color: "white",
                                                        fontSize: "xs",
                                                        fontWeight: "semibold",
                                                        children: message.senderName.charAt(0).toUpperCase()
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                        lineNumber: 529,
                                                        columnNumber: 29
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                    lineNumber: 528,
                                                    columnNumber: 27
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                            lineNumber: 374,
                                            columnNumber: 23
                                        }, this);
                                    })()
                                }, message.id, false, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 359,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                            lineNumber: 350,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            ref: messagesEndRef
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                            lineNumber: 541,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                    lineNumber: 349,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                lineNumber: 348,
                columnNumber: 7
            }, this),
            replyToMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                p: "3",
                bg: "blue.50",
                borderTop: "1px",
                borderColor: "blue.200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                    justify: "space-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                            gap: "2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Icon"], {
                                    as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiCornerUpLeft"],
                                    color: "blue.500"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 550,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                    fontSize: "sm",
                                    color: "blue.700",
                                    children: [
                                        "Replying to ",
                                        replyToMessage.senderName
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 551,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                            lineNumber: 549,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                            size: "xs",
                            variant: "ghost",
                            onClick: ()=>setReplyToMessage(null),
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                            lineNumber: 555,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                    lineNumber: 548,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                lineNumber: 547,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                p: "3",
                bg: "white",
                borderTop: "1px",
                borderColor: "gray.200",
                flexShrink: 0,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "2",
                    align: "stretch",
                    children: [
                        selectedAttachments.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                            p: "2",
                            bg: "gray.50",
                            borderRadius: "md",
                            border: "1px",
                            borderColor: "gray.200",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                gap: "1.5",
                                align: "stretch",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "xs",
                                        fontWeight: "semibold",
                                        color: "gray.700",
                                        children: [
                                            "Attachments (",
                                            selectedAttachments.length,
                                            ")"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                        lineNumber: 573,
                                        columnNumber: 17
                                    }, this),
                                    selectedAttachments.map((file, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                            gap: "2",
                                            justify: "space-between",
                                            p: "1.5",
                                            bg: "white",
                                            borderRadius: "sm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                                    gap: "2",
                                                    flex: "1",
                                                    minW: "0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Icon"], {
                                                            as: getFileIcon(file.type),
                                                            color: "gray.500",
                                                            boxSize: "3.5"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                            lineNumber: 579,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                                            align: "start",
                                                            gap: "0",
                                                            flex: "1",
                                                            minW: "0",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                                    fontSize: "2xs",
                                                                    color: "gray.700",
                                                                    fontWeight: "medium",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                    children: file.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                    lineNumber: 581,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                                    fontSize: "2xs",
                                                                    color: "gray.500",
                                                                    children: formatFileSize(file.size)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                    lineNumber: 582,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                            lineNumber: 580,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                    lineNumber: 578,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                    size: "xs",
                                                    variant: "ghost",
                                                    color: "red.500",
                                                    onClick: ()=>removeAttachment(index),
                                                    _hover: {
                                                        bg: "red.50"
                                                    },
                                                    minW: "auto",
                                                    px: "1",
                                                    h: "auto",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Icon"], {
                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiTrash2"],
                                                        boxSize: "3"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                        lineNumber: 595,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                    lineNumber: 585,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, index, true, {
                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                            lineNumber: 577,
                                            columnNumber: 19
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                lineNumber: 572,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                            lineNumber: 571,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                            gap: "2",
                            align: "flex-end",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                gap: "1.5",
                                align: "stretch",
                                flex: "1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$textarea$2f$textarea$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Textarea"], {
                                        placeholder: "Type your message...",
                                        value: newMessage,
                                        onChange: (e)=>setNewMessage(e.target.value),
                                        rows: 2,
                                        resize: "none",
                                        borderColor: "gray.300",
                                        color: "black",
                                        _focus: {
                                            borderColor: "blue.500",
                                            boxShadow: "0 0 0 1px #3182ce",
                                            color: "black"
                                        },
                                        _hover: {
                                            borderColor: "gray.400"
                                        },
                                        _placeholder: {
                                            color: "gray.400"
                                        },
                                        fontSize: "sm",
                                        py: "2",
                                        px: "3",
                                        onKeyPress: (e)=>{
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                        lineNumber: 606,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                        justify: "space-between",
                                        align: "center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                size: "xs",
                                                variant: "ghost",
                                                onClick: ()=>fileInputRef.current?.click(),
                                                color: "gray.600",
                                                _hover: {
                                                    bg: "gray.100",
                                                    color: "gray.700"
                                                },
                                                fontWeight: "normal",
                                                h: "auto",
                                                py: "1",
                                                px: "2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Icon"], {
                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiPaperclip"],
                                                        mr: "1.5",
                                                        boxSize: "3.5"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                        lineNumber: 640,
                                                        columnNumber: 19
                                                    }, this),
                                                    "Attach"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                lineNumber: 629,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                ref: fileInputRef,
                                                type: "file",
                                                multiple: true,
                                                onChange: handleFileSelect,
                                                style: {
                                                    display: 'none'
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                lineNumber: 643,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                                gap: "1.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                        size: "xs",
                                                        variant: "outline",
                                                        onClick: ()=>setNewMessage(""),
                                                        disabled: !newMessage.trim(),
                                                        borderColor: "gray.300",
                                                        color: "gray.600",
                                                        _hover: {
                                                            bg: "gray.50",
                                                            borderColor: "gray.400"
                                                        },
                                                        fontWeight: "normal",
                                                        h: "auto",
                                                        py: "1",
                                                        px: "2.5",
                                                        children: "Clear"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                        lineNumber: 652,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                        size: "xs",
                                                        bg: "blue.500",
                                                        color: "white",
                                                        onClick: handleSendMessage,
                                                        loading: isSending,
                                                        disabled: !newMessage.trim() && selectedAttachments.length === 0 || !currentApplicationId,
                                                        _hover: {
                                                            bg: "blue.600"
                                                        },
                                                        _active: {
                                                            bg: "blue.700"
                                                        },
                                                        fontWeight: "semibold",
                                                        h: "auto",
                                                        py: "1",
                                                        px: "3",
                                                        title: !currentApplicationId ? "Please select an application first" : undefined,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Icon"], {
                                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiSend"],
                                                                mr: "1.5",
                                                                boxSize: "3.5"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                lineNumber: 682,
                                                                columnNumber: 21
                                                            }, this),
                                                            "Send"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                        lineNumber: 667,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                lineNumber: 651,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                        lineNumber: 628,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                lineNumber: 605,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                            lineNumber: 604,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                    lineNumber: 568,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                lineNumber: 567,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DialogRoot"], {
                open: isContextOpen,
                onOpenChange: (e)=>e.open ? onContextOpen() : onContextClose(),
                modal: true,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DialogBackdrop"], {
                        bg: "blackAlpha.600",
                        backdropFilter: "blur(4px)"
                    }, void 0, false, {
                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                        lineNumber: 694,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DialogContent"], {
                        maxW: "md",
                        mx: "auto",
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 1500,
                        boxShadow: "xl",
                        borderRadius: "xl",
                        border: "1px",
                        borderColor: "gray.200",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DialogHeader"], {
                                borderBottom: "1px",
                                borderColor: "gray.200",
                                pb: "3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DialogTitle"], {
                                    fontSize: "lg",
                                    fontWeight: "semibold",
                                    color: "gray.900",
                                    children: "Select Context Reference"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 712,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                lineNumber: 711,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DialogBody"], {
                                children: loadingContext ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                    p: "8",
                                    textAlign: "center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$spinner$2f$spinner$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Spinner"], {
                                            size: "md",
                                            color: "blue.500"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                            lineNumber: 717,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "sm",
                                            color: "gray.600",
                                            mt: "3",
                                            children: "Loading context..."
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                            lineNumber: 718,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 716,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                    gap: "4",
                                    align: "stretch",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                    fontSize: "sm",
                                                    fontWeight: "semibold",
                                                    color: "gray.800",
                                                    mb: "2",
                                                    children: "Application Sections"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                    lineNumber: 724,
                                                    columnNumber: 19
                                                }, this),
                                                getContextualSections().length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                    p: "4",
                                                    textAlign: "center",
                                                    bg: "gray.50",
                                                    borderRadius: "md",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                        fontSize: "xs",
                                                        color: "gray.500",
                                                        children: "No sections available"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                        lineNumber: 729,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                    lineNumber: 728,
                                                    columnNumber: 21
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                                    gap: "2",
                                                    align: "stretch",
                                                    children: getContextualSections().map((section)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                            p: "2.5",
                                                            border: "1px",
                                                            borderColor: "gray.200",
                                                            borderRadius: "md",
                                                            cursor: "pointer",
                                                            _hover: {
                                                                bg: "blue.50",
                                                                borderColor: "blue.300"
                                                            },
                                                            transition: "all 0.2s",
                                                            onClick: ()=>{
                                                                setSelectedContext(section);
                                                                onContextClose();
                                                            },
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                                                gap: "2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Icon"], {
                                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiFolder"],
                                                                        color: "blue.500",
                                                                        boxSize: "4"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                        lineNumber: 749,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                                                        align: "start",
                                                                        gap: "0",
                                                                        flex: "1",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                                                fontSize: "sm",
                                                                                fontWeight: "medium",
                                                                                color: "gray.800",
                                                                                children: section.title
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                lineNumber: 751,
                                                                                columnNumber: 29
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                                                fontSize: "xs",
                                                                                color: "gray.500",
                                                                                children: [
                                                                                    section.fields?.length || 0,
                                                                                    " field",
                                                                                    section.fields?.length !== 1 ? 's' : ''
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                lineNumber: 754,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                        lineNumber: 750,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                lineNumber: 748,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, section.id, false, {
                                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                            lineNumber: 734,
                                                            columnNumber: 23
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                    lineNumber: 732,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                            lineNumber: 723,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                            h: "1px",
                                            bg: "gray.200"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                            lineNumber: 765,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                    fontSize: "sm",
                                                    fontWeight: "semibold",
                                                    color: "gray.800",
                                                    mb: "2",
                                                    children: "Application Documents"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                    lineNumber: 769,
                                                    columnNumber: 17
                                                }, this),
                                                getContextualDocuments().length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                    p: "4",
                                                    textAlign: "center",
                                                    bg: "gray.50",
                                                    borderRadius: "md",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                        fontSize: "xs",
                                                        color: "gray.500",
                                                        children: "No documents available"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                        lineNumber: 774,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                    lineNumber: 773,
                                                    columnNumber: 19
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                                    gap: "2",
                                                    align: "stretch",
                                                    children: getContextualDocuments().map((doc)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                            p: "2.5",
                                                            border: "1px",
                                                            borderColor: "gray.200",
                                                            borderRadius: "md",
                                                            cursor: "pointer",
                                                            _hover: {
                                                                bg: "green.50",
                                                                borderColor: "green.300"
                                                            },
                                                            transition: "all 0.2s",
                                                            onClick: ()=>{
                                                                setSelectedContext(doc);
                                                                onContextClose();
                                                            },
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                                                gap: "2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Icon"], {
                                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FiFileText"],
                                                                        color: "green.500",
                                                                        boxSize: "4"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                        lineNumber: 794,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                                                        align: "start",
                                                                        gap: "0",
                                                                        flex: "1",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                                                fontSize: "sm",
                                                                                fontWeight: "medium",
                                                                                color: "gray.800",
                                                                                children: doc.title || 'Document'
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                lineNumber: 796,
                                                                                columnNumber: 29
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                                                fontSize: "xs",
                                                                                color: "gray.500",
                                                                                children: [
                                                                                    doc.type && doc.type !== 'document' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                        children: [
                                                                                            doc.type,
                                                                                            " • "
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                        lineNumber: 800,
                                                                                        columnNumber: 71
                                                                                    }, this),
                                                                                    "Status: ",
                                                                                    doc.status || 'Unknown'
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                lineNumber: 799,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                        lineNumber: 795,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                lineNumber: 793,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, doc.id, false, {
                                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                            lineNumber: 779,
                                                            columnNumber: 23
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                    lineNumber: 777,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                            lineNumber: 768,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 721,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                lineNumber: 714,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DialogFooter"], {
                                borderTop: "1px",
                                borderColor: "gray.200",
                                pt: "3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                    onClick: onContextClose,
                                    variant: "outline",
                                    size: "sm",
                                    children: "Close"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 814,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                lineNumber: 813,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DialogCloseTrigger"], {}, void 0, false, {
                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                lineNumber: 822,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                        lineNumber: 698,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                lineNumber: 693,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
        lineNumber: 287,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/lib/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "archiveThread",
    ()=>archiveThread,
    "changePassword",
    ()=>changePassword,
    "deleteMessage",
    ()=>deleteMessage,
    "deleteUserAccount",
    ()=>deleteUserAccount,
    "downloadUserData",
    ()=>downloadUserData,
    "findUserCaseByEmail",
    ()=>findUserCaseByEmail,
    "forwardMessage",
    ()=>forwardMessage,
    "generateUserIdFromEmail",
    ()=>generateUserIdFromEmail,
    "getApplicationDocuments",
    ()=>getApplicationDocuments,
    "getApplicationSections",
    ()=>getApplicationSections,
    "getCaseById",
    ()=>getCaseById,
    "getDashboard",
    ()=>getDashboard,
    "getHandlerProfile",
    ()=>getHandlerProfile,
    "getMyThreads",
    ()=>getMyThreads,
    "getNotificationPreferences",
    ()=>getNotificationPreferences,
    "getThreadByApplication",
    ()=>getThreadByApplication,
    "getThreadMessages",
    ()=>getThreadMessages,
    "getUnreadCount",
    ()=>getUnreadCount,
    "getUserCaseSummary",
    ()=>getUserCaseSummary,
    "getUserProfile",
    ()=>getUserProfile,
    "markMessageRead",
    ()=>markMessageRead,
    "sendMessage",
    ()=>sendMessage,
    "starMessage",
    ()=>starMessage,
    "updateNotificationPreferences",
    ()=>updateNotificationPreferences,
    "updateUserProfile",
    ()=>updateUserProfile
]);
// Route via Next.js proxy to avoid CORS
// Proxy will automatically inject tokens from Redis based on session cookie
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api/proxy";
const MESSAGING_PREFIX = "/api/v1"; // Messaging is part of unified onboarding-api
function generateUserIdFromEmail(email) {
    // UUID v5 namespace (DNS namespace)
    const NAMESPACE_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    // Convert namespace UUID to bytes
    const namespaceBytes = parseUUID(NAMESPACE_UUID);
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    const emailBytes = new TextEncoder().encode(normalizedEmail);
    // Combine namespace and email
    const combined = new Uint8Array(namespaceBytes.length + emailBytes.length);
    combined.set(namespaceBytes);
    combined.set(emailBytes, namespaceBytes.length);
    // Use Web Crypto API for SHA-1 (or fallback)
    // Note: This is a simplified version - for production use a proper UUID v5 library
    // For now, we'll let the backend generate it if this fails
    try {
        // Simple hash-based approach that's deterministic
        let hash = 0;
        for(let i = 0; i < combined.length; i++){
            hash = (hash << 5) - hash + combined[i];
            hash = hash & hash;
        }
        // Convert to UUID-like format
        const hex = Math.abs(hash).toString(16).padStart(32, '0');
        return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-5${hex.substring(13, 16)}-${(parseInt(hex[16], 16) | 0x8).toString(16)}${hex.substring(17, 20)}-${hex.substring(20, 32)}`;
    } catch  {
        // If generation fails, return empty - backend will generate from email
        return '';
    }
}
// Helper to parse UUID string to bytes
function parseUUID(uuid) {
    const clean = uuid.replace(/-/g, '');
    const bytes = new Uint8Array(16);
    for(let i = 0; i < 16; i++){
        bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return bytes;
}
/**
 * Make an API request with automatic token refresh on 401
 */ async function apiRequest(path, options = {}) {
    const { method = "GET", body, retry = true } = options;
    // Tokens are no longer accessed from localStorage
    // The proxy will automatically inject the Authorization header from Redis based on session cookie
    // Generate or retrieve trace ID for request tracking
    const traceId = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : crypto.randomUUID();
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const headers = {
        "Content-Type": "application/json",
        "X-Trace-Id": traceId,
        "X-Request-Id": traceId
    };
    // DO NOT set Authorization header - proxy will inject it from Redis
    // All requests must include credentials to send session cookie
    // Try to get user info from NextAuth session for user identification headers
    // These headers are critical for backend to identify the user
    try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
            const session = await response.json();
            if (session?.user) {
                headers["X-User-Name"] = session.user.name || session.user.email || "Partner User";
                headers["X-User-Role"] = "Applicant";
                if (session.user.email) {
                    headers["X-User-Email"] = session.user.email;
                    // Generate a consistent GUID from email for user identification
                    const userId = generateUserIdFromEmail(session.user.email);
                    headers["X-User-Id"] = userId;
                    console.log('[API] User headers set:', {
                        email: session.user.email,
                        userId,
                        name: headers["X-User-Name"]
                    });
                }
            }
        } else {
            console.warn('[API] Failed to get session:', response.status, response.statusText);
        }
    } catch (error) {
        // Log error but continue - backend will handle missing headers
        console.warn('[API] Error fetching session for user headers:', error);
    }
    const fetchOptions = {
        method,
        headers,
        credentials: "include"
    };
    if (body) {
        fetchOptions.body = JSON.stringify(body);
    }
    // Make initial request
    let response;
    try {
        response = await fetch(`${API_BASE}${path}`, fetchOptions);
    } catch (networkError) {
        // Handle network errors (connection refused, DNS failures, etc.)
        const error = new Error(`Network error: ${networkError instanceof Error ? networkError.message : 'Unknown error'}`);
        error.isNetworkError = true;
        throw error;
    }
    // Handle 401 Unauthorized - redirect to login
    // Token refresh is handled server-side by NextAuth
    if (response.status === 401) {
        if (("TURBOPACK compile-time value", "undefined") !== 'undefined' && !window.location.pathname.startsWith('/auth/')) //TURBOPACK unreachable
        ;
        throw new Error("Session expired. Please sign in again.");
    }
    // Retry logic for network/server errors (5xx), but not 503 (Service Unavailable)
    // 503 means the service isn't running, so retrying won't help
    if (!response.ok && response.status >= 500 && response.status !== 503) {
        const maxRetries = 3;
        for(let attempt = 1; attempt <= maxRetries; attempt++){
            try {
                await new Promise((resolve)=>setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                const retryResponse = await fetch(`${API_BASE}${path}`, fetchOptions);
                if (retryResponse.ok || retryResponse.status < 500) {
                    response = retryResponse;
                    break;
                }
                if (attempt === maxRetries) {
                    response = retryResponse;
                }
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
            }
        }
    }
    if (!response.ok) {
        const text = await response.text().catch(()=>"");
        // 401 already handled above
        // For 503 (Service Unavailable) and 404 (Not Found), mark them for graceful handling
        const error = new Error(`${method} ${path} failed: ${response.status} ${text}`);
        if (response.status === 503) {
            // Mark it as a service unavailable error so callers can handle it gracefully
            error.isServiceUnavailable = true;
        } else if (response.status === 404) {
            // Mark 404 errors so callers can handle them gracefully (e.g., user doesn't exist yet)
            error.isNotFound = true;
        }
        throw error;
    }
    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return {};
}
async function apiGet(path) {
    return apiRequest(path, {
        method: "GET"
    });
}
async function apiPost(path, body) {
    return apiRequest(path, {
        method: "POST",
        body
    });
}
async function apiPut(path, body) {
    return apiRequest(path, {
        method: "PUT",
        body
    });
}
async function apiDelete(path) {
    return apiRequest(path, {
        method: "DELETE"
    });
}
async function getDashboard(partnerId) {
    const qs = partnerId ? `?partnerId=${encodeURIComponent(partnerId)}` : "";
    // Backend route: /api/v1/projections/dashboard
    return apiGet(`/api/v1/projections/dashboard${qs}`);
}
async function findUserCaseByEmail(email) {
    if (!email) return null;
    // Generate partner ID from email to filter cases by ownership
    // Declare outside try block so it's available in catch handlers
    const userPartnerId = generateUserIdFromEmail(email);
    try {
        // Try Projections API first (has more complete data)
        // Filter by both email (searchTerm) and partnerId to ensure ownership
        const params = new URLSearchParams({
            searchTerm: email,
            take: "10"
        }); // Get more results to filter
        if (userPartnerId) {
            params.append('partnerId', userPartnerId);
        }
        const result = await apiGet(`/api/v1/projections/cases?${params.toString()}`);
        // Filter results to ensure they match the user's email and partner ID
        // This provides an extra layer of security in case the API doesn't filter correctly
        const matchingItem = result.items?.find((item)=>{
            const emailMatch = item.applicantEmail?.toLowerCase() === email.toLowerCase();
            const partnerMatch = !userPartnerId || !item.partnerId || item.partnerId.toLowerCase() === userPartnerId.toLowerCase();
            return emailMatch && partnerMatch;
        });
        if (matchingItem) {
            // Map applicantCountry to country if needed
            return {
                caseId: matchingItem.caseId,
                type: matchingItem.type,
                status: matchingItem.status,
                partnerId: matchingItem.partnerId,
                applicantFirstName: matchingItem.applicantFirstName,
                applicantLastName: matchingItem.applicantLastName,
                applicantEmail: matchingItem.applicantEmail,
                country: matchingItem.country || matchingItem.applicantCountry || undefined,
                metadataJson: matchingItem.metadataJson,
                businessLegalName: matchingItem.businessLegalName,
                businessCountryOfRegistration: matchingItem.businessCountryOfRegistration,
                progressPercentage: matchingItem.progressPercentage,
                riskLevel: matchingItem.riskLevel,
                riskScore: matchingItem.riskScore,
                createdAt: matchingItem.createdAt,
                updatedAt: matchingItem.updatedAt,
                assignedTo: matchingItem.assignedTo,
                assignedToName: matchingItem.assignedToName,
                assignedAt: matchingItem.assignedAt
            };
        }
        // Fallback: If not found in projections, try case API directly (for newly created cases)
        // This handles cases that haven't been synced to projections yet
        console.log('Case not found in projections API, trying case API directly...');
        try {
            // Use searchTerm to search for the email, then filter by email on client side
            // The case API searches in case number, name, business name, but not email directly
            // So we'll fetch recent cases and filter by email
            const caseApiResult = await apiGet(`/api/v1/cases?take=50&sortBy=createdAt&sortDirection=desc`);
            // Find case where applicant email matches AND partner ID matches
            const matchingCase = caseApiResult?.items?.find((c)=>{
                const emailMatch = c.applicantEmail?.toLowerCase() === email.toLowerCase();
                const partnerMatch = !userPartnerId || !c.partnerId || c.partnerId.toLowerCase() === userPartnerId.toLowerCase();
                return emailMatch && partnerMatch;
            });
            if (matchingCase) {
                console.log('Found case in case API:', matchingCase.caseNumber);
                return {
                    caseId: matchingCase.caseNumber,
                    type: matchingCase.type,
                    status: matchingCase.status,
                    partnerId: matchingCase.partnerId,
                    applicantFirstName: matchingCase.applicantFirstName,
                    applicantLastName: matchingCase.applicantLastName,
                    applicantEmail: matchingCase.applicantEmail,
                    country: matchingCase.applicantCountry,
                    businessLegalName: matchingCase.businessLegalName,
                    createdAt: matchingCase.createdAt,
                    updatedAt: matchingCase.updatedAt
                };
            }
        } catch (fallbackError) {
            // If fallback also fails, continue to return null
            console.log('Case API fallback also failed:', fallbackError?.message);
        }
        return null;
    } catch (error) {
        // Silently handle service unavailable errors (503) - services may not be running
        if (error?.isServiceUnavailable) {
            // Try case API as fallback even on 503
            try {
                const caseApiResult = await apiGet(`/api/v1/cases?take=50&sortBy=createdAt&sortDirection=desc`);
                const matchingCase = caseApiResult?.items?.find((c)=>{
                    const emailMatch = c.applicantEmail?.toLowerCase() === email.toLowerCase();
                    const partnerMatch = !userPartnerId || !c.partnerId || c.partnerId.toLowerCase() === userPartnerId.toLowerCase();
                    return emailMatch && partnerMatch;
                });
                if (matchingCase) {
                    return {
                        caseId: matchingCase.caseNumber,
                        type: matchingCase.type,
                        status: matchingCase.status,
                        partnerId: matchingCase.partnerId,
                        applicantFirstName: matchingCase.applicantFirstName,
                        applicantLastName: matchingCase.applicantLastName,
                        applicantEmail: matchingCase.applicantEmail,
                        country: matchingCase.applicantCountry,
                        businessLegalName: matchingCase.businessLegalName,
                        createdAt: matchingCase.createdAt,
                        updatedAt: matchingCase.updatedAt
                    };
                }
            } catch (fallbackError) {
            // Ignore fallback errors
            }
            return null;
        }
        // Re-throw other errors
        throw error;
    }
}
async function getCaseById(caseId) {
    if (!caseId) return null;
    try {
        const caseData = await apiGet(`/api/v1/projections/cases/${encodeURIComponent(caseId)}`);
        // Map to UserCase format with metadata
        return {
            caseId: caseData.caseId,
            type: caseData.type,
            status: caseData.status,
            partnerId: caseData.partnerId,
            applicantFirstName: caseData.applicantFirstName,
            applicantLastName: caseData.applicantLastName,
            applicantEmail: caseData.applicantEmail,
            country: caseData.country || caseData.applicantCountry || undefined,
            metadataJson: caseData.metadataJson,
            businessLegalName: caseData.businessLegalName,
            businessCountryOfRegistration: caseData.businessCountryOfRegistration,
            progressPercentage: caseData.progressPercentage,
            riskLevel: caseData.riskLevel,
            riskScore: caseData.riskScore,
            createdAt: caseData.createdAt,
            updatedAt: caseData.updatedAt,
            assignedTo: caseData.assignedTo,
            assignedToName: caseData.assignedToName,
            assignedAt: caseData.assignedAt
        };
    } catch (error) {
        // Silently handle service unavailable errors (503) - services may not be running
        if (error?.isServiceUnavailable || error?.isNotFound) {
            return null;
        }
        // Re-throw other errors
        throw error;
    }
}
async function getMyThreads(page = 1, pageSize = 20) {
    const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize)
    }).toString();
    return apiGet(`${MESSAGING_PREFIX}/messages/threads/my?${qs}`);
}
async function getThreadByApplication(applicationId) {
    // Check if applicationId is a GUID or a case ID (case number)
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let applicationGuid = applicationId;
    // If it's not a GUID, it's likely a case ID (case number), so fetch the GUID from the projections API
    if (!guidRegex.test(applicationId)) {
        try {
            const caseData = await apiGet(`/api/v1/projections/cases/${encodeURIComponent(applicationId)}`);
            if (caseData?.id) {
                applicationGuid = caseData.id;
            } else {
                throw new Error(`Could not find application GUID for case ID: ${applicationId}`);
            }
        } catch (error) {
            console.error('Failed to fetch application GUID from case ID:', error);
            throw new Error(`Invalid application ID: ${applicationId}. Could not resolve to GUID.`);
        }
    }
    return apiGet(`${MESSAGING_PREFIX}/messages/threads/application/${encodeURIComponent(applicationGuid)}`);
}
async function getThreadMessages(threadId, page = 1, pageSize = 50) {
    const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize)
    }).toString();
    return apiGet(`${MESSAGING_PREFIX}/messages/threads/${encodeURIComponent(threadId)}/messages?${qs}`);
}
async function sendMessage(applicationId, content, receiverId, replyToMessageId, attachments) {
    // Check if applicationId is a GUID or a case ID (case number)
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let applicationGuid = applicationId;
    // If it's not a GUID, it's likely a case ID (case number), so fetch the GUID from the projections API
    if (!guidRegex.test(applicationId)) {
        try {
            const caseData = await apiGet(`/api/v1/projections/cases/${encodeURIComponent(applicationId)}`);
            if (caseData?.id) {
                applicationGuid = caseData.id;
            } else {
                throw new Error(`Could not find application GUID for case ID: ${applicationId}`);
            }
        } catch (error) {
            console.error('Failed to fetch application GUID from case ID:', error);
            throw new Error(`Invalid application ID: ${applicationId}. Could not resolve to GUID.`);
        }
    }
    const body = {
        ApplicationId: applicationGuid,
        Content: content
    };
    if (receiverId) body.ReceiverId = receiverId;
    if (replyToMessageId) body.ReplyToMessageId = replyToMessageId;
    if (attachments && attachments.length > 0) {
        body.Attachments = attachments.map((a)=>({
                FileName: a.fileName,
                ContentType: a.contentType,
                FileSizeBytes: a.fileSizeBytes,
                StorageKey: a.storageKey,
                StorageUrl: a.storageUrl,
                DocumentId: a.documentId,
                Description: a.description
            }));
    }
    return apiPost(`${MESSAGING_PREFIX}/messages`, body);
}
async function deleteMessage(messageId) {
    try {
        await apiDelete(`${MESSAGING_PREFIX}/messages/${encodeURIComponent(messageId)}`);
        return {
            success: true
        };
    } catch (error) {
        return {
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Failed to delete message'
        };
    }
}
async function starMessage(messageId) {
    try {
        const response = await apiPut(`${MESSAGING_PREFIX}/messages/${encodeURIComponent(messageId)}/star`);
        return {
            success: response.Success ?? response.success ?? false,
            isStarred: response.IsStarred ?? response.isStarred ?? false,
            errorMessage: response.ErrorMessage
        };
    } catch (error) {
        return {
            success: false,
            isStarred: false,
            errorMessage: error instanceof Error ? error.message : 'Failed to star message'
        };
    }
}
async function archiveThread(threadId, archive = true) {
    try {
        const response = await apiPut(`${MESSAGING_PREFIX}/messages/threads/${encodeURIComponent(threadId)}/archive`, {
            Archive: archive
        });
        return {
            success: response.Success ?? response.success ?? false,
            isArchived: response.IsArchived ?? response.isArchived ?? false,
            errorMessage: response.ErrorMessage
        };
    } catch (error) {
        return {
            success: false,
            isArchived: false,
            errorMessage: error instanceof Error ? error.message : 'Failed to archive thread'
        };
    }
}
async function forwardMessage(messageId, toApplicationId, toReceiverId, additionalContent) {
    try {
        const response = await apiPost(`${MESSAGING_PREFIX}/messages/${encodeURIComponent(messageId)}/forward`, {
            ToApplicationId: toApplicationId,
            ToReceiverId: toReceiverId,
            AdditionalContent: additionalContent
        });
        return {
            success: response.Success ?? response.success ?? false,
            newMessageId: response.NewMessageId ?? response.newMessageId,
            newThreadId: response.NewThreadId ?? response.newThreadId,
            errorMessage: response.ErrorMessage
        };
    } catch (error) {
        return {
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Failed to forward message'
        };
    }
}
async function getUnreadCount() {
    return apiGet(`${MESSAGING_PREFIX}/messages/unread/count`);
}
async function markMessageRead(messageId) {
    return apiPut(`${MESSAGING_PREFIX}/messages/${encodeURIComponent(messageId)}/read`);
}
async function getApplicationSections(applicationId) {
    try {
        // Get case details from projections API or onboarding API
        const app = await apiGet(`/api/v1/projections/cases/${encodeURIComponent(applicationId)}`);
        // If sections are directly available
        if (app?.sections) {
            return app.sections.map((s)=>({
                    id: s.id,
                    title: s.title,
                    fields: s.fields || []
                }));
        }
        // Try to construct sections from checklist items if available
        if (app?.checklist_items && app.checklist_items.length > 0) {
            const categoryMap = new Map();
            app.checklist_items.forEach((item)=>{
                if (!categoryMap.has(item.category)) {
                    categoryMap.set(item.category, {
                        id: `section-${item.category.toLowerCase().replace(/\s+/g, '-')}`,
                        title: item.category,
                        fields: []
                    });
                }
                const section = categoryMap.get(item.category);
                section.fields.push({
                    id: item.id,
                    label: item.requirement,
                    type: 'text',
                    value: item.status
                });
            });
            return Array.from(categoryMap.values());
        }
        // Fallback: return empty array
        return [];
    } catch (error) {
        console.error('Failed to fetch application sections:', error);
        return [];
    }
}
async function getApplicationDocuments(applicationId) {
    try {
        // Convert applicationId to Guid for document service
        // Try to fetch documents by caseId
        const documents = await apiGet(`/documents/v1/api/v1/documents/list/${encodeURIComponent(applicationId)}`);
        if (Array.isArray(documents)) {
            return documents.map((doc)=>({
                    id: doc.id,
                    name: doc.fileName || doc.documentNumber || 'Document',
                    type: doc.type || 'unknown',
                    status: 'uploaded',
                    fileName: doc.fileName,
                    createdAt: doc.createdAt
                }));
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch application documents:', error);
        // Try alternative endpoint format
        try {
            const caseData = await apiGet(`/api/v1/projections/cases/${encodeURIComponent(applicationId)}`);
            if (caseData?.documents) {
                return caseData.documents;
            }
        } catch (e) {
            console.error('Alternative document fetch failed:', e);
        }
        return [];
    }
}
async function getUserProfile() {
    try {
        // Try authentication service first
        const profile = await apiGet('/api/users/me');
        return profile;
    } catch (error) {
        // Don't log 503 or 404 errors - services may not be running or user may not exist yet
        if (!error?.isServiceUnavailable && !error?.isNotFound) {
            console.error('Failed to fetch user profile from auth service:', error);
        }
        // Fallback: try to get from case data
        try {
            const { getAuthUser } = await __turbopack_context__.A("[project]/src/lib/auth/session.ts [app-ssr] (ecmascript, async loader)");
            const user = getAuthUser();
            if (user && user.email) {
                const caseData = await findUserCaseByEmail(user.email);
                if (caseData) {
                    return {
                        id: user.sub || user.email,
                        email: user.email,
                        firstName: user.givenName || user.name?.split(' ')[0] || '',
                        lastName: user.familyName || user.name?.split(' ').slice(1).join(' ') || '',
                        fullName: user.name || '',
                        phone: undefined,
                        country: caseData.country,
                        preferences: undefined
                    };
                }
            }
        } catch (e) {
            // Don't log 503 or 404 errors - services may not be running or user may not exist yet
            if (!e?.isServiceUnavailable && !e?.isNotFound) {
                console.error('Failed to get user from case data:', e);
            }
        }
        // Last resort: return from JWT token
        const { getAuthUser } = await __turbopack_context__.A("[project]/src/lib/auth/session.ts [app-ssr] (ecmascript, async loader)");
        const user = getAuthUser();
        return {
            id: user.sub || user.email || '',
            email: user.email || '',
            firstName: user.givenName || user.name?.split(' ')[0] || '',
            lastName: user.familyName || user.name?.split(' ').slice(1).join(' ') || '',
            fullName: user.name || '',
            preferences: undefined
        };
    }
}
async function getHandlerProfile(userId) {
    if (!userId) return null;
    try {
        // Try to get user profile from authentication service
        const profile = await apiGet(`/api/users/${userId}`);
        return {
            id: profile.id,
            fullName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Unknown User',
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            profileImageUrl: profile.profileImageUrl
        };
    } catch (error) {
        // Don't log 404 or 503 errors - handler may not exist or service unavailable
        if (!error?.isServiceUnavailable && !error?.isNotFound) {
            console.error('Failed to fetch handler profile:', error);
        }
        return null;
    }
}
async function updateUserProfile(updates) {
    try {
        return await apiPut('/api/users/me', updates);
    } catch (error) {
        // If user doesn't exist in backend (404), try to create them or fallback
        if (error?.message?.includes('404')) {
            console.warn('User profile not found in backend. Creating new profile...');
            // For now, we'll just return the updated profile from the request
            // In a full implementation, you might want to POST to create the user first
            const { getAuthUser } = await __turbopack_context__.A("[project]/src/lib/auth/session.ts [app-ssr] (ecmascript, async loader)");
            const user = getAuthUser();
            return {
                id: user?.sub || user?.email || '',
                email: user?.email || '',
                firstName: updates.firstName || user?.givenName || '',
                lastName: updates.lastName || user?.familyName || '',
                middleName: updates.middleName,
                fullName: `${updates.firstName || ''} ${updates.lastName || ''}`.trim() || user?.name || '',
                phone: updates.phone,
                country: updates.country,
                companyName: updates.companyName,
                preferences: updates.preferences
            };
        }
        throw error;
    }
}
async function getNotificationPreferences() {
    try {
        const profile = await getUserProfile();
        return profile.preferences || {
            emailNotifications: true,
            smsNotifications: false,
            statusUpdates: true,
            marketingCommunications: false
        };
    } catch (error) {
        // Don't log 404 or 503 errors - services may not be running or user may not exist yet
        if (!error?.isNotFound && !error?.isServiceUnavailable) {
            console.error('Failed to fetch notification preferences:', error);
        }
        // Return defaults
        return {
            emailNotifications: true,
            smsNotifications: false,
            statusUpdates: true,
            marketingCommunications: false
        };
    }
}
async function updateNotificationPreferences(preferences) {
    try {
        // Update preferences as part of profile
        const currentProfile = await getUserProfile();
        try {
            return await updateUserProfile({
                firstName: currentProfile.firstName || '',
                lastName: currentProfile.lastName || '',
                middleName: currentProfile.middleName,
                phone: currentProfile.phone,
                country: currentProfile.country,
                companyName: currentProfile.companyName,
                preferences
            });
        } catch (error) {
            // If update fails (404 or other), the updateUserProfile will handle the fallback
            // For notification preferences specifically, we can store locally as backup
            if (error?.message?.includes('404')) {
                console.warn('Profile not found in backend. Storing preferences locally...');
                // Store preferences in localStorage as backup
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
                // Return profile with updated preferences
                return {
                    ...currentProfile,
                    preferences
                };
            }
            throw error;
        }
    } catch (error) {
        console.error('Failed to update notification preferences:', error);
        // Still try to store locally
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        throw error;
    }
}
async function changePassword(request) {
    try {
        // Try authentication service endpoint if available
        return await apiPost('/api/users/me/change-password', request);
    } catch (error) {
        console.error('Failed to change password:', error);
        // If endpoint doesn't exist, this would typically go through Keycloak
        throw new Error('Password change not available. Please contact support or use Keycloak directly.');
    }
}
async function downloadUserData() {
    try {
        // Proxy handles authentication - no need for manual token
        const response = await fetch(`${API_BASE}/api/users/me/data-export`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to download user data');
        }
        return await response.blob();
    } catch (error) {
        console.error('Failed to download user data:', error);
        // Fallback: create a simple JSON export
        const profile = await getUserProfile();
        const caseData = await findUserCaseByEmail(profile.email).catch(()=>null);
        const data = {
            profile,
            caseData,
            exportedAt: new Date().toISOString()
        };
        return new Blob([
            JSON.stringify(data, null, 2)
        ], {
            type: 'application/json'
        });
    }
}
async function deleteUserAccount(confirmation) {
    try {
        return await apiPost('/api/users/me/delete', confirmation);
    } catch (error) {
        console.error('Failed to delete account:', error);
        throw new Error('Account deletion failed. Please contact support.');
    }
}
async function getUserCaseSummary() {
    try {
        const { getAuthUser } = await __turbopack_context__.A("[project]/src/lib/auth/session.ts [app-ssr] (ecmascript, async loader)");
        const user = getAuthUser();
        if (!user?.email) return null;
        const caseData = await findUserCaseByEmail(user.email);
        if (!caseData) return null;
        // Get related data
        const [documents, threads] = await Promise.all([
            getApplicationDocuments(caseData.caseId).catch(()=>[]),
            getMyThreads(1, 10).catch(()=>({
                    items: [],
                    totalCount: 0
                }))
        ]);
        return {
            caseId: caseData.caseId,
            applicationData: caseData,
            documents,
            messages: threads.items || [],
            timeline: []
        };
    } catch (error) {
        // Don't log 503 or 404 errors - services may not be running or user may not exist yet
        if (!error?.isServiceUnavailable && !error?.isNotFound) {
            console.error('Failed to get user case summary:', error);
        }
        return null;
    }
}
}),
"[project]/src/lib/signalRService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "signalRService",
    ()=>signalRService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$microsoft$2f$signalr$2f$dist$2f$esm$2f$HubConnection$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@microsoft/signalr/dist/esm/HubConnection.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$microsoft$2f$signalr$2f$dist$2f$esm$2f$HubConnectionBuilder$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@microsoft/signalr/dist/esm/HubConnectionBuilder.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$microsoft$2f$signalr$2f$dist$2f$esm$2f$ILogger$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@microsoft/signalr/dist/esm/ILogger.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/session.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-ssr] (ecmascript)");
;
;
;
class SignalRService {
    connection = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    listeners = new Map();
    async connect() {
        if (this.connection?.state === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$microsoft$2f$signalr$2f$dist$2f$esm$2f$HubConnection$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HubConnectionState"].Connected) {
            return;
        }
        try {
            // Get user info for connection
            const user = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAuthUser"])();
            const userEmail = user.email || "";
            // Generate user ID from email (consistent with backend)
            const userId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateUserIdFromEmail"])(userEmail);
            // Build connection URL directly to backend (bypassing Next.js proxy)
            // Next.js API routes don't support WebSocket connections, so SignalR must connect directly
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
            const hubUrl = `${backendUrl}/api/v1/messages/hub`;
            this.connection = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$microsoft$2f$signalr$2f$dist$2f$esm$2f$HubConnectionBuilder$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HubConnectionBuilder"]().withUrl(hubUrl, {
                // For direct backend connection, we need to handle auth differently
                // The backend will use X-User-Id header for identification
                accessTokenFactory: async ()=>{
                    // Return empty - backend uses headers for user identification
                    return "";
                },
                headers: {
                    'X-User-Email': userEmail,
                    'X-User-Name': user.name || userEmail,
                    'X-User-Role': 'Applicant',
                    'X-User-Id': userId.toString()
                }
            }).withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext)=>{
                    if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
                        return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
                    }
                    return null; // Stop reconnecting
                }
            }).configureLogging(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$microsoft$2f$signalr$2f$dist$2f$esm$2f$ILogger$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LogLevel"].Information).build();
            // Set up event handlers
            this.setupEventHandlers();
            // Start connection
            await this.connection.start();
            console.log('[SignalR] Connected to messaging hub');
            this.reconnectAttempts = 0;
        } catch (error) {
            // SignalR is optional - messaging will work without real-time updates
            console.warn('[SignalR] Connection failed (non-critical):', error);
            console.warn('[SignalR] Messaging will work without real-time updates');
            this.reconnectAttempts++;
        // Don't throw - allow messaging to work without SignalR
        // The connection will remain null and isConnected() will return false
        }
    }
    setupEventHandlers() {
        if (!this.connection) return;
        // Handle new messages
        this.connection.on("ReceiveMessage", (message)=>{
            console.log('[SignalR] Received message:', message);
            this.notifyListeners("ReceiveMessage", message);
        });
        // Handle message sent confirmation
        this.connection.on("MessageSent", (message)=>{
            console.log('[SignalR] Message sent:', message);
            this.notifyListeners("MessageSent", message);
        });
        // Handle message errors
        this.connection.on("MessageError", (error)=>{
            console.error('[SignalR] Message error:', error);
            this.notifyListeners("MessageError", error);
        });
        // Handle typing indicators
        this.connection.on("UserTyping", (data)=>{
            this.notifyListeners("UserTyping", data);
        });
        // Handle message read receipts
        this.connection.on("MessageRead", (messageId)=>{
            this.notifyListeners("MessageRead", messageId);
        });
        // Handle connection state changes
        this.connection.onreconnecting((error)=>{
            console.warn('[SignalR] Reconnecting...', error);
            this.notifyListeners("Reconnecting", error);
        });
        this.connection.onreconnected((connectionId)=>{
            console.log('[SignalR] Reconnected:', connectionId);
            this.notifyListeners("Reconnected", connectionId);
        });
        this.connection.onclose((error)=>{
            console.error('[SignalR] Connection closed:', error);
            this.notifyListeners("ConnectionClosed", error);
        });
    }
    async disconnect() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            this.listeners.clear();
            console.log('[SignalR] Disconnected');
        }
    }
    async joinThread(threadId) {
        if (this.connection?.state === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$microsoft$2f$signalr$2f$dist$2f$esm$2f$HubConnection$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HubConnectionState"].Connected) {
            // Validate threadId is a valid GUID before calling
            if (!threadId || threadId === '00000000-0000-0000-0000-000000000000') {
                console.warn('[SignalR] Invalid threadId provided to JoinThread:', threadId);
                return;
            }
            try {
                // Ensure threadId is a valid GUID string
                const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!guidRegex.test(threadId)) {
                    console.warn('[SignalR] threadId is not a valid GUID:', threadId);
                    return;
                }
                await this.connection.invoke("JoinThread", threadId);
                console.log('[SignalR] Joined thread:', threadId);
            } catch (error) {
                console.error('[SignalR] Failed to join thread:', threadId, error);
                throw error;
            }
        }
    }
    async leaveThread(threadId) {
        if (this.connection?.state === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$microsoft$2f$signalr$2f$dist$2f$esm$2f$HubConnection$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HubConnectionState"].Connected) {
            await this.connection.invoke("LeaveThread", threadId);
        }
    }
    async sendTypingIndicator(threadId) {
        if (this.connection?.state === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$microsoft$2f$signalr$2f$dist$2f$esm$2f$HubConnection$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HubConnectionState"].Connected) {
            await this.connection.invoke("UserTyping", threadId);
        }
    }
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        // Return unsubscribe function
        return ()=>{
            this.listeners.get(event)?.delete(callback);
        };
    }
    notifyListeners(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach((callback)=>{
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[SignalR] Error in listener for ${event}:`, error);
                }
            });
        }
    }
    isConnected() {
        return this.connection?.state === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$microsoft$2f$signalr$2f$dist$2f$esm$2f$HubConnection$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HubConnectionState"].Connected;
    }
    getConnectionState() {
        return this.connection?.state || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$microsoft$2f$signalr$2f$dist$2f$esm$2f$HubConnection$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HubConnectionState"].Disconnected;
    }
}
const signalRService = new SignalRService();
const __TURBOPACK__default__export__ = signalRService;
}),
"[project]/src/lib/documentUpload.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Document Upload Service
 * 
 * According to the backend, files should be uploaded to:
 * - Endpoint: /api/v1/documents/upload (or via proxy /api/proxy/api/v1/documents/upload)
 * - Storage: MinIO object storage (not Google Drive)
 * - Required: CaseId, PartnerId, DocumentType, File (multipart form data)
 * 
 * Note: Files cannot be uploaded until a case is created, so uploads should happen
 * after case creation, not during form filling.
 */ // Helper to generate PartnerId from email using MD5 (matches backend algorithm)
__turbopack_context__.s([
    "DocumentType",
    ()=>DocumentType,
    "mapRequirementCodeToDocumentType",
    ()=>mapRequirementCodeToDocumentType,
    "uploadFileToDocumentService",
    ()=>uploadFileToDocumentService,
    "uploadFilesToDocumentService",
    ()=>uploadFilesToDocumentService
]);
function generatePartnerIdFromEmail(email) {
    if (!email) return '';
    // Normalize email to lowercase (matches backend)
    const normalizedEmail = email.toLowerCase().trim();
    // Use Web Crypto API to generate MD5 hash
    // Note: Web Crypto API doesn't support MD5 directly, so we use a workaround
    // For production, consider using a library like crypto-js or implementing MD5
    // For now, we'll use a simple hash that's deterministic
    let hash = 0;
    for(let i = 0; i < normalizedEmail.length; i++){
        const char = normalizedEmail.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to GUID format (this is a simplified version)
    // In production, use proper MD5 implementation
    const hex = Math.abs(hash).toString(16).padStart(32, '0');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}
// Better implementation using crypto.subtle (SHA-256) and converting to GUID format
// This is more secure but won't match MD5 exactly - for exact match, use crypto-js MD5
async function generatePartnerIdFromEmailMD5(email) {
    if (!email) return '';
    const normalizedEmail = email.toLowerCase().trim();
    // Use crypto.subtle for hashing (SHA-256, then take first 16 bytes for GUID)
    const encoder = new TextEncoder();
    const data = encoder.encode(normalizedEmail);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Take first 16 bytes and format as GUID
    const guidBytes = hashArray.slice(0, 16);
    const hex = guidBytes.map((b)=>b.toString(16).padStart(2, '0')).join('');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}
var DocumentType = /*#__PURE__*/ function(DocumentType) {
    DocumentType[DocumentType["PassportCopy"] = 1] = "PassportCopy";
    DocumentType[DocumentType["DriversLicense"] = 2] = "DriversLicense";
    DocumentType[DocumentType["NationalId"] = 3] = "NationalId";
    DocumentType[DocumentType["ProofOfAddress"] = 4] = "ProofOfAddress";
    DocumentType[DocumentType["BankStatement"] = 5] = "BankStatement";
    DocumentType[DocumentType["TaxDocument"] = 6] = "TaxDocument";
    DocumentType[DocumentType["BusinessRegistration"] = 7] = "BusinessRegistration";
    DocumentType[DocumentType["ArticlesOfIncorporation"] = 8] = "ArticlesOfIncorporation";
    DocumentType[DocumentType["ShareholderRegistry"] = 9] = "ShareholderRegistry";
    DocumentType[DocumentType["FinancialStatements"] = 10] = "FinancialStatements";
    DocumentType[DocumentType["Other"] = 99] = "Other";
    return DocumentType;
}({});
function mapRequirementCodeToDocumentType(requirementCode) {
    const code = requirementCode.toLowerCase();
    if (code.includes('passport')) return 1;
    if (code.includes('drivers') || code.includes('license')) return 2;
    if (code.includes('national_id') || code.includes('nationalid') || code.includes('id_number')) return 3;
    if (code.includes('address') || code.includes('proof_of_address')) return 4;
    if (code.includes('bank') || code.includes('statement')) return 5;
    if (code.includes('tax')) return 6;
    if (code.includes('registration') || code.includes('business_registration')) return 7;
    if (code.includes('articles') || code.includes('incorporation')) return 8;
    if (code.includes('shareholder') || code.includes('share_register')) return 9;
    if (code.includes('financial') || code.includes('statement')) return 10;
    return 99;
}
async function uploadFileToDocumentService(caseId, partnerId, file, documentType = 99, description, uploadedBy) {
    const formData = new FormData();
    // Append file
    formData.append('file', file);
    // Append required fields
    formData.append('caseId', caseId);
    formData.append('partnerId', partnerId);
    formData.append('type', documentType.toString());
    // Append optional fields
    if (description) formData.append('description', description);
    if (uploadedBy) formData.append('uploadedBy', uploadedBy);
    // Upload via proxy to document service
    const response = await fetch('/api/proxy/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
        headers: {
            ...uploadedBy ? {
                'X-User-Email': uploadedBy,
                'X-User-Name': uploadedBy,
                'X-User-Role': 'Applicant'
            } : {}
        }
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Document upload failed: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return {
        documentId: result.documentId || result.id,
        documentNumber: result.documentNumber || '',
        wasDuplicate: result.wasDuplicate || false,
        existingDocumentId: result.existingDocumentId,
        storageKey: result.storageKey || ''
    };
}
async function uploadFilesToDocumentService(caseId, partnerId, files, uploadedBy) {
    const uploadPromises = files.map(async ({ file, requirementCode, description })=>{
        try {
            const documentType = requirementCode ? mapRequirementCodeToDocumentType(requirementCode) : 99;
            const result = await uploadFileToDocumentService(caseId, partnerId, file, documentType, description || file.name, uploadedBy);
            return {
                requirementCode,
                result
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to upload file ${file.name}:`, errorMessage);
            return {
                requirementCode,
                result: {},
                error: errorMessage
            };
        }
    });
    return Promise.all(uploadPromises);
}
}),
"[project]/src/app/partner/messages/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CustomerMessagesPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/box/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$container$2f$container$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/container/container.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/v-stack.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/h-stack.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/text/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/flex/flex.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/button/button.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$image$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/image/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$circle$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/circle/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/session.ts [app-ssr] (ecmascript)");
// Removed mockData import - using real backend data only
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$EnhancedContextualMessaging$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/EnhancedContextualMessaging.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$signalRService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/signalRService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$documentUpload$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/documentUpload.ts [app-ssr] (ecmascript)");
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
const MotionBox = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].create(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"]);
function CustomerMessagesPage() {
    const [currentUserName, setCurrentUserName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("User");
    const [currentUserEmail, setCurrentUserEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(undefined);
    const [conversations, setConversations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [currentConversationId, setCurrentConversationId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [currentApplicationId, setCurrentApplicationId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [threadsPage, setThreadsPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const [threadsPaged, setThreadsPaged] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [messagesPage, setMessagesPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const [hasMoreMessages, setHasMoreMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [unreadTotal, setUnreadTotal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [applicationSections, setApplicationSections] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [applicationDocuments, setApplicationDocuments] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingContext, setLoadingContext] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [signalRConnected, setSignalRConnected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isTyping, setIsTyping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const typingTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const user = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAuthUser"])();
        setCurrentUserName(user.name);
        setCurrentUserEmail(user.email);
    }, []);
    // Initialize SignalR connection
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const initSignalR = async ()=>{
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$signalRService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signalRService"].connect();
                setSignalRConnected(true);
                // Set up event listeners
                const unsubscribeReceive = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$signalRService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signalRService"].on("ReceiveMessage", async (message)=>{
                    console.log('[Partner Messages] Received SignalR message:', message);
                    // Determine if message is from admin or partner based on email domain and sender info
                    const senderNameLower = (message.senderName || '').toLowerCase();
                    const senderEmail = (message.senderEmail || message.senderId || '').toLowerCase();
                    const currentUserEmailLower = (currentUserEmail || '').toLowerCase();
                    // Check if message is from current user
                    const isFromCurrentUser = senderEmail === currentUserEmailLower || senderNameLower === (currentUserName || '').toLowerCase();
                    // Determine if message is from admin
                    const isFromAdmin = senderNameLower.includes('@mukuru.com') || senderEmail.includes('@mukuru.com') || message.senderRole === 'Admin' || message.senderRole === 'ComplianceManager';
                    // If message is for current thread, add it immediately
                    if (currentConversationId && message.threadId === currentConversationId) {
                        const contextualMessage = {
                            id: message.id,
                            senderId: message.senderId,
                            senderName: message.senderName,
                            senderType: isFromAdmin ? 'admin' : 'partner',
                            content: message.content,
                            timestamp: message.sentAt,
                            status: 'sent',
                            priority: 'normal',
                            attachments: message.attachments || [],
                            isRead: false,
                            isStarred: false,
                            tags: [],
                            applicationId: message.applicationId || currentApplicationId || ''
                        };
                        setMessages((prev)=>{
                            // Check if message already exists (avoid duplicates)
                            if (prev.some((m)=>m.id === message.id)) {
                                return prev;
                            }
                            return [
                                ...prev,
                                contextualMessage
                            ].sort((a, b)=>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                        });
                    }
                    // If message is for a different thread but we have it in our list, refresh that thread
                    // Also refresh threads to update last message and unread counts
                    const refreshThreads = async ()=>{
                        try {
                            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMyThreads"])(threadsPage, 20);
                            const items = result.items || [];
                            const mapped = items.map((t)=>({
                                    id: t.id,
                                    applicationId: t.applicationId,
                                    partnerId: currentUserEmail ?? "partner",
                                    subject: t.applicationReference || `Application ${t.applicationId}`,
                                    status: 'active',
                                    priority: 'normal',
                                    lastMessage: t.lastMessage?.content,
                                    lastMessageTime: t.lastMessageAt,
                                    unreadCount: t.unreadCount ?? 0,
                                    tags: [],
                                    createdAt: new Date().toISOString(),
                                    contextSections: []
                                }));
                            setConversations(mapped);
                            // If the message is for the current thread, also reload messages to ensure consistency
                            if (currentConversationId && message.threadId === currentConversationId) {
                                try {
                                    const page = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getThreadMessages"])(currentConversationId, 1, 50);
                                    const items = page.items || [];
                                    const mapped = items.map((m)=>{
                                        const senderNameLower = (m.senderName || '').toLowerCase();
                                        const isFromAdmin = senderNameLower.includes('@mukuru.com') || m.senderRole === 'Admin' || m.senderRole === 'ComplianceManager';
                                        return {
                                            id: m.id,
                                            senderId: m.senderId,
                                            senderName: m.senderName,
                                            senderType: isFromAdmin ? 'admin' : 'partner',
                                            content: m.content,
                                            timestamp: m.sentAt,
                                            status: m.isRead ? 'read' : m.status,
                                            priority: 'normal',
                                            attachments: [],
                                            isRead: m.isRead,
                                            isStarred: false,
                                            tags: [],
                                            applicationId: currentApplicationId || ''
                                        };
                                    });
                                    const sorted = mapped.sort((a, b)=>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                                    setMessages(sorted);
                                } catch (e) {
                                    console.error('Failed to reload messages after SignalR update:', e);
                                }
                            }
                        } catch (e) {
                            console.error('Failed to refresh threads:', e);
                        }
                    };
                    refreshThreads();
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUnreadCount"])().then((r)=>setUnreadTotal(r.count ?? 0)).catch(()=>{});
                });
                const unsubscribeTyping = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$signalRService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signalRService"].on("UserTyping", (data)=>{
                    if (currentConversationId && data.threadId === currentConversationId) {
                        setIsTyping((prev)=>({
                                ...prev,
                                [data.threadId]: {
                                    userName: data.userName
                                }
                            }));
                        // Clear typing indicator after 3 seconds
                        if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                        }
                        typingTimeoutRef.current = setTimeout(()=>{
                            setIsTyping((prev)=>{
                                const updated = {
                                    ...prev
                                };
                                delete updated[data.threadId];
                                return updated;
                            });
                        }, 3000);
                    }
                });
                return ()=>{
                    unsubscribeReceive();
                    unsubscribeTyping();
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$signalRService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signalRService"].disconnect();
                };
            } catch (error) {
                // SignalR is optional - messaging will work without real-time updates
                console.warn('[Partner Messages] SignalR not available (non-critical):', error);
                console.warn('[Partner Messages] Messaging will work without real-time updates');
                setSignalRConnected(false);
            // Continue - messaging page works without SignalR
            }
        };
        initSignalR();
    }, [
        currentConversationId,
        currentUserEmail,
        threadsPage
    ]);
    // Join/leave thread when selection changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (currentConversationId && signalRConnected) {
            // Validate threadId is a valid GUID before joining
            const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (guidRegex.test(currentConversationId) && currentConversationId !== '00000000-0000-0000-0000-000000000000') {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$signalRService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signalRService"].joinThread(currentConversationId).catch((error)=>{
                    console.error('[Partner Messages] Failed to join thread:', error);
                });
                return ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$signalRService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signalRService"].leaveThread(currentConversationId).catch((error)=>{
                        console.error('[Partner Messages] Failed to leave thread:', error);
                    });
                };
            } else {
                console.warn('[Partner Messages] Invalid thread ID, skipping join:', currentConversationId);
            }
        }
    }, [
        currentConversationId,
        signalRConnected
    ]);
    // No mock application usage. Data comes from backend only.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let isMounted = true;
        // Load the user's threads from backend only
        (async ()=>{
            try {
                const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMyThreads"])(threadsPage, 20);
                if (!isMounted) return;
                const items = result.items || [];
                const mapped = items.map((t)=>({
                        id: t.id,
                        applicationId: t.applicationId,
                        partnerId: currentUserEmail ?? "partner",
                        subject: t.applicationReference || `Application ${t.applicationId}`,
                        status: 'active',
                        priority: 'normal',
                        lastMessage: t.lastMessage?.content,
                        lastMessageTime: t.lastMessageAt,
                        unreadCount: t.unreadCount ?? 0,
                        tags: [],
                        createdAt: new Date().toISOString(),
                        contextSections: []
                    }));
                setConversations(mapped);
                setThreadsPaged(result);
                if (mapped.length > 0) {
                    setCurrentConversationId(mapped[0].id);
                    setCurrentApplicationId(mapped[0].applicationId);
                } else if (currentUserEmail) {
                    // If no threads exist, try to get the user's case/application
                    try {
                        const userCase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["findUserCaseByEmail"])(currentUserEmail);
                        if (userCase && userCase.caseId) {
                            setCurrentApplicationId(userCase.caseId);
                            // Try to get thread for this application
                            try {
                                const thread = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getThreadByApplication"])(userCase.caseId);
                                if (thread) {
                                    setCurrentConversationId(thread.id);
                                }
                            } catch (e) {
                                // Thread doesn't exist yet, will be created on first message
                                console.log('No thread exists yet for application, will be created on first message');
                            }
                        }
                    } catch (e) {
                        console.log('Could not find user case:', e);
                    }
                }
            } catch (e) {
                // Log error details for debugging
                console.error('[Messages] Error loading threads:', e);
                if (e instanceof Error) {
                    console.error('[Messages] Error message:', e.message);
                    console.error('[Messages] Error stack:', e.stack);
                }
                // Keep empty state on error
                setConversations([]);
            }
        })();
        return ()=>{
            isMounted = false;
        };
    }, [
        currentUserEmail,
        threadsPage
    ]);
    // Load messages for the selected conversation
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let isMounted = true;
        const load = async ()=>{
            const threadId = currentConversationId;
            if (!threadId) return;
            try {
                const page = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getThreadMessages"])(threadId, messagesPage, 20);
                if (!isMounted) return;
                const items = page.items || [];
                const mapped = items.map((m)=>{
                    // Determine if message is from admin or partner based on email domain, name, and role
                    const senderNameLower = (m.senderName || '').toLowerCase();
                    const senderIdLower = (m.senderId || '').toLowerCase();
                    const currentUserEmailLower = (currentUserEmail || '').toLowerCase();
                    // Check email domain first (most reliable)
                    const hasMukuruEmail = senderNameLower.includes('@mukuru.com') || senderIdLower.includes('@mukuru.com');
                    const hasKurasikaEmail = senderNameLower.includes('@kurasika.com') || senderIdLower.includes('@kurasika.com');
                    // Admin detection: check role first, then email domain, then name patterns
                    const adminNames = [
                        'tendai gatahwa',
                        'tendai',
                        'admin',
                        'compliance',
                        'mukuru'
                    ];
                    // Check if admin by name
                    const isAdminByName = adminNames.some((name)=>senderNameLower.includes(name));
                    // Determine if message is from admin
                    const isFromAdmin = m.senderRole === 'Admin' || m.senderRole === 'ComplianceManager' || hasMukuruEmail || isAdminByName && !hasKurasikaEmail;
                    // For partner view: partner messages are 'partner', admin messages are 'admin'
                    const senderType = isFromAdmin ? 'admin' : 'partner';
                    return {
                        id: m.id,
                        senderId: m.senderId,
                        senderName: m.senderName,
                        senderType: senderType,
                        content: m.content,
                        timestamp: m.sentAt,
                        status: m.isRead ? 'read' : m.status,
                        priority: 'normal',
                        attachments: [],
                        isRead: m.isRead,
                        isStarred: false,
                        tags: [],
                        applicationId: currentApplicationId || ''
                    };
                });
                // Sort by timestamp: oldest first (ascending order)
                const sorted = [
                    ...mapped
                ].sort((a, b)=>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                setMessages((prev)=>{
                    if (messagesPage === 1) {
                        return sorted;
                    } else {
                        // Merge and sort: oldest at top, newest at bottom
                        const merged = [
                            ...prev,
                            ...sorted
                        ];
                        return merged.sort((a, b)=>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                    }
                });
                setHasMoreMessages(page.hasNextPage);
                // Best-effort mark unread as read
                items.filter((m)=>!m.isRead).forEach((m)=>{
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["markMessageRead"])(m.id).catch(()=>{});
                });
            } catch  {
                setMessages([]);
            }
        };
        load();
        // Poll for updates every 5s (only if SignalR is not connected)
        if (!signalRConnected) {
            const id = setInterval(load, 5000);
            return ()=>{
                isMounted = false;
                clearInterval(id);
            };
        }
        return ()=>{
            isMounted = false;
        };
    }, [
        currentConversationId,
        currentApplicationId,
        messagesPage,
        currentUserEmail,
        signalRConnected
    ]);
    // Load application sections and documents when application changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!currentApplicationId) {
            setApplicationSections([]);
            setApplicationDocuments([]);
            setLoadingContext(false);
            return;
        }
        let isMounted = true;
        const loadContext = async ()=>{
            setLoadingContext(true);
            try {
                const [sections, documents] = await Promise.all([
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getApplicationSections"])(currentApplicationId),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getApplicationDocuments"])(currentApplicationId)
                ]);
                if (isMounted) {
                    setApplicationSections(sections);
                    setApplicationDocuments(documents);
                    setLoadingContext(false);
                }
            } catch (error) {
                console.error('Failed to load application context:', error);
                if (isMounted) {
                    setApplicationSections([]);
                    setApplicationDocuments([]);
                    setLoadingContext(false);
                }
            }
        };
        loadContext();
        return ()=>{
            isMounted = false;
        };
    }, [
        currentApplicationId
    ]);
    // Unread total polling
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let active = true;
        const refreshUnread = async ()=>{
            try {
                const r = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUnreadCount"])();
                if (active) setUnreadTotal(r.count ?? 0);
            } catch (error) {
                console.error('[Messages] Failed to refresh unread count:', error);
                if (error instanceof Error) {
                    console.error('[Messages] Error details:', error.message);
                }
            }
        };
        refreshUnread();
        const id = setInterval(refreshUnread, 10000);
        return ()=>{
            active = false;
            clearInterval(id);
        };
    }, []);
    const handleSendMessage = async (content, _context, attachments = [], replyToMessageId)=>{
        if (!content.trim() && attachments.length === 0 || !currentApplicationId) {
            console.warn('Cannot send message: missing applicationId or content');
            return;
        }
        // If no conversation exists yet, we'll create one by sending the message
        // The backend automatically creates a thread when sending the first message
        let threadId = currentConversationId;
        // Upload attachments first if any
        let attachmentInfos = [];
        if (attachments.length > 0) {
            // Upload files to document service and get storage keys/URLs
            try {
                // Get partnerId from user email
                let partnerId = '';
                if (currentUserEmail) {
                    const emailLower = currentUserEmail.toLowerCase();
                    let hash = 0;
                    for(let i = 0; i < emailLower.length; i++){
                        const char = emailLower.charCodeAt(i);
                        hash = (hash << 5) - hash + char;
                        hash = hash & hash;
                    }
                    const hex = Math.abs(hash).toString(16).padStart(32, '0');
                    partnerId = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
                }
                attachmentInfos = await Promise.all(attachments.map(async (file)=>{
                    try {
                        const uploadResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$documentUpload$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uploadFileToDocumentService"])(currentApplicationId, partnerId, file, 99, `Message attachment: ${file.name}`, currentUserEmail);
                        return {
                            fileName: file.name,
                            contentType: file.type || 'application/octet-stream',
                            fileSizeBytes: file.size,
                            storageKey: uploadResult.storageKey,
                            storageUrl: '',
                            documentId: uploadResult.documentId,
                            description: `Message attachment: ${file.name}`
                        };
                    } catch (error) {
                        console.error(`Failed to upload attachment ${file.name}:`, error);
                        // Continue with placeholder if upload fails
                        return {
                            fileName: file.name,
                            contentType: file.type || 'application/octet-stream',
                            fileSizeBytes: file.size,
                            storageKey: `messages/${currentApplicationId}/${Date.now()}-${file.name}`,
                            storageUrl: '',
                            description: undefined
                        };
                    }
                }));
            } catch (error) {
                console.error('Error uploading attachments:', error);
            }
        }
        // Optimistic update
        const optimisticMsg = {
            id: `temp-${Date.now()}`,
            senderId: currentUserEmail ?? 'partner',
            senderName: currentUserName,
            senderType: 'partner',
            content,
            timestamp: new Date().toISOString(),
            status: 'sent',
            priority: 'normal',
            attachments: attachments.map((f, i)=>({
                    id: `${i}`,
                    name: f.name,
                    type: f.type,
                    size: `${f.size}`,
                    url: ''
                })),
            isRead: false,
            isStarred: false,
            tags: [],
            applicationId: currentApplicationId
        };
        setMessages((prev)=>[
                ...prev,
                optimisticMsg
            ].sort((a, b)=>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
        // Attempt to persist via backend
        try {
            const sendResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sendMessage"])(currentApplicationId, content, undefined, replyToMessageId, attachmentInfos.length > 0 ? attachmentInfos : undefined);
            // If we didn't have a conversationId before, get it from the send result or fetch the thread
            if (!threadId && sendResult.threadId) {
                threadId = sendResult.threadId;
                setCurrentConversationId(threadId);
            } else if (!threadId) {
                // Try to get thread by application ID
                try {
                    const thread = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getThreadByApplication"])(currentApplicationId);
                    if (thread) {
                        threadId = thread.id;
                        setCurrentConversationId(threadId);
                    }
                } catch (e) {
                    console.warn('Could not fetch thread after sending message:', e);
                }
            }
            // Refresh messages after successful send to ensure proper sender type detection
            if (threadId) {
                // Wait a bit for SignalR to process, then reload
                setTimeout(async ()=>{
                    try {
                        const page = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getThreadMessages"])(threadId, 1, 50);
                        const items = page.items || [];
                        const mapped = items.map((m)=>{
                            const senderNameLower = (m.senderName || '').toLowerCase();
                            const senderIdLower = (m.senderId || '').toLowerCase();
                            const currentUserEmailLower = currentUserEmail ? currentUserEmail.toLowerCase() : '';
                            // Check if message is from current user (for reference, not used in senderType)
                            // const isFromCurrentUser = senderIdLower === currentUserEmailLower || 
                            //                          senderNameLower === (currentUserName || '').toLowerCase();
                            // Determine if message is from admin
                            const isFromAdmin = senderNameLower.includes('@mukuru.com') || senderIdLower.includes('@mukuru.com') || m.senderRole === 'Admin' || m.senderRole === 'ComplianceManager';
                            // For partner view: partner messages are 'partner', admin messages are 'admin'
                            const senderType = isFromAdmin ? 'admin' : 'partner';
                            return {
                                id: m.id,
                                senderId: m.senderId,
                                senderName: m.senderName,
                                senderType: senderType,
                                content: m.content,
                                timestamp: m.sentAt,
                                status: m.isRead ? 'read' : m.status,
                                priority: 'normal',
                                attachments: [],
                                isRead: m.isRead,
                                isStarred: false,
                                tags: [],
                                applicationId: currentApplicationId
                            };
                        });
                        // Sort and update messages
                        const sorted = mapped.sort((a, b)=>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                        setMessages(sorted);
                        setMessagesPage(1);
                    } catch (error) {
                        console.error('Failed to refresh messages after send:', error);
                    }
                }, 500);
            }
            // Update unread total after send
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUnreadCount"])().then((r)=>setUnreadTotal(r.count ?? 0)).catch(()=>{});
            // Refresh threads to update last message and show new thread if created
            const threadsResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMyThreads"])(threadsPage, 20);
            const threadItems = threadsResult.items || [];
            const updatedThreads = threadItems.map((t)=>({
                    id: t.id,
                    applicationId: t.applicationId,
                    partnerId: currentUserEmail ?? "partner",
                    subject: t.applicationReference || `Application ${t.applicationId}`,
                    status: 'active',
                    priority: 'normal',
                    lastMessage: t.lastMessage?.content,
                    lastMessageTime: t.lastMessageAt,
                    unreadCount: t.unreadCount ?? 0,
                    tags: [],
                    createdAt: new Date().toISOString(),
                    contextSections: []
                }));
            setConversations(updatedThreads);
            // If we just created a new thread, select it
            if (!currentConversationId && threadId) {
                setCurrentConversationId(threadId);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove optimistic message on error
            setMessages((prev)=>prev.filter((m)=>m.id !== optimisticMsg.id));
        // Show error banner would be handled by the component
        }
    };
    const noop = async ()=>{};
    // With fallback above, we always render the designed page
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
        minH: "100vh",
        bg: "gray.50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                bg: "white",
                borderBottom: "1px",
                borderColor: "gray.200",
                py: "4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$container$2f$container$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Container"], {
                    maxW: "7xl",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Flex"], {
                        justify: "space-between",
                        align: "center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                gap: "4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/partner/dashboard",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                            variant: "ghost",
                                            size: "sm",
                                            children: "← Back"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/partner/messages/page.tsx",
                                            lineNumber: 637,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/messages/page.tsx",
                                        lineNumber: 636,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$image$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Image"], {
                                        src: "/mukuru-logo.png",
                                        alt: "Mukuru",
                                        height: "32px"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/messages/page.tsx",
                                        lineNumber: 639,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                        color: "gray.600",
                                        fontSize: "sm",
                                        children: "Messages"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/messages/page.tsx",
                                        lineNumber: 640,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                lineNumber: 635,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                gap: "4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$circle$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Circle"], {
                                    size: "32px",
                                    bg: "orange.500",
                                    color: "white",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "sm",
                                        fontWeight: "bold",
                                        children: "JD"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/messages/page.tsx",
                                        lineNumber: 644,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/partner/messages/page.tsx",
                                    lineNumber: 643,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                lineNumber: 642,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/partner/messages/page.tsx",
                        lineNumber: 634,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/partner/messages/page.tsx",
                    lineNumber: 633,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/partner/messages/page.tsx",
                lineNumber: 632,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                height: "calc(100vh - 80px)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$container$2f$container$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Container"], {
                    maxW: "7xl",
                    flex: "1",
                    display: "flex",
                    flexDirection: "column",
                    py: "4",
                    overflow: "hidden",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MotionBox, {
                            initial: {
                                opacity: 0,
                                y: 20
                            },
                            animate: {
                                opacity: 1,
                                y: 0
                            },
                            transition: {
                                duration: 0.6
                            },
                            mb: "3",
                            flexShrink: 0,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                align: "start",
                                gap: "1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "xl",
                                        fontWeight: "semibold",
                                        color: "gray.900",
                                        children: "Messages"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/messages/page.tsx",
                                        lineNumber: 668,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "xs",
                                        color: "gray.600",
                                        children: "Communicate with our team regarding your application."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/messages/page.tsx",
                                        lineNumber: 669,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                lineNumber: 667,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/partner/messages/page.tsx",
                            lineNumber: 660,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MotionBox, {
                            initial: {
                                opacity: 0,
                                y: 20
                            },
                            animate: {
                                opacity: 1,
                                y: 0
                            },
                            transition: {
                                duration: 0.6,
                                delay: 0.1
                            },
                            flex: "1",
                            display: "flex",
                            overflow: "hidden",
                            minH: "0",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Flex"], {
                                gap: "6",
                                width: "100%",
                                height: "100%",
                                overflow: "hidden",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                        width: "320px",
                                        bg: "white",
                                        borderRadius: "lg",
                                        boxShadow: "sm",
                                        border: "1px",
                                        borderColor: "gray.200",
                                        display: "flex",
                                        flexDirection: "column",
                                        overflow: "hidden",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                p: "3",
                                                borderBottom: "1px",
                                                borderColor: "gray.200",
                                                bg: "gray.50",
                                                flexShrink: 0,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                                    justify: "space-between",
                                                    align: "center",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                            fontSize: "sm",
                                                            fontWeight: "semibold",
                                                            color: "gray.900",
                                                            children: "My Threads"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/partner/messages/page.tsx",
                                                            lineNumber: 698,
                                                            columnNumber: 21
                                                        }, this),
                                                        unreadTotal > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                            px: "2",
                                                            py: "0.5",
                                                            borderRadius: "full",
                                                            bg: "orange.500",
                                                            color: "white",
                                                            fontSize: "2xs",
                                                            fontWeight: "bold",
                                                            minW: "18px",
                                                            textAlign: "center",
                                                            children: unreadTotal
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/partner/messages/page.tsx",
                                                            lineNumber: 700,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/partner/messages/page.tsx",
                                                    lineNumber: 697,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                                lineNumber: 696,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                                align: "stretch",
                                                gap: "1.5",
                                                flex: "1",
                                                overflowY: "auto",
                                                p: "3",
                                                children: conversations.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                    p: "6",
                                                    textAlign: "center",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                            fontSize: "xs",
                                                            color: "gray.500",
                                                            fontWeight: "medium",
                                                            children: "No conversations yet"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/partner/messages/page.tsx",
                                                            lineNumber: 719,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                            fontSize: "2xs",
                                                            color: "gray.400",
                                                            mt: "1",
                                                            children: "Messages will appear here"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/partner/messages/page.tsx",
                                                            lineNumber: 720,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/partner/messages/page.tsx",
                                                    lineNumber: 718,
                                                    columnNumber: 21
                                                }, this) : conversations.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                        p: "3",
                                                        borderRadius: "lg",
                                                        border: "1px solid",
                                                        borderColor: currentConversationId === c.id ? "#3182ce" : "gray.200",
                                                        bg: currentConversationId === c.id ? "blue.50" : "white",
                                                        cursor: "pointer",
                                                        boxShadow: currentConversationId === c.id ? "0 2px 8px rgba(49, 130, 206, 0.15)" : "0 1px 3px rgba(0, 0, 0, 0.05)",
                                                        onClick: ()=>{
                                                            setCurrentConversationId(c.id);
                                                            setCurrentApplicationId(c.applicationId);
                                                            setMessagesPage(1);
                                                        },
                                                        _hover: {
                                                            bg: currentConversationId === c.id ? "blue.50" : "gray.50",
                                                            borderColor: currentConversationId === c.id ? "#3182ce" : "gray.300",
                                                            boxShadow: currentConversationId === c.id ? "0 4px 12px rgba(49, 130, 206, 0.2)" : "0 2px 6px rgba(0, 0, 0, 0.1)",
                                                            transform: "translateY(-1px)"
                                                        },
                                                        transition: "all 0.2s ease",
                                                        position: "relative",
                                                        children: [
                                                            currentConversationId === c.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                                position: "absolute",
                                                                left: "0",
                                                                top: "0",
                                                                bottom: "0",
                                                                width: "3px",
                                                                bg: "#3182ce",
                                                                borderRadius: "lg"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                                                lineNumber: 749,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                                                align: "stretch",
                                                                gap: "2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                                                        justify: "space-between",
                                                                        align: "start",
                                                                        gap: "2",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VStack"], {
                                                                                align: "start",
                                                                                gap: "0.5",
                                                                                flex: "1",
                                                                                minW: "0",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HStack"], {
                                                                                        gap: "1.5",
                                                                                        align: "center",
                                                                                        width: "100%",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                                                                width: "8px",
                                                                                                height: "8px",
                                                                                                borderRadius: "full",
                                                                                                bg: currentConversationId === c.id ? "#3182ce" : "gray.400",
                                                                                                flexShrink: 0
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                                                                                lineNumber: 763,
                                                                                                columnNumber: 33
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                                                                fontSize: "xs",
                                                                                                color: currentConversationId === c.id ? "gray.900" : "gray.800",
                                                                                                fontWeight: currentConversationId === c.id ? "semibold" : "medium",
                                                                                                lineHeight: "1.3",
                                                                                                overflow: "hidden",
                                                                                                textOverflow: "ellipsis",
                                                                                                display: "-webkit-box",
                                                                                                style: {
                                                                                                    WebkitLineClamp: 2,
                                                                                                    WebkitBoxOrient: 'vertical'
                                                                                                },
                                                                                                children: c.subject || `Application ${c.applicationId?.slice(0, 8)}...`
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                                                                                lineNumber: 770,
                                                                                                columnNumber: 33
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/src/app/partner/messages/page.tsx",
                                                                                        lineNumber: 762,
                                                                                        columnNumber: 31
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                                                        fontSize: "2xs",
                                                                                        color: currentConversationId === c.id ? "gray.600" : "gray.500",
                                                                                        ml: "3.5",
                                                                                        children: c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleString('en-US', {
                                                                                            month: 'numeric',
                                                                                            day: 'numeric',
                                                                                            hour: 'numeric',
                                                                                            minute: '2-digit',
                                                                                            hour12: true
                                                                                        }) : 'No messages'
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/partner/messages/page.tsx",
                                                                                        lineNumber: 783,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                                                                lineNumber: 761,
                                                                                columnNumber: 29
                                                                            }, this),
                                                                            c.unreadCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                                                px: "2",
                                                                                py: "0.5",
                                                                                borderRadius: "full",
                                                                                bg: "orange.500",
                                                                                color: "white",
                                                                                fontSize: "2xs",
                                                                                fontWeight: "bold",
                                                                                flexShrink: 0,
                                                                                minW: "20px",
                                                                                textAlign: "center",
                                                                                boxShadow: "0 2px 4px rgba(237, 137, 54, 0.3)",
                                                                                children: c.unreadCount
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                                                                lineNumber: 798,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/partner/messages/page.tsx",
                                                                        lineNumber: 760,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    c.lastMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                                        ml: "3.5",
                                                                        p: "2",
                                                                        bg: currentConversationId === c.id ? "white" : "gray.50",
                                                                        borderRadius: "sm",
                                                                        border: "1px",
                                                                        borderColor: currentConversationId === c.id ? "blue.100" : "gray.100",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                                                                            fontSize: "2xs",
                                                                            color: "gray.600",
                                                                            overflow: "hidden",
                                                                            textOverflow: "ellipsis",
                                                                            whiteSpace: "nowrap",
                                                                            lineHeight: "1.4",
                                                                            children: c.lastMessage
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/partner/messages/page.tsx",
                                                                            lineNumber: 824,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/partner/messages/page.tsx",
                                                                        lineNumber: 816,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                                                lineNumber: 759,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, c.id, true, {
                                                        fileName: "[project]/src/app/partner/messages/page.tsx",
                                                        lineNumber: 724,
                                                        columnNumber: 23
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                                lineNumber: 716,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/partner/messages/page.tsx",
                                        lineNumber: 685,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                        flex: "1",
                                        bg: "white",
                                        borderRadius: "xl",
                                        boxShadow: "sm",
                                        display: "flex",
                                        flexDirection: "column",
                                        overflow: "hidden",
                                        minH: "0",
                                        children: [
                                            hasMoreMessages && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                p: "3",
                                                borderBottom: "1px",
                                                borderColor: "gray.200",
                                                bg: "gray.50",
                                                flexShrink: 0,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                    size: "sm",
                                                    variant: "outline",
                                                    onClick: ()=>setMessagesPage((p)=>p + 1),
                                                    children: "Load older messages"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/partner/messages/page.tsx",
                                                    lineNumber: 857,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                                lineNumber: 856,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Box"], {
                                                flex: "1",
                                                display: "flex",
                                                flexDirection: "column",
                                                overflow: "hidden",
                                                minH: "0",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$EnhancedContextualMessaging$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EnhancedContextualMessaging"], {
                                                    conversations: conversations,
                                                    messages: messages,
                                                    currentConversationId: currentConversationId ?? undefined,
                                                    currentApplicationId: currentApplicationId ?? undefined,
                                                    onSendMessage: handleSendMessage,
                                                    onReplyToMessage: async (messageId, content)=>{
                                                        await handleSendMessage(content, undefined, [], messageId);
                                                    },
                                                    onForwardMessage: async (messageId, toConversationId)=>{
                                                        try {
                                                            const message = messages.find((m)=>m.id === messageId);
                                                            if (!message) return;
                                                            const targetConversation = conversations.find((c)=>c.id === toConversationId);
                                                            if (!targetConversation) {
                                                                alert('Target conversation not found');
                                                                return;
                                                            }
                                                            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardMessage"])(messageId, targetConversation.applicationId);
                                                            if (result.success) {
                                                                alert('Message forwarded successfully');
                                                            } else {
                                                                alert(result.errorMessage || 'Failed to forward message');
                                                            }
                                                        } catch (error) {
                                                            console.error('Failed to forward message:', error);
                                                            alert('Failed to forward message');
                                                        }
                                                    },
                                                    onStarMessage: async (messageId)=>{
                                                        try {
                                                            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["starMessage"])(messageId);
                                                            if (currentConversationId) {
                                                                const page = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getThreadMessages"])(currentConversationId, 1, 50);
                                                                const items = page.items || [];
                                                                const mapped = items.map((m)=>({
                                                                        id: m.id,
                                                                        senderId: m.senderId,
                                                                        senderName: m.senderName,
                                                                        senderType: (()=>{
                                                                            const senderNameLower = (m.senderName || '').toLowerCase();
                                                                            const isFromAdmin = senderNameLower.includes('@mukuru.com') || m.senderRole === 'Admin' || m.senderRole === 'ComplianceManager';
                                                                            return isFromAdmin ? 'admin' : 'partner';
                                                                        })(),
                                                                        content: m.content,
                                                                        timestamp: m.sentAt,
                                                                        status: m.isRead ? 'read' : m.status,
                                                                        priority: 'normal',
                                                                        attachments: [],
                                                                        isRead: m.isRead,
                                                                        isStarred: false,
                                                                        tags: [],
                                                                        applicationId: currentApplicationId
                                                                    }));
                                                                setMessages(mapped.sort((a, b)=>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
                                                            }
                                                        } catch (error) {
                                                            console.error('Failed to star message:', error);
                                                        }
                                                    },
                                                    onArchiveConversation: async (conversationId)=>{
                                                        try {
                                                            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["archiveThread"])(conversationId, true);
                                                            if (result.success) {
                                                                const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMyThreads"])(threadsPage, 20);
                                                                const items = result.items || [];
                                                                const mapped = items.map((t)=>({
                                                                        id: t.id,
                                                                        applicationId: t.applicationId,
                                                                        partnerId: currentUserEmail ?? "partner",
                                                                        subject: t.applicationReference || `Application ${t.applicationId}`,
                                                                        status: 'active',
                                                                        priority: 'normal',
                                                                        lastMessage: t.lastMessage?.content,
                                                                        lastMessageTime: t.lastMessageAt,
                                                                        unreadCount: t.unreadCount ?? 0,
                                                                        tags: [],
                                                                        createdAt: new Date().toISOString(),
                                                                        contextSections: []
                                                                    }));
                                                                setConversations(mapped);
                                                                if (currentConversationId === conversationId) {
                                                                    setCurrentConversationId(null);
                                                                }
                                                            }
                                                        } catch (error) {
                                                            console.error('Failed to archive conversation:', error);
                                                            alert('Failed to archive conversation');
                                                        }
                                                    },
                                                    onAssignConversation: async ()=>{},
                                                    onTagConversation: async ()=>{},
                                                    currentUser: {
                                                        id: currentUserEmail ?? 'partner',
                                                        name: currentUserName,
                                                        type: 'partner'
                                                    },
                                                    applicationSections: applicationSections,
                                                    applicationDocuments: applicationDocuments,
                                                    loadingContext: loadingContext
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/partner/messages/page.tsx",
                                                    lineNumber: 861,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                                lineNumber: 860,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/partner/messages/page.tsx",
                                        lineNumber: 844,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/partner/messages/page.tsx",
                                lineNumber: 683,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/partner/messages/page.tsx",
                            lineNumber: 674,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/partner/messages/page.tsx",
                    lineNumber: 658,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/partner/messages/page.tsx",
                lineNumber: 652,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/partner/messages/page.tsx",
        lineNumber: 630,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=src_03de086c._.js.map