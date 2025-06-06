
'use client'; // Make RootLayout a client component

import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/jarvis/AppSidebar';
import { useAppHistoryManager, type HistoryItem } from '@/hooks/useHistory'; // Import the new hook and type
import React from 'react'; // Import React for cloneElement

// Metadata should be defined statically if possible, or moved if dynamic based on client state
// export const metadata: Metadata = { // This might need adjustment if it relies on client state now
//   title: 'Jarvis Voice Assistant',
//   description: 'Voice-powered assistant built with Next.js and GenAI',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { groupedHistory, addHistoryItem, clearHistory, isLoading: historyIsLoading } = useAppHistoryManager();

  // It's generally recommended to keep metadata static.
  // If you need dynamic metadata based on client-side state, that's more complex.
  // For now, let's assume metadata can be static or managed differently.
  // You might need to move the metadata object outside or handle it in a page component.

  return (
    <html lang="en">
      <head>
        <title>Jarvis Voice Assistant</title>
        <meta name="description" content="Voice-powered assistant built with Next.js and GenAI" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider defaultOpen={false}>
          <AppSidebar
            groupedHistory={groupedHistory}
            clearHistory={clearHistory}
            isLoading={historyIsLoading}
          />
          <main className="min-h-screen">
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                // Type assertion to pass addHistoryItem.
                // Consider a more specific type for child.props if many components need this.
                return React.cloneElement(child as React.ReactElement<any>, { addHistoryItem });
              }
              return child;
            })}
          </main>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
