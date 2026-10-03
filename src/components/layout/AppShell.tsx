import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useResolvedTheme } from '../../hooks/useResolvedTheme';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { OverviewView } from '../../features/overview/OverviewView';
import { RelationshipMap } from '../../features/map/RelationshipMap';
import { TaskTableView } from '../../features/tasks/TaskTableView';
import { MembersView } from '../../features/members/MembersView';
import { SheetsSettingsView } from '../../features/sheets/SheetsSettingsView';
import { SettingsView } from '../../features/settings/SettingsView';
import { TaskDrawer } from '../drawer/TaskDrawer';
import { TaskFormModal } from '../modal/TaskFormModal';
import { OnboardingModal } from '../onboarding/OnboardingModal';

export const AppShell: React.FC = () => {
  const { activeTab } = useAppStore();
  // Initializes and synchronizes theme globally
  useResolvedTheme();

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'map':
        return <RelationshipMap />;
      case 'tasks':
        return <TaskTableView />;
      case 'members':
        return <MembersView />;
      case 'sheets':
        return <SheetsSettingsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <Topbar />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />

        <main
          className={`flex-1 min-h-0 h-full ${
            activeTab === 'map' ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          {renderContent()}
        </main>

        <TaskDrawer />
      </div>

      <TaskFormModal />
      <OnboardingModal />
    </div>
  );
};
