
// src/components/jarvis/AppSidebar.tsx
'use client';

import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { HistoryIcon, Trash2, BotMessageSquare } from 'lucide-react';
import type { HistoryItem } from '@/hooks/useHistory'; // Import HistoryItem type
import { Badge } from '@/components/ui/badge';

function getActionTypeFriendlyName(actionType: string): string {
  switch (actionType) {
    case 'googleDoc': return 'Doc Gen';
    case 'emailComposeIntent': return 'Email Start';
    case 'emailDraft': return 'Email Draft';
    case 'youtubeSearch': return 'YouTube';
    case 'geminiSearch': return 'Search';
    case 'imageGenerated': return 'Image Gen';
    case 'mapsSearch': return 'Maps';
    case 'openWebsiteSearch': return 'Open Web';
    case 'unknown': return 'Unknown';
    case 'error': return 'Error';
    case 'processing': return 'Processing...';
    case 'processingEmail': return 'Gen Email...';
    default: return actionType.charAt(0).toUpperCase() + actionType.slice(1);
  }
}

interface AppSidebarProps {
  groupedHistory: Record<string, HistoryItem[]>;
  clearHistory: () => void;
  isLoading: boolean;
}

export default function AppSidebar({ groupedHistory, clearHistory, isLoading: historyLoading }: AppSidebarProps) {
  const { setOpen } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas" side="left">
      <SidebarHeader>
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center mt-2 mb-2">
           <BotMessageSquare className="h-7 w-7 text-primary" data-ai-hint="robot chat" />
          <span className="text-lg font-semibold text-primary group-data-[collapsible=icon]:hidden">Jarvis AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        <div className="px-2 group-data-[collapsible=icon]:hidden flex justify-between items-center mb-2 mt-3">
          <h3 className="text-sm font-semibold text-sidebar-foreground/80 flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" />
            History
          </h3>
          {Object.keys(groupedHistory).length > 0 && !historyLoading && (
            <Button variant="ghost" size="sm" onClick={clearHistory} className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive" title="Clear History">
              <Trash2 className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>

        <div className="flex-grow overflow-y-auto group-data-[collapsible=icon]:hidden px-2">
          <ScrollArea className="h-full">
            {historyLoading ? (
              <p className="text-xs text-muted-foreground">Loading history...</p>
            ) : Object.keys(groupedHistory).length === 0 ? (
              <p className="text-xs text-muted-foreground">No history yet.</p>
            ) : (
              Object.entries(groupedHistory).map(([dateGroup, items]) => (
                <div key={dateGroup} className="mb-3">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1.5">{dateGroup}</h4>
                  <ul className="space-y-1">
                    {(items as HistoryItem[]).map((item: HistoryItem) => (
                      <li key={item.id} className="text-xs p-1.5 rounded-md hover:bg-sidebar-accent/50 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="truncate text-sidebar-foreground/90 max-w-[150px]" title={item.transcript}>
                            {item.transcript.length > 25 ? `${item.transcript.substring(0, 22)}...` : item.transcript}
                          </span>
                          <Badge variant={item.actionType === 'error' ? 'destructive' : 'outline'} className="text-xs px-1.5 py-0.5 ml-2 shrink-0">
                            {getActionTypeFriendlyName(item.actionType)}
                          </Badge>
                        </div>
                         {item.query && <p className="text-xs text-muted-foreground/70 truncate" title={item.query}>Q: {item.query}</p>}
                         {item.topic && <p className="text-xs text-muted-foreground/70 truncate" title={item.topic}>T: {item.topic}</p>}
                         {item.prompt && <p className="text-xs text-muted-foreground/70 truncate" title={item.prompt}>P: {item.prompt}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </ScrollArea>
        </div>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden mt-auto">
        <p className="text-xs text-muted-foreground text-center">Jarvis v1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}
