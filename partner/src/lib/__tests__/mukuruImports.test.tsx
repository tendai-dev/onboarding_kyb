import { describe, it, expect } from 'vitest';
import * as mukuruImports from '../mukuruImports';

describe('mukuruImports', () => {
  it('should export Button component', () => {
    expect(mukuruImports.Button).toBeDefined();
  });

  it('should export Typography component', () => {
    expect(mukuruImports.Typography).toBeDefined();
  });

  it('should export Card component', () => {
    expect(mukuruImports.Card).toBeDefined();
  });

  it('should export Checkbox component', () => {
    expect(mukuruImports.Checkbox).toBeDefined();
  });

  it('should export MukuruLogo component', () => {
    expect(mukuruImports.MukuruLogo).toBeDefined();
  });
});

