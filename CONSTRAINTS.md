# Constraints

> Hard boundaries, non-negotiables, and real-world limitations that shape what we can and cannot build.

---

## Time Constraints

| Constraint | Detail |
|-----------|--------|
| Hackathon duration | ~12-24 hours (exact TBD) |
| Build time (realistic) | 8-16 hours after accounting for team formation, ideation, breaks, pitch prep |
| Pitch prep | Need 1-2 hours minimum for story, demo flow, and rehearsal |
| Demo length | Typically 3-5 minutes — every second counts |

**Implication:** The solution must be buildable in a single day by a small team. Scope must be ruthlessly narrow. One workflow, done well, beats five features half-done.

---

## Technical Constraints

| Constraint | Detail |
|-----------|--------|
| Stack | Cloudflare Workers, D1, KV, R2 (boilerplate already built) |
| Frontend | Vanilla HTML/CSS/JS — no framework, no build step |
| AI | OpenAI GPT via raw fetch (no SDK) |
| No FHIR servers in production | Most Canadian systems still on HL7v2 or fax |
| No real EHR integration | We cannot connect to Epic, Cerner, OSCAR, etc. |
| No real patient data | All data must be synthetic/mock |
| Deploy target | Cloudflare Workers (not Pages) via wrangler deploy |

**Implication:** We demo against mock data with a working prototype. The architecture should be credible for production but the demo is self-contained. Don't promise integrations we can't show.

---

## Healthcare Domain Constraints

| Constraint | Detail |
|-----------|--------|
| We are not clinicians | Cannot build clinical decision support, diagnosis, or treatment tools |
| Cannot provide medical advice | AI outputs must never be framed as clinical recommendations |
| No real PHI | Not even in testing — all data prefixed MOCK/SYNTHETIC |
| PIPEDA / provincial privacy | Must acknowledge in pitch even if not implemented |
| Provincial variation | Healthcare is provincial — what exists in ON doesn't exist in NB |
| Existing 811 infrastructure | Don't rebuild what exists — augment or complement |

**Implication:** Stay in the coordination/navigation/operational lane. Route people to care. Don't deliver care. Acknowledge compliance requirements without solving them in 12 hours.

---

## User Constraints (Who We're Building For)

These are the real-world constraints our users face. Our solution must work WITHIN these limits, not ignore them.

### Patient-Side Constraints
| Constraint | Affected Users | Design Implication |
|-----------|---------------|-------------------|
| No digital literacy | Seniors 75+, some homeless, some newcomers | Phone/voice must be first-class channel |
| No English fluency | Newcomers, francophone minorities, Indigenous language speakers | Multilingual or very simple language |
| No stable address or phone | Homeless, some newcomers | Cannot require account creation or callbacks |
| No family doctor | 6.5M Canadians | Cannot assume PCP relationship |
| No insurance (3-month gap) | New immigrants | Cannot assume coverage |
| No internet or poor connectivity | Rural, northern, low-income | Must degrade gracefully offline |
| Low health literacy | ~60% of Canadians have inadequate health literacy | Grade 6 reading level, no jargon |
| Cognitive limitations | Seniors with dementia, people in crisis, chronic pain | Fewer steps, forgiving interfaces, no time pressure |
| Transportation barriers | Rural, elderly, disabled, low-income | Virtual/remote options essential |

### Provider-Side Constraints
| Constraint | Affected Users | Design Implication |
|-----------|---------------|-------------------|
| No time for new tools | All clinicians | Must save time from minute one, not after onboarding |
| EMR lock-in | All clinicians | Cannot require switching EMR — must work alongside |
| Fax is the workflow | Most Canadian practices | Must accept fax as input or not require replacing it |
| Alert fatigue | All clinicians (90-96% override rate) | Do NOT add alerts. Reduce noise. |
| Privacy/consent obligations | All providers | Must model patient consent for data sharing |
| Compensation structure | Fee-for-service vs salaried | Solution that adds unpaid work will not be adopted |

### System-Side Constraints
| Constraint | Detail | Design Implication |
|-----------|--------|-------------------|
| Fragmented governance | Federal, provincial, territorial, regional, institutional | Don't assume centralized authority |
| Competing EMR vendors | Epic, Cerner, OSCAR, Telus, etc. | Vendor-agnostic design |
| Budget cycles | Healthcare IT purchases are slow and bureaucratic | Show quick wins, not 3-year implementations |
| Change resistance | "We've always done it this way" | Solution must feel like less work, not more |
| Procurement barriers | Hospitals can't just install new software | Cloud-based, browser-based, no installation |

---

## Judging Constraints (What Wins)

Based on hackathon research and briefing context:

| What Judges Want | What That Means for Us |
|-----------------|----------------------|
| Working demo | The demo must function live — no slides pretending to be software |
| Real problem | Must articulate a specific, validated problem with data |
| Adoption path | Must explain who would use this and why they'd start |
| AI with guardrails | AI that's useful AND safe — acknowledge limitations |
| Domain awareness | Show we understand healthcare complexity (standards, privacy, workflow) |
| Inclusive design | Accessibility, multilingual, equity considerations |
| Technical credibility | Clean architecture, real code, not just a landing page |
| Emotional impact | Make them feel the problem before showing the solution |

---

## Non-Negotiable Rules

1. **All data is mock/synthetic.** No exceptions. No "it looks real for the demo."
2. **No clinical recommendations.** We route to care. We do not provide care.
3. **AI outputs are clearly labeled.** Never presented as medical fact.
4. **Accessibility is baseline, not bonus.** Semantic HTML, keyboard nav, screen reader compatible.
5. **The demo must work.** A broken demo is worse than no demo.
6. **Scope is one workflow.** One user, one journey, one outcome. Say no to everything else.
7. **Adoption is the test.** If the answer to "would anyone use this?" is uncertain, rethink.

---

## What We Will NOT Build

| Will Not Build | Why |
|---------------|-----|
| A diagnosis tool | We're not clinicians. Liability. Hallucination risk. |
| A full EHR/EMR | Scope. Years of work. Competing with billion-dollar vendors. |
| A HIPAA/PIPEDA-compliant production system | Not possible in 12 hours. Acknowledge, don't solve. |
| A tool that requires provider workflow change on day one | Won't be adopted. Must fit into existing patterns. |
| A tool that only works for digitally literate English speakers | Excludes the people who need it most. |
| A general-purpose chatbot | Not specific enough. Not adoption-worthy. |
| An alert system that adds notifications | 90-96% override rate. More alerts = more noise. |
