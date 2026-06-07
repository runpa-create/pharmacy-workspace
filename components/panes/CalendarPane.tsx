"use client";
import { useState, useRef } from "react";
import { useWorkspace, Period, EventKind } from "./WorkspaceContext";

function getMonthsInPeriod(start: string, end: string) {
  const s = new Date(start); const e = new Date(end);
  const months: { year: number; month: number }[] = [];
  let y = s.getFullYear(); let m = s.getMonth();
  while (y < e.getFullYear() || (y === e.getFullYear() && m <= e.getMonth())) {
    months.push({ year: y, month: m });
    m++; if (m > 11) { m = 0; y++; }
  }
  return months;
}

const DOWS = ["日","月","火","水","木","金","土"];
const MONTH_NAMES = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

export const KIND_STYLE: Record<EventKind, { bg: string; text: string; label: string }> = {
  rotation: { bg: "bg-blue-100 dark:bg-blue-900",   text: "text-blue-700 dark:text-blue-300",   label: "実習" },
  lecture:  { bg: "bg-amber-100 dark:bg-amber-900", text: "text-amber-700 dark:text-amber-300", label: "講義" },
  other:    { bg: "bg-zinc-100 dark:bg-zinc-800",   text: "text-zinc-600 dark:text-zinc-400",   label: "その他" },
};

