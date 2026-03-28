# Tracks

> Official hackathon challenge tracks from BuildersVault x UVic Hacks, March 27-28, 2026.
> You can only submit for ONE track. One winner per track. $250 prize per track.

---

## Official Schedule

| Time | Event |
|------|-------|
| FRI 5:30 PM | Doors open |
| FRI 6:00 PM | Speaker talks begin |
| FRI 7:25 PM | Challenge tracks revealed — hacking begins |
| FRI 10:00 PM | Building closes (students may stay later) |
| SAT 9:00 AM | Building open — keep building |
| SAT 12:00 PM | Lunch served |
| **SAT 3:30 PM** | **CODE FREEZE — submit your link** |
| SAT 4:00 PM | Presentations to judges (5 min each) |
| SAT ~5:30 PM | Winners announced |

**Effective build time:** ~8 hours (FRI 7:25 PM → 10:00 PM = 2.5h, SAT 9:00 AM → 3:30 PM = 6.5h, minus lunch/breaks)

---

## Official Scoring & Judging

| Criteria | Weight | What Judges Look For |
|----------|--------|---------------------|
| **Innovation** | 25% | Is this a novel approach? Does it solve the problem in a new way? |
| **Technical Execution** | 25% | Does the code work? Is the architecture sound? Is it well-built? |
| **Impact Potential** | 25% | Could this realistically improve healthcare outcomes if developed further? |
| **Presentation Quality** | 15% | Can the team clearly explain the problem, solution, and demo? |
| **Design & UX** | 10% | Is the interface intuitive? Is the user experience considered? |

- Judges score in real time during presentations
- Top scores posted publicly
- 5 minutes to present + 2 minutes Q&A

---

## Submission Requirements

- Submit a **single link** (GitHub repo preferred) openable in a standard browser
- Include slides (PDF or Google Slides link) in the repo README
- **No local-only demos** — if local-only, include a recorded video demo (Loom, YouTube)
- README must include: team members, challenge track, problem statement, solution summary, tech stack, how to run/view demo
- **Deadline: Saturday March 28, 3:30 PM sharp. No extensions.**

**Our advantage:** We have a Cloudflare Workers deployment pipeline. Our demo will be LIVE on the internet, not local. This is a differentiator.

---

## TRACK 1: Clinical AI

### Official Description

**The Problem:** Clinicians and researchers deal with complex patient data across fragmented systems. From clinical documentation to diagnostic workflows, there's enormous opportunity for AI to reduce burden and improve outcomes.

**Your Challenge:** Build an AI-powered tool that improves clinical workflows, patient care, or healthcare delivery using the provided Synthea patient dataset.

**Data Provided:** Synthea synthetic patient records — realistic clinical data including patient demographics, encounters, conditions, medications, procedures, and observations. All synthetic (no privacy concerns) but modeled on real clinical patterns.

**Example Ideas (from organizers):** Ambient clinical documentation, diagnostic decision support, medication interaction alerts, care pathway optimization, patient risk stratification, clinical trial matching, voice-to-chart, smart referral routing.

### What Our Research Says About This Track

