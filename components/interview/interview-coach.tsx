"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type InterviewCoachProps = {
  company: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  hidden?: boolean;
  status?: "ready" | "streaming";
};

const starterPrompts = [
  "Start a first-round mock interview for this company.",
  "Challenge me on EP sponsorship and salary expectations.",
  "What should I say if they ask whether I am a PR or citizen?"
];

function MicrophoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-32 w-32 scale-[2.5]">
      <rect
        x="9"
        y="3.5"
        width="6"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 11.5a5.5 5.5 0 1 0 11 0M12 17v3.5M8.5 20.5h7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WaveformIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-32 w-32 scale-[2.5]">
      <path
        d="M4 13h2l1.5-4 3 10 2.5-8 1.5 4H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InterviewCoach({ company }: InterviewCoachProps) {
  const [input, setInput] = useState(
    company
      ? `Start a first-round mock interview for ${company}.`
      : "Start a first-round mock interview for a sponsor-friendly Singapore employer."
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasVoiceSupport, setHasVoiceSupport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageIdRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const coachStatus = useMemo(() => {
    if (isRecording) {
      return {
        label: "Sarah is listening",
        tone: "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100"
      };
    }

    if (isTranscribing) {
      return {
        label: "Transcribing your answer",
        tone: "border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-100"
      };
    }

    if (isStreaming) {
      return {
        label: "Sarah is preparing feedback",
        tone: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
      };
    }

    if (isSpeaking) {
      return {
        label: "Sarah is speaking",
        tone: "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100"
      };
    }

    return {
      label: mode === "voice" ? "Voice interview ready" : "Interview coach ready",
      tone: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
    };
  }, [isRecording, isSpeaking, isStreaming, isTranscribing, mode]);

  useEffect(() => {
    setHasVoiceSupport(
      typeof window !== "undefined" &&
        "MediaRecorder" in window &&
        Boolean(navigator.mediaDevices?.getUserMedia)
    );

    return () => {
      stopRecorderStream();

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!audioUrl || !audioPlayerRef.current) {
      return;
    }

    const player = audioPlayerRef.current;
    player.load();
    player.play().catch(() => {
      setIsSpeaking(false);
      setError("Sarah's reply is ready below. Press play if autoplay is blocked.");
    });
  }, [audioUrl]);

  function stopRecorderStream() {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }

  function replaceAudioUrl(nextAudioUrl: string | null) {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }

    audioUrlRef.current = nextAudioUrl;
    setAudioUrl(nextAudioUrl);
  }

  function createMessage(
    role: Message["role"],
    content: string,
    status?: Message["status"],
    hidden?: boolean
  ) {
    messageIdRef.current += 1;

    return {
      id: `${role}-${messageIdRef.current}`,
      role,
      content,
      hidden,
      status
    };
  }

  async function speakReply(text: string) {
    try {
      const response = await fetch("/api/interview/speak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Audio playback failed.");
      }

      const audioBlob = await response.blob();
      replaceAudioUrl(URL.createObjectURL(audioBlob));
    } catch (audioError) {
      const message =
        audioError instanceof Error ? audioError.message : "Audio playback failed.";

      setIsSpeaking(false);
      setError(message);
    }
  }

  async function submitCoachTurn(
    rawInput: string,
    options?: {
      hiddenUser?: boolean;
      nextMode?: "text" | "voice";
      speakReply?: boolean;
    }
  ) {
    const trimmed = rawInput.trim();

    if (!trimmed || isStreaming || isRecording || isTranscribing) {
      return;
    }

    const nextMode = options?.nextMode || mode;
    const userMessage = createMessage("user", trimmed, "ready", options?.hiddenUser);
    const assistantMessage = createMessage("assistant", "", "streaming");
    const history = [
      ...messages
        .filter((message) => message.content.trim().length > 0)
        .map((message) => ({
          role: message.role,
          content: message.content
        })),
      {
        role: userMessage.role,
        content: userMessage.content
      }
    ];

    setError(null);
    setIsStreaming(true);
    setIsSpeaking(false);
    setMode(nextMode);
    audioPlayerRef.current?.pause();
    replaceAudioUrl(null);
    setMessages((current) => [...current, userMessage, assistantMessage]);

    if (!options?.hiddenUser) {
      setInput("");
    }

    let fullReply = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          company,
          history,
          mode: nextMode
        })
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Coach request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) {
          continue;
        }

        fullReply += chunk;

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  content: message.content + chunk
                }
              : message
          )
        );
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, status: "ready" }
            : message
        )
      );

      if (options?.speakReply && fullReply.trim()) {
        setIsSpeaking(true);
        await speakReply(fullReply);
      }
    } catch (streamError) {
      const message =
        streamError instanceof Error ? streamError.message : "Streaming failed.";

      setError(message);
      setMessages((current) =>
        current.map((entry) =>
          entry.id === assistantMessage.id
            ? {
                ...entry,
                content:
                  entry.content ||
                  "I couldn't reach Sarah. Add your OpenAI API key and try again.",
                status: "ready"
              }
            : entry
        )
      );
    } finally {
      setIsStreaming(false);
      if (!options?.speakReply) {
        setIsSpeaking(false);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitCoachTurn(input, {
      nextMode: mode,
      speakReply: mode === "voice"
    });
  }

  function applyStarter(prompt: string) {
    setInput(company ? prompt.replace("this company", company) : prompt);
  }

  function getPreferredMimeType() {
    if (typeof window === "undefined" || !("MediaRecorder" in window)) {
      return "";
    }

    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/mpeg"
    ];

    return (
      candidates.find((candidate) =>
        window.MediaRecorder.isTypeSupported?.(candidate)
      ) || ""
    );
  }

  function getAudioExtension(mimeType: string) {
    if (mimeType.includes("mp4")) {
      return "mp4";
    }

    if (mimeType.includes("mpeg")) {
      return "mp3";
    }

    return "webm";
  }

  async function transcribeAnswer(audioBlob: Blob, mimeType: string) {
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append(
        "audio",
        audioBlob,
        `sarah-interview-answer.${getAudioExtension(mimeType)}`
      );

      const response = await fetch("/api/interview/transcribe", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; transcript?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Transcription failed.");
      }

      if (!payload?.transcript) {
        throw new Error("No transcript returned.");
      }

      setLastTranscript(payload.transcript);

      await submitCoachTurn(payload.transcript, {
        nextMode: "voice",
        speakReply: true
      });
    } catch (transcriptionError) {
      const message =
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "Transcription failed.";

      setError(message);
    } finally {
      setIsTranscribing(false);
    }
  }

  async function startRecording() {
    if (!hasVoiceSupport || isStreaming || isTranscribing || isRecording) {
      return;
    }

    try {
      setError(null);
      replaceAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getPreferredMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaStreamRef.current = stream;
      recorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const nextMimeType = recorder.mimeType || mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: nextMimeType });

        recorderRef.current = null;
        stopRecorderStream();
        setIsRecording(false);

        if (!audioBlob.size) {
          setError("No audio captured. Try again.");
          return;
        }

        await transcribeAnswer(audioBlob, nextMimeType);
      };

      recorder.start();
      setIsRecording(true);
    } catch (recordingError) {
      stopRecorderStream();
      setIsRecording(false);
      setError(
        recordingError instanceof Error
          ? recordingError.message
          : "Microphone access failed."
      );
    }
  }

  function stopRecording() {
    if (!recorderRef.current || recorderRef.current.state === "inactive") {
      return;
    }

    recorderRef.current.stop();
  }

  async function startVoiceInterview() {
    await submitCoachTurn(
      company
        ? `Start a live Singapore mock interview for ${company}. Ask me one question at a time, speak as Sarah Lim, and focus on realistic hiring concerns for an international student candidate.`
        : "Start a live Singapore mock interview for an international student targeting a sponsor-friendly employer. Ask me one question at a time, speak as Sarah Lim, and focus on realistic hiring concerns.",
      {
        hiddenUser: true,
        nextMode: "voice",
        speakReply: true
      }
    );
  }

  const visibleMessages = messages.filter((message) => !message.hidden);
  const hasAssistantReply = messages.some(
    (message) => message.role === "assistant" && message.content.trim().length > 0
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="space-y-5">
        <div className={`rounded-[1.75rem] border p-5 ${coachStatus.tone}`}>
          <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em]">
            Coach status
          </p>
          <p className="mt-3 text-xl font-semibold">{coachStatus.label}</p>
          <p className="mt-2 text-sm leading-6 opacity-90">
            Sarah streams text feedback live, and in voice mode she also reads her
            reply aloud after each turn.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-amber-900 dark:text-amber-200">
            Sarah covers
          </p>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-amber-950 dark:text-amber-100">
            <li>EP sponsorship and how to frame your work authorization status without sounding defensive.</li>
            <li>Salary anchoring when pass eligibility matters but you still need commercial credibility.</li>
            <li>Hard questions about PR or citizenship, notice periods, and bond periods.</li>
            <li>Interviewer-style feedback that reflects how Singapore hiring teams actually probe risk.</li>
          </ul>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/80">
          <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Selected company
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
            {company || "Choose a role from the board"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => applyStarter(prompt)}
                className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

      </aside>

      <section className="rounded-[2rem] border border-slate-200 bg-white/85 p-4 shadow-card dark:border-slate-800 dark:bg-slate-950/80 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 rounded-[1.35rem] border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Voice interview
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950 dark:text-white">
              Sarah speaks and listens inside the chat panel
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-slate-300 p-1 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMode("text")}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  mode === "text"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => setMode("voice")}
                disabled={!hasVoiceSupport}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  mode === "voice"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-500 dark:text-slate-400"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Voice
              </button>
            </div>

            <button
              type="button"
              onClick={startVoiceInterview}
              disabled={!hasVoiceSupport || isStreaming || isRecording || isTranscribing}
              className="button-primary h-14 w-14 p-0"
              aria-label="Start Sarah voice interview"
              title="Start Sarah voice interview"
            >
              <WaveformIcon />
            </button>

            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={
                !hasVoiceSupport ||
                !hasAssistantReply ||
                isStreaming ||
                isTranscribing
              }
              className={`${isRecording ? "button-danger" : "button-primary"} h-14 w-14 p-0`}
              aria-label={isRecording ? "Stop recording" : "Record your answer"}
              title={isRecording ? "Stop recording" : "Record your answer"}
            >
              <MicrophoneIcon />
            </button>
          </div>
        </div>

        <div className="flex min-h-[26rem] flex-col gap-4 rounded-[1.5rem] bg-slate-50 p-4 dark:bg-slate-900/90">
          {visibleMessages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 bg-white/70 p-6 text-center dark:border-slate-700 dark:bg-slate-950/70">
              <div className="max-w-md">
                <p className="text-lg font-semibold text-slate-950 dark:text-white">
                  Start a mock interview with Sarah Lim
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Use text for drill practice, or launch voice mode so Sarah asks
                  questions aloud, listens to your answer, and responds like an
                  interviewer.
                </p>
              </div>
            </div>
          ) : (
            visibleMessages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[92%] rounded-[1.5rem] px-4 py-3 ${
                  message.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "mr-auto bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                } [content-visibility:auto] [contain-intrinsic-size:0_120px]`}
              >
                <p className="font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.24em] opacity-70">
                  {message.role === "user" ? "You" : "Sarah Lim"}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {message.content}
                  {message.status === "streaming" ? (
                    <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-full bg-amber-400 align-middle" />
                  ) : null}
                </p>
              </article>
            ))
          )}
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            AI-generated voice disclosure: Sarah&apos;s audio is synthesized by an
            OpenAI voice model, not a human recording.
          </p>

          {lastTranscript ? (
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <p className="font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Latest transcript
              </p>
              <p className="mt-2 leading-6">{lastTranscript}</p>
            </div>
          ) : null}

          <audio
            ref={audioPlayerRef}
            controls
            src={audioUrl ?? undefined}
            onPlay={() => setIsSpeaking(true)}
            onEnded={() => setIsSpeaking(false)}
            onPause={() => {
              if (!isStreaming) {
                setIsSpeaking(false);
              }
            }}
            className={`w-full ${audioUrl ? "block" : "hidden"}`}
          />
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="grid gap-2">
            <span className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Prompt Sarah
            </span>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={4}
              placeholder="Ask for questions, answer feedback, or how to handle Singapore hiring concerns."
              className="w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {error ? (
                <span className="text-rose-600 dark:text-rose-300">{error}</span>
              ) : (
                "In-memory only. No auth, no database, no saved transcripts."
              )}
            </p>
            <button
              type="submit"
              disabled={isStreaming || isRecording || isTranscribing}
              className="button-primary"
            >
              {isStreaming ? "Streaming..." : mode === "voice" ? "Send to Sarah" : "Send to Coach"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
