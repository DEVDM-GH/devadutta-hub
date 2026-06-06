# AI Idea Generator Prompt for Cursor

**Automated (Gemini):** set **`GEMINI_API_KEY`** in `.env.local`, then run **`npm run generate-ideas`** (writes `ideas-output.json`) or **`npm run generate-ideas:local`** / **`generate-ideas:turso`** to generate and seed in one step. See **`docs/IDEAS_PIPELINE.md`**.

**Manual (Cursor):** copy everything below this line into Cursor chat, save the JSON as `scripts/ideas-output.json`, then run **`npm run seed-ideas`** (local) or **`npm run seed-ideas:turso`** (Turso). Use **`*:dry`** scripts for no-write previews.

---

You are a senior career and product strategist working with a highly talented engineer.

## My Profile

**Name:** Devadutta Mohapatra
**Role:** Senior SDET (SDET-2) at Niyo Solutions, Bangalore
**Experience:** 7+ years in fintech and B2B SaaS

**Current Work (Niyo Solutions - Fintech):**
- Testing Lending, Inward Remittance, Fixed Deposits, Savings, Credit Cards platforms
- Built org-wide Postman automation framework with CI/CD release-gate integration
- Maintains performance testing workflows (Gatling, JMeter, New Relic, Datadog, Grafana)
- Works with AWS Lambda, API Gateway, Docker, Kubernetes
- Built Google Chat bots for release updates and synthetic monitoring alerts
- Created Grafana KPI dashboards used by engineering leadership

**AI Projects Built:**
1. AI-powered RCA Machine: Local website that fetches JIRA data, applies JQL filters, has a "Generate RCA" button. Passes JIRA ID to Claude CLI → Claude uses Atlassian MCP for comments/data, Grafana MCP for logs, inspects backend code in workspace, self-heals knowledge base
2. CV Enrichment Program: Cursor-based tool that takes a CV + Job Description → outputs FAANG-styled resume + improvement suggestions. Currently adding standalone Google API integration
3. Crashlytics auto-fix PR workflow
4. JIRA story test case generator

**Skills:** JavaScript, TypeScript, Python, Java, Postman, Selenium, Appium, Karate, Gatling, JMeter, AWS, Docker, Kubernetes, Grafana, Datadog, Kibana, ClickHouse, Cursor, Claude Code, MCPs, Kiro

**Goals:** Transition to AI Engineer or Tech Lead/Manager role. Increase income to 40-60 LPA range. Build a strong personal brand in the AI+QA space. Possibly productize tools.

**Interests outside work:** Cooking new cuisines, trekking, swimming, biking, badminton, football

---

## Your Task

Generate 20 high-quality, actionable ideas across 4 categories. Be specific, practical, and tailored to MY exact background. Avoid generic advice.

Output ONLY a valid JSON array. No markdown, no explanation outside the JSON.

Format:
```json
[
  {
    "category": "career",
    "title": "Short descriptive title",
    "content": "2-4 sentences explaining the idea, specific steps, why it fits my profile, and expected outcome.",
    "tags": "tag1,tag2,tag3"
  }
]
```

Categories to use: "career", "project", "learning", "technical"

Generate:
- 6 career path ideas (specific roles, companies, positioning strategies)
- 6 project ideas (buildable in 2-8 weeks, high impact on portfolio)
- 4 learning ideas (specific courses, skills, certifications worth doing NOW)
- 4 technical ideas (architecture patterns, tools, experiments to try)

Be brutally honest, specific, and ambitious. Think like a YC partner and a senior engineering mentor combined.
