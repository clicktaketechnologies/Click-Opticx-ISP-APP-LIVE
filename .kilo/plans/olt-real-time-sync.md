# OLT → USER → APP REAL-TIME SYNC MODULE Implementation Plan

## Overview
Implement a complete OLT (Optical Line Terminal) to User to App real-time synchronization module with zero dummy data, exact error propagation, and support for TR-069/SNMP/SSH protocols.

## Phase 1: Database Schema Enhancement
### 1.1 Create OLT/ONT Tables
- network_hardware table for OLT devices
- ont_devices table for ONT devices  
- subscriber_ont_mapping table for user-ONT relationships
- olt_telemetry table for real-time metrics (TimescaleDB optimized)
- olt_audit_log table for comprehensive audit trail
- wifi_configurations table for ONT WiFi settings
- device_blocklist table for MAC-based blocking

### 1.2 Table Relationships
- network_hardware (OLT) 1:many ont_devices (ONT)
- ont_devices 1:many olt_telemetry (time-series)
- users 1:many subscriber_ont_mapping
- ont_devices 1:many subscriber_ont_mapping
- olt_audit_log references network_hardware and users

## Phase 2: Protocol Adapter Factory (Backend)
### 2.1 Create Adapter Interface
- Abstract base class defining standard methods: connect(), disconnect(), getSignal(), getOnuStatus(), changeWifi(), blockDevice(), rebootOnu(), discoverOnus()

### 2.2 Vendor-Specific Adapters
- **TR-069 Adapter**: SOAP-based ACS communication
- **SNMPv3 Adapter**: Secure SNMP with authentication/privacy
- **SSH Adapter**: Direct CLI command execution
- Each adapter implements the standard interface with vendor-specific command mappings

### 2.3 OLTAdapterFactory
- Factory pattern to instantiate correct adapter based on OLT vendor/model
- Configuration-driven adapter selection
- Connection pooling and resource management

## Phase 3: Telemetry Pipeline
### 3.1 Real-time Poller Service
- Periodic polling of OLTs for telemetry data (5s interval)
- Protocol-agnostic data collection via adapter factory
- Error handling with exponential backoff and retry logic
- Circuit breaker pattern for failing OLTs

### 3.2 Data Processing & Storage
- Normalize telemetry data to standard format
- Store raw data in Redis cache (TTL: 30s) for immediate access
- Persist to TimescaleDB for historical analysis and trends
- Automatic data retention policies

### 3.3 WebSocket Broadcast Service
- Real-time data distribution to connected clients
- Room-based subscription (per ONU/OLT)
- Efficient delta-based updates to minimize bandwidth
- Connection heartbeat and cleanup mechanisms

## Phase 4: Subscriber Application UI
### 4.1 Live Usage Graph Component
- Real-time line chart using Recharts or similar
- 2-second update interval from WebSocket
- Auto-scaling Y-axis with manual override
- Offline caching via IndexedDB for continuity
- Loading states and error boundaries

### 4.2 Optical Power (dBm) Status Indicator
- Color-coded badge: Green (-8 to -22 dBm), Yellow (-23 to -28), Red (< -28 or LOS)
- Real-time updates from WebSocket stream
- Tooltip with historical trend (last 24h)
- Last updated timestamp

### 4.3 WiFi Management Panel
- Display current SSID (read-only until edit)
- Secure form for SSID/password changes
- Validation: password strength, SSID format
- Loading state during TR-069 set operation
- Success/error toast notifications
- Automatic refresh on successful change

### 4.4 Device Block/Allow List
- Scan and display connected devices (MAC, hostname, IP, connection time)
- Toggle switch for block/allow actions
- Instant UI update on successful operation
- MAC address validation and formatting
- Audit log integration for all changes

## Phase 5: Error Handling & Propagation
### 5.1 Exact Error Mapping Layer
- Comprehensive mapping of protocol-specific errors to UI messages
- No generic fallbacks - every error must have specific mapping
- Examples:
  - SNMP_TIMEOUT → "OFFLINE: SNMP request timed out (check IP/network)"
  - TR069_401_UNAUTHORIZED → "OFFLINE: ACS authentication failed (verify credentials)"
  - SSH_CONNECTION_REFUSED → "OFFLINE: SSH port blocked or OLT down"
  - ONT_NOT_REGISTERED → "DEGRADED: ONT serial not found in OLT table"
  - WIFI_CONFIG_PUSH_FAILED → "FAILED: ONT rejected WiFi change (model limitation)"

