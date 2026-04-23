import { invoke } from '@tauri-apps/api/core';

const MARKDOWN_DIR_KEY = 'meetily_markdown_output_dir';
export const SESSION_NOTES_KEY = 'meetily_session_notes';

export function getMarkdownOutputDir(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(MARKDOWN_DIR_KEY);
}

export function setMarkdownOutputDir(path: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (path) {
    localStorage.setItem(MARKDOWN_DIR_KEY, path);
  } else {
    localStorage.removeItem(MARKDOWN_DIR_KEY);
  }
}

export function getMeetingNotesKey(meetingId: string): string {
  return `meetily_notes_${meetingId}`;
}

export function getMeetingNotes(meetingId: string): string {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(getMeetingNotesKey(meetingId)) || '';
}

export function saveMeetingNotes(meetingId: string, notes: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(getMeetingNotesKey(meetingId), notes);
}

function sanitizeFilename(name: string): string {
  return (name || 'meeting')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'meeting';
}

export function getMeetingMarkdownPath(
  dir: string,
  title: string,
  createdAt: string,
  projectTag?: string | null,
): string {
  const date = createdAt
    ? new Date(createdAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  const safeName = sanitizeFilename(title);
  const normalizedDir = dir.replace(/[/\\]+$/, '');
  const subDir = projectTag ? sanitizeFilename(projectTag) : 'General';
  return `${normalizedDir}/${subDir}/${safeName}-${date}.md`;
}

export async function moveMeetingMarkdown(oldPath: string, newPath: string): Promise<void> {
  if (oldPath === newPath) return;
  return invoke('move_meeting_markdown', { oldPath, newPath });
}

export function buildMarkdownContent(
  title: string,
  createdAt: string,
  summaryMarkdown: string,
  manualNotes: string,
): string {
  const dateStr = createdAt
    ? new Date(createdAt).toLocaleString()
    : new Date().toLocaleString();

  const parts: string[] = [`# ${title}`, ``, `*${dateStr}*`];

  if (manualNotes.trim()) {
    parts.push('', '## My Notes', '', manualNotes.trim());
  }

  if (summaryMarkdown.trim()) {
    parts.push('', '## AI Summary', '', summaryMarkdown.trim());
  }

  return parts.join('\n') + '\n';
}

export async function pickMarkdownOutputDir(): Promise<string | null> {
  return invoke<string | null>('pick_markdown_output_dir');
}

export async function writeMeetingMarkdown(path: string, content: string): Promise<void> {
  return invoke('write_meeting_markdown', { path, content });
}
