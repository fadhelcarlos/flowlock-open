"use client"

import type React from "react"
import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check,
  Copy,
  ChevronRight,
  ShieldCheck,
  Wand2,
  Workflow,
  GitBranch,
  TerminalSquare,
  Gauge,
  Layers,
  Sparkles,
  Rocket,
  Zap,
  Globe,
  GitCommit,
  X,
  Download,
  Users,
  BookOpenText,
  FileCode2,
  Menu,
  Eye,
  Target,
  Database,
  Lock,
  AlertCircle,
  UserCheck,
  FileCheck,
  Monitor,
  Cloud,
  PlayCircle,
  Code2,
  Cpu,
  Network,
  Shield,
  ArrowRight,
  CheckCircle2,
  Settings,
} from "lucide-react"
import Image from "next/image"

// ============================================================
// FlowLock — Premium Landing Page (Refined Dark Theme)
// Cleaner, less overwhelming design while maintaining modern aesthetics
// ============================================================

// Clean background with subtle vignettes
const bg = "bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950"

// ---------------- Brand Mark (Using provided FL logo) ----------------
const FlowLockLogo = ({ className = "w-6 h-6", glow = false }: { className?: string; glow?: boolean }) => {
  return (
    <div
      className={`relative ${className}`}
      style={glow ? { filter: "drop-shadow(0 0 8px rgba(236,72,153,0.4))" } : undefined}
    >
      <Image
        src="/images/fl-logo.png"
        alt="FlowLock Logo"
        width={24}
        height={24}
        className="w-full h-full object-contain"
      />
    </div>
  )
}

const Brand = () => (
  <div className="flex items-center gap-2 sm:gap-3">
    <div className="relative">
      <div className="absolute -inset-1 rounded-xl blur-sm bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-fuchsia-500/20" />
      <div className="relative rounded-xl bg-slate-900/80 p-2 ring-1 ring-white/10 backdrop-blur">
        <FlowLockLogo className="w-7 h-7 sm:w-8 sm:h-8" glow />
      </div>
    </div>
    <span className="font-semibold tracking-tight text-white text-lg">FlowLock</span>
    <span className="hidden md:inline ml-2 rounded-full px-2 py-0.5 text-xs bg-slate-800/60 text-slate-300 border border-slate-700/50">
      UX Contract Guardrails
    </span>
  </div>
)

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/40 px-3 py-1 text-xs text-slate-300 backdrop-blur">
    {children}
  </span>
)

const PrimaryButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-pink-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50"
  >
    {children}
    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
  </button>
)

const GhostButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/30 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200 backdrop-blur"
  >
    {children}
  </button>
)

// ---------- Clipboard-safe helpers ----------
function downloadText(text: string, filename: string) {
  try {
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch {
    /* no-op */
  }
}

function useClipboard() {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle")
  const copy = async (text: string) => {
    try {
      if (
        typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        (navigator as any).clipboard &&
        window.isSecureContext
      ) {
        await (navigator as any).clipboard.writeText(text)
        setState("copied")
        setTimeout(() => setState("idle"), 1500)
        return true
      }
      throw new Error("clipboard-unavailable")
    } catch {
      try {
        const ta = document.createElement("textarea")
        ta.value = text
        ta.style.position = "fixed"
        ta.style.opacity = "0"
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        const ok = document.execCommand("copy")
        document.body.removeChild(ta)
        setState(ok ? "copied" : "error")
        setTimeout(() => setState("idle"), 1500)
        return ok
      } catch {
        setState("error")
        setTimeout(() => setState("idle"), 1800)
        return false
      }
    }
  }
  return { state, copy }
}

const InstallBlock = ({ label, command }: { label: string; command: string }) => {
  const { state, copy } = useClipboard()
  const handleCopy = async () => {
    const ok = await copy(command)
    if (!ok) {
      downloadText(command + "\n", "flowlock-install.txt")
    }
  }
  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400">
        <span>{label}</span>
        <span className="inline-flex items-center gap-1">
          <TerminalSquare className="w-3.5 h-3.5" /> Shell
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-800/50 px-3 py-2 ring-1 ring-slate-700/50">
        <code className="text-slate-200 text-sm font-mono">{command}</code>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-2 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
          >
            {state === "copied" ? <Check className="w-4 h-4 text-pink-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => downloadText(command + "\n", "flowlock-install.txt")}
            className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-2 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        If copy is blocked by your browser, a <span className="text-slate-400">flowlock-install.txt</span> download will
        start instead.
      </p>
    </div>
  )
}

const GhostCard = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur">
    {children}
  </div>
)

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <GhostCard>
    <div className="p-6">
      <div className="mb-4 inline-flex rounded-xl bg-slate-800/50 p-3 ring-1 ring-slate-700/50">
        <Icon className="h-5 w-5 text-slate-300" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </GhostCard>
)

const CheckItem = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-3 text-slate-300">
    <Check className="mt-0.5 h-4 w-4 text-pink-400 flex-shrink-0" />
    <span className="text-sm leading-relaxed">{children}</span>
  </div>
)

