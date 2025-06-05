
// src/hooks/useHistory.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
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

const HISTORY_STORAGE_KEY = 'jarvisHistory';
const MAX_HISTORY_ITEMS = 100; // Limit history size

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // To indicate loading from localStorage

  useEffect(() => {
    // Ensure this only runs on the client
    if (typeof window !== 'undefined') {
      setIsLoading(true); // Start loading
      try {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
          setHistory(JSON.parse(storedHistory));
        }
      } catch (error) {
        console.error("Failed to load history from localStorage:", error);
        // Optionally clear corrupted history if parsing fails
        // localStorage.removeItem(HISTORY_STORAGE_KEY);
      } finally {
        setIsLoading(false); // Finish loading
      }
    } else {
      setIsLoading(false); // Not in a browser environment
    }
  }, []); // Empty dependency array means this runs once on mount

  const addHistoryItem = useCallback((itemDetails: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    if (typeof window === 'undefined') return; // Don't run on server

    // Guard against adding incomplete items, which might happen if data isn't passed correctly
    if (!itemDetails.transcript || !itemDetails.actionType) {
      console.warn("Attempted to add history item with missing transcript or actionType:", itemDetails);
      return;
    }

    const newItem: HistoryItem = {
      ...itemDetails,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    setHistory(prevHistory => {
      const updatedHistory = [newItem, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Failed to save history to localStorage:", error);
      }
      return updatedHistory;
    });
  }, []); // useCallback with empty dependencies as setHistory updater form is used

  const clearHistory = useCallback(() => {
    if (typeof window === 'undefined') return;

    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear history from localStorage:", error);
    }
  }, []);

  const groupedHistory = history.reduce((acc, item) => {
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
    return acc;
  }, {} as Record<string, HistoryItem[]>);


  return { history, groupedHistory, addHistoryItem, clearHistory, isLoading };
}
