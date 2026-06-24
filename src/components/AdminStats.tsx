"use client";

import { useState, useEffect } from "react";
import { getSiteStats } from "@/lib/backend";
import { BarChart3, Users, Database, RefreshCw, ArrowLeft, Activity, Coins, HardDrive } from "lucide-react";

interface Stats {
  totalUsers?: number;
  storageKeys?: string[];
  error?: string;
}

export default function AdminStats({ onBack }: { onBack: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const data = await getSiteStats();
    setStats(data);
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-card-border">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <Activity className="w-5 h-5 text-foreground" />
        <h1 className="text-lg font-semibold">Site Dashboard</h1>
        <button onClick={fetchStats} className="ml-auto p-1.5 rounded-lg hover:bg-hover-bg text-muted transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted text-sm">Loading stats...</div>
        ) : stats?.error ? (
          <div className="text-center text-muted text-sm py-20">
            <HardDrive className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Unable to fetch stats</p>
            <p className="text-xs mt-1">Data is stored locally in your browser</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-input-border rounded-xl p-5">
                <div className="flex items-center gap-2 text-muted text-sm mb-1">
                  <Users className="w-4 h-4" />
                  Registered Users
                </div>
                <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
              </div>
              <div className="bg-card border border-input-border rounded-xl p-5">
                <div className="flex items-center gap-2 text-muted text-sm mb-1">
                  <Database className="w-4 h-4" />
                  Storage Keys
                </div>
                <div className="text-3xl font-bold">{stats?.storageKeys?.length || 0}</div>
              </div>
            </div>

            <div className="bg-card border border-input-border rounded-xl p-5">
              <div className="flex items-center gap-2 text-muted text-sm mb-3">
                <BarChart3 className="w-4 h-4" />
                Storage Details
              </div>
              {stats?.storageKeys && stats.storageKeys.length > 0 ? (
                <div className="space-y-1.5">
                  {stats.storageKeys.map((key) => (
                    <div key={key} className="flex items-center gap-2 text-xs text-foreground/70 bg-input-bg rounded-md px-3 py-1.5">
                      <Coins className="w-3 h-3 text-muted" />
                      <span className="font-mono">{key}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">No stored data yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}