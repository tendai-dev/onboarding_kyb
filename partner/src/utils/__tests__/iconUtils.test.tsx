import { describe, it, expect } from 'vitest';
import { getIconComponent, getEntityTypeIcon } from '../iconUtils';
import * as ReactIcons from 'react-icons/fi';

describe('iconUtils', () => {
  describe('getIconComponent', () => {
    it('should return icon component for valid icon name', () => {
      const Icon = getIconComponent('home');
      expect(Icon).toBeDefined();
    });

    it('should return default icon for invalid icon name', () => {
      const Icon = getIconComponent('invalid-icon-name');
      expect(Icon).toBeDefined();
    });

    it('should handle case-insensitive icon names', () => {
      const Icon1 = getIconComponent('home');
      const Icon2 = getIconComponent('Home');
      expect(Icon1).toBeDefined();
      expect(Icon2).toBeDefined();
    });
  });

  describe('getEntityTypeIcon', () => {
    it('should return icon for company entity type', () => {
      const icon = getEntityTypeIcon('Company', 'PRIVATE_COMPANY');
      expect(icon).toBeDefined();
    });

    it('should return icon for NPO entity type', () => {
      const icon = getEntityTypeIcon('Non-Profit Organization', 'NPO');
      expect(icon).toBeDefined();
    });

    it('should return icon for government entity type', () => {
      const icon = getEntityTypeIcon('Government Entity', 'GOVERNMENT');
      expect(icon).toBeDefined();
    });

    it('should return default icon for unknown entity type', () => {
      const icon = getEntityTypeIcon('Unknown Type', 'UNKNOWN');
      expect(icon).toBeDefined();
    });

    it('should use code when display name is not provided', () => {
      const icon = getEntityTypeIcon('', 'PRIVATE_COMPANY');
      expect(icon).toBeDefined();
    });
  });
});

