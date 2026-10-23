 "use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type Mode = "short" | "long" | "complete";
type Message = { role: "user" | "assistant"; text: string };
type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResult = { 0: SpeechRecognitionAlternative; isFinal: boolean };
type SpeechRecognitionEvent = { resultIndex: number; results: ArrayLike<SpeechRecognitionResult> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const modeInfo: Record<Mode, { title: string; detail: string }> = {
  short: { title: "Short hints", detail: "One concise clue. No final answer." },
  long: { title: "Long hints", detail: "Guided steps and missing concepts, without giving away the solution." },
  complete: { title: "Complete answer", detail: "The only mode that may reveal the full solution." }
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("short");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function toggleVoice() {
    setNotice("");
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) {
      setNotice("Voice typing is not supported in this browser. Try the latest Chrome or Edge, or type your question.");
      return;
    }
    const recognition = new Speech();
    const startingText = input.trim();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      // Rebuild from the complete recognition result list to avoid duplicating
      // interim speech segments as the browser revises its transcript.
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const spoken = transcript.trim();
      setInput(spoken ? [startingText, spoken].filter(Boolean).join(" ") : startingText);
    };
    recognition.onerror = () => {
      setListening(false);
      setNotice("Voice input stopped. You can try again or type your question.");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setNotice("Could not start voice input. Check your browser microphone permission.");
    }
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    const nextMessages: Message[] = [...messages, { role: "user", text: question }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, mode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The tutor is temporarily unavailable.");
      setMessages([...nextMessages, { role: "assistant", text: data.answer }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setNotice(message);
      // Keep the user's question visible; they can retry by sending it again.
    } finally {
      setBusy(false);
    }
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Nudge home">
          <span className="brand-mark">n</span><span>nudge<span className="brand-dot">.</span></span>
        </a>
        <div className="topbar-note"><span className="status-dot" /> Free study space <span className="topbar-divider">·</span> No account needed</div>
      </header>

      <section className="workspace">
        <div className="intro">
          <div className="eyebrow"><span className="sparkle">✳</span> YOUR PERSONAL STUDY PARTNER</div>
          <h1>Learn it by <span>figuring it out.</span></h1>
          <p>Ask anything. Get a nudge in the right direction, not just the answer.</p>
        </div>

        <section className="chat-card" aria-label="Study chat">
          <div className="chat-head">
            <div className="tutor-avatar">✳</div>
            <div className="tutor-title"><strong>Your study buddy</strong><span>Curious minds welcome</span></div>
            <button className="new-chat" type="button" onClick={() => { setMessages([]); setInput(""); setNotice(""); }} title="Clear this temporary chat">
              <span aria-hidden="true">↻</span> New chat
            </button>
          </div>

          <div className={`conversation ${messages.length ? "has-messages" : ""}`} ref={scrollRef} aria-live="polite">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-illustration" aria-hidden="true">
                  <div className="orbit orbit-one" /><div className="orbit orbit-two" />
                  <div className="bulb">✦</div><span className="float-dot dot-one" /><span className="float-dot dot-two" /><span className="float-dot dot-three" />
                </div>
                <h2>What are you curious about?</h2>
                <p>Start with a question, a tricky concept, or a problem you’re working through.</p>
                <div className="suggestions">
                  {[
                    ["Mathematics", "Why does dividing by a fraction make a number bigger?"],
                    ["Science", "What actually causes the seasons?"],
                    ["Programming", "Can you help me understand recursion?"]
                  ].map(([label, question]) => (
                    <button key={label} className="suggestion" type="button" onClick={() => setInput(question)}>
                      <span>{label}</span><span className="suggestion-arrow">↗</span><small>{question}</small>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="message-list">
                {messages.map((message, index) => (
                  <div className={`message-row ${message.role}`} key={`${index}-${message.role}`}>
                    {message.role === "assistant" && <div className="message-avatar">✳</div>}
                    <div className={`bubble ${message.role}`}>
                      {message.role === "assistant" && <span className="answer-label">{mode === "complete" ? "COMPLETE ANSWER" : mode === "long" ? "LONG HINT" : "SHORT HINT"}</span>}
                      <p>{message.text}</p>
                    </div>
                  </div>
                ))}
                {busy && <div className="message-row assistant"><div className="message-avatar">✳</div><div className="bubble assistant typing"><span /><span /><span /></div></div>}
              </div>
            )}
          </div>

          <div className="composer-wrap">
            <div className="mode-header"><span>HOW MUCH HELP DO YOU WANT?</span><span className="mode-tip">Change anytime</span></div>
            <div className="mode-options" role="group" aria-label="Answer style">
              {(["short", "long", "complete"] as Mode[]).map((option) => (
                <button key={option} type="button" className={`mode-option ${mode === option ? "selected" : ""} ${option === "complete" ? "complete-mode" : ""}`} onClick={() => setMode(option)} aria-pressed={mode === option}>
                  <span className="mode-icon">{option === "short" ? "↗" : option === "long" ? "☷" : "✓"}</span>
                  <span className="mode-copy"><strong>{modeInfo[option].title}</strong><small>{modeInfo[option].detail}</small></span>
                  <span className="radio-dot" />
                </button>
              ))}
            </div>

            <form className="input-box" onSubmit={sendMessage}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Ask your question here…"
                aria-label="Your question"
                rows={2}
                maxLength={6000}
                disabled={busy}
              />
              <div className="input-tools">
                <div className="input-hint"><span>↵</span> to send <span className="hint-separator">·</span> Shift + ↵ for a new line</div>
                <div className="input-actions">
                  <button className={`voice-button ${listening ? "listening" : ""}`} type="button" onClick={toggleVoice} aria-label={listening ? "Stop voice typing" : "Start voice typing"} title={listening ? "Stop voice typing" : "Voice type"}>
                    {listening ? <><span className="mic-pulse" /> Stop</> : <><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8" /></svg> Voice type</>}
                  </button>
                  <button className="send-button" type="submit" disabled={!input.trim() || busy} aria-label="Send question">{busy ? <span className="spinner" /> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-7 7 7-7 7 7" /></svg>}</button>
                </div>
              </div>
            </form>
            {notice && <div className="notice" role="status">{notice}</div>}
            <div className="privacy-note"><span>♧</span> Temporary by design. Refresh or close this tab and your chat disappears.</div>
          </div>
        </section>
        <footer className="footer"><span>Made for curious minds.</span><span>AI can make mistakes — use hints to build your own understanding.</span></footer>
      </section>
    </main>
  );
}