**Strongest pain points this track addresses:**
- Documentation burden: physicians spend more time charting than with patients (RESEARCH_FINDINGS.md — Provider Theme 1)
- 18.5 million hours/year wasted on unnecessary admin in Canada
- 85% of providers do "pajama time" — 53 full workdays/year of after-hours EHR work
- Alert fatigue: 90-96% of clinical alerts overridden (Provider Theme 3)
- Referrals: 50% never completed, 65% never result in appointment (Operations #1)
- Care fragmentation: providers don't communicate about shared patients (Operations #8)

**Ideas from ALL_IDEAS.md that fit this track:**
| ID | Idea | Fit |
|----|------|-----|
| 201 | Referral Tracker | Direct — uses Synthea encounter/referral data |
| 202 | Smart Referral Intake | Direct — AI pre-checks referrals |
| 203 | Referral + Wait Time Transparency | Direct — uses Synthea + wait data |
| 301 | AI Visit Summarizer | Direct — clinical documentation |
| 302 | Inbox Triage | Adjacent — portal messages |
| 303 | Smart Form Generator | Adjacent — admin burden |
| 401 | Discharge Companion | Direct — uses Synthea encounter data |
| 402 | Post-Discharge Check-In | Direct — care transitions |
| 501 | Caregiver Hub | Adjacent — patient data view |
| 601 | Wait Time Dashboard | Adjacent — operational |
| 804 | Provider + Patient Clarity | Strong hybrid — dual-output from encounter |

**Key consideration:** This track provides Synthea data. Our solution MUST use it meaningfully, not just as a backdrop. The AI must operate ON the clinical data — parsing encounters, conditions, medications, procedures.

**Where to differentiate (Innovation = 25%):**
- Most teams will build a chatbot that answers questions about patient records
- Most teams will build a simple dashboard showing patient data
- To stand out: build something that actively IMPROVES a workflow, not just displays data
- Smart referral routing, care pathway optimization, and risk stratification are underbuilt and high-impact
- Dual-output tools (clinician note + patient summary from same data) are novel

**Technical execution angle (25%):**
- Our boilerplate gives us D1 (SQL), KV (cache), R2 (files), Workers (API)
- We can ingest Synthea CSV/FHIR into D1, build AI features on top
- Live deployment to Cloudflare = working URL, not localhost
- Pinecone vector search already integrated for semantic retrieval

---

## TRACK 2: Population Health & Health Equity

### Official Description

**The Problem:** Health outcomes vary dramatically across communities. Rural and Indigenous communities face longer wait times, fewer resources, and systemic gaps in data collection. Most health research is based on WEIRD populations (Western, Educated, Industrialized, Rich, Democratic).

**Your Challenge:** Build an AI-powered tool that addresses population health disparities, improves health equity, or makes public health data more accessible and actionable using the provided BC community health datasets.

**Data Provided:** BC open health data covering 78 communities — including CIHI wait times, opioid surveillance data, community health profiles, and regional health indicators. Real public data, ready to analyze.

**Example Ideas (from organizers):** Health equity dashboards, wait time prediction by region, opioid crisis early warning systems, multilingual health literacy tools, community resource navigators, bias detection in health datasets, rural/remote care access optimization, social determinants of health mapping.

### What Our Research Says About This Track

**Strongest pain points this track addresses:**
- Rural/remote: 20% of population, only 8% of physicians (Vulnerable Populations #8)
- Indigenous health: 1 in 5 report unfair treatment, covert racism, jurisdictional gaps (Vulnerable Populations #3)
- Newcomers: 30% higher harmful events from language barriers (Vulnerable Populations #2)
- Seniors/digital divide: digital literacy score 21.7 for 75+ (Vulnerable Populations #7)
- Wait time variation: New Brunswick 60.9 weeks vs Ontario 21 weeks (Operations #5)
- SDOH: screening exists but never connects to resources (Operations #9)
- Opioid crisis: BC-specific data provided — high relevance

**Ideas from ALL_IDEAS.md that fit this track:**
| ID | Idea | Fit |
|----|------|-----|
| 101 | AI Care Navigator | Strong — population-level care access |
| 103 | Newcomer Health Onboarding | Direct — health equity |
| 104 | Symptom-to-Service Router | Adjacent — access by region |
| 503 | Caregiver Resource Navigator | Adjacent — community resources |
| 601 | Wait Time Dashboard | Direct — wait times by region/community |
| 602 | Predictive No-Show | Adjacent — population patterns |
| 701 | Multilingual Health Navigator | Direct — health equity |
| 702 | Senior-First Health Portal | Direct — equity |
| 803 | Navigator + Equity | Strong hybrid |

**Key consideration:** This track provides REAL BC public data (not synthetic). 78 communities. CIHI wait times. Opioid data. Community profiles. The solution must USE this data to surface insights or enable action.

**Where to differentiate (Innovation = 25%):**
- Most teams will build a dashboard that visualizes the data
- Dashboards are expected and safe — they won't win on innovation
- To stand out: build something that makes the data ACTIONABLE, not just visible
- A tool that helps a community health worker make a decision, or a patient find a resource, or a policymaker prioritize — that's novel
- Opioid early warning is timely and BC-specific — high relevance to judges
- Bias detection in health datasets is academically interesting and novel

**Technical execution angle (25%):**
- BC data is tabular — perfect for D1/SQLite
- AI can analyze patterns across 78 communities, identify outliers, predict trends
- Map-based visualizations are visually impressive for demos
- Multilingual features show UX sophistication

---

## Track Decision Framework

| Factor | Track 1: Clinical AI | Track 2: Population Health & Equity |
|--------|---------------------|--------------------------------------|
| **Data provided** | Synthea (synthetic patient records) | BC community health data (real, 78 communities) |
| **Data format** | CSV/FHIR — clinical encounters, meds, conditions | Tabular — wait times, opioid data, health indicators |
| **AI application** | Operate on individual patient data | Analyze population-level patterns |
| **Our research depth** | Very deep (provider burden, referrals, transitions) | Deep (equity, rural, Indigenous, newcomers) |
| **Competition risk** | High — many teams will build patient data chatbots | Medium — fewer teams think population-level |
| **Demo impact** | High if workflow is convincing | Very high if visualization/map is strong |
| **Innovation opportunity** | Medium (crowded space) to High (if unique angle) | High (less explored, more novel angles) |
| **Emotional resonance** | Medium (clinician-focused) to High (patient story) | Very high (community stories, equity, opioid crisis) |
| **Our stack fit** | Strong (D1 for data, AI for processing, Workers for API) | Strong (D1 for data, AI for analysis, frontend for viz) |
| **Boilerplate advantage** | Strong — healthcare safety guardrails, retrieval pipeline | Medium — would need visualization additions |

### Which Track Plays to Our Strengths?

**Track 1 if we want to:**
- Build a tool with a clear clinical workflow
- Use our existing retrieval/orchestrator pipeline
- Demo a specific "before and after" for a clinician
- Play in the AI-for-clinical-workflows space

**Track 2 if we want to:**
- Tell a more emotionally resonant story
- Use real data (stronger credibility)
- Stand out from the crowd (fewer teams go population-level)
- Connect to the broader Canadian healthcare context from our research
- Build something visually impressive (maps, dashboards, community profiles)

### Recommendation (pre-decision)

**Track 2 has higher differentiation potential and lower competition risk.** Most hackathon teams default to Track 1 (clinical tools, chatbots). Track 2's real BC data, equity angle, and community-level focus align deeply with our research findings. The opioid data adds urgency. The equity angle adds emotional weight.

However, **Track 1 has clearer "workflow improvement" demo potential.** If we can show a specific before/after for a clinician (smart referral routing, dual-output documentation), it's very concrete.

**Final decision should factor in:** team composition, which data we can explore tonight, and which story resonates most.

---

## Our Previous Ideation Tracks (Pre-Official)

For reference, our original 7 ideation tracks mapped to the official tracks as follows:

| Our Track | Maps To |
|-----------|---------|
| 1. Front Door / Navigation | Track 1 (Clinical AI) or Track 2 (Equity) |
| 2. Referral Fix | Track 1 (Clinical AI) |
| 3. Clinician Relief | Track 1 (Clinical AI) |
| 4. Care Transitions | Track 1 (Clinical AI) |
| 5. Caregiver Coordination | Track 1 (Clinical AI) or Track 2 (Equity) |
| 6. Operational Intelligence | Track 2 (Population Health) |
| 7. Equity & Inclusion | Track 2 (Population Health & Equity) |
