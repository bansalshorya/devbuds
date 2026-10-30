"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Upload, X, FileAudio } from "lucide-react";
import { analyzeAudio, type AudioQuality } from "@/lib/audio-quality";
import { Button } from "@/components/ui/button";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function clearAudio() {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = "";
    setPreview("");
    setAudio(null);
    setQuality(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  return (
    <div className="space-y-4 rounded-2xl border border-[#DCE4DD] bg-[#EEF2EF] p-5 shadow-xs">
      <div className="space-y-1">
        <p className="text-sm font-extrabold text-[#242924]">Voice note · Output: {language}</p>
        <p className="text-xs text-[#5F6962] font-medium">Record up to 90 seconds or upload audio under 3 MB. Audio is sent to the configured speech service when you transcribe; this app does not save recordings.</p>
      </div>

      {demo && <p role="note" className="text-xs font-semibold text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">Demo speech mode: transcription inserts a labelled sample instead of recognizing your recording.</p>}

      {/* Recording and Upload Actions in a Balanced Layout with OR Separator */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={recording ? stop : start}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#527A5B] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#42664A] disabled:opacity-50 transition-all cursor-pointer"
        >
          {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {recording ? "Stop recording" : requesting ? "Opening microphone…" : "Record note"}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5F6962] py-1 sm:py-0">
          <div className="h-px w-8 bg-[#DCE4DD] sm:hidden" />
          <span>or</span>
          <div className="h-px w-8 bg-[#DCE4DD] sm:hidden" />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/webm,audio/mp4,audio/mpeg,audio/wav,audio/ogg,audio/flac,.m4a"
          disabled={busy}
          aria-label="Upload audio file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > MAX_BYTES || !file.size) {
              setError("Choose a nonempty audio file under 3 MB.");
              return;
            }
            setError(""); setNotice(""); selectAudio(file);
          }}
        />

        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="h-12 flex-1 rounded-xl border-[#DCE4DD] bg-white px-5 font-bold text-[#527A5B] hover:bg-[#F0F5F1] shadow-xs cursor-pointer"
        >
          <Upload className="h-4 w-4 mr-2" /> Choose audio file
        </Button>
      </div>

      {recording && (
        <div role="status" className="flex items-center gap-2 text-xs font-bold text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 animate-pulse">
          <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
          Recording in progress… Stop when you finish.
        </div>
      )}

      {/* Selected File Information Area */}
      {audio && (
        <div className="space-y-3 pt-2 border-t border-[#DCE4DD] animate-fadeIn">
          <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-[#DCE4DD] shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF2EF] text-[#527A5B] shrink-0 border border-[#DCE4DD]">
                <FileAudio className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#242924] truncate">{audio.name}</p>
                <p className="text-[11px] text-[#5F6962] font-semibold">{(audio.size / 1024).toFixed(1)} KB · Ready to transcribe</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearAudio}
              disabled={busy}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5F6962] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              title="Remove selected audio"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <audio aria-label="Recorded voice note" controls src={preview} className="w-full rounded-xl" />

          <div role="status" className={`rounded-xl border p-3.5 text-xs font-medium ${quality?.warnings.length ? "border-amber-300 bg-amber-50 text-amber-950" : "border-[#DCE4DD] bg-white text-[#42664A]"}`}>
            {checking ? (
              <p className="font-bold">Checking recording quality on this device…</p>
            ) : qualityUnavailable ? (
              <p className="font-bold">Automatic quality checks are unavailable for this recording. Play it back to check that speech is audible before transcribing.</p>
            ) : quality && (
              <>
                <p className="font-extrabold">{Math.round(quality.duration * 10) / 10}s · {quality.warnings.length ? "Check your recording" : "No volume or clipping issues detected"}</p>
                {!!quality.warnings.length && <ul className="mt-1 list-disc space-y-1 pl-4">{quality.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
                <p className="mt-1 text-[11px] text-[#5F6962]">Checks run locally and cannot confirm speech clarity or background noise. Listen to the preview if unsure.</p>
              </>
            )}
          </div>

          <Button
            type="button"
            disabled={busy}
            onClick={transcribe}
            className="w-full h-12 rounded-xl bg-white border border-[#527A5B] text-[#527A5B] font-bold hover:bg-[#F0F5F1] shadow-xs cursor-pointer"
          >
            {uploading ? "Transcribing…" : quality?.warnings.length ? "Transcribe anyway" : "Transcribe recording"}
          </Button>
        </div>
      )}

      {notice && <p role="status" className="text-xs font-semibold text-[#42664A] bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">{notice}</p>}
      {error && <p role="alert" className="text-xs font-semibold text-red-800 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
    </div>
  );
}
