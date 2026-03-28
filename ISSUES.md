# Issues

> Known problems, risks, and challenges to address before and during the hackathon. Not bugs — these are strategic and design issues.

---

## Category 1: Scope & Focus

### ISSUE-001: Scope creep is the #1 hackathon killer
- **Risk:** Every track touches multiple pain points. Trying to address too many = nothing works well.
- **Mitigation:** Pick ONE primary user, ONE primary workflow, ONE measurable outcome. Everything else is future work.
- **Decision needed:** Which track? Which user? Which workflow?

### ISSUE-002: "Healthcare for everyone" means healthcare for no one
- **Risk:** Trying to serve all vulnerable populations dilutes the solution. Equity is a principle, not a feature list.
- **Mitigation:** Design for the most constrained user first (e.g., low-literacy newcomer, or senior without digital access). If it works for them, it works for everyone.
- **Decision needed:** Who is the most constrained user we're designing for?

### ISSUE-003: Problem validation vs. assumption
- **Risk:** "The fastest way to fail is to build the right solution to the wrong problem." We have research but haven't talked to a real patient or provider.
- **Mitigation:** Use research findings as proxy validation. During hackathon, test assumptions against mentors/judges who have clinical or system experience.
- **Decision needed:** Which pain points do we have the strongest evidence for?

---

## Category 2: Technical

### ISSUE-004: FHIR interoperability is aspirational, not reality
- **Risk:** Building on FHIR assumes endpoints exist. Most Canadian systems still run HL7v2. Many use fax.
- **Mitigation:** Build for CSV/manual input as primary, FHIR as optional/future. Don't make FHIR a dependency for the demo.
- **Decision needed:** Do we use FHIR at all, or keep it simple?

### ISSUE-005: AI hallucination in healthcare context
- **Risk:** If we use LLM-based features (triage, documentation, navigation), hallucinated medical information could be dangerous — even in a demo.
- **Mitigation:** All AI outputs must be clearly marked as non-medical-advice. Use retrieval-augmented generation over pure generation. Constrain outputs to known options (e.g., "these are your care options" not "here is a diagnosis").
- **Decision needed:** Where do we use AI and what guardrails do we enforce?

### ISSUE-006: Demo data must be obviously synthetic
- **Risk:** Judges or observers could mistake realistic mock data for real PHI. This is a healthcare hackathon — people are sensitive.
- **Mitigation:** All data prefixed with MOCK/SYNTHETIC. Use obviously fictional names and scenarios. PHI pattern detection runs in guardrails.ts. Never use real addresses, phone numbers, or health card numbers.
- **Status:** Already addressed in boilerplate (src/safety/guardrails.ts). Maintain this standard in all new data.

### ISSUE-007: Accessibility is not optional
- **Risk:** Building a tool for vulnerable populations that itself is inaccessible undermines credibility.
- **Mitigation:** Run axe-core before demo. Ensure keyboard navigation works. Use semantic HTML. Test with screen reader. WCAG 2.1 AA minimum.
- **Decision needed:** How much accessibility testing can we realistically do during the hackathon?

### ISSUE-008: Offline/low-bandwidth scenarios
- **Risk:** If we target rural or home-based users, we can't assume reliable internet.
- **Mitigation:** Consider progressive web app (PWA) approach, or at minimum acknowledge this in the pitch. Phone/SMS fallback is powerful.
- **Decision needed:** Is offline support in scope for the demo, or is it a "future work" slide?

---

## Category 3: Healthcare Domain

### ISSUE-009: We are not clinicians
- **Risk:** Building clinical decision support without clinical expertise is dangerous and judges will catch it.
- **Mitigation:** Stay in the coordination/navigation/operational layer. Don't build anything that makes clinical recommendations. Route people to care — don't provide care.
- **Rule:** The tool helps people find and coordinate care. It does not deliver care or make clinical decisions.

### ISSUE-010: Privacy and consent even in a demo
- **Risk:** Demonstrating caregiver access to patient data, shared care plans, or multi-provider views raises privacy questions.
- **Mitigation:** Acknowledge consent model in the design ("patient has authorized caregiver access"). Show the consent flow in the demo even if it's simple.
- **Decision needed:** How do we model consent in our demo?

