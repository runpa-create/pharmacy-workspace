"use client";
import CalendarPane from "@/components/panes/CalendarPane";
import EditorPane from "@/components/panes/EditorPane";
import ReferencePane from "@/components/panes/ReferencePane";
import AiPane from "@/components/panes/AiPane";
import ExportBar from "@/components/panes/ExportBar";
import YearSelector from "@/components/panes/YearSelector";
import { WorkspaceProvider } from "@/components/panes/WorkspaceContext";

export default function Home() {
  return (
    <WorkspaceProvider>
      <div className="flex flex-col h-screen bg-zinc-100 dark:bg-zinc-900">
        <header className="flex items-center gap-3 px-4 h-11 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <span className="text-xs font-medium text-zinc-500">薬学実習ワークスペース</span>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
          <YearSelector />
        </header>
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5 overflow-hidden">
          <CalendarPane />
          <EditorPane />
          <ReferencePane />
          <AiPane />
        </div>
        <ExportBar />
      </div>
    </WorkspaceProvider>
  );
}
