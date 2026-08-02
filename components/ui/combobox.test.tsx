import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Combobox, type ComboboxOption } from "./combobox";

const options: ComboboxOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" }
];

afterEach(cleanup);

function StatefulCombobox({ searchable = true }: { searchable?: boolean }) {
  const [value, setValue] = useState("banana");
  return (
    <>
      <label id="fruit-label">Fruit</label>
      <p id="fruit-error">Fruit is required</p>
      <Combobox
        id="fruit"
        labelId="fruit-label"
        errorId="fruit-error"
        value={value}
        options={options}
        placeholder="Choose fruit"
        searchable={searchable}
        invalid
        onChange={setValue}
      />
    </>
  );
}

describe("Combobox accessibility", () => {
  it("puts combobox semantics on the focused search input", () => {
    render(<StatefulCombobox />);

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    const search = screen.getAllByRole("combobox", { name: "Fruit" }).find((element) => element.tagName === "INPUT");
    expect(search).toBeDefined();
    expect(search).toHaveAttribute("aria-expanded", "true");
    expect(search).toHaveAttribute("aria-autocomplete", "list");
    expect(search).toHaveAttribute("aria-haspopup", "listbox");
    expect(search).toHaveAttribute("aria-invalid", "true");
    expect(search).toHaveAttribute("aria-describedby", "fruit-error");
    expect(search).toHaveAccessibleDescription("Fruit is required");

    const listboxId = search?.getAttribute("aria-controls");
    expect(listboxId).toBe("fruit-listbox");
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("id", listboxId);

    const listOptions = within(listbox).getAllByRole("option");
    expect(listOptions).toHaveLength(3);
    expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(search!, { key: "ArrowDown" });
    expect(search).toHaveAttribute("aria-activedescendant", "fruit-listbox-banana");

    fireEvent.keyDown(search!, { key: "ArrowDown" });
    expect(search).toHaveAttribute("aria-activedescendant", "fruit-listbox-cherry");

    fireEvent.keyDown(search!, { key: "Enter" });
    fireEvent.click(screen.getByRole("combobox", { name: "Fruit" }));
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(screen.getAllByRole("combobox", { name: "Fruit" }).find((element) => element.tagName === "INPUT")!, {
      key: "Escape"
    });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("uses the placeholder as an accessible fallback name", () => {
    render(<Combobox value="" options={options} placeholder="Choose fruit" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("combobox", { name: "Choose fruit" }));
    expect(screen.getAllByRole("combobox", { name: "Choose fruit" }).some((element) => element.tagName === "INPUT")).toBe(true);
  });

  it("keeps non-searchable selection keyboard accessible", () => {
    render(<StatefulCombobox searchable={false} />);

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });

    fireEvent.click(screen.getByRole("combobox", { name: "Fruit" }));
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("aria-selected", "true");
  });
});
