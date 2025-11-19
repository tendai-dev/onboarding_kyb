import {
  FiBriefcase,
  FiHome,
  FiUsers,
  FiDollarSign,
  FiShield,
  FiHeart,
  FiGlobe,
  FiBook,
  FiCamera,
  FiMusic,
  FiCoffee,
  FiTruck,
  FiZap,
  FiTarget,
  FiTrendingUp,
  FiBox,
  FiPackage,
  FiShoppingBag,
  FiAnchor,
  FiLayers,
  FiUser,
  FiLock,
  FiFileText, // Default icon
} from "react-icons/fi";

const iconMap: Record<string, any> = {
  FiBriefcase,
  FiHome,
  FiUsers,
  FiDollarSign,
  FiShield,
  FiHeart,
  FiGlobe,
  FiBook,
  FiCamera,
  FiMusic,
  FiCoffee,
  FiTruck,
  FiZap,
  FiTarget,
  FiTrendingUp,
  FiBox,
  FiPackage,
  FiShoppingBag,
  FiAnchor,
  FiLayers,
  FiUser,
  FiLock,
  FiFileText, // Default icon
};

/**
 * Gets the icon component from an icon name
 * @param iconName The icon name (e.g., "FiBriefcase")
 * @returns The icon component or a default icon if not found
 */
export function getIconComponent(iconName?: string | null) {
  if (!iconName) return FiFileText;
  return iconMap[iconName] || FiFileText;
}

/**
 * Maps entity type name/code to an appropriate icon
 * @param entityLabel The display name of the entity type
 * @param entityCode The code of the entity type (optional)
 * @returns The icon component name
 */
export function getEntityTypeIcon(entityLabel?: string | null, entityCode?: string | null): string {
  if (!entityLabel && !entityCode) return 'FiFileText';
  
  const label = (entityLabel || '').toLowerCase().trim();
  const code = (entityCode || '').toLowerCase().trim();
  
  // Check code first (more reliable)
  if (code) {
    // Government / State Owned Entity
    if (code.includes('government') || code.includes('state_owned') || code.includes('state-owned') || 
        code.includes('parastatal') || code.includes('organ_of_state')) {
      return 'FiShield';
    }
    
    // NPO / NGO / PVO / Charity
    if (code.includes('npo') || code.includes('ngo') || code.includes('pvo') || 
        code.includes('charity') || code.includes('non_profit') || code.includes('nonprofit')) {
      return 'FiHeart';
    }
    
    // Non-Registered Association / Society / Foundation
    if (code.includes('association') || code.includes('society') || code.includes('foundation') ||
        code.includes('non_registered')) {
      return 'FiUsers';
    }
    
    // Private Company / Limited Liability Company
    if (code.includes('private_company') || code.includes('private-company') || 
        code.includes('llc') || code.includes('limited_liability')) {
      return 'FiBriefcase';
    }
    
    // Publicly Listed Entity
    if (code.includes('public_company') || code.includes('public-company') || 
        code.includes('publicly_listed') || code.includes('publicly-listed')) {
      return 'FiTrendingUp';
    }
    
    // Sole Proprietor
    if (code.includes('sole_proprietor') || code.includes('sole-proprietor') || 
        code.includes('sole_trader') || code.includes('sole-trader')) {
      return 'FiUser';
    }
    
    // Supranational / Inter-Governmental
    if (code.includes('supranational') || code.includes('inter_governmental') || 
        code.includes('intergovernmental')) {
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
    if (label.includes('government') || label.includes('state owned') || label.includes('state-owned') ||
        label.includes('organ of state') || label.includes('parastatal')) {
      return 'FiShield';
    }
    
    // NPO / NGO / PVO / Charity
    if (label.includes('npo') || label.includes('ngo') || label.includes('pvo') || 
        label.includes('charity') || label.includes('non-profit') || label.includes('nonprofit') ||
        label.includes('non profit')) {
      return 'FiHeart';
    }
    
    // Non-Registered Association / Society / Foundation
    if (label.includes('association') || label.includes('society') || label.includes('foundation') ||
        label.includes('non-registered') || label.includes('non registered')) {
      return 'FiUsers';
    }
    
    // Private Company / Limited Liability Company
    if (label.includes('private company') || label.includes('limited liability') || 
        label.includes('llc') || (label.includes('private') && label.includes('company'))) {
      return 'FiBriefcase';
    }
    
    // Publicly Listed Entity
    if (label.includes('publicly listed') || label.includes('public company') ||
        (label.includes('public') && label.includes('listed'))) {
      return 'FiTrendingUp';
    }
    
    // Sole Proprietor
    if (label.includes('sole proprietor') || label.includes('sole trader') ||
        label.includes('sole-proprietor') || label.includes('sole-trader')) {
      return 'FiUser';
    }
    
    // Supranational / Inter-Governmental
    if (label.includes('supranational') || label.includes('inter-governmental') ||
        label.includes('intergovernmental') || label.includes('inter governmental')) {
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

