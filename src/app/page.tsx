import Link from "next/link";
import {
  Cpu,
  Database,
  Cloud,
  Activity,
  Bot,
  GitBranch,
  ExternalLink,
  Mail,
  ArrowRight,
  CheckCircle,
  Layers,
  Zap,
} from "lucide-react";

const skills = [
  {
    category: "Testing & QA",
    icon: CheckCircle,
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    items: [
      "API Testing",
      "Microservices",
      "Mobile (iOS/Android)",
      "Web Testing",
      "E2E",
      "Performance",
      "Regression",
      "Shift-left",
    ],
  },
  {
    category: "Automation",
    icon: Zap,
    color: "text-yellow-400",
    border: "border-yellow-500/20",
    items: [
      "Postman",
      "Selenium",
      "Appium",
      "Karate",
      "Gatling",
      "JMeter",
      "Proxyman",
      "Custom Frameworks",
    ],
  },
  {
    category: "Cloud & DevOps",
    icon: Cloud,
    color: "text-sky-400",
    border: "border-sky-500/20",
    items: [
      "AWS Lambda",
      "API Gateway",
      "Docker",
      "Kubernetes",
      "GitLab CI/CD",
      "Bitbucket",
    ],
  },
  {
    category: "Observability",
    icon: Activity,
    color: "text-orange-400",
    border: "border-orange-500/20",
    items: [
      "Grafana",
      "Datadog",
      "New Relic",
      "Kibana",
      "Elasticsearch",
      "ClickHouse",
      "Crashlytics",
    ],
  },
  {
    category: "Languages",
    icon: Database,
    color: "text-purple-400",
    border: "border-purple-500/20",
    items: ["JavaScript", "TypeScript", "Python", "Java"],
  },
  {
    category: "AI & MCP",
    icon: Bot,
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    items: [
      "Cursor",
      "Claude Code",
      "MCP Agents",
      "Kiro",
      "Jira Automation",
      "Google Chat Bots",
    ],
  },
];

const projects = [
  {
    title: "AI-Powered RCA Machine",
    description:
      "A locally-hosted web dashboard that fetches JIRA ticket data, applies JQL filters, and triggers an autonomous Claude-based agent that correlates issue patterns, queries Grafana MCP for logs, inspects backend code, resolves root causes, and self-heals the knowledge base.",
    tags: ["Claude CLI", "MCP", "JIRA APIs", "Grafana MCP", "Atlassian MCP", "Next.js"],
    icon: Bot,
    accent: "from-cyan-500 to-blue-600",
    badge: "Production Tool @ Niyo",
  },
  {
    title: "CV Enrichment Program",
    description:
      "A Cursor-native AI tool that takes a candidate's CV and a target company's JD, then outputs a FAANG-styled resume with gap analysis and improvement suggestions. Currently being extended with standalone Google API integration.",
    tags: ["Cursor Agents", "Claude", "Google APIs", "TypeScript"],
    icon: Layers,
    accent: "from-purple-500 to-pink-600",
    badge: "In Progress",
  },
  {
    title: "Grafana KPI Dashboards",
    description:
      "Organization-wide engineering KPI dashboards used by QA and engineering leadership for release tracking, test coverage metrics, incident counts, and SLO adherence.",
    tags: ["Grafana", "ClickHouse", "Datadog", "Kibana"],
    icon: Activity,
    accent: "from-orange-500 to-red-600",
    badge: "Live @ Niyo",
  },
  {
    title: "Postman Automation Framework",
    description:
      "A full API automation framework adopted org-wide at Niyo. Includes collection management, environment setups, pre/post scripts, Newman CI integration, and release-gate hooks in backend build pipelines.",
    tags: ["Postman", "Newman", "CI/CD", "JavaScript"],
    icon: GitBranch,
    accent: "from-emerald-500 to-teal-600",
    badge: "Org-wide Adoption",
  },
];

