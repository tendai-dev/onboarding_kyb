import { describe, it, expect } from 'vitest';
import { theme, colors, fonts, space, radii, shadows, components } from '../theme';

describe('theme', () => {
  it('should export theme object', () => {
    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
    expect(theme.fonts).toBeDefined();
  });

  it('should export colors', () => {
    expect(colors).toBeDefined();
    expect(colors.primary).toBeDefined();
    expect(colors.primary[500]).toBe('#ff8000');
  });

  it('should export fonts', () => {
    expect(fonts).toBeDefined();
    expect(fonts.heading).toBeDefined();
    expect(fonts.body).toBeDefined();
  });

  it('should export space scale', () => {
    expect(space).toBeDefined();
    expect(space[4]).toBe('1rem');
  });

  it('should export radii', () => {
    expect(radii).toBeDefined();
    expect(radii.md).toBeDefined();
  });

  it('should export shadows', () => {
    expect(shadows).toBeDefined();
    expect(shadows.sm).toBeDefined();
  });

  it('should export components', () => {
    expect(components).toBeDefined();
    expect(components.Button).toBeDefined();
  });
});

