"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' }
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Translation keys structure
export interface TranslationKeys {
  // Common
  common: {
    save: string;
    cancel: string;
    submit: string;
    edit: string;
    delete: string;
    confirm: string;
    back: string;
    next: string;
    previous: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    required: string;
    optional: string;
    search: string;
    filter: string;
    sort: string;
    export: string;
    import: string;
    download: string;
    upload: string;
    view: string;
    close: string;
    open: string;
    yes: string;
    no: string;
    ok: string;
  };
  
  // Navigation
  navigation: {
    dashboard: string;
    applications: string;
    documents: string;
    messages: string;
    signatures: string;
    support: string;
    settings: string;
    profile: string;
    logout: string;
    login: string;
    register: string;
  };
  
  // Forms
  forms: {
    businessInfo: string;
    contactInfo: string;
    documentUpload: string;
    ownership: string;
    riskAssessment: string;
    review: string;
    companyName: string;
    entityType: string;
    registrationNumber: string;
    taxNumber: string;
    businessAddress: string;
    businessPhone: string;
    businessEmail: string;
    website: string;
    businessDescription: string;
    dateOfIncorporation: string;
    placeOfIncorporation: string;
    legalStructure: string;
    authorizedCapital: string;
    issuedCapital: string;
    primaryContact: string;
    authorizedSignatory: string;
    beneficialOwners: string;
    shareholders: string;
    ultimateBeneficialOwners: string;
    directors: string;
    documents: string;
  };
  
  // Status
  status: {
    submitted: string;
    inProgress: string;
    riskReview: string;
    complete: string;
    incomplete: string;
    declined: string;
    pending: string;
    approved: string;
    rejected: string;
    underReview: string;
  };
  
  // Messages
  messages: {
    formSaved: string;
    formSubmitted: string;
    formError: string;
    networkError: string;
    offlineMode: string;
    slowConnection: string;
    dataSynced: string;
    uploadSuccess: string;
    uploadError: string;
    validationError: string;
    requiredField: string;
    invalidEmail: string;
    invalidPhone: string;
    invalidUrl: string;
    fileTooLarge: string;
    unsupportedFileType: string;
  };
  
  // Admin
  admin: {
    workQueue: string;
    auditLog: string;
    reports: string;
    entityTypes: string;
    requirements: string;
    bulkActions: string;
    assignTo: string;
    addTags: string;
    exportData: string;
    filterBy: string;
    sortBy: string;
    viewDetails: string;
    updateStatus: string;
    addComment: string;
    riskScore: string;
    priority: string;
    assignedTo: string;
    tags: string;
    completion: string;
  };
  
  // Customer
  partner: {
    myApplications: string;
    myDocuments: string;
    myMessages: string;
    mySignatures: string;
    myProfile: string;
    newApplication: string;
    continueApplication: string;
    viewApplication: string;
    editApplication: string;
    uploadDocument: string;
    signDocument: string;
    sendMessage: string;
    viewMessage: string;
    updateProfile: string;
  };
  
  // Digital Signature
  signature: {
    signDocument: string;
    declineDocument: string;
    downloadDocument: string;
    viewDocument: string;
    signatureRequired: string;
    signatureComplete: string;
    signatureDeclined: string;
    reasonForDecline: string;
    drawSignature: string;
    typeName: string;
    clearSignature: string;
    applySignature: string;
    documentSigned: string;
    documentDeclined: string;
    allFieldsSigned: string;
    remainingFields: string;
  };
  
  // Validation
  validation: {
    required: string;
    minLength: string;
    maxLength: string;
    minValue: string;
    maxValue: string;
    pattern: string;
    email: string;
    phone: string;
    url: string;
    date: string;
    number: string;
    fileSize: string;
    fileType: string;
    custom: string;
  };
}

