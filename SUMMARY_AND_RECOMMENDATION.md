# Research Summary & One Solution Recommendation

> Distilled from 45,000+ words of research, 24 ideas across 7 tracks, constraints analysis, and hackathon track requirements.
> Prepared: March 28, 2026 — morning of BuildersVault x UVic Hacks

---

## Research Findings Summary (Aligned to Core Problems)

### Problem 1: Access to Care — The Broken Front Door

The research validates this as the most visible crisis. 6.5 million Canadians have no family doctor. 500,000 left ERs without being seen in 2024. Patients are defaulting to emergency rooms because they have nowhere else to go — not because they need emergency care, but because the system offers no clear alternative. Newcomers face a 3-month insurance gap with zero guidance. Indigenous patients report being dismissed and stereotyped. The front door to Canadian healthcare is either locked or invisible depending on who you are.

Key numbers: 50% of Canadians lack a family doctor or can't see the one they have. 30% of ER visits could have been managed elsewhere. Newcomers face 30% higher harmful events from language barriers. 1 in 5 Indigenous patients report unfair treatment.

### Problem 2: Care Moving Closer to the Patient

The system is trying to decentralize but the infrastructure isn't there. Virtual care dropped from 60% during COVID to 15-25% of visits. Home care is underfunded. Rural communities (20% of population) have only 8% of physicians. The research shows patients are falling through the cracks during transitions — 50% of readmitted patients had zero physician contact between discharge and readmission. Discharge summaries are unreadable. Caregivers aren't in the loop.

Key numbers: 18.4% 30-day readmission rate. Only 34% of discharge summaries reach the family doctor within 48 hours. 7.8 million unpaid caregivers, 89% never formally assessed.

### Problem 3: Workforce Constraints — The Biggest Limiting Factor

This is where the research is deepest and the evidence is strongest. Physicians spend more time documenting than seeing patients. For every 15 minutes with a patient, 9 minutes go to charting. 85% of healthcare workers do "pajama time" — an average of 53 full workdays per year of after-hours EHR work. 65% of Ontario family doctors plan to leave or change practice within 5 years. Nurses document 600-800 data points per 12-hour shift. Canada loses 18.5 million hours per year to unnecessary admin. The workforce is hemorrhaging because the system is drowning them in paperwork instead of letting them do what they trained to do.

Key numbers: 3+ hours/day on documentation alone. 42% cite EHR burden as primary burnout cause. 35% have considered leaving the profession due to EHR-related burnout. Alert fatigue: 90-96% of clinical alerts overridden.

### Problem 4: Healthcare as an Operational System

Referrals are the operational nightmare. 50% of specialist referrals are never completed. 56% are still sent by fax. 69% of PCPs say they send patient history with referrals — but only 34% of specialists actually receive it. Patients wait in queues they don't know they're not actually in. Median wait from GP referral to treatment: 28.6 weeks. A woman lost her vision permanently because a retinal surgery referral was delayed. Hundreds of urology reports were lost due to fax machine malfunctions in Calgary.

Key numbers: 65% of referrals never result in a scheduled appointment. $800K-$900K lost per physician from referrals that never convert. Nearly 50% of malpractice claims involve failure to follow up on referrals.

---

## What the Hackathon Actually Requires

Two tracks. One submission. 8 hours of build time. 5-minute presentation.

**Track 1: Clinical AI** — Synthea synthetic patient data provided. Build something that improves clinical workflows using that data. Judged on innovation (25%), technical execution (25%), impact (25%), presentation (15%), design/UX (10%).

**Track 2: Population Health & Equity** — Real BC community data across 78 communities. Build something that addresses health disparities or makes public health data actionable.

---

## The Intersection Test

The briefing is clear: the strongest solutions sit at the intersection of three things:

1. **Technical capability** — Can we build it? Does AI genuinely help?
2. **Patient perspective** — Does a real patient benefit?
3. **Provider reality** — Does it fit into how care is actually delivered?

If any one is missing, the solution is weaker.

---

## One Solution: CareClarity — One Encounter, Two Outputs

### Track: Track 1 (Clinical AI)

### The Problem (1 sentence)

Clinicians spend more time documenting care than delivering it, while patients leave encounters confused about what happened and what to do next — and the information gap between the two sides of the same visit is where care falls apart.

### Who It's For

**Primary user:** Family physician or NP (saves them time)
**Secondary user:** Patient and/or caregiver (gains understanding and actionable next steps)

### What It Does

When a clinical encounter happens, AI processes the Synthea patient data (encounter context, conditions, medications, procedures, observations) and generates two outputs from a single input:

1. **For the provider:** A structured clinical note — SOAP format, coded conditions, medication reconciliation, referral draft if needed. The physician reviews and edits rather than writing from scratch.

2. **For the patient/caregiver:** A plain-language summary at grade 6 reading level — what happened, what was found, what medications were changed and why, what to do next, when to come back, and warning signs to watch for. Available in multiple languages.

One encounter. Two outputs. Provider saves time. Patient gains clarity. Caregiver gets looped in.

### Why This Idea Wins

