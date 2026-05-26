"use client";

import { useState, useRef, useEffect, FormEvent, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./ChatView.module.css";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  toolsUsed?: string[];
  error?: boolean;
}

const EXAMPLE_PROMPTS = [
  "How many active buyers do we have in Germany this month?",
  "Show me the RFQ funnel KPIs for the last 6 months",
  "What are the top 10 supplier categories by UV this week?",
  "Create a Redash dashboard comparing AB vs AB2 by platform",
];

let idCounter = 0;
function nextId() {
  return `msg-${++idCounter}-${Date.now()}`;
}

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Persist agentId in sessionStorage for the current tab
  useEffect(() => {
    const saved = sessionStorage.getItem("agentId");
    if (saved) setAgentId(saved);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = { id: nextId(), role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      setActiveTool(null);

      const assistantId = nextId();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), agentId }),
          signal: abort.signal,
        });

        if (!res.ok || !res.body) {
          const err = await res.text();
          throw new Error(err || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const tools: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6)) as {
                type: string;
                text?: string;
                agentId?: string;
                toolName?: string;
                message?: string;
                status?: string;
              };

              if (event.type === "agent_id" && event.agentId) {
                setAgentId(event.agentId);
                sessionStorage.setItem("agentId", event.agentId);
              } else if (event.type === "text" && event.text) {
                setActiveTool(null);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: m.content + event.text! } : m
                  )
                );
              } else if (event.type === "tool_use" && event.toolName) {
                tools.push(event.toolName);
                setActiveTool(event.toolName);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, toolsUsed: [...tools] } : m
                  )
                );
              } else if (event.type === "error") {
                throw new Error(event.message ?? "Agent error");
              }
            } catch {
              // skip unparseable lines
            }
          }
        }
      } catch (err: unknown) {
        if ((err as { name?: string }).name === "AbortError") return;
        const errorText = err instanceof Error ? err.message : String(err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: errorText, error: true }
              : m
          )
        );
      } finally {
        setActiveTool(null);
        setLoading(false);
      }
    },
    [agentId, loading]
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setLoading(false);
    setActiveTool(null);
  }

  function handleNewChat() {
    setMessages([]);
    setAgentId(null);
    sessionStorage.removeItem("agentId");
  }

  const isEmpty = messages.length === 0;

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logoIcon}>✦</span>
          <span className={styles.logoText}>Data Agent</span>
        </div>
        <button onClick={handleNewChat} className={styles.newChatBtn}>
          <span>+</span> New chat
        </button>
        <div className={styles.sidebarFooter}>
          <p className={styles.sidebarNote}>Powered by Cursor SDK + dbt + Redash</p>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {isEmpty ? (
          <div className={styles.welcome}>
            <div className={styles.welcomeIcon}>✦</div>
            <h1 className={styles.welcomeTitle}>Data Analysis Agent</h1>
            <p className={styles.welcomeSubtitle}>
              Ask questions in plain English. The agent queries your dbt marts and can create Redash dashboards automatically.
            </p>
            <div className={styles.exampleGrid}>
              {EXAMPLE_PROMPTS.map((p) => (
                <button key={p} className={styles.exampleBtn} onClick={() => send(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.messages}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} activeTool={activeTool} />
            ))}
            {loading && activeTool && (
              <div className={styles.toolBadge}>
                <span className={styles.spinner} />
                Calling <code>{activeTool}</code>…
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        <div className={styles.inputArea}>
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a data question…"
              className={styles.textarea}
              rows={1}
              disabled={loading}
            />
            <div className={styles.inputActions}>
              {loading ? (
                <button type="button" onClick={handleStop} className={styles.stopBtn}>
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={styles.sendBtn}
                  aria-label="Send"
                >
                  <SendIcon />
                </button>
              )}
            </div>
          </form>
          <p className={styles.disclaimer}>
            Queries run against production dbt models. Double-check before sharing externally.
          </p>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ message, activeTool }: { message: Message; activeTool: string | null }) {
  const isUser = message.role === "user";
  const isStreaming = !isUser && !message.content && activeTool;

  return (
    <div className={`${styles.messageRow} ${isUser ? styles.userRow : styles.assistantRow}`}>
      {!isUser && (
        <div className={styles.avatar}>✦</div>
      )}
      <div
        className={`${styles.bubble} ${isUser ? styles.userBubble : styles.assistantBubble} ${message.error ? styles.errorBubble : ""}`}
      >
        {message.toolsUsed && message.toolsUsed.length > 0 && (
          <div className={styles.toolsList}>
            {message.toolsUsed.map((t, i) => (
              <span key={i} className={styles.toolTag}>{t}</span>
            ))}
          </div>
        )}
        {isStreaming ? (
          <span className={styles.cursor}>▋</span>
        ) : isUser ? (
          <span className={styles.userText}>{message.content}</span>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose">
            {message.content || "▋"}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8L2 2l3 6-3 6 12-6z" fill="currentColor" />
    </svg>
  );
}
