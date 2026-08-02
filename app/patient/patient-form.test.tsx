import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatStructuredAddress, makeStructuredAddress } from "@/lib/patient-values";
import type { SessionSnapshot } from "@/lib/session";
import { PatientForm } from "./patient-form";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams()
}));

const sockets: MockSocket[] = [];

class MockSocket {
  connected = true;
  handlers: Record<string, (payload?: unknown) => void> = {};
  emitted: { event: string; payload?: unknown }[] = [];

  on(event: string, handler: (payload?: unknown) => void) {
    this.handlers[event] = handler;
    if (event === "connect") queueMicrotask(() => handler());
  }

  emit(event: string, payload?: unknown) {
    this.emitted.push({ event, payload });
  }

  disconnect() {
    this.connected = false;
  }
}

vi.mock("@/lib/socket", () => ({
  createSocket: () => {
    const socket = new MockSocket();
    sockets.push(socket);
    return socket;
  }
}));

function submittedSnapshot(sessionId = "AGN-A12345"): SessionSnapshot {
  const structuredAddress = makeStructuredAddress("1 Main Street", "100101");
  if (!structuredAddress) throw new Error("Missing address fixture");
  return {
    summary: {
      sessionId,
      displayName: "Ada Lovelace",
      maskedPhone: "•••• 5678",
      dateOfBirth: "1990-01-01",
      status: "submitted",
      completedRequiredFields: 9,
      totalRequiredFields: 9,
      lastUpdatedAt: "2026-08-02T10:00:00.000Z",
      submittedAt: "2026-08-02T10:01:00.000Z"
    },
    data: {
      firstName: "Ada",
      lastName: "Lovelace",
      dateOfBirth: "1990-01-01",
      gender: "female",
      phone: "0812345678",
      email: "ada@example.com",
      address: formatStructuredAddress(structuredAddress),
      structuredAddress,
      preferredLanguage: "en",
      nationality: "Thai"
    },
    timeline: []
  };
}

beforeEach(() => {
  sockets.length = 0;
  localStorage.clear();
  localStorage.setItem("agnos-locale", "en");
  localStorage.setItem("agn-session", "AGN-A12345");
});

afterEach(cleanup);

describe("PatientForm submission flow", () => {
  it("shows the success screen after the server confirms submission", async () => {
    render(<PatientForm />);

    sockets[0].handlers["patient:submit"](submittedSnapshot());

    expect(await screen.findByRole("heading", { name: "Information submitted successfully" })).toBeInTheDocument();
    expect(screen.getByText("Your information has been sent to the staff.")).toBeInTheDocument();
    expect(screen.getByText("AGN-A12345")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register another patient" })).toBeInTheDocument();
  });

  it("locks the submitted form by replacing editable fields", async () => {
    render(<PatientForm />);
    sockets[0].handlers["session:snapshot"](submittedSnapshot());

    expect(await screen.findByRole("heading", { name: "Information submitted successfully" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/First Name/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit Patient Information" })).not.toBeInTheDocument();
  });

  it("keeps the success screen after refreshing a submitted session", async () => {
    render(<PatientForm />);
    sockets[0].handlers["session:snapshot"](submittedSnapshot("AGN-A12345"));

    await waitFor(() => expect(screen.getAllByText("AGN-A12345").length).toBeGreaterThan(0));
    expect(screen.getByRole("heading", { name: "Information submitted successfully" })).toBeInTheDocument();
  });

  it("starts a new empty session without overwriting the submitted one", async () => {
    render(<PatientForm />);
    sockets[0].handlers["patient:submit"](submittedSnapshot("AGN-A12345"));
    const oldSession = localStorage.getItem("agn-session");

    fireEvent.click(await screen.findByRole("button", { name: "Register another patient" }));

    await waitFor(() => expect(localStorage.getItem("agn-session")).not.toBe(oldSession));
    await waitFor(() => expect(screen.getAllByRole("heading", { name: "Patient Information Form" }).length).toBeGreaterThan(0));
    expect(screen.getByRole("button", { name: "Submit Patient Information" })).toBeInTheDocument();
    await waitFor(() =>
      expect(
        sockets.at(-1)?.emitted.some((item) => item.event === "patient:join" && (item.payload as { sessionId?: string })?.sessionId !== oldSession)
      ).toBe(true)
    );
  });
});
