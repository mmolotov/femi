import "@testing-library/jest-dom/vitest";

// jsdom does not implement scrollTo; stub it so components that reset scroll stay quiet.
if (typeof window !== "undefined") {
  window.scrollTo = () => {};
}
