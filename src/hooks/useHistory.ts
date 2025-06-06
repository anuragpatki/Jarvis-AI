
// src/hooks/useHistory.ts
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, useMemo, type ReactNode } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

export interface HistoryItem {
  id: string;
  timestamp: string; // ISO string
  transcript: string;
  actionType: string;
  query?: string;
  topic?: string;
  prompt?: string;
}

interface HistoryContextType {
  history: HistoryItem[];
  groupedHistory: Record<string, HistoryItem[]>;
  addHistoryItem: (itemDetails: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  isLoading: boolean;
}

const HISTORY_STORAGE_KEY = 'jarvisHistory';
const MAX_HISTORY_ITEMS = 100;

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoading(true);
      try {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
          setHistory(JSON.parse(storedHistory));
        }
      } catch (error) {
        console.error("Failed to load history from localStorage:", error);
        // Optionally clear corrupted history or handle error
        // localStorage.removeItem(HISTORY_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    } else {
      // For SSR or environments without window, set loading to false
      setIsLoading(false);
    }
  }, []);

  const addHistoryItem = useCallback((itemDetails: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    if (typeof window === 'undefined') return;

    // Basic validation
    if (!itemDetails.transcript || !itemDetails.actionType) {
      console.warn("Attempted to add history item with missing transcript or actionType:", itemDetails);
      return;
    }

    let newId = '';
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      newId = crypto.randomUUID();
    } else {
      // Fallback for environments where crypto.randomUUID is not available
      newId = `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    const newItem: HistoryItem = {
      ...itemDetails,
      id: newId,
      timestamp: new Date().toISOString(),
    };

    setHistory(prevHistory => {
      const updatedHistory = [newItem, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Failed to save history to localStorage:", error);
        // Handle potential storage errors (e.g., quota exceeded)
      }
      return updatedHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    if (typeof window === 'undefined') return;
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear history from localStorage:", error);
    }
  }, []);

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

  const providerValue = useMemo(() => ({
    history,
    groupedHistory,
    addHistoryItem,
    clearHistory,
    isLoading
  }), [history, groupedHistory, addHistoryItem, clearHistory, isLoading]);

  return (
    <HistoryContext.Provider value={providerValue}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory(): HistoryContextType {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
