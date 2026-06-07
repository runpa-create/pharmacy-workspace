"use client";
import { useState } from "react";
import { useWorkspace, ScheduleEvent, EventKind } from "./WorkspaceContext";
import { KIND_STYLE } from "./CalendarPane";

const EMPTY_FORM = (date?: string): Omit<ScheduleEvent, "id"> => ({
  title: "", kind: "rotation", startDate: date || "", endDate: date || "",
  startTime: "", endTime: "", notes: "",
});

export default function EditorPane() {
  const { yearData, isReadOnly, selectedDate, updateYearData, getEventsForDate } = useWorkspace();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM());

  const dayEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const [y, m, d] = selectedDate?.split("-") ?? [];

  const openAdd = () => {
    setForm(EMPTY_FORM(selectedDate || ""));
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (ev: ScheduleEvent) => {
    setForm({ title: ev.title, kind: ev.kind, startDate: ev.startDate, endDate: ev.endDate, startTime: ev.startTime || "", endTime: ev.endTime || "", notes: ev.notes || "" });
    setEditingId(ev.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    const events = editingId
      ? yearData.events.map(e => e.id === editingId ? { ...form, id: editingId } : e)
      : [...yearData.events, { ...form, id: crypto.randomUUID() }];
    updateYearData({ events });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("このイベントを削除しますか？")) return;
    updateYearData({ events: yearData.events.filter(e => e.id !== id) });
  };

  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-2 px-3 h-10 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/></svg>
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">コンテンツエディタ</span>
        {selectedDate && !showForm && !isReadOnly && (
          <button onClick={openAdd} className="ml-auto flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" strokeWidth="2"/><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/></svg>
            イベントを追加
          </button>
        )}
        {showForm && (
          <button onClick={() => setShowForm(false)} className="ml-auto text-[11px] px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-zinc-50">キャンセル</button>
        )}
        {isReadOnly && selectedDate && (
          <span className="ml-auto text-[10px] text-amber-500">閲覧のみ（過去年度）</span>
        )}
      </div>

      {!selectedDate ? (
        <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">← カレンダーの日付を選択してください</div>
      ) : showForm ? (
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          <p className="text-[11px] font-medium text-zinc-500">{editingId ? "イベントを編集" : `${y}年${m}月${d}日 — 新規イベント`}</p>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">タイトル *</label>
            <input value={form.title} onChange={e => f("title", e.target.value)} placeholder="例: 調剤室実習"
              className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">種別</label>
            <div className="flex gap-2">
              {(["rotation","lecture","other"] as EventKind[]).map(k => (
                <button key={k} onClick={() => f("kind", k)}
                  className={`flex-1 py-1.5 text-[11px] rounded-md border transition-colors
                    ${form.kind === k ? `${KIND_STYLE[k].bg} ${KIND_STYLE[k].text} border-transparent` : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}>
                  {k === "rotation" ? "ローテーション" : k === "lecture" ? "単発講義" : "その他"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">開始日 *</label>
              <input type="date" value={form.startDate} onChange={e => f("startDate", e.target.value)}
                className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">終了日 *</label>
              <input type="date" value={form.endDate} onChange={e => f("endDate", e.target.value)}
                className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400" />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">開始時間</label>
              <input type="time" value={form.startTime} onChange={e => f("startTime", e.target.value)}
                className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">終了時間</label>
              <input type="time" value={form.endTime} onChange={e => f("endTime", e.target.value)}
                className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">到達目標・メモ</label>
            <textarea value={form.notes} onChange={e => f("notes", e.target.value)} rows={4}
              placeholder="到達目標や実施内容のメモ…"
              className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 resize-none" />
          </div>

          <button onClick={handleSave} disabled={!form.title.trim() || !form.startDate || !form.endDate}
            className="py-2 text-xs font-medium rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40">
            {editingId ? "更新する" : "保存する"}
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          <p className="text-[11px] text-zinc-400 flex-shrink-0">{y}年{m}月{d}日のイベント</p>
          {dayEvents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" strokeWidth="1.5"/></svg>
              <p className="text-xs">この日のイベントはありません</p>
              {!isReadOnly && (
                <button onClick={openAdd} className="text-xs px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  ＋ 最初のイベントを追加
                </button>
              )}
            </div>
          ) : (
            dayEvents.map(ev => (
              <div key={ev.id} className={`rounded-lg border p-3 flex flex-col gap-1.5 ${KIND_STYLE[ev.kind].bg}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${KIND_STYLE[ev.kind].text} bg-white/50 dark:bg-black/20`}>
                      {ev.kind === "rotation" ? "ローテーション" : ev.kind === "lecture" ? "講義" : "その他"}
                    </span>
                    <span className={`text-xs font-medium ${KIND_STYLE[ev.kind].text}`}>{ev.title}</span>
                  </div>
                  {!isReadOnly && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(ev)} className={`text-[10px] px-2 py-0.5 rounded border border-current opacity-50 hover:opacity-100 ${KIND_STYLE[ev.kind].text}`}>編集</button>
                      <button onClick={() => handleDelete(ev.id)} className={`text-[10px] px-2 py-0.5 rounded border border-current opacity-50 hover:opacity-100 ${KIND_STYLE[ev.kind].text}`}>削除</button>
                    </div>
                  )}
                </div>
                <div className={`text-[10px] ${KIND_STYLE[ev.kind].text} opacity-75 flex flex-wrap gap-2`}>
                  <span>{ev.startDate} 〜 {ev.endDate}</span>
                  {(ev.startTime || ev.endTime) && <span>{ev.startTime}{ev.startTime && ev.endTime ? "〜" : ""}{ev.endTime}</span>}
                </div>
                {ev.notes && <p className={`text-[11px] ${KIND_STYLE[ev.kind].text} opacity-80 leading-relaxed whitespace-pre-wrap`}>{ev.notes}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