### 5.2 Error Propagation Strategy
- Backend catches low-level protocol errors
- Maps to standardized error codes with context
- Returns structured error responses to frontend
- Frontend displays exact messages without interpretation
- Logging includes full stack trace and protocol details

## Phase 6: Audit Logging & Compliance
### 6.1 Comprehensive Audit Trail
- Every OLT command logged (who, what, when, result)
- Configuration changes tracked with before/after snapshots
- Block/unblock actions with MAC address and reason
- Connection attempts (success/failure) with IP addresses
- All audit entries include correlation IDs for traceability

### 6.2 Audit Storage & Retrieval
- Dedicated olt_audit_log table with optimized indexes
- Real-time WebSocket stream for admin dashboard views
- Export capabilities (CSV, JSON) for compliance reporting
- Tamper-evident logging with cryptographic hashing where required

## Phase 7: Zero Dummy Data Enforcement
### 7.1 Development Protocols
- Strict prohibition of mockData, setTimeout placeholders, fake responses
- Development mode uses actual protocol adapters against test equipment
- Feature flags for safe experimentation without compromising data integrity
- Automated checks in CI/CD to detect placeholder code

### 7.2 Production Safeguards
- Health checks that validate real data flow
- Alerting on absence of expected telemetry data
- Circuit breakers that fail closed when data integrity cannot be guaranteed
- Regular data quality monitoring and reporting

## Phase 8: Implementation Sequence & Dependencies

### Week 1: Foundation
- Days 1-2: Database schema creation and migration
- Days 3-4: Protocol adapter interface and basic implementations
- Day 5: Factory pattern and configuration system

### Week 2: Core Functionality
- Days 6-7: Telemetry poller and Redis caching layer
- Days 8-9: TimescaleDB integration and data modeling
- Day 10: WebSocket broadcast service

### Week 3: UI & Integration
- Days 11-12: Subscriber app UI components (charts, status indicators)
- Days 13-14: WiFi management and device control interfaces
- Day 15: Error mapping and exact error propagation

### Week 4: Polish & Validation
- Days 16-17: Audit logging implementation
- Days 18-19: Zero dummy data validation and testing
- Day 20: Performance optimization and load testing
- Day 21: Final validation against all requirements

## Success Criteria
1. **Real-time Sync**: Telemetry updates within 2-second window 95% of the time
2. **Accuracy**: dBm readings within ±1 of OLT CLI measurement
3. **Reliability**: Zero dummy data in production builds
4. **Error Handling**: 100% of protocol errors mapped to specific UI messages
5. **Performance**: Subscriber app maintains 60fps during updates
6. **Scalability**: System handles 10,000+ concurrent ONTs with <100ms p95 latency
7. **Auditability**: Complete traceability of all OLT interactions

## Risk Mitigation
- **Protocol Complexity**: Use existing libraries (net-snmp, ssh2) where possible
- **Vendor Differences**: Extensive adapter abstraction with fallback capabilities
- **Real-time Load**: Horizontal scaling of poller services with Redis clustering
- **Data Integrity**: Validation layers at each pipeline stage
- **Backward Compatibility**: Gradual rollout with feature flags

## Technology Stack
- **Backend**: Node.js/TypeScript with existing project dependencies
- **Protocols**: net-snmp (SNMP), ssh2 (SSH), xml-soap (TR-069)
- **Caching**: Redis (using existing ioredis/upstash dependencies)
- **Time-Series**: TimescaleDB (via existing PostgreSQL/Supabase)
- **Real-Time**: Socket.io (already implemented in project)
- **Frontend**: React with Recharts for data visualization
- **State Management**: Zustand or existing state solution
- **Type Safety**: End-to-end TypeScript for error prevention

This plan provides a comprehensive roadmap for implementing the OLT → USER → APP REAL-TIME SYNC MODULE with all specified requirements and constraints.