-- ============================================================
-- Click Opticx ISP — OLT/ONT Infrastructure Schema
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── OLT (Optical Line Terminal) Devices ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS network_hardware (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    ip          INET NOT NULL UNIQUE,
    brand       TEXT NOT NULL CHECK (brand IN ('Huawei', 'ZTE', 'VSOL', 'BDCOM', 'Nokia', 'Cisco')),
    model       TEXT NOT NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('SSH', 'SNMP', 'TR-069')),
    port        INTEGER NOT NULL DEFAULT 22,
    username    TEXT NOT NULL,
    password    TEXT NOT NULL, -- Should be encrypted in production
    location    TEXT,
    pon_ports   INTEGER NOT NULL DEFAULT 8,
    status      TEXT DEFAULT 'Not Configured' CHECK (status IN ('Not Configured', 'Pending', 'Online', 'Offline', 'Degraded')),
    connection_status TEXT DEFAULT 'Not Configured' CHECK (connection_status IN ('Not Configured', 'Pending', 'Connected', 'Failed')),
    last_error  TEXT,
    last_check  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    raw_data    JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_network_hardware_ip ON network_hardware(ip);
CREATE INDEX IF NOT EXISTS idx_network_hardware_status ON network_hardware(status);
CREATE INDEX IF NOT EXISTS idx_network_hardware_brand ON network_hardware(brand);

-- ─── ONT (Optical Network Terminal) Devices ─────────────────────────────────
CREATE TABLE IF NOT EXISTS ont_devices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number   TEXT NOT NULL UNIQUE,
    olt_id          UUID REFERENCES network_hardware(id) ON DELETE CASCADE,
    pon_port        TEXT NOT NULL, -- Format: "0/1/1" or similar
    subscriber_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    status          TEXT DEFAULT 'Offline' CHECK (status IN ('Offline', 'Online', 'Warning', 'LOS', 'Degraded', 'Unconfigured')),
    signal_strength REAL, -- dBm value
    optical_power   REAL,
    online_time     INTERVAL,
    last_active     TIMESTAMPTZ,
    model           TEXT,
    alias           TEXT,
    raw_data        JSONB DEFAULT '{}',
    CONSTRAINT unique_olt_port UNIQUE (olt_id, pon_port)
);

