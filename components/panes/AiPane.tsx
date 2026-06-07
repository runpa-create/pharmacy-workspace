"use client";
import { useState, useRef, useEffect } from "react";
import { useWorkspace } from "./WorkspaceContext";

type Message = { role: "user" | "ai"; text: string };
type BlobFile = { url: string; pathname: string; size: number };

export default function AiPane() {
  const { yearData, currentYear, isReadOnly, selectedDate, getEventsForDate } = useWorkspace();
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "こんにちは。実習計画の作成をお手伝いします。到達目標の文言整理や課題提案など、お気軽にご相談ください。\n\nリファレンスにアップロードしたファイルを参照して回答させることもできます。" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [availableFiles, setAvailableFiles] = useState<BlobFile[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      setAvailableFiles(Array.isArray(data) ? data.filter((f: BlobFile) => true) : []);
    } catch (e) { console.error(e); }
  };

  const handleShowFileSelector = () => {
    if (!showFileSelector) fetchFiles();
    setShowFileSelector(v => !v);
  };

  const toggleFile = (pathname: string) => {
    setSelectedFiles(prev => prev.includes(pathname) ? prev.filter(f => f !== pathname) : [...prev, pathname]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    setShowFileSelector(false);
    setMessages(prev => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `あなたは病院薬剤師の実習指導をサポートするAIアシスタントです。薬学実習計画の作成・到達目標の整理・指導案作成を専門的にサポートします。簡潔で実践的なアドバイスをしてください。現在は${currentYear}年度のデータを参照しています。${isReadOnly ? "この年度は閲覧のみです。" : ""}`,
          messages: [...history, { role: "user", content: text }],
          fileNames: selectedFiles
        })
      });

      const data = await res.json();
      const reply = data.content?.filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("") || "エラーが発生しました。";
      setMessages(prev => [...prev, { role: "ai", text: reply }]);
      setSelectedFiles([]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "通信エラーが発生しました。" }]);
    }
    setLoading(false);
  };

  const sendContext = () => {
    if (!selectedDate) { alert("カレンダーで日付を選択してください。"); return; }
    const evs = getEventsForDate(selectedDate);
    const evText = evs.length > 0
      ? evs.map(e => `・${e.title}（${e.kind === "rotation" ? "ローテーション" : e.kind === "lecture" ? "講義" : "その他"}）${e.startDate}〜${e.endDate}${e.startTime ? " " + e.startTime : ""}${e.notes ? "\n  メモ: " + e.notes : ""}`).join("\n")
      : "（イベントなし）";
    setInput(prev => prev ? prev + "\n\n" + `【${currentYear}年度 ${selectedDate}のイベント】\n${evText}` : `【${currentYear}年度 ${selectedDate}のイベント】\n${evText}`);
  };

  const sendYearSummary = () => {
    const summary = `【${currentYear}年度 実習計画サマリー】\n期間数: ${yearData.periods.length}期\nイベント数: ${yearData.events.length}件\nローテーション: ${yearData.events.filter(e => e.kind === "rotation").length}件\n講義: ${yearData.events.filter(e => e.kind === "lecture").length}件`;
    setInput(prev => prev ? prev + "\n\n" + summary : summary);
  };

  const copyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(idx);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-2 px-3 h-10 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeWidth="2"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2"/></svg>
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">AIアシスタント</span>
        {isReadOnly && <span className="text-[10px] text-amber-500 ml-1">（{currentYear}年度・閲覧モード）</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.map((m, i) => (
          <div key={i} className={`group relative max-w-[88%] ${m.role === "user" ? "self-end" : "self-start"}`}>
            <div className={`px-3 py-2 rounded-lg text-[12px] leading-relaxed whitespace-pre-wrap
              ${m.role === "user"
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                : "bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200"}`}>
              {m.text}
            </div>
            <button onClick={() => copyMessage(m.text, i)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600">
              {copiedId === i ? (
                <svg className="w-2.5 h-2.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeWidth="2"/></svg>
              ) : (
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2"/></svg>
              )}
            </button>
          </div>
        ))}
        {loading && <div className="self-start bg-blue-50 dark:bg-blue-950 text-blue-400 px-3 py-2 rounded-lg text-[12px]">…</div>}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 p-2 flex flex-col gap-1.5 flex-shrink-0">
        <div className="flex gap-2 flex-wrap">
          <button onClick={sendContext}
            className="text-[10px] px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900">
            選択日のイベントを送る
          </button>
          <button onClick={sendYearSummary}
            className="text-[10px] px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900">
            年度サマリーを送る
          </button>
          <button onClick={handleShowFileSelector}
            className={`text-[10px] px-2.5 py-1 rounded border transition-colors
              ${selectedFiles.length > 0
                ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}>
            <svg className="w-2.5 h-2.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/><polyline points="14 2 14 8 20 8" strokeWidth="2"/></svg>
            {selectedFiles.length > 0 ? `${selectedFiles.length}件のファイルを参照中` : "ファイルを参照して質問"}
          </button>
        </div>

        {showFileSelector && (
          <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 flex flex-col gap-1.5 bg-zinc-50 dark:bg-zinc-900">
            <p className="text-[10px] text-zinc-400">参照するファイルを選択（複数可）：</p>
            {availableFiles.length === 0 ? (
              <p className="text-[11px] text-zinc-400">リファレンスにファイルをアップロードしてください</p>
            ) : (
              availableFiles.map(f => (
                <label key={f.pathname} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedFiles.includes(f.pathname)} onChange={() => toggleFile(f.pathname)} className="rounded border-zinc-300" />
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">{f.pathname}</span>
                  <span className="text-[10px] text-zinc-300 flex-shrink-0">{(f.size/1024).toFixed(0)}KB</span>
                </label>
              ))
            )}
          </div>
        )}

        <div className="flex gap-1.5 items-end">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={selectedFiles.length > 0 ? `${selectedFiles.length}件のファイルを参照して回答します…` : "メッセージを入力… (Shift+Enterで改行)"}
            rows={2}
            className="flex-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 resize-none" />
          <button onClick={() => sendMessage(input)} disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40 flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" strokeWidth="2"/><polygon points="22 2 15 22 11 13 2 9 22 2" strokeWidth="2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}