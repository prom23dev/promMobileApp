import React from 'react';
import Head from 'expo-router/head';

// The preview stays excluded from indexing; these labels also name browser tabs.
export function PageMeta({ title, description }: { title: string; description?: string }) {
  return <Head><title>{title} | Промышленник</title>{description && <meta name="description" content={description} />}<meta name="robots" content="noindex, nofollow" /></Head>;
}
