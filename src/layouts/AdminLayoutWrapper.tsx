import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { AppState } from '../../types';

interface AdminLayoutWrapperProps {
  state: AppState;
  current: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user: any;
  globalSearchTerm: string;
  setGlobalSearchTerm: (term: string) => void;
  isPending: boolean;
  businessName: string;
  children: React.ReactNode;
}

const AdminLayoutWrapper: React.FC<AdminLayoutWrapperProps> = ({
  state,
  current,
  onNavigate,
  onLogout,
  user,
  globalSearchTerm,
  setGlobalSearchTerm,
  isPending,
  businessName,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <Sidebar
        state={state}
        current={current}
        onNavigate={onNavigate}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onLogout={onLogout}
        businessName={businessName}
      />
      
      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <Header
          user={user}
          toggleSidebar={() => setIsOpen(!isOpen)}
          onProfileClick={() => onNavigate('admin-profile')}
          onLogout={onLogout}
          searchTerm={globalSearchTerm}
          onSearch={setGlobalSearchTerm}
          isPending={isPending}
          onNavigate={onNavigate}
        />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 animate-in fade-in duration-500">
          <div className="max-w-[1600px] mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayoutWrapper;