export default function CalendarPane() {
  const { yearData, isReadOnly, selectedDate, setSelectedDate, updateYearData, getEventsForDate } = useWorkspace();
  const { periods } = yearData;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const defaultPeriod = () => {
    const now = new Date();
    const idx = periods.findIndex(p => new Date(p.start) <= now && now <= new Date(p.end));
    return idx >= 0 ? idx : 0;
  };

  const [periodIdx, setPeriodIdx] = useState(defaultPeriod);
  const [showSettings, setShowSettings] = useState(false);
  const [editPeriods, setEditPeriods] = useState<Period[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const pdfRef = useRef<HTMLInputElement>(null);

  const openSettings = () => {
    setEditPeriods(periods.map(p => ({ ...p })));
    setImportMsg("");
    setShowSettings(true);
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setImporting(true); setImportMsg("PDFを読み取り中…");
    try {
      const fd = new FormData();
      fd.append("file", f);
      const resp = await fetch("/api/parse-schedule", { method: "POST", body: fd });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      const text: string = data.text ?? "";
      const parsed: Period[] = JSON.parse(text.replace(/```json|```/g, "").trim());
      setEditPeriods(parsed);
      setImportMsg("✓ 日程を読み取りました。内容を確認して「保存」してください。");
    } catch { setImportMsg("読み取りに失敗しました。手動で入力してください。"); }
    setImporting(false); e.target.value = "";
  };

  const savePeriods = () => {
    updateYearData({ periods: editPeriods });
    setShowSettings(false);
    setPeriodIdx(0);
  };

  const period = periods[periodIdx] || periods[0];
  if (!period) return null;
  const months = getMonthsInPeriod(period.start, period.end);
  const startDate = new Date(period.start);
  const endDate = new Date(period.end);
  const inPeriod = (y: number, m: number, d: number) => { const dt = new Date(y, m, d); return dt >= startDate && dt <= endDate; };
  const toKey = (y: number, m: number, d: number) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
      <div className="flex items-center gap-2 px-3 h-10 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/></svg>
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">実習スケジュール</span>
        <span className="ml-auto text-[10px] text-zinc-400">{period.start.slice(0,7).replace("-","年")}月〜{period.end.slice(0,7).replace("-","年")}月</span>
        {!isReadOnly && (
          <button onClick={openSettings} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 ml-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" strokeWidth="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeWidth="2"/></svg>
            日程を更新
          </button>
        )}
      </div>

      {showSettings && (
        <div className="absolute inset-0 bg-white dark:bg-zinc-950 z-10 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">実習日程の設定</span>
            <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">✕</button>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-zinc-500">薬学教育協議会のPDFをアップロードするとAIが日程を自動読み取りします。</p>
              <button onClick={() => pdfRef.current?.click()} disabled={importing}
                className="flex items-center justify-center gap-2 py-3 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-[12px] text-zinc-500 hover:bg-zinc-50 disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/><polyline points="14 2 14 8 20 8" strokeWidth="2"/></svg>
                {importing ? "読み取り中…" : "日程PDFをアップロードして自動入力"}
              </button>
              <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfImport} />
              {importMsg && <p className={`text-[11px] px-3 py-2 rounded-md ${importMsg.startsWith("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{importMsg}</p>}
            </div>
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex flex-col gap-3">
              <p className="text-[11px] text-zinc-400">手動で編集することもできます：</p>
              {editPeriods.map((p, i) => (
                <div key={p.id} className="flex flex-col gap-1.5 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-medium text-zinc-600">{p.label}</span>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-zinc-400 w-8">開始</label>
                    <input type="date" value={p.start} onChange={e => setEditPeriods(prev => prev.map((x, j) => j === i ? { ...x, start: e.target.value } : x))}
                      className="flex-1 text-xs border border-zinc-200 rounded px-2 py-1 bg-zinc-50 dark:bg-zinc-900 text-zinc-700" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-zinc-400 w-8">終了</label>
                    <input type="date" value={p.end} onChange={e => setEditPeriods(prev => prev.map((x, j) => j === i ? { ...x, end: e.target.value } : x))}
                      className="flex-1 text-xs border border-zinc-200 rounded px-2 py-1 bg-zinc-50 dark:bg-zinc-900 text-zinc-700" />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={savePeriods} className="py-2 text-sm font-medium rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50">保存してカレンダーに反映</button>
          </div>
        </div>
      )}

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        {periods.map((p, i) => (
          <button key={p.id} onClick={() => setPeriodIdx(i)}
            className={`flex-1 py-1.5 text-[11px] font-medium transition-colors ${periodIdx === i ? "text-zinc-800 dark:text-zinc-200 border-b-2 border-zinc-800 -mb-px bg-zinc-50 dark:bg-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex gap-2 flex-wrap">
          {months.map(({ year, month }) => {
            const firstDay = new Date(year, month, 1).getDay();
            const lastDate = new Date(year, month + 1, 0).getDate();
            return (
              <div key={`${year}-${month}`} className="flex-1 min-w-[160px]">
                <div className="text-[11px] font-medium text-zinc-500 text-center mb-1">{year}年{MONTH_NAMES[month]}</div>
                <div className="grid grid-cols-7 mb-0.5">
                  {DOWS.map(d => <div key={d} className={`text-center text-[9px] py-0.5 ${d==="日"?"text-red-400":d==="土"?"text-blue-400":"text-zinc-400"}`}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-px">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: lastDate }).map((_, i) => {
                    const d = i + 1;
                    const key = toKey(year, month, d);
                    const inP = inPeriod(year, month, d);
                    const isToday = key === todayKey;
                    const isSel = key === selectedDate;
                    const dow = new Date(year, month, d).getDay();
                    const dayEvs = getEventsForDate(key);
                    const kinds = [...new Set(dayEvs.map(e => e.kind))];
                    return (
                      <button key={d} onClick={() => inP && setSelectedDate(key)} disabled={!inP}
                        className={`flex flex-col items-center py-0.5 rounded text-[10px] transition-colors min-h-[28px]
                          ${!inP?"opacity-20 cursor-default":"cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"}
                          ${isToday?"bg-blue-50 dark:bg-blue-950 font-medium":""}
                          ${isSel?"ring-1 ring-blue-400":""}`}>
                        <span className={`${isToday?"text-blue-600":dow===0?"text-red-400":dow===6?"text-blue-400":"text-zinc-600 dark:text-zinc-400"}`}>{d}</span>
                        <div className="flex flex-col gap-px w-full px-0.5">
                          {kinds.map(k => (
                            <span key={k} className={`text-[8px] leading-tight rounded px-0.5 truncate ${KIND_STYLE[k].bg} ${KIND_STYLE[k].text}`}>
                              {KIND_STYLE[k].label}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
