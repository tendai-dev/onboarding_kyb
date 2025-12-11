/* eslint-disable react/jsx-props-no-spreading */
'use client';

import { MukuruLogo, Button, Typography } from '@mukuru/mukuru-react-components';

// Mukuru Logo Component
export function ClientOnlyMukuruLogo(props: Record<string, unknown>) {
  return <MukuruLogo {...props} />;
}

// Mukuru Button Component
export function ClientOnlyMukuruButton(
  props: Record<string, unknown> & { children?: React.ReactNode }
) {
  return <Button {...props}>{props.children}</Button>;
}

// Mukuru Typography Component
export function ClientOnlyMukuruTypography(
  props: Record<string, unknown> & { children?: React.ReactNode }
) {
  return <Typography {...props}>{props.children}</Typography>;
}
