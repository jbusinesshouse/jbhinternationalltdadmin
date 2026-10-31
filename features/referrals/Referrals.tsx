"use client";

import { ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Spinner,
  StatusBadge,
} from "@/components/ui/primitives";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { api } from "@/lib/api";
import { displayName, formatDate, formatNumber, timeAgo, titleCase } from "@/lib/format";
import { PAGE_SIZE, useAdminMutation, useAdminQuery, useOverview } from "@/lib/hooks";
import type { Paged, ReferralApplication, ReferralCreator, ReviewStatus } from "@/lib/types";
import { ReviewActions, ReviewStatusTabs } from "../review/ReviewKit";

const CODE_RE = /^[A-Za-z0-9]{3,32}$/;

export function Referrals() {
  const [view, setView] = useState<"applications" | "creators">("applications");
  const overview = useOverview();
  return (
    <>
      <PageHeader
        title="Referral program"
        description="Content creators apply from the app. Approving creates their referral code, which new users enter at signup."
        actions={
          <Tabs
            value={view}
            onChange={setView}
            items={[
              {
                value: "applications",
                label: "Applications",
                count: overview.data?.pending.referralApplications,
              },
              { value: "creators", label: "Creators" },
            ]}
          />
        }
      />
      {view === "applications" ? <Applications /> : <Creators />}
    </>
  );
}

