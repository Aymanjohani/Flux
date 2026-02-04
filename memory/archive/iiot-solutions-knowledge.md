# IIoT Solutions - Company Knowledge Base

## Company Overview
- **Name:** IIoT Solutions
- **Location:** Riyadh, Saudi Arabia
- **Founded:** 2021
- **Mission:** Turn factory data into action — digitizing the industrial sector
- **Status:** Ministry-approved certified MES provider

## Current Business Reality
- **95% revenue from CONSULTATION** — not implementation (yet)
- Products (IoT Logix, EnOptix, ProdOptix) are the vision/roadmap
- Currently a consulting-first company transitioning to product

## Ad-hoc Project Areas
- Computer Vision solutions
- SCADA systems
- Government projects
- System integration consulting

## Traction
- **2024 YOY Growth:** 650%
- **2026 Pipeline:** 8.3M SAR
- **Market (SAM):** 4.3B SAR (MENA region)
- **Strategic Pivot:** 2023-24 = Consulting, 2025 = R&D, 2026 = Product Scale

## The Problem We Solve
Saudi Arabia has 12,500+ factories, most are legacy "black box" plants:
- Industry consumes 48% of Saudi's primary energy
- Leaders lack real-time data on production/OEE
- Global solutions (Siemens, Rockwell) require 12-month deployments
- Local integrators lack scalable IP

**Our edge:** Fast deployment on brownfield (legacy) plants without disrupting operations.

---

## Products

### 1. IoT Logix — Edge Gateway
**What:** Industrial communication gateway on ESP32-S3 platform

**Key Specs:**
- Protocol conversion: RS485/Modbus RTU → Modbus TCP
- 8 digital inputs, 8 digital outputs
- 2 analog inputs (4-20mA or 0-10V selectable)
- Dual connectivity: Ethernet (10/100 Mbps) + WiFi 2.4GHz
- Embedded web UI for configuration

**Why it matters:** Bridge between legacy field devices and modern networked systems

---

### 2. EnOptix EMS — Energy Management System
**What:** Enterprise-grade energy monitoring, analysis, and cost optimization

**Key Features:**
- Multi-utility: Power (kWh), Water (m³), HVAC (BTU)
- Real-time WebSocket updates (2-second refresh)
- SEC-compliant billing (Saudi Electricity Company tiered pricing 2025)
- Automated invoice generation with VAT (15%)
- ISA-95 enterprise hierarchy

**Tech Stack:**
- Backend: FastAPI (Python 3.12)
- Frontend: React 18 + TypeScript + Tailwind CSS
- Database: PostgreSQL 16 + TimescaleDB
- Protocol: MODBUS TCP/IP (Port 502/5020)
- Container: Docker Compose

---

### 3. ProdOptix MES — Manufacturing Execution System
**What:** On-premise MES/MoM platform for real-time production visibility

**Key Features:**
- ISA-95 aligned digital backbone
- Production Operations: Orders, Routing, Scheduling, Dispatch, Execution
- OEE tracking: Availability, Performance, Quality
- Quality Operations Management
- Maintenance Operations Management
- Shift management and shift-aware reporting

**Integration Layer (ProdConnect):**
- OPC UA
- MQTT
- Modbus TCP

---

## Integration Architecture
```
Field Devices (PLCs, Sensors, Meters)
        ↓
   IoT Logix (Edge Gateway)
   [Protocol Conversion]
        ↓
   ┌────────────────────┐
   │   EnOptix EMS      │  ← Energy/Utility Monitoring
   │   ProdOptix MES    │  ← Production Execution
   └────────────────────┘
        ↓
   Enterprise Systems (ERP, BI, Cloud)
```

---

## 2026 Pipeline (Key Clients)

| Client | Stage | Product | Value (SAR) |
|--------|-------|---------|-------------|
| Riyadh Cement | Tech Validation | Lighthouse (Full Suite) | 3,100,000 |
| Salem Balhamer Holding | Closed Won | MES | 870,976 |
| KESWA | Closed Won | AI Quality | 245,000 |
| Addoha Poultry | Closed Won | MES | 584,024 |
| Lamina | Proposal Sent | MES | 1,144,000 |

---

## Investment Ask
- **Amount:** 8M SAR
- **Runway:** 24 months
- **Use of Funds:**
  - Market Attack (40%) — Secure 10 reference clients via direct sales
  - Operations (30%) — Build channel partner network across MENA
  - Hardware R&D (30%) — CE Certification for IoT Logix

---

## Competitive Advantage
1. **Speed:** Deploy fast vs 12-month global solutions
2. **Compatibility:** Works on brownfield/legacy plants
3. **Local:** Saudi-focused, SEC-compliant, Arabic support
4. **Full Stack:** Connect → Execute → Sustain (all three layers)
5. **Certified:** Ministry-approved MES provider (eligible for govt incentives)

---

## Market Context
- **TAM:** 37,000 addressable factories (Saudi 21%, GCC 6%, MENA 73%)
- **Vision 2030:** National Industrial Strategy targets 35,000 factories by 2035
- **Opportunity:** Most factories still disconnected despite Industry 4.0 push
