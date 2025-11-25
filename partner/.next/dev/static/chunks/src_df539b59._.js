(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/hooks/useFormPersistence.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useFormPersistence",
    ()=>useFormPersistence
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
function useFormPersistence(initialData, options) {
    _s();
    const { formId, autoSaveInterval = 30000, debounceMs = 1000 } = options;
    const storageKey = `form_${formId}`;
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialData);
    const [isDirty, setIsDirty] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [lastSaved, setLastSaved] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isSaving, setIsSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saveError, setSaveError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Load saved data on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useFormPersistence.useEffect": ()=>{
            try {
                const savedData = localStorage.getItem(storageKey);
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    setFormData(parsed.data);
                    setLastSaved(new Date(parsed.timestamp));
                    setIsDirty(false);
                }
            } catch (error) {
                console.error('Error loading saved form data:', error);
            }
        }
    }["useFormPersistence.useEffect"], [
        storageKey
    ]);
    // Auto-save functionality
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useFormPersistence.useEffect": ()=>{
            if (!isDirty) return;
            const timeoutId = setTimeout({
                "useFormPersistence.useEffect.timeoutId": ()=>{
                    saveToStorage();
                }
            }["useFormPersistence.useEffect.timeoutId"], debounceMs);
            return ({
                "useFormPersistence.useEffect": ()=>clearTimeout(timeoutId)
            })["useFormPersistence.useEffect"];
        }
    }["useFormPersistence.useEffect"], [
        formData,
        isDirty,
        debounceMs
    ]);
    // Periodic auto-save
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useFormPersistence.useEffect": ()=>{
            if (!isDirty) return;
            const intervalId = setInterval({
                "useFormPersistence.useEffect.intervalId": ()=>{
                    saveToStorage();
                }
            }["useFormPersistence.useEffect.intervalId"], autoSaveInterval);
            return ({
                "useFormPersistence.useEffect": ()=>clearInterval(intervalId)
            })["useFormPersistence.useEffect"];
        }
    }["useFormPersistence.useEffect"], [
        isDirty,
        autoSaveInterval
    ]);
    const saveToStorage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useFormPersistence.useCallback[saveToStorage]": async ()=>{
            if (!isDirty) return;
            try {
                setIsSaving(true);
                setSaveError(null);
                const dataToSave = {
                    data: formData,
                    timestamp: new Date().toISOString(),
                    version: '1.0'
                };
                localStorage.setItem(storageKey, JSON.stringify(dataToSave));
                setLastSaved(new Date());
                setIsDirty(false);
            } catch (error) {
                setSaveError('Failed to save form data');
                console.error('Error saving form data:', error);
            } finally{
                setIsSaving(false);
            }
        }
    }["useFormPersistence.useCallback[saveToStorage]"], [
        formData,
        isDirty,
        storageKey
    ]);
    const updateField = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useFormPersistence.useCallback[updateField]": (field, value)=>{
            setFormData({
                "useFormPersistence.useCallback[updateField]": (prev)=>({
                        ...prev,
                        [field]: value
                    })
            }["useFormPersistence.useCallback[updateField]"]);
            setIsDirty(true);
        }
    }["useFormPersistence.useCallback[updateField]"], []);
    const updateNestedField = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useFormPersistence.useCallback[updateNestedField]": (parentField, childField, value)=>{
            setFormData({
                "useFormPersistence.useCallback[updateNestedField]": (prev)=>({
                        ...prev,
                        [parentField]: {
                            ...prev[parentField],
                            [childField]: value
                        }
                    })
            }["useFormPersistence.useCallback[updateNestedField]"]);
            setIsDirty(true);
        }
    }["useFormPersistence.useCallback[updateNestedField]"], []);
    const updateArrayField = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useFormPersistence.useCallback[updateArrayField]": (field, index, value)=>{
            setFormData({
                "useFormPersistence.useCallback[updateArrayField]": (prev)=>({
                        ...prev,
                        [field]: prev[field].map({
                            "useFormPersistence.useCallback[updateArrayField]": (item, i)=>i === index ? value : item
                        }["useFormPersistence.useCallback[updateArrayField]"])
                    })
            }["useFormPersistence.useCallback[updateArrayField]"]);
            setIsDirty(true);
        }
    }["useFormPersistence.useCallback[updateArrayField]"], []);
    const addArrayItem = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useFormPersistence.useCallback[addArrayItem]": (field, item)=>{
            setFormData({
                "useFormPersistence.useCallback[addArrayItem]": (prev)=>({
                        ...prev,
                        [field]: [
                            ...prev[field] || [],
                            item
                        ]
                    })
            }["useFormPersistence.useCallback[addArrayItem]"]);
            setIsDirty(true);
        }
    }["useFormPersistence.useCallback[addArrayItem]"], []);
    const removeArrayItem = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useFormPersistence.useCallback[removeArrayItem]": (field, index)=>{
            setFormData({
                "useFormPersistence.useCallback[removeArrayItem]": (prev)=>({
                        ...prev,
                        [field]: prev[field].filter({
                            "useFormPersistence.useCallback[removeArrayItem]": (_, i)=>i !== index
                        }["useFormPersistence.useCallback[removeArrayItem]"])
                    })
            }["useFormPersistence.useCallback[removeArrayItem]"]);
            setIsDirty(true);
        }
    }["useFormPersistence.useCallback[removeArrayItem]"], []);
    const clearSavedData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useFormPersistence.useCallback[clearSavedData]": ()=>{
            localStorage.removeItem(storageKey);
            setLastSaved(null);
            setIsDirty(false);
        }
    }["useFormPersistence.useCallback[clearSavedData]"], [
        storageKey
    ]);
    const forceSave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useFormPersistence.useCallback[forceSave]": ()=>{
            return saveToStorage();
        }
    }["useFormPersistence.useCallback[forceSave]"], [
        saveToStorage
    ]);
    return {
        formData,
        updateField,
        updateNestedField,
        updateArrayField,
        addArrayItem,
        removeArrayItem,
        isDirty,
        lastSaved,
        isSaving,
        saveError,
        clearSavedData,
        forceSave
    };
}
_s(useFormPersistence, "O4zLTbyy+3UU2kP6Idu6jffVmL4=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/entityFormConfigs.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "entityFormConfigs",
    ()=>entityFormConfigs,
    "getAllEntityTypes",
    ()=>getAllEntityTypes,
    "getEntityFormConfig",
    ()=>getEntityFormConfig
]);
const entityFormConfigs = {
    'private_company': {
        entityType: 'private_company',
        displayName: 'Private Company / Limited Liability Company',
        description: 'Registered companies and corporations',
        steps: [
            {
                id: 'business_info',
                title: 'Business Information',
                subtitle: 'Company details and registration',
                fields: [
                    {
                        id: 'companyName',
                        label: 'Company Name',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter your company name',
                        externalValidation: {
                            enabled: true,
                            apiEndpoint: '/api/validate/company-name',
                            loadingText: 'Validating company name...',
                            successText: 'Company name verified',
                            errorText: 'Company name not found'
                        },
                        order: 1
                    },
                    {
                        id: 'country',
                        label: 'Country',
                        type: 'select',
                        required: true,
                        placeholder: 'Select country',
                        options: [
                            {
                                value: 'South Africa',
                                label: 'South Africa'
                            },
                            {
                                value: 'Kenya',
                                label: 'Kenya'
                            },
                            {
                                value: 'Nigeria',
                                label: 'Nigeria'
                            },
                            {
                                value: 'Ghana',
                                label: 'Ghana'
                            },
                            {
                                value: 'Zimbabwe',
                                label: 'Zimbabwe'
                            },
                            {
                                value: 'Zambia',
                                label: 'Zambia'
                            },
                            {
                                value: 'Tanzania',
                                label: 'Tanzania'
                            },
                            {
                                value: 'Uganda',
                                label: 'Uganda'
                            },
                            {
                                value: 'Rwanda',
                                label: 'Rwanda'
                            },
                            {
                                value: 'Mauritius',
                                label: 'Mauritius'
                            }
                        ],
                        order: 2
                    },
                    {
                        id: 'tradingName',
                        label: 'Trading Name (if different)',
                        type: 'text',
                        required: false,
                        placeholder: 'Enter trading name',
                        order: 3
                    },
                    {
                        id: 'registrationNumber',
                        label: 'Registration Number',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter company registration number',
                        externalValidation: {
                            enabled: true,
                            apiEndpoint: '/api/validate/registration',
                            loadingText: 'Validating registration...',
                            successText: 'Registration verified',
                            errorText: 'Invalid registration number'
                        },
                        order: 4
                    },
                    {
                        id: 'applicantName',
                        label: 'Applicant Full Name',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter your full name',
                        order: 5
                    },
                    {
                        id: 'applicantEmail',
                        label: 'Applicant Email',
                        type: 'email',
                        required: true,
                        placeholder: 'Enter your email address',
                        order: 6
                    },
                    {
                        id: 'taxNumber',
                        label: 'Tax Number',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter tax identification number',
                        externalValidation: {
                            enabled: true,
                            apiEndpoint: '/api/validate/tax-number',
                            loadingText: 'Validating tax number...',
                            successText: 'Tax number verified',
                            errorText: 'Invalid tax number'
                        },
                        order: 7
                    },
                    {
                        id: 'dateOfIncorporation',
                        label: 'Date of Incorporation',
                        type: 'date',
                        required: true,
                        order: 8
                    },
                    {
                        id: 'placeOfIncorporation',
                        label: 'Place of Incorporation',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter place of incorporation',
                        order: 9
                    }
                ],
                requiredDocuments: [
                    'certificate_incorporation',
                    'memorandum_association'
                ]
            },
            {
                id: 'business_address',
                title: 'Business Address',
                subtitle: 'Registered and operating addresses',
                fields: [
                    {
                        id: 'businessAddress',
                        label: 'Registered Business Address',
                        type: 'textarea',
                        required: true,
                        placeholder: 'Enter complete business address',
                        order: 1
                    },
                    {
                        id: 'businessCity',
                        label: 'City',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter city',
                        order: 2
                    },
                    {
                        id: 'businessCountry',
                        label: 'Country',
                        type: 'select',
                        required: true,
                        options: [
                            {
                                value: 'ZA',
                                label: 'South Africa'
                            },
                            {
                                value: 'UK',
                                label: 'United Kingdom'
                            },
                            {
                                value: 'US',
                                label: 'United States'
                            },
                            {
                                value: 'AU',
                                label: 'Australia'
                            },
                            {
                                value: 'CA',
                                label: 'Canada'
                            }
                        ],
                        order: 3
                    },
                    {
                        id: 'businessPostalCode',
                        label: 'Postal Code',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter postal code',
                        order: 4
                    },
                    {
                        id: 'operatingAddress',
                        label: 'Operating Address (if different)',
                        type: 'textarea',
                        required: false,
                        placeholder: 'Enter operating address if different from registered address',
                        conditional: {
                            field: 'businessAddress',
                            operator: 'not_equals',
                            value: ''
                        },
                        order: 5
                    }
                ],
                requiredDocuments: [
                    'proof_address'
                ]
            },
            {
                id: 'ownership_control',
                title: 'Ownership & Control',
                subtitle: 'Shareholders and beneficial owners',
                fields: [
                    {
                        id: 'authorizedCapital',
                        label: 'Authorized Capital',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter authorized capital amount',
                        order: 1
                    },
                    {
                        id: 'issuedCapital',
                        label: 'Issued Capital',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter issued capital amount',
                        order: 2
                    },
                    {
                        id: 'shareholders',
                        label: 'Shareholders',
                        type: 'custom',
                        required: true,
                        description: 'Add all shareholders with 25% or more ownership',
                        order: 3
                    },
                    {
                        id: 'beneficialOwners',
                        label: 'Beneficial Owners',
                        type: 'custom',
                        required: true,
                        description: 'Add all beneficial owners with 25% or more control',
                        order: 4
                    }
                ],
                requiredDocuments: [
                    'shareholder_register',
                    'beneficial_ownership'
                ]
            },
            {
                id: 'directors',
                title: 'Directors',
                subtitle: 'Board of directors and management',
                fields: [
                    {
                        id: 'directors',
                        label: 'Directors',
                        type: 'custom',
                        required: true,
                        description: 'Add all directors and their details',
                        order: 1
                    },
                    {
                        id: 'authorizedSignatory',
                        label: 'Authorized Signatory',
                        type: 'custom',
                        required: true,
                        description: 'Person authorized to sign on behalf of the company',
                        order: 2
                    }
                ],
                requiredDocuments: [
                    'director_ids',
                    'board_resolution'
                ]
            },
            {
                id: 'contact_details',
                title: 'Contact Details',
                subtitle: 'Key personnel and communication',
                fields: [
                    {
                        id: 'businessPhone',
                        label: 'Business Phone',
                        type: 'tel',
                        required: true,
                        placeholder: 'Enter business phone number',
                        order: 1
                    },
                    {
                        id: 'businessEmail',
                        label: 'Business Email',
                        type: 'email',
                        required: true,
                        placeholder: 'Enter business email address',
                        order: 2
                    },
                    {
                        id: 'website',
                        label: 'Website (if applicable)',
                        type: 'url',
                        required: false,
                        placeholder: 'Enter company website',
                        order: 3
                    },
                    {
                        id: 'primaryContact',
                        label: 'Primary Contact Person',
                        type: 'custom',
                        required: true,
                        description: 'Main contact person for this application',
                        order: 4
                    }
                ],
                requiredDocuments: []
            }
        ],
        requiredDocuments: [
            {
                id: 'certificate_incorporation',
                name: 'Certificate of Incorporation',
                description: 'Official certificate of incorporation',
                required: true,
                category: 'legal'
            },
            {
                id: 'memorandum_association',
                name: 'Memorandum of Association',
                description: 'Memorandum and articles of association',
                required: true,
                category: 'legal'
            },
            {
                id: 'proof_address',
                name: 'Proof of Business Address',
                description: 'Document proving registered business address',
                required: true,
                category: 'address'
            },
            {
                id: 'shareholder_register',
                name: 'Shareholder Register',
                description: 'Current shareholder register',
                required: true,
                category: 'ownership'
            },
            {
                id: 'beneficial_ownership',
                name: 'Beneficial Ownership Declaration',
                description: 'Declaration of beneficial ownership',
                required: true,
                category: 'ownership'
            },
            {
                id: 'director_ids',
                name: 'Director ID Copies',
                description: 'Copies of ID documents for all directors',
                required: true,
                category: 'identity'
            },
            {
                id: 'board_resolution',
                name: 'Board Resolution',
                description: 'Board resolution authorizing the application',
                required: true,
                category: 'authorization'
            },
            {
                id: 'banking_details',
                name: 'Banking Details',
                description: 'Bank account details and statements',
                required: true,
                category: 'financial'
            },
            {
                id: 'tax_clearance',
                name: 'Tax Clearance Certificate',
                description: 'Valid tax clearance certificate',
                required: false,
                category: 'compliance'
            }
        ]
    },
    'npo': {
        entityType: 'npo',
        displayName: 'Non-Profit Organisation (NPO/NGO/PVO)',
        description: 'Non-profit organizations and charities',
        steps: [
            {
                id: 'organization_info',
                title: 'Organization Information',
                subtitle: 'NPO details and registration',
                fields: [
                    {
                        id: 'organizationName',
                        label: 'Organization Name',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter organization name',
                        order: 1
                    },
                    {
                        id: 'country',
                        label: 'Country',
                        type: 'select',
                        required: true,
                        placeholder: 'Select country',
                        options: [
                            {
                                value: 'South Africa',
                                label: 'South Africa'
                            },
                            {
                                value: 'Kenya',
                                label: 'Kenya'
                            },
                            {
                                value: 'Nigeria',
                                label: 'Nigeria'
                            },
                            {
                                value: 'Ghana',
                                label: 'Ghana'
                            },
                            {
                                value: 'Zimbabwe',
                                label: 'Zimbabwe'
                            },
                            {
                                value: 'Zambia',
                                label: 'Zambia'
                            },
                            {
                                value: 'Tanzania',
                                label: 'Tanzania'
                            },
                            {
                                value: 'Uganda',
                                label: 'Uganda'
                            },
                            {
                                value: 'Rwanda',
                                label: 'Rwanda'
                            },
                            {
                                value: 'Mauritius',
                                label: 'Mauritius'
                            }
                        ],
                        order: 2
                    },
                    {
                        id: 'applicantName',
                        label: 'Applicant Full Name',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter your full name',
                        order: 3
                    },
                    {
                        id: 'applicantEmail',
                        label: 'Applicant Email',
                        type: 'email',
                        required: true,
                        placeholder: 'Enter your email address',
                        order: 4
                    },
                    {
                        id: 'registrationNumber',
                        label: 'NPO Registration Number',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter NPO registration number',
                        externalValidation: {
                            enabled: true,
                            apiEndpoint: '/api/validate/npo-registration',
                            loadingText: 'Validating NPO registration...',
                            successText: 'NPO registration verified',
                            errorText: 'Invalid NPO registration number'
                        },
                        order: 5
                    },
                    {
                        id: 'dateOfRegistration',
                        label: 'Date of Registration',
                        type: 'date',
                        required: true,
                        order: 6
                    },
                    {
                        id: 'organizationType',
                        label: 'Organization Type',
                        type: 'select',
                        required: true,
                        options: [
                            {
                                value: 'npo',
                                label: 'Non-Profit Organisation'
                            },
                            {
                                value: 'ngo',
                                label: 'Non-Governmental Organisation'
                            },
                            {
                                value: 'pvo',
                                label: 'Private Voluntary Organisation'
                            },
                            {
                                value: 'charity',
                                label: 'Charity'
                            },
                            {
                                value: 'foundation',
                                label: 'Foundation'
                            }
                        ],
                        order: 7
                    }
                ],
                requiredDocuments: [
                    'npo_certificate',
                    'constitution'
                ]
            },
            {
                id: 'governance',
                title: 'Governance Structure',
                subtitle: 'Trustees and management structure',
                fields: [
                    {
                        id: 'trustees',
                        label: 'Trustees/Board Members',
                        type: 'custom',
                        required: true,
                        description: 'Add all trustees and board members',
                        order: 1
                    },
                    {
                        id: 'executiveDirector',
                        label: 'Executive Director',
                        type: 'custom',
                        required: true,
                        description: 'Executive director details',
                        order: 2
                    },
                    {
                        id: 'authorizedSignatory',
                        label: 'Authorized Signatory',
                        type: 'custom',
                        required: true,
                        description: 'Person authorized to sign on behalf of the organization',
                        order: 3
                    }
                ],
                requiredDocuments: [
                    'trustee_ids',
                    'board_resolution'
                ]
            },
            {
                id: 'activities',
                title: 'Activities & Mission',
                subtitle: 'Organization activities and objectives',
                fields: [
                    {
                        id: 'missionStatement',
                        label: 'Mission Statement',
                        type: 'textarea',
                        required: true,
                        placeholder: 'Describe your organization\'s mission',
                        order: 1
                    },
                    {
                        id: 'mainActivities',
                        label: 'Main Activities',
                        type: 'textarea',
                        required: true,
                        placeholder: 'Describe your main activities',
                        order: 2
                    },
                    {
                        id: 'targetBeneficiaries',
                        label: 'Target Beneficiaries',
                        type: 'textarea',
                        required: true,
                        placeholder: 'Describe your target beneficiaries',
                        order: 3
                    }
                ],
                requiredDocuments: []
            },
            {
                id: 'financial_info',
                title: 'Financial Information',
                subtitle: 'Financial details and funding',
                fields: [
                    {
                        id: 'annualBudget',
                        label: 'Annual Budget',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter annual budget amount',
                        order: 1
                    },
                    {
                        id: 'fundingSources',
                        label: 'Main Funding Sources',
                        type: 'textarea',
                        required: true,
                        placeholder: 'Describe your main funding sources',
                        order: 2
                    },
                    {
                        id: 'bankingDetails',
                        label: 'Banking Details',
                        type: 'custom',
                        required: true,
                        description: 'Bank account details for the organization',
                        order: 3
                    }
                ],
                requiredDocuments: [
                    'financial_statements',
                    'banking_details'
                ]
            }
        ],
        requiredDocuments: [
            {
                id: 'npo_certificate',
                name: 'NPO Registration Certificate',
                description: 'Official NPO registration certificate',
                required: true,
                category: 'legal'
            },
            {
                id: 'constitution',
                name: 'Constitution',
                description: 'Organization constitution or governing document',
                required: true,
                category: 'legal'
            },
            {
                id: 'trustee_ids',
                name: 'Trustee ID Copies',
                description: 'Copies of ID documents for all trustees',
                required: true,
                category: 'identity'
            },
            {
                id: 'board_resolution',
                name: 'Board Resolution',
                description: 'Board resolution authorizing the application',
                required: true,
                category: 'authorization'
            },
            {
                id: 'financial_statements',
                name: 'Financial Statements',
                description: 'Recent audited financial statements',
                required: true,
                category: 'financial'
            },
            {
                id: 'banking_details',
                name: 'Banking Details',
                description: 'Bank account details and statements',
                required: true,
                category: 'financial'
            }
        ]
    },
    'government': {
        entityType: 'government',
        displayName: 'Government / State Owned Entity',
        description: 'Government departments and state-owned entities',
        steps: [
            {
                id: 'entity_info',
                title: 'Entity Information',
                subtitle: 'Government entity details',
                fields: [
                    {
                        id: 'entityName',
                        label: 'Entity Name',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter entity name',
                        order: 1
                    },
                    {
                        id: 'country',
                        label: 'Country',
                        type: 'select',
                        required: true,
                        placeholder: 'Select country',
                        options: [
                            {
                                value: 'South Africa',
                                label: 'South Africa'
                            },
                            {
                                value: 'Kenya',
                                label: 'Kenya'
                            },
                            {
                                value: 'Nigeria',
                                label: 'Nigeria'
                            },
                            {
                                value: 'Ghana',
                                label: 'Ghana'
                            },
                            {
                                value: 'Zimbabwe',
                                label: 'Zimbabwe'
                            },
                            {
                                value: 'Zambia',
                                label: 'Zambia'
                            },
                            {
                                value: 'Tanzania',
                                label: 'Tanzania'
                            },
                            {
                                value: 'Uganda',
                                label: 'Uganda'
                            },
                            {
                                value: 'Rwanda',
                                label: 'Rwanda'
                            },
                            {
                                value: 'Mauritius',
                                label: 'Mauritius'
                            }
                        ],
                        order: 2
                    },
                    {
                        id: 'applicantName',
                        label: 'Applicant Full Name',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter your full name',
                        order: 3
                    },
                    {
                        id: 'applicantEmail',
                        label: 'Applicant Email',
                        type: 'email',
                        required: true,
                        placeholder: 'Enter your email address',
                        order: 4
                    },
                    {
                        id: 'entityType',
                        label: 'Entity Type',
                        type: 'select',
                        required: true,
                        options: [
                            {
                                value: 'department',
                                label: 'Government Department'
                            },
                            {
                                value: 'ministry',
                                label: 'Ministry'
                            },
                            {
                                value: 'agency',
                                label: 'Government Agency'
                            },
                            {
                                value: 'soe',
                                label: 'State-Owned Enterprise'
                            },
                            {
                                value: 'municipality',
                                label: 'Municipality'
                            }
                        ],
                        order: 5
                    },
                    {
                        id: 'registrationNumber',
                        label: 'Government Registration Number',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter government registration number',
                        order: 6
                    },
                    {
                        id: 'jurisdiction',
                        label: 'Jurisdiction',
                        type: 'text',
                        required: true,
                        placeholder: 'Enter jurisdiction (e.g., National, Provincial, Local)',
                        order: 7
                    }
                ],
                requiredDocuments: [
                    'government_certificate',
                    'establishment_act'
                ]
            },
            {
                id: 'authority',
                title: 'Authority & Authorization',
                subtitle: 'Legal authority and authorization',
                fields: [
                    {
                        id: 'legalBasis',
                        label: 'Legal Basis',
                        type: 'textarea',
                        required: true,
                        placeholder: 'Describe the legal basis for the entity',
                        order: 1
                    },
                    {
                        id: 'authorizedSignatory',
                        label: 'Authorized Signatory',
                        type: 'custom',
                        required: true,
                        description: 'Person authorized to sign on behalf of the entity',
                        order: 2
                    },
                    {
                        id: 'authorityDocument',
                        label: 'Authority Document Reference',
                        type: 'text',
                        required: true,
                        placeholder: 'Reference to the authority document',
                        order: 3
                    }
                ],
                requiredDocuments: [
                    'authority_document',
                    'signatory_authorization'
                ]
            }
        ],
        requiredDocuments: [
            {
                id: 'government_certificate',
                name: 'Government Certificate',
                description: 'Official government certificate or registration',
                required: true,
                category: 'legal'
            },
            {
                id: 'establishment_act',
                name: 'Establishment Act/Statute',
                description: 'Act or statute establishing the entity',
                required: true,
                category: 'legal'
            },
            {
                id: 'authority_document',
                name: 'Authority Document',
                description: 'Document authorizing the entity to operate',
                required: true,
                category: 'authorization'
            },
            {
                id: 'signatory_authorization',
                name: 'Signatory Authorization',
                description: 'Document authorizing the signatory',
                required: true,
                category: 'authorization'
            }
        ]
    }
};
const getEntityFormConfig = (entityType)=>{
    return entityFormConfigs[entityType] || null;
};
const getAllEntityTypes = ()=>{
    return Object.values(entityFormConfigs).map((config)=>({
            value: config.entityType,
            label: config.displayName,
            description: config.description
        }));
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/sweetAlert.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SweetAlert",
    ()=>SweetAlert
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sweetalert2$2f$dist$2f$sweetalert2$2e$all$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sweetalert2/dist/sweetalert2.all.js [app-client] (ecmascript)");
"use client";
;
const SweetAlert = {
    confirm: async (title, text, confirmButtonText = 'Yes', cancelButtonText = 'Cancel', icon = 'question')=>{
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sweetalert2$2f$dist$2f$sweetalert2$2e$all$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].fire({
            title,
            text,
            icon,
            showCancelButton: true,
            confirmButtonText,
            cancelButtonText,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            reverseButtons: true
        });
        return {
            isConfirmed: result.isConfirmed,
            isDenied: result.isDenied,
            isDismissed: result.isDismissed
        };
    },
    success: async (title, text)=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sweetalert2$2f$dist$2f$sweetalert2$2e$all$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].fire({
            title,
            text,
            icon: 'success',
            confirmButtonColor: '#3085d6'
        });
    },
    error: async (title, text)=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sweetalert2$2f$dist$2f$sweetalert2$2e$all$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].fire({
            title,
            text,
            icon: 'error',
            confirmButtonColor: '#d33'
        });
    },
    warning: async (title, text)=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sweetalert2$2f$dist$2f$sweetalert2$2e$all$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].fire({
            title,
            text,
            icon: 'warning',
            confirmButtonColor: '#f59e0b'
        });
    },
    info: async (title, text)=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sweetalert2$2f$dist$2f$sweetalert2$2e$all$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].fire({
            title,
            text,
            icon: 'info',
            confirmButtonColor: '#3085d6'
        });
    },
    loading: (title, text)=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sweetalert2$2f$dist$2f$sweetalert2$2e$all$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].fire({
            title,
            text,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: ()=>{
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sweetalert2$2f$dist$2f$sweetalert2$2e$all$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].showLoading();
            }
        });
    },
    close: ()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sweetalert2$2f$dist$2f$sweetalert2$2e$all$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].close();
    },
    alert: async (title, text, icon = 'info')=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sweetalert2$2f$dist$2f$sweetalert2$2e$all$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].fire({
            title,
            text,
            icon,
            confirmButtonColor: '#3085d6'
        });
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/FileUpload.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FileUpload",
    ()=>FileUpload
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/box/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/v-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/h-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/text/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/icon/icon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/button/button.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$progress$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Progress$3e$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/progress/namespace.js [app-client] (ecmascript) <export * as Progress>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/badge/badge.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$circle$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/circle/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$image$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/image/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fi/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sweetAlert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/sweetAlert.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function FileUpload({ onFileUpload, acceptedTypes = [
    '.pdf',
    '.doc',
    '.docx',
    '.jpg',
    '.jpeg',
    '.png'
], maxSize = 10, multiple = false, label = "Upload Document", description = "Drag and drop files here or click to browse" }) {
    _s();
    const [uploadedFiles, setUploadedFiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isDragOver, setIsDragOver] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const uploadedFilesRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const validateFile = (file)=>{
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
            return `File size must be less than ${maxSize}MB`;
        }
        // Check file type
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(fileExtension)) {
            return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
        }
        return null;
    };
    const handleFileUpload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FileUpload.useCallback[handleFileUpload]": async (file)=>{
            const validationError = validateFile(file);
            if (validationError) {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sweetAlert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SweetAlert"].error('File Validation Error', validationError);
                return;
            }
            const fileId = Math.random().toString(36).substr(2, 9);
            // Create preview URL for image files
            let previewUrl;
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
            const imageTypes = [
                '.jpg',
                '.jpeg',
                '.png',
                '.gif',
                '.webp'
            ];
            if (imageTypes.includes(fileExtension)) {
                previewUrl = URL.createObjectURL(file);
            }
            const uploadedFile = {
                id: fileId,
                file,
                status: 'uploading',
                progress: 0,
                previewUrl
            };
            setUploadedFiles({
                "FileUpload.useCallback[handleFileUpload]": (prev)=>{
                    const newFiles = [
                        ...prev,
                        uploadedFile
                    ];
                    uploadedFilesRef.current = newFiles;
                    return newFiles;
                }
            }["FileUpload.useCallback[handleFileUpload]"]);
            try {
                // Simulate upload progress
                const progressInterval = setInterval({
                    "FileUpload.useCallback[handleFileUpload].progressInterval": ()=>{
                        setUploadedFiles({
                            "FileUpload.useCallback[handleFileUpload].progressInterval": (prev)=>{
                                const newFiles = prev.map({
                                    "FileUpload.useCallback[handleFileUpload].progressInterval.newFiles": (f)=>f.id === fileId ? {
                                            ...f,
                                            progress: Math.min(f.progress + 10, 90)
                                        } : f
                                }["FileUpload.useCallback[handleFileUpload].progressInterval.newFiles"]);
                                uploadedFilesRef.current = newFiles;
                                return newFiles;
                            }
                        }["FileUpload.useCallback[handleFileUpload].progressInterval"]);
                    }
                }["FileUpload.useCallback[handleFileUpload].progressInterval"], 200);
                // Call the upload function
                const url = await onFileUpload(file);
                clearInterval(progressInterval);
                // Update file status to completed
                setUploadedFiles({
                    "FileUpload.useCallback[handleFileUpload]": (prev)=>{
                        const newFiles = prev.map({
                            "FileUpload.useCallback[handleFileUpload].newFiles": (f)=>f.id === fileId ? {
                                    ...f,
                                    status: 'completed',
                                    progress: 100,
                                    url
                                } : f
                        }["FileUpload.useCallback[handleFileUpload].newFiles"]);
                        uploadedFilesRef.current = newFiles;
                        return newFiles;
                    }
                }["FileUpload.useCallback[handleFileUpload]"]);
            } catch (error) {
                setUploadedFiles({
                    "FileUpload.useCallback[handleFileUpload]": (prev)=>{
                        const newFiles = prev.map({
                            "FileUpload.useCallback[handleFileUpload].newFiles": (f)=>f.id === fileId ? {
                                    ...f,
                                    status: 'error',
                                    error: error instanceof Error ? error.message : 'Upload failed'
                                } : f
                        }["FileUpload.useCallback[handleFileUpload].newFiles"]);
                        uploadedFilesRef.current = newFiles;
                        return newFiles;
                    }
                }["FileUpload.useCallback[handleFileUpload]"]);
            }
        }
    }["FileUpload.useCallback[handleFileUpload]"], [
        onFileUpload,
        maxSize,
        acceptedTypes
    ]);
    const handleDrop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FileUpload.useCallback[handleDrop]": (e)=>{
            e.preventDefault();
            setIsDragOver(false);
            const files = Array.from(e.dataTransfer.files);
            if (multiple) {
                files.forEach(handleFileUpload);
            } else {
                handleFileUpload(files[0]);
            }
        }
    }["FileUpload.useCallback[handleDrop]"], [
        handleFileUpload,
        multiple
    ]);
    const handleDragOver = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FileUpload.useCallback[handleDragOver]": (e)=>{
            e.preventDefault();
            setIsDragOver(true);
        }
    }["FileUpload.useCallback[handleDragOver]"], []);
    const handleDragLeave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FileUpload.useCallback[handleDragLeave]": (e)=>{
            e.preventDefault();
            setIsDragOver(false);
        }
    }["FileUpload.useCallback[handleDragLeave]"], []);
    const handleFileInputChange = (e)=>{
        const files = Array.from(e.target.files || []);
        if (multiple) {
            files.forEach(handleFileUpload);
        } else {
            handleFileUpload(files[0]);
        }
    };
    const removeFile = (fileId)=>{
        setUploadedFiles((prev)=>{
            const fileToRemove = prev.find((f)=>f.id === fileId);
            // Clean up object URL to prevent memory leaks
            if (fileToRemove?.previewUrl) {
                URL.revokeObjectURL(fileToRemove.previewUrl);
            }
            const newFiles = prev.filter((f)=>f.id !== fileId);
            uploadedFilesRef.current = newFiles;
            return newFiles;
        });
    };
    // Clean up object URLs on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FileUpload.useEffect": ()=>{
            return ({
                "FileUpload.useEffect": ()=>{
                    uploadedFilesRef.current.forEach({
                        "FileUpload.useEffect": (file)=>{
                            if (file.previewUrl) {
                                URL.revokeObjectURL(file.previewUrl);
                            }
                        }
                    }["FileUpload.useEffect"]);
                }
            })["FileUpload.useEffect"];
        }
    }["FileUpload.useEffect"], []);
    const getFileIcon = (file)=>{
        const extension = file.name.split('.').pop()?.toLowerCase();
        switch(extension){
            case 'pdf':
                return '📄';
            case 'doc':
            case 'docx':
                return '📝';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
                return '🖼️';
            default:
                return '📁';
        }
    };
    const isImageFile = (file)=>{
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        const imageTypes = [
            '.jpg',
            '.jpeg',
            '.png',
            '.gif',
            '.webp'
        ];
        return imageTypes.includes(extension);
    };
    const getStatusIcon = (status)=>{
        switch(status){
            case 'uploading':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                    as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiUpload"],
                    boxSize: "4"
                }, void 0, false, {
                    fileName: "[project]/src/components/FileUpload.tsx",
                    lineNumber: 233,
                    columnNumber: 16
                }, this);
            case 'completed':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                    as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheck"],
                    boxSize: "4",
                    color: "green.500"
                }, void 0, false, {
                    fileName: "[project]/src/components/FileUpload.tsx",
                    lineNumber: 235,
                    columnNumber: 16
                }, this);
            case 'error':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                    as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiX"],
                    boxSize: "4",
                    color: "red.500"
                }, void 0, false, {
                    fileName: "[project]/src/components/FileUpload.tsx",
                    lineNumber: 237,
                    columnNumber: 16
                }, this);
        }
    };
    const getStatusColor = (status)=>{
        switch(status){
            case 'uploading':
                return 'blue';
            case 'completed':
                return 'green';
            case 'error':
                return 'red';
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
        gap: "4",
        align: "stretch",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                border: "2px dashed",
                borderColor: isDragOver ? "blue.400" : "gray.300",
                borderRadius: "lg",
                p: "8",
                textAlign: "center",
                bg: isDragOver ? "blue.50" : "gray.50",
                cursor: "pointer",
                transition: "all 0.2s",
                _hover: {
                    borderColor: "blue.400",
                    bg: "blue.50"
                },
                onDrop: handleDrop,
                onDragOver: handleDragOver,
                onDragLeave: handleDragLeave,
                onClick: ()=>fileInputRef.current?.click(),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$circle$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                            size: "60px",
                            bg: "blue.100",
                            color: "blue.600",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCloud"],
                                boxSize: "8"
                            }, void 0, false, {
                                fileName: "[project]/src/components/FileUpload.tsx",
                                lineNumber: 275,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/FileUpload.tsx",
                            lineNumber: 274,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                            gap: "2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    fontSize: "lg",
                                    fontWeight: "semibold",
                                    color: "gray.700",
                                    children: label
                                }, void 0, false, {
                                    fileName: "[project]/src/components/FileUpload.tsx",
                                    lineNumber: 279,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    fontSize: "sm",
                                    color: "gray.600",
                                    children: description
                                }, void 0, false, {
                                    fileName: "[project]/src/components/FileUpload.tsx",
                                    lineNumber: 282,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    fontSize: "xs",
                                    color: "gray.500",
                                    children: [
                                        "Max file size: ",
                                        maxSize,
                                        "MB • Accepted: ",
                                        acceptedTypes.join(', ')
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/FileUpload.tsx",
                                    lineNumber: 285,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/FileUpload.tsx",
                            lineNumber: 278,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            colorScheme: "blue",
                            variant: "outline",
                            size: "sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                    as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiUpload"]
                                }, void 0, false, {
                                    fileName: "[project]/src/components/FileUpload.tsx",
                                    lineNumber: 295,
                                    columnNumber: 13
                                }, this),
                                "Choose Files"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/FileUpload.tsx",
                            lineNumber: 290,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/FileUpload.tsx",
                    lineNumber: 273,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/FileUpload.tsx",
                lineNumber: 255,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                ref: fileInputRef,
                type: "file",
                multiple: multiple,
                accept: acceptedTypes.join(','),
                onChange: handleFileInputChange,
                style: {
                    display: 'none'
                }
            }, void 0, false, {
                fileName: "[project]/src/components/FileUpload.tsx",
                lineNumber: 302,
                columnNumber: 7
            }, this),
            uploadedFiles.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                gap: "3",
                align: "stretch",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                        fontSize: "sm",
                        fontWeight: "medium",
                        color: "gray.700",
                        children: [
                            "Uploaded Files (",
                            uploadedFiles.length,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/FileUpload.tsx",
                        lineNumber: 314,
                        columnNumber: 11
                    }, this),
                    uploadedFiles.map((uploadedFile)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            p: "4",
                            border: "1px",
                            borderColor: "gray.200",
                            borderRadius: "md",
                            bg: "white",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                    justify: "space-between",
                                    align: "center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                            gap: "3",
                                            flex: "1",
                                            children: [
                                                uploadedFile.previewUrl && isImageFile(uploadedFile.file) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                    position: "relative",
                                                    w: "60px",
                                                    h: "60px",
                                                    borderRadius: "md",
                                                    overflow: "hidden",
                                                    border: "1px",
                                                    borderColor: "gray.200",
                                                    flexShrink: 0,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$image$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Image"], {
                                                        src: uploadedFile.previewUrl,
                                                        alt: uploadedFile.file.name,
                                                        w: "100%",
                                                        h: "100%",
                                                        objectFit: "cover"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/FileUpload.tsx",
                                                        lineNumber: 341,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/FileUpload.tsx",
                                                    lineNumber: 331,
                                                    columnNumber: 21
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                    fontSize: "lg",
                                                    children: getFileIcon(uploadedFile.file)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/FileUpload.tsx",
                                                    lineNumber: 350,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                    gap: "1",
                                                    align: "start",
                                                    flex: "1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                            fontSize: "sm",
                                                            fontWeight: "medium",
                                                            color: "gray.800",
                                                            children: uploadedFile.file.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/FileUpload.tsx",
                                                            lineNumber: 354,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                            fontSize: "xs",
                                                            color: "gray.500",
                                                            children: [
                                                                (uploadedFile.file.size / 1024 / 1024).toFixed(2),
                                                                " MB"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/FileUpload.tsx",
                                                            lineNumber: 357,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/FileUpload.tsx",
                                                    lineNumber: 353,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                    colorScheme: getStatusColor(uploadedFile.status),
                                                    children: uploadedFile.status
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/FileUpload.tsx",
                                                    lineNumber: 362,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/FileUpload.tsx",
                                            lineNumber: 328,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                            gap: "2",
                                            children: [
                                                getStatusIcon(uploadedFile.status),
                                                uploadedFile.status === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                    size: "xs",
                                                    variant: "ghost",
                                                    colorScheme: "red",
                                                    onClick: ()=>removeFile(uploadedFile.id),
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiX"]
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/FileUpload.tsx",
                                                        lineNumber: 377,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/FileUpload.tsx",
                                                    lineNumber: 371,
                                                    columnNumber: 21
                                                }, this),
                                                uploadedFile.status === 'completed' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                    size: "xs",
                                                    variant: "ghost",
                                                    colorScheme: "green",
                                                    onClick: ()=>removeFile(uploadedFile.id),
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiX"]
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/FileUpload.tsx",
                                                        lineNumber: 388,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/FileUpload.tsx",
                                                    lineNumber: 382,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/FileUpload.tsx",
                                            lineNumber: 367,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/FileUpload.tsx",
                                    lineNumber: 327,
                                    columnNumber: 15
                                }, this),
                                uploadedFile.status === 'uploading' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                    mt: "3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$progress$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Progress$3e$__["Progress"].Root, {
                                            value: uploadedFile.progress,
                                            colorScheme: "blue",
                                            size: "sm",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$progress$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Progress$3e$__["Progress"].Track, {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$progress$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Progress$3e$__["Progress"].Range, {}, void 0, false, {
                                                    fileName: "[project]/src/components/FileUpload.tsx",
                                                    lineNumber: 403,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/FileUpload.tsx",
                                                lineNumber: 402,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/FileUpload.tsx",
                                            lineNumber: 397,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "xs",
                                            color: "gray.500",
                                            mt: "1",
                                            children: [
                                                "Uploading... ",
                                                uploadedFile.progress,
                                                "%"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/FileUpload.tsx",
                                            lineNumber: 406,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/FileUpload.tsx",
                                    lineNumber: 396,
                                    columnNumber: 17
                                }, this),
                                uploadedFile.status === 'error' && uploadedFile.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                    mt: "3",
                                    p: "2",
                                    bg: "red.50",
                                    borderRadius: "md",
                                    border: "1px",
                                    borderColor: "red.200",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                        gap: "2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiAlertCircle"],
                                                color: "red.500",
                                                boxSize: "4"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/FileUpload.tsx",
                                                lineNumber: 416,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                fontSize: "sm",
                                                color: "red.700",
                                                children: uploadedFile.error
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/FileUpload.tsx",
                                                lineNumber: 417,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/FileUpload.tsx",
                                        lineNumber: 415,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/FileUpload.tsx",
                                    lineNumber: 414,
                                    columnNumber: 17
                                }, this),
                                uploadedFile.status === 'completed' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                    mt: "3",
                                    p: "2",
                                    bg: "green.50",
                                    borderRadius: "md",
                                    border: "1px",
                                    borderColor: "green.200",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                        gap: "2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheck"],
                                                color: "green.500",
                                                boxSize: "4"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/FileUpload.tsx",
                                                lineNumber: 428,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                fontSize: "sm",
                                                color: "green.700",
                                                children: "Ready to upload after case creation"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/FileUpload.tsx",
                                                lineNumber: 429,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/FileUpload.tsx",
                                        lineNumber: 427,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/FileUpload.tsx",
                                    lineNumber: 426,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, uploadedFile.id, true, {
                            fileName: "[project]/src/components/FileUpload.tsx",
                            lineNumber: 319,
                            columnNumber: 13
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/FileUpload.tsx",
                lineNumber: 313,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/FileUpload.tsx",
        lineNumber: 253,
        columnNumber: 5
    }, this);
}
_s(FileUpload, "Xh41VbwbVpxs+vwXSHqf2KkhIsM=");
_c = FileUpload;
var _c;
__turbopack_context__.k.register(_c, "FileUpload");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/EnhancedDynamicForm.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// @ts-nocheck
__turbopack_context__.s([
    "EnhancedDynamicForm",
    ()=>EnhancedDynamicForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/box/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/v-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/h-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/text/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/input/input.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$textarea$2f$textarea$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/textarea/textarea.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/button/button.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/simple-grid/simple-grid.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/icon/icon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/badge/badge.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$spinner$2f$spinner$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/spinner/spinner.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$select$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Select$3e$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/select/namespace.js [app-client] (ecmascript) <export * as Select>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$circle$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/circle/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fi/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FileUpload$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/FileUpload.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sweetAlert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/sweetAlert.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function EnhancedDynamicForm({ config, formData, onFieldChange, onStepComplete, currentStep, onNext, onPrevious, onSubmit, isLoading = false, validationErrors = {}, onFilesChange }) {
    _s();
    const [validationStates, setValidationStates] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [customFieldData, setCustomFieldData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    // local banner state instead of Chakra useToast (not available in this build)
    const [banner, setBanner] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Store File objects temporarily (can't be serialized in formData)
    // Key: fieldId, Value: File object
    const fileObjectsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    const currentStepConfig = config.steps[currentStep - 1];
    if (!currentStepConfig) return null;
    const handleFieldChange = async (fieldId, value)=>{
        onFieldChange(fieldId, value);
        // Handle external validation
        const field = currentStepConfig.fields.find((f)=>f.id === fieldId);
        if (field?.externalValidation?.enabled && value) {
            await validateExternalField(fieldId, value, field.externalValidation);
        }
    };
    const validateExternalField = async (fieldId, value, validation)=>{
        setValidationStates((prev)=>({
                ...prev,
                [fieldId]: {
                    isValidating: true,
                    isValid: false,
                    message: validation.loadingText
                }
            }));
        try {
            // Mock external validation - replace with actual API calls
            await new Promise((resolve)=>setTimeout(resolve, 1500));
            // Simulate validation result
            const isValid = Math.random() > 0.3; // 70% success rate for demo
            if (isValid) {
                setValidationStates((prev)=>({
                        ...prev,
                        [fieldId]: {
                            isValidating: false,
                            isValid: true,
                            message: validation.successText,
                            data: {
                                verifiedAt: new Date().toISOString()
                            }
                        }
                    }));
                setBanner({
                    status: 'success',
                    message: validation.successText
                });
                setTimeout(()=>setBanner(null), 3000);
            } else {
                setValidationStates((prev)=>({
                        ...prev,
                        [fieldId]: {
                            isValidating: false,
                            isValid: false,
                            message: validation.errorText
                        }
                    }));
                setBanner({
                    status: 'error',
                    message: validation.errorText
                });
                setTimeout(()=>setBanner(null), 5000);
            }
        } catch (error) {
            setValidationStates((prev)=>({
                    ...prev,
                    [fieldId]: {
                        isValidating: false,
                        isValid: false,
                        message: "Validation service unavailable"
                    }
                }));
        }
    };
    const renderField = (field)=>{
        const value = formData[field.id] || '';
        const error = validationErrors[field.id];
        const validationState = validationStates[field.id];
        // Props for Chakra UI components (Input, Textarea)
        // Note: Using errorBorderColor instead of isInvalid to avoid React warning about DOM props
        const chakraProps = {
            value,
            onChange: (e)=>handleFieldChange(field.id, e.target.value),
            placeholder: field.placeholder,
            required: field.required,
            // Use errorBorderColor for error state instead of isInvalid to avoid React DOM warnings
            ...error ? {
                errorBorderColor: 'red.500',
                borderColor: 'red.500'
            } : {},
            disabled: isLoading,
            bg: 'white',
            color: 'black',
            _placeholder: {
                color: 'gray.400',
                opacity: 1
            },
            sx: {
                // Ensure placeholder is light gray across all browsers
                '&::placeholder': {
                    color: 'gray.400 !important',
                    opacity: '1 !important'
                },
                '&::-webkit-input-placeholder': {
                    color: 'gray.400 !important',
                    opacity: '1 !important'
                },
                '&::-moz-placeholder': {
                    color: 'gray.400 !important',
                    opacity: '1 !important'
                },
                '&:-ms-input-placeholder': {
                    color: 'gray.400 !important',
                    opacity: '1 !important'
                },
                // Ensure input text is black when there's a value
                ...value && {
                    color: '#000000',
                    WebkitTextFillColor: '#000000'
                }
            },
            // Caret color
            style: {
                caretColor: '#000000'
            }
        };
        // Props for native HTML elements (select, checkbox, etc.)
        const nativeProps = {
            value,
            onChange: (e)=>handleFieldChange(field.id, e.target.value),
            placeholder: field.placeholder,
            required: field.required,
            disabled: isLoading
        };
        const fieldElement = (()=>{
            switch(field.type){
                case 'text':
                case 'email':
                case 'tel':
                case 'url':
                case 'number':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                        ...chakraProps,
                        type: field.type
                    }, void 0, false, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 186,
                        columnNumber: 18
                    }, this);
                case 'date':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                        ...chakraProps,
                        type: "date"
                    }, void 0, false, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 189,
                        columnNumber: 18
                    }, this);
                case 'textarea':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$textarea$2f$textarea$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Textarea"], {
                        ...chakraProps,
                        rows: 4
                    }, void 0, false, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 192,
                        columnNumber: 18
                    }, this);
                case 'select':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                            value: value,
                            onChange: (e)=>handleFieldChange(field.id, e.target.value),
                            disabled: isLoading,
                            style: {
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: 6,
                                border: '1px solid var(--chakra-colors-gray-200)',
                                background: 'white',
                                color: '#000000'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "",
                                    children: "Select an option"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                    lineNumber: 203,
                                    columnNumber: 17
                                }, this),
                                field.options?.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: option.value,
                                        disabled: option.disabled,
                                        children: option.label
                                    }, option.value, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 205,
                                        columnNumber: 19
                                    }, this))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 197,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 196,
                        columnNumber: 13
                    }, this);
                case 'checkbox':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "checkbox",
                                checked: !!value,
                                onChange: (e)=>handleFieldChange(field.id, e.target.checked),
                                disabled: isLoading
                            }, void 0, false, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 216,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                children: field.label
                            }, void 0, false, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 222,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 215,
                        columnNumber: 13
                    }, this);
                case 'radio':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                        align: "start",
                        gap: "2",
                        children: field.options?.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "radio",
                                        name: field.id,
                                        value: option.value,
                                        checked: value === option.value,
                                        onChange: (e)=>handleFieldChange(field.id, e.target.value),
                                        disabled: option.disabled
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 231,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        children: option.label
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 239,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, option.value, true, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 230,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 228,
                        columnNumber: 13
                    }, this);
                case 'file':
                    // Handle both legacy string format and new object format
                    const existingFileValue = formData[field.id];
                    const existingFileName = typeof existingFileValue === 'string' ? existingFileValue : existingFileValue?.fileName || '';
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FileUpload$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FileUpload"], {
                        onFileUpload: async (file)=>{
                            // Store File object temporarily (will be uploaded to Document Service after case creation)
                            // File objects can't be serialized, so we store them in a ref
                            fileObjectsRef.current.set(field.id, file);
                            // Notify parent component of file changes
                            if (onFilesChange) {
                                onFilesChange(new Map(fileObjectsRef.current));
                            }
                            // Store file metadata in formData (this can be serialized)
                            // Files will be uploaded to Document Service API after case creation
                            const fileData = {
                                fileName: file.name,
                                fileSize: file.size,
                                fileType: file.type,
                                uploadedAt: new Date().toISOString(),
                                requirementCode: field.id,
                                // Status: 'pending' means file is ready to upload after case creation
                                status: 'pending'
                            };
                            // Store file metadata in formData
                            handleFieldChange(field.id, fileData);
                            console.log('📎 File selected and stored (will upload to Document Service after case creation):', {
                                fieldId: field.id,
                                fileName: fileData.fileName,
                                fileSize: fileData.fileSize,
                                fileType: fileData.fileType,
                                requirementCode: field.id
                            });
                            // Return a placeholder URL for FileUpload component display
                            // In a real implementation, this would show "Ready to upload" or similar
                            return `file://${file.name}`;
                        },
                        acceptedTypes: [
                            '.pdf',
                            '.doc',
                            '.docx',
                            '.jpg',
                            '.jpeg',
                            '.png'
                        ],
                        maxSize: 10,
                        label: field.label,
                        description: field.description || "Upload document"
                    }, void 0, false, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 253,
                        columnNumber: 13
                    }, this);
                case 'custom':
                    return renderCustomField(field);
                default:
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                        ...chakraProps
                    }, void 0, false, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 303,
                        columnNumber: 18
                    }, this);
            }
        })();
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                    fontSize: "sm",
                    fontWeight: "medium",
                    color: "gray.700",
                    mb: "1",
                    children: [
                        field.label,
                        field.externalValidation?.enabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                            as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiExternalLink"],
                            ml: "2",
                            boxSize: "3",
                            color: "blue.500"
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 312,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                    lineNumber: 309,
                    columnNumber: 9
                }, this),
                fieldElement,
                field.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                    fontSize: "xs",
                    color: "gray.600",
                    mt: "1",
                    children: field.description
                }, void 0, false, {
                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                    lineNumber: 319,
                    columnNumber: 11
                }, this),
                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                    fontSize: "xs",
                    color: "red.500",
                    mt: "1",
                    children: error
                }, void 0, false, {
                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                    lineNumber: 325,
                    columnNumber: 11
                }, this),
                validationState && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                    mt: "2",
                    children: validationState.isValidating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                        gap: "2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$spinner$2f$spinner$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Spinner"], {
                                size: "xs",
                                color: "blue.500"
                            }, void 0, false, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 334,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                fontSize: "xs",
                                color: "blue.600",
                                children: validationState.message
                            }, void 0, false, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 335,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 333,
                        columnNumber: 15
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                        gap: "2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                as: validationState.isValid ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheckCircle"] : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiAlertCircle"],
                                boxSize: "3",
                                color: validationState.isValid ? "green.500" : "red.500"
                            }, void 0, false, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 341,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                fontSize: "xs",
                                color: validationState.isValid ? "green.600" : "red.600",
                                children: validationState.message
                            }, void 0, false, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 346,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 340,
                        columnNumber: 15
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                    lineNumber: 331,
                    columnNumber: 11
                }, this)
            ]
        }, field.id, true, {
            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
            lineNumber: 308,
            columnNumber: 7
        }, this);
    };
    const renderCustomField = (field)=>{
        switch(field.id){
            case 'shareholders':
            case 'beneficialOwners':
            case 'directors':
            case 'trustees':
                return renderPersonListField(field);
            case 'authorizedSignatory':
            case 'executiveDirector':
            case 'primaryContact':
                return renderPersonField(field);
            case 'bankingDetails':
                return renderBankingDetailsField(field);
            default:
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$textarea$2f$textarea$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Textarea"], {
                    placeholder: field.placeholder
                }, void 0, false, {
                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                    lineNumber: 374,
                    columnNumber: 16
                }, this);
        }
    };
    const renderPersonListField = (field)=>{
        const people = customFieldData[field.id] || [];
        const addPerson = ()=>{
            const newPerson = {
                id: `person_${Date.now()}`,
                name: '',
                email: '',
                phone: '',
                idNumber: '',
                address: '',
                ownership: field.id === 'shareholders' ? '' : undefined,
                position: field.id === 'directors' ? '' : undefined
            };
            setCustomFieldData((prev)=>({
                    ...prev,
                    [field.id]: [
                        ...people,
                        newPerson
                    ]
                }));
            onFieldChange(field.id, [
                ...people,
                newPerson
            ]);
        };
        const removePerson = (personId)=>{
            const updatedPeople = people.filter((p)=>p.id !== personId);
            setCustomFieldData((prev)=>({
                    ...prev,
                    [field.id]: updatedPeople
                }));
            onFieldChange(field.id, updatedPeople);
        };
        const updatePerson = (personId, fieldName, value)=>{
            const updatedPeople = people.map((p)=>p.id === personId ? {
                    ...p,
                    [fieldName]: value
                } : p);
            setCustomFieldData((prev)=>({
                    ...prev,
                    [field.id]: updatedPeople
                }));
            onFieldChange(field.id, updatedPeople);
        };
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
            gap: "4",
            align: "stretch",
            children: [
                people.map((person, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                        p: "4",
                        border: "1px",
                        borderColor: "gray.200",
                        borderRadius: "md",
                        bg: "gray.50",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                justify: "space-between",
                                mb: "3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "sm",
                                        fontWeight: "medium",
                                        color: "gray.700",
                                        children: [
                                            field.label,
                                            " #",
                                            index + 1
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 426,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        size: "xs",
                                        variant: "ghost",
                                        color: "red.500",
                                        onClick: ()=>removePerson(person.id),
                                        disabled: isLoading,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                            as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiTrash2"]
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                            lineNumber: 436,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 429,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 425,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SimpleGrid"], {
                                columns: {
                                    base: 1,
                                    md: 2
                                },
                                gap: "3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        placeholder: "Full Name",
                                        value: person.name,
                                        onChange: (e)=>updatePerson(person.id, 'name', e.target.value),
                                        disabled: isLoading
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 441,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        placeholder: "Email Address",
                                        type: "email",
                                        value: person.email,
                                        onChange: (e)=>updatePerson(person.id, 'email', e.target.value),
                                        disabled: isLoading
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 447,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        placeholder: "Phone Number",
                                        type: "tel",
                                        value: person.phone,
                                        onChange: (e)=>updatePerson(person.id, 'phone', e.target.value),
                                        disabled: isLoading
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 454,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        placeholder: "ID Number",
                                        value: person.idNumber,
                                        onChange: (e)=>updatePerson(person.id, 'idNumber', e.target.value),
                                        disabled: isLoading
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 461,
                                        columnNumber: 15
                                    }, this),
                                    field.id === 'shareholders' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        placeholder: "Ownership %",
                                        value: person.ownership,
                                        onChange: (e)=>updatePerson(person.id, 'ownership', e.target.value),
                                        disabled: isLoading
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 468,
                                        columnNumber: 17
                                    }, this),
                                    field.id === 'directors' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        placeholder: "Position",
                                        value: person.position,
                                        onChange: (e)=>updatePerson(person.id, 'position', e.target.value),
                                        disabled: isLoading
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 476,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 440,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$textarea$2f$textarea$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Textarea"], {
                                placeholder: "Address",
                                value: person.address,
                                onChange: (e)=>updatePerson(person.id, 'address', e.target.value),
                                mt: "3",
                                rows: 2,
                                disabled: isLoading
                            }, void 0, false, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 485,
                                columnNumber: 13
                            }, this)
                        ]
                    }, person.id, true, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 424,
                        columnNumber: 11
                    }, this)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                    variant: "outline",
                    onClick: addPerson,
                    disabled: isLoading,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                            as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiPlus"],
                            mr: "2"
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 501,
                            columnNumber: 11
                        }, this),
                        "Add ",
                        field.label.slice(0, -1)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                    lineNumber: 496,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
            lineNumber: 422,
            columnNumber: 7
        }, this);
    };
    const renderPersonField = (field)=>{
        const person = customFieldData[field.id] || {
            name: '',
            email: '',
            phone: '',
            position: '',
            idNumber: ''
        };
        const updatePerson = (fieldName, value)=>{
            const updatedPerson = {
                ...person,
                [fieldName]: value
            };
            setCustomFieldData((prev)=>({
                    ...prev,
                    [field.id]: updatedPerson
                }));
            onFieldChange(field.id, updatedPerson);
        };
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
            gap: "3",
            align: "stretch",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SimpleGrid"], {
                    columns: {
                        base: 1,
                        md: 2
                    },
                    gap: "3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                            placeholder: "Full Name",
                            value: person.name,
                            onChange: (e)=>updatePerson('name', e.target.value),
                            disabled: isLoading,
                            bg: "white",
                            color: "gray.800",
                            _placeholder: {
                                color: 'gray.500'
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 529,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                            placeholder: "Email Address",
                            type: "email",
                            value: person.email,
                            onChange: (e)=>updatePerson('email', e.target.value),
                            disabled: isLoading,
                            bg: "white",
                            color: "gray.800",
                            _placeholder: {
                                color: 'gray.500'
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 538,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                            placeholder: "Phone Number",
                            type: "tel",
                            value: person.phone,
                            onChange: (e)=>updatePerson('phone', e.target.value),
                            disabled: isLoading,
                            bg: "white",
                            color: "gray.800",
                            _placeholder: {
                                color: 'gray.500'
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 548,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                            placeholder: "Position/Title",
                            value: person.position,
                            onChange: (e)=>updatePerson('position', e.target.value),
                            disabled: isLoading,
                            bg: "white",
                            color: "gray.800",
                            _placeholder: {
                                color: 'gray.500'
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 558,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                    lineNumber: 528,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                    placeholder: "ID Number",
                    value: person.idNumber,
                    onChange: (e)=>updatePerson('idNumber', e.target.value),
                    disabled: isLoading,
                    bg: "white",
                    color: "gray.800",
                    _placeholder: {
                        color: 'gray.500'
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                    lineNumber: 568,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
            lineNumber: 527,
            columnNumber: 7
        }, this);
    };
    const renderBankingDetailsField = (field)=>{
        const banking = customFieldData[field.id] || {
            bankName: '',
            accountNumber: '',
            accountType: '',
            branchCode: '',
            accountHolder: ''
        };
        const updateBanking = (fieldName, value)=>{
            const updatedBanking = {
                ...banking,
                [fieldName]: value
            };
            setCustomFieldData((prev)=>({
                    ...prev,
                    [field.id]: updatedBanking
                }));
            onFieldChange(field.id, updatedBanking);
        };
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
            gap: "3",
            align: "stretch",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SimpleGrid"], {
                    columns: {
                        base: 1,
                        md: 2
                    },
                    gap: "3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                            placeholder: "Bank Name",
                            value: banking.bankName,
                            onChange: (e)=>updateBanking('bankName', e.target.value),
                            disabled: isLoading,
                            bg: "white",
                            color: "gray.800",
                            _placeholder: {
                                color: 'gray.500'
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 602,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                            placeholder: "Account Number",
                            value: banking.accountNumber,
                            onChange: (e)=>updateBanking('accountNumber', e.target.value),
                            disabled: isLoading,
                            bg: "white",
                            color: "gray.800",
                            _placeholder: {
                                color: 'gray.500'
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 611,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                            placeholder: "Branch Code",
                            value: banking.branchCode,
                            onChange: (e)=>updateBanking('branchCode', e.target.value),
                            disabled: isLoading,
                            bg: "white",
                            color: "gray.800",
                            _placeholder: {
                                color: 'gray.500'
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 620,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$select$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Select$3e$__["Select"], {
                            placeholder: "Account Type",
                            value: banking.accountType,
                            onChange: (e)=>updateBanking('accountType', e.target.value),
                            disabled: isLoading,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "current",
                                    children: "Current Account"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                    lineNumber: 635,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "savings",
                                    children: "Savings Account"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                    lineNumber: 636,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "business",
                                    children: "Business Account"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                    lineNumber: 637,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 629,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                    lineNumber: 601,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$input$2f$input$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                    placeholder: "Account Holder Name",
                    value: banking.accountHolder,
                    onChange: (e)=>updateBanking('accountHolder', e.target.value),
                    disabled: isLoading,
                    bg: "white",
                    color: "gray.800",
                    _placeholder: {
                        color: 'gray.500'
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                    lineNumber: 640,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
            lineNumber: 600,
            columnNumber: 7
        }, this);
    };
    const isStepComplete = ()=>{
        // Validate based ONLY on the fields from entity configuration that are displayed in this step
        const requiredFields = currentStepConfig.fields.filter((field)=>field.required);
        const missingFields = requiredFields.filter((field)=>{
            const value = formData[field.id];
            // Check for undefined, null, empty string, or whitespace-only strings
            if (value === undefined || value === null || value === '') {
                return true;
            }
            // For strings, check if they're just whitespace
            if (typeof value === 'string' && value.trim() === '') {
                return true;
            }
            // For arrays, check if they're empty
            if (Array.isArray(value) && value.length === 0) {
                return true;
            }
            return false;
        });
        if (missingFields.length > 0) {
            console.log('Step not complete - missing required fields from entity configuration:', {
                currentStep: currentStep,
                stepId: currentStepConfig.id,
                stepTitle: currentStepConfig.title,
                totalFieldsInStep: currentStepConfig.fields.length,
                requiredFieldsInStep: requiredFields.length,
                missingFields: missingFields.map((f)=>({
                        id: f.id,
                        label: f.label,
                        currentValue: formData[f.id],
                        valueType: typeof formData[f.id]
                    })),
                allFieldsInStep: currentStepConfig.fields.map((f)=>({
                        id: f.id,
                        label: f.label,
                        required: f.required,
                        hasValue: !!(formData[f.id] && (typeof formData[f.id] !== 'string' || formData[f.id].trim() !== ''))
                    }))
            });
        }
        return missingFields.length === 0;
    };
    const getStepProgress = ()=>{
        const totalFields = currentStepConfig.fields.length;
        const completedFields = currentStepConfig.fields.filter((field)=>{
            const value = formData[field.id];
            return value !== undefined && value !== null && value !== '';
        }).length;
        return completedFields / totalFields * 100;
    };
    const getOverallWizardProgress = ()=>{
        let totalCompletedSteps = 0;
        let totalStepsProgress = 0;
        config.steps.forEach((step, index)=>{
            const stepNumber = index + 1;
            if (stepNumber < currentStep) {
                // Completed steps
                totalCompletedSteps++;
                totalStepsProgress += 100;
            } else if (stepNumber === currentStep) {
                // Current step - add partial progress
                totalStepsProgress += getStepProgress();
            }
        // Future steps contribute 0
        });
        return {
            completedSteps: totalCompletedSteps,
            totalSteps: config.steps.length,
            percentage: totalStepsProgress / config.steps.length
        };
    };
    const overallProgress = getOverallWizardProgress();
    const nextStep = currentStep < config.steps.length ? config.steps[currentStep] : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
        children: [
            banner && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                mb: "4",
                p: "3",
                borderRadius: "md",
                bg: banner.status === 'success' ? 'green.50' : 'red.50',
                border: "1px",
                borderColor: banner.status === 'success' ? 'green.200' : 'red.200',
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                    fontSize: "sm",
                    color: banner.status === 'success' ? 'green.700' : 'red.700',
                    children: banner.message
                }, void 0, false, {
                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                    lineNumber: 739,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                lineNumber: 738,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                mb: "6",
                p: "5",
                bgGradient: "linear(to-r, blue.50, indigo.50)",
                borderRadius: "xl",
                border: "1px",
                borderColor: "blue.200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "4",
                    align: "stretch",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            justify: "space-between",
                            align: "center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                    align: "start",
                                    gap: "1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "lg",
                                            fontWeight: "bold",
                                            color: "gray.800",
                                            children: "Application Progress"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                            lineNumber: 749,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "sm",
                                            color: "gray.600",
                                            children: [
                                                overallProgress.completedSteps,
                                                " of ",
                                                overallProgress.totalSteps,
                                                " steps completed"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                            lineNumber: 752,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                    lineNumber: 748,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                    colorScheme: "blue",
                                    variant: "solid",
                                    fontSize: "md",
                                    px: "3",
                                    py: "1",
                                    borderRadius: "full",
                                    children: [
                                        Math.round(overallProgress.percentage),
                                        "% Complete"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                    lineNumber: 756,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 747,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                h: "3",
                                bg: "gray.200",
                                borderRadius: "full",
                                overflow: "hidden",
                                position: "relative",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                    h: "100%",
                                    bgGradient: "linear(to-r, blue.500, blue.600)",
                                    width: `${overallProgress.percentage}%`,
                                    borderRadius: "full",
                                    transition: "width 0.5s ease-in-out"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                    lineNumber: 764,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 763,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 762,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            mt: "2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                gap: "2",
                                flexWrap: "wrap",
                                children: config.steps.map((step, index)=>{
                                    const stepNumber = index + 1;
                                    const isCompleted = stepNumber < currentStep;
                                    const isCurrent = stepNumber === currentStep;
                                    const isUpcoming = stepNumber > currentStep;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                        flex: "1",
                                        minW: "120px",
                                        p: "3",
                                        borderRadius: "md",
                                        border: "2px",
                                        borderColor: isCompleted ? "green.400" : isCurrent ? "blue.500" : "gray.200",
                                        bg: isCompleted ? "green.50" : isCurrent ? "blue.50" : "white",
                                        position: "relative",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                            gap: "2",
                                            align: "center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$circle$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                                                    size: "24px",
                                                    bg: isCompleted ? "green.500" : isCurrent ? "blue.500" : "gray.300",
                                                    color: "white",
                                                    fontWeight: "bold",
                                                    fontSize: "xs",
                                                    children: isCompleted ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheckCircle"],
                                                        boxSize: "3"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                                        lineNumber: 816,
                                                        columnNumber: 27
                                                    }, this) : stepNumber
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                                    lineNumber: 804,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                    align: "start",
                                                    gap: "0",
                                                    flex: "1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                            fontSize: "xs",
                                                            fontWeight: isCurrent ? "bold" : "medium",
                                                            color: isCompleted ? "green.700" : isCurrent ? "blue.700" : "gray.600",
                                                            noOfLines: 1,
                                                            children: step.title
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                                            lineNumber: 822,
                                                            columnNumber: 25
                                                        }, this),
                                                        isCurrent && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                            fontSize: "2xs",
                                                            color: "blue.600",
                                                            fontWeight: "medium",
                                                            children: "Current Step"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                                            lineNumber: 835,
                                                            columnNumber: 27
                                                        }, this),
                                                        isCompleted && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                            fontSize: "2xs",
                                                            color: "green.600",
                                                            children: "Completed"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                                            lineNumber: 840,
                                                            columnNumber: 27
                                                        }, this),
                                                        isUpcoming && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                            fontSize: "2xs",
                                                            color: "gray.500",
                                                            children: "Upcoming"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                                            lineNumber: 845,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                                    lineNumber: 821,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                            lineNumber: 803,
                                            columnNumber: 21
                                        }, this)
                                    }, step.id, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 784,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 776,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 775,
                            columnNumber: 11
                        }, this),
                        nextStep && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            mt: "2",
                            p: "3",
                            bg: "orange.50",
                            borderRadius: "md",
                            border: "1px",
                            borderColor: "orange.200",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                gap: "2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiArrowRight"],
                                        color: "orange.600",
                                        boxSize: "4"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 861,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                        align: "start",
                                        gap: "0",
                                        flex: "1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                fontSize: "sm",
                                                fontWeight: "semibold",
                                                color: "orange.800",
                                                children: [
                                                    "Next Step: ",
                                                    nextStep.title
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                                lineNumber: 863,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                fontSize: "xs",
                                                color: "orange.700",
                                                children: nextStep.subtitle
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                                lineNumber: 866,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 862,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 860,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 859,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                    lineNumber: 745,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                lineNumber: 744,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                gap: "4",
                align: "stretch",
                mb: "6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                        justify: "space-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                align: "start",
                                gap: "1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "xl",
                                        fontWeight: "bold",
                                        color: "gray.800",
                                        children: currentStepConfig.title
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 880,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "sm",
                                        color: "gray.600",
                                        children: currentStepConfig.subtitle
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 883,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 879,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                colorScheme: "blue",
                                variant: "subtle",
                                fontSize: "sm",
                                px: "3",
                                py: "1",
                                children: [
                                    "Step ",
                                    currentStep,
                                    " of ",
                                    config.steps.length
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 887,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 878,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                justify: "space-between",
                                mb: "2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "sm",
                                        fontWeight: "medium",
                                        color: "gray.700",
                                        children: "Step Progress"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 894,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "sm",
                                        fontWeight: "semibold",
                                        color: "gray.700",
                                        children: [
                                            Math.round(getStepProgress()),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                        lineNumber: 895,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 893,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                h: "3",
                                bg: "gray.200",
                                borderRadius: "full",
                                overflow: "hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                    h: "100%",
                                    bg: "blue.500",
                                    width: `${Math.round(getStepProgress())}%`,
                                    borderRadius: "full",
                                    transition: "width 0.3s ease-in-out"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                    lineNumber: 898,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                lineNumber: 897,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 892,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                lineNumber: 877,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                gap: "6",
                align: "stretch",
                children: currentStepConfig.fields.sort((a, b)=>(a.order || 0) - (b.order || 0)).map((field)=>renderField(field))
            }, void 0, false, {
                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                lineNumber: 910,
                columnNumber: 7
            }, this),
            currentStepConfig.requiredDocuments.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                mt: "8",
                p: "4",
                bg: "blue.50",
                borderRadius: "md",
                border: "1px",
                borderColor: "blue.200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "3",
                    align: "stretch",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            gap: "2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                    as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiUpload"],
                                    color: "blue.500"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                    lineNumber: 921,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    fontSize: "sm",
                                    fontWeight: "medium",
                                    color: "blue.700",
                                    children: "Required Documents for this Step"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                    lineNumber: 922,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 920,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                            gap: "2",
                            align: "stretch",
                            children: currentStepConfig.requiredDocuments.map((docId)=>{
                                const doc = config.requiredDocuments.find((d)=>d.id === docId);
                                if (!doc) return null;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                    gap: "2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                            as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiInfo"],
                                            boxSize: "3",
                                            color: "blue.500"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                            lineNumber: 934,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "xs",
                                            color: "blue.600",
                                            children: [
                                                doc.name,
                                                ": ",
                                                doc.description
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                            lineNumber: 935,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, docId, true, {
                                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                                    lineNumber: 933,
                                    columnNumber: 19
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 927,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                    lineNumber: 919,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                lineNumber: 918,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                justify: "space-between",
                mt: "8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        variant: "outline",
                        onClick: onPrevious,
                        disabled: currentStep === 1 || isLoading,
                        children: "Previous"
                    }, void 0, false, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 948,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                        gap: "3",
                        children: currentStep === config.steps.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            colorScheme: isStepComplete() ? "blue" : "orange",
                            onClick: async ()=>{
                                if (!isStepComplete()) {
                                    console.error('Cannot submit - step not complete');
                                    // Check which fields are missing
                                    const requiredFields = currentStepConfig.fields.filter((field)=>field.required);
                                    const missingFields = requiredFields.filter((field)=>{
                                        const value = formData[field.id];
                                        return value === undefined || value === null || value === '' || typeof value === 'string' && value.trim() === '';
                                    });
                                    if (missingFields.length > 0) {
                                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sweetAlert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SweetAlert"].warning('Required Fields Missing', `Please fill in the following required fields:\n${missingFields.map((f)=>`- ${f.label}`).join('\n')}`);
                                    }
                                    return;
                                }
                                console.log('Submitting form...');
                                onSubmit();
                            },
                            disabled: isLoading,
                            isLoading: isLoading,
                            title: !isStepComplete() ? "Click to see which required fields are missing" : "Submit your application",
                            children: !isStepComplete() ? "Complete Required Fields" : "Submit Application"
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 958,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            colorScheme: "blue",
                            onClick: onNext,
                            disabled: !isStepComplete() || isLoading,
                            isLoading: isLoading,
                            children: "Next Step"
                        }, void 0, false, {
                            fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                            lineNumber: 987,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                        lineNumber: 956,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
                lineNumber: 947,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/EnhancedDynamicForm.tsx",
        lineNumber: 736,
        columnNumber: 5
    }, this);
}
_s(EnhancedDynamicForm, "OnoTLMnuQRGZxNSpYLCcvgF5vKE=");
_c = EnhancedDynamicForm;
var _c;
__turbopack_context__.k.register(_c, "EnhancedDynamicForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ProgressTracking.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProgressTracking",
    ()=>ProgressTracking
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/box/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/v-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/h-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/text/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/badge/badge.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/icon/icon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/button/button.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/simple-grid/simple-grid.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/hooks/use-disclosure.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/dialog/dialog.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fi/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function ProgressTracking({ config, formData, currentStep, onStepClick, onSaveProgress, onResumeFromStep, lastSaved, isDirty = false, isSaving = false }) {
    _s();
    const [stepStatuses, setStepStatuses] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const { open: isOpen, onOpen, onClose } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDisclosure"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProgressTracking.useEffect": ()=>{
            const statuses = config.steps.map({
                "ProgressTracking.useEffect.statuses": (step, index)=>{
                    const isCurrentStep = index + 1 === currentStep;
                    const isCompleted = index + 1 < currentStep;
                    // Calculate field completion
                    const requiredFields = step.fields.filter({
                        "ProgressTracking.useEffect.statuses": (field)=>field.required
                    }["ProgressTracking.useEffect.statuses"]).length;
                    const completedFields = step.fields.filter({
                        "ProgressTracking.useEffect.statuses": (field)=>{
                            const value = formData[field.id];
                            return field.required && value !== undefined && value !== null && value !== '';
                        }
                    }["ProgressTracking.useEffect.statuses"]).length;
                    // Calculate document completion
                    const requiredDocuments = step.requiredDocuments.length;
                    const uploadedDocuments = step.requiredDocuments.filter({
                        "ProgressTracking.useEffect.statuses": (docId)=>{
                            // Mock document upload status - in real app, check actual upload status
                            return Math.random() > 0.5; // 50% chance for demo
                        }
                    }["ProgressTracking.useEffect.statuses"]).length;
                    const completionPercentage = requiredFields > 0 ? completedFields / requiredFields * 100 : 100;
                    return {
                        id: step.id,
                        title: step.title,
                        subtitle: step.subtitle,
                        completed: isCompleted,
                        inProgress: isCurrentStep,
                        blocked: !isCompleted && index > 0 && !config.steps[index - 1].fields.every({
                            "ProgressTracking.useEffect.statuses": (field)=>{
                                const value = formData[field.id];
                                return !field.required || value !== undefined && value !== null && value !== '';
                            }
                        }["ProgressTracking.useEffect.statuses"]),
                        completionPercentage,
                        requiredFields,
                        completedFields,
                        requiredDocuments,
                        uploadedDocuments
                    };
                }
            }["ProgressTracking.useEffect.statuses"]);
            setStepStatuses(statuses);
        }
    }["ProgressTracking.useEffect"], [
        config,
        formData,
        currentStep
    ]);
    const getStepIcon = (status, index)=>{
        if (status.completed) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCheckCircle"];
        if (status.inProgress) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiPlay"];
        if (status.blocked) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiAlertCircle"];
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiClock"];
    };
    const getStepColor = (status)=>{
        if (status.completed) return "green";
        if (status.inProgress) return "blue";
        if (status.blocked) return "red";
        return "gray";
    };
    const getOverallProgress = ()=>{
        const totalSteps = stepStatuses.length;
        const completedSteps = stepStatuses.filter((s)=>s.completed).length;
        const currentStepProgress = stepStatuses.find((s)=>s.inProgress)?.completionPercentage || 0;
        return (completedSteps + currentStepProgress / 100) / totalSteps * 100;
    };
    const getNextIncompleteStep = ()=>{
        return stepStatuses.find((s)=>!s.completed && !s.blocked);
    };
    const handleStepClick = (index)=>{
        const step = stepStatuses[index];
        if (step.blocked) return;
        if (step.completed || step.inProgress) {
            onStepClick(index + 1);
        } else {
            onResumeFromStep(index + 1);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                p: "6",
                bg: "white",
                borderRadius: "lg",
                boxShadow: "sm",
                mb: "6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "4",
                    align: "stretch",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            justify: "space-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                    align: "start",
                                    gap: "1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "lg",
                                            fontWeight: "semibold",
                                            color: "gray.800",
                                            children: "Application Progress"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                            lineNumber: 151,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "sm",
                                            color: "gray.600",
                                            children: "Complete all steps to submit your application"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                            lineNumber: 154,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                    lineNumber: 150,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                    gap: "3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                            colorScheme: "blue",
                                            variant: "subtle",
                                            fontSize: "sm",
                                            children: [
                                                Math.round(getOverallProgress()),
                                                "% Complete"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                            lineNumber: 160,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                            size: "sm",
                                            variant: "outline",
                                            onClick: onSaveProgress,
                                            loading: isSaving,
                                            disabled: !isDirty,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                    as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiSave"],
                                                    mr: "2"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                                    lineNumber: 171,
                                                    columnNumber: 17
                                                }, this),
                                                "Save Progress"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                            lineNumber: 164,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                    lineNumber: 159,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ProgressTracking.tsx",
                            lineNumber: 149,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                h: "3",
                                bg: "gray.200",
                                borderRadius: "full",
                                overflow: "hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                    h: "3",
                                    bg: "blue.500",
                                    width: `${Math.round(getOverallProgress())}%`
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                    lineNumber: 179,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProgressTracking.tsx",
                                lineNumber: 178,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/ProgressTracking.tsx",
                            lineNumber: 177,
                            columnNumber: 11
                        }, this),
                        lastSaved && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                            fontSize: "xs",
                            color: "gray.500",
                            children: [
                                "Last saved: ",
                                new Date(lastSaved).toLocaleString()
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ProgressTracking.tsx",
                            lineNumber: 184,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ProgressTracking.tsx",
                    lineNumber: 148,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/ProgressTracking.tsx",
                lineNumber: 147,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                p: "6",
                bg: "white",
                borderRadius: "lg",
                boxShadow: "sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "4",
                    align: "stretch",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            justify: "space-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    fontSize: "lg",
                                    fontWeight: "semibold",
                                    color: "gray.800",
                                    children: "Step-by-Step Progress"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                    lineNumber: 195,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    size: "sm",
                                    variant: "ghost",
                                    onClick: onOpen,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                            as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiEye"],
                                            mr: "1"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                            lineNumber: 204,
                                            columnNumber: 15
                                        }, this),
                                        "View Details"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                    lineNumber: 199,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ProgressTracking.tsx",
                            lineNumber: 194,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                            gap: "3",
                            align: "stretch",
                            children: stepStatuses.map((status, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                    p: "4",
                                    border: "1px",
                                    borderColor: status.blocked ? "red.200" : status.inProgress ? "blue.200" : status.completed ? "green.200" : "gray.200",
                                    borderRadius: "md",
                                    bg: status.blocked ? "red.50" : status.inProgress ? "blue.50" : status.completed ? "green.50" : "gray.50",
                                    cursor: status.blocked ? "not-allowed" : "pointer",
                                    onClick: ()=>handleStepClick(index),
                                    _hover: !status.blocked ? {
                                        bg: status.inProgress ? "blue.100" : status.completed ? "green.100" : "gray.100"
                                    } : {},
                                    transition: "all 0.2s",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                        justify: "space-between",
                                        align: "start",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                gap: "3",
                                                align: "start",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                        as: getStepIcon(status, index),
                                                        boxSize: "5",
                                                        color: `${getStepColor(status)}.500`,
                                                        mt: "1"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ProgressTracking.tsx",
                                                        lineNumber: 225,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                        align: "start",
                                                        gap: "1",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                fontSize: "md",
                                                                fontWeight: "medium",
                                                                color: "gray.800",
                                                                children: status.title
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                lineNumber: 233,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                fontSize: "sm",
                                                                color: "gray.600",
                                                                children: status.subtitle
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                lineNumber: 236,
                                                                columnNumber: 23
                                                            }, this),
                                                            status.inProgress && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                                gap: "4",
                                                                mt: "2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                                        gap: "1",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                            fontSize: "xs",
                                                                            color: "blue.600",
                                                                            children: [
                                                                                "Fields: ",
                                                                                status.completedFields,
                                                                                "/",
                                                                                status.requiredFields
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                            lineNumber: 243,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                        lineNumber: 242,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                                        gap: "1",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                            fontSize: "xs",
                                                                            color: "blue.600",
                                                                            children: [
                                                                                "Documents: ",
                                                                                status.uploadedDocuments,
                                                                                "/",
                                                                                status.requiredDocuments
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                            lineNumber: 248,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                        lineNumber: 247,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                lineNumber: 241,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/ProgressTracking.tsx",
                                                        lineNumber: 232,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/ProgressTracking.tsx",
                                                lineNumber: 224,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                align: "end",
                                                gap: "1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                        colorScheme: getStepColor(status),
                                                        variant: "subtle",
                                                        fontSize: "xs",
                                                        children: status.completed ? "Completed" : status.inProgress ? "In Progress" : status.blocked ? "Blocked" : "Pending"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ProgressTracking.tsx",
                                                        lineNumber: 258,
                                                        columnNumber: 21
                                                    }, this),
                                                    status.inProgress && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                        width: "100px",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                            h: "2",
                                                            bg: "gray.200",
                                                            borderRadius: "full",
                                                            overflow: "hidden",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                h: "2",
                                                                bg: "blue.500",
                                                                width: `${Math.round(status.completionPercentage)}%`
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                lineNumber: 269,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                                            lineNumber: 268,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ProgressTracking.tsx",
                                                        lineNumber: 267,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/ProgressTracking.tsx",
                                                lineNumber: 257,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ProgressTracking.tsx",
                                        lineNumber: 223,
                                        columnNumber: 17
                                    }, this)
                                }, status.id, false, {
                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                    lineNumber: 211,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/ProgressTracking.tsx",
                            lineNumber: 209,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ProgressTracking.tsx",
                    lineNumber: 193,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/ProgressTracking.tsx",
                lineNumber: 192,
                columnNumber: 7
            }, this),
            getNextIncompleteStep() && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                p: "4",
                bg: "blue.50",
                borderRadius: "md",
                border: "1px",
                borderColor: "blue.200",
                mt: "4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                    gap: "2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                            as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiPlay"],
                            color: "blue.500"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ProgressTracking.tsx",
                            lineNumber: 285,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                            fontSize: "sm",
                            color: "blue.700",
                            children: [
                                'Next: Complete "',
                                getNextIncompleteStep()?.title,
                                '" to continue'
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ProgressTracking.tsx",
                            lineNumber: 286,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ProgressTracking.tsx",
                    lineNumber: 284,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/ProgressTracking.tsx",
                lineNumber: 283,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogRoot"], {
                open: isOpen,
                onOpenChange: (e)=>e.open ? onOpen() : onClose(),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogContent"], {
                    maxW: "xl",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogHeader"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogTitle"], {
                                children: "Detailed Progress Report"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProgressTracking.tsx",
                                lineNumber: 297,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/ProgressTracking.tsx",
                            lineNumber: 296,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogBody"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                gap: "4",
                                align: "stretch",
                                children: stepStatuses.map((status, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                        p: "4",
                                        border: "1px",
                                        borderColor: "gray.200",
                                        borderRadius: "md",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                            gap: "3",
                                            align: "stretch",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                    justify: "space-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                            gap: "2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                                    as: getStepIcon(status, index),
                                                                    boxSize: "4",
                                                                    color: `${getStepColor(status)}.500`
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                    lineNumber: 306,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                    fontWeight: "medium",
                                                                    color: "gray.800",
                                                                    children: status.title
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                    lineNumber: 311,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                                            lineNumber: 305,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                            colorScheme: getStepColor(status),
                                                            variant: "subtle",
                                                            children: [
                                                                Math.round(status.completionPercentage),
                                                                "%"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                                            lineNumber: 315,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                                    lineNumber: 304,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                    fontSize: "sm",
                                                    color: "gray.600",
                                                    children: status.subtitle
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                                    lineNumber: 320,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SimpleGrid"], {
                                                    columns: 2,
                                                    gap: "4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                    fontSize: "xs",
                                                                    color: "gray.500",
                                                                    mb: "1",
                                                                    children: "Required Fields"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                    lineNumber: 326,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                                    gap: "2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            w: "100px",
                                                                            h: "2",
                                                                            bg: "gray.200",
                                                                            borderRadius: "full",
                                                                            overflow: "hidden",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                                h: "2",
                                                                                bg: "blue.500",
                                                                                width: `${Math.round(status.completedFields / Math.max(status.requiredFields, 1) * 100)}%`
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                                lineNumber: 329,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                            lineNumber: 328,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                            fontSize: "xs",
                                                                            color: "gray.600",
                                                                            children: [
                                                                                status.completedFields,
                                                                                "/",
                                                                                status.requiredFields
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                            lineNumber: 331,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                    lineNumber: 327,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                                            lineNumber: 325,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                    fontSize: "xs",
                                                                    color: "gray.500",
                                                                    mb: "1",
                                                                    children: "Required Documents"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                    lineNumber: 338,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                                    gap: "2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                            w: "100px",
                                                                            h: "2",
                                                                            bg: "gray.200",
                                                                            borderRadius: "full",
                                                                            overflow: "hidden",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                                h: "2",
                                                                                bg: "green.500",
                                                                                width: `${Math.round(status.uploadedDocuments / Math.max(status.requiredDocuments, 1) * 100)}%`
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                                lineNumber: 341,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                            lineNumber: 340,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                            fontSize: "xs",
                                                                            color: "gray.600",
                                                                            children: [
                                                                                status.uploadedDocuments,
                                                                                "/",
                                                                                status.requiredDocuments
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                            lineNumber: 343,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                                                    lineNumber: 339,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                                            lineNumber: 337,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/ProgressTracking.tsx",
                                                    lineNumber: 324,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/ProgressTracking.tsx",
                                            lineNumber: 303,
                                            columnNumber: 19
                                        }, this)
                                    }, status.id, false, {
                                        fileName: "[project]/src/components/ProgressTracking.tsx",
                                        lineNumber: 302,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProgressTracking.tsx",
                                lineNumber: 300,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/ProgressTracking.tsx",
                            lineNumber: 299,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogFooter"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                onClick: onClose,
                                children: "Close"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProgressTracking.tsx",
                                lineNumber: 355,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/ProgressTracking.tsx",
                            lineNumber: 354,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogCloseTrigger"], {}, void 0, false, {
                            fileName: "[project]/src/components/ProgressTracking.tsx",
                            lineNumber: 357,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ProgressTracking.tsx",
                    lineNumber: 295,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/ProgressTracking.tsx",
                lineNumber: 294,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ProgressTracking.tsx",
        lineNumber: 145,
        columnNumber: 5
    }, this);
}
_s(ProgressTracking, "5uDFTkIfgPU+OcQ05W/tk3M+Jdw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDisclosure"]
    ];
});
_c = ProgressTracking;
var _c;
__turbopack_context__.k.register(_c, "ProgressTracking");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/EnhancedContextualMessaging.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EnhancedContextualMessaging",
    ()=>EnhancedContextualMessaging
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/box/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/v-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/h-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/text/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/button/button.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$textarea$2f$textarea$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/textarea/textarea.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/avatar/namespace.js [app-client] (ecmascript) <export * as Avatar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/badge/badge.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/flex/flex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/icon/icon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$spinner$2f$spinner$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/spinner/spinner.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/hooks/use-disclosure.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/dialog/dialog.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fi/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const MotionBox = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].create(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"]);
_c = MotionBox;
const MotionVStack = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].create(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"]);
_c1 = MotionVStack;
function EnhancedContextualMessaging({ conversations, messages, currentConversationId, currentApplicationId, onSendMessage, onReplyToMessage, onForwardMessage, onStarMessage, onArchiveConversation, onAssignConversation, onTagConversation, currentUser, applicationSections = [], applicationDocuments = [], loadingContext = false }) {
    _s();
    const [newMessage, setNewMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [selectedContext, setSelectedContext] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [filterPriority, setFilterPriority] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("all");
    const [filterStatus, setFilterStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("all");
    const [isSending, setIsSending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [selectedAttachments, setSelectedAttachments] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [replyToMessage, setReplyToMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const { open: isContextOpen, onOpen: onContextOpen, onClose: onContextClose } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDisclosure"])();
    const { open: isAttachmentOpen, onOpen: onAttachmentOpen, onClose: onAttachmentClose } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDisclosure"])();
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [banner, setBanner] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const currentConversation = conversations.find((c)=>c.id === currentConversationId);
    // Filter messages by conversation/thread, sort by timestamp (oldest first for display)
    const currentMessages = messages.filter((m)=>!currentConversationId || m.applicationId === currentApplicationId || m.applicationId === currentConversation?.applicationId).sort((a, b)=>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EnhancedContextualMessaging.useEffect": ()=>{
            messagesEndRef.current?.scrollIntoView({
                behavior: "smooth"
            });
        }
    }["EnhancedContextualMessaging.useEffect"], [
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
        if (type.startsWith('image/')) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiImage"];
        if (type.startsWith('video/')) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiVideo"];
        if (type.includes('pdf')) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiFileText"];
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiFile"];
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minH: "0",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                p: "3",
                borderBottom: "1px",
                borderColor: "gray.200",
                bg: "white",
                flexShrink: 0,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "2",
                    align: "stretch",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            justify: "space-between",
                            align: "center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                    align: "start",
                                    gap: "0.5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "md",
                                            fontWeight: "semibold",
                                            color: "gray.900",
                                            children: "Application Communication"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                            lineNumber: 293,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                                currentMessages.filter((m)=>!m.isRead && m.senderType !== currentUser.type).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            gap: "2",
                            align: "center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    fontSize: "xs",
                                    color: "gray.600",
                                    fontWeight: "medium",
                                    children: "Reference:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 318,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
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
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                            as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiMapPin"],
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
                                selectedContext && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
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
            banner && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                p: "3",
                bg: banner.status === 'success' ? 'green.50' : 'red.50',
                border: "1px",
                borderColor: banner.status === 'success' ? 'green.200' : 'red.200',
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                flex: "1",
                overflowY: "auto",
                p: "4",
                bg: "gray.50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "2.5",
                    align: "stretch",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                            children: currentMessages.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                p: "8",
                                textAlign: "center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiMessageSquare"],
                                        boxSize: "8",
                                        color: "gray.300",
                                        mb: "3"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                        lineNumber: 353,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "sm",
                                        color: "gray.500",
                                        fontWeight: "medium",
                                        children: "No messages yet"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                        lineNumber: 354,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                            }, this) : currentMessages.map((message)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MotionBox, {
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
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                                            justify: isFromCurrentUser ? "flex-end" : "flex-start",
                                            gap: "2",
                                            align: "flex-start",
                                            maxW: "75%",
                                            ml: isFromCurrentUser ? "auto" : "0",
                                            mr: !isFromCurrentUser ? "auto" : "0",
                                            children: [
                                                !isFromCurrentUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                    size: "sm",
                                                    flexShrink: 0,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Fallback, {
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
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
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
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                        gap: "1.5",
                                                        align: "stretch",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                                justify: "space-between",
                                                                align: "start",
                                                                gap: "2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                                        gap: "1.5",
                                                                        align: "center",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
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
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                                                align: "start",
                                                                                gap: "0",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
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
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                                pt: "0.5",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                                gap: "0.5",
                                                                pt: "1.5",
                                                                borderTop: "1px",
                                                                borderColor: isFromCurrentUser || isFromAdmin ? "rgba(255, 255, 255, 0.15)" : "gray.100",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
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
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCornerUpLeft"],
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
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
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
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiStar"],
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
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
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
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCornerUpRight"],
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
                                                isFromCurrentUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Root, {
                                                    size: "sm",
                                                    flexShrink: 0,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$avatar$2f$namespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Avatar$3e$__["Avatar"].Fallback, {
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            replyToMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                p: "3",
                bg: "blue.50",
                borderTop: "1px",
                borderColor: "blue.200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                    justify: "space-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            gap: "2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                    as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCornerUpLeft"],
                                    color: "blue.500"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                    lineNumber: 550,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                p: "3",
                bg: "white",
                borderTop: "1px",
                borderColor: "gray.200",
                flexShrink: 0,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "2",
                    align: "stretch",
                    children: [
                        selectedAttachments.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            p: "2",
                            bg: "gray.50",
                            borderRadius: "md",
                            border: "1px",
                            borderColor: "gray.200",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                gap: "1.5",
                                align: "stretch",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                                    selectedAttachments.map((file, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                            gap: "2",
                                            justify: "space-between",
                                            p: "1.5",
                                            bg: "white",
                                            borderRadius: "sm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                    gap: "2",
                                                    flex: "1",
                                                    minW: "0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                            as: getFileIcon(file.type),
                                                            color: "gray.500",
                                                            boxSize: "3.5"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                            lineNumber: 579,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                            align: "start",
                                                            gap: "0",
                                                            flex: "1",
                                                            minW: "0",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
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
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiTrash2"],
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            gap: "2",
                            align: "flex-end",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                gap: "1.5",
                                align: "stretch",
                                flex: "1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$textarea$2f$textarea$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Textarea"], {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                        justify: "space-between",
                                        align: "center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
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
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiPaperclip"],
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
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                gap: "1.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
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
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
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
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiSend"],
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogRoot"], {
                open: isContextOpen,
                onOpenChange: (e)=>e.open ? onContextOpen() : onContextClose(),
                modal: true,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogBackdrop"], {
                        bg: "blackAlpha.600",
                        backdropFilter: "blur(4px)"
                    }, void 0, false, {
                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                        lineNumber: 694,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogContent"], {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogHeader"], {
                                borderBottom: "1px",
                                borderColor: "gray.200",
                                pb: "3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogTitle"], {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogBody"], {
                                children: loadingContext ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                    p: "8",
                                    textAlign: "center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$spinner$2f$spinner$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Spinner"], {
                                            size: "md",
                                            color: "blue.500"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                            lineNumber: 717,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                    gap: "4",
                                    align: "stretch",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                                                getContextualSections().length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                    p: "4",
                                                    textAlign: "center",
                                                    bg: "gray.50",
                                                    borderRadius: "md",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                    gap: "2",
                                                    align: "stretch",
                                                    children: getContextualSections().map((section)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
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
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                                gap: "2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiFolder"],
                                                                        color: "blue.500",
                                                                        boxSize: "4"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                        lineNumber: 749,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                                        align: "start",
                                                                        gap: "0",
                                                                        flex: "1",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                                fontSize: "sm",
                                                                                fontWeight: "medium",
                                                                                color: "gray.800",
                                                                                children: section.title
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                lineNumber: 751,
                                                                                columnNumber: 29
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                            h: "1px",
                                            bg: "gray.200"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                            lineNumber: 765,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                                                getContextualDocuments().length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                    p: "4",
                                                    textAlign: "center",
                                                    bg: "gray.50",
                                                    borderRadius: "md",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                    gap: "2",
                                                    align: "stretch",
                                                    children: getContextualDocuments().map((doc)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
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
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                                gap: "2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiFileText"],
                                                                        color: "green.500",
                                                                        boxSize: "4"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                        lineNumber: 794,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                                        align: "start",
                                                                        gap: "0",
                                                                        flex: "1",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                                fontSize: "sm",
                                                                                fontWeight: "medium",
                                                                                color: "gray.800",
                                                                                children: doc.title || 'Document'
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/EnhancedContextualMessaging.tsx",
                                                                                lineNumber: 796,
                                                                                columnNumber: 29
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                                fontSize: "xs",
                                                                                color: "gray.500",
                                                                                children: [
                                                                                    doc.type && doc.type !== 'document' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogFooter"], {
                                borderTop: "1px",
                                borderColor: "gray.200",
                                pt: "3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogCloseTrigger"], {}, void 0, false, {
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
_s(EnhancedContextualMessaging, "JmCZUmGi9DOwIJ79u7VcaV8lZWE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDisclosure"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDisclosure"]
    ];
});
_c2 = EnhancedContextualMessaging;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "MotionBox");
__turbopack_context__.k.register(_c1, "MotionVStack");
__turbopack_context__.k.register(_c2, "EnhancedContextualMessaging");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/OCRIntegration.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OCRIntegration",
    ()=>OCRIntegration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/box/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/v-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/h-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/text/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/button/button.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/icon/icon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/simple-grid/simple-grid.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/badge/badge.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$spinner$2f$spinner$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/spinner/spinner.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/hooks/use-disclosure.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/dialog/dialog.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fi/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FileUpload$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/FileUpload.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function OCRIntegration({ onDataExtracted, onDocumentProcessed, entityType = 'private_company', documentType = 'certificate_incorporation', maxFileSize = 10, acceptedTypes = [
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.tiff'
] }) {
    _s();
    const [isProcessing, setIsProcessing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [processingProgress, setProcessingProgress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [ocrResults, setOcrResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedResult, setSelectedResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [fieldMappings, setFieldMappings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isReviewing, setIsReviewing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { open: isReviewOpen, onOpen: onReviewOpen, onClose: onReviewClose } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDisclosure"])();
    const [banner, setBanner] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const processDocumentWithOCR = async (file)=>{
        setIsProcessing(true);
        setProcessingProgress(0);
        try {
            // Simulate OCR processing with progress updates
            const progressInterval = setInterval(()=>{
                setProcessingProgress((prev)=>{
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + Math.random() * 10;
                });
            }, 200);
            // Mock OCR processing time
            await new Promise((resolve)=>setTimeout(resolve, 3000));
            clearInterval(progressInterval);
            setProcessingProgress(100);
            // Simulate OCR extraction based on document type
            const extractedData = await extractDataFromDocument(file, documentType);
            const result = {
                id: `ocr_${Date.now()}`,
                fileName: file.name,
                fileType: file.type,
                extractedText: extractedData.fullText,
                confidence: extractedData.confidence,
                extractedData: extractedData.fields,
                processingTime: 3.2,
                timestamp: new Date().toISOString(),
                status: 'completed'
            };
            setOcrResults((prev)=>[
                    result,
                    ...prev
                ]);
            setSelectedResult(result);
            // Auto-generate field mappings
            const mappings = generateFieldMappings(result, entityType);
            setFieldMappings(mappings);
            setBanner({
                status: 'success',
                message: `Extracted data from ${file.name} with ${Math.round(result.confidence * 100)}% confidence`
            });
            setTimeout(()=>setBanner(null), 4000);
            return result;
        } catch (error) {
            const errorResult = {
                id: `ocr_error_${Date.now()}`,
                fileName: file.name,
                fileType: file.type,
                extractedText: '',
                confidence: 0,
                extractedData: {},
                processingTime: 0,
                timestamp: new Date().toISOString(),
                status: 'failed',
                errors: [
                    'OCR processing failed: ' + error.message
                ]
            };
            setOcrResults((prev)=>[
                    errorResult,
                    ...prev
                ]);
            setBanner({
                status: 'error',
                message: 'Failed to extract data from document'
            });
            setTimeout(()=>setBanner(null), 4000);
            return errorResult;
        } finally{
            setIsProcessing(false);
            setProcessingProgress(0);
        }
    };
    const extractDataFromDocument = async (file, docType)=>{
        // Mock OCR extraction based on document type
        const mockExtractions = {
            'certificate_incorporation': {
                fullText: 'CERTIFICATE OF INCORPORATION\n\nCompany Name: TechCorp Solutions Ltd\nRegistration Number: 2020/123456/07\nDate of Incorporation: 15 January 2020\nPlace of Incorporation: Johannesburg, South Africa\nAuthorized Capital: R1,000,000\nIssued Capital: R500,000',
                confidence: 0.92,
                fields: {
                    companyName: 'TechCorp Solutions Ltd',
                    registrationNumber: '2020/123456/07',
                    dateOfIncorporation: '2020-01-15',
                    placeOfIncorporation: 'Johannesburg, South Africa',
                    authorizedCapital: 'R1,000,000',
                    issuedCapital: 'R500,000'
                }
            },
            'memorandum_association': {
                fullText: 'MEMORANDUM OF ASSOCIATION\n\nCompany Name: TechCorp Solutions Ltd\nRegistration Number: 2020/123456/07\nMain Business: Software Development and IT Services\nRegistered Address: 123 Business Street, Johannesburg, 2000',
                confidence: 0.88,
                fields: {
                    companyName: 'TechCorp Solutions Ltd',
                    registrationNumber: '2020/123456/07',
                    businessDescription: 'Software Development and IT Services',
                    businessAddress: '123 Business Street, Johannesburg, 2000'
                }
            },
            'npo_certificate': {
                fullText: 'NPO REGISTRATION CERTIFICATE\n\nOrganization Name: Community Development Foundation\nNPO Number: 123-456\nRegistration Date: 15 March 2019\nOrganization Type: Non-Profit Organisation\nMain Activities: Community Development and Education',
                confidence: 0.90,
                fields: {
                    organizationName: 'Community Development Foundation',
                    registrationNumber: '123-456',
                    dateOfRegistration: '2019-03-15',
                    organizationType: 'Non-Profit Organisation',
                    mainActivities: 'Community Development and Education'
                }
            },
            'government_certificate': {
                fullText: 'GOVERNMENT ENTITY CERTIFICATE\n\nEntity Name: Department of Social Development\nRegistration Number: GOV-2020-001\nEstablishment Date: 27 April 1994\nJurisdiction: National\nEntity Type: Government Department',
                confidence: 0.95,
                fields: {
                    entityName: 'Department of Social Development',
                    registrationNumber: 'GOV-2020-001',
                    establishmentDate: '1994-04-27',
                    jurisdiction: 'National',
                    entityType: 'Government Department'
                }
            }
        };
        return mockExtractions[docType] || {
            fullText: 'Document processed successfully',
            confidence: 0.75,
            fields: {}
        };
    };
    const generateFieldMappings = (result, entityType)=>{
        const mappings = [];
        // Map extracted data to form fields based on entity type
        const fieldMappings = {
            'companyName': 'companyName',
            'organizationName': 'organizationName',
            'entityName': 'entityName',
            'registrationNumber': 'registrationNumber',
            'dateOfIncorporation': 'dateOfIncorporation',
            'dateOfRegistration': 'dateOfRegistration',
            'establishmentDate': 'establishmentDate',
            'placeOfIncorporation': 'placeOfIncorporation',
            'authorizedCapital': 'authorizedCapital',
            'issuedCapital': 'issuedCapital',
            'businessDescription': 'businessDescription',
            'mainActivities': 'mainActivities',
            'businessAddress': 'businessAddress',
            'organizationType': 'organizationType',
            'entityType': 'entityType',
            'jurisdiction': 'jurisdiction'
        };
        Object.entries(result.extractedData).forEach(([key, value])=>{
            const fieldId = fieldMappings[key];
            if (fieldId) {
                mappings.push({
                    fieldId,
                    fieldLabel: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str)=>str.toUpperCase()),
                    extractedValue: value,
                    confidence: result.confidence,
                    verified: false,
                    suggested: true
                });
            }
        });
        return mappings;
    };
    const handleFieldMappingChange = (index, field)=>{
        setFieldMappings((prev)=>prev.map((mapping, i)=>i === index ? {
                    ...mapping,
                    ...field
                } : mapping));
    };
    const handleApplyMappings = ()=>{
        const verifiedMappings = fieldMappings.filter((mapping)=>mapping.verified);
        onDataExtracted(verifiedMappings);
        setBanner({
            status: 'success',
            message: `Applied ${verifiedMappings.length} field mappings to your form`
        });
        setTimeout(()=>setBanner(null), 2500);
        onReviewClose();
    };
    const getConfidenceColor = (confidence)=>{
        if (confidence >= 0.8) return "green";
        if (confidence >= 0.6) return "yellow";
        return "red";
    };
    const getStatusColor = (status)=>{
        switch(status){
            case 'completed':
                return "green";
            case 'processing':
                return "blue";
            case 'failed':
                return "red";
            case 'reviewed':
                return "purple";
            default:
                return "gray";
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                p: "6",
                bg: "white",
                borderRadius: "lg",
                boxShadow: "sm",
                mb: "6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "4",
                    align: "stretch",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            justify: "space-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                    align: "start",
                                    gap: "1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "lg",
                                            fontWeight: "semibold",
                                            color: "gray.800",
                                            children: "OCR Document Processing"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/OCRIntegration.tsx",
                                            lineNumber: 284,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "sm",
                                            color: "gray.600",
                                            children: "Extract data automatically from your documents"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/OCRIntegration.tsx",
                                            lineNumber: 287,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                    lineNumber: 283,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                    colorScheme: "blue",
                                    variant: "subtle",
                                    children: [
                                        entityType,
                                        " • ",
                                        documentType
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                    lineNumber: 292,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/OCRIntegration.tsx",
                            lineNumber: 282,
                            columnNumber: 11
                        }, this),
                        isProcessing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                    gap: "3",
                                    mb: "3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$spinner$2f$spinner$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Spinner"], {
                                            size: "sm",
                                            color: "blue.500"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/OCRIntegration.tsx",
                                            lineNumber: 300,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "sm",
                                            color: "blue.600",
                                            children: "Processing document with OCR..."
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/OCRIntegration.tsx",
                                            lineNumber: 301,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                    lineNumber: 299,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                    h: "2",
                                    bg: "gray.200",
                                    borderRadius: "full",
                                    overflow: "hidden",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                        h: "2",
                                        bg: "blue.500",
                                        width: `${Math.round(processingProgress)}%`
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                        lineNumber: 306,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                    lineNumber: 305,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/OCRIntegration.tsx",
                            lineNumber: 298,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FileUpload$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FileUpload"], {
                            onFileUpload: async (file)=>{
                                const result = await processDocumentWithOCR(file);
                                return result.extractedText;
                            },
                            acceptedTypes: acceptedTypes,
                            maxSize: maxFileSize,
                            label: "Upload Document for OCR Processing",
                            description: "Upload a document to automatically extract form data"
                        }, void 0, false, {
                            fileName: "[project]/src/components/OCRIntegration.tsx",
                            lineNumber: 310,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/OCRIntegration.tsx",
                    lineNumber: 281,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/OCRIntegration.tsx",
                lineNumber: 280,
                columnNumber: 7
            }, this),
            banner && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                p: "3",
                bg: banner.status === 'success' ? 'green.50' : 'red.50',
                border: "1px",
                borderColor: banner.status === 'success' ? 'green.200' : 'red.200',
                borderRadius: "md",
                mb: "4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                    fontSize: "sm",
                    color: banner.status === 'success' ? 'green.700' : 'red.700',
                    children: banner.message
                }, void 0, false, {
                    fileName: "[project]/src/components/OCRIntegration.tsx",
                    lineNumber: 326,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/OCRIntegration.tsx",
                lineNumber: 325,
                columnNumber: 9
            }, this),
            ocrResults.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                p: "6",
                bg: "white",
                borderRadius: "lg",
                boxShadow: "sm",
                mb: "6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "4",
                    align: "stretch",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                            justify: "space-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    fontSize: "lg",
                                    fontWeight: "semibold",
                                    color: "gray.800",
                                    children: "OCR Results"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                    lineNumber: 335,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                    colorScheme: "blue",
                                    variant: "subtle",
                                    children: [
                                        ocrResults.length,
                                        " processed"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                    lineNumber: 338,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/OCRIntegration.tsx",
                            lineNumber: 334,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SimpleGrid"], {
                            columns: {
                                base: 1,
                                md: 2,
                                lg: 3
                            },
                            gap: "4",
                            children: ocrResults.map((result)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                    p: "4",
                                    border: "1px",
                                    borderColor: "gray.200",
                                    borderRadius: "md",
                                    bg: "gray.50",
                                    cursor: "pointer",
                                    _hover: {
                                        bg: "gray.100"
                                    },
                                    onClick: ()=>{
                                        setSelectedResult(result);
                                        const mappings = generateFieldMappings(result, entityType);
                                        setFieldMappings(mappings);
                                        onReviewOpen();
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                        gap: "3",
                                        align: "stretch",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                justify: "space-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                        gap: "2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiFileText"],
                                                                color: "blue.500"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                                                lineNumber: 364,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                fontSize: "sm",
                                                                fontWeight: "medium",
                                                                color: "gray.800",
                                                                children: result.fileName
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                                                lineNumber: 365,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                                        lineNumber: 363,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                        colorScheme: getStatusColor(result.status),
                                                        variant: "subtle",
                                                        fontSize: "xs",
                                                        children: result.status
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                                        lineNumber: 369,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                                lineNumber: 362,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                justify: "space-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                        fontSize: "xs",
                                                        color: "gray.500",
                                                        children: [
                                                            "Confidence: ",
                                                            Math.round(result.confidence * 100),
                                                            "%"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                                        lineNumber: 379,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                        colorScheme: getConfidenceColor(result.confidence),
                                                        variant: "subtle",
                                                        fontSize: "xs",
                                                        children: result.confidence >= 0.8 ? "High" : result.confidence >= 0.6 ? "Medium" : "Low"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                                        lineNumber: 382,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                                lineNumber: 378,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                fontSize: "xs",
                                                color: "gray.600",
                                                children: [
                                                    "Processed: ",
                                                    new Date(result.timestamp).toLocaleString()
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                                lineNumber: 391,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                gap: "2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                        size: "xs",
                                                        variant: "outline",
                                                        onClick: (e)=>{
                                                            e.stopPropagation();
                                                            setSelectedResult(result);
                                                            const mappings = generateFieldMappings(result, entityType);
                                                            setFieldMappings(mappings);
                                                            onReviewOpen();
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiEye"],
                                                                mr: "1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                                                lineNumber: 407,
                                                                columnNumber: 25
                                                            }, this),
                                                            "Review"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                                        lineNumber: 396,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                        size: "xs",
                                                        variant: "outline",
                                                        onClick: (e)=>{
                                                            e.stopPropagation();
                                                        // Download extracted text
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiDownload"],
                                                                mr: "1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                                                lineNumber: 418,
                                                                columnNumber: 25
                                                            }, this),
                                                            "Download"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                                        lineNumber: 410,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                                lineNumber: 395,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                        lineNumber: 361,
                                        columnNumber: 19
                                    }, this)
                                }, result.id, false, {
                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                    lineNumber: 345,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/OCRIntegration.tsx",
                            lineNumber: 343,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/OCRIntegration.tsx",
                    lineNumber: 333,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/OCRIntegration.tsx",
                lineNumber: 332,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogRoot"], {
                open: isReviewOpen,
                onOpenChange: (e)=>e.open ? onReviewOpen() : onReviewClose(),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogContent"], {
                    maxW: "xl",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogHeader"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogTitle"], {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                    gap: "2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                            as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiEye"],
                                            color: "blue.500"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/OCRIntegration.tsx",
                                            lineNumber: 436,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            children: "Review Extracted Data"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/OCRIntegration.tsx",
                                            lineNumber: 437,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                    lineNumber: 435,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                lineNumber: 434,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/OCRIntegration.tsx",
                            lineNumber: 433,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogBody"], {
                            children: selectedResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                gap: "6",
                                align: "stretch",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                        p: "4",
                                        bg: "blue.50",
                                        borderRadius: "md",
                                        border: "1px",
                                        borderColor: "blue.200",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                            gap: "2",
                                            align: "stretch",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                    justify: "space-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                            fontSize: "sm",
                                                            fontWeight: "medium",
                                                            color: "blue.700",
                                                            children: selectedResult.fileName
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/OCRIntegration.tsx",
                                                            lineNumber: 448,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                            colorScheme: getConfidenceColor(selectedResult.confidence),
                                                            variant: "subtle",
                                                            children: [
                                                                Math.round(selectedResult.confidence * 100),
                                                                "% Confidence"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/OCRIntegration.tsx",
                                                            lineNumber: 451,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                                    lineNumber: 447,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                    fontSize: "xs",
                                                    color: "blue.600",
                                                    children: [
                                                        "Processing time: ",
                                                        selectedResult.processingTime,
                                                        "s"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                                    lineNumber: 458,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/OCRIntegration.tsx",
                                            lineNumber: 446,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                        lineNumber: 445,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                fontSize: "sm",
                                                fontWeight: "medium",
                                                color: "gray.700",
                                                mb: "2",
                                                children: "Extracted Text:"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                                lineNumber: 466,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                p: "3",
                                                bg: "gray.50",
                                                borderRadius: "md",
                                                border: "1px",
                                                borderColor: "gray.200",
                                                maxH: "200px",
                                                overflowY: "auto",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                    fontSize: "xs",
                                                    color: "gray.600",
                                                    whiteSpace: "pre-wrap",
                                                    children: selectedResult.extractedText
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                                    lineNumber: 478,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                                lineNumber: 469,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                        lineNumber: 465,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                fontSize: "sm",
                                                fontWeight: "medium",
                                                color: "gray.700",
                                                mb: "3",
                                                children: "Field Mappings:"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                                lineNumber: 486,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                gap: "3",
                                                align: "stretch",
                                                children: fieldMappings.map((mapping, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                        p: "3",
                                                        border: "1px",
                                                        borderColor: "gray.200",
                                                        borderRadius: "md",
                                                        bg: "white",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                            gap: "3",
                                                            align: "start",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "checkbox",
                                                                    checked: mapping.verified,
                                                                    onChange: (e)=>handleFieldMappingChange(index, {
                                                                            verified: e.target.checked
                                                                        })
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                                                    lineNumber: 500,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                                    align: "start",
                                                                    gap: "1",
                                                                    flex: "1",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                                            gap: "2",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                                    fontSize: "sm",
                                                                                    fontWeight: "medium",
                                                                                    color: "gray.800",
                                                                                    children: mapping.fieldLabel
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                                                                    lineNumber: 508,
                                                                                    columnNumber: 31
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                                                    colorScheme: getConfidenceColor(mapping.confidence),
                                                                                    variant: "subtle",
                                                                                    fontSize: "xs",
                                                                                    children: [
                                                                                        Math.round(mapping.confidence * 100),
                                                                                        "%"
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                                                                    lineNumber: 511,
                                                                                    columnNumber: 31
                                                                                }, this),
                                                                                mapping.suggested && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                                                    colorScheme: "blue",
                                                                                    variant: "subtle",
                                                                                    fontSize: "xs",
                                                                                    children: "Suggested"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                                                                    lineNumber: 519,
                                                                                    columnNumber: 33
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/components/OCRIntegration.tsx",
                                                                            lineNumber: 507,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            value: mapping.extractedValue,
                                                                            onChange: (e)=>handleFieldMappingChange(index, {
                                                                                    extractedValue: e.target.value
                                                                                }),
                                                                            style: {
                                                                                width: '100%',
                                                                                padding: '6px',
                                                                                borderRadius: 6,
                                                                                border: '1px solid var(--chakra-colors-gray-200)'
                                                                            }
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/OCRIntegration.tsx",
                                                                            lineNumber: 525,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/OCRIntegration.tsx",
                                                                    lineNumber: 506,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/OCRIntegration.tsx",
                                                            lineNumber: 499,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, index, false, {
                                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                                        lineNumber: 491,
                                                        columnNumber: 23
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                                lineNumber: 489,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                        lineNumber: 485,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                lineNumber: 443,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/OCRIntegration.tsx",
                            lineNumber: 441,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogFooter"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                gap: "2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        variant: "outline",
                                        onClick: onReviewClose,
                                        children: "Cancel"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                        lineNumber: 541,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        colorScheme: "blue",
                                        onClick: handleApplyMappings,
                                        disabled: fieldMappings.filter((m)=>m.verified).length === 0,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiSave"],
                                                mr: "2"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                                lineNumber: 549,
                                                columnNumber: 17
                                            }, this),
                                            "Apply Selected Mappings (",
                                            fieldMappings.filter((m)=>m.verified).length,
                                            ")"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/OCRIntegration.tsx",
                                        lineNumber: 544,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/OCRIntegration.tsx",
                                lineNumber: 540,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/OCRIntegration.tsx",
                            lineNumber: 539,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$dialog$2f$dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogCloseTrigger"], {}, void 0, false, {
                            fileName: "[project]/src/components/OCRIntegration.tsx",
                            lineNumber: 554,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/OCRIntegration.tsx",
                    lineNumber: 432,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/OCRIntegration.tsx",
                lineNumber: 431,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/OCRIntegration.tsx",
        lineNumber: 278,
        columnNumber: 5
    }, this);
}
_s(OCRIntegration, "0rv3L/EZD0kcLqX2aRd88FumCyM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$hooks$2f$use$2d$disclosure$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDisclosure"]
    ];
});
_c = OCRIntegration;
var _c;
__turbopack_context__.k.register(_c, "OCRIntegration");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/auth/session.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/react/index.js [app-client] (ecmascript)");
;
function isAuthenticated() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Check if session cookie exists (basic check)
    // For accurate authentication status, use useSession() hook
    const cookies = document.cookie.split(';');
    const hasSessionCookie = cookies.some((cookie)=>cookie.trim().startsWith('next-auth.session-token=') || cookie.trim().startsWith('__Secure-next-auth.session-token='));
    return hasSessionCookie;
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
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Try to get user from NextAuth session via fetch (async but we return sync fallback)
    // For accurate data, components should use useSession() hook
    try {
        // Check if session cookie exists
        const cookies = document.cookie.split(';');
        const hasSessionCookie = cookies.some((cookie)=>cookie.trim().startsWith('next-auth.session-token=') || cookie.trim().startsWith('__Secure-next-auth.session-token='));
        if (!hasSessionCookie) {
            return {
                name: 'User'
            };
        }
        // Try to get cached session data from sessionStorage (if available)
        // This is a fallback - components should use useSession() hook
        const sessionData = sessionStorage.getItem('nextauth.session.user');
        if (sessionData) {
            try {
                const user = JSON.parse(sessionData);
                return {
                    sub: user.id || user.email,
                    name: user.name || user.email || 'User',
                    email: user.email
                };
            } catch  {
            // Invalid session data
            }
        }
    } catch  {
    // Session storage not available or error
    }
    // Fallback: return default user
    // Components should use useSession() hook or useAuth() for accurate data
    return {
        name: 'User'
    };
}
function clearSession() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // SECURITY: Clear any legacy localStorage tokens (shouldn't exist, but clean up just in case)
    // Tokens are now stored server-side in Redis, but we clean up localStorage for safety
    try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('token_expires_at');
    } catch  {
    // Ignore errors if localStorage is not available
    }
    // Clear session storage
    sessionStorage.removeItem('nextauth.session.user');
    // Sign out using NextAuth (this will clear the session cookie)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signOut"])({
        callbackUrl: '/auth/login'
    });
}
/**
 * Redirect to login page
 */ function redirectToLogin() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Don't redirect if already on auth pages
    if (window.location.pathname.startsWith('/auth/')) return;
    // Use replace to avoid adding to history
    try {
        window.location.replace('/auth/login');
    } catch  {
        window.location.href = '/auth/login';
    }
}
function buildLogoutUrl(postLogoutRedirectUri) {
    // NextAuth handles logout, but if needed for Keycloak direct logout:
    const keycloakIssuer = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_KEYCLOAK_ISSUER || 'https://keycloak-staging.app-stg.mukuru.io/realms/mukuru';
    const base = `${keycloakIssuer}/protocol/openid-connect/logout`;
    const url = new URL(base);
    url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
    return url.toString();
}
function logout(postLogoutRedirectUri = '/auth/login') {
    // Use NextAuth signOut which handles session cleanup
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signOut"])({
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/entityConfigApi.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// SECURITY: All API calls go through the proxy which injects tokens from Redis
// Use the proxy endpoint instead of direct API calls
__turbopack_context__.s([
    "entityConfigApiService",
    ()=>entityConfigApiService
]);
const ENTITY_CONFIG_API_BASE_URL = ("TURBOPACK compile-time truthy", 1) ? '/api/proxy' // Use proxy endpoint in browser (tokens injected server-side)
 : "TURBOPACK unreachable";
// Helper function to convert snake_case to camelCase
function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter)=>letter.toUpperCase());
}
// Recursively transform object keys from snake_case to camelCase
function transformKeys(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(transformKeys);
    }
    if (typeof obj === 'object' && obj.constructor === Object) {
        const transformed = {};
        for (const [key, value] of Object.entries(obj)){
            const camelKey = snakeToCamel(key);
            transformed[camelKey] = transformKeys(value);
        }
        return transformed;
    }
    return obj;
}
class EntityConfigApiService {
    async request(endpoint, options) {
        // Use direct /api/v1 path - gateway routing can be configured separately if needed
        // In browser, use proxy endpoint; server-side can use direct URL
        const basePath = '/api/v1';
        const url = ("TURBOPACK compile-time truthy", 1) ? `${ENTITY_CONFIG_API_BASE_URL}${basePath}${endpoint}` // Proxy endpoint
         : "TURBOPACK unreachable"; // Direct URL (server-side)
        const headers = {
            'Content-Type': 'application/json'
        };
        try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject)=>{
                setTimeout(()=>reject(new Error('Request timeout')), 10000);
            });
            // SECURITY: Include credentials to send session cookie (browser only)
            // Proxy will automatically inject Authorization header from Redis
            const fetchPromise = fetch(url, {
                ...options,
                credentials: ("TURBOPACK compile-time truthy", 1) ? 'include' : "TURBOPACK unreachable",
                headers: {
                    ...headers,
                    ...options?.headers
                }
            });
            const response = await Promise.race([
                fetchPromise,
                timeoutPromise
            ]);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Entity Config API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            // Handle 204 No Content responses
            if (response.status === 204) {
                return null;
            }
            const json = await response.json();
            // Transform snake_case keys to camelCase
            return transformKeys(json);
        } catch (error) {
            if (error instanceof TypeError || error instanceof Error && error.message.includes('timeout')) {
                throw new Error('Unable to connect to Entity Configuration service');
            }
            throw error;
        }
    }
    // Entity Types endpoints
    async getEntityTypes(includeInactive = false, includeRequirements = false) {
        const params = new URLSearchParams();
        if (includeInactive) params.append('includeInactive', 'true');
        if (includeRequirements) params.append('includeRequirements', 'true');
        const queryString = params.toString();
        return this.request(`/entity-types${queryString ? `?${queryString}` : ''}`);
    }
    async getEntityType(id) {
        return this.request(`/entity-types/${id}`);
    }
    async getEntityTypeByCode(code, includeRequirements = true) {
        try {
            const allTypes = await this.getEntityTypes(false, includeRequirements);
            return allTypes.find((et)=>et.code.toLowerCase() === code.toLowerCase()) || null;
        } catch (error) {
            console.error('Error fetching entity type by code:', error);
            return null;
        }
    }
    // Requirements endpoints
    async getRequirements(includeInactive = false) {
        const params = includeInactive ? '?includeInactive=true' : '';
        return this.request(`/requirements${params}`);
    }
    async getRequirement(id) {
        return this.request(`/requirements/${id}`);
    }
}
const entityConfigApiService = new EntityConfigApiService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/documentUpload.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/integrationService.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Integration Service for syncing application progress with backend services
 * Handles communication with Checklist and Work-Queue services
 * SECURITY: All API calls go through the proxy which injects tokens from Redis
 */ __turbopack_context__.s([
    "integrationService",
    ()=>integrationService
]);
const CHECKLIST_API_BASE_URL = ("TURBOPACK compile-time truthy", 1) ? '/api/proxy' // Use proxy endpoint in browser (tokens injected server-side)
 : "TURBOPACK unreachable";
