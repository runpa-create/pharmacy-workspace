"use client";
import { useRef } from "react";
import { useWorkspace } from "./WorkspaceContext";

export default function ExportBar() {
  const { currentYear, isReadOnly, exportCurrentYear, exportAllYears, importYear } = useWorkspace();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => importYear(ev.target?.result as string);
    r.readAsText(f);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-2 px-3 h-9 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
      <span className="text-[10px] text-zinc-400">データ:</span>
      {isReadOnly && (
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
          {currentYear}年度は閲覧のみ — 編集するには最新年度を選択してください
        </span>
      )}
      <div className="ml-auto flex items-center gap-2">
        <button onClick={exportCurrentYear}
          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2"/><polyline points="7 10 12 15 17 10" strokeWidth="2"/><line x1="12" y1="15" x2="12" y2="3" strokeWidth="2"/></svg>
          {currentYear}年度をエクスポート
        </button>
        <button onClick={exportAllYears}
          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2"/><polyline points="7 10 12 15 17 10" strokeWidth="2"/><line x1="12" y1="15" x2="12" y2="3" strokeWidth="2"/></svg>
          全年度をエクスポート
        </button>
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2"/><polyline points="17 8 12 3 7 8" strokeWidth="2"/><line x1="12" y1="3" x2="12" y2="15" strokeWidth="2"/></svg>
          JSONをインポート
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>
    </div>
  );
}
