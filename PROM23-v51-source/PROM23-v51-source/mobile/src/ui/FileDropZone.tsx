import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';
import { procurementExtensions, procurementLimits, type ProcurementFile } from '../procurement';
import { colors, type } from './theme';
// Web uses browser-owned blobs only. This is file selection, never an upload receipt.
export function FileDropZone({ disabled, files: selectedFiles, onFiles, onError, children }: { disabled: boolean; files: ProcurementFile[]; onFiles: (files: ProcurementFile[]) => boolean; onError: (message: string) => void; children: ReactNode }) {
  const [dragging, setDragging] = useState(false); const urls = useRef(new Set<string>());
  useEffect(() => { for (const url of urls.current) if (!selectedFiles.some(file => file.uri === url)) { URL.revokeObjectURL(url); urls.current.delete(url); } }, [selectedFiles]);
  useEffect(() => () => { for (const url of urls.current) URL.revokeObjectURL(url); }, []);
  if (Platform.OS !== 'web') return <View>{children}</View>;
  return <div data-testid="procurement-file-drop" onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => {
    event.preventDefault(); setDragging(false); if (disabled) return;
    const files = Array.from(event.dataTransfer.files);
    if (!files.length) return;
    if (files.length > procurementLimits.files || files.some(f => !f.size || f.size > procurementLimits.bytes || !procurementExtensions.some(ext => f.name.toLowerCase().endsWith('.' + ext)))) {
      onError('До 10 файлов по 20 МБ: PDF, Excel, CSV, Word или фото.'); return;
    }
    const chosen = files.map(file => { const uri = URL.createObjectURL(file); urls.current.add(uri); return { name: file.name, size: file.size, mimeType: file.type, uri, file }; });
    if (!onFiles(chosen)) for (const file of chosen) { URL.revokeObjectURL(file.uri); urls.current.delete(file.uri); }
  }} style={{ padding: 8, borderRadius: 12, border: `1px dashed ${dragging ? colors.accent : colors.line}`, background: dragging ? colors.pale : 'transparent' }}>
    {children}<Text style={[type.caption, { textAlign: 'center', marginTop: 8 }]}>{dragging ? 'Отпустите файлы здесь' : 'Или перетащите файлы в эту область'}</Text>
  </div>;
}
