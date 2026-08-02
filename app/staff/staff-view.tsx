"use client";

import {
  Activity,
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  Clock3,
  FileText,
  HeartPulse,
  IdCard,
  Printer,
  Search,
  Shield,
  UserRound
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { StatusPill, statusLabel } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSocket, type AppSocket } from "@/lib/socket";
import { formatStructuredAddress } from "@/lib/patient-values";
import { dobLabel, updatedLabel, type PatientData, type TimelineItem } from "@/lib/session";
import { cn } from "@/lib/utils";
import { useStaffStore } from "./store";

type FieldKey = keyof PatientData;

const sections: {
  title: string;
  icon: typeof UserRound;
  fields: [FieldKey, string][];
}[] = [
  {
    title: "Personal Information",
    icon: UserRound,
    fields: [
      ["firstName", "First Name"],
      ["middleName", "Middle Name"],
      ["lastName", "Last Name"],
      ["dateOfBirth", "Date of Birth"],
      ["gender", "Gender"]
    ]
  },
  {
    title: "Contact Information",
    icon: IdCard,
    fields: [
      ["phone", "Phone Number"],
      ["email", "Email"],
      ["address", "Address"]
    ]
  },
  {
    title: "Additional Information",
    icon: ClipboardList,
    fields: [
      ["preferredLanguage", "Preferred Language"],
      ["nationality", "Nationality"],
      ["religion", "Religion"]
    ]
  },
  {
    title: "Emergency Contact",
    icon: Shield,
    fields: [
      ["emergencyName", "Emergency Contact Name"],
      ["emergencyPhone", "Emergency Contact Phone"],
      ["emergencyRelationship", "Emergency Contact Relationship"]
    ]
  }
];

