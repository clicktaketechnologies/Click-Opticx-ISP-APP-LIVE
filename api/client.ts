/**
 * Enterprise BSS/OSS API Client
 * Centralized interface for Network, Billing, and RADIUS operations.
 */

import { db } from '../db';

const API_BASE = (db as any).backendUrl || 'https://click-opticx-isp-app-live.onrender.com';

/**
 * FIX: these enterprise endpoints sit behind the backend's `protect`
 * middleware — requests previously went out with NO Authorization header and
 * always answered 401 in production. The token persisted by db.login is now
 * attached automatically.
 */
function authHeaders(): Record<string, string> {
    try {
        const token = localStorage.getItem('clickopticx_auth_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    } catch {
        return {};
    }
}

async function request(path: string, init: RequestInit = {}): Promise<any> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
            ...(init.headers || {})
        }
    });
    return res.json();
}

export const enterpriseApi = {
    // 1. Network & Device Plane
    async testDevice(host: string, protocol: 'SNMP' | 'SSH' | 'MIKROTIK', credentials: any) {
        return request('/api/devices/test', {
            method: 'POST',
            body: JSON.stringify({ host, protocol, credentials })
        });
    },

    async pollDevice(id: string) {
        return request(`/api/devices/poll/${id}`);
    },

    // 2. Billing & Financial Ledger
    async getLedger() {
        return request('/api/billing/ledger');
    },

    async postLedgerEntry(entry: {
        debit_account: string;
        credit_account: string;
        amount: number;
        description: string;
        reference_type?: string;
        reference_id?: string;
    }) {
        return request('/api/billing/ledger', {
            method: 'POST',
            body: JSON.stringify(entry)
        });
    },

    // 3. RADIUS Control
    async sendRadiusCoa(username: string, action: 'disconnect' | 'coa', attributes: string) {
        return request('/api/radius/coa', {
            method: 'POST',
            body: JSON.stringify({ username, action, attributes })
        });
    }
};
