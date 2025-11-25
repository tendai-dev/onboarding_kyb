"use client";

import { MukuruLogo, Button, Typography } from "@mukuru/mukuru-react-components";

// Mukuru Logo Component
export function ClientOnlyMukuruLogo(props: any) {
  return <MukuruLogo {...props} />;
}

// Mukuru Button Component
export function ClientOnlyMukuruButton(props: any) {
  return <Button {...props}>{props.children}</Button>;
}

// Mukuru Typography Component
export function ClientOnlyMukuruTypography(props: any) {
  return <Typography {...props}>{props.children}</Typography>;
}