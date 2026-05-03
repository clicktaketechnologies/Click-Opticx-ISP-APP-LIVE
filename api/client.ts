/**
 * Enterprise BSS/OSS API Client
 * Centralized interface for Network, Billing, and RADIUS operations.
 */

import { db } from '../db';

const API_BASE = (db as any).backendUrl || 'https://click-opticx-isp-app-live.onrender.com';

export const enterpriseApi = {
    // 1. Network & Device Plane
    async testDevice(host: string, protocol: 'SNMP' | 'SSH' | 'MIKROTIK', credentials: any) {
        const response = await fetch(`${API_BASE}/api/devices/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host, protocol, credentials })
        });
        return response.json();
    },

    async pollDevice(id: string) {
        const response = await fetch(`${API_BASE}/api/devices/poll/${id}`);
        return response.json();
    },

    // 2. Billing & Financial Ledger
    async getLedger() {
        const response = await fetch(`${API_BASE}/api/billing/ledger`);
        return response.json();
    },

    async postLedgerEntry(entry: {
        debit_account: string;
        credit_account: string;
        amount: number;
        description: string;
        reference_type?: string;
        reference_id?: string;
    }) {
        const response = await fetch(`${API_BASE}/api/billing/ledger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
        return response.json();
    },

    // 3. RADIUS Control
    async sendRadiusCoa(username: string, action: 'disconnect' | 'coa', attributes: string) {
        const response = await fetch(`${API_BASE}/api/radius/coa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, action, attributes })
        });
        return response.json();
    }
};
