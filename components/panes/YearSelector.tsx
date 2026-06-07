"use client";
import { useState, useRef } from "react";
import { useWorkspace } from "./WorkspaceContext";

export default function YearSelector() {
  const { currentYear, allYears, isReadOnly, setCurrentYear, createYear, exportCurrentYear, exportAllYears, importYear } = useWorkspace();
  const [showMenu, setShowMenu] = useState(false);
  const [showNewYear, setShowNewYear] = useState(false);
  const [newYearInput, setNewYearInput] = useState("");
  const [copyFrom, setCopyFrom] = useState<number | "blank">("blank");
  const importRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    const y = parseInt(newYearInput);
    if (!y || y < 2020 || y > 2040) { alert("2020〜2040の年度を入力してください"); return; }
    if (allYears.includes(y)) { alert(`${y}年度はすでに存在します`); return; }
    createYear(y, copyFrom === "blank" ? undefined : copyFrom);
    setShowNewYear(false);
    setNewYearInput("");
    setShowMenu(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => importYear(ev.target?.result as string);
    r.readAsText(f);
    e.target.value = "";
    setShowMenu(false);
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="flex items-center gap-1">
        {allYears.map(y => (
          <button key={y} onClick={() => { setCurrentYear(y); setShowMenu(false); }}
            className={`text-[11px] px-2.5 py-1 rounded-md transition-colors
              ${currentYear === y
                ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-medium"
                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
            {y}年度
          </button>
        ))}
      </div>

      {isReadOnly && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          閲覧のみ
        </span>
      )}

      <div className="relative">
        <button onClick={() => setShowMenu(v => !v)}
          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1" strokeWidth="2"/><circle cx="19" cy="12" r="1" strokeWidth="2"/><circle cx="5" cy="12" r="1" strokeWidth="2"/></svg>
          メニュー
        </button>

        {showMenu && (
          <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm z-50 overflow-hidden">
            <div className="p-1 flex flex-col gap-0.5">
              <p className="text-[10px] text-zinc-400 px-2 py-1">年度管理</p>
              <button onClick={() => { setShowNewYear(true); setShowMenu(false); }}
                className="flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md text-left">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" strokeWidth="2"/><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/></svg>
                新年度を作成
              </button>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-0.5" />
              <p className="text-[10px] text-zinc-400 px-2 py-1">データ</p>
              <button onClick={() => { exportCurrentYear(); setShowMenu(false); }}
                className="flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md text-left">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2"/><polyline points="7 10 12 15 17 10" strokeWidth="2"/><line x1="12" y1="15" x2="12" y2="3" strokeWidth="2"/></svg>
                {currentYear}年度をエクスポート
              </button>
              <button onClick={() => { exportAllYears(); setShowMenu(false); }}
                className="flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md text-left">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2"/><polyline points="7 10 12 15 17 10" strokeWidth="2"/><line x1="12" y1="15" x2="12" y2="3" strokeWidth="2"/></svg>
                全年度をエクスポート
              </button>
              <button onClick={() => importRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md text-left">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2"/><polyline points="17 8 12 3 7 8" strokeWidth="2"/><line x1="12" y1="3" x2="12" y2="15" strokeWidth="2"/></svg>
                JSONをインポート
              </button>
              <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </div>
          </div>
        )}
      </div>

      {showNewYear && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center" onClick={() => setShowNewYear(false)}>
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 w-80 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">新年度を作成</span>
              <button onClick={() => setShowNewYear(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-zinc-500">年度（西暦）</label>
              <input type="number" value={newYearInput} onChange={e => setNewYearInput(e.target.value)}
                placeholder="例: 2028" min={2020} max={2040}
                className="text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-zinc-500">ひな形</label>
              <select value={String(copyFrom)} onChange={e => setCopyFrom(e.target.value === "blank" ? "blank" : parseInt(e.target.value))}
                className="text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none">
                <option value="blank">白紙で作成</option>
                {allYears.map(y => <option key={y} value={y}>{y}年度からコピー（ローテーションひな形を引き継ぎ）</option>)}
              </select>
            </div>
            <div className="text-[11px] text-zinc-400 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2.5 leading-relaxed">
              コピーの場合、ローテーションひな形・ブックマークを引き継ぎます。イベント実績・日別メモは引き継ぎません。
            </div>
            <button onClick={handleCreate} disabled={!newYearInput}
              className="py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40">
              作成する
            </button>
          </div>
        </div>
      )}

      {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />}
    </div>
  );
}
