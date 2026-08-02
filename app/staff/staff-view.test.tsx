import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeStructuredAddress } from "@/lib/patient-values";
import { useStaffStore } from "./store";
import { StaffView } from "./staff-view";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams()
}));

vi.mock("@/lib/socket", () => ({
  createSocket: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  })
}));

const address = makeStructuredAddress("1 Main Street", "100101");
if (!address) throw new Error("Missing address fixture");

const summary = {
  sessionId: "AGN-A12345",
  displayName: "Ada Lovelace",
  maskedPhone: "•••• 7890",
  dateOfBirth: "1990-01-01",
  status: "actively-filling" as const,
  completedRequiredFields: 9,
  totalRequiredFields: 9,
  lastUpdatedAt: "2026-08-02T10:00:00.000Z"
};

const snapshot = {
  summary,
  data: {
    firstName: "Ada",
    lastName: "Lovelace",
    dateOfBirth: "1990-01-01",
    gender: "female",
    preferredLanguage: "en",
    phone: "0812345678",
    email: "ada@example.com",
    nationality: "British",
    structuredAddress: address,
    address: "unused"
  },
  timeline: [
    { at: "2026-08-02T10:00:00.000Z", text: "First Name updated", field: "firstName" as const },
    { at: "2026-08-02T10:00:01.000Z", text: "Form submitted", field: "submit" as const }
  ]
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("agnos-locale", "en");
  useStaffStore.setState({ sessions: [summary], selectedSessionId: summary.sessionId, snapshot });
});

afterEach(cleanup);

describe("StaffView rendering", () => {
  it("renders translated controls and accessible monitoring regions", async () => {
    render(<StaffView />);

    expect(await screen.findByRole("heading", { name: "Patient Intake Monitor" })).toBeInTheDocument();
    expect(screen.getByLabelText("Language")).toBeInTheDocument();
    expect(screen.getByLabelText("Active Patient Sessions")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search patient or session" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select a patient session: Ada Lovelace" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /Print \/ Save as PDF/ })).toBeEnabled();

    const timeline = screen.getByLabelText("Activity Timeline");
    expect(timeline).toHaveAttribute("tabindex", "0");
    expect(timeline).toHaveClass("overflow-y-auto", "min-h-0");
  });

  it.each([375, 430, 768, 1024, 1280, 1440, 1920])("renders core staff regions at %ipx", async (width) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    window.dispatchEvent(new Event("resize"));

    render(<StaffView />);
    await screen.findByRole("heading", { name: "Patient Intake Monitor" });

    expect(screen.getByLabelText("Active Patient Sessions")).toBeInTheDocument();
    expect(screen.getByText("Patient Information")).toBeInTheDocument();
    expect(screen.getByText("Contact & Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Activity Timeline")).toBeInTheDocument();
  });

  it("keeps responsive classes for mobile, tablet, and desktop layouts", async () => {
    render(<StaffView />);
    await screen.findByRole("heading", { name: "Patient Intake Monitor" });

    const mainLayout = screen.getByLabelText("Active Patient Sessions").parentElement;
    expect(mainLayout).toHaveClass("grid", "lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]", "xl:grid-cols-[minmax(260px,300px)_minmax(500px,1fr)_minmax(280px,340px)]");
    expect(screen.getByLabelText("Activity Timeline").parentElement).toHaveClass("lg:col-span-2", "xl:col-span-1");
  });

  it("marks non-print regions and leaves only detail sections printable", async () => {
    render(<StaffView />);
    await screen.findByRole("heading", { name: "Patient Intake Monitor" });

    expect(screen.getByRole("banner")).toHaveClass("no-print");
    expect(screen.getByLabelText("Active Patient Sessions")).toHaveClass("no-print");
    expect(screen.getByLabelText("Activity Timeline").parentElement).toHaveClass("no-print");
    expect(screen.getByText("Patient Information")).toBeInTheDocument();
    expect(screen.getByText("Contact & Address")).toBeInTheDocument();
    expect(screen.getByText("Emergency Contact")).toBeInTheDocument();
  });

  it("restores Thai locale and translated timeline labels", async () => {
    localStorage.setItem("agnos-locale", "th");
    render(<StaffView />);

    await waitFor(() => expect(screen.getByLabelText("ภาษา")).toBeInTheDocument());
    expect(screen.getByLabelText("ไทม์ไลน์กิจกรรม")).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("ส่งแบบฟอร์มแล้ว")).toBeInTheDocument();
  });
});
