"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const SUGGESTED_PROMPTS = [
  "Which cohort is at highest churn risk?",
  "Summarize checkout abandonment trends",
  "What products drive impulse purchases?",
];

interface AIInsightPanelProps {
  storeId: string;
}

export function AIInsightPanel({ storeId }: AIInsightPanelProps) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(prompt: string) {
    setMessage(prompt);
    setIsLoading(true);
    setReply(null);
    setError(null);

    try {
      const res = await fetch("/api/insights/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, message: prompt }),
      });
      const result = await res.json();

      if (!result.success) {
        setError(result.error ?? "Could not get insight");
        return;
      }

      setReply(result.data.reply);
      setModel(result.data.model);
    } catch {
      setError("Cannot reach the insight service.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="glow-card flex h-full flex-col rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">AI Insight Assistant</h3>
          <p className="mt-1 text-xs text-muted">
            {model ? `Powered by ${model}` : "Gemini 2.5 Flash"}
          </p>
        </div>
        <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-accent">
          Live
        </span>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-3">
        {reply && (
          <div className="rounded-lg border border-border bg-surface p-3 text-sm leading-relaxed text-muted whitespace-pre-wrap">
            {reply}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mt-auto space-y-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleAsk(prompt)}
              disabled={isLoading}
              className="block w-full rounded-lg border border-border px-3 py-2 text-left text-xs text-muted transition-colors hover:border-accent hover:text-foreground disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (message.trim()) handleAsk(message.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about trends, cohorts, churn..."
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "..." : "Ask"}
          </Button>
        </form>
      </div>
    </div>
  );
}
