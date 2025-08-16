import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

export const FloatingMenuButton: React.FC = () => {
  const { open } = useSidebar();
  
  return (
    <div className={`fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
      open ? 'left-64' : 'left-0'
    }`}>
      <SidebarTrigger className="bg-white/10 backdrop-blur-md border border-white/20 rounded-r-lg px-2 py-4 shadow-lg hover:bg-white/20 transition-all duration-200 group">
        {open ? (
          <ChevronLeft className="w-4 h-4 text-white" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white" />
        )}
      </SidebarTrigger>
    </div>
  );
};
