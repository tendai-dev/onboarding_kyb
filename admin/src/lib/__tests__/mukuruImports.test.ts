import { describe, it, expect } from 'vitest';
import * as mukuruImports from '../mukuruImports';

describe('mukuruImports', () => {
  it('should export core components', () => {
    expect(mukuruImports.Button).toBeDefined();
    expect(mukuruImports.Typography).toBeDefined();
    expect(mukuruImports.Card).toBeDefined();
  });

  it('should export form components', () => {
    expect(mukuruImports.Checkbox).toBeDefined();
    expect(mukuruImports.Search).toBeDefined();
  });

  it('should export navigation components', () => {
    expect(mukuruImports.Navbar).toBeDefined();
  });

  it('should export data display components', () => {
    expect(mukuruImports.DataTable).toBeDefined();
    expect(mukuruImports.Pagination).toBeDefined();
  });

  it('should export UI components', () => {
    expect(mukuruImports.Tag).toBeDefined();
    expect(mukuruImports.AlertBar).toBeDefined();
  });

  it('should export icons', () => {
    expect(mukuruImports.SearchIcon).toBeDefined();
    expect(mukuruImports.EditIcon).toBeDefined();
  });

  it('should export tabs components', () => {
    expect(mukuruImports.TabsRoot).toBeDefined();
    expect(mukuruImports.TabsList).toBeDefined();
  });

  it('should export Input component', () => {
    expect(mukuruImports.Input).toBeDefined();
  });
});

