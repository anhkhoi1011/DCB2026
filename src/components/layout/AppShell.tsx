import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { OverviewView } from '../../features/overview/OverviewView';
import { RelationshipMap } from '../../features/map/RelationshipMap';
import { MyWorkView } from '../../features/mywork/MyWorkView';
import { ChecklistView } from '../../features/checklist/ChecklistView';
import { MembersView } from '../../features/members/MembersView';
import { TaskTableView } from '../../features/tasks/TaskTableView';
import { SheetsSettingsView } from '../../features/sheets/SheetsSettingsView';
import { SettingsView } from '../../features/settings/SettingsView';
import { TaskDrawer } from '../drawer/TaskDrawer';
import { TaskFormModal } from '../modal/TaskFormModal';
import { CompletionPromptModal } from '../modal/CompletionPromptModal';
import { OnboardingModal } from '../onboarding/OnboardingModal';

export const AppShell: React.FC = () => {
  const { activeTab, settings } = useAppStore();

  // Initialize theme on mount
  useEffect(() => {
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }, [settings.theme]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'map':
        return <RelationshipMap />;
      case 'my-work':
        return <MyWorkView />;
      case 'checklist':
        return <ChecklistView />;
      case 'members':
        return <MembersView />;
      case 'tasks':
        return <TaskTableView />;
      case 'sheets':
        return <SheetsSettingsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Topbar */}
      <Topbar />

      {/* Main workspace layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <TaskDrawer />
      <TaskFormModal />
      <CompletionPromptModal />
      <OnboardingModal />
    </div>
  );
};
