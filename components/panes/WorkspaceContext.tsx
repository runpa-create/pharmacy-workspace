"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type EventKind = "rotation" | "lecture" | "other";
export type Period = { id: string; label: string; start: string; end: string };
export type ScheduleEvent = {
  id: string; title: string; kind: EventKind;
  startDate: string; endDate: string;
  startTime?: string; endTime?: string; notes?: string;
  templateId?: string;
};
export type RotationTemplate = { id: string; title: string; kind: EventKind; durationWeeks: number; notes?: string };
export type Bookmark = { id: string; label: string; url: string };
export type UploadedFile = { id: string; name: string; fileType: "pdf"|"word"|"excel"|"other"; url: string };
export type DayNote = { notes: string };

export type YearData = {
  academicYear: number;
  memo: string;
  periods: Period[];
  rotationTemplates: RotationTemplate[];
  events: ScheduleEvent[];
  dayNotes: Record<string, DayNote>;
  bookmarks: Bookmark[];
  exportedAt?: string;
};

const DEFAULT_PERIODS: Period[] = [
  { id: "p1", label: "第Ⅰ期", start: "2026-02-16", end: "2026-05-01" },
  { id: "p2", label: "第Ⅱ期", start: "2026-05-18", end: "2026-07-31" },
  { id: "p3", label: "第Ⅲ期", start: "2026-08-17", end: "2026-10-30" },
  { id: "p4", label: "第Ⅳ期", start: "2026-11-16", end: "2027-02-05" },
];

const DEFAULT_TEMPLATES: RotationTemplate[] = [
  { id: "t1", title: "調剤室実習", kind: "rotation", durationWeeks: 2 },
  { id: "t2", title: "病棟薬剤師業務", kind: "rotation", durationWeeks: 2 },
  { id: "t3", title: "服薬指導実習", kind: "rotation", durationWeeks: 1 },
  { id: "t4", title: "薬剤管理指導", kind: "rotation", durationWeeks: 1 },
];

function makeDefaultYear(year: number): YearData {
  return {
    academicYear: year, memo: "",
    periods: DEFAULT_PERIODS.map(p => ({ ...p })),
    rotationTemplates: DEFAULT_TEMPLATES.map(t => ({ ...t })),
    events: [], dayNotes: {},
    bookmarks: [
      { id: "b1", label: "薬学教育モデル・コアカリキュラム（令和4年改訂）", url: "https://www.mext.go.jp/b_menu/shingi/chousa/koutou/058/gaiyou/1340373.htm" },
      { id: "b2", label: "実務実習指導薬剤師講習会（日薬）", url: "https://www.nichiyaku.or.jp/" },
      { id: "b3", label: "薬学教育協議会 実務実習情報", url: "https://www.gakkyou.jp/" },
      { id: "b4", label: "厚労省 薬剤師関連情報", url: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iyakuhin/yakkyoku_yakuzaishi/" },
      { id: "b5", label: "JPALS（薬剤師生涯学習支援）", url: "https://jpals.jp/" },
    ],
  };
}

const STORAGE_KEY = "pharm_ws_years";
const CURRENT_YEAR_KEY = "pharm_ws_current_year";

function loadAllYears(): Record<number, YearData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const def = makeDefaultYear(2026);
  return { 2026: def };
}

function saveAllYears(years: Record<number, YearData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(years));
}

type WorkspaceCtx = {
  currentYear: number;
  allYears: number[];
  yearData: YearData;
  isReadOnly: boolean;
  setCurrentYear: (y: number) => void;
  createYear: (y: number, copyFromYear?: number) => void;
  updateYearData: (patch: Partial<YearData>) => void;
  selectedDate: string | null;
  setSelectedDate: (d: string | null) => void;
  getEventsForDate: (date: string) => ScheduleEvent[];
  exportCurrentYear: () => void;
  exportAllYears: () => void;
  importYear: (json: string) => void;
  uploadedFiles: UploadedFile[];
  addFile: (f: UploadedFile) => void;
  removeFile: (id: string) => void;
};

const Ctx = createContext<WorkspaceCtx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [allYearsData, setAllYearsData] = useState<Record<number, YearData>>(loadAllYears);
  const [currentYear, setCurrentYearState] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(CURRENT_YEAR_KEY) || "2026"); } catch { return 2026; }
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const allYears = Object.keys(allYearsData).map(Number).sort((a, b) => b - a);
  const yearData = allYearsData[currentYear] || makeDefaultYear(currentYear);
  const latestYear = Math.max(...allYears);
  const isReadOnly = currentYear < latestYear;

  const setCurrentYear = useCallback((y: number) => {
    setCurrentYearState(y);
    setSelectedDate(null);
    localStorage.setItem(CURRENT_YEAR_KEY, String(y));
  }, []);

  const createYear = useCallback((y: number, copyFromYear?: number) => {
    setAllYearsData(prev => {
      if (prev[y]) return prev;
      const base = copyFromYear && prev[copyFromYear]
        ? { ...prev[copyFromYear], academicYear: y, memo: "", events: [], dayNotes: {}, exportedAt: undefined }
        : makeDefaultYear(y);
      const next = { ...prev, [y]: base };
      saveAllYears(next);
      return next;
    });
    setCurrentYearState(y);
    localStorage.setItem(CURRENT_YEAR_KEY, String(y));
  }, []);

  const updateYearData = useCallback((patch: Partial<YearData>) => {
    if (currentYear < Math.max(...Object.keys(allYearsData).map(Number))) return;
    setAllYearsData(prev => {
      const next = { ...prev, [currentYear]: { ...prev[currentYear], ...patch } };
      saveAllYears(next);
      return next;
    });
  }, [currentYear, allYearsData]);

  const getEventsForDate = useCallback((date: string) => {
    return yearData.events.filter(ev => ev.startDate <= date && ev.endDate >= date);
  }, [yearData.events]);

  const exportCurrentYear = useCallback(() => {
    const data = { ...yearData, exportedAt: new Date().toISOString().slice(0, 10) };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = `${currentYear}_jisshu_plan.json`; a.click();
  }, [yearData, currentYear]);

  const exportAllYears = useCallback(() => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(allYearsData, null, 2)], { type: "application/json" }));
    a.download = `jisshu_plan_all.json`; a.click();
  }, [allYearsData]);

  const importYear = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.academicYear) {
        setAllYearsData(prev => {
          const next = { ...prev, [parsed.academicYear]: parsed };
          saveAllYears(next);
          return next;
        });
        setCurrentYearState(parsed.academicYear);
        localStorage.setItem(CURRENT_YEAR_KEY, String(parsed.academicYear));
      } else {
        const next = parsed as Record<number, YearData>;
        setAllYearsData(next);
        saveAllYears(next);
      }
    } catch { alert("ファイルの読み込みに失敗しました。"); }
  }, []);

  const addFile = useCallback((f: UploadedFile) => setUploadedFiles(prev => [...prev, f]), []);
  const removeFile = useCallback((id: string) => setUploadedFiles(prev => prev.filter(f => f.id !== id)), []);

  return (
    <Ctx.Provider value={{ currentYear, allYears, yearData, isReadOnly, setCurrentYear, createYear, updateYearData, selectedDate, setSelectedDate, getEventsForDate, exportCurrentYear, exportAllYears, importYear, uploadedFiles, addFile, removeFile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}


