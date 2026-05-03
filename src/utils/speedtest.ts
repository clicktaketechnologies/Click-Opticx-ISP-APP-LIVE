/**
 * Click Opticx Premium Speed Test Engine
 * Precision Bandwidth & Latency Diagnostics
 */

export interface SpeedTestResult {
    downloadMbps: number;
    uploadMbps: number;
    latencyMs: number;
    jitterMs: number;
    status: 'idle' | 'ping' | 'download' | 'upload' | 'complete' | 'error';
    error?: string;
}

export type ProgressCallback = (phase: string, percent: number, currentSpeed?: number) => void;

export class SpeedTestEngine {
    private backendUrl: string;
    private abortController: AbortController | null = null;

    constructor(backendUrl: string) {
        // Ensure trailing slash is removed
        this.backendUrl = backendUrl.replace(/\/$/, '');
    }

    private getTimestamp(): number {
        return performance.now();
    }

    /**
     * Measure Latency and Jitter via multiple pings
     */
    async measureLatency(onProgress?: ProgressCallback): Promise<{ latency: number; jitter: number }> {
        const samples: number[] = [];
        const iterations = 10;

        for (let i = 0; i < iterations; i++) {
            const start = this.getTimestamp();
            try {
                await fetch(`${this.backendUrl}/api/speedtest/ping?cb=${Date.now()}`, {
                    method: 'GET',
                    cache: 'no-store',
                    mode: 'cors'
                });
                const end = this.getTimestamp();
                samples.push(end - start);
                if (onProgress) onProgress('ping', Math.round(((i + 1) / iterations) * 100));
            } catch (e) {
                console.error('Ping sample failed', e);
            }
        }

        if (samples.length === 0) throw new Error("Latency measurement failed. Node unreachable.");

        const avgLatency = samples.reduce((a, b) => a + b, 0) / samples.length;
        
        // Calculate Jitter (Mean Absolute Deviation of Latency)
        let totalDeviation = 0;
        for (let i = 1; i < samples.length; i++) {
            totalDeviation += Math.abs(samples[i] - samples[i - 1]);
        }
        const jitter = totalDeviation / (samples.length - 1);

        return { latency: Math.round(avgLatency), jitter: Math.round(jitter) };
    }

    /**
     * Measure Download Speed using Parallel Streams
     */
    async measureDownload(onProgress?: ProgressCallback): Promise<number> {
        this.abortController = new AbortController();
        const parallelStreams = 4;
        const startTime = this.getTimestamp();
        let totalBytes = 0;

        const downloadStream = async () => {
            const response = await fetch(`${this.backendUrl}/api/speedtest/download?cb=${Date.now()}_${Math.random()}`, {
                signal: this.abortController?.signal,
                cache: 'no-store'
            });
            const reader = response.body?.getReader();
            if (!reader) return;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                totalBytes += value.length;

                // Update progress
                const elapsed = (this.getTimestamp() - startTime) / 1000;
                const mbps = (totalBytes * 8) / (1024 * 1024 * elapsed);
                if (onProgress) onProgress('download', Math.min(99, Math.round((totalBytes / (5 * 1024 * 1024 * parallelStreams)) * 100)), mbps);
            }
        };

        try {
            await Promise.all(Array(parallelStreams).fill(null).map(() => downloadStream()));
        } catch (e: any) {
            if (e.name === 'AbortError') return 0;
            throw e;
        }

        const finalElapsed = (this.getTimestamp() - startTime) / 1000;
        return (totalBytes * 8) / (1024 * 1024 * finalElapsed);
    }

    /**
     * Measure Upload Speed using Chunked POSTs
     */
    async measureUpload(onProgress?: ProgressCallback): Promise<number> {
        this.abortController = new AbortController();
        const chunkSize = 1 * 1024 * 1024; // 1MB chunks
        const chunks = 8; // 8MB total
        const dummyData = new Uint8Array(chunkSize);
        window.crypto.getRandomValues(dummyData);

        const startTime = this.getTimestamp();
        let uploadedBytes = 0;

        const uploadChunk = async () => {
            await fetch(`${this.backendUrl}/api/speedtest/upload`, {
                method: 'POST',
                body: dummyData,
                signal: this.abortController?.signal,
                cache: 'no-store',
                mode: 'cors'
            });
            uploadedBytes += chunkSize;
            const elapsed = (this.getTimestamp() - startTime) / 1000;
            const mbps = (uploadedBytes * 8) / (1024 * 1024 * elapsed);
            if (onProgress) onProgress('upload', Math.round((uploadedBytes / (chunkSize * chunks)) * 100), mbps);
        };

        try {
            for (let i = 0; i < chunks; i++) {
                await uploadChunk();
            }
        } catch (e: any) {
            if (e.name === 'AbortError') return 0;
            throw e;
        }

        const finalElapsed = (this.getTimestamp() - startTime) / 1000;
        return (uploadedBytes * 8) / (1024 * 1024 * finalElapsed);
    }

    abort() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }
}
