"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Ambulance, ClipboardList, HeartPulse, Phone, UserRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/hooks/useLocale";
import { translations, type PatientTranslations } from "@/i18n/translations";
import { createPatientSchema, type PatientFormValues } from "@/lib/patient-schema";
import { createSocket, type AppSocket } from "@/lib/socket";
import { makeSessionId } from "@/lib/session";
import {
  formatStructuredAddress,
  makeStructuredAddress,
  normalizeGender,
  normalizePreferredLanguage,
  type StructuredAddress
} from "@/lib/patient-values";
import { getAddressRecord, getDistrictOptions, getProvinceOptions, getSubdistrictOptions } from "@/lib/thai-address";
import { cn } from "@/lib/utils";

type SyncState = "saving" | "synced" | "reconnecting" | "error";
type FieldName = keyof PatientFormValues;
type AddressParts = {
  addressLine: string;
  provinceCode: string;
  districtCode: string;
  subdistrictCode: string;
  postalCode: string;
};

const emptyAddress: AddressParts = {
  addressLine: "",
  provinceCode: "",
  districtCode: "",
  subdistrictCode: "",
  postalCode: ""
};
const emptyStructuredAddress: StructuredAddress = {
  addressLine: "",
  provinceCode: "",
  provinceTh: "",
  provinceEn: "",
  districtCode: "",
  districtTh: "",
  districtEn: "",
  subdistrictCode: "",
  subdistrictTh: "",
  subdistrictEn: "",
  postalCode: ""
};
const formDefaults: PatientFormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  structuredAddress: emptyStructuredAddress,
  preferredLanguage: "",
  nationality: "",
  religion: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelationship: ""
};

