"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Feedback } from "./Feedback";
import { FileUpload } from "./FileUpload";
import type { PhotoCaptureResult } from "./PhotoCapture";

type Phase = "starting" | "idle" | "live" | "recording" | "captured" | "saving";

function describeDeviceError(err: unknown): string {
  const error = err as DOMException;
  if (error?.name === "NotAllowedError") {
    return "カメラ・マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。";
  }
  if (error?.name === "NotFoundError") {
    return "カメラかマイクが見つかりません。接続されているか確認してください。";
  }
  if (error?.name === "NotReadableError" || error?.name === "AbortError") {
    return "カメラかマイクが他のアプリで使用中です。他のアプリを閉じてから再試行してください。";
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "セキュアな接続（HTTPS または localhost）が必要です。現在の接続では録画できません。";
  }
  return `カメラの起動に失敗しました: ${error?.message || "不明なエラー"}`;
}

/** 端末が録れる動画の MIME（無ければ空 = ブラウザに任せる） */
function videoMimeType(): string {
  for (const type of ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

/** `video/webm;codecs=vp9,opus` → `video/webm`（保存先の許可リストは codecs を持たない） */
const baseType = (mime: string) => mime.split(";")[0]!.trim();

const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function VideoCapture({
  open,
  onClose,
  onCapture,
  maxSeconds,
  title = "動画を撮る",
  description,
  fileNamePrefix = "video",
}: {
  open: boolean;
  onClose: () => void;
  /** 録れた動画を受け取って保存する。`{ ok: false, error }` を返すと画面に出す */
  onCapture: (file: File) => Promise<PhotoCaptureResult>;
  /** この秒数で自動で止める */
  maxSeconds: number;
  title?: string;
  /** 保存先の説明（「Qaito ドライブに保存します」等） */
  description?: string;
  /** 付ける名前の頭（`{prefix}-20260914-123000.webm`） */
  fileNamePrefix?: string;
}) {
  const [phase, setPhase] = useState<Phase>("starting");
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [clip, setClip] = useState<{ file: File; url: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setPhase("live");
    } catch (err) {
      setError(describeDeviceError(err));
      setPhase("idle");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void startCamera();
    return () => {
      stopStream();
    };
  }, [open, startCamera, stopStream]);

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
      const mimeType = videoMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = baseType(recorder.mimeType || "video/webm");
        const file = new File([new Blob(chunksRef.current, { type })], fileNameNow(type === "video/mp4" ? "mp4" : "webm"), { type });
        chunksRef.current = [];
        setClip({ file, url: URL.createObjectURL(file) });
        setJustSaved(false);
        setPhase("captured");
      };
      recorder.start(1000);
      const startedAt = Date.now();
      setElapsed(0);
      setPhase("recording");
      timerRef.current = setInterval(() => {
        const next = Math.floor((Date.now() - startedAt) / 1000);
        setElapsed(next);
        if (next >= maxSeconds) stopRecording();
      }, 1000);
    } catch (err) {
      setError(describeDeviceError(err));
      setPhase("idle");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  /** 端末の標準カメラで録ったものを取り込む（MediaRecorder が使えないときの道） */
  function pickFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("動画を選んでください");
      return;
    }
    setError(null);
    setClip({ file, url: URL.createObjectURL(file) });
    setJustSaved(false);
    setPhase("captured");
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
    setPhase(streamRef.current ? "live" : "idle");
  }

  function retake() {
    if (clip) URL.revokeObjectURL(clip.url);
    setClip(null);
    setJustSaved(false);
    setPhase(streamRef.current ? "live" : "idle");
  }

  function close() {
    if (phase === "saving") return;
    stopStream();
    if (clip) URL.revokeObjectURL(clip.url);
    setClip(null);
    setJustSaved(false);
    onClose();
  }

  return (
    <Dialog
      open={open}
      size="lg"
      title={title}
      description={description}
      onClose={close}
      body={
        <div style={{ display: "grid", gap: "var(--bf-space-3)" }}>
          {error && <Feedback tone="error">{error}</Feedback>}
          {justSaved && !error && <Feedback tone="success">保存しました。続けて録れます。</Feedback>}
          {phase === "recording" && (
            <Feedback tone="info">
              録画中 {formatSeconds(elapsed)}（{formatSeconds(maxSeconds)} で自動で止まります）
            </Feedback>
          )}

          {(phase !== "idle" || clip) && (
            <div
              style={{
                position: "relative",
                aspectRatio: "4 / 3",
                width: "100%",
                maxWidth: "34rem",
                maxHeight: "min(52vh, 26rem)",
                margin: "0 auto",
                background: "var(--bf-muted-bg)",
                overflow: "hidden",
              }}
            >
              {}
              {clip ? (
                <video
                  src={clip.url}
                  controls
                  playsInline
                  aria-label="録った動画"
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  aria-label="カメラの映像"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
            </div>
          )}

          {phase === "idle" && !clip && (
            <FileUpload accept="video/*" capture="environment" hint="端末のカメラで録る / 動画を選ぶ" onChange={pickFile} />
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
            {phase === "saving" ? "保存しています…" : "保存する"}
          </Button>
        </>
      ) : phase === "idle" ? (
        <Button variant="secondary" onClick={() => void startCamera()}>
          カメラを再試行
        </Button>
      ) : phase === "recording" ? (
        <Button onClick={stopRecording}>止める</Button>
      ) : (
        <Button onClick={startRecording} disabled={phase !== "live"}>
          {phase === "starting" ? "カメラを起動しています…" : "録画を始める"}
        </Button>
      )}
    </Dialog>
  );
}
