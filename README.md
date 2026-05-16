<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-check.svg" width="120" height="120" alt="AetherCore Logo">
  
  <h1 align="center" style="color: #00a8e8;">AetherCore</h1>
  
  <p align="center" style="font-size: 1.2rem; color: #555;">
    <b>The Ultimate Reinsurance Administration System</b>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge&color=00a8e8" alt="Status">
    <img src="https://img.shields.io/badge/Language-TypeScript-blue?style=for-the-badge&color=0084c8" alt="Language">
    <img src="https://img.shields.io/badge/UI-Tailwind_CSS-38bdf8?style=for-the-badge" alt="UI Framework">
    <img src="https://img.shields.io/badge/Build-Vite-646cff?style=for-the-badge" alt="Build Tool">
  </p>
</div>

---

## Overview

**AetherCore** is a comprehensive, meticulously crafted reinsurance administration tool. It empowers insurance and reinsurance companies to seamlessly manage treaties, create dynamic plans, calculate and distribute cessions, and handle facultative submissions with precision and ease.

With robust bulk import functionality, dynamic rate matrices, and intelligent treaty matching, AetherCore transforms complex reinsurance workflows into streamlined, automated processes.

---

## Workflow & Modules

Setting up and managing your reinsurance cessions follows a logical, step-by-step progression through the application's core modules:

### 1. Master Configuration
Begin in the **Master** tab to configure default application values, mappings, and system-wide settings.
- <span style="color: #00a8e8;">**Data Alignment:**</span> Ensures your internal terminology aligns perfectly with data when importing CSV files.

### 2. Treaties
Navigate to the **Treaties** tab to establish your binding reinsurance agreements.
- **General Settings:** Define the treaty name, duration, and retention types (absolute amount or percentage).
- **Facultative Limit:** Specify thresholds above which policies demand manual review instead of automatic processing.
- **Premium Rates:** Upload or manually map out complex premium rate matrices based on age, gender, and risk profiles.
- **Reinsurers:** Allot reinsurers their respective share percentages (enforced strictly to 100%).

> **Pro-Tip:** Utilize the **Template** feature to get a pre-formatted Excel template for treaties. This allows you to bulk-upload treaties and their associated rate matrices in one smooth action!

### 3. Plans
Use the **Plans** tab to link your consumer-facing products to internal risk coverages.
- Map "Plan Name" and "Plan Code" directly to "Risk Coverage" (e.g., Death Benefit, Critical Illness) ensuring treaty rules apply correctly.
- Bulk import plans rapidly using the dedicated CSV template.

### 4. Input (Calculator)
Once Treaties and Plans are configured, process individual or bulk policies in the **Input** tab.
- Input policyholder details, demographics, selected plan, and sum assured.
- **Smart Evaluation:** The system parses active treaties and applies intelligent retention rules instantly.
- **Route Management:** Policies exceeding limits are safely routed to the **Facultative queue**.
- **Bulk Processing:** Process thousands of policies using standard CSV headers. Advanced duplicate-checking algorithms block repeated cessions for the exact same parameters.

### 5. Facultative Submissions
Policies requiring special attention arrive in the **Facultative** tab.
- **Review:** Inspect intricate policy data and limits.
- **Accept:** Approve coverage to automatically generate a `Cession No`, graduating the policy to the Cessions queue.
- **Decline:** Mark policies as declined if they don't meet reinsurance criteria.

### 6. Cessions Log
The **Cessions** tab serves as your single source of truth for all validly ceded policies.
- View only fully finalized records (pending or declined policies are hidden).
- Download complete cessions logs to Excel for rigorous auditing and state reporting.

### 7. Accounts & Reporting
Generate granular financial statements.
- **SOA Generation:** Download precise Statements of Accounts for any selected reinsurer across specific process years or custom date intervals.

---

<br/>

<div align="center">
  <p><i>Engineered for Reliability, Scalability, and Speed.</i></p>
  <b>Enjoy using AetherCore!</b>
</div>