const experience = [
  {
    role: "SDET-2",
    company: "Niyo Solutions",
    period: "Oct 2023 – Present",
    location: "Bangalore",
    domain: "Fintech — Lending, Remittance, FD, Savings, Credit Cards",
    highlights: [
      "Built and maintains org-wide Postman automation framework with CI/CD integration",
      "Created AI-powered RCA agent for JIRA triage with MCP-based log fetching",
      "Drove QA CoE — SDLC/STLC alignment, SOPs, release governance",
      "Built Grafana KPI dashboards for real-time engineering visibility",
      "Worked with AWS Lambda, API Gateway, Docker, Kubernetes for serverless testing",
    ],
    current: true,
  },
  {
    role: "Senior QA Engineer",
    company: "HungerBox",
    period: "Aug 2023 – Oct 2023",
    location: "Bangalore",
    domain: "B2B SaaS — Corporate Food Tech",
    highlights: [
      "Led RCA for production failures; managed war rooms during maintenance",
      "Configured JMeter & K9s load testing; hosted Appium on pCloudy",
      "3x increase in testing coverage; 6 downtime events predicted early",
    ],
    current: false,
  },
  {
    role: "QA Engineer",
    company: "HungerBox",
    period: "Mar 2021 – Aug 2023",
    location: "Bangalore",
    domain: "B2B SaaS — Corporate Food Tech",
    highlights: [
      "Identified and reported 1,500+ issues including critical production defects",
      "Maintained client-specific documentation across 400+ customer configurations",
      "Validated vending machine product across hardware, API, and database layers",
    ],
    current: false,
  },
  {
    role: "Junior Automation Engineer",
    company: "HungerBox",
    period: "Sep 2019 – Mar 2021",
    location: "Bangalore",
    domain: "B2B SaaS — Corporate Food Tech",
    highlights: [
      "Built Java/Appium automation framework executed 1,000+ times",
      "Surfaced 20 mobile defects; first automation layer at HungerBox mobile team",
    ],
    current: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">
            <span className="gradient-text">DM</span>
          </span>
          <div className="flex items-center gap-6">
            <a href="#about" className="text-sm text-slate-400 hover:text-slate-100 transition-colors hidden sm:block">About</a>
            <a href="#skills" className="text-sm text-slate-400 hover:text-slate-100 transition-colors hidden sm:block">Skills</a>
            <a href="#projects" className="text-sm text-slate-400 hover:text-slate-100 transition-colors hidden sm:block">Projects</a>
            <a href="#experience" className="text-sm text-slate-400 hover:text-slate-100 transition-colors hidden sm:block">Experience</a>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              My Hub <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="animated-gradient min-h-screen flex items-center pt-16">
        <div className="max-w-6xl mx-auto px-6 py-24 w-full">
          <div className="fade-in-up">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              Open to AI Engineering & Tech Lead roles
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Devadutta<br />
              <span className="gradient-text">Mohapatra</span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-400 mb-4 font-light">
              Senior SDET · AI Tools Builder · Fintech Engineer
            </p>
            <p className="text-slate-500 max-w-xl mb-10 leading-relaxed">
              7+ years building quality systems for fintech & B2B SaaS.
              Building AI-powered engineering tools with Cursor, Claude, and MCPs.
              Based in Bangalore.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#projects"
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105"
              >
                See My Work <ArrowRight size={16} />
              </a>
              <a
                href="mailto:qa.devadutta@gmail.com"
                className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 px-6 py-3 rounded-xl transition-all"
              >
                <Mail size={16} /> Get in Touch
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-20">
            {[
              { label: "Years Experience", value: "7+" },
              { label: "Issues Reported", value: "1,500+" },
              { label: "AI Tools Built", value: "4+" },
              { label: "Languages", value: "4" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                About <span className="gradient-text">Me</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                I'm a Senior SDET with 7+ years in fintech and B2B SaaS, where I've gone from writing automation scripts to building AI-powered engineering systems that change how teams debug, release, and scale.
              </p>
              <p className="text-slate-400 leading-relaxed mb-4">
                My current obsession is the intersection of quality engineering and AI — specifically using MCPs, Claude, and Cursor to build tools that make entire engineering teams more effective.
              </p>
              <p className="text-slate-400 leading-relaxed">
                When I'm not at my desk, you'll find me trekking, swimming, cooking new cuisines, or on a badminton court.
              </p>
              <div className="flex gap-4 mt-8">
                <a
                  href="https://linkedin.com/in/devadutta-mohapatra-qa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <ExternalLink size={16} /> LinkedIn
                </a>
                <a
                  href="https://github.com/DEVDM-GH"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <ExternalLink size={16} /> GitHub
                </a>
                <a
                  href="mailto:qa.devadutta@gmail.com"
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <Mail size={20} /> Email
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Cpu, label: "AI Engineering", desc: "Claude, MCP, Cursor" },
                { icon: Cloud, label: "Cloud Native", desc: "AWS, Docker, K8s" },
                { icon: Activity, label: "Observability", desc: "Grafana, Datadog" },
                { icon: Bot, label: "Automation", desc: "Postman, Selenium, Appium" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/30 transition-colors">
                  <item.icon size={24} className="text-cyan-400 mb-3" />
                  <div className="font-semibold text-sm mb-1">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" className="py-24 bg-slate-900/30 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Core <span className="gradient-text">Skills</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((group) => (
              <div
                key={group.category}
                className={`bg-slate-900 border ${group.border} rounded-xl p-6 hover:border-opacity-60 transition-all`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <group.icon size={20} className={group.color} />
                  <span className="font-semibold text-sm">{group.category}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700/50"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="py-24 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4 text-center">
            Featured <span className="gradient-text">Projects</span>
          </h2>
          <p className="text-slate-500 text-center mb-12">Things I've built that actually matter.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div
                key={project.title}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${project.accent} flex items-center justify-center`}>
                    <project.icon size={20} className="text-white" />
                  </div>
                  <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-1 rounded-full">
                    {project.badge}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                  {project.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section id="experience" className="py-24 bg-slate-900/30 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Experience <span className="gradient-text">Timeline</span>
          </h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-800"></div>
            <div className="space-y-10">
              {experience.map((job, i) => (
                <div key={i} className="relative pl-16">
                  <div className={`absolute left-4 top-1.5 w-4 h-4 rounded-full border-2 ${job.current ? "border-cyan-400 bg-cyan-400/20" : "border-slate-600 bg-slate-950"} -translate-x-1/2`}></div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="font-bold text-lg">{job.role}</span>
                        <span className="text-slate-400"> · {job.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.current && (
                          <span className="text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">Current</span>
                        )}
                        <span className="text-xs text-slate-500">{job.period}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{job.domain}</p>
                    <ul className="space-y-1.5">
                      {job.highlights.map((h, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                          <span className="text-cyan-500 mt-1 shrink-0">›</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-slate-800/50">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Let's <span className="gradient-text">Connect</span>
          </h2>
          <p className="text-slate-400 mb-8">
            Open to AI Engineering, Staff SDET, and Tech Lead roles. Always up for interesting conversations about AI, MCPs, or quality engineering.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:qa.devadutta@gmail.com"
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-all"
            >
              <Mail size={16} /> Email Me
            </a>
            <a
              href="https://linkedin.com/in/devadutta-mohapatra-qa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 px-6 py-3 rounded-xl transition-all"
            >
              <ExternalLink size={16} /> LinkedIn
            </a>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 border border-purple-500/30 hover:border-purple-400 text-purple-400 px-6 py-3 rounded-xl transition-all"
            >
              My Dashboard <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-slate-600">© 2026 Devadutta Mohapatra · Bangalore</span>
          <span className="text-sm text-slate-600">
            Built with Next.js · <span className="text-cyan-500/60">DevaDutta Hub</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
