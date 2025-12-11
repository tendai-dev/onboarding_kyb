'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { useState } from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// This registry ensures Emotion styles are injected during SSR to prevent hydration mismatches
export default function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => {
    const cache = createCache({ key: 'css', prepend: true });
    cache.compat = true;
    return cache;
  });

  useServerInsertedHTML(() => {
    const names = Object.keys(cache.inserted);
    if (names.length === 0) {
      return null;
    }
    let styles = '';
    // Extract styles from the cache

    for (const name of names) {
      const style = (cache.inserted as any)[name];
      if (typeof style !== 'boolean' && style !== undefined) {
        styles += style;
      }
    }
    if (!styles) {
      return null;
    }
    return (
      <style
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
        suppressHydrationWarning
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
