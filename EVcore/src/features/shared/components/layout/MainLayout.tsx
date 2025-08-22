
import React from 'react';
import { FloatingMenuButton } from '../navigation/FloatingMenuButton';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col relative">
      <FloatingMenuButton />
      {/* Main content with EVZIP background */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
};
