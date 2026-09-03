import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  Square,
  Volume2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function VoiceInput({ onTranscript, disabled }) {
  const { t, lang } = useI18n();
  const isUr = lang === "ur";

  const [listening, setListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [liveInterim, setLiveInterim] = useState("");
  const [error, setError] = useState("");
  const [speechLang, setSpeechLang] = useState(lang === "ur" ? "ur-PK" : "en-PK");

  const isListeningRef = useRef(false);
  const recRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);

  // Check if browser has Web Speech API
  const hasSpeechRec =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Sync default speech language if app language changes while not listening
  useEffect(() => {
    if (!listening) {
      setSpeechLang(lang === "ur" ? "ur-PK" : "en-PK");
    }
  }, [lang, listening]);

  // Clean up audio context and streams
  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
    setVolume(0);
  }, []);

  // Stop listening
  const stop = useCallback(() => {
    isListeningRef.current = false;
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {}
      recRef.current = null;
    }
    cleanupAudio();
    setListening(false);
    setLiveInterim("");
  }, [cleanupAudio]);

  // Start listening with audio capture & speech recognition
  const start = useCallback(async () => {
    setError("");
    setLiveInterim("");

    // 1. Request microphone permission explicitly via getUserMedia
    let stream = null;
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;
      } catch (err) {
        console.warn("Microphone access error:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError(t("voice.denied"));
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setError(t("voice.notFound"));
        } else {
          setError(err.message || t("voice.denied"));
        }
        return;
      }
    } else {
      setError(t("voice.notSupported"));
      return;
    }

    // 2. Setup real-time audio volume visualizer
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }
        audioCtxRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVolume = () => {
          if (!isListeningRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = Math.min(100, Math.round((sum / dataArray.length) * 1.8));
          setVolume(avg);
          animFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      }
    } catch (e) {
      console.warn("Audio meter init failed:", e);
    }

    // 3. Setup Web Speech Recognition
    if (!hasSpeechRec) {
      setError(t("voice.notSupported"));
      cleanupAudio();
      return;
    }

    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = speechLang;

      rec.onresult = (e) => {
        let interimText = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          const res = e.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            if (text && text.trim()) {
              if (onTranscript) {
                onTranscript(text.trim());
              }
            }
          } else {
            interimText += text;
          }
        }
        setLiveInterim(interimText);
      };

      rec.onerror = (e) => {
        const err = e?.error;
        console.warn("Speech recognition error:", err);
        if (err === "no-speech") {
          return;
        }
        if (err === "not-allowed" || err === "service-not-allowed") {
          setError(t("voice.denied"));
          stop();
        } else if (err === "network") {
          setError(t("voice.networkError"));
          stop();
        } else {
          setError(err || "Speech error");
          stop();
        }
      };

      rec.onend = () => {
        if (isListeningRef.current && recRef.current) {
          try {
            rec.start();
            return;
          } catch {}
        }
        setListening(false);
      };

      recRef.current = rec;
      isListeningRef.current = true;
      rec.start();
      setListening(true);
    } catch (err) {
      console.warn("Speech recognition start failed:", err);
      setError(t("voice.notSupported"));
      cleanupAudio();
    }
  }, [hasSpeechRec, speechLang, onTranscript, t, cleanupAudio, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recRef.current) {
        try {
          recRef.current.abort();
        } catch {}
      }
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const isInIframe =
    typeof window !== "undefined" && window.self !== window.top;

  return (
    <div className="flex flex-col gap-2 w-full max-w-full">
      {/* Primary Voice Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Main Speak / Stop Button */}
        <Button
          type="button"
          variant={listening ? "destructive" : "outline"}
          size="sm"
          onClick={listening ? stop : start}
          disabled={disabled}
          className={`relative gap-2 transition-all shadow-sm ${
            listening
              ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
              : "border-slate-300 hover:bg-slate-100 text-slate-800"
          } ${isUr ? "font-urdu" : ""}`}
        >
          {listening ? (
            <>
              <Square className="h-4 w-4 fill-current" />
              <span>{t("voice.stop")}</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 text-primary" />
              <span>{t("voice.start")}</span>
            </>
          )}
        </Button>

        {/* Live Audio Volume Meter (VU Wave) */}
        {listening && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-medium text-emerald-800 animate-in fade-in">
            <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
            <div className="flex items-center gap-0.5 h-4">
              {[0.4, 0.7, 1.0, 0.7, 0.4].map((mult, idx) => {
                const height = Math.max(
                  4,
                  Math.min(18, Math.round(((volume * mult) / 100) * 18))
                );
                return (
                  <span
                    key={idx}
                    className="w-1 bg-emerald-500 rounded-full transition-all duration-75"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
            <span className={isUr ? "font-urdu" : ""}>
              {volume > 6 ? t("voice.micWorking") : t("voice.listening")}
            </span>
          </div>
        )}

        {/* Language Selector for Speech */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setSpeechLang("ur-PK")}
            disabled={listening}
            className={`px-2 py-1 rounded text-xs transition font-urdu ${
              speechLang === "ur-PK"
                ? "bg-white text-primary font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="اردو (پاکستان)"
          >
            اردو
          </button>
          <button
            type="button"
            onClick={() => setSpeechLang("en-PK")}
            disabled={listening}
            className={`px-2 py-1 rounded text-xs transition ${
              speechLang === "en-PK"
                ? "bg-white text-primary font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="English (Pakistan)"
          >
            English
          </button>
        </div>

        {/* Open in new tab (crucial when iframe restrictions block mic) */}
        {isInIframe && (
          <a
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline ml-auto"
            title={t("voice.openInTab")}
          >
            <ExternalLink className="h-3 w-3" />
            <span className="hidden sm:inline">{t("voice.openInTab")}</span>
          </a>
        )}
      </div>

      {/* Live Words in progress */}
      {liveInterim && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 animate-in fade-in">
          <span className="font-semibold">{t("voice.interim")}</span>
          <span className="italic truncate">{liveInterim}</span>
        </div>
      )}

      {/* Error Message & Troubleshooting */}
      {error && (
        <div className="flex flex-col gap-1 p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <p className="text-[11px] text-red-700 leading-normal pl-5">
            {isUr
              ? "براؤزر کے ایڈریس بار میں کیمرہ یا تالے (lock) کے نشان پر کلک کریں اور 'Microphone' کو Allow کریں۔ اگر پریویو فریم میں بلاک ہو تو ایپ کو نئے ٹیب میں کھولیں۔"
              : "Click the lock or camera icon in your browser address bar to set Microphone to 'Allow'. If running inside an embedded preview, open the app in a new tab."}
          </p>
          <div className="flex items-center gap-2 pl-5 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={start}
              className="h-6 text-xs bg-white"
            >
              {t("voice.retry")}
            </Button>
            {isInIframe && (
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary underline"
              >
                <ExternalLink className="h-3 w-3" />
                {t("voice.openInTab")}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
