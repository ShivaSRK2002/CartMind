"use client";

import { useCallback, useEffect, useState } from "react";
import type { EcommerceStore, StoreDashboard } from "cartmind-shared-types";
import { StoreSelector } from "@/components/StoreSelector";
import { KpiGrid } from "@/components/KpiGrid";
import { RevenueChart } from "@/components/RevenueChart";
import { EventBreakdown } from "@/components/EventBreakdown";
import { SegmentationPanel } from "@/components/SegmentationPanel";
import { AIInsightPanel } from "@/components/AIInsightPanel";
import { MlScoresPanel } from "@/components/MlScoresPanel";
import { EngagementPanel } from "@/components/EngagementPanel";
import { CustomerTable } from "@/components/CustomerTable";
import { LogoutButton } from "@/components/LogoutButton";

interface DashboardViewProps {
  adminName: string;
}

export function DashboardView({ adminName }: DashboardViewProps) {
  const [stores, setStores] = useState<EcommerceStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("velora");
  const [dashboard, setDashboard] = useState<StoreDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStores = useCallback(async () => {
    const res = await fetch("/api/stores");
    const result = await res.json();
    if (result.success) {
      setStores(result.data.stores);
    }
  }, []);

  const loadDashboard = useCallback(async (storeId: string) => {
    setIsLoading(true);
    setError(null);
    const res = await fetch(`/api/dashboard/${storeId}`);
    const result = await res.json();
    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? "Failed to load dashboard");
      setDashboard(null);
      return;
    }

    setDashboard(result.data);
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    loadDashboard(selectedStoreId);
  }, [selectedStoreId, loadDashboard]);

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xl font-semibold tracking-tight">
              Orbit<span className="text-accent">.</span>
            </p>
            <p className="text-xs text-muted">Welcome, {adminName}</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedStore?.status === "live" && (
              <a
                href={selectedStore.storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline"
              >
                Open {selectedStore.name} →
              </a>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section>
          <h2 className="text-lg font-medium">Storefronts</h2>
          <p className="mt-1 text-sm text-muted">
            Switch between live and demo e-commerce properties
          </p>
          <div className="mt-4">
            {stores.length > 0 ? (
              <StoreSelector
                stores={stores}
                selectedId={selectedStoreId}
                onSelect={setSelectedStoreId}
              />
            ) : (
              <p className="text-sm text-muted">Loading stores...</p>
            )}
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {isLoading && !dashboard ? (
          <p className="text-sm text-muted">Loading analytics...</p>
        ) : dashboard ? (
          <>
            <KpiGrid kpis={dashboard.kpis} />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <RevenueChart data={dashboard.revenueTrend} accentColor={dashboard.store.accentColor} />
                {dashboard.ml && <MlScoresPanel ml={dashboard.ml} />}
                <SegmentationPanel cohorts={dashboard.cohorts} />
                {dashboard.engagement && <EngagementPanel engagement={dashboard.engagement} />}
                <CustomerTable customers={dashboard.customers} />
              </div>
              <div className="space-y-6">
                <EventBreakdown events={dashboard.events} />
                <AIInsightPanel storeId={selectedStoreId} />
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
