"use client";

import { useRef, useState, type ReactNode } from "react";

export function FileUpload({
  name,
  accept,
  multiple = false,
  capture,
  hint = "ここにドラッグ、または押して選択",
  icon,
  showPicked = true,
  onChange,
}: {
  name?: string;
  accept?: string;
  multiple?: boolean;
  /**
   * モバイルブラウザで端末のカメラ/マイクを直接起動する（HTML の capture 属性）。
   * "environment" = 外側カメラ / "user" = 内側カメラ。未指定なら通常のファイル選択。
   * 対応外の環境では単に無視される（プログレッシブエンハンスメント）。
   */
  capture?: "user" | "environment";
  hint?: ReactNode;
  icon?: ReactNode;
  /** 選んだファイルの一覧を出すか。呼ぶ側が 1 件ずつの状態（FileCard 等）を出すときは false（二重に出さない） */
  showPicked?: boolean;
  onChange?: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  function pick(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    onChange?.(arr);
  }

  return (
    <div className="bf-file">
      <button
        type="button"
        className="bf-file__drop"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files);
        }}
      >
        {icon && <span className="bf-file__icon" aria-hidden="true">{icon}</span>}
        <span className="bf-file__hint">{hint}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        capture={capture}
        className="bf-sr-only"
        onChange={(e) => pick(e.target.files)}
      />
      {showPicked && files.length > 0 && (
        <div className="bf-file__list">
          {files.map((f, i) => (
            <div className="bf-file__item" key={i}>
              <span>{f.name}</span>
              {}
              <span>{f.size < 1024 ? "1 KB 未満" : `${Math.round(f.size / 1024)} KB`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
