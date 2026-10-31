"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { CampaignsPanel } from "./CampaignsPanel";
import { ComposeCampaign } from "./ComposeCampaign";

type Tab = "bulk" | "compose" | "quick";

export function BroadcastEmail() {
  const [tab, setTab] = useState<Tab>("bulk");
  const [bulkId, setBulkId] = useState<string | null>(null);
  const [quickId, setQuickId] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        title="Email"
        description="Email sent via Resend. Bulk campaigns save their recipients and send in daily batches under the Resend limit, so you always see who was emailed and who is left. Quick email sends a one-off message to a few selected users immediately. Every email has an unsubscribe link; people who unsubscribe are skipped."
      />

      <div className="mb-4">
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          items={[
            { value: "bulk", label: "Bulk campaigns" },
            { value: "compose", label: "New bulk campaign" },
            { value: "quick", label: "Quick email" },
          ]}
        />
      </div>

      {tab === "bulk" && (
        <CampaignsPanel kind="bulk" selectedId={bulkId} onSelect={setBulkId} />
      )}
      {tab === "compose" && (
        <ComposeCampaign
          mode="bulk"
          onCreated={(id) => {
            setBulkId(id);
            setTab("bulk");
          }}
        />
      )}
      {tab === "quick" && (
        <div className="space-y-6">
          <ComposeCampaign mode="quick" onCreated={setQuickId} />
          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Recent quick emails</h2>
            <CampaignsPanel kind="quick" selectedId={quickId} onSelect={setQuickId} />
          </div>
        </div>
      )}
    </>
  );
}
