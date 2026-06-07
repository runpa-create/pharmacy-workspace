"use client";
import { useState, useRef } from "react";
import { useWorkspace, Bookmark, UploadedFile } from "./WorkspaceContext";

const FILE_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx";

function getFileType(name: string): UploadedFile["fileType"] {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "pdf";
  if (["doc","docx"].includes(ext)) return "word";
  if (["xls","xlsx"].includes(ext)) return "excel";
  return "other";
}

const FILE_ICON: Record<UploadedFile["fileType"], { color: string; label: string }> = {
  pdf:   { color: "text-red-400",   label: "PDF" },
  word:  { color: "text-blue-500",  label: "Word" },
  excel: { color: "text-green-500", label: "Excel" },
  other: { color: "text-zinc-400",  label: "FILE" },
};

export default function ReferencePane() {
  const { yearData, isReadOnly, updateYearData, uploadedFiles, addFile, removeFile } = useWorkspace();
  const bookmarks = yearData.bookmarks;

  const [tab, setTab] = useState<"bookmarks"|"files">("bookmarks");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [editId, setEditId] = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveBookmarks = (bms: Bookmark[]) => updateYearData({ bookmarks: bms });

  const handleSaveBookmark = () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    const url = newUrl.startsWith("http") ? newUrl : "https://" + newUrl;
    if (editId) {
      saveBookmarks(bookmarks.map(b => b.id === editId ? { ...b, label: newLabel, url } : b));
      setEditId(null);
    } else {
      saveBookmarks([...bookmarks, { id: crypto.randomUUID(), label: newLabel, url }]);
    }
    setNewLabel(""); setNewUrl(""); setShowAddForm(false);
  };

  const openEdit = (b: Bookmark) => {
    setNewLabel(b.label); setNewUrl(b.url); setEditId(b.id); setShowAddForm(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(f => {
      addFile({ id: crypto.randomUUID(), name: f.name, fileType: getFileType(f.name), url: URL.createObjectURL(f) });
    });
    e.target.value = "";
  };

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-2 px-3 h-10 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeWidth="2"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeWidth="2"/></svg>
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">リファレンス</span>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        {(["bookmarks","files"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setShowAddForm(false); }}
            className={`flex-1 py-2 text-[11px] font-medium transition-colors
              ${tab === t ? "text-zinc-800 dark:text-zinc-200 border-b-2 border-zinc-800 dark:border-zinc-200 -mb-px" : "text-zinc-400 hover:text-zinc-600"}`}>
            {t === "bookmarks" ? "ブックマーク" : "ファイル"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
        {tab === "bookmarks" && (
          <>
            {bookmarks.map(b => (
              <div key={b.id} className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 group">
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-1 min-w-0">
                  <svg className="w-3 h-3 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeWidth="2"/><polyline points="15 3 21 3 21 9" strokeWidth="2"/><line x1="10" y1="14" x2="21" y2="3" strokeWidth="2"/></svg>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">{b.label}</span>
                </a>
                {!isReadOnly && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => openEdit(b)} className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600">編集</button>
                    <button onClick={() => saveBookmarks(bookmarks.filter(x => x.id !== b.id))} className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500">✕</button>
                  </div>
                )}
              </div>
            ))}

            {!isReadOnly && (showAddForm ? (
              <div className="mt-1 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 flex flex-col gap-2">
                <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{editId ? "ブックマークを編集" : "ブックマークを追加"}</p>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400">リンク名</label>
                  <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="例: コアカリキュラム2024"
                    className="text-xs border border-zinc-200 dark:border-zinc-700 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400">URL</label>
                  <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..."
                    className="text-xs border border-zinc-200 dark:border-zinc-700 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveBookmark} disabled={!newLabel.trim() || !newUrl.trim()}
                    className="flex-1 py-1.5 text-[11px] font-medium rounded border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 disabled:opacity-40">
                    {editId ? "更新" : "追加"}
                  </button>
                  <button onClick={() => { setShowAddForm(false); setNewLabel(""); setNewUrl(""); setEditId(null); }}
                    className="px-3 py-1.5 text-[11px] rounded border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-zinc-50">
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setShowAddForm(true); setEditId(null); setNewLabel(""); setNewUrl(""); }}
                className="mt-1 w-full py-1.5 text-[11px] text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900">
                ＋ ブックマークを追加
              </button>
            ))}
          </>
        )}

        {tab === "files" && (
          <>
            {!isReadOnly && (
              <button onClick={() => fileRef.current?.click()}
                className="w-full py-5 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-md flex flex-col items-center gap-1.5 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2"/><polyline points="17 8 12 3 7 8" strokeWidth="2"/><line x1="12" y1="3" x2="12" y2="15" strokeWidth="2"/></svg>
                <span className="text-[11px]">ファイルをアップロード</span>
                <span className="text-[10px] text-zinc-300 dark:text-zinc-600">PDF・Word・Excel 対応</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept={FILE_ACCEPT} multiple className="hidden" onChange={handleFile} />
            {uploadedFiles.length === 0 && isReadOnly && (
              <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">ファイルはセッション中のみ保持されます</div>
            )}
            {uploadedFiles.map(f => (
              <div key={f.id} className="flex items-center gap-2 px-2.5 py-2 rounded-md border border-zinc-100 dark:border-zinc-800 group">
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded border ${FILE_ICON[f.fileType].color} border-current flex-shrink-0`}>
                  {FILE_ICON[f.fileType].label}
                </span>
                <a href={f.url} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:underline flex-1 truncate">{f.name}</a>
                <button onClick={() => removeFile(f.id)}
                  className="text-zinc-300 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">✕</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
