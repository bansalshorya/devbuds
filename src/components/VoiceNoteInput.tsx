"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { analyzeAudio, type AudioQuality } from "@/lib/audio-quality";

const MAX_BYTES = 3 * 1024 * 1024;

export function VoiceNoteInput({ studentId, language, disabled, demo, onTranscript, onBusyChange }: {
  studentId: string; language: "English" | "Tamil"; disabled: boolean; demo: boolean;
  onTranscript: (text: string) => void; onBusyChange: (busy: boolean) => void;
}) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const previewUrl = useRef("");
  const [recording, setRecording] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [audio, setAudio] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [quality, setQuality] = useState<AudioQuality | null>(null);
  const [checking, setChecking] = useState(false);
  const [qualityUnavailable, setQualityUnavailable] = useState(false);

  useEffect(() => {
    if (!audio) return;
    let cancelled = false;
    let context: AudioContext | undefined;
    async function check() {
      try {
        context = new AudioContext({ sampleRate: 16000 });
        const decoded = await context.decodeAudioData(await audio!.arrayBuffer());
        const result = analyzeAudio(Array.from({ length: decoded.numberOfChannels }, (_, index) => decoded.getChannelData(index)), decoded.sampleRate);
        if (!cancelled) setQuality(result);
      } catch {
        if (!cancelled) setQualityUnavailable(true);
      } finally {
        if (context && context.state !== "closed") void context.close().catch(() => {});
        if (!cancelled) setChecking(false);
      }
    }
    void check();
    return () => { cancelled = true; if (context && context.state !== "closed") void context.close().catch(() => {}); };
  }, [audio]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  function selectAudio(file: File) {
    setQuality(null); setQualityUnavailable(false); setChecking(true);
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = URL.createObjectURL(file);
    setPreview(previewUrl.current);
    setAudio(file);
  }

  function stop() {
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
  }
  async function start() {
    setError(""); setNotice("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Recording is unavailable. Open over HTTPS, upload audio, or type your note."); return;
    }
    setRequesting(true); onBusyChange(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { media.getTracks().forEach((track) => track.stop()); return; }
      stream.current = media;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      const next = new MediaRecorder(media, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64000 });
      recorder.current = next;
      const chunks: Blob[] = [];
      let size = 0;
      next.ondataavailable = (event) => {
        if (event.data.size) { chunks.push(event.data); size += event.data.size; }
        if (size > MAX_BYTES) stop();
      };
      next.onerror = () => { if (mounted.current) setError("Recording failed. Retry, upload audio, or type your note."); stop(); };
      next.onstop = () => {
        media.getTracks().forEach((track) => track.stop());
        if (timer.current) clearTimeout(timer.current);
        if (!mounted.current) return;
        const type = next.mimeType || chunks[0]?.type || "audio/webm";
        const blob = new Blob(chunks, { type });
        if (blob.size && blob.size <= MAX_BYTES) {
          const ext = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : "webm";
          selectAudio(new File([blob], `conversation.${ext}`, { type }));
        } else setError("Recording was empty or exceeded 3 MB. Try a shorter clip.");
        setRecording(false); onBusyChange(false);
      };
      next.start(1000); setRecording(true);
      timer.current = setTimeout(() => { stop(); if (mounted.current) setNotice("Stopped at 90 seconds. Your recording is ready to transcribe."); }, 90000);
    } catch {
      stream.current?.getTracks().forEach((track) => track.stop());
      if (mounted.current) { setError("Microphone access was denied or unavailable. Upload audio or type your note."); onBusyChange(false); }
    } finally { if (mounted.current) setRequesting(false); }
  }
  async function transcribe() {
    if (!audio || checking) return;
    setUploading(true); onBusyChange(true); setError(""); setNotice("");
    try {
      const form = new FormData();
      form.append("audio", audio); form.append("studentId", studentId); form.append("language", language);
      const response = await fetch("/api/mentor/voice", { method: "POST", body: form, signal: AbortSignal.timeout(60000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Transcription failed");
      onTranscript(data.transcript);
      setNotice(data.demo ? "Demo sample inserted; this is not a transcription of your audio." : `Transcript ready in ${language}. Review it, then create a draft.`);
    } catch (error) {
      setError(error instanceof Error && error.name !== "TimeoutError" ? error.message : "Transcription timed out. Your recording is available to retry.");
    } finally { setUploading(false); onBusyChange(false); }
  }
  const busy = disabled || requesting || recording || uploading || checking;
  return <div className="space-y-3 rounded-xl border border-[#DCE4DD] bg-[#EEF2EF] p-4">
    <p className="text-sm font-bold">Voice note · Output: {language}</p>
    <p className="text-sm text-[#5F6962]">Record up to 90 seconds or upload audio under 3 MB. Audio is sent to the configured speech service when you transcribe; this app does not save recordings.</p>
    {demo && <p role="note" className="text-sm font-semibold text-amber-900">Demo speech mode: transcription inserts a labelled sample instead of recognizing your recording.</p>}
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={disabled || requesting || uploading || checking} onClick={recording ? stop : start} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#527A5B] px-4 text-sm font-bold text-white disabled:opacity-60">
        {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{recording ? "Stop recording" : requesting ? "Opening microphone…" : "Record note"}
      </button>
      <label className="text-sm font-semibold">Or upload audio<input type="file" accept="audio/webm,audio/mp4,audio/mpeg,audio/wav,audio/ogg,audio/flac,.m4a" disabled={busy} className="mt-1 block w-full max-w-60 text-sm file:mr-2 file:min-h-12 file:rounded-xl file:border file:bg-white file:px-3" onChange={(event) => {
        const file = event.target.files?.[0]; if (!file) return;
        if (file.size > MAX_BYTES || !file.size) { setError("Choose a nonempty audio file under 3 MB."); return; }
        setError(""); setNotice(""); selectAudio(file); event.target.value = "";
      }} /></label>
    </div>
    {recording && <p role="status" className="text-sm font-semibold text-red-800">Recording… Stop when you finish.</p>}
    {audio && <div className="space-y-3">
      <audio aria-label="Recorded voice note" controls src={preview} className="w-full" />
      <div role="status" className={`rounded-xl border p-3 text-sm ${quality?.warnings.length ? "border-amber-300 bg-amber-50 text-amber-950" : "border-[#DCE4DD] text-[#42664A]"}`}>
        {checking ? "Checking recording quality on this device…" : qualityUnavailable ? "Automatic quality checks are unavailable for this recording. Play it back to check that speech is audible before transcribing." : quality && <>
          <p className="font-bold">{Math.round(quality.duration * 10) / 10}s · {quality.warnings.length ? "Check your recording" : "No volume or clipping issues detected"}</p>
          {!!quality.warnings.length && <ul className="mt-1 list-disc space-y-1 pl-5">{quality.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
          <p className="mt-1 text-xs">Checks run locally and cannot confirm speech clarity or background noise. Listen to the preview if unsure.</p>
        </>}
      </div>
      <button type="button" disabled={busy} onClick={transcribe} className="min-h-12 rounded-xl border border-[#527A5B] bg-white px-4 text-sm font-bold text-[#42664A] disabled:opacity-60">{uploading ? "Transcribing…" : quality?.warnings.length ? "Transcribe anyway" : "Transcribe recording"}</button>
    </div>}
    {notice && <p role="status" className="text-sm text-[#42664A]">{notice}</p>}
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
  </div>;
}