// Default English translations
const defaultTranslations: TranslationKeys = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    required: 'Required',
    optional: 'Optional',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    export: 'Export',
    import: 'Import',
    download: 'Download',
    upload: 'Upload',
    view: 'View',
    close: 'Close',
    open: 'Open',
    yes: 'Yes',
    no: 'No',
    ok: 'OK'
  },
  navigation: {
    dashboard: 'Dashboard',
    applications: 'Applications',
    documents: 'Documents',
    messages: 'Messages',
    signatures: 'Signatures',
    support: 'Support',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    login: 'Login',
    register: 'Register'
  },
  forms: {
    businessInfo: 'Business Information',
    contactInfo: 'Contact Information',
    documentUpload: 'Document Upload',
    ownership: 'Ownership',
    riskAssessment: 'Risk Assessment',
    review: 'Review',
    companyName: 'Company Name',
    entityType: 'Entity Type',
    registrationNumber: 'Registration Number',
    taxNumber: 'Tax Number',
    businessAddress: 'Business Address',
    businessPhone: 'Business Phone',
    businessEmail: 'Business Email',
    website: 'Website',
    businessDescription: 'Business Description',
    dateOfIncorporation: 'Date of Incorporation',
    placeOfIncorporation: 'Place of Incorporation',
    legalStructure: 'Legal Structure',
    authorizedCapital: 'Authorized Capital',
    issuedCapital: 'Issued Capital',
    primaryContact: 'Primary Contact',
    authorizedSignatory: 'Authorized Signatory',
    beneficialOwners: 'Beneficial Owners',
    shareholders: 'Shareholders',
    ultimateBeneficialOwners: 'Ultimate Beneficial Owners',
    directors: 'Directors',
    documents: 'Documents'
  },
  status: {
    submitted: 'Submitted',
    inProgress: 'In Progress',
    riskReview: 'Risk Review',
    complete: 'Complete',
    incomplete: 'Incomplete',
    declined: 'Declined',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    underReview: 'Under Review'
  },
  messages: {
    formSaved: 'Form saved successfully',
    formSubmitted: 'Form submitted successfully',
    formError: 'There was an error with the form',
    networkError: 'Network error. Please check your connection.',
    offlineMode: 'You are offline. Some features may be limited.',
    slowConnection: 'Slow connection detected. Loading may take longer.',
    dataSynced: 'Data synchronized successfully',
    uploadSuccess: 'File uploaded successfully',
    uploadError: 'Failed to upload file',
    validationError: 'Please check your input',
    requiredField: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    invalidUrl: 'Please enter a valid URL',
    fileTooLarge: 'File size is too large',
    unsupportedFileType: 'Unsupported file type'
  },
  admin: {
    workQueue: 'Work Queue',
    auditLog: 'Audit Log',
    reports: 'Reports',
    entityTypes: 'Entity Types',
    requirements: 'Requirements',
    bulkActions: 'Bulk Actions',
    assignTo: 'Assign To',
    addTags: 'Add Tags',
    exportData: 'Export Data',
    filterBy: 'Filter By',
    sortBy: 'Sort By',
    viewDetails: 'View Details',
    updateStatus: 'Update Status',
    addComment: 'Add Comment',
    riskScore: 'Risk Score',
    priority: 'Priority',
    assignedTo: 'Assigned To',
    tags: 'Tags',
    completion: 'Completion'
  },
  partner: {
    myApplications: 'My Applications',
    myDocuments: 'My Documents',
    myMessages: 'My Messages',
    mySignatures: 'My Signatures',
    myProfile: 'My Profile',
    newApplication: 'New Application',
    continueApplication: 'Continue Application',
    viewApplication: 'View Application',
    editApplication: 'Edit Application',
    uploadDocument: 'Upload Document',
    signDocument: 'Sign Document',
    sendMessage: 'Send Message',
    viewMessage: 'View Message',
    updateProfile: 'Update Profile'
  },
  signature: {
    signDocument: 'Sign Document',
    declineDocument: 'Decline Document',
    downloadDocument: 'Download Document',
    viewDocument: 'View Document',
    signatureRequired: 'Signature Required',
    signatureComplete: 'Signature Complete',
    signatureDeclined: 'Signature Declined',
    reasonForDecline: 'Reason for Decline',
    drawSignature: 'Draw Signature',
    typeName: 'Type Name',
    clearSignature: 'Clear Signature',
    applySignature: 'Apply Signature',
    documentSigned: 'Document signed successfully',
    documentDeclined: 'Document declined',
    allFieldsSigned: 'All fields signed',
    remainingFields: 'Remaining fields'
  },
  validation: {
    required: 'This field is required',
    minLength: 'Minimum length is {min} characters',
    maxLength: 'Maximum length is {max} characters',
    minValue: 'Minimum value is {min}',
    maxValue: 'Maximum value is {max}',
    pattern: 'Invalid format',
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number',
    url: 'Please enter a valid URL',
    date: 'Please enter a valid date',
    number: 'Please enter a valid number',
    fileSize: 'File size must be less than {max}MB',
    fileType: 'File type must be one of: {types}',
    custom: 'Invalid value'
  }
};

// Context for i18n
interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, any>) => string;
  isRTL: boolean;
  formatDate: (date: Date) => string;
  formatNumber: (number: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Translation function
function translate(key: string, translations: TranslationKeys, params?: Record<string, any>): string {
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      return key; // Return key if translation not found
    }
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  // Replace parameters
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
  
  return value;
}

// Provider component
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [translations, setTranslations] = useState<TranslationKeys>(defaultTranslations);

  // Load translations for the current language
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        // In a real app, you would load translations from an API or file
        // For now, we'll use the default English translations
        setTranslations(defaultTranslations);
      } catch (error) {
        console.error('Failed to load translations:', error);
        setTranslations(defaultTranslations);
      }
    };

    loadTranslations();
  }, [language]);

  // Get language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('mukuru-language') as SupportedLanguage;
    if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage
  const handleSetLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    localStorage.setItem('mukuru-language', lang);
    
    // Update document language and direction
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
  };

  // Check if language is RTL
  const isRTL = (lang: SupportedLanguage): boolean => {
    return lang === 'ar';
  };

  // Format date according to locale
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Format number according to locale
  const formatNumber = (number: number): string => {
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : language).format(number);
  };

  // Format currency according to locale
  const formatCurrency = (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : language, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const t = (key: string, params?: Record<string, any>): string => {
    return translate(key, translations, params);
  };

  const value: I18nContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
    isRTL: isRTL(language),
    formatDate,
    formatNumber,
    formatCurrency
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use i18n
export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Language switcher component
export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
      style={{
        padding: '8px 12px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        backgroundColor: 'white',
        fontSize: '14px'
      }}
    >
      {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
        <option key={code} value={code}>
          {lang.flag} {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