export function PatientForm() {
  const params = useSearchParams();
  const { locale, setLocale } = useLocale();
  const t = translations[locale];
  const [sessionId, setSessionId] = useState("");
  const [syncState, setSyncState] = useState<SyncState>("reconnecting");
  const [submitted, setSubmitted] = useState(false);
  const [address, setAddress] = useState<AddressParts>(emptyAddress);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socket = useRef<AppSocket | null>(null);
  const provinceOptions = useMemo(() => getProvinceOptions(locale), [locale]);
  const districtOptions = useMemo(() => getDistrictOptions(address.provinceCode, locale), [address.provinceCode, locale]);
  const subdistrictOptions = useMemo(() => getSubdistrictOptions(address.districtCode, locale), [address.districtCode, locale]);
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(createPatientSchema(locale)),
    mode: "onBlur",
    defaultValues: formDefaults
  });

  useEffect(() => {
    const nextSession = params.get("session") || localStorage.getItem("agn-session") || makeSessionId();
    localStorage.setItem("agn-session", nextSession);
    window.history.replaceState(null, "", `${window.location.pathname}?session=${nextSession}`);
    setSessionId(nextSession);
  }, [params]);

  useEffect(() => {
    if (!sessionId) return;
    const next = createSocket();
    socket.current = next;
    next.on("connect", () => {
      setSyncState("synced");
      next.emit("patient:join", { sessionId });
    });
    next.on("disconnect", () => setSyncState("reconnecting"));
    next.on("connect_error", () => setSyncState("error"));
    next.on("session:snapshot", (snapshot) => {
      const structuredAddress = snapshot.data.structuredAddress || emptyStructuredAddress;
      form.reset({
        ...formDefaults,
        ...snapshot.data,
        gender: normalizeGender(snapshot.data.gender),
        preferredLanguage: normalizePreferredLanguage(snapshot.data.preferredLanguage),
        structuredAddress
      });
      setAddress(
        snapshot.data.structuredAddress
          ? {
              addressLine: structuredAddress.addressLine,
              provinceCode: structuredAddress.provinceCode,
              districtCode: structuredAddress.districtCode,
              subdistrictCode: structuredAddress.subdistrictCode,
              postalCode: structuredAddress.postalCode
            }
          : emptyAddress
      );
    });
    return () => {
      next.disconnect();
    };
  }, [form, sessionId]);

  const emitUpdate = useMemo(
    () => (data: PatientFormValues) => {
      if (!socket.current?.connected) {
        setSyncState("reconnecting");
        return;
      }
      socket.current.emit("patient:update", { sessionId, data });
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSyncState("synced"), 600);
    },
    [sessionId]
  );

  useEffect(() => {
    const sub = form.watch((value) => emitUpdate(value as PatientFormValues));
    return () => sub.unsubscribe();
  }, [emitUpdate, form]);

  function submit() {
    if (!window.confirm(t.confirmSubmit)) return;
    socket.current?.emit("patient:submit", { sessionId });
    setSubmitted(true);
  }

  function focusFirstInvalidField() {
    window.setTimeout(() => {
      const field = document.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]');
      field?.focus();
    });
  }

  function commitAddress(next: AddressParts) {
    const structuredAddress = makeStructuredAddress(next.addressLine, next.subdistrictCode, next.postalCode);
    setAddress(next);
    form.setValue("structuredAddress", structuredAddress || emptyStructuredAddress, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted
    });
    form.setValue("address", structuredAddress ? formatStructuredAddress(structuredAddress) : "", {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted
    });
  }

  function updateAddress(part: keyof AddressParts, value: string) {
    commitAddress({ ...address, [part]: value });
  }

  function updateProvince(provinceCode: string) {
    commitAddress({ ...address, provinceCode, districtCode: "", subdistrictCode: "", postalCode: "" });
  }

  function updateDistrict(districtCode: string) {
    commitAddress({ ...address, districtCode, subdistrictCode: "", postalCode: "" });
  }

  function updateSubdistrict(subdistrictCode: string) {
    const selectedAddress = getAddressRecord(subdistrictCode);
    commitAddress({ ...address, subdistrictCode, postalCode: selectedAddress?.postalCode || "" });
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <HeartPulse className="size-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">{t.headerKicker}</p>
              <h1 className="text-xl font-semibold text-slate-950">{t.headerTitle}</h1>
            </div>
          </div>
          <LanguageSwitcher locale={locale} label={t.languageLabel} onChange={setLocale} />
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-2">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{t.pageTitle}</h2>
          <p className="max-w-2xl text-base text-slate-600">{t.pageDescription}</p>
          <AttentionStatus state={syncState} t={t} />
          {submitted && (
            <p className="mt-3 w-fit rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {t.submitSuccess}
            </p>
          )}
        </section>

        <form className="grid gap-5" onSubmit={form.handleSubmit(submit, focusFirstInvalidField)}>
          <Section icon={UserRound} title={t.sections.personal.title} description={t.sections.personal.description}>
            <Field name="firstName" label={t.fields.firstName} required register={form.register} errors={form.formState.errors} t={t} />
            <Field name="lastName" label={t.fields.lastName} required register={form.register} errors={form.formState.errors} t={t} />
            <Field name="middleName" label={t.fields.middleName} register={form.register} errors={form.formState.errors} optional t={t} />
            <Field name="dateOfBirth" label={t.fields.dateOfBirth} type="date" required register={form.register} errors={form.formState.errors} t={t} />
            <Field
              name="gender"
              label={t.fields.gender}
              required
              register={form.register}
              errors={form.formState.errors}
              options={t.options.genders}
              value={form.watch("gender")}
              onValueChange={(value) => form.setValue("gender", normalizeGender(value), { shouldDirty: true, shouldValidate: form.formState.isSubmitted })}
              t={t}
            />
            <Field
              name="preferredLanguage"
              label={t.fields.preferredLanguage}
              required
              register={form.register}
              errors={form.formState.errors}
              options={t.options.languages}
              searchable
              value={form.watch("preferredLanguage")}
              onValueChange={(value) => form.setValue("preferredLanguage", normalizePreferredLanguage(value), { shouldDirty: true, shouldValidate: form.formState.isSubmitted })}
              t={t}
            />
            <Field
              name="nationality"
              label={t.fields.nationality}
              required
              register={form.register}
              errors={form.formState.errors}
              t={t}
            />
            <Field
              name="religion"
              label={t.fields.religion}
              optional
              register={form.register}
              errors={form.formState.errors}
              options={t.options.religions}
              searchable
              value={form.watch("religion") || ""}
              onValueChange={(value) => form.setValue("religion", value, { shouldDirty: true, shouldValidate: form.formState.isSubmitted })}
              t={t}
            />
          </Section>

          <Section icon={Phone} title={t.sections.contact.title} description={t.sections.contact.description}>
            <Field name="phone" label={t.fields.phone} required register={form.register} errors={form.formState.errors} t={t} />
            <Field name="email" label={t.fields.email} type="email" required register={form.register} errors={form.formState.errors} t={t} />
            <AddressField
              label={t.addressFields.houseStreet}
              value={address.addressLine}
              onChange={(value) => updateAddress("addressLine", value)}
              error={form.formState.errors.structuredAddress?.addressLine?.message || form.formState.errors.address?.message}
              required
              className="sm:col-span-2"
              t={t}
            />
            <AddressField
              label={t.addressFields.province}
              value={address.provinceCode}
              onChange={updateProvince}
              error={form.formState.errors.structuredAddress?.provinceCode?.message || form.formState.errors.address?.message}
              options={provinceOptions}
              required
              t={t}
            />
            <AddressField
              label={t.addressFields.district}
              value={address.districtCode}
              onChange={updateDistrict}
              error={form.formState.errors.structuredAddress?.districtCode?.message || form.formState.errors.address?.message}
              options={districtOptions}
              disabled={!address.provinceCode}
              required
              t={t}
            />
            <AddressField
              label={t.addressFields.subdistrict}
              value={address.subdistrictCode}
              onChange={updateSubdistrict}
              error={form.formState.errors.structuredAddress?.subdistrictCode?.message || form.formState.errors.address?.message}
              options={subdistrictOptions}
              disabled={!address.districtCode}
              required
              t={t}
            />
            <AddressField
              label={t.addressFields.postalCode}
              value={address.postalCode}
              onChange={(value) => updateAddress("postalCode", value)}
              error={form.formState.errors.structuredAddress?.postalCode?.message || form.formState.errors.address?.message}
              readOnly={!!address.subdistrictCode}
              required
              t={t}
            />
          </Section>

          <Section icon={Ambulance} title={t.sections.emergency.title} description={t.sections.emergency.description}>
            <Field
              name="emergencyName"
              label={t.fields.emergencyName}
              optional
              register={form.register}
              errors={form.formState.errors}
              className="sm:col-span-2"
              t={t}
            />
            <Field
              name="emergencyRelationship"
              label={t.fields.emergencyRelationship}
              optional
              register={form.register}
              errors={form.formState.errors}
              options={t.options.relationships}
              value={form.watch("emergencyRelationship") || ""}
              onValueChange={(value) => form.setValue("emergencyRelationship", value, { shouldDirty: true, shouldValidate: form.formState.isSubmitted })}
              className="sm:col-span-2"
              t={t}
            />
            <Field
              name="emergencyPhone"
              label={t.fields.emergencyPhone}
              optional
              register={form.register}
              errors={form.formState.errors}
              className="sm:col-span-2"
              t={t}
            />
          </Section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              onClick={() => {
                form.reset();
                setAddress(emptyAddress);
                setSubmitted(false);
                socket.current?.emit("patient:clear", { sessionId });
              }}
            >
              {t.clearButton}
            </Button>
            <Button type="submit" className="h-11 w-full sm:w-auto">
              {t.submitButton}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children
}: {
  icon: typeof ClipboardList;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  optional,
  options,
  searchable,
  value,
  onValueChange,
  register,
  errors,
  t,
  className
}: {
  name: FieldName;
  label: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  options?: readonly { value: string; label: string }[];
  searchable?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  register: UseFormRegister<PatientFormValues>;
  errors: FieldErrors<PatientFormValues>;
  t: PatientTranslations;
  className?: string;
}) {
  const error = errors[name]?.message;
  const fieldId = useId();
  const labelId = `${fieldId}-label`;
  const errorId = `${fieldId}-error`;
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span id={labelId} className="text-sm font-semibold text-slate-800">
        {label} {required && <span className="text-red-600">{t.requiredSuffix}</span>}
        {optional && <span className="font-normal text-slate-500"> ({t.optionalLabel})</span>}
      </span>
      {options && searchable ? (
        <Combobox
          id={fieldId}
          labelId={labelId}
          errorId={error ? errorId : undefined}
          invalid={!!error}
          options={options}
          placeholder={`${t.selectPrefix} ${label.toLowerCase()}`}
          value={value || ""}
          onChange={onValueChange || (() => undefined)}
        />
      ) : options ? (
        <Combobox
          id={fieldId}
          labelId={labelId}
          errorId={error ? errorId : undefined}
          invalid={!!error}
          options={options}
          placeholder={`${t.selectPrefix} ${label.toLowerCase()}`}
          searchable={false}
          value={value || ""}
          onChange={onValueChange || (() => undefined)}
        />
      ) : (
        <Input id={fieldId} type={type} aria-describedby={error ? errorId : undefined} aria-invalid={!!error} {...register(name)} />
      )}
      <span id={errorId} className={cn("min-h-5 text-sm", error ? "text-red-600" : "invisible")}>{error ? String(error) : "."}</span>
    </label>
  );
}

