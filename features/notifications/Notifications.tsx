"use client";

import { Bell, Send } from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useAdminMutation, useAdminQuery } from "@/lib/hooks";

type Audience = "all" | "sellers" | "wholesale" | "retail" | "user";

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "sellers", label: "All sellers (wholesale + retail)" },
  { value: "wholesale", label: "Wholesale sellers" },
  { value: "retail", label: "Retail sellers" },
  { value: "user", label: "One user (by ID)" },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function Notifications() {
  const [audience, setAudience] = useState<Audience>("all");
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);

  const size = useAdminQuery<{ count: number }>(
    "audience",
    "/notifications/audience-size",
    { audience },
    { enabled: audience !== "user" }
  );

  const send = useAdminMutation(
    () =>
      api<{ recipients: number }>("/notifications", {
        method: "POST",
        body: {
          audience,
          userId: audience === "user" ? userId.trim() : undefined,
          title: title.trim(),
          message: message.trim(),
        },
      }),
    {
      invalidate: ["audit"],
      success: (r) => `Sent to ${formatNumber(r.recipients)} user(s)`,
      onSuccess: () => {
        setTitle("");
        setMessage("");
        setConfirming(false);
      },
    }
  );

  const recipients = audience === "user" ? 1 : size.data?.count ?? 0;
  const valid =
    title.trim() && message.trim() && (audience !== "user" || UUID_RE.test(userId.trim()));

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Send announcements to app users. Each message lands in their notification inbox and as a push notification on devices with push enabled."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Compose" className="lg:col-span-3">
          <div className="space-y-4">
            <Field label="Audience">
              <Select value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>
            {audience === "user" && (
              <Field label="User ID" hint="Copy it from the user's detail page.">
                <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="UUID" />
              </Field>
            )}
            <Field label="Title" hint={`${title.length}/120`}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </Field>
            <Field label="Message" hint={`${message.length}/1000`}>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                className="min-h-32"
              />
            </Field>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {audience === "user"
                  ? "1 recipient"
                  : size.isPending
                    ? "Counting recipients…"
                    : `${formatNumber(recipients)} recipient(s)`}
              </p>
              <Button disabled={!valid || recipients === 0} onClick={() => setConfirming(true)}>
                <Send className="size-4" /> Send
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Preview" className="lg:col-span-2">
          <div className="rounded-[var(--radius-lg)] bg-ink p-4">
            <div className="rounded-[var(--radius)] bg-surface p-3 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <span className="flex size-4 items-center justify-center rounded bg-primary text-[9px] font-bold text-white">
                  J
                </span>
                J Business House · now
              </div>
              <p className="mt-1.5 text-sm font-semibold text-foreground">
                {title || "Notification title"}
              </p>
              <p className="mt-0.5 line-clamp-4 whitespace-pre-line text-xs text-muted">
                {message || "Your message appears here."}
              </p>
            </div>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted">
            <Bell className="mt-0.5 size-3.5 shrink-0" />
            Most users read Bangla. Keep titles short; push previews cut long text.
          </p>
        </Card>
      </div>

      <ConfirmModal
        open={confirming}
        title="Send notification?"
        description={`This goes to ${formatNumber(recipients)} user(s) immediately and cannot be recalled.`}
        confirmLabel={`Send to ${formatNumber(recipients)}`}
        loading={send.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() => send.mutate(undefined)}
      />
    </>
  );
}
