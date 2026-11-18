"use client";

import { type ReactNode } from "react";

export type FileCardStatus = "idle" | "loading" | "done" | "error";

function StatusIcon({ status }: { status: FileCardStatus }) {
  const common = { width: "1em", height: "1em", viewBox: "0 0 24 24", fill: "none" as const };
  if (status === "loading") {
    return (
      <svg {...common} className="bf-filecard__spin" stroke="var(--bf-primary)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <path d="M12 3 a9 9 0 1 0 9 9" />
      </svg>
    );
  }
  if (status === "done") {
    return (
      <svg {...common} stroke="var(--bf-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <polyline points="8 12 11 15 16 9" />
      </svg>
    );
  }
  if (status === "error") {
    return (
      <svg {...common} stroke="var(--bf-danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="13" />
        <line x1="12" y1="16.5" x2="12" y2="16.5" />
      </svg>
    );
  }
  return null;
}

export function FileCard({
  fileName,
  previewUrl,
  status = "idle",
  statusLabel,
  onRemove,
  disabled,
}: {
  fileName: string;
  previewUrl?: string | null;
  status?: FileCardStatus;
  statusLabel?: ReactNode;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="bf-filecard">
      {onRemove && (
        <button
          type="button"
          className="bf-filecard__remove"
          onClick={onRemove}
          disabled={disabled || status === "loading"}
          aria-label={`${fileName} を削除`}
        >
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      )}

      <div className="bf-filecard__thumb">
        {previewUrl ? (
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={fileName} />
          </a>
        ) : (
          <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="var(--bf-muted-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 3 H7 a2 2 0 0 0-2 2 v14 a2 2 0 0 0 2 2 h10 a2 2 0 0 0 2-2 V8 z" />
            <polyline points="14 3 14 8 19 8" />
          </svg>
        )}
      </div>

      <p className="bf-filecard__name" title={fileName}>
        {fileName}
      </p>

      {statusLabel && (
        <div className="bf-filecard__status">
          <StatusIcon status={status} />
          <span>{statusLabel}</span>
        </div>
      )}
    </div>
  );
}