function ApplicationRow({ a }: { a: ReferralApplication }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState(a.full_name);
  const codeValid = !code || CODE_RE.test(code);

  const review = useAdminMutation(
    (vars: { decision: "approved" | "rejected"; adminNote: string }) =>
      api<{ code?: string }>(`/referral/applications/${a.id}`, {
        method: "PATCH",
        body: {
          decision: vars.decision,
          adminNote: vars.adminNote || null,
          ...(vars.decision === "approved"
            ? { code: code.trim() || undefined, name: name.trim() || undefined }
            : {}),
        },
      }),
    {
      invalidate: ["referrals"],
      success: (r, v) => (v.decision === "approved" ? `Approved · code ${r.code}` : "Application rejected"),
    }
  );

  return (
    <li className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href={`/users/${a.user_id}`} className="font-medium text-gray-900 hover:text-primary">
            {a.full_name}
          </Link>
          <span className="text-gray-500">{a.phone}</span>
          <span className="text-xs text-gray-400">· {timeAgo(a.created_at)}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <Badge tone="blue">{titleCase(a.platform)}</Badge>
          <a
            href={a.profile_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-xs items-center gap-1 truncate text-primary hover:underline"
          >
            {a.profile_url} <ExternalLink className="size-3 shrink-0" />
          </a>
          {a.follower_count && <span className="text-gray-600">{a.follower_count} followers</span>}
        </div>
        {a.message && <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{a.message}</p>}
      </div>
      <ReviewActions
        status={a.status}
        adminNote={a.admin_note}
        reviewedAt={a.reviewed_at}
        subject="creator application"
        approveDescription="Creates (or reactivates) the creator's referral code and notifies them in the app."
        rejectDescription="The applicant is notified with your reason."
        canApprove={codeValid}
        approveExtra={
          <>
            <Field label="Display name">
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </Field>
            <Field
              label="Referral code"
              hint={codeValid ? "Leave empty to auto-generate. Letters and digits, 3–32." : "Use 3–32 letters or digits"}
            >
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. RAHIM24"
              />
            </Field>
          </>
        }
        loading={review.isPending}
        onDecide={(decision, adminNote) => review.mutate({ decision, adminNote })}
      />
    </li>
  );
}

function Applications() {
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [offset, setOffset] = useState(0);
  const overview = useOverview();
  const { data, error, isPending, refetch } = useAdminQuery<
    Paged<"applications", ReferralApplication>
  >("referrals", "/referral/applications", { status, limit: PAGE_SIZE, offset });

  return (
    <Card bodyClassName="p-0">
      <div className="border-b border-gray-100 px-5 py-3">
        <ReviewStatusTabs
          value={status}
          onChange={(v) => {
            setStatus(v);
            setOffset(0);
          }}
          pendingCount={overview.data?.pending.referralApplications}
        />
      </div>
      {isPending ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data.applications.length ? (
        <EmptyState title={status === "pending" ? "No applications waiting" : "No applications"} />
      ) : (
        <ul className="divide-y divide-gray-100">
          {data.applications.map((a) => (
            <ApplicationRow key={a.id} a={a} />
          ))}
        </ul>
      )}
      {data && <Pagination offset={offset} limit={PAGE_SIZE} total={data.total} onChange={setOffset} />}
    </Card>
  );
}

function Creators() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, error, isPending, refetch } = useAdminQuery<{ creators: ReferralCreator[] }>(
    "referrals",
    "/referral/creators"
  );
  const toggle = useAdminMutation(
    (vars: { id: string; active: boolean }) =>
      api(`/referral/creators/${vars.id}`, { method: "PATCH", body: { active: vars.active } }),
    { invalidate: ["referrals"], success: (_r, v) => (v.active ? "Code reactivated" : "Code paused") }
  );

  return (
    <Card
      title="Creators"
      description="Signups count profiles that joined with the creator's code."
      bodyClassName="p-0"
      actions={
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" /> New creator
        </Button>
      }
    >
      {isPending ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data.creators.length ? (
        <EmptyState title="No referral creators yet" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Creator</Th>
              <Th>Code</Th>
              <Th>Linked user</Th>
              <Th>Signups</Th>
              <Th>Seller signups</Th>
              <Th>Status</Th>
              <Th>Since</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {[...data.creators]
              .sort((a, b) => b.signups - a.signups)
              .map((c) => (
                <Tr key={c.id}>
                  <Td className="font-medium text-gray-900">{c.name}</Td>
                  <Td>
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold">{c.code}</code>
                  </Td>
                  <Td>
                    {c.user_id ? (
                      <Link href={`/users/${c.user_id}`} className="hover:text-primary">
                        {displayName(c.owner)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className="font-semibold">{formatNumber(c.signups)}</Td>
                  <Td>{formatNumber(c.sellerSignups)}</Td>
                  <Td>
                    <StatusBadge status={c.active ? "active" : "inactive"} />
                  </Td>
                  <Td className="text-xs text-gray-500">{formatDate(c.created_at)}</Td>
                  <Td className="text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={toggle.isPending && toggle.variables?.id === c.id}
                      onClick={() => toggle.mutate({ id: c.id, active: !c.active })}
                    >
                      {c.active ? "Pause" : "Activate"}
                    </Button>
                  </Td>
                </Tr>
              ))}
          </tbody>
        </Table>
      )}
      <CreateCreatorModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </Card>
  );
}

function CreateCreatorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [userId, setUserId] = useState("");
  const create = useAdminMutation(
    () =>
      api("/referral/creators", {
        method: "POST",
        body: { name: name.trim(), code: code.trim(), userId: userId.trim() || null },
      }),
    {
      invalidate: ["referrals"],
      success: "Creator created",
      onSuccess: () => {
        setName("");
        setCode("");
        setUserId("");
        onClose();
      },
    }
  );

  return (
    <Modal
      open={open}
      title="New referral creator"
      description="For partners who did not apply in the app. Linking a user lets them see their dashboard."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={create.isPending}
            disabled={!name.trim() || !CODE_RE.test(code)}
            onClick={() => create.mutate(undefined)}
          >
            Create
          </Button>
        </>
      }
    >
      <Field label="Display name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Code" hint="3–32 letters or digits">
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </Field>
      <Field label="Linked user ID (optional)" hint="Copy from the user's detail page">
        <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="UUID" />
      </Field>
    </Modal>
  );
}