| Criteria | Score | Why |
|----------|-------|-----|
| Problem validity (25%) | 5/5 | Documentation burden is the #1 validated provider pain point. Patient confusion post-visit is the #1 care transition failure. Both backed by hard data. |
| Adoption readiness (25%) | 5/5 | Replaces work the provider is already doing (documentation). Doesn't add new workflow. Saves time from minute one. Patients receive something they currently don't get at all. |
| Demo-ability (20%) | 5/5 | Load a Synthea patient → show the encounter → click generate → see both outputs side by side. Before/after is visceral. |
| Buildability (15%) | 5/5 | Synthea data into D1. AI generates two outputs via OpenAI. Frontend shows split view. Existing boilerplate handles routing, safety, auth. 8 hours is enough. |
| Differentiation (10%) | 4/5 | Most teams will build a chatbot that answers questions about patient data. We build a tool that actively reduces work AND improves outcomes. Dual-output from single input is novel. |
| Emotional impact (5%) | 5/5 | Lead with Dot MacLeod: 81, discharged after a fall, forgot to follow up, daughter didn't know. Now: daughter gets a clear care plan on her phone. |

**Weighted total: 4.9/5**

### Why It Beats the Alternatives

- **AI Care Navigator (101):** Doesn't use Synthea data meaningfully. More Track 2.
- **Referral Tracker (201):** Strong problem, but harder to demo compellingly in 5 minutes. Requires showing a workflow over time.
- **Wait Time Dashboard (601):** Visually impressive but just displays data. Doesn't improve a workflow.
- **Caregiver Hub (501):** Strong emotion but narrow user base for judges.
- **Care Journey Tracker (801):** Too broad. Scope creep guaranteed.

CareClarity is the only idea that addresses **both sides of the provider-patient divide simultaneously** while using the Synthea data as the core input, not just a backdrop.

### The Demo Flow (5 minutes)

1. **The Story (60s):** Meet Dot MacLeod. 81. Seven medications. Discharged after a fall. The discharge summary is 3 pages of clinical jargon. She forgot to follow up. Her daughter — 3 hours away — didn't know she was discharged. This is what happens 50% of the time.

2. **The Problem (30s):** Providers spend 3+ hours/day documenting. Patients leave confused. Caregivers are in the dark. The information exists — it's just trapped in a format only one side can read.

3. **The Solution (30s):** CareClarity. One encounter. Two outputs. The provider gets a structured clinical note. The patient gets a plain-language care plan. Same data, two audiences, generated together.

4. **Live Demo (120s):**
   - Open the app. Show Dot's Synthea record (conditions, medications, encounters).
   - Trigger a new encounter summary.
   - Split screen: left side shows the clinical note (SOAP, coded, structured). Right side shows the patient summary (plain language, medication schedule, next steps, warning signs).
   - Show the caregiver view: Dot's daughter gets the same patient summary.
   - Show the multilingual toggle: summary in Tagalog for Maria Santos.

5. **The Impact (60s):** Provider saved 15-20 minutes of documentation. Patient left with a plan they can actually read. Caregiver was looped in automatically. No new workflow — just better output from the workflow that already exists. If this prevented even 10% of the 18.4% readmissions in our mock system, that's 22 patients who didn't bounce back to the hospital.

### Architecture

```
Synthea CSV/FHIR → D1 (patient records, encounters, conditions, meds)
                      ↓
              AI Encounter Processor (OpenAI via fetch)
                    ↙         ↘
    Clinical Note Generator    Patient Summary Generator
    (SOAP, coded, structured)  (Grade 6, actionable, multilingual)
                    ↘         ↙
              Safety Guardrails (PHI scan, hallucination check)
                      ↓
              Dual-View Frontend (split screen, provider vs patient)
                      ↓
              Caregiver Access (token-based sharing, phone-friendly)
```

### What We're NOT Building

- Not a diagnosis tool
- Not a full EHR
- Not ambient listening / voice-to-chart
- Not a chatbot
- Not replacing clinical judgment — provider reviews and approves everything

### Adoption Story

The provider already has to write the note. This writes it for them and generates a patient version as a bonus. There is no new workflow to learn. The adoption barrier is zero because it replaces existing work with better output. The patient version is something that doesn't exist today at all — it's pure value-add.

### What Judges Will Ask

**Q: How is this different from DAX Copilot / ambient scribes?**
A: Those tools only generate the provider note. We generate both sides — the clinical documentation AND the patient-facing summary. The dual-output approach is what makes care transitions actually work.

**Q: Would a provider actually use this?**
A: It saves them time on work they're already doing. 42% cite documentation as their primary burnout driver. This doesn't add a step — it removes one.

**Q: What about privacy/compliance?**
A: All data is synthetic (Synthea). In production, this would require a privacy impact assessment, patient consent for caregiver sharing, and compliance with PIPEDA and provincial health privacy laws. We've designed the consent model into the UX even for the demo.

**Q: What's the AI doing specifically?**
A: Retrieval-augmented generation. The AI reads the patient's structured clinical data from D1 (not free-text), generates a SOAP note using clinical templates, then generates a plain-language summary constrained to grade 6 reading level. Both outputs are grounded in the data — not hallucinated.

**Q: How does this scale?**
A: Cloudflare Workers = globally distributed, serverless, scales automatically. D1 handles the data. The AI call is per-encounter. In production, this integrates via FHIR or HL7 with existing EMRs.

### Success Metric

**Time saved per encounter on documentation** (target: 15-20 minutes per visit, based on the 9 minutes of charting per 15-minute visit baseline).

### Future Work

- Voice input (ambient documentation)
- EMR integration (FHIR R4)
- Automated referral letter generation from the same encounter
- Post-discharge check-in bot using the patient summary as context
- Medication interaction alerts powered by OpenFDA

---

## The Briefing Bottom Line

This hackathon is about building an AI-powered tool that solves a real, validated healthcare problem in a way that people would actually use. The winning approach is not the most technically impressive — it's the one that sits at the intersection of what technology can do, what patients need, and what providers will adopt.
