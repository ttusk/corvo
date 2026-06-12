/**
 * UI Constants for the Leif plugin
 */

export const DATE_FORMAT = "dd/MM/yyyy";

/**
 * Icon names from Lucide icon library (built into Obsidian).
 * Browse available icons at: https://lucide.dev/
 */
export const ICON_NAMES = {
  dashboard: "layout-dashboard",
  contests: "trophy",
  cycle: "refresh-cw",
  items: "file-text",
  topics: "book-open",
  sessions: "clock",
  wall: "layout-grid",
  delete: "trash-2",
  add: "plus",
  edit: "pencil",
  save: "check",
  cancel: "x",
  up: "arrow-up",
  down: "arrow-down",
  toggleOn: "toggle-right",
  toggleOff: "toggle-left",
  expand: "chevron-down",
  collapse: "chevron-up",
  download: "download"
} as const;

export type LeifTabId = "dashboard" | "contests" | "cycle" | "items" | "topics" | "sessions" | "wall";

export const TABS: Array<{ id: LeifTabId; label: string; icon: string }> = [
  { id: "dashboard", label: "Dashboard", icon: ICON_NAMES.dashboard },
  { id: "contests", label: "Concursos", icon: ICON_NAMES.contests },
  { id: "cycle", label: "Ciclo e Matérias", icon: ICON_NAMES.cycle },
  { id: "items", label: "Itens e PDFs", icon: ICON_NAMES.items },
  { id: "topics", label: "Assuntos e Questões", icon: ICON_NAMES.topics },
  { id: "sessions", label: "Sessões", icon: ICON_NAMES.sessions },
  { id: "wall", label: "Mural", icon: ICON_NAMES.wall }
];
