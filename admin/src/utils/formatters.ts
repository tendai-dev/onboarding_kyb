/**
 * Utility functions for formatting data in the admin interface
 */

/**
 * Country code to full name mapping
 */
const COUNTRY_NAMES: Record<string, string> = {
  ZA: 'South Africa',
  ZW: 'Zimbabwe',
  BW: 'Botswana',
  UK: 'United Kingdom',
  GB: 'United Kingdom',
  US: 'United States',
  KE: 'Kenya',
  NG: 'Nigeria',
  GH: 'Ghana',
  TZ: 'Tanzania',
  UG: 'Uganda',
  MW: 'Malawi',
  MZ: 'Mozambique',
  NA: 'Namibia',
  LS: 'Lesotho',
  SZ: 'Eswatini',
  AO: 'Angola',
  // Add more as needed
};

/**
 * Format country code to full country name
 */
export function formatCountryName(countryCode: string | null | undefined): string {
  if (!countryCode) return 'Not specified';

  const upperCode = countryCode.toUpperCase().trim();

  // If it's already a full name (contains spaces), return as-is
  if (upperCode.includes(' ')) {
    return countryCode;
  }

  // Try to get from mapping
  const fullName = COUNTRY_NAMES[upperCode];
  if (fullName) {
    return fullName;
  }

  // If not found, return formatted version of the code
  // Convert "SOUTH_AFRICA" to "South Africa"
  if (upperCode.includes('_')) {
    return upperCode
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Return as-is if we can't format it
  return countryCode;
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'Not specified';

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format date to short string (date only)
 */
export function formatDateShort(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'Not specified';

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'Not specified';

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatDateShort(date);
    }
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'USD'
): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'Not specified';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return 'Invalid amount';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined || value === '') {
    return 'Not specified';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 'Invalid number';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number | string | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || value === '') {
    return 'Not specified';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 'Invalid percentage';
  }

  return `${numValue.toFixed(decimals)}%`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number | string | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === '') {
    return 'Unknown size';
  }

  const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;

  if (isNaN(numBytes) || numBytes < 0) {
    return 'Invalid size';
  }

  if (numBytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));

  return `${parseFloat((numBytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number = 50
): string {
  if (!text) return 'Not specified';

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.substring(0, maxLength)}...`;
}

/**
 * Format entity type for display
 */
export function formatEntityType(entityType: string | null | undefined): string {
  if (!entityType) return 'Not specified';

  // Convert snake_case to Title Case
  if (entityType.includes('_')) {
    return entityType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Convert camelCase to Title Case
  if (
    entityType !== entityType.toUpperCase() &&
    entityType !== entityType.toLowerCase()
  ) {
    return entityType
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Capitalize first letter
  return entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase();
}

/**
 * Get status color variant for Tag component
 */
export function getStatusVariant(
  status: string
): 'success' | 'danger' | 'info' | 'warning' | 'inactive' {
  const statusUpper = status.toUpperCase();

  if (statusUpper === 'COMPLETE' || statusUpper === 'APPROVED') {
    return 'success';
  }

  if (
    statusUpper === 'DECLINED' ||
    statusUpper === 'REJECTED' ||
    statusUpper === 'CANCELLED'
  ) {
    return 'danger';
  }

  if (
    statusUpper === 'RISK REVIEW' ||
    statusUpper === 'PENDING REVIEW' ||
    statusUpper === 'INCOMPLETE'
  ) {
    return 'warning';
  }

  if (statusUpper === 'SUBMITTED' || statusUpper === 'PENDING') {
    return 'info';
  }

  return 'inactive';
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return 'Not specified';

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Format based on length and country code
  if (cleaned.startsWith('+27')) {
    // South Africa: +27 XX XXX XXXX
    const match = cleaned.match(/^\+27(\d{2})(\d{3})(\d{4})$/);
    if (match) {
      return `+27 ${match[1]} ${match[2]} ${match[3]}`;
    }
  } else if (cleaned.startsWith('+263')) {
    // Zimbabwe: +263 XX XXX XXXX
    const match = cleaned.match(/^\+263(\d{2})(\d{3})(\d{4})$/);
    if (match) {
      return `+263 ${match[1]} ${match[2]} ${match[3]}`;
    }
  } else if (cleaned.startsWith('+44')) {
    // UK: +44 XXXX XXXXXX
    const match = cleaned.match(/^\+44(\d{4})(\d{6})$/);
    if (match) {
      return `+44 ${match[1]} ${match[2]}`;
    }
  }

  // Return as-is if we can't format it
  return phone;
}

/**
 * Format email for display (with truncation if needed)
 */
export function formatEmail(
  email: string | null | undefined,
  maxLength: number = 40
): string {
  if (!email) return 'Not specified';

  if (email.length <= maxLength) {
    return email;
  }

  // Try to preserve domain
  const [local, domain] = email.split('@');
  if (domain && local.length > maxLength - domain.length - 3) {
    return `${local.substring(0, maxLength - domain.length - 3)}...@${domain}`;
  }

  return truncateText(email, maxLength);
}
