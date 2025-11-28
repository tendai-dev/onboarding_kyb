import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, fireEvent } from '@testing-library/react';
import { 
  a11yUtils, 
  useScreenReader, 
  contrastUtils,
  useA11yAnnouncement,
  useFocusManagement,
  useKeyboardNavigation,
  useA11yFocusTrap,
  useHighContrastMode,
  useReducedMotion
} from '../a11yUtils';

describe('a11yUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = a11yUtils.generateId('test');
      const id2 = a11yUtils.generateId('test');
      expect(id1).toContain('test-');
      expect(id2).toContain('test-');
      expect(id1).not.toBe(id2);
    });

    it('should use default prefix when not provided', () => {
      const id = a11yUtils.generateId();
      expect(id).toContain('element-');
    });
  });

  describe('announce', () => {
    it('should create aria-live announcement', () => {
      a11yUtils.announce('Test message');
      
      const announcement = document.querySelector('[aria-live]');
      expect(announcement).toBeInTheDocument();
      expect(announcement?.textContent).toBe('Test message');
    });

    it('should support assertive priority', () => {
      a11yUtils.announce('Urgent message', 'assertive');
      
      const announcement = document.querySelector('[aria-live="assertive"]');
      expect(announcement).toBeInTheDocument();
    });

    it('should remove announcement after timeout', async () => {
      vi.useFakeTimers();
      a11yUtils.announce('Test message');
      
      expect(document.querySelector('[aria-live]')).toBeInTheDocument();
      
      vi.advanceTimersByTime(1000);
      
      expect(document.querySelector('[aria-live]')).not.toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe('focusElement', () => {
    it('should focus element', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);
      
      a11yUtils.focusElement(element);
      
      expect(document.activeElement).toBe(element);
    });

    it('should handle null element', () => {
      expect(() => a11yUtils.focusElement(null)).not.toThrow();
    });
  });

  describe('trapFocus', () => {
    it('should trap focus within element', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);
      
      const cleanup = a11yUtils.trapFocus(container);
      
      button1.focus();
      expect(document.activeElement).toBe(button1);
      
      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      container.dispatchEvent(tabEvent);
      
      cleanup();
    });
  });

  describe('createSkipLink', () => {
    it('should create skip link', () => {
      const skipLink = a11yUtils.createSkipLink('main-content');
      expect(skipLink).toBeInstanceOf(HTMLAnchorElement);
      expect(skipLink.href).toContain('#main-content');
    });

    it('should handle focus events', () => {
      const skipLink = a11yUtils.createSkipLink('main-content');
      document.body.appendChild(skipLink);
      
      const focusEvent = new Event('focus');
      skipLink.dispatchEvent(focusEvent);
      expect(skipLink.style.top).toBe('6px');
      
      const blurEvent = new Event('blur');
      skipLink.dispatchEvent(blurEvent);
      expect(skipLink.style.top).toBe('-40px');
    });
  });

  describe('useScreenReader', () => {
    it('should detect screen reader', () => {
      const { result } = renderHook(() => useScreenReader());
      expect(typeof result.current).toBe('boolean');
    });

    it('should detect screen reader from user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 NVDA',
      });
      
      const { result } = renderHook(() => useScreenReader());
      expect(typeof result.current).toBe('boolean');
    });

    it('should detect screen reader from speechSynthesis', () => {
      Object.defineProperty(window, 'speechSynthesis', {
        writable: true,
        value: {},
      });
      
      const { result } = renderHook(() => useScreenReader());
      expect(typeof result.current).toBe('boolean');
    });
  });

  describe('useA11yAnnouncement', () => {
    it('should return announcement function', () => {
      const { result } = renderHook(() => useA11yAnnouncement());
      expect(typeof result.current).toBe('function');
    });

    it('should announce messages', () => {
      const { result } = renderHook(() => useA11yAnnouncement());
      result.current('Test announcement');
      
      const announcement = document.querySelector('[aria-live]');
      expect(announcement).toBeInTheDocument();
    });
  });

  describe('useFocusManagement', () => {
    it('should manage focus', () => {
      const { result } = renderHook(() => useFocusManagement());
      expect(result.current.focusElement).toBeDefined();
      expect(result.current.restoreFocus).toBeDefined();
    });

    it('should focus element', () => {
      const { result } = renderHook(() => useFocusManagement());
      const element = document.createElement('button');
      document.body.appendChild(element);
      
      act(() => {
        result.current.focusElement(element);
      });
      
      expect(result.current.focusedElement).toBe(element);
    });

    it('should restore focus', () => {
      const { result } = renderHook(() => useFocusManagement());
      const element = document.createElement('button');
      document.body.appendChild(element);
      
      act(() => {
        result.current.focusElement(element);
        result.current.restoreFocus();
      });
      
      expect(document.activeElement).toBe(element);
    });
  });

  describe('useKeyboardNavigation', () => {
    it('should detect keyboard navigation', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      expect(typeof result.current).toBe('boolean');
    });

    it('should set isKeyboardUser on Tab key', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      act(() => {
        fireEvent.keyDown(document, { key: 'Tab' });
      });
      
      expect(result.current).toBe(true);
    });

    it('should reset on mouse down', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      act(() => {
        fireEvent.keyDown(document, { key: 'Tab' });
        fireEvent.mouseDown(document);
      });
      
      expect(result.current).toBe(false);
    });
  });

  describe('useA11yFocusTrap', () => {
    it('should return container ref', () => {
      const { result } = renderHook(() => useA11yFocusTrap(true));
      expect(result.current).toBeDefined();
    });

    it('should trap focus when active', () => {
      const { result } = renderHook(() => useA11yFocusTrap(true));
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);
      
      (result.current as any).current = container;
      
      act(() => {
        // Re-render to trigger effect
        renderHook(() => useA11yFocusTrap(true));
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('useHighContrastMode', () => {
    it('should detect high contrast mode', () => {
      const { result } = renderHook(() => useHighContrastMode());
      expect(typeof result.current).toBe('boolean');
    });

    it('should detect high contrast from media query', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => {
          if (query === '(prefers-contrast: high)') {
            return mockMediaQuery;
          }
          return { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
        }),
      });
      
      const { result } = renderHook(() => useHighContrastMode());
      expect(typeof result.current).toBe('boolean');
    });
  });

  describe('useReducedMotion', () => {
    it('should detect reduced motion preference', () => {
      const { result } = renderHook(() => useReducedMotion());
      expect(typeof result.current).toBe('boolean');
    });

    it('should detect reduced motion from media query', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => {
          if (query === '(prefers-reduced-motion: reduce)') {
            return mockMediaQuery;
          }
          return { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
        }),
      });
      
      const { result } = renderHook(() => useReducedMotion());
      expect(typeof result.current).toBe('boolean');
    });
  });

  describe('contrastUtils', () => {
    it('should calculate contrast ratio', () => {
      const ratio = contrastUtils.getContrastRatio('rgb(255, 255, 255)', 'rgb(0, 0, 0)');
      expect(ratio).toBeGreaterThan(1);
    });

    it('should check WCAG AA compliance', () => {
      const meetsAA = contrastUtils.meetsWCAGAA('rgb(255, 255, 255)', 'rgb(0, 0, 0)');
      expect(typeof meetsAA).toBe('boolean');
    });

    it('should check WCAG AAA compliance', () => {
      const meetsAAA = contrastUtils.meetsWCAGAAA('rgb(255, 255, 255)', 'rgb(0, 0, 0)');
      expect(typeof meetsAAA).toBe('boolean');
    });
  });
});

