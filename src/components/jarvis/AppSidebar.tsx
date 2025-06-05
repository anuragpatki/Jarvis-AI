// src/components/jarvis/AppSidebar.tsx
'use client';

import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { BookOpen, HistoryIcon, Trash2, BotMessageSquare } from 'lucide-react';
import { useHistory, type HistoryItem } from '@/hooks/useHistory';
import { Badge } from '@/components/ui/badge';

function getActionTypeFriendlyName(actionType: string): string {
  switch (actionType) {
    case 'googleDoc': return 'Doc Gen';
    case 'emailComposeIntent': return 'Email Intent';
    case 'emailDraft': return 'Email Draft';
    case 'youtubeSearch': return 'YouTube';
    case 'geminiSearch': return 'Search';
    case 'imageGenerated': return 'Image Gen';
    case 'mapsSearch': return 'Maps';
    case 'openWebsiteSearch': return 'Open Web';
    case 'unknown': return 'Unknown';
    case 'error': return 'Error';
    default: return actionType;
  }
}


export default function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  const { groupedHistory, clearHistory, isLoading: historyLoading } = useHistory();

  const handleGuidelinesClick = () => {
    window.open('/guidelines', '_blank');
    setOpenMobile(false); // Close mobile sidebar if open
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
           <BotMessageSquare className="h-7 w-7 text-primary" data-ai-hint="robot chat" />
          <span className="text-lg font-semibold text-primary group-data-[collapsible=icon]:hidden">Jarvis AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleGuidelinesClick}
              tooltip={{ children: "Guidelines to use Jarvis AI", side: "right", align: "center" }}
            >
              <BookOpen />
              <span>Guidelines</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator className="my-3" />
        <div className="px-2 group-data-[collapsible=icon]:hidden">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-sidebar-foreground/80 flex items-center gap-2">
              <HistoryIcon className="h-4 w-4" />
              History
            </h3>
            {Object.keys(groupedHistory).length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory} className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive group-data-[collapsible=icon]:hidden" title="Clear History">
                <Trash2 className="h-3 w-3 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[calc(100%-180px)] group-data-[collapsible=icon]:hidden">
          {historyLoading ? (
            <p className="px-2 text-xs text-muted-foreground">Loading history...</p>
          ) : Object.keys(groupedHistory).length === 0 ? (
            <p className="px-2 text-xs text-muted-foreground">No history yet.</p>
          ) : (
            Object.entries(groupedHistory).map(([dateGroup, items]) => (
              <div key={dateGroup} className="mb-3 px-2">
                <h4 className="text-xs font-medium text-muted-foreground mb-1.5">{dateGroup}</h4>
                <ul className="space-y-1">
                  {items.map((item: HistoryItem) => (
                    <li key={item.id} className="text-xs p-1.5 rounded-md hover:bg-sidebar-accent/50 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="truncate text-sidebar-foreground/90" title={item.transcript}>
                          {item.transcript.length > 30 ? `${item.transcript.substring(0, 28)}...` : item.transcript}
                        </span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 ml-2">{getActionTypeFriendlyName(item.actionType)}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <p className="text-xs text-muted-foreground text-center">Jarvis v1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}
