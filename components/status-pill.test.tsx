import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "./status-pill";

describe("StatusPill", () => {
  it("renders status text, not color alone", () => {
    render(<StatusPill status="actively-filling" />);
    expect(screen.getByText("Actively filling")).toBeInTheDocument();
  });
});
