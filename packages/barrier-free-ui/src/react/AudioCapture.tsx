"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Feedback } from "./Feedback";
import type { PhotoCaptureResult } from "./PhotoCapture";

type Phase = "starting" | "idle" | "ready" | "recording" | "captured" | "saving";

/**
 * 端末が録れる音声の形式の候補（上から順に選ぶ）。この部品は `@qaito/schemas` を持たないので候補だけをここに置き、
 * 受けてよい形式かは保存先のサーバが `@qaito/schemas/recording` の表で照らす。
 */
const AUDIO_MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"] as const;

function audioMimeType(): string {
  for (const type of AUDIO_MIME_CANDIDATES) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function describeMicError(err: unknown): string {
  const error = err as DOMException;
  if (error?.name === "NotAllowedError") {
    return "マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。";
  }
  if (error?.name === "NotFoundError") {
    return "マイクが見つかりません。接続されているか確認してください。";
  }
  if (error?.name === "NotReadableError" || error?.name === "AbortError") {
    return "マイクが他のアプリで使用中です。他のアプリを閉じてから再試行してください。";
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "セキュアな接続（HTTPS または localhost）が必要です。現在の接続では録音できません。";
  }
  return `マイクの起動に失敗しました: ${error?.message || "不明なエラー"}`;
}

/** `audio/webm;codecs=opus` → `audio/webm`（保存先の許可リストは codecs を持たない） */
const baseType = (mime: string) => mime.split(";")[0]!.trim();

/** 1 時間を超えうるときは h:mm:ss、そうでなければ m:ss */
function formatSeconds(total: number, withHours: boolean): string {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return withHours ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${Math.floor(s / 60)}:${ss}`;
}

/** 録った File → 録った秒数（この部品が作った File だけ） */
const recordedSeconds = new WeakMap<File, number>();

/** `AudioCapture` が渡した File の録音の秒数（1 以上）。この部品で録ったものでなければ undefined */
export function getAudioCaptureSeconds(file: File): number | undefined {
  return recordedSeconds.get(file);
}

export function AudioCapture({
  open,
  onClose,
  onCapture,
  maxSeconds,
  title = "録音する",
  description,
  fileNamePrefix = "audio",
}: {
  open: boolean;
  onClose: () => void;
  /** 録れた音声を受け取って保存する。`{ ok: false, error }` を返すと画面に出す */
  onCapture: (file: File) => Promise<PhotoCaptureResult>;
  /** この秒数で自動で止めて、確認の段へ進む */
  maxSeconds: number;
  title?: string;
  /** 保存先の説明（「この利用者の録音として保存します」等） */
  description?: string;
  /** 付ける名前の頭（`{prefix}-20260914-123000.webm`） */
  fileNamePrefix?: string;
}) {
  const [phase, setPhase] = useState<Phase>("starting");
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [hitLimit, setHitLimit] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [clip, setClip] = useState<{ file: File; url: string } | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const openRef = useRef(open);

  const withHours = maxSeconds >= 3600;

  const stopMic = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startMic = useCallback(async (opts?: { keepNotice?: boolean }) => {
    setError(null);
    setHitLimit(false);
    if (!opts?.keepNotice) setJustSaved(false);
    setElapsed(0);
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!openRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      setPhase("ready");
    } catch (err) {
      setError(describeMicError(err));
      setPhase("idle");
    }
  }, []);

  useEffect(() => {
    openRef.current = open;
    if (!open) return;
    void startMic();
    return () => {
      stopMic();
    };
  }, [open, startMic, stopMic]);

  useEffect(() => {
    return () => {
      if (clip) URL.revokeObjectURL(clip.url);
    };
  }, [clip]);

  if (!open) return null;

  function fileNameNow(ext: string): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${fileNamePrefix}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`;
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    try {
      const mimeType = audioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      const startedAt = Date.now();
      recorder.onstop = () => {
        const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        const type = baseType(recorder.mimeType || mimeType || "audio/webm");
        const file = new File([new Blob(chunksRef.current, { type })], fileNameNow(type === "audio/mp4" ? "m4a" : "webm"), {
          type,
        });
        recordedSeconds.set(file, seconds);
        chunksRef.current = [];
        recorderRef.current = null;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setElapsed(seconds);
        setClip({ file, url: URL.createObjectURL(file) });
        setPhase("captured");
      };
      recorder.start(1000);
      setElapsed(0);
      setJustSaved(false);
      setHitLimit(false);
      setPhase("recording");
      timerRef.current = setInterval(() => {
        const next = Math.floor((Date.now() - startedAt) / 1000);
        setElapsed(next);
        if (next >= maxSeconds) {
          setHitLimit(true);
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      setError(describeMicError(err));
      setPhase("idle");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  async function save() {
    if (!clip) return;
    setError(null);
    setPhase("saving");
    const res = await onCapture(clip.file);
    if (!res.ok) {
      setError(res.error ?? "保存に失敗しました");
      setPhase("captured");
      return;
    }
    URL.revokeObjectURL(clip.url);
    setClip(null);
    setJustSaved(true);
    if (openRef.current) void startMic({ keepNotice: true });
  }

  function retake() {
    if (clip) URL.revokeObjectURL(clip.url);
    setClip(null);
    void startMic();
  }

  function close() {
    if (phase === "saving" || phase === "recording") return;
    stopMic();
    if (clip) URL.revokeObjectURL(clip.url);
    setClip(null);
    setJustSaved(false);
    onClose();
  }

  const status =
    phase === "starting"
      ? "マイクを起動しています…"
      : phase === "ready"
        ? justSaved
          ? "保存しました。続けて録れます。"
          : "マイクの準備ができました。「録音を始める」を押してください。"
        : phase === "recording"
          ? "録音しています。終わったら「止める」を押してください。"
          : phase === "captured"
            ? hitLimit
              ? `上限の ${formatSeconds(maxSeconds, withHours)} に達したので止めました。聞き直してから「使う」を押してください。`
              : "録音を止めました。聞き直してから「使う」を押してください。"
            : phase === "saving"
              ? "保存しています…"
              : null;

  return (
    <Dialog
      open={open}
      title={title}
      description={description}
      onClose={close}
      body={
        <div style={{ display: "grid", gap: "var(--bf-space-3)" }}>
          {error && <Feedback tone="error">{error}</Feedback>}
          {}
          {status && <Feedback tone={phase === "ready" && justSaved ? "success" : "info"}>{status}</Feedback>}

          {(phase === "recording" || phase === "ready") && (
            <div
              aria-live="off"
              style={{
                display: "grid",
                gap: "var(--bf-space-1)",
                justifyItems: "center",
                padding: "var(--bf-space-4) 0",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span style={{ fontSize: "var(--bf-font-xl)", fontWeight: 700 }}>
                {formatSeconds(phase === "recording" ? elapsed : 0, withHours)}
              </span>
              <span style={{ color: "var(--bf-muted-fg)", fontSize: "var(--bf-font-sm)" }}>
                残り {formatSeconds(maxSeconds - (phase === "recording" ? elapsed : 0), withHours)}
                （最長 {formatSeconds(maxSeconds, withHours)}）
              </span>
            </div>
          )}

          {clip && (
            <div style={{ display: "grid", gap: "var(--bf-space-2)" }}>
              <audio src={clip.url} controls preload="metadata" aria-label="録った音声" style={{ width: "100%" }} />
              <span style={{ color: "var(--bf-muted-fg)", fontSize: "var(--bf-font-sm)" }}>
                長さ {formatSeconds(elapsed, withHours)}
              </span>
            </div>
          )}
        </div>
      }
    >
      <Button variant="ghost" onClick={close} disabled={phase === "saving" || phase === "recording"}>
        閉じる
      </Button>
      {clip ? (
        <>
          <Button variant="secondary" onClick={retake} disabled={phase === "saving"}>
            録り直す
          </Button>
          <Button onClick={() => void save()} disabled={phase === "saving"}>
            {phase === "saving" ? "保存しています…" : "使う"}
          </Button>
        </>
      ) : phase === "idle" ? (
        <Button variant="secondary" onClick={() => void startMic()}>
          マイクを再試行
        </Button>
      ) : phase === "recording" ? (
        <Button variant="danger" onClick={stopRecording}>
          止める
        </Button>
      ) : (
        <Button onClick={startRecording} disabled={phase !== "ready"}>
          {phase === "starting" ? "マイクを起動しています…" : "録音を始める"}
        </Button>
      )}
    </Dialog>
  );
}