const WORK_QUEUE_API_BASE_URL = ("TURBOPACK compile-time truthy", 1) ? '/api/proxy' // Use proxy endpoint in browser (tokens injected server-side)
 : "TURBOPACK unreachable";
class IntegrationService {
    async request(baseUrl, endpoint, options) {
        // In browser, use proxy endpoint; server-side can use direct URL
        const url = ("TURBOPACK compile-time truthy", 1) ? `${baseUrl}${endpoint}` // Proxy endpoint
         : "TURBOPACK unreachable"; // Direct URL (server-side)
        const headers = {
            'Content-Type': 'application/json',
            ...options?.headers
        };
        try {
            // SECURITY: Include credentials to send session cookie (browser only)
            // Proxy will automatically inject Authorization header from Redis
            const response = await fetch(url, {
                ...options,
                credentials: ("TURBOPACK compile-time truthy", 1) ? 'include' : "TURBOPACK unreachable",
                headers
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Integration API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            if (response.status === 204) {
                return null;
            }
            return response.json();
        } catch (error) {
            if (error instanceof TypeError) {
                throw new Error('Unable to connect to integration service');
            }
            throw error;
        }
    }
    /**
   * Mark a checklist item as completed
   */ async completeChecklistItem(checklistId, itemId, completedBy, notes) {
        await this.request(CHECKLIST_API_BASE_URL, `/api/v1/checklists/${checklistId}/items/${itemId}/complete`, {
            method: 'POST',
            body: JSON.stringify({
                completedBy,
                notes
            })
        });
    }
    /**
   * Get checklist by case ID
   */ async getChecklistByCase(caseId) {
        return this.request(CHECKLIST_API_BASE_URL, `/api/v1/checklists/by-case/${caseId}`);
    }
    /**
   * Update work queue item status/progress
   */ async updateWorkQueueItem(applicationId, update) {
        await this.request(WORK_QUEUE_API_BASE_URL, `/api/v1/workqueue/items/by-application/${applicationId}`, {
            method: 'PATCH',
            body: JSON.stringify(update)
        });
    }
    /**
   * Get work item by application ID
   */ async getWorkItemByApplication(applicationId) {
        return this.request(WORK_QUEUE_API_BASE_URL, `/api/v1/workqueue/items/by-application/${applicationId}`);
    }
}
const integrationService = new IntegrationService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/iconUtils.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getEntityTypeIcon",
    ()=>getEntityTypeIcon,
    "getIconComponent",
    ()=>getIconComponent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fi/index.mjs [app-client] (ecmascript)");
;
const iconMap = {
    FiBriefcase: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiBriefcase"],
    FiHome: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiHome"],
    FiUsers: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiUsers"],
    FiDollarSign: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiDollarSign"],
    FiShield: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiShield"],
    FiHeart: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiHeart"],
    FiGlobe: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiGlobe"],
    FiBook: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiBook"],
    FiCamera: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCamera"],
    FiMusic: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiMusic"],
    FiCoffee: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiCoffee"],
    FiTruck: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiTruck"],
    FiZap: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiZap"],
    FiTarget: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiTarget"],
    FiTrendingUp: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiTrendingUp"],
    FiBox: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiBox"],
    FiPackage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiPackage"],
    FiShoppingBag: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiShoppingBag"],
    FiAnchor: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiAnchor"],
    FiLayers: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiLayers"],
    FiUser: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiUser"],
    FiLock: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiLock"],
    FiFileText: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiFileText"]
};
function getIconComponent(iconName) {
    if (!iconName) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiFileText"];
    return iconMap[iconName] || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiFileText"];
}
function getEntityTypeIcon(entityLabel, entityCode) {
    if (!entityLabel && !entityCode) return 'FiFileText';
    const label = (entityLabel || '').toLowerCase().trim();
    const code = (entityCode || '').toLowerCase().trim();
    // Check code first (more reliable)
    if (code) {
        // Government / State Owned Entity
        if (code.includes('government') || code.includes('state_owned') || code.includes('state-owned') || code.includes('parastatal') || code.includes('organ_of_state')) {
            return 'FiShield';
        }
        // NPO / NGO / PVO / Charity
        if (code.includes('npo') || code.includes('ngo') || code.includes('pvo') || code.includes('charity') || code.includes('non_profit') || code.includes('nonprofit')) {
            return 'FiHeart';
        }
        // Non-Registered Association / Society / Foundation
        if (code.includes('association') || code.includes('society') || code.includes('foundation') || code.includes('non_registered')) {
            return 'FiUsers';
        }
        // Private Company / Limited Liability Company
        if (code.includes('private_company') || code.includes('private-company') || code.includes('llc') || code.includes('limited_liability')) {
            return 'FiBriefcase';
        }
        // Publicly Listed Entity
        if (code.includes('public_company') || code.includes('public-company') || code.includes('publicly_listed') || code.includes('publicly-listed')) {
            return 'FiTrendingUp';
        }
        // Sole Proprietor
        if (code.includes('sole_proprietor') || code.includes('sole-proprietor') || code.includes('sole_trader') || code.includes('sole-trader')) {
            return 'FiUser';
        }
        // Supranational / Inter-Governmental
        if (code.includes('supranational') || code.includes('inter_governmental') || code.includes('intergovernmental')) {
            return 'FiGlobe';
        }
        // Trust
        if (code.includes('trust')) {
            return 'FiLock';
        }
        // Partnership
        if (code.includes('partnership')) {
            return 'FiUsers';
        }
        // Cooperative
        if (code.includes('cooperative')) {
            return 'FiUsers';
        }
    }
    // Check label if code didn't match
    if (label) {
        // Government / State Owned Entity
        if (label.includes('government') || label.includes('state owned') || label.includes('state-owned') || label.includes('organ of state') || label.includes('parastatal')) {
            return 'FiShield';
        }
        // NPO / NGO / PVO / Charity
        if (label.includes('npo') || label.includes('ngo') || label.includes('pvo') || label.includes('charity') || label.includes('non-profit') || label.includes('nonprofit') || label.includes('non profit')) {
            return 'FiHeart';
        }
        // Non-Registered Association / Society / Foundation
        if (label.includes('association') || label.includes('society') || label.includes('foundation') || label.includes('non-registered') || label.includes('non registered')) {
            return 'FiUsers';
        }
        // Private Company / Limited Liability Company
        if (label.includes('private company') || label.includes('limited liability') || label.includes('llc') || label.includes('private') && label.includes('company')) {
            return 'FiBriefcase';
        }
        // Publicly Listed Entity
        if (label.includes('publicly listed') || label.includes('public company') || label.includes('public') && label.includes('listed')) {
            return 'FiTrendingUp';
        }
        // Sole Proprietor
        if (label.includes('sole proprietor') || label.includes('sole trader') || label.includes('sole-proprietor') || label.includes('sole-trader')) {
            return 'FiUser';
        }
        // Supranational / Inter-Governmental
        if (label.includes('supranational') || label.includes('inter-governmental') || label.includes('intergovernmental') || label.includes('inter governmental')) {
            return 'FiGlobe';
        }
        // Trust
        if (label.includes('trust')) {
            return 'FiLock';
        }
        // Partnership
        if (label.includes('partnership')) {
            return 'FiUsers';
        }
        // Cooperative
        if (label.includes('cooperative')) {
            return 'FiUsers';
        }
    }
    // Default
    return 'FiFileText';
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/partner/application/enhanced/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>EnhancedNewPartnerApplicationPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/box/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$container$2f$container$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/container/container.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/v-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/stack/h-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/text/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/flex/flex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$image$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/image/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$circle$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/circle/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/simple-grid/simple-grid.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/icon/icon.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/button/button.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$spinner$2f$spinner$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/spinner/spinner.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@chakra-ui/react/dist/esm/components/badge/badge.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fi/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useFormPersistence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useFormPersistence.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$entityFormConfigs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/entityFormConfigs.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$EnhancedDynamicForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/EnhancedDynamicForm.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressTracking$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ProgressTracking.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$EnhancedContextualMessaging$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/EnhancedContextualMessaging.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$OCRIntegration$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/OCRIntegration.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/session.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$entityConfigApi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/entityConfigApi.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$documentUpload$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/documentUpload.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$integrationService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/integrationService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$iconUtils$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/iconUtils.tsx [app-client] (ecmascript)");
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
;
;
;
;
;
;
const MotionBox = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].create(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"]);
_c = MotionBox;
// Map backend entity codes to form config keys
// This handles differences between backend codes and form config keys
const mapEntityCodeToFormConfig = (code)=>{
    const codeLower = code.toLowerCase();
    // Map common variations
    const mapping = {
        'private_company': 'private_company',
        'public_company': 'private_company',
        'ngo': 'npo',
        'npo': 'npo',
        'non_profit': 'npo',
        'government': 'government',
        'state_owned': 'government',
        'sole_proprietor': 'private_company',
        'sole_trader': 'private_company',
        'partnership': 'private_company',
        'trust': 'private_company'
    };
    return mapping[codeLower] || codeLower;
};
function EnhancedNewPartnerApplicationPage() {
    _s();
    const [currentUser, setCurrentUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        name: "User"
    });
    const [currentStep, setCurrentStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [selectedEntityType, setSelectedEntityType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [showProgress, setShowProgress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showMessaging, setShowMessaging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showOCR, setShowOCR] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [validationErrors, setValidationErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [isSubmitting, setIsSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [toastState, setToastState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [entityTypes, setEntityTypes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingEntityTypes, setLoadingEntityTypes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [entityTypesError, setEntityTypesError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedEntityTypeData, setSelectedEntityTypeData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loadingEntityTypeData, setLoadingEntityTypeData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [caseId, setCaseId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [checklistId, setChecklistId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [applicationId, setApplicationId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Store File objects temporarily (will be uploaded to Document Service after case creation)
    const [fileObjects, setFileObjects] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Map());
    const showToast = (args)=>{
        setToastState(args);
        setTimeout(()=>setToastState(null), 5000);
    };
    // Fetch entity types from backend
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EnhancedNewPartnerApplicationPage.useEffect": ()=>{
            const loadEntityTypes = {
                "EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypes": async ()=>{
                    try {
                        setLoadingEntityTypes(true);
                        setEntityTypesError(null);
                        const data = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$entityConfigApi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["entityConfigApiService"].getEntityTypes(false, false);
                        // Map backend data to frontend format
                        // Normalize codes to lowercase and map to form config keys
                        // Deduplicate by original code to prevent duplicate keys
                        const seenCodes = new Set();
                        const mappedTypes = data.filter({
                            "EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypes.mappedTypes": (et)=>{
                                // Filter active and deduplicate by code
                                if (!et.isActive) return false;
                                const codeKey = et.code.toLowerCase();
                                if (seenCodes.has(codeKey)) {
                                    console.warn(`Duplicate entity type code detected: ${et.code}. Skipping duplicate.`);
                                    return false;
                                }
                                seenCodes.add(codeKey);
                                return true;
                            }
                        }["EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypes.mappedTypes"]).map({
                            "EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypes.mappedTypes": (et)=>{
                                const formConfigKey = mapEntityCodeToFormConfig(et.code);
                                // Determine icon: use backend icon if available, otherwise map from entity type
                                const iconName = et.icon || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$iconUtils$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEntityTypeIcon"])(et.displayName, et.code);
                                return {
                                    value: formConfigKey,
                                    label: et.displayName,
                                    description: et.description || 'No description available',
                                    icon: iconName,
                                    originalCode: et.code // Keep original for reference (unique identifier)
                                };
                            }
                        }["EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypes.mappedTypes"]);
                        // Log if some entity types don't have static form configs (they'll use backend-generated forms)
                        // This is expected behavior, so we use debug level instead of warning
                        mappedTypes.forEach({
                            "EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypes": (et)=>{
                                const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$entityFormConfigs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEntityFormConfig"])(et.value);
                                if (!config) {
                                    console.debug(`No static form config for entity type: ${et.value} (original code: ${et.originalCode}). Will use backend-generated form from Entity Configuration Service.`);
                                }
                            }
                        }["EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypes"]);
                        console.log(`[Enhanced Page] Loaded ${mappedTypes.length} entity types from backend`);
                        setEntityTypes(mappedTypes);
                    } catch (err) {
                        console.error('Error loading entity types:', err);
                        console.error('Error details:', err instanceof Error ? err.message : String(err));
                        setEntityTypesError('Failed to load entity types. Please try again later.');
                        showToast({
                            status: "error",
                            title: "Loading Error",
                            description: "Failed to load entity types from the server"
                        });
                        // Fallback to empty array - page will show error state
                        setEntityTypes([]);
                    } finally{
                        setLoadingEntityTypes(false);
                    }
                }
            }["EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypes"];
            loadEntityTypes();
        }
    }["EnhancedNewPartnerApplicationPage.useEffect"], []);
    // Convert backend requirement to form field
    const convertRequirementToFormField = (req, isRequired, displayOrder)=>{
        // Map backend fieldType to frontend field type
        const fieldTypeMap = {
            'Text': 'text',
            'Email': 'email',
            'Phone': 'tel',
            'Number': 'number',
            'Date': 'date',
            'Textarea': 'textarea',
            'Select': 'select',
            'MultiSelect': 'select',
            'File': 'file',
            'Checkbox': 'checkbox',
            'Radio': 'radio'
        };
        // Parse validation rules if present
        let validation;
        if (req.validationRules) {
            try {
                const rules = JSON.parse(req.validationRules);
                validation = {
                    min: rules.minLength || rules.min,
                    max: rules.maxLength || rules.max,
                    pattern: rules.pattern
                };
            } catch (e) {
                console.warn('Failed to parse validation rules:', req.validationRules);
            }
        }
        // Convert requirement options to form field options
        const options = req.options?.map((opt)=>({
                value: opt.value,
                label: opt.displayText,
                disabled: false
            }));
        return {
            id: req.code.toLowerCase(),
            label: req.displayName,
            type: fieldTypeMap[req.fieldType] || 'text',
            required: isRequired,
            placeholder: req.description || `Enter ${req.displayName.toLowerCase()}`,
            description: req.helpText || req.description,
            validation,
            options,
            order: displayOrder
        };
    };
    // Generate form config from backend entity type requirements
    const generateFormConfigFromBackend = (entityType)=>{
        if (!entityType.requirements || entityType.requirements.length === 0) {
            return null;
        }
        // Group requirements by type to create steps
        const requirementsByType = new Map();
        entityType.requirements.forEach((etReq)=>{
            if (etReq.requirement) {
                const type = etReq.requirement.type;
                if (!requirementsByType.has(type)) {
                    requirementsByType.set(type, []);
                }
                requirementsByType.get(type).push(etReq);
            }
        });
        // Create steps from requirement types with improved categorization
        // Maps requirement types to logical wizard steps and checklist categories
        const stepTypes = [
            {
                type: 'Information',
                title: 'Business Information',
                subtitle: 'Company details and registration',
                checklistCategory: 'Compliance',
                stepNumber: 1
            },
            {
                type: 'ProofOfIdentity',
                title: 'Identity Verification',
                subtitle: 'Proof of identity documents and verification',
                checklistCategory: 'Identity',
                stepNumber: 2
            },
            {
                type: 'ProofOfAddress',
                title: 'Address Verification',
                subtitle: 'Proof of address documents',
                checklistCategory: 'Address',
                stepNumber: 3
            },
            {
                type: 'OwnershipStructure',
                title: 'Ownership & Control',
                subtitle: 'Shareholders, beneficial owners, and ownership structure',
                checklistCategory: 'Compliance',
                stepNumber: 4
            },
            {
                type: 'BoardDirectors',
                title: 'Management & Directors',
                subtitle: 'Board of directors and key management personnel',
                checklistCategory: 'Compliance',
                stepNumber: 5
            },
            {
                type: 'AuthorizedSignatories',
                title: 'Authorized Signatories',
                subtitle: 'Persons authorized to sign on behalf of the entity',
                checklistCategory: 'Compliance',
                stepNumber: 6
            },
            {
                type: 'Document',
                title: 'Additional Documents',
                subtitle: 'Any additional required documents and certificates',
                checklistCategory: 'Documentation',
                stepNumber: 7
            }
        ];
        const steps = stepTypes.map((stepInfo, idx)=>{
            const reqs = requirementsByType.get(stepInfo.type);
            if (!reqs || reqs.length === 0) return null;
            // Sort by display order
            const sortedReqs = [
                ...reqs
            ].sort((a, b)=>a.displayOrder - b.displayOrder);
            const fields = sortedReqs.filter((etReq)=>etReq.requirement && etReq.requirement.isActive).map((etReq)=>convertRequirementToFormField(etReq.requirement, etReq.isRequired, etReq.displayOrder));
            if (fields.length === 0) return null;
            return {
                id: `step-${stepInfo.stepNumber}`,
                title: stepInfo.title,
                subtitle: stepInfo.subtitle,
                fields,
                requiredDocuments: fields.filter((f)=>f.type === 'file').map((f)=>f.id),
                // Metadata for integration
                requirementType: stepInfo.type,
                checklistCategory: stepInfo.checklistCategory,
                stepNumber: stepInfo.stepNumber
            };
        }).filter((step)=>step !== null);
        if (steps.length === 0) {
            return null;
        }
        return {
            entityType: entityType.code.toLowerCase(),
            displayName: entityType.displayName,
            description: entityType.description,
            steps,
            requiredDocuments: []
        };
    };
    // Get entity form configuration - prioritize backend data over static configs
    // Use useMemo to recompute when backend data or selected entity type changes
    const entityConfig = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "EnhancedNewPartnerApplicationPage.useMemo[entityConfig]": ()=>{
            let config = null;
            // First, try to generate config from backend requirements
            if (selectedEntityTypeData && selectedEntityTypeData.requirements && selectedEntityTypeData.requirements.length > 0) {
                config = generateFormConfigFromBackend(selectedEntityTypeData);
                if (config) {
                    console.log('Using backend-generated form config:', config);
                }
            }
            // Fallback to static config if backend doesn't have requirements
            if (!config) {
                config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$entityFormConfigs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEntityFormConfig"])(selectedEntityType);
                if (!config && selectedEntityType) {
                    // Try to find the entity type in the list to get display name
                    const entityTypeInfo = entityTypes.find({
                        "EnhancedNewPartnerApplicationPage.useMemo[entityConfig].entityTypeInfo": (et)=>et.value === selectedEntityType
                    }["EnhancedNewPartnerApplicationPage.useMemo[entityConfig].entityTypeInfo"]);
                    const fallbackConfig = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$entityFormConfigs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEntityFormConfig"])('private_company');
                    if (fallbackConfig && entityTypeInfo) {
                        // Use fallback config but with the correct entity type info
                        config = {
                            ...fallbackConfig,
                            entityType: selectedEntityType,
                            displayName: entityTypeInfo.label,
                            description: entityTypeInfo.description
                        };
                    }
                }
            }
            return config;
        }
    }["EnhancedNewPartnerApplicationPage.useMemo[entityConfig]"], [
        selectedEntityTypeData,
        selectedEntityType,
        entityTypes
    ]);
    // Debug logging
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EnhancedNewPartnerApplicationPage.useEffect": ()=>{
            if (selectedEntityType) {
                console.log('Selected entity type:', selectedEntityType);
                console.log('Entity config found:', !!entityConfig);
                if (!entityConfig) {
                    console.warn('No entity config found for:', selectedEntityType);
                    console.log('Available configs:', Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$entityFormConfigs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["entityFormConfigs"]));
                }
            }
        }
    }["EnhancedNewPartnerApplicationPage.useEffect"], [
        selectedEntityType,
        entityConfig
    ]);
    // Initial form data
    const initialFormData = {
        entityType: ""
    };
    // Use form persistence hook
    const { formData, updateField, updateNestedField, updateArrayField, addArrayItem, removeArrayItem, isDirty, lastSaved, isSaving, saveError, clearSavedData, forceSave } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useFormPersistence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useFormPersistence"])(initialFormData, {
        formId: "new-application"
    });
    // Update form data when entity type changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EnhancedNewPartnerApplicationPage.useEffect": ()=>{
            if (selectedEntityType && selectedEntityType !== formData.entityType) {
                updateField("entityType", selectedEntityType);
            }
        }
    }["EnhancedNewPartnerApplicationPage.useEffect"], [
        selectedEntityType,
        formData.entityType,
        updateField
    ]);
    // Fetch entity type data with requirements when selected
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EnhancedNewPartnerApplicationPage.useEffect": ()=>{
            const loadEntityTypeData = {
                "EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypeData": async ()=>{
                    if (!selectedEntityType) {
                        setSelectedEntityTypeData(null);
                        return;
                    }
                    try {
                        setLoadingEntityTypeData(true);
                        // Find the entity type ID from the entity types list
                        const entityTypeOption = entityTypes.find({
                            "EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypeData.entityTypeOption": (et)=>et.value === selectedEntityType
                        }["EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypeData.entityTypeOption"]);
                        if (!entityTypeOption || !entityTypeOption.originalCode) {
                            console.warn('Entity type not found in list');
                            return;
                        }
                        // Get all entity types with requirements to find the one we need
                        const allEntityTypes = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$entityConfigApi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["entityConfigApiService"].getEntityTypes(false, true);
                        const entityTypeData = allEntityTypes.find({
                            "EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypeData.entityTypeData": (et)=>et.code.toLowerCase() === entityTypeOption.originalCode?.toLowerCase()
                        }["EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypeData.entityTypeData"]);
                        if (entityTypeData) {
                            setSelectedEntityTypeData(entityTypeData);
                            console.log('Loaded entity type data:', entityTypeData);
                        } else {
                            console.warn('Entity type data not found');
                            setSelectedEntityTypeData(null);
                        }
                    } catch (err) {
                        console.error('Error loading entity type data:', err);
                        setSelectedEntityTypeData(null);
                    } finally{
                        setLoadingEntityTypeData(false);
                    }
                }
            }["EnhancedNewPartnerApplicationPage.useEffect.loadEntityTypeData"];
            loadEntityTypeData();
        }
    }["EnhancedNewPartnerApplicationPage.useEffect"], [
        selectedEntityType,
        entityTypes
    ]);
    const handleEntityTypeSelect = (entityType)=>{
        setSelectedEntityType(entityType);
        setCurrentStep(1);
        setValidationErrors({});
    };
    const handleFieldChange = (fieldId, value)=>{
        updateField(fieldId, value);
        // Clear validation error for this field
        if (validationErrors[fieldId]) {
            setValidationErrors((prev)=>{
                const newErrors = {
                    ...prev
                };
                delete newErrors[fieldId];
                return newErrors;
            });
        }
    };
    // Sync step completion with checklist and work-queue services
    const handleStepComplete = async (stepId)=>{
        if (!entityConfig) return;
        const step = entityConfig.steps.find((s)=>s.id === stepId);
        if (!step) return;
        console.log(`Step ${stepId} (${step.title}) completed`);
        try {
            // If we have a case ID, update checklist items for this step
            if (caseId && checklistId && step.checklistCategory) {
                // Get checklist to find items in this category
                const checklist = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$integrationService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["integrationService"].getChecklistByCase(caseId);
                if (checklist && checklist.items) {
                    // Find checklist items that match this step's category
                    const stepItems = checklist.items.filter((item)=>item.category === step.checklistCategory);
                    // Mark matching checklist items as completed
                    for (const item of stepItems){
                        try {
                            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$integrationService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["integrationService"].completeChecklistItem(checklistId, item.id, currentUser.name || 'partner', `Completed via ${step.title} step`);
                            console.log(`Marked checklist item ${item.name} as completed`);
                        } catch (err) {
                            console.warn(`Failed to update checklist item ${item.id}:`, err);
                        }
                    }
                }
            }
            // Update work queue progress if we have an application ID
            if (applicationId) {
                const progress = Math.round(currentStep / entityConfig.steps.length * 100);
                try {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$integrationService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["integrationService"].updateWorkQueueItem(applicationId, {
                        progress,
                        notes: `Completed step: ${step.title}`
                    });
                    console.log(`Updated work queue progress to ${progress}%`);
                } catch (err) {
                    console.warn('Failed to update work queue:', err);
                }
            }
        } catch (err) {
            console.error('Error syncing step completion:', err);
        // Don't block user flow if sync fails
        }
    };
    const handleNext = async ()=>{
        if (!entityConfig) return;
        const currentStepConfig = entityConfig.steps[currentStep - 1];
        if (!currentStepConfig) return;
        // Validate current step
        const errors = {};
        currentStepConfig.fields.forEach((field)=>{
            if (field.required) {
                const value = formData[field.id];
                if (!value || typeof value === 'string' && value.trim() === '') {
                    errors[field.id] = `${field.label} is required`;
                }
            }
        });
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            showToast({
                status: "error",
                title: "Validation Error",
                description: "Please complete all required fields before proceeding"
            });
            return;
        }
        setValidationErrors({});
        // Sync step completion with backend services before moving to next step
        if (currentStepConfig) {
            await handleStepComplete(currentStepConfig.id);
        }
        if (currentStep < entityConfig.steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };
    const handlePrevious = ()=>{
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };
    const handleSubmit = async ()=>{
        if (!entityConfig) return;
        // Prevent double submission
        if (isSubmitting) {
            console.warn('⚠️ Submission already in progress, ignoring duplicate call');
            return;
        }
        setIsSubmitting(true);
        console.log('🎯 Starting submission process...');
        try {
            // DYNAMIC VALIDATION: Validate based ONLY on the Entity Configuration Service requirements
            // that are actually being used in the form (from entityConfig.steps)
            if (!entityConfig || !entityConfig.steps || entityConfig.steps.length === 0) {
                console.error('❌ Cannot validate: entityConfig is missing or has no steps');
                showToast({
                    status: "error",
                    title: "Validation Error",
                    description: "Form configuration is missing. Please refresh and try again."
                });
                setIsSubmitting(false);
                return;
            }
            const errors = {};
            const validatedFields = [];
            // Validate ONLY the fields that are in the entityConfig being used to render the form
            // This entityConfig comes from the backend Entity Configuration Service
            // It contains ONLY the fields configured for this specific entity type
            // IMPORTANT: This is the SAME entityConfig passed to EnhancedDynamicForm (config={entityConfig})
            // So validation matches exactly what's displayed in the form - no hardcoded fields!
            entityConfig.steps.forEach((step)=>{
                if (!step.fields || step.fields.length === 0) {
                    return; // Skip steps with no fields
                }
                step.fields.forEach((field)=>{
                    // Track all fields being validated for debugging
                    validatedFields.push({
                        stepId: step.id,
                        stepTitle: step.title,
                        fieldId: field.id,
                        fieldLabel: field.label,
                        required: field.required || false
                    });
                    // Only validate required fields from the dynamic entity configuration
                    // field.required comes from the backend requirement configuration (etReq.isRequired)
                    if (field.required) {
                        const value = formData[field.id];
                        // Check for empty values (null, undefined, empty string, or whitespace-only)
                        const isEmpty = value === undefined || value === null || value === '' || typeof value === 'string' && value.trim() === '' || Array.isArray(value) && value.length === 0;
                        if (isEmpty) {
                            // Use field.label from entity config, not hardcoded text
                            errors[field.id] = `${field.label} is required`;
                        }
                    }
                });
            });
            // Log validation details for debugging
            // This confirms we're using the entity config that's actually rendering the form
            console.log('🔍 Validation check - Using entity configuration:', {
                entityType: entityConfig.entityType,
                displayName: entityConfig.displayName,
                source: selectedEntityTypeData ? 'Backend Entity Configuration Service' : 'Static fallback config',
                totalSteps: entityConfig.steps.length,
                totalFields: validatedFields.length,
                requiredFields: validatedFields.filter((f)=>f.required).length,
                missingFields: Object.keys(errors).length,
                validatedFields: validatedFields.map((f)=>({
                        step: f.stepTitle,
                        fieldId: f.fieldId,
                        fieldLabel: f.fieldLabel,
                        required: f.required
                    })),
                formDataKeys: Object.keys(formData),
                errors: errors
            });
            if (Object.keys(errors).length > 0) {
                setValidationErrors(errors);
                const missingFieldsList = Object.keys(errors).map((k)=>{
                    const field = validatedFields.find((f)=>f.fieldId === k);
                    return field ? field.fieldLabel : k;
                }).join(', ');
                console.warn('❌ Dynamic validation failed. Missing required fields from entity configuration:', {
                    missingFields: missingFieldsList,
                    missingFieldIds: Object.keys(errors),
                    stepBreakdown: entityConfig.steps.map((step)=>({
                            stepTitle: step.title,
                            requiredFields: step.fields.filter((f)=>f.required).map((f)=>({
                                    id: f.id,
                                    label: f.label,
                                    hasValue: !!(formData[f.id] && (typeof formData[f.id] !== 'string' || formData[f.id].trim() !== ''))
                                }))
                        }))
                });
                showToast({
                    status: "error",
                    title: "Submission Failed",
                    description: `Please complete all required fields: ${missingFieldsList}`
                });
                setIsSubmitting(false); // Reset submitting state so button is enabled again
                return;
            }
            console.log('✅ Dynamic validation passed - all required fields from entity configuration are filled');
            // Try to submit to backend API first
            try {
                // Backend will generate PartnerId from authenticated user's email automatically
                // We still validate email exists in form data for user feedback, but backend uses authenticated user's email
                // Look for email in various possible field names (based on requirement codes)
                const userEmail = formData["email"] || formData["contact_email"] || formData["applicant_email"] || formData["personOfContact.email"] || formData["applicant.email"] || currentUser.email || "";
                console.log('Looking for user email:', {
                    foundEmail: userEmail,
                    formDataKeys: Object.keys(formData),
                    emailFields: {
                        email: formData["email"],
                        contact_email: formData["contact_email"],
                        applicant_email: formData["applicant_email"],
                        currentUserEmail: currentUser.email
                    }
                });
                // Note: Backend will use authenticated user's email from token to generate PartnerId
                // This validation is just for user feedback - backend doesn't rely on form email for PartnerId
                if (!userEmail) {
                    showToast({
                        status: "error",
                        title: "Missing User Information",
                        description: "Unable to identify user email. Please ensure the email field is filled in."
                    });
                    setIsSubmitting(false);
                    return;
                }
                // Extract data from formData to create application
                // DYNAMICALLY map all form fields from entity configuration requirements
                // Field codes in formData are the requirement codes in lowercase (see convertRequirementToFormField)
                const getFieldValue = (fieldCode, fallbacks = [])=>{
                    // Try direct field code first (lowercase as stored in formData)
                    const lowerCode = fieldCode.toLowerCase();
                    if (formData[lowerCode] !== undefined && formData[lowerCode] !== null && formData[lowerCode] !== "") {
                        return formData[lowerCode];
                    }
                    // Try fallbacks
                    for (const fallback of fallbacks){
                        const lowerFallback = fallback.toLowerCase();
                        if (formData[lowerFallback] !== undefined && formData[lowerFallback] !== null && formData[lowerFallback] !== "") {
                            return formData[lowerFallback];
                        }
                    }
                    return undefined; // Return undefined instead of empty string to allow proper filtering
                };
                // Helper to get name parts from full name field
                const getNameParts = (fullName)=>{
                    if (!fullName) return {
                        firstName: "",
                        lastName: ""
                    };
                    const parts = fullName.trim().split(/\s+/);
                    if (parts.length === 1) return {
                        firstName: parts[0],
                        lastName: ""
                    };
                    return {
                        firstName: parts[0],
                        lastName: parts.slice(1).join(" ")
                    };
                };
                // DYNAMICALLY build applicant object based on ACTUAL requirement codes from entity configuration
                // This ensures we only map fields that are actually configured in the entity type
                const requirements = selectedEntityTypeData?.requirements || [];
                const requirementMap = new Map(); // Maps requirement code (uppercase) to formData key (lowercase)
                requirements.forEach((req)=>{
                    if (req.requirement?.code) {
                        const codeUpper = req.requirement.code.toUpperCase();
                        const codeLower = req.requirement.code.toLowerCase();
                        requirementMap.set(codeUpper, codeLower);
                    }
                });
                // Helper to find requirement code by pattern (e.g., find FIRST_NAME, GIVEN_NAME, etc.)
                const findRequirementValue = (patterns)=>{
                    for (const pattern of patterns){
                        for (const [codeUpper, codeLower] of requirementMap.entries()){
                            if (codeUpper.includes(pattern) || codeUpper === pattern) {
                                const value = getFieldValue(codeLower);
                                if (value !== undefined && value !== null && value !== "") {
                                    return value;
                                }
                            }
                        }
                    }
                    return undefined;
                };
                // Map applicant fields DYNAMICALLY based on actual requirement codes
                // Only use fields that exist in the entity configuration
                const fullNameValue = findRequirementValue([
                    "FULL_NAME",
                    "NAME",
                    "APPLICANT_NAME",
                    "PERSON_OF_CONTACT",
                    "CONTACT_NAME"
                ]);
                const nameParts = getNameParts(fullNameValue || "");
                const firstNameValue = findRequirementValue([
                    "FIRST_NAME",
                    "FIRSTNAME",
                    "GIVEN_NAME"
                ]) || nameParts.firstName;
                const lastNameValue = findRequirementValue([
                    "LAST_NAME",
                    "LASTNAME",
                    "SURNAME",
                    "FAMILY_NAME"
                ]) || nameParts.lastName;
                const emailValue = findRequirementValue([
                    "EMAIL",
                    "APPLICANT_EMAIL",
                    "CONTACT_EMAIL"
                ]) || userEmail;
                const phoneValue = findRequirementValue([
                    "PHONE",
                    "PHONE_NUMBER",
                    "CONTACT_PHONE",
                    "MOBILE",
                    "TELEPHONE"
                ]);
                const nationalityValue = findRequirementValue([
                    "NATIONALITY",
                    "COUNTRY_OF_NATIONALITY"
                ]);
                const dateOfBirthValue = findRequirementValue([
                    "DATE_OF_BIRTH",
                    "DOB",
                    "BIRTH_DATE"
                ]);
                // Address fields - dynamically find from requirements
                const addressLine1Value = findRequirementValue([
                    "ADDRESS",
                    "RESIDENTIAL_ADDRESS",
                    "APPLICANT_ADDRESS",
                    "STREET_ADDRESS",
                    "ADDRESS_LINE1",
                    "ADDRESS_LINE_1"
                ]);
                const addressLine2Value = findRequirementValue([
                    "ADDRESS_LINE2",
                    "ADDRESS_LINE_2",
                    "ADDRESS2"
                ]);
                const cityValue = findRequirementValue([
                    "CITY",
                    "APPLICANT_CITY",
                    "RESIDENTIAL_CITY"
                ]);
                const stateValue = findRequirementValue([
                    "STATE",
                    "PROVINCE",
                    "APPLICANT_STATE"
                ]);
                const postalCodeValue = findRequirementValue([
                    "POSTAL_CODE",
                    "POSTCODE",
                    "ZIP_CODE",
                    "APPLICANT_POSTAL_CODE"
                ]);
                const countryValue = findRequirementValue([
                    "COUNTRY",
                    "APPLICANT_COUNTRY",
                    "RESIDENTIAL_COUNTRY",
                    "COUNTRY_OF_RESIDENCE"
                ]);
                console.log('🔍 Dynamic applicant field mapping from entity requirements:', {
                    requirementCodes: Array.from(requirementMap.keys()),
                    mappedFields: {
                        firstName: firstNameValue,
                        lastName: lastNameValue,
                        email: emailValue,
                        phone: phoneValue,
                        nationality: nationalityValue,
                        dateOfBirth: dateOfBirthValue,
                        address: {
                            line1: addressLine1Value,
                            line2: addressLine2Value,
                            city: cityValue,
                            state: stateValue,
                            postalCode: postalCodeValue,
                            country: countryValue
                        }
                    },
                    formDataKeys: Object.keys(formData)
                });
                // Build applicant object - ONLY include fields that have values (from configured requirements)
                const applicant = {};
                if (firstNameValue) applicant.firstName = firstNameValue;
                if (lastNameValue) applicant.lastName = lastNameValue;
                if (emailValue) applicant.email = emailValue;
                if (phoneValue) applicant.phoneNumber = phoneValue;
                if (nationalityValue) applicant.nationality = nationalityValue;
                if (dateOfBirthValue) applicant.dateOfBirth = dateOfBirthValue;
                // Only include address if at least one field has a value
                const hasAddressData = addressLine1Value || cityValue || countryValue;
                if (hasAddressData) {
                    applicant.residentialAddress = {
                        line1: addressLine1Value || "",
                        line2: addressLine2Value || "",
                        city: cityValue || "",
                        state: stateValue || "",
                        postalCode: postalCodeValue || "",
                        country: countryValue || ""
                    };
                }
                // Determine if this is a business entity type DYNAMICALLY from requirements
                // Check if entity type has business-related requirements
                // Requirements come with uppercase codes (LEGAL_NAME, REGISTRATION_NUMBER, etc.)
                // Note: 'requirements' is already declared above
                const requirementCodes = requirements.filter((req)=>req.requirement).map((req)=>req.requirement.code?.toUpperCase() || '');
                // Business-related requirement codes (check uppercase versions)
                const businessCodes = [
                    'LEGAL_NAME',
                    'BUSINESS_LEGAL_NAME',
                    'COMPANY_NAME',
                    'REGISTRATION_NUMBER',
                    'BUSINESS_REGISTRATION',
                    'INCORPORATION',
                    'BUSINESS_ADDRESS',
                    'REGISTERED_ADDRESS',
                    'TRADING_NAME',
                    'TRADE_NAME',
                    'BUSINESS_NAME',
                    'COUNTRY_OF_REGISTRATION',
                    'COUNTRY_OF_INCORPORATION',
                    'BUSINESS_ADDRESS',
                    'TAX_NUMBER',
                    'TAX_ID'
                ];
                // Check requirement types for business indicators
                const businessTypes = [
                    'OwnershipStructure',
                    'BoardDirectors',
                    'AuthorizedSignatories'
                ];
                const hasBusinessCodes = requirementCodes.some((code)=>businessCodes.some((bc)=>code.includes(bc)));
                const hasBusinessTypes = requirements.some((req)=>{
                    const type = req.requirement?.type || '';
                    return businessTypes.some((bt)=>type.includes(bt));
                });
                const isBusinessEntity = hasBusinessCodes || hasBusinessTypes;
                // Debug logging
                console.log('Business entity detection:', {
                    requirementCodes,
                    hasBusinessCodes,
                    hasBusinessTypes,
                    isBusinessEntity,
                    requirementsCount: requirements.length
                });
                // Build business object dynamically from entity configuration requirements
                // Extract business fields from the dynamic requirements configured for this entity type
                let business = undefined;
                if (isBusinessEntity && selectedEntityTypeData?.requirements) {
                    // Dynamically extract business fields based on requirements configured for this entity type
                    // Requirements use UPPERCASE codes, but formData uses lowercase (from convertRequirementToFormField)
                    const businessRequirements = selectedEntityTypeData.requirements.filter((req)=>req.requirement).map((req)=>({
                            codeUpper: req.requirement.code?.toUpperCase() || '',
                            codeLower: req.requirement.code?.toLowerCase() || '',
                            type: req.requirement.type,
                            fieldType: req.requirement.fieldType
                        }));
                    // Find business name from requirements - check all possible business name requirement codes
                    // Map uppercase requirement codes to lowercase formData keys
                    const businessNameReqs = businessRequirements.filter((r)=>[
                            'LEGAL_NAME',
                            'BUSINESS_LEGAL_NAME',
                            'COMPANY_NAME',
                            'BUSINESS_NAME',
                            'REGISTERED_NAME',
                            'TRADING_NAME',
                            'TRADE_NAME'
                        ].some((bc)=>r.codeUpper.includes(bc)));
                    const businessLegalName = businessNameReqs.length > 0 ? getFieldValue(businessNameReqs[0].codeLower, businessNameReqs.slice(1).map((r)=>r.codeLower)) : null;
                    // Check if this entity type is likely a sole trader by checking requirement codes
                    const isSoleTrader = businessRequirements.some((r)=>r.codeUpper.includes('PROPRIETOR') || r.codeUpper.includes('SOLE') || r.codeUpper.includes('TRADER')) || selectedEntityTypeData.code?.toLowerCase().includes('sole') || selectedEntityTypeData.code?.toLowerCase().includes('trader');
                    const finalBusinessName = businessLegalName || (isSoleTrader ? `${nameParts.firstName} ${nameParts.lastName}`.trim() : null) || `${nameParts.firstName} ${nameParts.lastName}`.trim(); // Last resort
                    // Find registration number from requirements
                    const registrationReqs = businessRequirements.filter((r)=>[
                            'REGISTRATION_NUMBER',
                            'BUSINESS_REGISTRATION',
                            'COMPANY_REGISTRATION',
                            'TAX_NUMBER',
                            'TAX_ID'
                        ].some((rc)=>r.codeUpper.includes(rc)));
                    const registrationNumber = registrationReqs.length > 0 ? getFieldValue(registrationReqs[0].codeLower, registrationReqs.slice(1).map((r)=>r.codeLower)) : '';
                    // Find country of registration from requirements
                    const countryReqs = businessRequirements.filter((r)=>[
                            'COUNTRY_OF_REGISTRATION',
                            'COUNTRY_OF_INCORPORATION',
                            'REGISTRATION_COUNTRY',
                            'INCORPORATION_COUNTRY',
                            'BUSINESS_COUNTRY'
                        ].some((cc)=>r.codeUpper.includes(cc)));
                    const countryOfRegistration = countryReqs.length > 0 ? getFieldValue(countryReqs[0].codeLower, countryReqs.slice(1).map((r)=>r.codeLower)) : applicant.residentialAddress.country || '';
                    // Find business address fields from requirements
                    const addressReqs = businessRequirements.filter((r)=>[
                            'BUSINESS_ADDRESS',
                            'REGISTERED_ADDRESS',
                            'COMPANY_ADDRESS'
                        ].some((ac)=>r.codeUpper.includes(ac)));
                    const addressLine1 = addressReqs.length > 0 ? getFieldValue(addressReqs[0].codeLower, addressReqs.slice(1).map((r)=>r.codeLower)) : applicant.residentialAddress.line1 || '';
                    // Always build business object for business entity types
                    if (finalBusinessName || isBusinessEntity) {
                        business = {
                            legalName: finalBusinessName || `${nameParts.firstName} ${nameParts.lastName}`.trim() || 'Business',
                            registrationNumber: registrationNumber || "",
                            countryOfRegistration: countryOfRegistration || "",
                            registeredAddress: {
                                line1: addressLine1 || applicant.residentialAddress.line1 || "",
                                line2: getFieldValue("business_address_line2", [
                                    "registered_address_line2",
                                    "business_address_line_2",
                                    "company_address_line2"
                                ]) || applicant.residentialAddress.line2 || "",
                                city: getFieldValue("business_city", [
                                    "registered_city",
                                    "company_city",
                                    "business_city_of_registration"
                                ]) || applicant.residentialAddress.city || "",
                                state: getFieldValue("business_state", [
                                    "registered_state",
                                    "company_state",
                                    "business_state_of_registration"
                                ]) || applicant.residentialAddress.state || "",
                                postalCode: getFieldValue("business_postal_code", [
                                    "registered_postal_code",
                                    "company_postal_code",
                                    "business_postcode"
                                ]) || applicant.residentialAddress.postalCode || "",
                                country: countryOfRegistration || applicant.residentialAddress.country || ""
                            }
                        };
                    }
                }
                // Convert date string to ISO date format (YYYY-MM-DD) if present
                // Backend expects date format, not datetime
                if (applicant.dateOfBirth) {
                    try {
                        const date = new Date(applicant.dateOfBirth);
                        if (isNaN(date.getTime())) {
                            console.warn('Invalid date format for dateOfBirth:', applicant.dateOfBirth);
                            applicant.dateOfBirth = undefined;
                        } else {
                            // Format as YYYY-MM-DD (date only, not datetime)
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            applicant.dateOfBirth = `${year}-${month}-${day}`;
                        }
                    } catch (e) {
                        console.warn('Error processing dateOfBirth:', e, applicant.dateOfBirth);
                        applicant.dateOfBirth = undefined;
                    }
                }
                // Map entity type code to backend enum format
                // Backend expects: PRIVATE_COMPANY, PUBLIC_COMPANY, SOLE_PROPRIETOR, PARTNERSHIP, TRUST, NPO, etc.
                const mapEntityTypeToBackend = (code)=>{
                    if (!code) return "PRIVATE_COMPANY";
                    const upperCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '_');
                    // Handle common variations
                    if (upperCode.includes('PRIVATE') || upperCode.includes('COMPANY')) return "PRIVATE_COMPANY";
                    if (upperCode.includes('PUBLIC')) return "PUBLIC_COMPANY";
                    // Handle sole trader/proprietor variations
                    if (upperCode.includes('SOLE') || upperCode.includes('PROPRIETOR') || upperCode.includes('TRADER')) return "SOLE_PROPRIETOR";
                    if (upperCode.includes('PARTNERSHIP')) return "PARTNERSHIP";
                    if (upperCode.includes('TRUST')) return "TRUST";
                    if (upperCode.includes('NPO') || upperCode.includes('NGO') || upperCode.includes('NON_PROFIT')) return "NPO";
                    return upperCode;
                };
                // Build application data with all mapped fields
                // API uses snake_case_lower naming policy (see Program.cs JsonNamingPolicy.SnakeCaseLower)
                // OnboardingType enum: 1=Individual, 2=Business
                // For business entity types, always use type 2 (Business), even if business object is minimal
                const onboardingType = isBusinessEntity ? 2 : 1; // 1=Individual, 2=Business
                const mappedEntityTypeCode = mapEntityTypeToBackend(selectedEntityTypeData?.code || formData["entityType"]);
                const originalEntityTypeCode = selectedEntityTypeData?.code || formData["entityType"] || '';
                // Debug: Log what we're sending
                console.log('Submitting application with data:', {
                    mappedEntityType: mappedEntityTypeCode,
                    originalEntityTypeCode,
                    isBusinessEntity,
                    onboardingType,
                    partnerId: 'Will be generated by backend from authenticated user email',
                    applicant: {
                        firstName: applicant.firstName,
                        lastName: applicant.lastName,
                        email: applicant.email,
                        dateOfBirth: applicant.dateOfBirth ? 'Date set' : 'Not set'
                    },
                    business: business ? {
                        legalName: business.legalName,
                        hasAddress: !!(business.registeredAddress?.line1 && business.registeredAddress?.city)
                    } : 'Not set',
                    formDataKeys: Object.keys(formData).filter((k)=>formData[k] !== undefined && formData[k] !== null && formData[k] !== "")
                });
                // DYNAMIC VALIDATION:
                // The form already validates required fields based on Entity Configuration Service requirements.
                // We only need to ensure we can construct a valid API request with the data we have.
                // Transform full_name to firstName/lastName if needed (for API format)
                // ONLY if we have a full_name value from the form
                if ((!applicant.firstName || !applicant.lastName) && fullNameValue) {
                    const trimmedName = fullNameValue.trim();
                    if (trimmedName) {
                        const parts = trimmedName.split(/\s+/);
                        applicant.firstName = parts[0] || '';
                        applicant.lastName = parts.slice(1).join(' ') || '';
                    }
                }
                // NO HARDCODED VALIDATION - validation is already done based on entityConfig.steps above
                // The form validation at the top of handleSubmit ensures all required fields from the
                // dynamic entity configuration are filled. We only need to format the data for the API here.
                // Format nationality to 2-character ISO code if present (only if field exists in form)
                // Map common country names to ISO codes, otherwise take first 2 characters
                if (applicant.nationality) {
                    const countryNameToCode = {
                        'south africa': 'ZA',
                        'kenya': 'KE',
                        'nigeria': 'NG',
                        'ghana': 'GH',
                        'zimbabwe': 'ZW',
                        'zambia': 'ZM',
                        'tanzania': 'TZ',
                        'uganda': 'UG',
                        'rwanda': 'RW',
                        'mauritius': 'MU',
                        'united states': 'US',
                        'united kingdom': 'GB',
                        'united states of america': 'US'
                    };
                    const normalized = applicant.nationality.trim().toLowerCase();
                    if (countryNameToCode[normalized]) {
                        applicant.nationality = countryNameToCode[normalized];
                    } else {
                        // If it's already 2 characters, use as-is (assume it's already a code)
                        // Otherwise, take first 2 characters
                        applicant.nationality = applicant.nationality.length === 2 ? applicant.nationality.toUpperCase() : applicant.nationality.toUpperCase().substring(0, 2);
                    }
                }
                // For business entities, provide defaults if needed for API format
                // The form already validated based on Entity Configuration Service requirements
                if (isBusinessEntity && onboardingType === 2 && business) {
                    // Provide defaults for business name (use applicant name as fallback for sole traders)
                    if (!business.legalName) {
                        business.legalName = `${applicant.firstName} ${applicant.lastName}`.trim() || 'Business Name';
                    }
                    // Use residential address as fallback for business address if missing
                    if (!business.registeredAddress.line1 || !business.registeredAddress.city || !business.registeredAddress.country) {
                        business.registeredAddress = {
                            line1: business.registeredAddress.line1 || applicant.residentialAddress.line1,
                            line2: business.registeredAddress.line2 || applicant.residentialAddress.line2 || '',
                            city: business.registeredAddress.city || applicant.residentialAddress.city,
                            state: business.registeredAddress.state || applicant.residentialAddress.state || '',
                            postalCode: business.registeredAddress.postalCode || applicant.residentialAddress.postalCode || '',
                            country: business.registeredAddress.country || applicant.residentialAddress.country
                        };
                    }
                }
                // Collect ALL dynamic fields from requirements that aren't already mapped
                // Store them in metadata so nothing is lost
                const mappedFields = new Set([
                    // Applicant fields
                    'first_name',
                    'last_name',
                    'middle_name',
                    'email',
                    'phone_number',
                    'date_of_birth',
                    'nationality',
                    'tax_id',
                    'passport_number',
                    'drivers_license_number',
                    // Address fields
                    'address',
                    'address_line1',
                    'address_line2',
                    'city',
                    'state',
                    'postal_code',
                    'country',
                    'residential_address',
                    'applicant_address',
                    'applicant_city',
                    'applicant_country',
                    // Business fields
                    'legal_name',
                    'business_legal_name',
                    'company_name',
                    'business_name',
                    'registered_name',
                    'trading_name',
                    'registration_number',
                    'business_registration_number',
                    'country_of_registration',
                    'business_country',
                    'business_address',
                    'registered_address',
                    'business_city',
                    'business_state',
                    'business_postal_code',
                    // Standard fields
                    'entitytype',
                    'partner_reference_id',
                    'reference_id'
                ]);
                // Collect all other form fields as metadata
                const metadata = {};
                // Store entity type configuration info
                metadata['entity_type_code'] = originalEntityTypeCode;
                metadata['entity_type_display_name'] = selectedEntityTypeData?.displayName || '';
                // Store all dynamic requirement-based fields
                // IMPORTANT: Use requirement.code as the key (normalized to lowercase) to match entity config
                Object.keys(formData).forEach((key)=>{
                    const lowerKey = key.toLowerCase();
                    const value = formData[key];
                    // Skip already mapped fields and empty values
                    // Note: File upload objects are preserved (they contain fileName, googleDriveUrl, etc.)
                    const isEmpty = value === undefined || value === null || value === '' || typeof value === 'string' && value.trim() === '' || Array.isArray(value) && value.length === 0;
                    if (!mappedFields.has(lowerKey) && !isEmpty) {
                        // Store with requirement code as key (lowercase version of requirement.code)
                        // This ensures consistency: entity config uses UPPERCASE codes, we store lowercase in metadata
                        // File uploads are stored as objects with fileName, googleDriveUrl, fileId, etc.
                        metadata[lowerKey] = value;
                    }
                });
                // Store requirement codes that were configured for this entity type
                // This helps with validation and debugging
                if (selectedEntityTypeData?.requirements) {
                    const requirementCodes = selectedEntityTypeData.requirements.filter((req)=>req.requirement).map((req)=>req.requirement.code.toLowerCase()); // Store lowercase for consistency
                    metadata['configured_requirements'] = requirementCodes.join(',');
                    // Also store a mapping of requirement codes to their display names for reference
                    const requirementMap = {};
                    selectedEntityTypeData.requirements.forEach((req)=>{
                        if (req.requirement) {
                            requirementMap[req.requirement.code.toLowerCase()] = req.requirement.displayName;
                        }
                    });
                    metadata['requirement_display_names'] = JSON.stringify(requirementMap);
                }
                // Build applicant object - ONLY include fields that exist in formData (from dynamic form)
                // Do NOT add hardcoded defaults - only send what's actually configured in the entity form
                // The applicant object was built dynamically above based on actual requirement codes
                const applicantData = {};
                // Log what we have from the dynamic mapping
                console.log('📋 Building applicantData from dynamic mapping:', {
                    applicantObject: applicant,
                    applicantKeys: Object.keys(applicant),
                    hasFirstName: !!applicant.firstName,
                    hasLastName: !!applicant.lastName,
                    hasEmail: !!applicant.email,
                    hasPhone: !!applicant.phoneNumber,
                    hasDateOfBirth: !!applicant.dateOfBirth,
                    hasNationality: !!applicant.nationality,
                    hasAddress: !!applicant.residentialAddress,
                    addressData: applicant.residentialAddress
                });
                // Only include fields that have values (from configured requirements)
                // These come from the entity configuration service requirements
                if (applicant.firstName) applicantData.first_name = applicant.firstName;
                if (applicant.lastName) applicantData.last_name = applicant.lastName;
                if (applicant.email) applicantData.email = applicant.email;
                if (applicant.middleName) applicantData.middle_name = applicant.middleName;
                if (applicant.phoneNumber) applicantData.phone_number = applicant.phoneNumber;
                if (applicant.dateOfBirth) applicantData.date_of_birth = applicant.dateOfBirth;
                if (applicant.nationality) applicantData.nationality = applicant.nationality;
                // Only include address if it exists (was built from configured requirements)
                if (applicant.residentialAddress) {
                    applicantData.residential_address = {
                        line1: applicant.residentialAddress.line1 || "",
                        line2: applicant.residentialAddress.line2 || "",
                        city: applicant.residentialAddress.city || "",
                        state: applicant.residentialAddress.state || "",
                        postal_code: applicant.residentialAddress.postalCode || "",
                        country: applicant.residentialAddress.country || ""
                    };
                }
                // Log final applicantData structure
                console.log('📤 Final applicantData being sent:', {
                    applicantData,
                    applicantDataKeys: Object.keys(applicantData),
                    hasAllRequiredFields: {
                        first_name: !!applicantData.first_name,
                        last_name: !!applicantData.last_name,
                        email: !!applicantData.email,
                        phone_number: !!applicantData.phone_number,
                        date_of_birth: !!applicantData.date_of_birth,
                        nationality: !!applicantData.nationality,
                        residential_address: !!applicantData.residential_address
                    }
                });
                const applicationData = {
                    type: onboardingType,
                    // partner_id is intentionally omitted - backend will generate it from authenticated user's email
                    // This ensures the PartnerId matches the authenticated user and prevents mismatches
                    partner_reference_id: formData["partner_reference_id"] || formData["reference_id"] || "",
                    applicant: applicantData,
                    business: business ? {
                        legal_name: business.legalName,
                        registration_number: business.registrationNumber,
                        country_of_registration: business.countryOfRegistration,
                        registered_address: {
                            line1: business.registeredAddress.line1,
                            line2: business.registeredAddress.line2 || "",
                            city: business.registeredAddress.city,
                            state: business.registeredAddress.state || "",
                            postal_code: business.registeredAddress.postalCode || "",
                            country: business.registeredAddress.country
                        }
                    } : undefined,
                    // Include metadata with all dynamic fields
                    metadata: Object.keys(metadata).length > 0 ? metadata : undefined
                };
                // Log the partnerId that would be generated (for debugging)
                // Backend will generate it from authenticated user's email automatically
                console.log('📝 PartnerId will be generated by backend from authenticated user email:', userEmail);
                // Try to create application via API
                // Use the onboarding API endpoint (port 8001) via proxy
                const { getAuthUser } = await __turbopack_context__.A("[project]/src/lib/auth/session.ts [app-client] (ecmascript, async loader)");
                const user = getAuthUser();
                const headers = {
                    'Content-Type': 'application/json'
                };
                // Add schema-driven form headers for dynamic validation (backend checks headers first)
                if (originalEntityTypeCode) {
                    headers['X-Entity-Type'] = originalEntityTypeCode;
                    console.log('📋 Added X-Entity-Type header for schema-based validation:', originalEntityTypeCode);
                }
                // Add form configuration ID and version if available from entity type data
                if (selectedEntityTypeData?.id) {
                    headers['X-Form-Config-Id'] = selectedEntityTypeData.id;
                    console.log('📋 Added X-Form-Config-Id header:', selectedEntityTypeData.id);
                }
                // Use updatedAt as version indicator (or a version field if available)
                if (selectedEntityTypeData?.updatedAt) {
                    // Use timestamp as version identifier
                    const version = new Date(selectedEntityTypeData.updatedAt).getTime().toString();
                    headers['X-Form-Version'] = version;
                    console.log('📋 Added X-Form-Version header:', version);
                } else if (selectedEntityTypeData?.id) {
                    // Fallback: use ID hash as version
                    headers['X-Form-Version'] = '1';
                    console.log('📋 Added X-Form-Version header (default): 1');
                }
                // Add user identification headers
                if (user?.email) {
                    headers['X-User-Email'] = user.email;
                    headers['X-User-Name'] = user.name || user.email;
                    headers['X-User-Role'] = 'Applicant';
                }
                console.log('📤 Submitting to API:', {
                    url: '/api/proxy/api/v1/cases',
                    partnerId: 'Will be generated by backend from authenticated user email',
                    userEmail: userEmail,
                    type: applicationData.type,
                    applicant: {
                        firstName: applicationData.applicant.first_name,
                        lastName: applicationData.applicant.last_name,
                        email: applicationData.applicant.email,
                        hasAddress: !!applicationData.applicant.residential_address?.line1
                    },
                    business: applicationData.business ? {
                        legalName: applicationData.business?.legal_name,
                        hasRegistrationNumber: !!applicationData.business?.registration_number
                    } : 'None',
                    metadataKeys: Object.keys(applicationData.metadata || {})
                });
                // Log the exact data being sent for debugging
                // Log the EXACT applicant data being sent
                console.log('🚀 Making API call with data:', {
                    applicant: applicationData.applicant,
                    applicantKeys: Object.keys(applicationData.applicant || {}),
                    applicantHasAddress: !!applicationData.applicant?.residential_address,
                    addressKeys: applicationData.applicant?.residential_address ? Object.keys(applicationData.applicant.residential_address) : [],
                    business: business ? 'Set' : 'Not set',
                    type: applicationData.type,
                    fullApplicationData: JSON.stringify(applicationData, null, 2)
                });
                let response;
                try {
                    response = await fetch('/api/proxy/api/v1/cases', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(applicationData)
                    });
                    console.log('✅ API call completed, status:', response.status);
                } catch (fetchError) {
                    console.error('❌ Fetch failed:', fetchError);
                    throw fetchError;
                }
                const responseText = await response.text();
                console.log('📨 API Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    bodyLength: responseText.length,
                    body: responseText.substring(0, 500) // First 500 chars
                });
                // Parse error details for better user feedback
                let errorDetails = '';
                try {
                    const errorJson = JSON.parse(responseText);
                    if (errorJson.errors) {
                        const errorMessages = Object.entries(errorJson.errors).map(([field, messages])=>{
                            const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
                            return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
                        }).join('; ');
                        errorDetails = errorMessages;
                        console.error('❌ Backend validation errors:', errorJson.errors);
                    } else if (errorJson.message) {
                        errorDetails = errorJson.message;
                    }
                } catch (e) {
                    // Not JSON, use raw text
                    errorDetails = responseText.substring(0, 200);
                }
                if (response.ok) {
                    let result;
                    try {
                        result = JSON.parse(responseText);
                    } catch (e) {
                        console.error('Failed to parse response JSON:', e, responseText);
                        throw new Error('Invalid response from server');
                    }
                    // Backend returns both case_id (Guid) and case_number (string)
                    // Use case_number for display/linking since that's what projections API uses
                    const createdCaseId = result.case_number || result.case_id || result.caseId;
                    const caseGuid = result.case_id || result.id;
                    if (!createdCaseId) {
                        console.error('No case ID returned from backend:', result);
                        throw new Error('Case was created but no case ID was returned');
                    }
                    console.log('✅ Case created successfully:', {
                        caseId: createdCaseId,
                        caseGuid,
                        fullResult: result
                    });
                    // Upload files to Document Service after case creation
                    if (fileObjects.size > 0 && caseGuid) {
                        try {
                            console.log(`📎 Uploading ${fileObjects.size} file(s) to Document Service...`);
                            // Get partner ID from authenticated user email
                            // Backend generates PartnerId from email using MD5 hash
                            // We'll use the email and let the backend handle it, or generate it client-side
                            // For now, we'll pass the email and the backend will generate the PartnerId
                            // But document service requires PartnerId, so we need to generate it
                            // Using a simple approach - in production, use proper MD5 implementation
                            let partnerId = '';
                            if (user?.email) {
                                // Generate PartnerId using MD5 (matching backend algorithm)
                                // For now, use a placeholder - in production, implement proper MD5
                                const normalizedEmail = user.email.toLowerCase().trim();
                                // Simple hash (replace with proper MD5 in production)
                                let hash = 0;
                                for(let i = 0; i < normalizedEmail.length; i++){
                                    hash = (hash << 5) - hash + normalizedEmail.charCodeAt(i);
                                    hash = hash & hash;
                                }
                                const hex = Math.abs(hash).toString(16).padStart(32, '0');
                                partnerId = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
                            }
                            if (!partnerId) {
                                console.warn('⚠️ Cannot upload files: Partner ID not available');
                            } else {
                                // Prepare files for upload
                                const filesToUpload = Array.from(fileObjects.entries()).map(([requirementCode, file])=>({
                                        file,
                                        requirementCode,
                                        description: formData[requirementCode]?.fileName || file.name
                                    }));
                                // Upload all files
                                const uploadResults = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$documentUpload$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uploadFilesToDocumentService"])(caseGuid, partnerId, filesToUpload, user?.email);
                                // Log results and store document IDs in metadata
                                const uploadedDocuments = {};
                                uploadResults.forEach(({ requirementCode, result, error })=>{
                                    if (error) {
                                        console.error(`❌ Failed to upload file for ${requirementCode}:`, error);
                                    } else if (result.documentId) {
                                        console.log(`✅ File uploaded successfully for ${requirementCode}:`, {
                                            documentId: result.documentId,
                                            documentNumber: result.documentNumber,
                                            storageKey: result.storageKey
                                        });
                                        uploadedDocuments[`${requirementCode}_document_id`] = result.documentId;
                                        uploadedDocuments[`${requirementCode}_storage_key`] = result.storageKey;
                                    }
                                });
                                // Update case metadata with document IDs (optional - can be done via separate API call if needed)
                                if (Object.keys(uploadedDocuments).length > 0) {
                                    console.log('📋 Document IDs stored:', uploadedDocuments);
                                }
                            }
                        } catch (uploadError) {
                            console.error('❌ Error uploading files to Document Service:', uploadError);
                            // Don't fail the entire submission - files can be uploaded later
                            showToast({
                                status: "error",
                                title: "File Upload Warning",
                                description: "Case created successfully, but some files failed to upload. You can upload them later."
                            });
                        }
                    }
                    // Trigger projections sync to ensure case is available in read model
                    // This is a best-effort call - don't block on it
                    // Note: The onboarding API also triggers sync automatically, but we trigger it here
                    // to ensure immediate visibility (with a small delay to let the DB transaction commit)
                    try {
                        // Wait a bit for the database transaction to commit
                        await new Promise((resolve)=>setTimeout(resolve, 1000));
                        console.log('Triggering projections sync...');
                        const syncResponse = await fetch('/api/proxy/api/v1/sync?forceFullSync=false', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...user?.email ? {
                                    'X-User-Email': user.email,
                                    'X-User-Name': user.name || user.email,
                                    'X-User-Role': 'Applicant'
                                } : {}
                            }
                        });
                        if (syncResponse.ok) {
                            const syncResult = await syncResponse.json();
                            console.log('✅ Projections sync completed:', syncResult);
                        } else {
                            const errorText = await syncResponse.text();
                            console.error('❌ Projections sync failed:', {
                                status: syncResponse.status,
                                error: errorText
                            });
                        // Don't fail - the onboarding API also triggers sync, and admin can manually sync
                        }
                    } catch (syncError) {
                        console.error('❌ Failed to trigger projections sync:', syncError);
                    // Don't block - the onboarding API also triggers sync automatically, and admin can manually sync
                    }
                    showToast({
                        status: "success",
                        title: "Application Submitted Successfully",
                        description: `Your application has been submitted. Case ID: ${createdCaseId}`
                    });
                    // Redirect to dashboard with success message
                    setTimeout(()=>{
                        window.location.href = `/partner/dashboard?submitted=true&caseId=${createdCaseId}`;
                    }, 2000);
                    return;
                } else {
                    // Handle error response - DO NOT SILENTLY FAIL
                    let errorMessage = `Server error: ${response.status} ${response.statusText}`;
                    let errorDetails = '';
                    try {
                        const errorJson = JSON.parse(responseText);
                        errorMessage = errorJson.error || errorJson.message || errorJson.title || errorMessage;
                        // Extract detailed validation errors
                        if (errorJson.errors) {
                            const validationErrors = Object.entries(errorJson.errors).map(([field, messages])=>{
                                const fieldName = field.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() || field;
                                const msgList = Array.isArray(messages) ? messages : [
                                    messages
                                ];
                                return `${fieldName}: ${msgList.join(', ')}`;
                            }).join('; ');
                            errorDetails = validationErrors || errorJson.details || '';
                        } else {
                            errorDetails = errorJson.details || errorJson.message || '';
                        }
                    } catch  {
                        errorDetails = responseText.substring(0, 200) || '';
                    }
                    // Special handling for 503 Service Unavailable
                    if (response.status === 503) {
                        errorMessage = "❌ BACKEND SERVICE NOT RUNNING";
                        errorDetails = "The kyb-case-api service is not running on port 8001. TO FIX: Start the backend service using 'docker-compose up -d kyb-case-api' and try again. Your form data has been saved locally as a draft.";
                        // Auto-save the form data as a draft when service is unavailable
                        try {
                            await forceSave();
                            console.log('✅ Form data saved locally as draft due to service unavailability');
                        } catch (saveError) {
                            console.warn('Failed to save draft:', saveError);
                        }
                        // Log clear instructions
                        console.error('🚨 BACKEND SERVICE REQUIRED:', {
                            service: 'kyb-case-api',
                            port: '8001',
                            endpoint: 'http://localhost:8001/api/v1/cases',
                            action: 'Start the service: docker-compose up -d kyb-case-api',
                            checkStatus: 'docker ps --filter "name=kyb_case_api"'
                        });
                    }
                    // Log error once with all relevant details
                    console.error(' API submission failed:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorMessage,
                        details: errorDetails,
                        submittedData: {
                            type: applicationData.type,
                            partnerId: 'Generated by backend from authenticated user email',
                            hasApplicant: !!applicationData.applicant,
                            hasBusiness: !!applicationData.business
                        }
                    });
                    // Show very clear error message for 503
                    if (response.status === 503) {
                        showToast({
                            status: "error",
                            title: "❌ Backend Service Not Running",
                            description: "The kyb-case-api service must be started on port 8001 to submit applications. Run: docker-compose up -d kyb-case-api. Your form has been saved as a draft."
                        });
                    } else {
                        showToast({
                            status: "error",
                            title: errorMessage,
                            description: errorDetails || "Please try again later or contact support if the problem persists."
                        });
                    }
                    // Create error with message for re-throwing (will be caught by outer catch)
                    const submissionError = new Error(errorMessage);
                    submissionError.status = response.status;
                    submissionError.details = errorDetails;
                    throw submissionError;
                }
            } catch (apiError) {
                // Only log if this is a fetch error (not already logged above)
                // If it's a response error, it was already logged in the else block above
                if (apiError?.name === 'TypeError' || apiError?.message?.includes('fetch failed')) {
                    console.error('❌ Network error during submission:', {
                        message: apiError?.message,
                        name: apiError?.name
                    });
                }
                // Check if it's a connection/service unavailable error
                const isServiceUnavailable = apiError?.status === 503 || apiError?.message?.includes('Backend service unavailable') || apiError?.message?.includes('Service Unavailable') || apiError?.message?.includes('ECONNREFUSED') || apiError?.message?.includes('fetch failed');
                // Show error to user - DO NOT show fake success
                if (isServiceUnavailable && !apiError?.details) {
                    // Try to save as draft (if not already saved)
                    try {
                        await forceSave();
                        console.log('✅ Form data saved locally as draft');
                    } catch (saveError) {
                        console.warn('Failed to save draft:', saveError);
                    }
                    showToast({
                        status: "error",
                        title: "Service Unavailable",
                        description: "The backend service is not running. Your form has been saved locally. Please start the backend service and try again."
                    });
                } else if (!apiError?.details) {
                    // Only show toast if not already shown above
                    showToast({
                        status: "error",
                        title: "Submission Failed",
                        description: apiError?.message || "Failed to submit application. Please check your connection and try again."
                    });
                }
                // DO NOT redirect - let user see the error and retry
                throw apiError; // Re-throw to be caught by outer catch
            }
        } catch (error) {
            // Only log if error wasn't already logged above
            // Most errors are already logged in the inner catch blocks
            if (!error?.status && !error?.details) {
                console.error('❌ Unexpected submission error:', {
                    message: error?.message,
                    name: error?.name
                });
            }
            // Check if it's a service unavailable error
            const isServiceUnavailable = error?.status === 503 || error?.message?.includes('Backend service unavailable') || error?.message?.includes('Service Unavailable') || error?.message?.includes('ECONNREFUSED') || error?.message?.includes('fetch failed');
            // Only show toast if not already shown in inner catch blocks
            if (isServiceUnavailable && !error?.details) {
                showToast({
                    status: "error",
                    title: "Service Unavailable",
                    description: "The backend service is not running. Your form data has been saved locally. Please start the backend service (kyb-case-api on port 8001) using 'docker-compose up -d kyb-case-api' and try submitting again."
                });
            } else if (!error?.details) {
                showToast({
                    status: "error",
                    title: "Submission Failed",
                    description: error instanceof Error ? error.message : "Failed to submit application. Please try again."
                });
            }
        } finally{
            setIsSubmitting(false);
        }
    };
    const handleStepClick = (stepIndex)=>{
        setCurrentStep(stepIndex);
    };
    const handleResumeFromStep = (stepIndex)=>{
        setCurrentStep(stepIndex);
    };
    const handleSaveProgress = async ()=>{
        await forceSave();
        showToast({
            status: "success",
            title: "Progress Saved",
            description: "Your progress has been saved successfully"
        });
    };
    const handleValidationComplete = (fieldId, result)=>{
        if (result.isValid && result.data) {
            // Auto-populate fields based on validation result
            Object.entries(result.data).forEach(([key, value])=>{
                const fieldMapping = {
                    'companyName': 'companyName',
                    'registeredName': 'companyName',
                    'registrationNumber': 'registrationNumber',
                    'incorporationDate': 'dateOfIncorporation',
                    'address': 'businessAddress',
                    'authorizedCapital': 'authorizedCapital',
                    'issuedCapital': 'issuedCapital'
                };
                const mappedField = fieldMapping[key];
                if (mappedField && !formData[mappedField]) {
                    updateField(mappedField, value);
                }
            });
        }
    };
    const handleDataExtracted = (fieldMappings)=>{
        fieldMappings.forEach((mapping)=>{
            updateField(mapping.fieldId, mapping.extractedValue);
        });
    };
    const handleDocumentProcessed = (result)=>{
        console.log('Document processed:', result);
    };
    const handleSendMessage = async (content, context, attachments)=>{
        console.log('Sending message:', {
            content,
            context,
            attachments
        });
    // Implement message sending logic
    };
    const handleReplyToMessage = async (messageId, content)=>{
        console.log('Replying to message:', {
            messageId,
            content
        });
    // Implement reply logic
    };
    const handleForwardMessage = async (messageId, toConversationId)=>{
        console.log('Forwarding message:', {
            messageId,
            toConversationId
        });
    // Implement forward logic
    };
    const handleStarMessage = async (messageId)=>{
        console.log('Starring message:', messageId);
    // Implement star logic
    };
    const handleArchiveConversation = async (conversationId)=>{
        console.log('Archiving conversation:', conversationId);
    // Implement archive logic
    };
    const handleAssignConversation = async (conversationId, adminId)=>{
        console.log('Assigning conversation:', {
            conversationId,
            adminId
        });
    // Implement assign logic
    };
    const handleTagConversation = async (conversationId, tags)=>{
        console.log('Tagging conversation:', {
            conversationId,
            tags
        });
    // Implement tag logic
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EnhancedNewPartnerApplicationPage.useEffect": ()=>{
            const user = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthUser"])();
            setCurrentUser({
                name: user.name,
                email: user.email
            });
        }
    }["EnhancedNewPartnerApplicationPage.useEffect"], []);
    // Entity Type Selection
    if (!selectedEntityType) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
            minH: "100vh",
            bg: "gray.50",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                    bg: "white",
                    borderBottom: "1px",
                    borderColor: "gray.200",
                    py: "4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$container$2f$container$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Container"], {
                        maxW: "7xl",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                            justify: "space-between",
                            align: "center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                    gap: "4",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$image$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Image"], {
                                        src: "/mukuru-logo.png",
                                        alt: "Mukuru",
                                        height: "32px"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 1793,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                    lineNumber: 1792,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                    gap: "4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/partner/profile",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "ghost",
                                                size: "sm",
                                                children: "Profile"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                lineNumber: 1797,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                            lineNumber: 1796,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/partner/messages",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "ghost",
                                                size: "sm",
                                                children: "Messages"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                lineNumber: 1800,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                            lineNumber: 1799,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                            variant: "outline",
                                            size: "sm",
                                            onClick: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logout"])('http://localhost:3000/'),
                                            children: "Logout"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                            lineNumber: 1802,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/partner/application/enhanced",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                size: "sm",
                                                variant: "solid",
                                                className: "mukuru-primary-button",
                                                borderRadius: "full",
                                                px: "6",
                                                fontWeight: "medium",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiArrowRight"],
                                                        mr: "2"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                        lineNumber: 1805,
                                                        columnNumber: 21
                                                    }, this),
                                                    "New Application"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                lineNumber: 1804,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                            lineNumber: 1803,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$circle$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                                            size: "40px",
                                            bg: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
                                            color: "white",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                fontSize: "sm",
                                                fontWeight: "bold",
                                                color: "white",
                                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getInitials"])(currentUser.name)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                lineNumber: 1810,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                            lineNumber: 1809,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                    lineNumber: 1795,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                            lineNumber: 1791,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                        lineNumber: 1790,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                    lineNumber: 1789,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$container$2f$container$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Container"], {
                    maxW: "7xl",
                    py: "12",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                        gap: "8",
                        align: "stretch",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                gap: "4",
                                align: "center",
                                textAlign: "center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "4xl",
                                        fontWeight: "bold",
                                        color: "gray.800",
                                        children: "Start Your Application"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 1819,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        fontSize: "lg",
                                        color: "gray.600",
                                        maxW: "2xl",
                                        children: "Choose your entity type to begin the onboarding process. We'll customize the form based on your selection."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 1822,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 1818,
                                columnNumber: 13
                            }, this),
                            loadingEntityTypes ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                gap: "4",
                                py: "12",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$spinner$2f$spinner$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Spinner"], {
                                        size: "xl",
                                        color: "orange.500"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 1829,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        color: "gray.600",
                                        children: "Loading entity types..."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 1830,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 1828,
                                columnNumber: 15
                            }, this) : entityTypesError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                p: "6",
                                bg: "red.50",
                                borderRadius: "lg",
                                border: "1px",
                                borderColor: "red.200",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                    gap: "2",
                                    align: "center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            fontWeight: "semibold",
                                            color: "red.800",
                                            children: "Error Loading Entity Types"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                            lineNumber: 1835,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            color: "red.700",
                                            fontSize: "sm",
                                            children: entityTypesError
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                            lineNumber: 1836,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                            size: "sm",
                                            colorScheme: "red",
                                            onClick: ()=>window.location.reload(),
                                            mt: "2",
                                            children: "Retry"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                            lineNumber: 1837,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                    lineNumber: 1834,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 1833,
                                columnNumber: 15
                            }, this) : entityTypes.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                p: "6",
                                bg: "yellow.50",
                                borderRadius: "lg",
                                border: "1px",
                                borderColor: "yellow.200",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    textAlign: "center",
                                    color: "yellow.800",
                                    children: "No entity types available. Please contact support."
                                }, void 0, false, {
                                    fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                    lineNumber: 1849,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 1848,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$simple$2d$grid$2f$simple$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SimpleGrid"], {
                                    columns: {
                                        base: 1,
                                        md: 2,
                                        lg: 3
                                    },
                                    gap: "6",
                                    children: entityTypes.map((entity, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MotionBox, {
                                            p: "6",
                                            bg: "white",
                                            borderRadius: "xl",
                                            boxShadow: "lg",
                                            border: "2px",
                                            borderColor: "gray.200",
                                            cursor: "pointer",
                                            h: "100%",
                                            minH: "160px",
                                            display: "flex",
                                            flexDirection: "row",
                                            alignItems: "stretch",
                                            _hover: {
                                                borderColor: "#f76834",
                                                boxShadow: "xl",
                                                transform: "translateY(-2px)"
                                            },
                                            onClick: ()=>handleEntityTypeSelect(entity.value),
                                            whileHover: {
                                                scale: 1.02
                                            },
                                            whileTap: {
                                                scale: 0.98
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                gap: "4",
                                                align: "stretch",
                                                flex: "1",
                                                width: "100%",
                                                h: "100%",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$circle$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                                                        size: "16",
                                                        bg: "#f76834",
                                                        color: "white",
                                                        flexShrink: "0",
                                                        alignSelf: "center",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                            as: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$iconUtils$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIconComponent"])(entity.icon),
                                                            boxSize: "8"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                            lineNumber: 1885,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                        lineNumber: 1884,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                                        gap: "2",
                                                        align: "start",
                                                        flex: "1",
                                                        width: "100%",
                                                        justify: "center",
                                                        minH: "0",
                                                        minW: "0",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                fontSize: "md",
                                                                fontWeight: "semibold",
                                                                color: "gray.800",
                                                                lineHeight: "1.4",
                                                                wordBreak: "break-word",
                                                                overflowWrap: "break-word",
                                                                width: "100%",
                                                                children: entity.label
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                                lineNumber: 1889,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                                fontSize: "sm",
                                                                color: "gray.600",
                                                                lineHeight: "1.5",
                                                                wordBreak: "break-word",
                                                                overflowWrap: "break-word",
                                                                width: "100%",
                                                                children: entity.description
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                                lineNumber: 1900,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                        lineNumber: 1888,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                        size: "sm",
                                                        bg: "black",
                                                        color: "white",
                                                        borderRadius: "full",
                                                        flexShrink: "0",
                                                        px: "4",
                                                        minW: "44px",
                                                        w: "44px",
                                                        h: "44px",
                                                        alignSelf: "center",
                                                        _hover: {
                                                            bg: "gray.900"
                                                        },
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                            as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiArrowRight"]
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                            lineNumber: 1925,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                        lineNumber: 1912,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                lineNumber: 1883,
                                                columnNumber: 21
                                            }, this)
                                        }, entity.originalCode || entity.value || `entity-${index}`, false, {
                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                            lineNumber: 1860,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                    lineNumber: 1855,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 1854,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                        lineNumber: 1817,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                    lineNumber: 1816,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
            lineNumber: 1788,
            columnNumber: 7
        }, this);
    }
    // Show loading state while fetching entity type data
    if (loadingEntityTypeData) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
            minH: "100vh",
            bg: "gray.50",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                gap: "4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$spinner$2f$spinner$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Spinner"], {
                        size: "xl",
                        color: "orange.500"
                    }, void 0, false, {
                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                        lineNumber: 1944,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                        children: "Loading form configuration..."
                    }, void 0, false, {
                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                        lineNumber: 1945,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                        fontSize: "sm",
                        color: "gray.500",
                        children: [
                            "Fetching requirements for ",
                            selectedEntityType,
                            "..."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                        lineNumber: 1946,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                lineNumber: 1943,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
            lineNumber: 1942,
            columnNumber: 7
        }, this);
    }
    if (!entityConfig) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
            minH: "100vh",
            bg: "gray.50",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                gap: "4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$spinner$2f$spinner$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Spinner"], {
                        size: "xl",
                        color: "blue.500"
                    }, void 0, false, {
                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                        lineNumber: 1958,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                        children: "Loading application form..."
                    }, void 0, false, {
                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                        lineNumber: 1959,
                        columnNumber: 11
                    }, this),
                    selectedEntityType && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                        fontSize: "sm",
                        color: "gray.500",
                        mt: "4",
                        children: [
                            "Selected: ",
                            selectedEntityType
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                        lineNumber: 1961,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                        p: "4",
                        bg: "yellow.50",
                        borderRadius: "md",
                        border: "1px",
                        borderColor: "yellow.200",
                        maxW: "md",
                        mt: "4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                fontSize: "sm",
                                color: "yellow.800",
                                textAlign: "center",
                                children: [
                                    'Form configuration not found for entity type: "',
                                    selectedEntityType,
                                    '".',
                                    selectedEntityTypeData && (!selectedEntityTypeData.requirements || selectedEntityTypeData.requirements.length === 0) ? " No requirements have been configured for this entity type yet. Please contact support." : " Please contact support or try selecting a different entity type."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 1966,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                size: "sm",
                                mt: "3",
                                onClick: ()=>setSelectedEntityType(""),
                                colorScheme: "orange",
                                children: "Go Back to Selection"
                            }, void 0, false, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 1972,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                        lineNumber: 1965,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                lineNumber: 1957,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
            lineNumber: 1956,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
        minH: "100vh",
        bg: "gray.50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                bg: "white",
                borderBottom: "1px",
                borderColor: "gray.200",
                py: "4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$container$2f$container$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Container"], {
                    maxW: "7xl",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$flex$2f$flex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flex"], {
                        justify: "space-between",
                        align: "center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                gap: "4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$image$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Image"], {
                                    src: "/mukuru-logo.png",
                                    alt: "Mukuru",
                                    height: "32px"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                    lineNumber: 1992,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 1991,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                gap: "4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/partner/profile",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                            variant: "ghost",
                                            size: "sm",
                                            children: "Profile"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                            lineNumber: 1996,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 1995,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/partner/messages",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                            variant: "ghost",
                                            size: "sm",
                                            children: "Messages"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                            lineNumber: 1999,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 1998,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        variant: "outline",
                                        size: "sm",
                                        onClick: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logout"])('http://localhost:3000/'),
                                        children: "Logout"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 2001,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/partner/application/enhanced",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                            size: "sm",
                                            borderRadius: "full",
                                            px: "6",
                                            fontWeight: "medium",
                                            bg: "black",
                                            color: "white",
                                            _hover: {
                                                bg: "gray.900"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                    as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiArrowRight"],
                                                    mr: "2"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                    lineNumber: 2004,
                                                    columnNumber: 19
                                                }, this),
                                                "New Application"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                            lineNumber: 2003,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 2002,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$circle$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                                        size: "40px",
                                        bg: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
                                        color: "white",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                            fontSize: "sm",
                                            fontWeight: "bold",
                                            color: "white",
                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$session$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getInitials"])(currentUser.name)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                            lineNumber: 2009,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 2008,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 1994,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                        lineNumber: 1990,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                    lineNumber: 1989,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                lineNumber: 1988,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$container$2f$container$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Container"], {
                maxW: "6xl",
                py: "8",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                    gap: "8",
                    align: "stretch",
                    children: [
                        toastState && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            p: "3",
                            borderRadius: "md",
                            bg: toastState.status === 'success' ? 'green.50' : toastState.status === 'error' ? 'red.50' : 'blue.50',
                            border: "1px",
                            borderColor: toastState.status === 'success' ? 'green.200' : toastState.status === 'error' ? 'red.200' : 'blue.200',
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                gap: "2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        fontWeight: "semibold",
                                        children: toastState.title
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 2020,
                                        columnNumber: 17
                                    }, this),
                                    toastState.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        color: "gray.700",
                                        children: toastState.description
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 2022,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 2019,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                            lineNumber: 2018,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            p: "6",
                            bg: "white",
                            borderRadius: "lg",
                            boxShadow: "sm",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                justify: "space-between",
                                align: "center",
                                wrap: "wrap",
                                gap: "4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$v$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VStack"], {
                                        align: "start",
                                        gap: "2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                gap: "3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                        fontSize: "2xl",
                                                        fontWeight: "bold",
                                                        color: "gray.800",
                                                        children: [
                                                            entityConfig.displayName,
                                                            " Application"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                        lineNumber: 2032,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$badge$2f$badge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                        colorScheme: "blue",
                                                        variant: "subtle",
                                                        children: [
                                                            "Step ",
                                                            currentStep,
                                                            " of ",
                                                            entityConfig.steps.length
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                        lineNumber: 2035,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                lineNumber: 2031,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                color: "gray.600",
                                                children: entityConfig.description
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                lineNumber: 2039,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                                gap: "2",
                                                mt: "2",
                                                align: "center",
                                                children: entityConfig.steps.map((s, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                                                        h: "8px",
                                                        flex: "1",
                                                        borderRadius: "full",
                                                        bg: idx + 1 <= currentStep ? "orange.400" : "gray.200"
                                                    }, s.id, false, {
                                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                        lineNumber: 2045,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                lineNumber: 2043,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 2030,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                        gap: "2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "outline",
                                                size: "sm",
                                                onClick: ()=>setShowProgress(!showProgress),
                                                borderRadius: "md",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiEye"],
                                                        mr: "2"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                        lineNumber: 2052,
                                                        columnNumber: 19
                                                    }, this),
                                                    showProgress ? "Hide" : "Show",
                                                    " Progress"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                lineNumber: 2051,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "outline",
                                                size: "sm",
                                                onClick: ()=>setShowMessaging(!showMessaging),
                                                borderRadius: "md",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiMessageSquare"],
                                                        mr: "2"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                        lineNumber: 2057,
                                                        columnNumber: 19
                                                    }, this),
                                                    "Messages"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                lineNumber: 2056,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "outline",
                                                size: "sm",
                                                onClick: ()=>setShowOCR(!showOCR),
                                                borderRadius: "md",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiZap"],
                                                        mr: "2"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                        lineNumber: 2062,
                                                        columnNumber: 19
                                                    }, this),
                                                    "OCR"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                lineNumber: 2061,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$button$2f$button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "outline",
                                                size: "sm",
                                                onClick: handleSaveProgress,
                                                borderRadius: "md",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$icon$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                        as: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fi$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FiSave"],
                                                        mr: "2"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                        lineNumber: 2067,
                                                        columnNumber: 19
                                                    }, this),
                                                    "Save Progress"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                                lineNumber: 2066,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 2050,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 2029,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                            lineNumber: 2028,
                            columnNumber: 11
                        }, this),
                        showProgress && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressTracking$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProgressTracking"], {
                            config: entityConfig,
                            formData: formData,
                            currentStep: currentStep,
                            onStepClick: handleStepClick,
                            onSaveProgress: handleSaveProgress,
                            onResumeFromStep: handleResumeFromStep,
                            lastSaved: lastSaved ? lastSaved.toISOString() : undefined,
                            isDirty: isDirty,
                            isSaving: isSaving
                        }, void 0, false, {
                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                            lineNumber: 2076,
                            columnNumber: 13
                        }, this),
                        showOCR && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$OCRIntegration$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OCRIntegration"], {
                            onDataExtracted: handleDataExtracted,
                            onDocumentProcessed: handleDocumentProcessed,
                            entityType: selectedEntityType,
                            documentType: entityConfig.steps[currentStep - 1]?.requiredDocuments[0] || 'certificate_incorporation'
                        }, void 0, false, {
                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                            lineNumber: 2091,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            p: "6",
                            bg: "white",
                            borderRadius: "lg",
                            boxShadow: "sm",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$EnhancedDynamicForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EnhancedDynamicForm"], {
                                config: entityConfig,
                                formData: formData,
                                onFieldChange: handleFieldChange,
                                onStepComplete: handleStepComplete,
                                currentStep: currentStep,
                                onNext: handleNext,
                                onPrevious: handlePrevious,
                                onSubmit: handleSubmit,
                                isLoading: isSubmitting,
                                validationErrors: validationErrors,
                                onFilesChange: (files)=>setFileObjects(files)
                            }, void 0, false, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 2101,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                            lineNumber: 2100,
                            columnNumber: 11
                        }, this),
                        showMessaging && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            p: "6",
                            bg: "white",
                            borderRadius: "lg",
                            boxShadow: "sm",
                            height: "600px",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$EnhancedContextualMessaging$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EnhancedContextualMessaging"], {
                                conversations: [],
                                messages: [],
                                currentApplicationId: `APP-${Date.now()}`,
                                onSendMessage: handleSendMessage,
                                onReplyToMessage: handleReplyToMessage,
                                onForwardMessage: handleForwardMessage,
                                onStarMessage: handleStarMessage,
                                onArchiveConversation: handleArchiveConversation,
                                onAssignConversation: handleAssignConversation,
                                onTagConversation: handleTagConversation,
                                currentUser: {
                                    id: "partner-1",
                                    name: "John Doe",
                                    type: "partner"
                                },
                                applicationSections: entityConfig.steps.map((step)=>({
                                        id: step.id,
                                        title: step.title,
                                        fields: step.fields.map((field)=>({
                                                id: field.id,
                                                label: field.label,
                                                value: formData[field.id]
                                            }))
                                    })),
                                applicationDocuments: []
                            }, void 0, false, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 2119,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                            lineNumber: 2118,
                            columnNumber: 13
                        }, this),
                        saveError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$box$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box"], {
                            p: "3",
                            borderRadius: "md",
                            bg: "red.50",
                            border: "1px",
                            borderColor: "red.200",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$stack$2f$h$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HStack"], {
                                gap: "2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        fontWeight: "semibold",
                                        children: "Save Error:"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 2153,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$chakra$2d$ui$2f$react$2f$dist$2f$esm$2f$components$2f$text$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        color: "gray.700",
                                        children: saveError
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                        lineNumber: 2154,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                                lineNumber: 2152,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                            lineNumber: 2151,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                    lineNumber: 2016,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
                lineNumber: 2015,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/partner/application/enhanced/page.tsx",
        lineNumber: 1987,
        columnNumber: 5
    }, this);
}
_s(EnhancedNewPartnerApplicationPage, "8bew+psrFPiqUwNX/q+epsS6dlo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useFormPersistence$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useFormPersistence"]
    ];
});
_c1 = EnhancedNewPartnerApplicationPage;
var _c, _c1;
__turbopack_context__.k.register(_c, "MotionBox");
__turbopack_context__.k.register(_c1, "EnhancedNewPartnerApplicationPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_df539b59._.js.map