CREATE INDEX IF NOT EXISTS idx_ont_devices_serial ON ont_devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_ont_devices_olt ON ont_devices(olt_id);
CREATE INDEX IF NOT EXISTS idx_ont_devices_subscriber ON ont_devices(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_ont_devices_status ON ont_devices(status);

-- ─── Subscriber to ONT Mapping ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriber_ont_mapping (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ont_id      UUID NOT NULL REFERENCES ont_devices(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by TEXT,
    notes       TEXT,
    UNIQUE(subscriber_id, ont_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriber_ont_mapping_subscriber ON subscriber_ont_mapping(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_ont_mapping_ont ON subscriber_ont_mapping(ont_id);

-- ─── OLT Telemetry (Time-Series Optimized) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS olt_telemetry (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    olt_id      UUID NOT NULL REFERENCES network_hardware(id) ON DELETE CASCADE,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- PON Port Metrics
    pon_port    TEXT NOT NULL,
    -- Traffic Metrics (bits per second)
    rx_bytes    BIGINT,
    tx_bytes    BIGINT,
    rx_rate     BIGINT,
    tx_rate     BIGINT,
    -- Performance Metrics
    latency_ms  INTEGER,
    packet_loss REAL, -- percentage
    -- Optical Metrics (for PON ports)
    tx_power    REAL, -- dBm
    rx_power    REAL, -- dBm
    tx_current  REAL, -- mA
    rx_current  REAL, -- mA
    temperature REAL, -- Celsius
    voltage     REAL, -- Volts
    -- Alarm Status (bitmask or individual flags)
    los         BOOLEAN DEFAULT FALSE, -- Loss of Signal
    lof         BOOLEAN DEFAULT FALSE, -- Loss of Frame
    sd          BOOLEAN DEFAULT FALSE, -- Signal Degrade
    sf          BOOLEAN DEFAULT FALSE, -- Signal Fail
    -- ONU Count
    onu_active  INTEGER DEFAULT 0,
    onu_total   INTEGER DEFAULT 0,
    onu_warning INTEGER DEFAULT 0,
    onu_los     INTEGER DEFAULT 0,
    -- Raw data for vendor-specific metrics
    raw_data    JSONB DEFAULT '{}'
);

-- Convert to hypertable for TimescaleDB (if using TimescaleDB)
-- SELECT create_hypertable('olt_telemetry', 'timestamp', chunk_time_interval => INTERVAL '1 day');

CREATE INDEX IF NOT EXISTS idx_olt_telemetry_olt_id ON olt_telemetry(olt_id);
CREATE INDEX IF NOT EXISTS idx_olt_telemetry_timestamp ON olt_telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_olt_telemetry_olt_timestamp ON olt_telemetry(olt_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_olt_telemetry_pon_port ON olt_telemetry(pon_port);

-- ─── OLT Audit Log ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS olt_audit_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    olt_id      UUID REFERENCES network_hardware(id) ON DELETE SET NULL,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL, -- e.g., 'health_check', 'onu_reboot', 'wifi_change', 'device_block'
    command_sent TEXT, -- The actual command sent to the OLT
    result      TEXT NOT NULL CHECK (result IN ('SUCCESS', 'FAILED', 'TIMEOUT', 'ERROR')),
    message     TEXT,
    error_code  TEXT, -- Standardized error code for exact error mapping
    raw_response JSONB, -- Full raw response from OLT for debugging
    ip_address  INET, -- IP address of the user who initiated the action
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_olt_audit_log_olt ON olt_audit_log(olt_id);
CREATE INDEX IF NOT EXISTS idx_olt_audit_log_user ON olt_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_olt_audit_log_action ON olt_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_olt_audit_log_created_at ON olt_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_olt_audit_log_result ON olt_audit_log(result);

-- ─── WiFi Configurations (for ONTs) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS wifi_configurations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ont_id      UUID NOT NULL REFERENCES ont_devices(id) ON DELETE CASCADE,
    ssid        TEXT NOT NULL,
    password_hash TEXT NOT NULL, -- Hashed password
    security    TEXT NOT NULL DEFAULT 'WPA2_PSK' CHECK (security IN ('WEP', 'WPA_PSK', 'WPA2_PSK', 'WPA3_SAE', 'OPEN')),
    is_active   BOOLEAN DEFAULT TRUE,
    applied_at  TIMESTAMPTZ DEFAULT NOW(),
    applied_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    raw_data    JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_wifi_configurations_ont ON wifi_configurations(ont_id);
CREATE INDEX IF NOT EXISTS idx_wifi_configurations_active ON wifi_configurations(is_active);

-- ─── Device Blocklist (MAC-based filtering) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS device_blocklist (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ont_id      UUID NOT NULL REFERENCES ont_devices(id) ON DELETE CASCADE,
    mac_address MACADDR NOT NULL,
    action      TEXT NOT NULL CHECK (action IN ('BLOCK', 'ALLOW')),
    reason      TEXT,
    applied_at  TIMESTAMPTZ DEFAULT NOW(),
    applied_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    raw_data    JSONB DEFAULT '{}',
    UNIQUE(ont_id, mac_address)
);

CREATE INDEX IF NOT EXISTS idx_device_blocklist_ont ON device_blocklist(ont_id);
CREATE INDEX IF NOT EXISTS idx_device_blocklist_mac ON device_blocklist(mac_address);
CREATE INDEX IF NOT EXISTS idx_device_blocklist_action ON device_blocklist(action);

-- ─── OLT Health Summary (Cached for Performance) ───────────────────────────
CREATE TABLE IF NOT EXISTS olt_health_summary (
    olt_id      UUID PRIMARY KEY REFERENCES network_hardware(id) ON DELETE CASCADE,
    status      TEXT NOT NULL CHECK (status IN ('Not Configured', 'Pending', 'Online', 'Offline', 'Degraded')),
    connection_status TEXT NOT NULL CHECK (connection_status IN ('Not Configured', 'Pending', 'Connected', 'Failed')),
    last_check  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_error  TEXT,
    onu_count   INTEGER DEFAULT 0,
    onu_online  INTEGER DEFAULT 0,
    onu_warning INTEGER DEFAULT 0,
    onu_los     INTEGER DEFAULT 0,
    bandwidth_rx BIGINT DEFAULT 0,
    bandwidth_tx BIGINT DEFAULT 0,
    optical_avg REAL, -- Average RX power across ONUs
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_olt_health_summary_status ON olt_health_summary(status);
CREATE INDEX IF NOT EXISTS idx_olt_health_summary_connection ON olt_health_summary(connection_status);

-- ============================================================
-- SEED: Default OLT Health Summary Values
-- ============================================================
-- This would be populated via application logic, not static seed
-- since it depends on actual OLT devices

COMMIT;