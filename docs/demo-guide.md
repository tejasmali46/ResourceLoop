# ResourceLoop Judge & Evaluator Demonstration Guide

This guide walks you step-by-step through the flagship end-to-end demonstration scenario specified in **Part 23** of the Master Prompt.

---

## Demo Accounts Quick Reference

All demo accounts share the password: `Password@123`

You can also use the **1-Click Persona Switcher** located in the top navigation bar to switch between roles instantly without typing credentials!

| Role | Name | Email | Responsibilities |
|------|------|-------|------------------|
| **Student (E-Cell Rep)** | Aarav Patel | `student.ecell@resourceloop.edu` | Submits event requests, reserves resources, monitors progress |
| **Faculty Coordinator** | Prof. Elena Vance | `faculty.ecell@resourceloop.edu` | First-stage review, academic safety & club mentorship sign-off |
| **HOD (Computer Science)** | Prof. Arvind Sharma | `hod.cse@resourceloop.edu` | Departmental authorization for large-scale events (>= 100 people) |
| **Resource Manager** | Robert Hayes | `manager.av@resourceloop.edu` | Physical checkout inspection, condition grading, return audit |
| **Institution Admin** | Dr. Sarah Jenkins | `admin@resourceloop.edu` | System-wide analytics, audit logs, policy governance, incident resolution |

---

## 15-Minute Complete Walkthrough Sequence

### Step 1: Discover Resources with AI Assistance
1. Visit the home page or open the **AI Intelligence Assistant** from the top right button (`Sparkles` icon).
2. Click the quick prompt:
   > *"Plan a 150-person Hackathon next Friday with Seminar Hall, 2 Projectors and 2 Microphones"*
3. Observe how **ResourceLoop Intelligence** checks the live database, matches **Sir CV Raman Seminar Hall** (capacity: 150), confirms stock of the **Epson 4K Projector Pool** and **Shure Wireless Mics**, and outputs a recommended equipment checklist.
4. Notice the **Deterministic Institutional Rule Engine** badge proving that the matching is backed by real MongoDB records rather than an ungrounded LLM hallucination.

### Step 2: Submit the Combined Event Request (Student)
1. Sign in as **Aarav Patel (Student E-Cell)**.
2. Click **+ Book Event** in the navigation bar to enter the 7-Step Unified Wizard.
3. **Step 1 (Event Info)**: Title: *"NextGen AI Campus Hackathon"*, Event Type: *Hackathon*, Club: *Entrepreneurship Cell*, Faculty: *Prof. Elena Vance*.
4. **Step 2 (Schedule)**: Select a date next week, 09:00 to 18:00. Expected Attendance: `150`. Notice the alert: *Attendance >= 100 triggers mandatory HOD authorization*.
5. **Step 3 (Venue)**: Select **Sir CV Raman Seminar Hall** (Capacity: 150).
6. **Step 4 (Equipment)**: Add **Epson 4K Projector Pool (Qty: 2)** and **Shure Dual Wireless Mic Set (Qty: 2)**.
7. **Step 5 (Permissions)**: Review the approval routing (Faculty -> HOD -> Resource Manager).
8. **Step 6 (Review & Submit)**: Confirm fair-use quota allowance and click **Confirm & Submit Event Request**.
9. You receive a persistent request ID (e.g. `REQ-2026-0002`).

### Step 3: Faculty Review & Endorsement
1. Switch to **Prof. Elena Vance (Faculty Coordinator)** using the 1-Click Role Switcher.
2. Navigate to **Pending Approvals**.
3. Locate the new hackathon request and click **Review & Decide**.
4. Choose **Approve** with note: *"Reviewed syllabus and mentorship. Approved for E-Cell."*
5. Submit decision. The event automatically transitions to **HOD_REVIEW** because attendance is 150.

### Step 4: Department Head (HOD) Authorization
1. Switch to **Prof. Arvind Sharma (HOD CSE)**.
2. In **Pending Approvals**, review the departmental proposal.
3. Click **Review & Decide** -> **Approve** with note: *"Departmental facilities sanctioned for 150 attendees."*
4. Submit decision. The event automatically routes to **RESOURCE_MANAGER_REVIEW**.

### Step 5: Resource Manager Final Confirmation
1. Switch to **Robert Hayes (Resource Manager)**.
2. In **Pending Approvals**, review the operational equipment availability.
3. Click **Review & Decide** -> **Approve** with note: *"Operational check passed. Gear locked in pool."*
4. The system executes an atomic capacity verification and transitions the event and all linked reservations to **CONFIRMED**!

### Step 6: Physical Equipment Checkout & Initial Condition Grading
1. Switch to **Robert Hayes (Resource Manager)** -> click **Handover Queue**.
2. Under **Ready for Checkout Handover**, locate the confirmed equipment.
3. Click **Execute Handover**.
4. Inspect the item, set **Initial Condition: EXCELLENT**, check *"All standard accessories confirmed"*, and click **Confirm Physical Handover**.
5. The reservation status updates to `CHECKED_OUT` and event transitions to `IN_PROGRESS`.

### Step 7: Equipment Return with Condition Discrepancy & Incident Creation
1. Under **Currently Checked Out / Return Queue**, click **Record Return & Inspect**.
2. Select **Final Return Condition: DAMAGED** and enter: *"HDMI port bracket bent during stage presentation."*
3. Notice the warning alert: *Condition degradation detected. Automatically creating institutional Incident report.*
4. Click **Complete Return Receipt**.
5. Navigate to **Incidents** in the navigation bar. Notice incident `INC-2026-XXXX` has been automatically opened under `DAMAGED_EQUIPMENT` with initial vs final condition evidence.

### Step 8: Incident Resolution & Institutional Audit Trail
1. Switch to **Dr. Sarah Jenkins (Institution Admin)**.
2. In **Incidents**, click **Investigate & Resolve**. Add findings: *"Port repaired by department technician without replacement penalty."* and resolve.
3. Navigate to **Audit Logs** to view the tamper-proof cryptographic timeline of every actor, timestamp, and state transition.
4. Navigate to **Analytics** to view live Recharts dashboards computed from real database collections!
