"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot,
  User,
  Send,
  Loader2,
  Calendar,
  MapPin,
  Building2,
  Sparkles,
  HelpCircle
} from "lucide-react";

interface SearchResultEvent {
  id: string;
  title: string;
  type: "HOSTED" | "ATTENDED" | "BUSY";
  startAt: string;
  endAt: string;
  location?: string | null;
  department?: string | null;
  score?: number;
  matchReasons?: string[];
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  results?: SearchResultEvent[];
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "events I hosted last month",
  "that AI workshop last spring",
  "busy days this semester",
  "conferences attended in 2026",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your FacultyPulse AI Assistant. Ask me anything about your past or upcoming academic events, workshops, or busy slots in natural language.",
      suggestions: DEFAULT_SUGGESTIONS,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "assistant",
            text: data.error?.message || "Sorry, I encountered an issue searching your events.",
          },
        ]);
        return;
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: data.message || "Here are the search results from your records:",
        results: data.results || [],
        suggestions: data.suggestions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: "Network error occurred while contacting AI Assistant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-blue-600" />
          <span>AI Search Assistant</span>
        </h1>
        <p className="text-slate-500">
          Find your past workshops, conferences, and scheduled commitments using conversational queries
        </p>
      </div>

      {/* Chat Container */}
      <Card className="border-slate-200 shadow-sm flex flex-col h-[650px]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm mt-1">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] space-y-3 ${
                  msg.sender === "user"
                    ? "rounded-2xl rounded-tr-sm bg-blue-600 p-4 text-white shadow-sm"
                    : "rounded-2xl rounded-tl-sm bg-slate-100 p-4 text-slate-900 border border-slate-200"
                }`}
              >
                {/* Surface the message string as the AI's response */}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                {/* Map the returned results array to event cards */}
                {msg.results && msg.results.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    {msg.results.map((ev) => {
                      const startDate = new Date(ev.startAt);
                      const typeBadge =
                        ev.type === "HOSTED"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : ev.type === "ATTENDED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-amber-100 text-amber-800 border-amber-200";

                      return (
                        <div
                          key={ev.id}
                          className="rounded-lg border border-slate-200 bg-white p-3 text-slate-900 shadow-xs hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm text-slate-900">{ev.title}</h4>
                            <span
                              className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold border ${typeBadge}`}
                            >
                              {ev.type}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(startDate, "MMM d, yyyy h:mm a")}
                            </span>
                            {ev.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {ev.location}
                              </span>
                            )}
                            {ev.department && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {ev.department}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Suggested Queries */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5" /> Try asking:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(suggestion)}
                          className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white shadow-sm mt-1">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm text-slate-600 border border-slate-200">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span>Searching your records...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="e.g. Find all events I attended in the seminar hall..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()} className="gap-2 shrink-0">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
