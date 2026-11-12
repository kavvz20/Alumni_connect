import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

describe("Frontend Accessibility (A11y) & Semantic Structure Audit", () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const componentsDir = path.resolve(__dirname, "../src/components");

  it("verifies components directory exists and contains JSX views", () => {
    assert.ok(fs.existsSync(componentsDir), "Components directory should exist");
    const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith(".jsx"));
    assert.ok(files.length >= 10, "Should have core React components");
  });

  it("ensures Navbar includes navigation landmark semantics", () => {
    const navbarCode = fs.readFileSync(path.join(componentsDir, "Navbar.jsx"), "utf-8");
    assert.ok(
      navbarCode.includes("<header") || navbarCode.includes("role=\"banner\""),
      "Navbar should have <header> landmark element"
    );
    assert.ok(
      navbarCode.includes("<nav") || navbarCode.includes("role=\"navigation\"") || navbarCode.includes("aria-label"),
      "Navbar should have navigation landmarks or aria-labels"
    );
  });

  it("ensures PublicProfileView includes accessible heading hierarchy", () => {
    const profileCode = fs.readFileSync(path.join(componentsDir, "PublicProfileView.jsx"), "utf-8");
    assert.ok(profileCode.includes("<h1"), "Profile view should have top-level <h1> heading");
    assert.ok(profileCode.includes("<h3") || profileCode.includes("<h4"), "Profile view should have subheadings");
  });

  it("ensures images have alt attributes defined", () => {
    const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith(".jsx"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(componentsDir, file), "utf-8");
      const imgMatches = content.match(/<img\s+[^>]*>/g) || [];
      for (const imgTag of imgMatches) {
        assert.ok(
          imgTag.includes("alt="),
          `Image in ${file} should have alt attribute: ${imgTag}`
        );
      }
    }
  });

  it("verifies interactive icon buttons contain accessible titles or labels", () => {
    const navbarCode = fs.readFileSync(path.join(componentsDir, "Navbar.jsx"), "utf-8");
    assert.ok(navbarCode.includes("aria-label") || navbarCode.includes("title") || navbarCode.includes("alt"));
  });
});
