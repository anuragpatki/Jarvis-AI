
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/jarvis/AppSidebar';
import { HistoryProvider } from '@/hooks/useHistory'; // Import HistoryProvider


export const metadata: Metadata = {
  title: 'Jarvis Voice Assistant',
  description: 'Voice-powered assistant built with Next.js and GenAI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <HistoryProvider> {/* Wrap with HistoryProvider */}
          <SidebarProvider defaultOpen={false}> 
            <AppSidebar /> 
            <main className="min-h-screen"> 
              {children} 
            </main>
          </SidebarProvider>
        </HistoryProvider>
        <Toaster />
      </body>
    </html>
  );
}
