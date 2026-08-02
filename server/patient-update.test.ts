import { describe, expect, it, vi } from "vitest";
import { formatStructuredAddress, makeStructuredAddress } from "../lib/patient-values";
import type { PatientData } from "../lib/session";
import { applyPatientUpdate, patientUpdatePayloadSchema } from "./patient-update";

const sessionIdA = "AGN-A12345";
const sessionIdB = "AGN-B12345";
const address = makeStructuredAddress("1 Main Street", "100101");

if (!address) throw new Error("Missing address fixture");

function processUpdate(input: unknown, sessions: Map<string, PatientData>, broadcast: (sessionId: string) => void) {
  const payload = patientUpdatePayloadSchema.safeParse(input);
  if (!payload.success) return false;
  const session = sessions.get(payload.data.sessionId);
  if (!session) return false;
  applyPatientUpdate(session, payload.data.data);
  broadcast(payload.data.sessionId);
  return true;
}

describe("patient:update validation", () => {
  it("accepts valid payloads and only updates the targeted whitelisted field", () => {
    const sessions = new Map<string, PatientData>([
      [sessionIdA, { firstName: "Ada" }],
      [sessionIdB, { firstName: "Grace" }]
    ]);
    const broadcast = vi.fn();

    expect(processUpdate({ sessionId: sessionIdA, data: { firstName: "Alan" } }, sessions, broadcast)).toBe(true);

    expect(sessions.get(sessionIdA)).toEqual({ firstName: "Alan" });
    expect(sessions.get(sessionIdB)).toEqual({ firstName: "Grace" });
    expect(broadcast).toHaveBeenCalledWith(sessionIdA);
  });

  it.each([
    ["unknown field", { notAField: "x" }],
    ["invalid field type", { firstName: 123 }],
    ["unsupported gender", { gender: "robot" }],
    ["unsupported preferred language", { preferredLanguage: "fr" }],
    ["invalid structured address", { structuredAddress: { ...address, postalCode: "99999" } }],
    ["constructor key", { constructor: "pollute", firstName: "Alan" }],
    ["prototype key", { prototype: "pollute", firstName: "Alan" }]
  ])("rejects %s without modifying or broadcasting", (_name, data) => {
    const sessions = new Map<string, PatientData>([[sessionIdA, { firstName: "Ada" }]]);
    const broadcast = vi.fn();

    expect(processUpdate({ sessionId: sessionIdA, data }, sessions, broadcast)).toBe(false);
    expect(sessions.get(sessionIdA)).toEqual({ firstName: "Ada" });
    expect(broadcast).not.toHaveBeenCalled();
  });

  it("rejects __proto__ keys without modifying or broadcasting", () => {
    const sessions = new Map<string, PatientData>([[sessionIdA, { firstName: "Ada" }]]);
    const broadcast = vi.fn();
    const data = JSON.parse('{"__proto__":{"polluted":true},"firstName":"Alan"}');

    expect(processUpdate({ sessionId: sessionIdA, data }, sessions, broadcast)).toBe(false);
    expect(sessions.get(sessionIdA)).toEqual({ firstName: "Ada" });
    expect(broadcast).not.toHaveBeenCalled();
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it("accepts matching structured address updates", () => {
    const sessions = new Map<string, PatientData>([[sessionIdA, {}]]);
    const broadcast = vi.fn();

    expect(
      processUpdate(
        {
          sessionId: sessionIdA,
          data: {
            structuredAddress: address,
            address: formatStructuredAddress(address)
          }
        },
        sessions,
        broadcast
      )
    ).toBe(true);

    expect(sessions.get(sessionIdA)).toEqual({ structuredAddress: address, address: formatStructuredAddress(address) });
    expect(broadcast).toHaveBeenCalledOnce();
  });
});