export function StaffView() {
  const params = useSearchParams();
  const socket = useRef<AppSocket | null>(null);
  const [query, setQuery] = useState("");
  const [connected, setConnected] = useState(false);
  const [highlightedField, setHighlightedField] = useState<TimelineItem["field"]>();
  const { sessions, selectedSessionId, snapshot, setSessions, upsertSummary, selectSession, setSnapshot } = useStaffStore();

  useEffect(() => {
    const next = createSocket();
    socket.current = next;
    next.on("connect", () => {
      setConnected(true);
      next.emit("staff:join");
    });
    next.on("disconnect", () => setConnected(false));
    next.on("session:list", setSessions);
    next.on("session:summary-updated", upsertSummary);
    next.on("session:snapshot", setSnapshot);
    next.on("patient:update", (payload) => {
      setSnapshot(payload);
      flashField(payload.timeline[0]?.field);
    });
    next.on("patient:submit", setSnapshot);
    next.on("patient:clear", setSnapshot);
    next.on("session:unavailable", () => setSnapshot(null));
    return () => {
      next.disconnect();
    };
  }, [setSessions, setSnapshot, upsertSummary]);

  useEffect(() => {
    const id = params.get("session");
    if (id) choose(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    if (connected && selectedSessionId) socket.current?.emit("session:selected", { sessionId: selectedSessionId });
  }, [connected, selectedSessionId]);

  function flashField(field?: TimelineItem["field"]) {
    if (!field || field === "status" || field === "submit" || field === "clear") return;
    setHighlightedField(field);
    window.setTimeout(() => setHighlightedField(undefined), 1000);
  }

  function choose(sessionId: string) {
    selectSession(sessionId);
    window.history.replaceState(null, "", `/staff?session=${sessionId}`);
    socket.current?.emit("session:selected", { sessionId });
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? sessions.filter((s) => `${s.displayName} ${s.sessionId}`.toLowerCase().includes(needle)) : sessions;
  }, [query, sessions]);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950">
      <header className="no-print border-b bg-white">
        <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <HeartPulse className="size-7" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Patient Intake Monitor</h1>
              <p className="text-sm text-slate-600">Monitor patient information and form activity in real time.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ConnectionBadge connected={connected} />
            <Button type="button" variant="outline" className="h-11" onClick={() => window.print()} disabled={!snapshot}>
              <Printer className="size-4" />
              Print / Save as PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="grid gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <SummaryCards />

        <div className="grid gap-5 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] xl:grid-cols-[minmax(260px,300px)_minmax(500px,1fr)_minmax(280px,340px)]">
          <aside className="no-print rounded-2xl border bg-white shadow-sm" aria-label="Active patient sessions">
            <div className="grid gap-3 border-b p-4">
              <div>
                <h2 className="font-semibold">Active Patient Sessions</h2>
                <p className="text-sm text-slate-500">{sessions.length} current sessions</p>
              </div>
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" aria-hidden="true" />
                <Input
                  className="pl-9"
                  type="search"
                  placeholder="Search patient or session"
                  aria-label="Search patient or session"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
            <div className="grid gap-2 overflow-auto p-3 lg:max-h-[calc(100dvh-286px)]" role="list" aria-live="polite">
              {!sessions.length && (
                <Empty title="No active patient sessions" text="Patient sessions will appear when a patient opens the information form." />
              )}
              {!!sessions.length && !visible.length && <Empty title="No matching patient sessions" />}
              {visible.map((session) => (
                <button
                  key={session.sessionId}
                  type="button"
                  role="listitem"
                  aria-current={session.sessionId === selectedSessionId}
                  onClick={() => choose(session.sessionId)}
                  className={cn(
                    "grid gap-2 rounded-xl border p-3 text-left text-sm transition hover:border-blue-200 hover:bg-blue-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600",
                    session.sessionId === selectedSessionId && "border-blue-600 bg-blue-50 shadow-sm"
                  )}
                >
                  <span className="grid gap-1">
                    <strong className="text-base leading-tight">{session.displayName}</strong>
                    <span className="font-mono text-xs font-medium text-slate-600">{session.sessionId}</span>
                  </span>
                  <StatusPill status={session.status} />
                  <span className="text-slate-700">
                    {session.completedRequiredFields} / {session.totalRequiredFields} required fields
                  </span>
                  <span className="text-slate-600">
                    {[session.dateOfBirth && `DOB: ${dobLabel(session.dateOfBirth)}`, session.maskedPhone && `Phone: ${session.maskedPhone}`]
                      .filter(Boolean)
                      .join(" | ")}
                  </span>
                  <span className="text-xs text-slate-500">{updatedLabel(session.lastUpdatedAt)}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-2xl border bg-white shadow-sm">
            <Details highlightedField={highlightedField} />
          </section>

          <aside className="rounded-2xl border bg-white shadow-sm lg:col-span-2 xl:col-span-1">
            <div className="border-b p-5">
              <h2 className="font-semibold">Activity Timeline</h2>
            </div>
            <div className="grid gap-3 p-4 text-sm lg:max-h-[calc(100dvh-286px)] lg:overflow-auto xl:max-h-[calc(100dvh-220px)]">
              {snapshot?.timeline.length ? (
                snapshot.timeline.map((item) => <TimelineRow key={`${item.at}-${item.text}`} item={item} />)
              ) : (
                <span className="text-slate-500">Select a patient session to view activity.</span>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function SummaryCards() {
  const { snapshot } = useStaffStore();
  const summary = snapshot?.summary;
  const cards = [
    { label: "Form Status", value: summary ? statusLabel(summary.status) : "No patient selected", icon: Activity },
    {
      label: "Required Fields",
      value: summary ? `${summary.completedRequiredFields} / ${summary.totalRequiredFields}` : "--",
      icon: ClipboardList
    },
    { label: "Last Updated", value: summary ? updatedLabel(summary.lastUpdatedAt).replace("Updated ", "") : "--", icon: Clock3 },
    { label: "Session ID", value: summary?.sessionId || "--", icon: IdCard }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Icon className="size-4 text-blue-700" aria-hidden="true" />
            {label}
          </div>
          <p className="truncate text-lg font-semibold text-slate-950">{value}</p>
        </div>
      ))}
    </section>
  );
}

function Details({ highlightedField }: { highlightedField?: TimelineItem["field"] }) {
  const { sessions, selectedSessionId, snapshot, selectSession } = useStaffStore();

  if (!selectedSessionId) {
    return <Empty title="Select a patient session" text="Choose a patient from the list to monitor their information." />;
  }

  if (!sessions.some((session) => session.sessionId === selectedSessionId) && !snapshot) {
    return (
      <div className="grid gap-3 p-6">
        <Empty title="Patient session unavailable" text="This session may have expired or is no longer active." />
        <Button
          className="w-fit"
          variant="outline"
          onClick={() => {
            selectSession("");
            window.history.replaceState(null, "", "/staff");
          }}
        >
          Return to active sessions
        </Button>
      </div>
    );
  }

  if (!snapshot) return <Empty title="Loading patient session" />;

  const { summary, data } = snapshot;
  return (
    <>
      <div className="grid gap-3 border-b p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{summary.displayName}</h2>
            <p className="font-mono text-sm text-slate-600">Session {summary.sessionId}</p>
          </div>
          <StatusPill status={summary.status} />
        </div>
        <p className="text-sm text-slate-500">{updatedLabel(summary.lastUpdatedAt)}</p>
        {summary.submittedAt && <p className="text-sm text-slate-500">Submission time: {new Date(summary.submittedAt).toLocaleString()}</p>}
        <p className="hidden print:block text-sm text-slate-600">Generated: {new Date().toLocaleString()}</p>
        <Button
          className="no-print mt-1 w-fit md:hidden"
          type="button"
          variant="outline"
          onClick={() => document.querySelector("[aria-label='Active patient sessions']")?.scrollIntoView()}
        >
          <ArrowLeft className="size-4" />
          Back to patient list
        </Button>
      </div>

      <div className="grid gap-4 p-4 sm:p-5">
        <div className="hidden print:block">
          <h1 className="text-2xl font-semibold">AGNOS Patient Intake</h1>
          <h2 className="text-lg font-semibold">Patient Information Summary</h2>
        </div>
        {sections.map((section) => (
          <InfoSection key={section.title} section={section} data={data} highlightedField={highlightedField} />
        ))}
      </div>
    </>
  );
}

function InfoSection({
  section,
  data,
  highlightedField
}: {
  section: (typeof sections)[number];
  data: PatientData;
  highlightedField?: TimelineItem["field"];
}) {
  const Icon = section.icon;
  return (
    <section className="rounded-2xl border bg-slate-50/60 p-4">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="size-5 text-blue-700" aria-hidden="true" />
        <h3 className="font-semibold">{section.title}</h3>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {section.fields.map(([field, label]) => {
          const raw = data[field];
          const value =
            field === "dateOfBirth" && typeof raw === "string"
              ? dobLabel(raw)
              : typeof raw === "object"
                ? formatStructuredAddress(raw)
                : raw || "Not provided";
          const active = highlightedField === field;
          return (
            <div
              key={field}
              className={cn(
                "rounded-xl border bg-white p-3 transition-colors duration-1000 motion-reduce:transition-none",
                active && "border-blue-300 bg-blue-50"
              )}
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="mt-1 break-words text-base font-semibold text-slate-950">{value}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const Icon = item.field === "submit" ? FileText : item.field === "status" ? CalendarClock : Activity;
  return (
    <div className="flex gap-3 rounded-xl border bg-white p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p>
        <span className="font-medium">{item.text}</span>
        <br />
        <span className="text-xs text-slate-500">{new Date(item.at).toLocaleTimeString()}</span>
      </p>
    </div>
  );
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium",
        connected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      <span className={cn("size-2 rounded-full", connected ? "bg-emerald-600" : "bg-red-600")} />
      {connected ? "Connected" : "Disconnected"}
    </span>
  );
}

function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="grid min-h-56 place-items-center p-6 text-center text-slate-600">
      <div className="grid max-w-sm justify-items-center gap-2">
        <ClipboardList className="size-10 text-blue-700" aria-hidden="true" />
        <h3 className="font-semibold text-slate-950">{title}</h3>
        {text && <p className="text-sm">{text}</p>}
      </div>
    </div>
  );
}
