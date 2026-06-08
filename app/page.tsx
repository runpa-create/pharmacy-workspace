"use client";
import { useState } from "react";
import CalendarPane from "@/components/panes/CalendarPane";
import EditorPane from "@/components/panes/EditorPane";
import ReferencePane from "@/components/panes/ReferencePane";
import AiPane from "@/components/panes/AiPane";
import ExportBar from "@/components/panes/ExportBar";
import YearSelector from "@/components/panes/YearSelector";
import { ThemeToggle } from "@/components/panes/ThemeToggle";
import { WorkspaceProvider, useWorkspace } from "@/components/panes/WorkspaceContext";

type TabId = "calendar" | "editor" | "reference" | "ai";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "calendar",
    label: "スケジュール",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
        <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: "editor",
    label: "エディタ",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: "reference",
    label: "参考資料",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeWidth="2"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: "ai",
    label: "AI",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeWidth="2"/>
        <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2"/>
      </svg>
    ),
  },
];

function WorkspaceInner() {
  const { loading } = useWorkspace();
  const [activeTab, setActiveTab] = useState<TabId>("calendar");

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="2"/>
          </svg>
          <span className="text-sm">データを読み込み中…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* デスクトップ: 2x2グリッド */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5 overflow-hidden">
          <CalendarPane />
          <EditorPane />
          <ReferencePane />
          <AiPane />
        </div>
        <ExportBar />
      </div>

      {/* モバイル: タブ切り替え */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        <div className="flex-1 p-2 overflow-hidden">
          {activeTab === "calendar" && <CalendarPane />}
          {activeTab === "editor" && <EditorPane />}
          {activeTab === "reference" && <ReferencePane />}
          {activeTab === "ai" && <AiPane />}
        </div>

        {/* ボトムナビゲーション */}
        <nav className="flex-shrink-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pb-safe">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors
                  ${activeTab === tab.id
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-400 dark:text-zinc-500"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <WorkspaceProvider>
      <div className="flex flex-col h-screen bg-zinc-100 dark:bg-zinc-900">
        <header className="flex items-center gap-3 px-4 h-11 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden sm:inline">薬学実習ワークスペース</span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:hidden">薬実ワークスペース</span>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
          <YearSelector />
          <ThemeToggle />
        </header>
        <WorkspaceInner />
      </div>
    </WorkspaceProvider>
  );
}
