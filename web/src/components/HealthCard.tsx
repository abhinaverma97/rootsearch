"use client";

import React, { useEffect, useState } from "react";

type HealthResponse = {
    monitor_running?: boolean;
    scheduler_running?: boolean;
    analysis_interval_min?: number;
};

export default function HealthCard() {
    const [data, setData] = useState<HealthResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHealth = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/health');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message ?? String(err));
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
    }, []);

    return (
        <div className="mt-6 p-4 rounded-lg bg-gray-800 border border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-white">Backend Health</h3>
                    <p className="text-xs text-gray-400 mt-1">Shows monitor and scheduler status</p>
                </div>
                <div>
                    <button
                        onClick={fetchHealth}
                        className="text-xs bg-gray-700 px-3 py-1 rounded-md text-white hover:bg-gray-600"
                        aria-label="Refresh health"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="mt-4">
                {loading ? (
                    <div className="text-sm text-gray-300">Loading…</div>
                ) : error ? (
                    <div className="text-sm text-red-400">Error: {error}</div>
                ) : data ? (
                    <div className="text-sm text-gray-200 space-y-1">
                        <div>Monitor: <span className={`font-medium ${data.monitor_running ? 'text-green-400' : 'text-red-400'}`}>{data.monitor_running ? 'running' : 'stopped'}</span></div>
                        <div>Scheduler: <span className={`font-medium ${data.scheduler_running ? 'text-green-400' : 'text-red-400'}`}>{data.scheduler_running ? 'running' : 'stopped'}</span></div>
                        <div>Analysis interval: <span className="font-medium text-gray-300">{data.analysis_interval_min ?? '—'} min</span></div>
                    </div>
                ) : (
                    <div className="text-sm text-gray-300">No data</div>
                )}
            </div>
        </div>
    );
}
