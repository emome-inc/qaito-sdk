"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Feedback } from "./Feedback";
import { FileUpload } from "./FileUpload";

/** 保存の結果。失敗の言い方は呼ぶ側が持つ（面ごとに違うため）。 */
export type PhotoCaptureResult = { ok: boolean; error?: string };

type Phase = "starting" | "idle" | "live" | "captured" | "saving";

/** getUserMedia の失敗を日本語に落とす。 */
function describeCameraError(err: unknown): string {
  const error = err as DOMException;
  if (error?.name === "NotAllowedError") {
    return "カメラへのアクセスが拒否されました。ブラウザの設定を確認してください。";
  }
  if (error?.name === "NotFoundError") {
    return "カメラが見つかりません。接続されているか確認してください。";
  }
  if (error?.name === "NotReadableError" || error?.name === "AbortError") {
    return "カメラが他のアプリで使用中です。他のアプリを閉じてから再試行してください。";
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "セキュアな接続（HTTPS または localhost）が必要です。現在の接続では撮影できません。";
  }
  return `カメラの起動に失敗しました: ${error?.message || "不明なエラー"}`;
}

export function PhotoCapture({
  open,
  onClose,
  onCapture,
  title = "写真を撮る",
  description,
  fileNamePrefix = "photo",
}: {
  open: boolean;
  onClose: () => void;
  /** 撮れた写真を受け取って保存する。`{ ok: false, error }` を返すと画面に出す */
  onCapture: (file: File) => Promise<PhotoCaptureResult>;
  title?: string;
  /** 保存先の説明（「Qaito ドライブに保存します」等）。面ごとに違うので受ける */
  description?: string;
  /** 付ける名前の頭（`{prefix}-20260914-123000.jpg`）。 */
  fileNamePrefix?: string;
}) {
  const [phase, setPhase] = useState<Phase>("starting");
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [shot, setShot] = useState<{ file: File; url: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setPhase("live");
    } catch (err) {
      setError(describeCameraError(err));
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
      if (shot) URL.revokeObjectURL(shot.url);
    };
  }, [shot]);

  if (!open) return null;

  function fileNameNow(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${fileNamePrefix}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.jpg`;
  }

  function takePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("撮影に失敗しました（描画コンテキストを取得できません）");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("撮影に失敗しました");
          return;
        }
        const file = new File([blob], fileNameNow(), { type: "image/jpeg" });
        setShot({ file, url: URL.createObjectURL(file) });
        setJustSaved(false);
        setPhase("captured");
      },
      "image/jpeg",
      0.92,
    );
  }

  /** 端末の標準カメラで撮ったものを取り込む（getUserMedia が使えないときの道）。 */
  function pickFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("写真を選んでください");
      return;
    }
    setError(null);
    setShot({ file, url: URL.createObjectURL(file) });
    setJustSaved(false);
    setPhase("captured");
  }

  async function save() {
    if (!shot) return;
    setError(null);
    setPhase("saving");
    const res = await onCapture(shot.file);
    if (!res.ok) {
      setError(res.error ?? "保存に失敗しました");
      setPhase("captured");
      return;
    }
    URL.revokeObjectURL(shot.url);
    setShot(null);
    setJustSaved(true);
    setPhase(streamRef.current ? "live" : "idle");
  }

  function retake() {
    if (shot) URL.revokeObjectURL(shot.url);
    setShot(null);
    setJustSaved(false);
    setPhase(streamRef.current ? "live" : "idle");
  }

  function close() {
    if (phase === "saving") return;
    stopStream();
    if (shot) URL.revokeObjectURL(shot.url);
    setShot(null);
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
          {justSaved && !error && <Feedback tone="success">保存しました。続けて撮れます。</Feedback>}

          {}
          {(phase !== "idle" || shot) && (
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
            {shot ? (
              // eslint-disable-next-line @next/next/no-img-element -- 撮ったばかりの blob（最適化の対象外）
              <img
                src={shot.url}
                alt="撮った写真"
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

          {}
          {phase === "idle" && !shot && (
            <FileUpload
              accept="image/*"
              capture="environment"
              hint="端末のカメラで撮る / 写真を選ぶ"
              onChange={pickFile}
            />
          )}
        </div>
      }
    >
      <Button variant="ghost" onClick={close} disabled={phase === "saving"}>
        閉じる
      </Button>
      {shot ? (
        <>
          <Button variant="secondary" onClick={retake} disabled={phase === "saving"}>
            撮り直す
          </Button>
          <Button onClick={() => void save()} disabled={phase === "saving"}>
            {phase === "saving" ? "保存しています…" : "保存する"}
          </Button>
        </>
      ) : phase === "idle" ? (
        <Button variant="secondary" onClick={() => void startCamera()}>
          カメラを再試行
        </Button>
      ) : (
        <Button onClick={takePhoto} disabled={phase !== "live"}>
          {phase === "starting" ? "カメラを起動しています…" : "撮る"}
        </Button>
      )}
    </Dialog>
  );
}
