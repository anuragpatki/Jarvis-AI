
// src/hooks/useHistory.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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

export interface UseAppHistoryManagerReturn {
  history: HistoryItem[];
  groupedHistory: Record<string, HistoryItem[]>;
  addHistoryItem: (itemDetails: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  isLoading: boolean;
}

const HISTORY_STORAGE_KEY = 'jarvisHistory';
const MAX_HISTORY_ITEMS = 100;

export function useAppHistoryManager(): UseAppHistoryManagerReturn {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Initialize to true

  useEffect(() => {
    // isLoading is true by default from useState.
    // This effect runs once on mount to load from localStorage.
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
            setHistory([]); // Default to empty if corrupted
          }
        } else {
          setHistory([]); // Default to empty if no stored history
        }
      } catch (error) {
        console.error("Failed to load history from localStorage:", error);
        setHistory([]); // Default to empty on error
      } finally {
        setIsLoading(false); // Set to false after all attempts
      }
    } else {
      // For SSR or environments without window, immediately set loading to false.
      // History will be empty.
      setHistory([]);
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this runs once on mount.

  const addHistoryItem = useCallback((itemDetails: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    if (typeof window === 'undefined') return;

    if (!itemDetails.transcript || !itemDetails.actionType) {
      console.warn("Attempted to add history item with missing transcript or actionType:", itemDetails);
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

    setHistory(prevHistory => {
      const updatedHistory = [newItem, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Failed to save history to localStorage:", error);
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
        // Optionally, you could add problematic items to a "Malformed Date" group
      }
      return acc;
    }, {} as Record<string, HistoryItem[]>);
  }, [history]);

  return { history, groupedHistory, addHistoryItem, clearHistory, isLoading };
}
