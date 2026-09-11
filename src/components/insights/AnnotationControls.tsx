"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildAnchor,
  locateTextOffset,
  readFlatText,
  resolveQuoteOffsets,
} from "@/lib/annotations/anchoring.mjs";
import {
  TOOLS_ENABLED_KEY,
  addLocalAnnotation,
  createEmptyState,
  createLocalId,
  normaliseState,
  removeLocalAnnotation,
  resolveToolsEnabled,
  restoreIds,
  storageKey,
  toggleHidden,
} from "@/lib/annotations/state.mjs";

export interface AnnotationLabels {
  toggleOpen: string;
  toggleClose: string;
  hint: string;
  hiddenTitle: string;
  hiddenEmpty: string;
  localTitle: string;
  localEmpty: string;
  underline: string;
  note: string;
  notePlaceholder: string;
  save: string;
  cancel: string;
  hide: string;
  restore: string;
  restoreAll: string;
  delete: string;
  disableTools: string;
  selectionFailed: string;
  hiddenPlaceholder: string;
}

interface AnnotationControlsProps {
  slug: string;
  locale: string;
  labels: AnnotationLabels;
}

interface PublishedMark {
  id: string;
  kind: "mark" | "note";
  text: string;
}

const SELECTOR = "[data-mark],[data-note]";

type AnnotationState = ReturnType<typeof createEmptyState>;

/** Finds the article this toolbar belongs to. */
function findArticle(host: HTMLElement | null): HTMLElement | null {
  const row = host?.closest(".aligned-section-row");
  return row?.querySelector<HTMLElement>(".insight-body") ?? null;
}

/** Flat-text offsets of a DOM range, matching `readFlatText`'s traversal. */
function rangeOffsets(article: HTMLElement, range: Range): { start: number; end: number } | null {
  const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let start = -1;
  let end = -1;
  let node = walker.nextNode();

  while (node) {
    const length = node.textContent?.length ?? 0;
    if (node === range.startContainer) start = consumed + range.startOffset;
    if (node === range.endContainer) end = consumed + range.endOffset;
    consumed += length;
    node = walker.nextNode();
  }

  return start >= 0 && end > start ? { start, end } : null;
}

