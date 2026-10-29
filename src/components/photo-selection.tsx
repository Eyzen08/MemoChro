/* Local file previews are temporary and never enter a shared cache. */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";

function Preview({ file }: { file: File }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={image} alt={file.name} width={180} height={140} />;
}

export function PhotoSelection({ files, onChange, disabled }: {
  files: File[]; onChange: (files: File[]) => void; disabled: boolean;
}) {
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  function add(incoming: File[]) {
    if (disabled) return;
    const next = [...files];
    for (const file of incoming) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Choose JPEG, PNG or WebP photographs."); return;
      }
      if (file.size > 10 * 1024 * 1024 || file.size === 0) {
        setError("Each photograph must be between 1 byte and 10 MiB."); return;
      }
      if (!next.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) next.push(file);
    }
    if (next.length > 4) { setError("Choose up to 4 photographs at a time."); return; }
    setError(""); onChange(next);
  }
  return <div className="photo-selection">
    <label className={`upload-zone ${dragging ? "dragging" : ""}`}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); add(Array.from(e.dataTransfer.files)); }}>
      <Upload size={25} /><strong>Add photographs</strong>
      <span>Choose files or drop them here</span>
      <span>JPEG, PNG or WebP · Up to 4 at a time · 10 MiB each</span>
      <input type="file" name="photos" aria-label="Add photographs" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled}
        onChange={e => { add(Array.from(e.target.files || [])); e.target.value = ""; }} />
    </label>
    {error && <p className="feedback error" role="alert">{error}</p>}
    {files.length > 0 && <ul className="selection-preview" aria-label="Selected photographs">
      {files.map((file, index) => <li key={`${file.name}-${file.size}-${file.lastModified}`}>
        <Preview file={file} /><span>{file.name}</span>
        <button type="button" className="icon-button" disabled={disabled} aria-label={`Remove ${file.name}`}
          onClick={() => onChange(files.filter((_, i) => i !== index))}><X size={18} /></button>
      </li>)}
    </ul>}
  </div>;
}