function AddressField({
  label,
  value,
  onChange,
  error,
  required,
  options,
  disabled,
  readOnly,
  t,
  className
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  options?: readonly ComboboxOption[];
  disabled?: boolean;
  readOnly?: boolean;
  t: PatientTranslations;
  className?: string;
}) {
  const showError = !!error;
  const fieldId = useId();
  const labelId = `${fieldId}-label`;
  const errorId = `${fieldId}-error`;
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span id={labelId} className="text-sm font-semibold text-slate-800">
        {label} {required && <span className="text-red-600">{t.requiredSuffix}</span>}
      </span>
      {options ? (
        <Combobox
          id={fieldId}
          labelId={labelId}
          errorId={showError ? errorId : undefined}
          disabled={disabled}
          invalid={showError}
          options={options}
          placeholder={`${t.selectPrefix} ${label.toLowerCase()}`}
          value={value}
          onChange={onChange}
        />
      ) : (
        <Input
          id={fieldId}
          aria-describedby={showError ? errorId : undefined}
          aria-invalid={showError}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          readOnly={readOnly}
          className={readOnly ? "bg-slate-50 text-slate-700" : undefined}
        />
      )}
      <span id={errorId} className={cn("min-h-5 text-sm", showError ? "text-red-600" : "invisible")}>
        {showError ? String(error) : "."}
      </span>
    </label>
  );
}

function AttentionStatus({ state, t }: { state: SyncState; t: PatientTranslations }) {
  if (state === "synced" || state === "saving") return null;

  return (
    <span
      className={cn(
        "mt-3 inline-flex w-fit items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
        state === "reconnecting" && "border-amber-200 bg-amber-50 text-amber-700",
        state === "error" && "border-red-200 bg-red-50 text-red-700"
      )}
      role="status"
    >
      <AlertCircle className="size-4" aria-hidden="true" />
      {state === "error" ? t.unableToSync : t.reconnecting}
    </span>
  );
}
