
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/jarvis/AppSidebar';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

// Define and export HistoryItem type
export interface HistoryItem {
  id: string;
  timestamp: string; // ISO string
  transcript: string;
  actionType: string;
  query?: string;
  topic?: string;
  prompt?: string;
}

const HISTORY_STORAGE_KEY = 'jarvisHistory';
const MAX_HISTORY_ITEMS = 100;

// export const metadata: Metadata = { // Cannot export metadata from client component
//   title: 'Jarvis Voice Assistant',
//   description: 'Voice-powered assistant built with Next.js and GenAI',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load history from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          if (Array.isArray(parsed)) {
            setHistory(parsed);
          } else {
            console.warn("Stored history is not an array, clearing.");
            localStorage.removeItem(HISTORY_STORAGE_KEY);
            setHistory([]);
          }
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error("Failed to load history from localStorage:", error);
        setHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    } else {
      // Fallback for SSR or environments without window
      setHistory([]);
      setIsLoadingHistory(false);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoadingHistory) {
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error("Failed to save history to localStorage:", error);
      }
    }
  }, [history, isLoadingHistory]);

  const addHistoryItem = useCallback((itemDetails: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    if (!itemDetails.transcript || !itemDetails.actionType) {
      console.warn("Attempted to add history item with missing transcript or actionType:", itemDetails);
      return;
    }
    let newId = '';
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      newId = crypto.randomUUID();
    } else {
      // Fallback for environments without crypto.randomUUID (e.g., older browsers, some Node.js versions without global crypto)
      newId = `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    const newItem: HistoryItem = {
      ...itemDetails,
      id: newId,
      timestamp: new Date().toISOString(),
    };
    setHistory(prevHistory => [newItem, ...prevHistory].slice(0, MAX_HISTORY_ITEMS));
  }, []); // Empty dependency array is fine as setHistory from useState is stable

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
      } catch (error) {
        console.error("Failed to clear history from localStorage:", error);
      }
    }
  }, []); // Empty dependency array

  const groupedHistory = useMemo(() => {
    return history.reduce((acc, item) => {
      try {
        const date = parseISO(item.timestamp);
        let groupName = '';
        if (isToday(date)) {
          groupName = 'Today';
        } else if (isYesterday(date)) {
          groupName = 'Yesterday';
        } else {
          groupName = format(date, 'MMMM d, yyyy');
        }
        if (!acc[groupName]) {
          acc[groupName] = [];
        }
        acc[groupName].push(item);
      } catch (e) {
        console.error("Error parsing date for history item:", item, e);
      }
      return acc;
    }, {} as Record<string, HistoryItem[]>);
  }, [history]);

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
            isLoading={isLoadingHistory}
          />
          <main className="min-h-screen">
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                // Type assertion to pass addHistoryItem.
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
