
// src/app/layout.tsx
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/jarvis/AppSidebar';
import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
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

// Helper to validate a single history item structure
function isValidHistoryItem(item: any): item is HistoryItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.id === 'string' &&
    typeof item.timestamp === 'string' &&
    typeof item.transcript === 'string' &&
    typeof item.actionType === 'string' &&
    (typeof item.query === 'string' || typeof item.query === 'undefined') &&
    (typeof item.topic === 'string' || typeof item.topic === 'undefined') &&
    (typeof item.prompt === 'string' || typeof item.prompt === 'undefined') &&
    !isNaN(parseISO(item.timestamp).getTime()) // Check if timestamp is a valid ISO date
  );
}

// Context for page interaction functions
interface PageInteractionContextType {
  addHistoryItem: (itemDetails: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

const PageInteractionContext = createContext<PageInteractionContextType | undefined>(undefined);

export function usePageInteraction() {
  const context = useContext(PageInteractionContext);
  if (context === undefined) {
    throw new Error('usePageInteraction must be used within a PageInteractionProvider');
  }
  return context;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load history from localStorage on mount
  useEffect(() => {
    console.log("[RootLayout] Attempting to load history from localStorage");
    let loadedHistory: HistoryItem[] = [];
    if (typeof window !== 'undefined') {
      try {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          if (Array.isArray(parsed) && parsed.every(isValidHistoryItem)) {
            console.log("[RootLayout] Loaded valid history from localStorage:", parsed);
            loadedHistory = parsed;
          } else {
            console.warn("[RootLayout] Stored history is invalid or malformed. Clearing.");
            localStorage.removeItem(HISTORY_STORAGE_KEY);
          }
        } else {
          console.log("[RootLayout] No history found in localStorage.");
        }
      } catch (error) {
        console.error("[RootLayout] Failed to load/parse history from localStorage:", error);
        localStorage.removeItem(HISTORY_STORAGE_KEY);
      }
    }
    setHistory(loadedHistory);
    setIsLoadingHistory(false);
    console.log("[RootLayout] Finished loading history. isLoadingHistory:", false, "History length:", loadedHistory.length);
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoadingHistory) {
      console.log('[RootLayout] Saving history to localStorage. Current history length:', history.length);
      try {
        const validHistoryToSave = history.filter(isValidHistoryItem);
        if(validHistoryToSave.length !== history.length) {
            console.warn("[RootLayout] Attempted to save history with some invalid items. Filtering them out.");
        }
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(validHistoryToSave));
      } catch (error) {
        console.error("[RootLayout] Failed to save history to localStorage:", error);
      }
    }
  }, [history, isLoadingHistory]);

  const addHistoryItem = useCallback((itemDetails: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    if (!itemDetails.transcript || !itemDetails.actionType) {
      console.warn("[RootLayout] Attempted to add history item with missing transcript or actionType:", itemDetails);
      return;
    }
    let newId = '';
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      newId = crypto.randomUUID();
    } else {
      newId = `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    const newItem: HistoryItem = {
      ...itemDetails,
      id: newId,
      timestamp: new Date().toISOString(),
    };
    console.log('[RootLayout] addHistoryItem called with new item:', newItem);
    setHistory(prevHistory => {
      const currentHistory = Array.isArray(prevHistory) ? prevHistory : [];
      const newHistoryState = [newItem, ...currentHistory];
      console.log('[RootLayout] setHistory. New state will have length:', newHistoryState.length);
      return newHistoryState.slice(0, MAX_HISTORY_ITEMS);
    });
  }, []); // Dependencies for useCallback are empty as setHistory from useState is stable

  const clearHistory = useCallback(() => {
    console.log('[RootLayout] clearHistory called.');
    setHistory([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
      } catch (error) {
        console.error("[RootLayout] Failed to clear history from localStorage:", error);
      }
    }
  }, []); // Dependencies for useCallback are empty

  const groupedHistory = useMemo(() => {
    console.log('[RootLayout] Recalculating groupedHistory. Current history length:', history.length);
    const validHistory = history.filter(isValidHistoryItem);
    return validHistory.reduce((acc, item) => {
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
        console.error("[RootLayout] Error parsing date for history item:", item, e);
      }
      return acc;
    }, {} as Record<string, HistoryItem[]>);
  }, [history]);

  console.log('[RootLayout] Rendering. History length:', history.length, 'IsLoading:', isLoadingHistory, 'GroupedHistory keys:', Object.keys(groupedHistory).length);

  const pageInteractionContextValue = useMemo(() => ({
    addHistoryItem
  }), [addHistoryItem]);

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
          <PageInteractionContext.Provider value={pageInteractionContextValue}>
            <main className="min-h-screen">
              {children}
            </main>
          </PageInteractionContext.Provider>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
