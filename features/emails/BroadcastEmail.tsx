"use client";

import { Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useAdminMutation } from "@/lib/hooks";
import { UserPicker, type PickedUser } from "./UserPicker";

type Audience = "all" | "sellers" | "wholesale" | "retail" | "users";

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "all", label: "Everyone with an email" },
  { value: "sellers", label: "All sellers (wholesale + retail)" },
  { value: "wholesale", label: "Wholesale sellers" },
  { value: "retail", label: "Retail sellers" },
  { value: "users", label: "Selected users" },
];

type AudienceSize = {
  count: number;
  profileCount: number;
  skipped: number;
  suppressed?: number;
  emailConfigured?: boolean;
  from: string | null;
};

type BroadcastJob = {
  id: string;
  status: "running" | "done" | "failed";
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  suppressed: number;
  from: string;
  stoppedEarly?: boolean;
  stopReason?: string;
  error?: string;
};

export function BroadcastEmail() {
  const toast = useToast();
  const [audience, setAudience] = useState<Audience>("all");
  const [selectedUsers, setSelectedUsers] = useState<PickedUser[]>([]);
  const [subject, setSubject] = useState("");
  const [headline, setHeadline] = useState("");
  const [preheader, setPreheader] = useState("");
  const [message, setMessage] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [job, setJob] = useState<BroadcastJob | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState<AudienceSize | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        if (audience === "users" && selectedUsers.length === 0) {
          setPreview(null);
          setPreviewError(null);
          setPreviewLoading(false);
          return;
        }
        setPreviewLoading(true);
        setPreviewError(null);
        try {
          const data = await api<AudienceSize>("/emails/audience-size", {
            method: "POST",
            body: {
              audience,
              userIds:
                audience === "users" ? selectedUsers.map((u) => u.id) : undefined,
            },
          });
          if (!cancelled) setPreview(data);
        } catch (err) {
          if (!cancelled) {
            setPreview(null);
            setPreviewError(err instanceof Error ? err.message : "Could not count recipients");
          }
        } finally {
          if (!cancelled) setPreviewLoading(false);
        }
      })();
    }, audience === "users" ? 200 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [audience, selectedUsers]);

  // Live render of the real email HTML (same template the server sends).
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      api<{ html: string }>("/emails/preview", {
        method: "POST",
        body: {
          message: message.trim() || undefined,
          headline: headline.trim() || undefined,
          preheader: preheader.trim() || undefined,
          ctaLabel: ctaLabel.trim() || undefined,
          ctaUrl: /^https?:\/\//i.test(ctaUrl.trim()) ? ctaUrl.trim() : undefined,
        },
      })
        .then((r) => {
          if (!cancelled) setPreviewHtml(r.html);
        })
        .catch(() => {});
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [message, headline, preheader, ctaLabel, ctaUrl]);

  // Poll the background send until it finishes.
  const runningJobId = job?.status === "running" ? job.id : null;
  useEffect(() => {
    if (!runningJobId) return;
    let stopped = false;
    const timer = setInterval(() => {
      api<BroadcastJob>(`/emails/broadcast/${runningJobId}`)
        .then((j) => {
          if (stopped) return;
          setJob(j);
          if (j.status === "done") {
            toast.success(
              `Sent ${formatNumber(j.sent)} email(s)` +
                (j.failed ? ` · ${formatNumber(j.failed)} failed` : "") +
                (j.stoppedEarly ? " · stopped early" : "")
            );
          } else if (j.status === "failed") {
            toast.error(j.error ?? "Broadcast failed");
          }
        })
        .catch(() => {});
    }, 2000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [runningJobId, toast]);

  const sending = job?.status === "running";

  const send = useAdminMutation(
    () =>
      api<BroadcastJob>("/emails/broadcast", {
        method: "POST",
        body: {
          audience,
          userIds: audience === "users" ? selectedUsers.map((u) => u.id) : undefined,
          subject: subject.trim(),
          message: message.trim(),
          headline: headline.trim() || undefined,
          preheader: preheader.trim() || undefined,
          ctaLabel: ctaLabel.trim() || undefined,
          ctaUrl: ctaUrl.trim() || undefined,
        },
      }),
    {
      invalidate: ["audit"],
      success: (r) => `Sending to ${formatNumber(r.total)} recipient(s) in the background…`,
      onSuccess: (r) => {
        setJob(r);
        setConfirming(false);
        setSubject("");
        setHeadline("");
        setPreheader("");
        setMessage("");
        setCtaLabel("");
        setCtaUrl("");
        if (audience === "users") setSelectedUsers([]);
      },
    }
  );

  const recipients = preview?.count ?? 0;
  const mailReady = preview?.emailConfigured ?? false;
  const fromAddress = preview?.from ?? "marketplace@jbhinternationallimited.com";
  const usersReady = audience !== "users" || selectedUsers.length > 0;
  const ctaOk =
    (!ctaLabel.trim() && !ctaUrl.trim()) ||
    (Boolean(ctaLabel.trim()) && /^https?:\/\//i.test(ctaUrl.trim()));
  const valid = Boolean(subject.trim() && message.trim() && usersReady && ctaOk);

  return (
    <>
      <PageHeader
        title="Email broadcast"
        description="Promotional email sent via Resend as marketplace@jbhinternationallimited.com. Every email carries an unsubscribe link; people who unsubscribe are skipped automatically. Replies go to the same address in Zoho Mail."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {previewLoading && !preview ? (
          <Badge tone="gray">Checking mail setup…</Badge>
        ) : mailReady ? (
          <Badge tone="green">Resend ready · {fromAddress}</Badge>
        ) : preview ? (
          <Badge tone="red">Resend not configured (RESEND_API_KEY)</Badge>
        ) : null}
        {preview && (
          <Badge tone="gray">
            {formatNumber(preview.profileCount)} selected ·{" "}
            {formatNumber(preview.skipped)} without email
            {preview.suppressed ? ` · ${formatNumber(preview.suppressed)} unsubscribed` : ""}
          </Badge>
        )}
        {previewError && <Badge tone="red">{previewError}</Badge>}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-5 lg:gap-6">
        <Card title="Compose" className="min-w-0 lg:col-span-3">
          <div className="space-y-4">
            <Field label="Audience">
              <Select
                value={audience}
                onChange={(e) => setAudience(e.target.value as Audience)}
              >
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>

            {audience === "users" && (
              <Field
                label="Recipients"
                hint="Search by store, name, or phone. Select one or many — no need to copy user IDs."
              >
                <UserPicker selected={selectedUsers} onChange={setSelectedUsers} />
              </Field>
            )}

            <Field label="Subject" hint={`${subject.length}/200`}>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder="Update from JBH International Limited"
              />
            </Field>
            <Field label="Headline (optional)" hint="Big title at the top of the email">
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={120}
                placeholder="Wholesale Eid Sale — up to 30% off"
              />
            </Field>
            <Field label="Preview text (optional)" hint="Shown next to the subject in the inbox">
              <Input
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                maxLength={140}
                placeholder="This week only: our biggest discounts of the season"
              />
            </Field>
            <Field
              label="Message"
              hint={`${message.length}/10000 · blank line = new paragraph · "- " for bullets · **bold** · links auto-detected`}
            >
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={10_000}
                className="min-h-40"
                placeholder="Write the message users will receive in their inbox…"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Button text (optional)">
                <Input
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  maxLength={40}
                  placeholder="Shop the sale"
                />
              </Field>
              <Field
                label="Button link"
                hint={ctaUrl.trim() && !ctaOk ? "Needs button text and an https:// link" : undefined}
              >
                <Input
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://jbhinternationallimited.com/…"
                />
              </Field>
            </div>

            {job && (
              <div className="rounded-lg border border-border bg-surface-muted/50 p-3 text-sm">
                <p className="font-medium text-foreground">
                  {job.status === "running"
                    ? "Sending…"
                    : job.status === "done"
                      ? "Broadcast finished"
                      : "Broadcast failed"}
                </p>
                <p className="mt-1 text-muted">
                  {formatNumber(job.sent)} sent · {formatNumber(job.failed)} failed of{" "}
                  {formatNumber(job.total)}
                  {job.stopReason ? ` · ${job.stopReason}` : ""}
                  {job.error ? ` · ${job.error}` : ""}
                </p>
                {job.status === "running" && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded bg-border">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, ((job.sent + job.failed) / Math.max(job.total, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {audience === "users" && selectedUsers.length === 0
                  ? "Select at least one user"
                  : previewLoading
                    ? "Counting reachable emails…"
                    : `${formatNumber(recipients)} reachable email(s)`}
              </p>
              <Button
                disabled={!valid || recipients === 0 || !mailReady || previewLoading || sending}
                onClick={() => setConfirming(true)}
              >
                <Send className="size-4" /> Send email
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Email preview" className="min-w-0 lg:col-span-2">
          <p className="mb-2 truncate text-xs text-muted">
            <span className="font-medium text-foreground">{fromAddress}</span> ·{" "}
            {subject || "Email subject"}
          </p>
          <iframe
            title="Email preview"
            sandbox=""
            srcDoc={previewHtml}
            className="h-[680px] w-full rounded-xl border border-border bg-white"
          />
          {audience === "users" && selectedUsers.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              Sending to {formatNumber(selectedUsers.length)} selected user
              {selectedUsers.length === 1 ? "" : "s"}
              {preview ? ` · ${formatNumber(preview.count)} with email` : ""}.
            </p>
          )}
          <p className="mt-3 flex items-start gap-2 text-xs text-muted">
            <Mail className="mt-0.5 size-3.5 shrink-0" />
            Sent in batches in the background — you can leave this page. Keep broadcasts for
            genuine promotions and marketplace updates.
          </p>
        </Card>
      </div>

      <ConfirmModal
        open={confirming}
        title="Send email broadcast?"
        description={
          audience === "users"
            ? `This emails ${formatNumber(recipients)} reachable address(es) among ${formatNumber(selectedUsers.length)} selected user(s) from ${fromAddress}. It cannot be recalled.`
            : `This emails ${formatNumber(recipients)} recipient(s) from ${fromAddress}. It cannot be recalled.`
        }
        confirmLabel={`Send to ${formatNumber(recipients)}`}
        loading={send.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() => send.mutate(undefined)}
      />
    </>
  );
}