function wrapRange(range: Range, id: string, hasNote: boolean): boolean {
  const span = document.createElement("span");
  span.className = "mk-local";
  span.dataset.localId = id;
  if (hasNote) span.dataset.hasNote = "true";

  try {
    span.appendChild(range.extractContents());
    range.insertNode(span);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reading-side annotation layer.
 *
 * Two jobs, both entirely local to this browser:
 *   1. hide or restore marks that were published into the article, and
 *   2. add the reader's own underlines and notes.
 *
 * Nothing here writes back to the repository or to Notion; the published
 * article stays the single source of truth.
 */
export function AnnotationControls({ slug, locale, labels }: AnnotationControlsProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pendingRange = useRef<Range | null>(null);

  const [state, setState] = useState<AnnotationState>(createEmptyState);
  const [hydrated, setHydrated] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [published, setPublished] = useState<PublishedMark[]>([]);
  const [barAt, setBarAt] = useState<{ top: number; left: number } | null>(null);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const storageId = storageKey(slug, locale);

  /* ── the tools are off for every visitor unless the author turns them on ──
     Published marks are part of the article HTML and stay visible either way;
     this only decides who gets the editing and hiding interface. */

  useEffect(() => {
    let stored = null;
    try {
      stored = window.localStorage.getItem(TOOLS_ENABLED_KEY);
    } catch {
      stored = null;
    }

    const resolved = resolveToolsEnabled({ search: window.location.search, stored });

    if (resolved.fromUrl) {
      try {
        window.localStorage.setItem(TOOLS_ENABLED_KEY, resolved.enabled ? "1" : "0");
      } catch {
        /* private mode: the choice simply will not persist */
      }
    }

    setEnabled(resolved.enabled);
  }, []);

  const disableTools = useCallback(() => {
    setEnabled(false);
    setOpen(false);
    try {
      window.localStorage.setItem(TOOLS_ENABLED_KEY, "0");
    } catch {
      /* ignore */
    }
  }, []);

  /* ── load and persist ─────────────────────────────────────────────────── */

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageId);
      setState(raw ? normaliseState(JSON.parse(raw)) : createEmptyState());
    } catch {
      setState(createEmptyState());
    }
    setHydrated(true);
  }, [storageId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageId, JSON.stringify(state));
    } catch {
      /* private mode or quota: the layer simply stays session-only */
    }
  }, [state, hydrated, storageId]);

  /* ── collect published marks once the article is in the DOM ───────────── */

  useEffect(() => {
    if (!hydrated || !enabled) return;
    const article = findArticle(hostRef.current);
    if (!article) return;

    setPublished(
      [...article.querySelectorAll<HTMLElement>(SELECTOR)].map((element): PublishedMark => ({
        id: element.dataset.mark ?? element.dataset.note ?? "",
        kind: element.hasAttribute("data-note") ? "note" : "mark",
        text: (element.textContent ?? "").trim().slice(0, 80),
      })).filter((entry) => entry.id !== "")
    );
  }, [hydrated, enabled]);

  /* ── reflect state onto the article ───────────────────────────────────── */

  useEffect(() => {
    if (!hydrated || !enabled) return;
    const article = findArticle(hostRef.current);
    if (!article) return;

    const hidden = new Set(state.hidden);
    for (const element of article.querySelectorAll<HTMLElement>(SELECTOR)) {
      const id = element.dataset.mark ?? element.dataset.note ?? "";
      const isHidden = hidden.has(id);
      element.dataset.hidden = isHidden ? "true" : "false";
      if (isHidden && element.hasAttribute("data-note")) {
        element.dataset.hiddenLabel = labels.hiddenPlaceholder;
      } else {
        delete element.dataset.hiddenLabel;
      }
    }

    if (open) article.dataset.annotationsEditing = "true";
    else delete article.dataset.annotationsEditing;
  }, [state.hidden, hydrated, enabled, open, labels.hiddenPlaceholder]);

  /* ── re-apply the reader's own marks after a reload ───────────────────── */

  useEffect(() => {
    if (!hydrated || !enabled) return;
    const article = findArticle(hostRef.current);
    if (!article) return;

    // Drop wrappers whose annotation is gone (deleted, or storage reset).
    const wanted = new Set(state.local.map((entry) => entry.id));
    for (const element of article.querySelectorAll<HTMLElement>("[data-local-id]")) {
      const id = element.dataset.localId ?? "";
      if (wanted.has(id)) continue;
      const parent = element.parentNode;
      if (!parent) continue;
      while (element.firstChild) parent.insertBefore(element.firstChild, element);
      parent.removeChild(element);
    }

    let failed = false;
    for (const entry of state.local) {
      if (article.querySelector(`[data-local-id="${entry.id}"]`)) continue;

      const offsets = resolveQuoteOffsets(readFlatText(article), entry);
      if (!offsets) continue;

      const start = locateTextOffset(article, offsets.start);
      const end = locateTextOffset(article, offsets.end);
      if (!start || !end) continue;

      const range = document.createRange();
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);

      if (!wrapRange(range, entry.id, Boolean(entry.note))) failed = true;
    }

    setNotice(failed ? labels.selectionFailed : "");
  }, [state.local, hydrated, enabled, labels.selectionFailed]);

  /* ── click a published mark to hide or restore it (while managing) ────── */

  useEffect(() => {
    if (!hydrated || !enabled || !open) return;

    const onClick = (event: MouseEvent) => {
      const element = (event.target as HTMLElement | null)?.closest?.(SELECTOR);
      if (!element) return;
      const id = element.getAttribute("data-mark") ?? element.getAttribute("data-note");
      if (!id) return;
      event.preventDefault();
      setState((current) => toggleHidden(current, id));
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [hydrated, enabled, open]);

  /* ── text selection ───────────────────────────────────────────────────── */

  useEffect(() => {
    if (!hydrated || !enabled || !open) {
      setBarAt(null);
      pendingRange.current = null;
      return;
    }

    const onMouseUp = (event: MouseEvent) => {
      // Clicking the floating bar must not clear the captured range: mouseup
      // fires before click, and clicking collapses the selection.
      if (event.target instanceof Element && event.target.closest(".annotation-bar")) return;

      const article = findArticle(hostRef.current);
      const selection = window.getSelection();
      if (!article || !selection || selection.isCollapsed || selection.rangeCount === 0) {
        setBarAt(null);
        setNoteDraft(null);
        pendingRange.current = null;
        return;
      }

      const range = selection.getRangeAt(0);
      if (!article.contains(range.commonAncestorContainer)) return;
      if (selection.toString().trim() === "") return;

      const rect = range.getBoundingClientRect();
      pendingRange.current = range;
      setNoteDraft(null);
      setBarAt({ top: rect.top, left: rect.left + rect.width / 2 });
    };

    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [hydrated, enabled, open]);

  const commitSelection = useCallback(
    (note: string) => {
      const article = findArticle(hostRef.current);
      const range = pendingRange.current;
      if (!article || !range) return;

      const offsets = rangeOffsets(article, range);
      if (!offsets) {
        setNotice(labels.selectionFailed);
        return;
      }

      const anchor = buildAnchor(readFlatText(article), offsets.start, offsets.end);
      setState((current) =>
        addLocalAnnotation(current, {
          id: createLocalId(),
          ...anchor,
          note,
          createdAt: Date.now(),
        })
      );

      setNotice("");
      setBarAt(null);
      setNoteDraft(null);
      pendingRange.current = null;
      window.getSelection()?.removeAllRanges();
    },
    [labels.selectionFailed]
  );

  const hiddenPublished = published.filter((entry) => state.hidden.includes(entry.id));

  // The tools stay out of the static HTML entirely: readers never receive the
  // markup, not merely a hidden version of it.
  if (!enabled) return null;

  return (
    <div className="annotation-controls" ref={hostRef}>
      <div className="annotation-controls-row">
        <button
          type="button"
          className="annotation-toggle"
          aria-expanded={open}
          onClick={() => {
            setOpen((value) => !value);
            setNotice("");
          }}
        >
          {open ? labels.toggleClose : labels.toggleOpen}
        </button>
        {open ? <p className="annotation-hint">{labels.hint}</p> : null}
        <button type="button" className="annotation-disable" onClick={disableTools}>
          {labels.disableTools}
        </button>
      </div>

      {notice ? <p className="annotation-notice">{notice}</p> : null}

      {open ? (
        <div className="annotation-panel">
          <section className="annotation-group">
            <h3>{labels.localTitle}</h3>
            {state.local.length === 0 ? (
              <p className="annotation-empty">{labels.localEmpty}</p>
            ) : (
              <ul>
                {state.local.map((entry) => (
                  <li key={entry.id}>
                    <blockquote>{entry.quote}</blockquote>
                    {entry.note ? <p className="annotation-note">{entry.note}</p> : null}
                    <button
                      type="button"
                      onClick={() => setState((current) => removeLocalAnnotation(current, entry.id))}
                    >
                      {labels.delete}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="annotation-group">
            <h3>
              {labels.hiddenTitle}
              {hiddenPublished.length > 0 ? ` · ${hiddenPublished.length}` : ""}
            </h3>
            {hiddenPublished.length === 0 ? (
              <p className="annotation-empty">{labels.hiddenEmpty}</p>
            ) : (
              <>
                <ul>
                  {hiddenPublished.map((entry) => (
                    <li key={entry.id}>
                      <blockquote>
                        [{entry.kind === "note" ? labels.note : labels.underline}] {entry.text}
                      </blockquote>
                      <button
                        type="button"
                        onClick={() => setState((current) => toggleHidden(current, entry.id))}
                      >
                        {labels.restore}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="annotation-restore-all"
                  onClick={() =>
                    setState((current) =>
                      restoreIds(current, hiddenPublished.map((entry) => entry.id))
                    )
                  }
                >
                  {labels.restoreAll}
                </button>
              </>
            )}
          </section>
        </div>
      ) : null}

      {barAt && open ? (
        <div
          className="annotation-bar"
          style={{ top: `${barAt.top}px`, left: `${barAt.left}px` }}
          role="toolbar"
        >
          {noteDraft === null ? (
            <>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => commitSelection("")}>
                {labels.underline}
              </button>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setNoteDraft("")}>
                {labels.note}
              </button>
            </>
          ) : (
            <>
              <input
                autoFocus
                value={noteDraft}
                placeholder={labels.notePlaceholder}
                onChange={(event) => setNoteDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitSelection(noteDraft.trim());
                  if (event.key === "Escape") setNoteDraft(null);
                }}
              />
              <button type="button" onClick={() => commitSelection(noteDraft.trim())}>
                {labels.save}
              </button>
              <button type="button" onClick={() => setNoteDraft(null)}>
                {labels.cancel}
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
