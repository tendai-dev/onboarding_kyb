'use client';
/* eslint-disable react/jsx-props-no-spreading */
import { ReactNode } from 'react';
import { MukuruLogo, Button, Typography } from '@/lib/mukuruImports';

// Mukuru Logo Component
export function ClientOnlyMukuruLogo(props: Record<string, unknown>) {
  return <MukuruLogo {...props} />;
}

// Mukuru Button Component
export function ClientOnlyMukuruButton(
  props: Record<string, unknown> & { children?: ReactNode }
) {
  const children = props.children as ReactNode;
  return <Button {...props}>{children}</Button>;
}

// Mukuru Typography Component
export function ClientOnlyMukuruTypography(
  props: Record<string, unknown> & { children?: ReactNode }
) {
  const children = props.children as ReactNode;
  return <Typography {...props}>{children}</Typography>;
}
