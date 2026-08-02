"use client";

import { Activity, Ambulance, ArrowLeft, CalendarClock, ClipboardList, Clock3, FileText, HeartPulse, IdCard, Pencil, Phone, Printer, Search, Trash2, UserRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { StatusPill, statusLabel } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/hooks/useLocale";
import type { Locale } from "@/i18n/locale";
import { translations } from "@/i18n/translations";
import { normalizePhone, splitPhone } from "@/lib/patient-values";
import { createSocket, type AppSocket } from "@/lib/socket";
import type { PatientData, PatientStatus, TimelineItem } from "@/lib/session";
import { cn } from "@/lib/utils";
import {
  addressValue,
  codedValue,
  dedupeTimeline,
  formatStaffDate,
  formatStaffDateTime,
  formatStaffTime,
  fullAddress,
  getEmptyValueLabel,
  requiredStaffFields,
  staffPhone,
  staffText,
  timelineLabel
} from "./staff-i18n";
import { useStaffStore } from "./store";

type Field = {
  key: string;
  label: string;
  value: (data: PatientData, locale: Locale) => string | undefined;
  required?: boolean;
  highlight?: keyof PatientData;
  wide?: boolean;
};
const editableFields = new Set<keyof PatientData>([
  "firstName",
  "lastName",
  "middleName",
  "dateOfBirth",
  "email",
  "phone",
  "nationality",
  "religion",
  "emergencyName",
  "emergencyPhone",
  "emergencyRelationship"
]);

function staffSections(locale: Locale): { title: string; icon: typeof UserRound; fields: Field[]; columns: string }[] {
  const fields = translations[locale].fields;
  const text = staffText[locale];
  return [
    {
      title: text.sections.patient,
      icon: UserRound,
      columns: "sm:grid-cols-2 2xl:grid-cols-3",
      fields: [
        { key: "firstName", label: fields.firstName, value: (data) => data.firstName, required: true, highlight: "firstName" },
        { key: "lastName", label: fields.lastName, value: (data) => data.lastName, required: true, highlight: "lastName" },
        { key: "middleName", label: fields.middleName, value: (data) => data.middleName, highlight: "middleName" },
        { key: "dateOfBirth", label: fields.dateOfBirth, value: (data, locale) => formatStaffDate(data.dateOfBirth, locale), required: true, highlight: "dateOfBirth" },
        { key: "gender", label: fields.gender, value: (data, locale) => codedValue("gender", data.gender, locale), required: true, highlight: "gender" },
        {
          key: "preferredLanguage",
          label: fields.preferredLanguage,
          value: (data, locale) => codedValue("preferredLanguage", data.preferredLanguage, locale),
          required: true,
          highlight: "preferredLanguage"
        },
        { key: "nationality", label: fields.nationality, value: (data) => data.nationality, required: true, highlight: "nationality" },
        { key: "religion", label: fields.religion, value: (data, locale) => codedValue("religion", data.religion, locale), highlight: "religion" }
      ]
    },
    {
      title: text.sections.contact,
      icon: Phone,
      columns: "sm:grid-cols-2",
      fields: [
        { key: "phone", label: fields.phone, value: (data) => staffPhone(data.phone), required: true, highlight: "phone" },
        { key: "email", label: fields.email, value: (data) => data.email, required: true, highlight: "email" },
        { key: "addressLine", label: text.addressLine, value: (data) => data.structuredAddress?.addressLine, required: true, highlight: "structuredAddress", wide: true },
        { key: "province", label: text.province, value: (data, locale) => addressValue(data.structuredAddress, "province", locale), required: true, highlight: "structuredAddress" },
        { key: "district", label: text.district, value: (data, locale) => addressValue(data.structuredAddress, "district", locale), required: true, highlight: "structuredAddress" },
        { key: "subdistrict", label: text.subdistrict, value: (data, locale) => addressValue(data.structuredAddress, "subdistrict", locale), required: true, highlight: "structuredAddress" },
        { key: "postalCode", label: text.postalCode, value: (data) => data.structuredAddress?.postalCode, required: true, highlight: "structuredAddress" },
        { key: "fullAddress", label: text.fullAddress, value: (data, locale) => fullAddress(data.structuredAddress, locale), required: true, highlight: "structuredAddress", wide: true }
      ]
    },
    {
      title: text.sections.emergency,
      icon: Ambulance,
      columns: "sm:grid-cols-2 2xl:grid-cols-3",
      fields: [
        { key: "emergencyName", label: fields.emergencyName, value: (data) => data.emergencyName, highlight: "emergencyName" },
        { key: "emergencyPhone", label: fields.emergencyPhone, value: (data) => staffPhone(data.emergencyPhone), highlight: "emergencyPhone" },
        {
          key: "emergencyRelationship",
          label: fields.emergencyRelationship,
          value: (data, locale) => codedValue("emergencyRelationship", data.emergencyRelationship, locale),
          highlight: "emergencyRelationship"
        }
      ]
    }
  ];
}

export function StaffView() {
  const params = useSearchParams();
  const socket = useRef<AppSocket | null>(null);
  const [query, setQuery] = useState("");
  const [connected, setConnected] = useState(false);
  const [highlightedField, setHighlightedField] = useState<TimelineItem["field"]>();
  const { locale, setLocale } = useLocale();
  const text = staffText[locale];
  const { sessions, selectedSessionId, snapshot, setSessions, upsertSummary, selectSession, setSnapshot, removeSession } = useStaffStore();

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
    next.on("staff:delete", ({ sessionId }) => removeSession(sessionId));
    next.on("session:unavailable", () => setSnapshot(null));
    return () => {
      next.disconnect();
    };
  }, [removeSession, setSessions, setSnapshot, upsertSummary]);

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

  function deleteSession(sessionId: string) {
    if (!window.confirm(text.deleteConfirm)) return;
    socket.current?.emit("staff:delete", { sessionId });
    removeSession(sessionId);
  }

  function editField(field: keyof PatientData, label: string, currentValue = "") {
    if (!selectedSessionId) return;
    const nextValue = window.prompt(`${text.editPrompt} ${label}`, currentValue);
    if (nextValue === null) return;
    const data: PatientData = field === "phone" || field === "emergencyPhone" ? makePhoneUpdate(field, nextValue) : { [field]: nextValue };
    socket.current?.emit("staff:update", { sessionId: selectedSessionId, data });
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? sessions.filter((s) => `${s.displayName} ${s.sessionId}`.toLowerCase().includes(needle)) : sessions;
  }, [query, sessions]);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950 lg:flex lg:h-dvh lg:flex-col lg:overflow-hidden">
      <header className="no-print shrink-0 border-b bg-white">
        <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <HeartPulse className="size-7" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{text.headerTitle}</h1>
              <p className="text-sm text-slate-600">{text.headerDescription}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher locale={locale} label={text.language} onChange={setLocale} />
            <ConnectionBadge connected={connected} locale={locale} />
            <Button type="button" variant="outline" className="h-11" onClick={() => window.print()} disabled={!snapshot}>
              <Printer className="size-4" />
              {text.print}
            </Button>
          </div>
        </div>
      </header>

      <main className="grid gap-5 px-4 py-5 sm:px-6 lg:min-h-0 lg:flex-1 lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden lg:px-8">
        <div className="no-print">
          <SummaryCards locale={locale} />
        </div>

        <div className="grid min-h-0 gap-5 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] xl:grid-cols-[minmax(260px,300px)_minmax(500px,1fr)_minmax(280px,340px)]">
          <aside className="no-print flex min-h-0 flex-col rounded-2xl border bg-white shadow-sm lg:h-full" aria-label={text.activeSessions}>
            <div className="shrink-0 grid gap-3 border-b p-4">
              <div>
                <h2 className="font-semibold">{text.activeSessions}</h2>
                <p className="text-sm text-slate-500">
                  {sessions.length} {text.currentSessions}
                </p>
              </div>
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" aria-hidden="true" />
                <Input className="pl-9" type="search" placeholder={text.search} aria-label={text.search} value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
            </div>
            <div className="grid min-h-0 content-start gap-2 overflow-y-auto p-3 lg:flex-1" role="list" aria-live="polite">
              {!sessions.length && <Empty title={text.noSessions} text={text.noSessionsText} />}
              {!!sessions.length && !visible.length && <Empty title={text.noMatches} />}
              {visible.map((session) => (
                <div
                  key={session.sessionId}
                  role="listitem"
                  className={cn(
                    "relative rounded-xl border p-3 pr-16 text-sm transition hover:border-blue-200 hover:bg-blue-50/40",
                    session.sessionId === selectedSessionId && "border-blue-600 bg-blue-50 shadow-sm"
                  )}
                >
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      type="button"
                      aria-label={`${text.edit}: ${session.displayName}`}
                      className="grid size-7 place-items-center rounded-md text-blue-700 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                      onClick={() => choose(session.sessionId)}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`${text.delete}: ${session.displayName}`}
                      className="grid size-7 place-items-center rounded-md text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                      onClick={() => deleteSession(session.sessionId)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-current={session.sessionId === selectedSessionId}
                    aria-label={`${text.selectPatient}: ${session.displayName}`}
                    onClick={() => choose(session.sessionId)}
                    className="grid w-full gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <span className="grid gap-1">
                      <strong className="text-base leading-tight">{session.displayName}</strong>
                      <span className="font-mono text-xs font-medium text-slate-600">{session.sessionId}</span>
                    </span>
                    <StatusPill status={session.status} locale={locale} />
                    <span className="text-slate-700">
                      {session.completedRequiredFields} / {session.totalRequiredFields} {text.requiredFields}
                    </span>
                    <span className="text-slate-600">
                      {[session.dateOfBirth && `${text.dob}: ${formatStaffDate(session.dateOfBirth, locale)}`, session.maskedPhone && `${text.phoneShort}: ${session.maskedPhone}`]
                        .filter(Boolean)
                        .join(" | ")}
                    </span>
                    <span className="text-xs text-slate-500">{formatStaffDateTime(session.lastUpdatedAt, locale)}</span>
                  </button>
                </div>
              ))}
            </div>
          </aside>

          <section className="min-w-0 rounded-2xl border bg-white shadow-sm">
            <Details highlightedField={highlightedField} locale={locale} onEdit={editField} />
          </section>

          <aside className="no-print flex min-h-0 flex-col rounded-2xl border bg-white shadow-sm lg:col-span-2 lg:h-full xl:col-span-1">
            <div className="shrink-0 border-b p-5">
              <h2 className="font-semibold">{text.activity}</h2>
            </div>
            <div className="grid max-h-[420px] min-h-0 content-start gap-2 overflow-y-auto p-3 text-sm lg:max-h-none lg:flex-1" tabIndex={0} aria-label={text.activity}>
              {snapshot?.timeline.length ? (
                dedupeTimeline(snapshot.timeline).map((item) => <TimelineRow key={`${item.at}-${item.text}`} item={item} locale={locale} />)
              ) : (
                <span className="text-slate-500">{text.selectActivity}</span>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function SummaryCards({ locale }: { locale: Locale }) {
  const { snapshot } = useStaffStore();
  const text = staffText[locale];
  const summary = snapshot?.summary;
  const cards = [
    { label: text.status, value: summary ? statusLabel(summary.status, locale) : text.notSelected, icon: Activity },
    { label: text.requiredFields, value: summary ? `${summary.completedRequiredFields} / ${summary.totalRequiredFields}` : text.notEnteredYet, icon: ClipboardList },
    { label: text.lastUpdated, value: summary ? formatStaffDateTime(summary.lastUpdatedAt, locale) : text.notEnteredYet, icon: Clock3 },
    { label: text.sessionId, value: summary?.sessionId || text.notEnteredYet, icon: IdCard }
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

function Details({
  highlightedField,
  locale,
  onEdit
}: {
  highlightedField?: TimelineItem["field"];
  locale: Locale;
  onEdit: (field: keyof PatientData, label: string, currentValue?: string) => void;
}) {
  const { sessions, selectedSessionId, snapshot, selectSession } = useStaffStore();
  const text = staffText[locale];

  if (!selectedSessionId) return <Empty title={text.selectPatient} text={text.selectPatientText} />;

  if (!sessions.some((session) => session.sessionId === selectedSessionId) && !snapshot) {
    return (
      <div className="grid gap-3 p-6">
        <Empty title={text.unavailable} text={text.unavailableText} />
        <Button
          className="w-fit"
          variant="outline"
          onClick={() => {
            selectSession("");
            window.history.replaceState(null, "", "/staff");
          }}
        >
          {text.returnList}
        </Button>
      </div>
    );
  }

  if (!snapshot) return <Empty title={text.loading} />;

  const { summary, data } = snapshot;
  return (
    <>
      <div className="no-print grid gap-3 border-b p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold">{summary.displayName}</h2>
            <p className="font-mono text-sm text-slate-600">
              {text.session} {summary.sessionId}
            </p>
          </div>
          <div className="ml-auto shrink-0 pt-1">
            <StatusPill status={summary.status} locale={locale} />
          </div>
        </div>
        {summary.submittedAt && (
          <p className="text-sm text-slate-500">
            {text.submittedAt}: {formatStaffDateTime(summary.submittedAt, locale)}
          </p>
        )}
        <p className="hidden text-sm text-slate-600 print:block">
          {text.generated}: {formatStaffDateTime(new Date().toISOString(), locale)}
        </p>
        <Button className="no-print mt-1 w-fit md:hidden" type="button" variant="outline" onClick={() => document.querySelector(`[aria-label="${text.activeSessions}"]`)?.scrollIntoView()}>
          <ArrowLeft className="size-4" />
          {text.back}
        </Button>
      </div>

      <div className="grid gap-4 p-4 sm:p-5">
        {staffSections(locale).map((section) => (
          <InfoSection key={section.title} section={section} data={data} status={summary.status} highlightedField={highlightedField} locale={locale} onEdit={onEdit} />
        ))}
      </div>
    </>
  );
}

function InfoSection({
  section,
  data,
  status,
  highlightedField,
  locale,
  onEdit
}: {
  section: ReturnType<typeof staffSections>[number];
  data: PatientData;
  status: PatientStatus;
  highlightedField?: TimelineItem["field"];
  locale: Locale;
  onEdit: (field: keyof PatientData, label: string, currentValue?: string) => void;
}) {
  const Icon = section.icon;
  return (
    <section className="rounded-2xl border bg-slate-50/60 p-4">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="size-5 text-blue-700" aria-hidden="true" />
        <h3 className="font-semibold">{section.title}</h3>
      </div>
      <dl className={cn("grid gap-3", section.columns)}>
        {section.fields.map((field) => {
          const raw = field.value(data, locale);
          const value = raw || getEmptyValueLabel({ status, required: field.required || (field.highlight ? requiredStaffFields.has(field.highlight) : false), locale });
          const active = highlightedField === field.highlight || (field.highlight === "structuredAddress" && highlightedField === "address");
          return (
            <div
              key={field.key}
              className={cn(
                "rounded-xl border bg-white p-3 transition-colors duration-1000 motion-reduce:transition-none",
                field.wide && "sm:col-span-2",
                active && "border-blue-300 bg-blue-50"
              )}
            >
              <dt className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <span>{field.label}</span>
                {field.highlight && editableFields.has(field.highlight) && (
                  <button
                    type="button"
                    className="no-print rounded px-1.5 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-blue-700 hover:bg-blue-50"
                    onClick={() => onEdit(field.highlight!, field.label, String(data[field.highlight!] || ""))}
                  >
                    {staffText[locale].edit}
                  </button>
                )}
              </dt>
              <dd className="mt-1 break-words text-base font-semibold text-slate-950">{value}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function TimelineRow({ item, locale }: { item: TimelineItem; locale: Locale }) {
  const Icon = item.field === "submit" ? FileText : item.field === "status" ? CalendarClock : Activity;
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-white p-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="min-w-0 leading-tight">
        <span className="font-semibold">{timelineLabel(item, locale)}</span>
        <br />
        <span className="text-xs leading-none text-slate-500">{formatStaffTime(item.at, locale)}</span>
      </p>
    </div>
  );
}

function makePhoneUpdate(field: "phone" | "emergencyPhone", value: string): PatientData {
  const phone = normalizePhone(value);
  const parts = splitPhone(phone);
  return field === "phone"
    ? { phone, phoneCountryCode: parts.countryCode, phoneNationalNumber: parts.nationalNumber }
    : { emergencyPhone: phone, emergencyPhoneCountryCode: parts.countryCode, emergencyPhoneNationalNumber: parts.nationalNumber };
}

function ConnectionBadge({ connected, locale }: { connected: boolean; locale: Locale }) {
  const text = staffText[locale];
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium",
        connected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      <span className={cn("size-2 rounded-full", connected ? "bg-emerald-600" : "bg-red-600")} />
      {connected ? text.connected : text.disconnected}
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
