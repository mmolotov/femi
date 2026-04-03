// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App shell", () => {
  it("renders the compact brand header", async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "FEMI" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Settings" })).toBeInTheDocument();
  });

  it("renders the language selector on the settings screen", async () => {
    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Language" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Русский/i })).toBeInTheDocument();
  });
});
