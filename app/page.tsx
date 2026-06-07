"use client";
import CalendarPane from "@/components/panes/CalendarPane";
import EditorPane from "@/components/panes/EditorPane";
import ReferencePane from "@/components/panes/ReferencePane";
import AiPane from "@/components/panes/AiPane";
import ExportBar from "@/components/panes/ExportBar";
import YearSelector from "@/components/panes/YearSelector";
import { ThemeToggle } from "@/components/panes/ThemeToggle";
import { WorkspaceProvider, useWorkspace } from "@/components/panes/WorkspaceContext";

function WorkspaceInner() {
  const { loading } = useWorkspace();
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="2"/></svg>
          <span className="text-sm">データを読み込み中…</span>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5 overflow-hidden">
        <CalendarPane />
        <EditorPane />
        <ReferencePane />
        <AiPane />
      </div>
      <ExportBar />
    </>
  );
}

export default function Home() {
  return (
    <WorkspaceProvider>
      <div className="flex flex-col h-screen bg-zinc-100 dark:bg-zinc-900">
        <header className="flex items-center gap-3 px-4 h-11 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">薬学実習ワークスペース</span>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
          <YearSelector />
          <ThemeToggle />
        </header>
        <WorkspaceInner />
      </div>
    </WorkspaceProvider>
  );
}