### ISSUE-011: Provincial variation
- **Risk:** Healthcare is provincial in Canada. What exists in Ontario doesn't exist in Nova Scotia. Judges from different provinces may have different expectations.
- **Mitigation:** Design provincially-agnostic where possible. If we pick a specific province, know why and be ready to explain portability.
- **Decision needed:** Province-specific or province-agnostic?

---

## Category 4: Hackathon Strategy

### ISSUE-012: Demo > deck
- **Risk:** Spending too much time on slides and not enough on a working prototype.
- **Mitigation:** Allocate 70% of time to building, 20% to story/pitch, 10% to polish. The demo IS the pitch.
- **Rule:** If it doesn't work in the demo, it doesn't exist.

### ISSUE-013: Emotional resonance wins
- **Risk:** A technically excellent solution without a human story falls flat.
- **Mitigation:** Lead with a patient story (from our seed data personas). Show the broken journey. Then show how it's fixed. Make judges feel it before they evaluate it.
- **Decision needed:** Which persona story leads the pitch?

### ISSUE-014: Judge expectations — what does "AI" mean to them?
- **Risk:** Judges may expect ML models, training data, fine-tuning. Or they may be impressed by well-applied LLM features. Unclear.
- **Mitigation:** Use AI where it genuinely helps (not for show). Be ready to explain WHY AI is the right approach for this specific problem, not just that AI is involved.
- **Decision needed:** What is our AI story? Where does AI provide genuine value vs. where is it just a buzzword?

### ISSUE-015: Team composition unknown
- **Risk:** Don't know team size, skills, or domain expertise until day-of.
- **Mitigation:** Boilerplate is pre-built. Research is done. Seed data is ready. Whoever joins can plug into a role quickly.
- **Action:** Prepare clear onboarding: "here's the problem, here's the plan, here's where you can help."

---

## Category 5: Adoption & Credibility

### ISSUE-016: "Why would anyone actually use this?"
- **Risk:** Judges will ask. If the answer is "because it's better" — that's not enough. Adoption requires fitting into existing workflows.
- **Mitigation:** Show how the solution works WITHIN the current system (fax-compatible, phone-accessible, no new logins for providers). Don't require behavior change on day one.
- **Decision needed:** What is our adoption story?

### ISSUE-017: Regulatory and compliance awareness
- **Risk:** Not mentioning PIPEDA, provincial health privacy laws, or HIPAA-equivalent concerns makes us look naive.
- **Mitigation:** Include a "compliance considerations" slide. Acknowledge what would be needed for production (privacy impact assessment, consent management, data residency). We don't need to solve it — we need to show we know it exists.
- **Status:** Boilerplate already includes safety disclaimers. Extend to pitch.

### ISSUE-018: Existing solutions awareness
- **Risk:** Judges will ask "how is this different from X?" If we don't know X exists, we lose credibility.
- **Mitigation:** Know the landscape: 811 services, OceanMD eReferral, MyChart patient portals, DAX Copilot, provincial health apps. Position as complementary or as serving an underserved gap.
- **Action:** Research existing solutions for whichever track we choose.

---

## Issue Priority Matrix

| Issue | Impact | Likelihood | Priority |
|-------|--------|------------|----------|
| ISSUE-001 Scope creep | Critical | Very high | P0 — decide tonight |
| ISSUE-002 User focus | Critical | High | P0 — decide tonight |
| ISSUE-005 AI hallucination | Critical | Medium | P0 — design guardrails |
| ISSUE-009 Not clinicians | Critical | Medium | P0 — stay in lane |
| ISSUE-012 Demo > deck | High | High | P1 — time allocation |
| ISSUE-013 Emotional resonance | High | Medium | P1 — story selection |
| ISSUE-003 Problem validation | High | Medium | P1 — use research |
| ISSUE-016 Adoption story | High | High | P1 — answer "why use this" |
| ISSUE-014 Judge expectations | Medium | Medium | P2 — prepare answer |
| ISSUE-004 FHIR reality | Medium | Medium | P2 — keep it simple |
| ISSUE-007 Accessibility | Medium | Low | P2 — run axe-core |
| ISSUE-015 Team unknown | Medium | High | P2 — prep onboarding |
| ISSUE-006 Synthetic data | Low | Low | Resolved — guardrails exist |
