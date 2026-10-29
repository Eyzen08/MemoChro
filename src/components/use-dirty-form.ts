"use client";
import { useEffect, useRef, type RefObject } from "react";

// Only ordinary link navigation is intercepted. Browser history remains native.
export function useDirtyForm(form: RefObject<HTMLFormElement | null>, files: RefObject<File[]>) {
  const allowLeave = useRef(false);
  useEffect(() => {
    const element = form.current;
    if (!element) return;
    const snapshot = () => JSON.stringify(Array.from(new FormData(element).entries()).filter(([key]) => key !== "photos"));
    const original = snapshot();
    const dirty = () => !allowLeave.current && (files.current.length > 0 || snapshot() !== original);
    function unload(event: BeforeUnloadEvent) {
      if (dirty()) { event.preventDefault(); event.returnValue = ""; }
    }
    function navigate(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const next = new URL(link.href, location.href);
      if (next.pathname === location.pathname && next.search === location.search) return;
      if (dirty()) {
        if (!window.confirm("Leave this memory? Your unsaved changes and selected photographs will be lost.")) {
          event.preventDefault(); event.stopPropagation();
        } else allowLeave.current = true;
      }
    }
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, [form, files]);
  return () => { allowLeave.current = true; };
}
