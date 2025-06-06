
// src/app/layout.tsx
'use client';

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

// Helper to validate a single history item structure (basic check)
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
      console.log("[RootLayout] Attempting to load history from localStorage");
      let loadedHistory: HistoryItem[] = [];
      try {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          // Validate the entire array and each item
          if (Array.isArray(parsed) && parsed.every(isValidHistoryItem)) {
            console.log("[RootLayout] Loaded valid history from localStorage:", parsed);
            loadedHistory = parsed;
          } else {
            console.warn("[RootLayout] Stored history is invalid, not an array, or items are malformed. Clearing.");
            localStorage.removeItem(HISTORY_STORAGE_KEY);
          }
        } else {
          console.log("[RootLayout] No history found in localStorage.");
        }
      } catch (error) {
        console.error("[RootLayout] Failed to load/parse history from localStorage:", error);
        localStorage.removeItem(HISTORY_STORAGE_KEY); // Clear potentially corrupted data
      }
      setHistory(loadedHistory);
      setIsLoadingHistory(false);
      console.log("[RootLayout] Finished loading history. isLoadingHistory:", false, "History length:", loadedHistory.length);
    } else {
      // Should not happen in a client component context like this, but good for safety
      setHistory([]);
      setIsLoadingHistory(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoadingHistory) { // Only save if not initial loading phase
      console.log('[RootLayout] Saving history to localStorage. Current history length:', history.length);
      try {
        // Filter out any potentially invalid items before saving, though `addHistoryItem` should prevent this.
        const validHistoryToSave = history.filter(isValidHistoryItem);
        if(validHistoryToSave.length !== history.length) {
            console.warn("[RootLayout] Attempted to save history with some invalid items. Filtering them out.");
        }
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(validHistoryToSave));
      } catch (error) {
        console.error("[RootLayout] Failed to save history to localStorage:", error);
      }
    }
  }, [history, isLoadingHistory]); // Runs when history or isLoadingHistory changes

  const addHistoryItem = (itemDetails: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    // Basic validation for essential fields before adding
    if (!itemDetails.transcript || !itemDetails.actionType) {
      console.warn("[RootLayout] Attempted to add history item with missing transcript or actionType:", itemDetails);
      return;
    }
     let newId = '';
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      newId = crypto.randomUUID();
    } else {
      // Fallback for environments without crypto.randomUUID
      newId = `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    const newItem: HistoryItem = {
      ...itemDetails,
      id: newId,
      timestamp: new Date().toISOString(),
    };

    console.log('[RootLayout] addHistoryItem called with new item:', newItem);
    setHistory(prevHistory => {
      // Ensure prevHistory is always an array, even if something went wrong.
      const currentHistory = Array.isArray(prevHistory) ? prevHistory : [];
      const newHistoryState = [newItem, ...currentHistory];
      console.log('[RootLayout] setHistory. New state will have length:', newHistoryState.length);
      // return newHistoryState; // Temporarily remove slicing for MAX_HISTORY_ITEMS for debugging
      return newHistoryState.slice(0, MAX_HISTORY_ITEMS); // Re-add slice later if needed
    });
  };

  const clearHistory = () => {
    console.log('[RootLayout] clearHistory called.');
    setHistory([]); // This will trigger the useEffect to save the empty array
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(HISTORY_STORAGE_KEY); // Also explicitly remove, just in case.
      } catch (error) {
        console.error("[RootLayout] Failed to clear history from localStorage:", error);
      }
    }
  };

  const groupedHistory = useMemo(() => {
    console.log('[RootLayout] Recalculating groupedHistory. Current history length:', history.length);
    return history.reduce((acc, item) => {
      try {
        const date = parseISO(item.timestamp); // Ensure timestamp is valid before parsing
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
        // Optionally, group invalid date items into a separate "Invalid Date" group or skip them
      }
      return acc;
    }, {} as Record<string, HistoryItem[]>);
  }, [history]);

  console.log('[RootLayout] Rendering. History length:', history.length, 'IsLoading:', isLoadingHistory, 'GroupedHistory keys:', Object.keys(groupedHistory).length);

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
                console.log('[RootLayout] Cloning child. addHistoryItem is of type:', typeof addHistoryItem, 'Is addHistoryItem a function?', addHistoryItem instanceof Function);
                // Type assertion to pass addHistoryItem.
                // Ensure the key is preserved if the child has one.
                return React.cloneElement(child as React.ReactElement<any>, { key: child.key, addHistoryItem });
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