const PriceCard = ({
  plan,
  price,
  cta,
  features,
  popular,
}: { plan: string; price: string; cta: string; features: string[]; popular?: boolean }) => (
  <div
    className={`relative flex flex-col rounded-2xl border ${popular ? "border-pink-500/30 bg-slate-900/60" : "border-slate-700/50 bg-slate-900/40"} p-6 backdrop-blur hover:border-slate-600/50 transition-all duration-300`}
  >
    {popular && (
      <div className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-pink-600 to-fuchsia-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
        POPULAR
      </div>
    )}
    <h4 className="text-white font-semibold text-lg mb-3">{plan}</h4>
    <div className="flex items-end gap-1 mb-6">
      <span className="text-3xl font-bold text-white">{price}</span>
      <span className="text-sm text-slate-400">/month</span>
    </div>
    <ul className="flex flex-col gap-3 mb-6 flex-grow">
      {features.map((f, i) => (
        <CheckItem key={i}>{f}</CheckItem>
      ))}
    </ul>
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${popular ? "bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 text-white shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30" : "border border-slate-700/50 text-slate-300 hover:bg-slate-800/50 hover:text-white"}`}
    >
      {cta} <ChevronRight className="w-4 h-4" />
    </button>
  </div>
)

const Stat = ({ kpi, label }: { kpi: string; label: string }) => (
  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 text-center backdrop-blur">
    <div className="text-2xl font-semibold text-white mb-1">{kpi}</div>
    <div className="text-sm text-slate-400">{label}</div>
  </div>
)

const SectionTitle = ({ eyebrow, title, kicker }: { eyebrow: string; title: string; kicker?: string }) => (
  <div className="mx-auto max-w-3xl text-center">
    <div className="mb-4 flex items-center justify-center gap-3">
      <span className="h-px w-8 bg-gradient-to-r from-transparent via-slate-500 to-transparent" />
      <span className="text-xs tracking-widest text-slate-400 uppercase font-medium">{eyebrow}</span>
      <span className="h-px w-8 bg-gradient-to-r from-transparent via-slate-500 to-transparent" />
    </div>
    <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-white mb-4">{title}</h2>
    {kicker && <p className="text-lg text-slate-400 leading-relaxed">{kicker}</p>}
  </div>
)

// Simplified Wizard component (keeping core functionality but cleaner styling)
function Wizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [idea, setIdea] = useState("")
  const [project, setProject] = useState("My FlowLock Project")
  const [roles] = useState<Role[]>(DEFAULT_ROLES)
  const [selected, setSelected] = useState<Record<string, boolean>>({
    admin: true,
    manager: true,
    member: true,
    viewer: true,
  })
  const [jtbd, setJtbd] = useState<Record<string, string[]>>({
    manager: ["Create first record", "Review pipeline"],
    member: ["Submit updates"],
    admin: ["Configure"],
    viewer: ["Browse data"],
  })
  const entities = useMemo(() => inferEntities(idea), [idea])

  const activeRoles = useMemo(() => roles.filter((r) => selected[r.id]), [roles, selected])
  const prd = useMemo(() => synthesizePRD(idea, activeRoles, jtbd, entities), [idea, activeRoles, jtbd, entities])
  const uxspec = useMemo(
    () => synthesizeUxspec(project, activeRoles, entities, idea),
    [project, activeRoles, entities, idea],
  )

  const { state: copyState, copy } = useClipboard()

  useEffect(() => {
    if (!open) {
      setStep(0)
    }
  }, [open])

  const Stepper = () => (
    <div className="mb-6 flex items-center justify-between text-xs text-slate-400">
      {["Idea", "Roles", "Jobs", "Entities", "Review"].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`h-6 w-6 rounded-full text-center leading-6 text-xs font-medium ${
              i <= step ? "bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white" : "bg-slate-800/50 text-slate-500"
            }`}
          >
            {i + 1}
          </div>
          <span className={`${i <= step ? "text-slate-300" : ""}`}>{s}</span>
          {i < 4 && <span className="mx-2 h-px w-6 bg-slate-700/50" />}
        </div>
      ))}
    </div>
  )

  const close = () => {
    onClose()
    setTimeout(() => setStep(0), 200)
  }

  const onCopyUxspec = async () => {
    const json = JSON.stringify(uxspec, null, 2)
    const ok = await copy(json)
    if (!ok) {
      downloadText(json, "uxspec.json")
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            className="relative w-full max-w-4xl rounded-2xl border border-slate-700/50 bg-slate-900/90 p-6 backdrop-blur-xl max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 rounded-lg border border-slate-700/50 bg-slate-800/50 p-2 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mb-4 flex items-center gap-3 text-white">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <h3 className="text-lg font-semibold">AI PRD Generator</h3>
            </div>
            <Stepper />

            {step === 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm text-slate-300 font-medium">Project name</label>
                  <input
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 text-sm text-white outline-none placeholder-slate-500 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-colors"
                    placeholder="e.g., Forma Sports"
                  />
                  <label className="mt-4 block text-sm text-slate-300 font-medium">Describe your product idea</label>
                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    rows={7}
                    className="mt-2 w-full rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 text-sm text-white outline-none placeholder-slate-500 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-colors resize-none"
                    placeholder="In one paragraph, describe who it's for, what they do, and the outcome."
                  />
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-800/50 text-[10px]">
                      i
                    </span>
                    <span>
                      Tip: mention roles (coach, manager…), core objects (workout, team…), and the happy path.
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 backdrop-blur">
                  <div className="text-xs text-slate-500 font-medium mb-2">Live PRD preview</div>
                  <div className="max-h-[260px] overflow-auto rounded-lg border border-slate-700/50 bg-slate-950/60 p-3 text-xs text-slate-400 whitespace-pre-wrap">
                    {prd}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-sm text-slate-300 font-medium mb-3">Select roles</div>
                  <div className="grid grid-cols-2 gap-3">
                    {DEFAULT_ROLES.map((r) => (
                      <button
                        key={r.id}
                        onClick={() =>
                          setSelected((prev) => ({
                            ...prev,
                            [r.id]: !prev[r.id],
                          }))
                        }
                        className={`rounded-xl border p-4 text-left text-sm transition-all duration-200 ${
                          selected[r.id]
                            ? "border-pink-500/40 bg-pink-500/10 text-white"
                            : "border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600/50 hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{r.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 backdrop-blur">
                  <div className="text-xs text-slate-500 font-medium mb-2">Entities inferred</div>
                  <div className="flex flex-wrap gap-2">
                    {entities.map((e) => (
                      <span
                        key={e}
                        className="rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-xs text-slate-300"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-sm text-slate-300 font-medium mb-3">Jobs To Be Done</div>
                  {DEFAULT_ROLES.filter((r) => selected[r.id]).map((r) => (
                    <div key={r.id} className="mb-4 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
                      <div className="mb-3 text-sm font-medium text-white">{r.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {["Create first record", "Review items", "Assign tasks", "Track progress"].map((s) => (
                          <button
                            key={s}
                            onClick={() =>
                              setJtbd((prev) => ({
                                ...prev,
                                [r.id]: Array.from(
                                  new Set([
                                    ...((prev[r.id] || []).includes(s)
                                      ? (prev[r.id] || []).filter((x) => x !== s)
                                      : [...(prev[r.id] || []), s]),
                                  ]),
                                ),
                              }))
                            }
                            className={`rounded-full border px-3 py-1 text-xs transition-all duration-200 ${
                              (jtbd[r.id] || []).includes(s)
                                ? "border-fuchsia-500/40 bg-fuchsia-500/10 text-white"
                                : "border-slate-700/50 bg-slate-800/50 text-slate-400 hover:border-slate-600/50 hover:text-slate-300"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 backdrop-blur">
                  <div className="text-xs text-slate-500 font-medium mb-2">Tip</div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Focus on the <strong className="text-slate-300">happy path</strong>, measurable outcomes, and who
                    owns each step. FlowLock will enforce reachability and traceability later.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 backdrop-blur">
                  <div className="text-sm text-slate-300 font-medium mb-2">Entities</div>
                  <p className="text-xs text-slate-500 mb-3">
                    We inferred these from your idea. You can edit in the spec later.
                  </p>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {entities.map((e) => (
                      <li key={e} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-pink-400" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 backdrop-blur">
                  <div className="text-sm text-slate-300 font-medium mb-2">What FlowLock will enforce</div>
                  <ul className="space-y-2 text-sm">
                    <CheckItem>Cards/lists only show fields captured by forms (or marked derived)</CheckItem>
                    <CheckItem>Three-click reachability from Home/Dashboard</CheckItem>
                    <CheckItem>Valid state transitions</CheckItem>
                    <CheckItem>Details page for creatables</CheckItem>
                  </ul>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="mb-3 text-sm text-slate-300 font-medium flex items-center gap-2">
                    <BookOpenText className="w-4 h-4" />
                    PRD (Markdown)
                  </div>
                  <CodeBlock content={prd} filename="PRD.md" />
                </div>
                <div>
                  <div className="mb-3 text-sm text-slate-300 font-medium flex items-center gap-2">
                    <FileCode2 className="w-4 h-4" />
                    uxspec.json
                  </div>
                  <CodeBlock content={JSON.stringify(uxspec, null, 2)} filename="uxspec.json" />
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <GhostButton onClick={close}>Close</GhostButton>
              <div className="flex items-center gap-3">
                {step > 0 && <GhostButton onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</GhostButton>}
                {step < 4 ? (
                  <PrimaryButton onClick={() => setStep((s) => Math.min(4, s + 1))}>Next</PrimaryButton>
                ) : (
                  <PrimaryButton onClick={onCopyUxspec}>
                    {copyState === "copied" ? "Copied!" : "Copy uxspec (or download)"}
                  </PrimaryButton>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const CodeBlock = ({ content, filename }: { content: string; filename?: string }) => {
  const { state, copy } = useClipboard()
  const name = filename || (content.trim().startsWith("{") ? "uxspec.json" : "PRD.md")
  const onCopy = async () => {
    const ok = await copy(content)
    if (!ok) {
      downloadText(content, name)
    }
  }
  return (
    <div className="relative">
      <div className="absolute right-3 top-3 flex items-center gap-2 z-10">
        <button
          onClick={onCopy}
          className="rounded-md border border-slate-700/50 bg-slate-800/50 p-2 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => downloadText(content, name)}
          className="rounded-md border border-slate-700/50 bg-slate-800/50 p-2 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
      <pre className="max-h-[360px] overflow-auto rounded-xl border border-slate-700/50 bg-slate-950/60 p-4 text-xs leading-relaxed text-slate-300 backdrop-blur">
        {content}
      </pre>
      {state === "error" && (
        <div className="mt-2 text-[11px] text-rose-300">
          Copy was blocked by your browser. We downloaded <span className="underline">{name}</span> instead.
        </div>
      )}
      {state === "copied" && <div className="mt-2 text-[11px] text-pink-300">Copied to clipboard.</div>}
    </div>
  )
}

// PRD generator types and helper functions
type Role = { id: string; name: string }
const DEFAULT_ROLES: Role[] = [
  { id: "admin", name: "Admin" },
  { id: "manager", name: "Manager" },
  { id: "member", name: "Member" },
  { id: "viewer", name: "Viewer" },
]

function inferEntities(text: string) {
  const t = text.toLowerCase()
  const base = ["User", "Project", "Task"]
  if (/workout|athlete|training|coach|team/.test(t)) base.push("Workout", "Athlete", "Team", "Plan")
  if (/sale|order|invoice|checkout|cart|product/.test(t)) base.push("Product", "Order", "Cart", "Invoice")
  if (/content|post|article|blog|editor/.test(t)) base.push("Post", "Comment", "Tag")
  return Array.from(new Set(base))
}

function synthesizePRD(idea: string, roles: Role[], jtbd: Record<string, string[]>, entities: string[]) {
  const lines: string[] = []
  lines.push(`# Product Requirements — Generated by FlowLock`)
  lines.push("")
  lines.push(`## Vision`)
  lines.push(idea.trim() || "Describe your product vision here.")
  lines.push("")
  lines.push("## Roles")
  roles.forEach((r) => lines.push(`- **${r.name}**`))
  lines.push("")
  lines.push("## Jobs To Be Done")
  roles.forEach((r) => {
    const jobs = jtbd[r.id] || []
    lines.push(`- **${r.name}**: ${jobs.length ? jobs.join(", ") : "Define primary jobs"}`)
  })
  lines.push("")
  lines.push("## Entities")
  entities.forEach((e) => lines.push(`- **${e}**`))
  lines.push("")
  lines.push("## Success Metrics")
  lines.push("- Time-to-first-success under 3 minutes")
  lines.push("- 0 dead-end flows in audit")
  lines.push("- 95% spec ↔ UI traceability")
  return lines.join("\n")
}

function synthesizeUxspec(project: string, roles: Role[], entities: string[], idea: string) {
  const roleObjs = roles.map((r) => ({ id: r.id, name: r.name }))
  const entityObjs = entities.map((e) => ({
    id: e,
    fields: [
      { id: "id", type: "string", required: true },
      { id: "name", type: "string" },
    ],
  }))
  const screens = [
    { id: "home", role: roles.map((r) => r.id), reads: [], ctas: [{ id: "to_list", to: "list" }] },
    {
      id: "list",
      role: roles.map((r) => r.id),
      lists: [{ id: "entities", reads: [`${entities[0] || "Item"}.*`] }],
      ctas: [{ id: "to_create", to: "create" }],
    },
    {
      id: "create",
      role: roles.map((r) => r.id),
      forms: [{ id: "create_form", writes: [`${entities[0] || "Item"}.name`] }],
      ctas: [{ id: "to_detail", to: "detail" }],
    },
    {
      id: "detail",
      role: roles.map((r) => r.id),
      cards: [{ id: "card", reads: [`${entities[0] || "Item"}.name`] }],
      reads: [`${entities[0] || "Item"}.*`],
    },
  ]
  const flows = [
    {
      id: "happy_path",
      jtbd: "Create first record",
      role: roles[0]?.id || "member",
      success: { screen: "detail" },
      steps: [
        { id: "home", screen: "home" },
        { id: "list", screen: "list" },
        { id: "create", screen: "create", writes: [`${entities[0] || "Item"}.name`] },
        { id: "detail", screen: "detail", reads: [`${entities[0] || "Item"}.*`] },
      ],
    },
  ]
  const states = entities.map((e) => ({ entity: e, allowed: ["draft", "active", "archived"] }))
  return {
    project: project || "FlowLock App",
    version: "0.1.0",
    roles: roleObjs,
    entities: entityObjs,
    permissions: [],
    jtbd: roles.map((r) => ({ role: r.id, tasks: [`Create and manage ${entities[0] || "items"}`] })),
    flows,
    screens,
    states,
    policies: {
      three_click_rule: true,
      require_view_details_for_every_creatable_entity: true,
      require_empty_loading_error_states: true,
    },
  } as any
}

// New sections for the landing page
function PersonasSection() {
  const personas = [
    {
      title: "Non-technical",
      desc: "One click: Watch & Stream. See a plain-English todo list in Cloud.",
      icon: Users,
      gradient: "from-blue-500 to-indigo-500",
      bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      borderGradient: "from-blue-500/50 via-blue-500/30 to-blue-500/10",
      badge: "No Code",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      features: ["Visual monitoring", "Plain English", "Zero setup"]
    },
    {
      title: "Engineers",
      desc: "CI gates + exact patches. Guardrails that prevent rework.",
      icon: Code2,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 via-purple-500/5 to-transparent",
      borderGradient: "from-purple-500/50 via-purple-500/30 to-purple-500/10",
      badge: "Dev Ready",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      features: ["CI/CD gates", "Exact patches", "Type safety"]
    },
    {
      title: "AI builders",
      desc: "Agents scaffold only when green. Less hallucination, more shipping.",
      icon: Sparkles,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      borderGradient: "from-emerald-500/50 via-emerald-500/30 to-emerald-500/10",
      badge: "AI First",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      features: ["Smart scaffolding", "Validation first", "Agent ready"]
    }
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 pb-8">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
          <Users className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-medium text-pink-300">Built for Everyone</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Perfect for <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Every Team</span>
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Whether you're a product owner, developer, or AI builder, FlowLock adapts to your workflow
        </p>
      </motion.div>

      {/* Personas Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {personas.map((persona, index) => {
          const Icon = persona.icon
          return (
            <motion.div
              key={persona.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              {/* Card Container */}
              <div className="relative h-full overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur-sm transition-all duration-500 hover:border-slate-700/50 hover:shadow-2xl hover:shadow-pink-500/10 hover:-translate-y-1">
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${persona.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Animated Border Gradient */}
                <div className="absolute inset-0 rounded-2xl">
                  <div className={`absolute inset-[-1px] rounded-2xl bg-gradient-to-br ${persona.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm`} />
                </div>

                {/* Content */}
                <div className="relative p-6 space-y-4">
                  {/* Badge */}
                  <div className="flex justify-between items-start">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${persona.badgeColor}`}
                    >
                      {persona.badge}
                    </motion.div>
                    
                    {/* Icon with gradient background */}
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${persona.gradient} rounded-lg blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500`} />
                      <div className={`relative p-2.5 rounded-lg bg-gradient-to-br ${persona.gradient} bg-opacity-10 border border-white/10 group-hover:border-white/20 transition-all duration-300`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Title with gradient on hover */}
                  <h3 className="text-xl font-bold text-white group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300" 
                      style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
                    <span className={`group-hover:bg-gradient-to-r ${persona.gradient} group-hover:bg-clip-text group-hover:text-transparent`}>
                      {persona.title}
                    </span>
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                    {persona.desc}
                  </p>

                  {/* Features List */}
                  <div className="pt-4 border-t border-slate-800/50 group-hover:border-slate-700/50 transition-colors duration-300">
                    <div className="space-y-2">
                      {persona.features.map((feature, idx) => (
                        <motion.div
                          key={feature}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: 0.5 + idx * 0.1 }}
                          className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-400 transition-colors duration-300"
                        >
                          <div className={`w-1 h-1 rounded-full bg-gradient-to-r ${persona.gradient}`} />
                          <span>{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Hover indicator */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}
                  >
                    <div className={`h-full bg-gradient-to-r ${persona.gradient}`} />
                  </motion.div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                  <div className={`w-full h-full bg-gradient-to-br ${persona.gradient} blur-3xl`} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-12 text-center"
      >
        <p className="text-sm text-slate-500">
          Join thousands of teams building better products with FlowLock
        </p>
      </motion.div>
    </section>
  )
}

function CoreGuaranteesSection() {
  const guarantees = [
    {
      icon: Eye,
      title: "Honest Read",
      desc: "UI only uses fields that are captured, derived (with provenance), or from an approved source."
    },
    {
      icon: Target,
      title: "Reachability",
      desc: "Primary jobs are reachable from entry in ≤3 steps. No dead-ends/orphans."
    },
    {
      icon: Database,
      title: "Creatable ⇒ Viewable",
      desc: "Every creatable entity has a details view and a discoverable path."
    },
    {
      icon: Settings,
      title: "State Machine Validity",
      desc: "CTAs respect allowed transitions and guards."
    },
    {
      icon: AlertCircle,
      title: "Empty / Loading / Error",
      desc: "Lists, forms, cards declare states with copy."
    },
    {
      icon: UserCheck,
      title: "Role Boundaries",
      desc: "Screens & CTAs visible only to declared roles."
    },
    {
      icon: FileCheck,
      title: "Spec Coverage",
      desc: "Every component maps back to the contract."
    }
  ]

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-3xl text-center mb-16"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-800/50 px-4 py-1.5 text-xs tracking-widest text-slate-400 border border-slate-700/50">
          <Shield className="w-3.5 h-3.5" />
          CORE GUARANTEES
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
          Non-negotiable invariants
        </h2>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          If they fail, the build (or the agent) is blocked. These guarantees ensure your UI works exactly as specified.
        </p>
      </motion.div>

      <div className="mx-auto max-w-4xl">
        <div className="space-y-3">
          {guarantees.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true, amount: 0.2 }}
                className="group relative"
              >
                <div className="relative rounded-xl border border-slate-800/50 bg-slate-900/40 backdrop-blur transition-all duration-300 hover:bg-slate-900/60 hover:border-slate-700/50">
                  <div className="flex items-start gap-4 p-5">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-lg bg-pink-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative rounded-lg bg-slate-800/50 p-2.5 transition-colors duration-300 group-hover:bg-slate-800/70">
                          <Icon className="h-5 w-5 text-slate-400 transition-colors duration-300 group-hover:text-pink-400" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-white">{item.title}</h3>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <CheckCircle2 className="w-4 h-4 text-green-400/70" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="flex-shrink-0 text-2xl font-bold text-slate-800/30 group-hover:text-slate-800/40 transition-colors duration-300">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true, amount: 0.2 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 text-xs text-slate-500">
            <div className="w-1 h-1 rounded-full bg-green-400/50" />
            <span>All guarantees enforced in CI/CD pipeline</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function LiveSyncSection({ onWatch, onOpenCloud }: { onWatch?: () => void; onOpenCloud?: () => void }) {
  const [activeTab, setActiveTab] = useState<'commands' | 'payload'>('commands')
  const [streamState, setStreamState] = useState<'ready' | 'checking' | 'success' | 'failed'>('ready')
  const [testResults, setTestResults] = useState({ passed: 0, failed: 0 })
  const [timestamp, setTimestamp] = useState('2024-01-15T10:30:00.000Z')
  
  useEffect(() => {
    // Set timestamp only on client side to avoid hydration mismatch
    setTimestamp(new Date().toISOString())
    
    const interval = setInterval(() => {
      setStreamState(prev => {
        // Create a realistic cycle: ready → checking → success/failed → ready
        if (prev === 'ready') return 'checking'
        if (prev === 'checking') {
          // 70% success, 30% failure for demo
          const success = Math.random() > 0.3
          setTestResults(success 
            ? { passed: 7, failed: 0 } 
            : { passed: 5, failed: 2 }
          )
          return success ? 'success' : 'failed'
        }
        return 'ready'
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-3xl text-center mb-12"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-4 py-1.5 text-xs tracking-widest text-emerald-400 border border-emerald-500/20">
          <Cloud className="w-3.5 h-3.5" />
          LIVE LOCAL SYNC
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
          See <span className="bg-gradient-to-r from-red-400 to-green-400 bg-clip-text text-transparent">red/green</span> as you type
        </h2>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Stream audits, artifacts, and todos to the Cloud from your laptop. No commits needed.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true, amount: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 blur-2xl" />
          <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur overflow-hidden">
            <div className="border-b border-slate-700/50 bg-slate-900/80 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <TerminalSquare className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-slate-300">Terminal</span>
                  </div>
                  <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-300 ${
                    streamState === 'checking' 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : streamState === 'success'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : streamState === 'failed'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      streamState === 'checking' ? 'bg-amber-400 animate-pulse' 
                      : streamState === 'success' ? 'bg-green-400'
                      : streamState === 'failed' ? 'bg-red-400 animate-pulse'
                      : 'bg-slate-500'
                    }`} />
                    {streamState === 'checking' ? 'Checking...' 
                      : streamState === 'success' ? 'All Passed' 
                      : streamState === 'failed' ? 'Errors Found'
                      : 'Ready'}
                  </div>
                  {(streamState === 'success' || streamState === 'failed') && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-400">{testResults.passed} passed</span>
                      {testResults.failed > 0 && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-red-400">{testResults.failed} failed</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-slate-700/50" />
                  <div className="w-3 h-3 rounded-full bg-slate-700/50" />
                  <div className="w-3 h-3 rounded-full bg-slate-700/50" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="rounded-xl bg-slate-950/80 border border-slate-800/50 p-4">
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">$</span>
                    <span className="text-slate-300">npx uxcg cloud login</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">$</span>
                    <span className="text-slate-300">npx uxcg link</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">$</span>
                    <span className="text-slate-300">npx uxcg watch --cloud</span>
                  </div>
                  {streamState === 'checking' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pt-2 text-xs text-slate-500"
                    >
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full" />
                        <span>Running validation checks...</span>
                      </div>
                    </motion.div>
                  )}
                  {streamState === 'failed' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pt-2 text-xs text-red-400"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        <span>Fix errors and save to re-check</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onWatch}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/30"
                >
                  <PlayCircle className="w-4 h-4" />
                  Watch & Stream
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  onClick={onOpenCloud}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/30 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200"
                >
                  <Monitor className="w-4 h-4" />
                  Open Cloud Dashboard
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true, amount: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-2xl" />
          <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur overflow-hidden">
            <div className="border-b border-slate-700/50 bg-slate-900/80 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-slate-300">Stream Payload</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">JSON</span>
                  <div className="h-4 w-px bg-slate-700" />
                  <button className="p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <pre className="rounded-xl bg-slate-950/80 border border-slate-800/50 p-4 text-xs overflow-x-auto">
                <code className="text-slate-300">
{`{
  "run": {
    "origin": "local",
    "specDigest": "sha256:7f3b9c2a...",
    "timestamp": "${timestamp}",
    "status": "${streamState === 'failed' ? 'failed' : streamState === 'success' ? 'passed' : 'running'}",
    "checks": [
      {
        "id": "honest_reads",
        "status": "${streamState === 'failed' ? 'fail' : 'pass'}",
        "message": "${streamState === 'failed' ? 'Card shows Workout.intensity without capture' : 'All reads are honest'}",
        "ref": {
          "screen": "workout_detail",
          "entity": "Workout",
          "field": "intensity"
        }
      },
      {
        "id": "reachability",
        "status": "${streamState === 'failed' ? 'fail' : 'pass'}",
        "message": "${streamState === 'failed' ? 'CreateWorkout screen unreachable from home' : '3-click rule satisfied'}"
      },
      {
        "id": "state_validity",
        "status": "pass",
        "message": "All state transitions valid"
      }
    ],
    "artifacts": [
      {"type": "svg", "name": "er.svg"},
      {"type": "csv", "name": "screens.csv"}
    ],
    "metrics": {
      "coverage": ${streamState === 'failed' ? '71' : '100'}%,
      "reachability": "3-click",
      "deadEnds": ${streamState === 'failed' ? '2' : '0'},
      "tests": {
        "passed": ${testResults.passed},
        "failed": ${testResults.failed},
        "total": ${testResults.passed + testResults.failed}
      }
    }
  }
}`}
                </code>
              </pre>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-3 text-center">
                  <div className={`text-2xl font-bold mb-1 ${
                    streamState === 'failed' ? 'text-amber-400' : 'text-white'
                  }`}>
                    {streamState === 'failed' ? '71%' : '100%'}
                  </div>
                  <div className="text-xs text-slate-400">Coverage</div>
                </div>
                <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">{testResults.passed}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Pass</div>
                    </div>
                    {testResults.failed > 0 && (
                      <>
                        <div className="w-px h-8 bg-slate-700" />
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-400">{testResults.failed}</div>
                          <div className="text-[10px] text-slate-500 uppercase">Fail</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-3 text-center">
                  <div className={`text-2xl font-bold mb-1 ${
                    streamState === 'failed' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {streamState === 'failed' ? '2' : '0'}
                  </div>
                  <div className="text-xs text-slate-400">Dead Ends</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function AICapabilitiesSection() {
  const [activeCategory, setActiveCategory] = useState<'generation' | 'validation' | 'automation'>('generation')
  
  const categories = {
    generation: {
      title: "AI Generation",
      icon: Sparkles,
      description: "Transform ideas into working UI",
      color: "from-purple-500 to-pink-500",
      features: [
        {
          icon: Sparkles,
          title: "Idea → PRD",
          desc: "Describe your idea in plain language. FlowLock asks smart follow‑ups and drafts a complete PRD with roles, JTBD, entities, and success metrics.",
          highlight: true
        },
        {
          icon: Wand2,
          title: "PRD → Contract",
          desc: "AI synthesizes a traceable UX contract (uxspec) with flows, screens, fields, and policies. No UI yet—just the truth.",
          highlight: true
        },
        {
          icon: TerminalSquare,
          title: "Scaffold UI",
          desc: "Once green, orchestrates your AI agent to generate components that exactly match the contract.",
          highlight: true
        }
      ]
    },
    validation: {
      title: "Smart Validation",
      icon: ShieldCheck,
      description: "Continuous checking and fixing",
      color: "from-emerald-500 to-teal-500",
      features: [
        {
          icon: ShieldCheck,
          title: "Auto Guardrails",
          desc: "Runs validations continuously, explains gaps in human terms, and proposes exact spec patches.",
          highlight: true
        },
        {
          icon: Workflow,
          title: "Flow audit + autofix",
          desc: "Simulate user journeys, detect dead ends, and apply safe auto‑fixes to remove dishonest reads.",
          highlight: true
        },
        {
          icon: GitCommit,
          title: "Spec‑drift radar",
          desc: "Watches PRs for untracked UI changes. Comments with diffs and fix suggestions before merge.",
          highlight: true
        }
      ]
    },
    automation: {
      title: "Automation",
      icon: Rocket,
      description: "Generate everything else you need",
      color: "from-orange-500 to-red-500",
      features: [
        {
          icon: Layers,
          title: "Sample data & mocks",
          desc: "Generates realistic fixtures and a mock API directly from the spec for instant, truthful demos.",
          highlight: false
        },
        {
          icon: Globe,
          title: "Synthetic users",
          desc: "Creates personas and Gherkin/Playwright tests to exercise critical flows automatically.",
          highlight: false
        },
        {
          icon: Rocket,
          title: "Copy & UX tone",
          desc: "Writes microcopy, empty/loading/error states, and consistent action labels—on brand.",
          highlight: false
        }
      ]
    }
  }
  
  const currentCategory = categories[activeCategory]
  const CategoryIcon = currentCategory.icon
  
  return (
    <div className="space-y-8">
      {/* Category Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {Object.entries(categories).map(([key, cat]) => {
          const Icon = cat.icon
          const isActive = activeCategory === key
          return (
            <motion.button
              key={key}
              onClick={() => setActiveCategory(key as keyof typeof categories)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative flex items-center gap-3 rounded-2xl border px-6 py-4 transition-all duration-300 w-full sm:w-auto ${
                isActive
                  ? 'border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-purple-500/10 shadow-lg'
                  : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-600/50 hover:bg-slate-900/60'
              }`}
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              {/* Content */}
              <div className="relative flex items-center gap-3 w-full sm:w-auto">
                <div className={`rounded-xl p-2.5 bg-gradient-to-br ${isActive ? cat.color : 'from-slate-700 to-slate-800'} transition-all duration-300`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {cat.title}
                  </div>
                  <div className="text-xs text-slate-500 hidden sm:block">
                    {cat.description}
                  </div>
                </div>
              </div>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                />
              )}
            </motion.button>
          )
        })}
      </div>
      
      {/* Category Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {/* Category Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3 bg-gradient-to-r ${currentCategory.color} bg-opacity-10 border border-pink-500/20`}>
              <CategoryIcon className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-semibold text-pink-300 uppercase tracking-wider">
                {currentCategory.title}
              </span>
            </div>
            <p className="text-slate-400 max-w-2xl mx-auto">
              {currentCategory.description}
            </p>
          </div>
          
          {/* Feature Cards - More elegant layout */}
          <div className="grid gap-6 md:grid-cols-3">
            {currentCategory.features.map((feature, index) => {
              const FeatureIcon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`group relative ${feature.highlight ? 'md:scale-105' : ''}`}
                >
                  <div className={`relative h-full overflow-hidden rounded-2xl border ${
                    feature.highlight 
                      ? 'border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-900/60' 
                      : 'border-slate-800/30 bg-slate-900/30'
                  } backdrop-blur transition-all duration-300 hover:border-slate-600/50 hover:transform hover:-translate-y-1`}>
                    {/* Subtle gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${currentCategory.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                    
                    {/* Card content */}
                    <div className="relative p-5">
                      {/* Icon */}
                      <div className={`mb-4 inline-flex rounded-xl p-3 ${
                        feature.highlight 
                          ? `bg-gradient-to-br ${currentCategory.color} shadow-lg` 
                          : 'bg-slate-800/50 ring-1 ring-slate-700/50'
                      }`}>
                        <FeatureIcon className="h-5 w-5 text-white" />
                      </div>
                      
                      {/* Title */}
                      <h3 className={`font-semibold mb-2 ${
                        feature.highlight ? 'text-white text-lg' : 'text-slate-300 text-base'
                      }`}>
                        {feature.title}
                      </h3>
                      
                      {/* Description */}
                      <p className={`text-sm leading-relaxed ${
                        feature.highlight ? 'text-slate-300' : 'text-slate-400'
                      }`}>
                        {feature.desc}
                      </p>
                      
                      {/* Highlight badge */}
                      {feature.highlight && (
                        <div className="absolute top-3 right-3">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function AgentRulesRow() {
  const rules = [
    {
      icon: Shield,
      title: "Spec-first gates",
      desc: "Scaffold only when the contract is green.",
      gradient: "from-green-500 to-emerald-500",
      delay: 0
    },
    {
      icon: Lock,
      title: "Constrained context",
      desc: "Agents read the contract + fixtures, not your whole repo.",
      gradient: "from-blue-500 to-cyan-500",
      delay: 0.1
    },
    {
      icon: FileCheck,
      title: "Schema-validated plans",
      desc: "Non-conforming output is rejected and re-asked.",
      gradient: "from-purple-500 to-pink-500",
      delay: 0.2
    },
    {
      icon: Cpu,
      title: "Deterministic runs",
      desc: "Pinned model/prompt/seed; cached by spec digest.",
      gradient: "from-orange-500 to-red-500",
      delay: 0.3
    }
  ]

  return (
    <div className="mt-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, amount: 0.2 }}
        className="mb-8 text-center"
      >
        <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">Agent Integration Rules</h3>
        <p className="text-sm sm:text-base text-slate-400">How FlowLock ensures AI agents generate correct UI</p>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rules.map((rule, index) => {
          const Icon = rule.icon
          return (
            <motion.div
              key={rule.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: rule.delay }}
              viewport={{ once: true, amount: 0.2 }}
              className="group relative"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-800/20 to-slate-900/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-5 backdrop-blur transition-all duration-300 hover:border-slate-600/50 hover:transform hover:scale-105">
                <div className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${rule.gradient} p-2.5 shadow-lg`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1.5">{rule.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{rule.desc}</p>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function OpenCoreSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-8">
      <GhostCard>
        <div className="p-6 text-center">
          <div className="text-xs tracking-widest text-slate-400 mb-2">OPEN CORE</div>
          <p className="text-slate-300">
            Free gets you the open schema and baseline checks locally. Pro unlocks Cloud live runs, IDE quick-fixes, autofix,
            and advanced checks. Enterprise adds SSO/SAML, private prompts/models, custom checks, on-prem relay, audit logs, and SLAs.
          </p>
        </div>
      </GhostCard>
    </section>
  )
}

export default function FlowLockLanding() {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [surface, setSurface] = useState<"cli" | "ide" | "web">("cli")

  const install = useMemo(() => {
    if (surface === "cli") return { label: "Install (CLI)", cmd: "npx uxcg init my-app" }
    if (surface === "ide") return { label: "Install (IDE Extension)", cmd: "code --install-extension flowlock.uxcg" }
    return { label: "Install (Cloud Project)", cmd: "curl -sSL https://flowlock.dev/init | bash" }
  }, [surface])

  return (
    <div className={`overflow-x-hidden min-h-screen ${bg} text-white`}>
      <Wizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Brand />
          <nav className="hidden md:flex items-center gap-8 text-slate-300">
            <a className="hover:text-white transition-colors" href="#how">
              How it works
            </a>
            <a className="hover:text-white transition-colors" href="#why">
              Why FlowLock
            </a>
            <a className="hover:text-white transition-colors" href="#ai">
              AI
            </a>
            <a className="hover:text-white transition-colors" href="#pricing">
              Pricing
            </a>
            <button onClick={() => setWizardOpen(true)} className="hover:text-white transition-colors">
              Demo
            </button>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:block">
              <GhostButton>
                <GitBranch className="w-4 h-4" /> GitHub
              </GhostButton>
            </div>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="group inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 px-3 py-2 text-xs sm:px-5 sm:py-3 sm:text-sm font-semibold text-white shadow-lg shadow-pink-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-pink-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50"
            >
              <span className="hidden sm:inline">Try the AI</span>
              <span className="sm:hidden">Try AI</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/50 bg-slate-950/95 backdrop-blur-xl">
            <nav className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-4 text-slate-300">
              <a
                className="hover:text-white transition-colors py-2"
                href="#how"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it works
              </a>
              <a
                className="hover:text-white transition-colors py-2"
                href="#why"
                onClick={() => setMobileMenuOpen(false)}
              >
                Why FlowLock
              </a>
              <a
                className="hover:text-white transition-colors py-2"
                href="#ai"
                onClick={() => setMobileMenuOpen(false)}
              >
                AI
              </a>
              <a
                className="hover:text-white transition-colors py-2"
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <button
                onClick={() => {
                  setWizardOpen(true)
                  setMobileMenuOpen(false)
                }}
                className="hover:text-white transition-colors py-2 text-left"
              >
                Demo
              </button>
              <div className="pt-2 border-t border-slate-800/50">
                <GhostButton>
                  <GitBranch className="w-4 h-4" /> GitHub
                </GhostButton>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:py-20">
        <div className="text-center">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <Pill>
                  <ShieldCheck className="w-4 h-4" /> Unit tests for UX
                </Pill>
                <Pill>
                  <Zap className="w-4 h-4" /> AI-native
                </Pill>
                <Pill>
                  <Gauge className="w-4 h-4" /> CI-enforced
                </Pill>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-center lg:text-left">
                Ship UI that{" "}
                <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400 bg-clip-text text-transparent">
                  can't break
                </span>
                .
              </h1>
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-8 text-center lg:text-left">
                FlowLock turns your PRD into a living contract. If a screen shows data nobody captured, or a flow
                dead-ends, the build fails. Agents & devs only ship UI that actually works.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                <PrimaryButton onClick={() => setWizardOpen(true)}>Try AI PRD Generator</PrimaryButton>
                <GhostButton>View docs</GhostButton>
              </div>

              <InstallBlock label={install.label} command={install.cmd} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, amount: 0.2 }}
              className="relative overflow-hidden"
            >
              <div className="absolute inset-0 z-0 rounded-3xl bg-gradient-to-tr from-pink-500/15 via-rose-500/15 to-fuchsia-500/15 blur-xl pointer-events-none" />
              <div className="relative z-10 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
                  <span className="inline-flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1">
                    <Workflow className="w-4 h-4" /> Guardrails
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1">
                    <Wand2 className="w-4 h-4" /> Generate UI
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
                    <div className="text-slate-300 text-sm font-medium mb-3">Checks</div>
                    <ul className="space-y-2">
                      <CheckItem>Form ↔ Card field traceability</CheckItem>
                      <CheckItem>Three-click reachability</CheckItem>
                      <CheckItem>Valid state transitions</CheckItem>
                      <CheckItem>Details page for creatables</CheckItem>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4">
                    <div className="text-slate-300 text-sm font-medium mb-3">Outputs</div>
                    <ul className="space-y-2">
                      <CheckItem>Mermaid ER & flow maps</CheckItem>
                      <CheckItem>Screen inventory CSV</CheckItem>
                      <CheckItem>Gherkin acceptance tests</CheckItem>
                      <CheckItem>Gap Report & auto-fixes</CheckItem>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Personas */}
      <PersonasSection />

      {/* Logos */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
          {["PolyForge", "Northwind", "Nova", "Atlas", "Fathom"].map((n) => (
            <div key={n} className="text-slate-500 text-sm font-medium">
              {n}
            </div>
          ))}
        </div>
      </section>

      {/* Surfaces */}
      <section className="mx-auto max-w-7xl px-4 py-20" id="how">
        <SectionTitle
          eyebrow="Surfaces"
          title="Use FlowLock wherever you work"
          kicker="CLI for power, IDE for guidance, Cloud for collaboration."
        />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {(
            [
              { k: "cli", label: "CLI" },
              { k: "ide", label: "IDE Extension" },
              { k: "web", label: "Cloud" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.k}
              onClick={() => setSurface(opt.k)}
              className={`rounded-full px-4 py-2 text-sm border transition-all duration-200 ${surface === opt.k ? "border-pink-500 bg-pink-500/10 text-white" : "border-slate-700/50 text-slate-400 hover:border-slate-600/50 hover:text-slate-300"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={TerminalSquare}
            title="Spec-first CLI"
            desc="Initialize guardrails, generate diagrams, and block bad commits. Works in any repo in minutes."
          />
          <FeatureCard
            icon={Wand2}
            title="IDE Co-pilot"
            desc="Cursor/Claude/VS Code integrate slash-commands so agents scaffold UI only once the contract is green."
          />
          <FeatureCard
            icon={Globe}
            title="Cloud Dashboard"
            desc="Review Gap Reports, flows, and traceability with your team. Enforce policies via GitHub Actions."
          />
        </div>

        <div className="mt-12 flex justify-center">
          <InstallBlock label={install.label} command={install.cmd} />
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-7xl px-4 py-20" id="why">
        <SectionTitle eyebrow="Why FlowLock" title="From pretty-but-useless to usable-by-default" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={ShieldCheck}
            title="Hard guardrails"
            desc="Blocks merges if flows or fields don't line up. It's CI for UX."
          />
          <FeatureCard
            icon={Layers}
            title="Single source of truth"
            desc="One compact spec ties role → JTBD → flow → screen → field. If it's not in the spec, it doesn't exist."
          />
          <FeatureCard
            icon={Rocket}
            title="Agent-native"
            desc="Your AI can't improvise; it reads the spec, passes validation, then generates UI that matches."
          />
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-4">
          <Stat kpi="-60%" label="rework on frontends" />
          <Stat kpi="3×" label="faster usable MVPs" />
          <Stat kpi=">95%" label="spec ↔ UI traceability" />
          <Stat kpi="0" label="dead-end flows shipped" />
        </div>
      </section>

      {/* Core Guarantees */}
      <CoreGuaranteesSection />

      {/* AI */}
      <section className="mx-auto max-w-7xl px-4 py-20" id="ai">
        <SectionTitle
          eyebrow="AI"
          title="Let AI do the heavy lifting"
          kicker="From idea → PRD → contract → UI, with audits and simulations."
        />
        
        {/* Three main AI capability categories with tabs */}
        <div className="mt-12">
          <AICapabilitiesSection />
        </div>
        
        {/* Agent Rules */}
        <AgentRulesRow />
        
        <div className="mt-12 flex items-center justify-center gap-4">
          <PrimaryButton onClick={() => setWizardOpen(true)}>Try AI PRD Generator</PrimaryButton>
          <GhostButton>See AI in action</GhostButton>
        </div>
      </section>

      {/* Live Sync */}
      <LiveSyncSection 
        onWatch={() => setWizardOpen(true)} 
        onOpenCloud={() => window.open('/cloud', '_blank')} 
      />

      {/* Open Core */}
      <OpenCoreSection />

      {/* Pricing */}
      <section className="mx-auto max-w-7xl px-4 py-20" id="pricing">
        <SectionTitle eyebrow="Pricing" title="Start free. Scale with your team." />
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <PriceCard
            plan="Starter"
            price="$0"
            cta="Get started"
            features={["CLI + validation", "Mermaid & CSV outputs", "Husky pre-commit", "Community support"]}
          />
          <PriceCard
            plan="Pro"
            price="$19"
            cta="Upgrade to Pro"
            popular
            features={["Cloud dashboard", "Gap Report auto-fix", "IDE extension", "Policies & templates"]}
          />
          <PriceCard
            plan="Enterprise"
            price="Custom"
            cta="Talk to sales"
            features={["SSO/SAML, SOC2", "Custom checks", "Private model prompts", "Premium support"]}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-5xl px-4 py-20" id="faq">
        <SectionTitle eyebrow="FAQ" title="Quick answers" />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur">
            <h4 className="font-semibold text-white mb-3">What exactly is the "contract"?</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              A tiny JSON spec that declares roles, jobs-to-be-done, flows, screens, fields and state rules. The UI must
              match it, or validation fails.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur">
            <h4 className="font-semibold text-white mb-3">Will it work with any stack?</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Yes. FlowLock is stack-agnostic. It generates docs and tests; your UI stack (Next.js, RN, desktop)
              consumes the spec.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur">
            <h4 className="font-semibold text-white mb-3">How do AI agents use it?</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              IDE slash-commands tell agents to fill the spec from your PRD, fix validation errors, then scaffold UI. No
              spec, no code.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur">
            <h4 className="font-semibold text-white mb-3">Can it auto-fix things?</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Yes—safe auto-fixes remove dishonest reads and suggest exact edits. The Cloud dashboard lets you apply or
              revert with one click.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-4 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <Brand />
          <p className="text-slate-500 text-sm text-center md:text-left">
            © {new Date().getFullYear()} FlowLock — UX that can't break.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
            <a className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
