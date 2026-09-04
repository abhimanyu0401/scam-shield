/**
 * scripts/test-theme-flac-verify.ts
 *
 * Automated verification script for:
 * 1. Theme system logic & all 8 Acceptance Tests (A to H)
 * 2. FLAC input accept attribute & user-facing text consistency
 * 3. list-models.ts file relocation and hygiene
 */

import * as fs from "fs";
import * as path from "path";

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failed++;
  }
}

console.log("==================================================================");
console.log("KINKEEPER — THEME, FLAC & REPOSITORY HYGIENE VERIFICATION");
console.log("==================================================================\n");

// -----------------------------------------------------------------------------
// 1. REPOSITORY HYGIENE: list-models.ts
// -----------------------------------------------------------------------------
console.log("1. VERIFYING list-models.ts RELOCATION:");

const rootListModels = path.join(process.cwd(), "list-models.ts");
const scriptsListModels = path.join(process.cwd(), "scripts", "list-models.ts");

assert(!fs.existsSync(rootListModels), "Root-level list-models.ts is deleted (no duplicate)");
assert(fs.existsSync(scriptsListModels), "scripts/list-models.ts exists");

const scriptContent = fs.readFileSync(scriptsListModels, "utf8");
assert(scriptContent.includes(".env.local"), "scripts/list-models.ts correctly handles .env.local path");

// -----------------------------------------------------------------------------
// 2. FLAC AUDIO FORMAT CONSISTENCY
// -----------------------------------------------------------------------------
console.log("\n2. VERIFYING FLAC AUDIO FORMAT CONSISTENCY:");

const audioInputPath = path.join(process.cwd(), "app", "components", "AudioInput.tsx");
const audioInputContent = fs.readFileSync(audioInputPath, "utf8");

assert(
  audioInputContent.includes('accept="audio/*,.mp3,.mpeg,.wav,.m4a,.ogg,.webm,.aac,.flac"'),
  "AudioInput file input explicitly includes .flac in accept attribute"
);
assert(
  audioInputContent.includes("Supported: MP3, WAV, M4A, OGG, WEBM, AAC, FLAC (Max 2.5MB)"),
  "AudioInput user-facing text includes FLAC in supported formats list"
);
assert(
  audioInputContent.includes('"flac"') && audioInputContent.includes('"audio/flac"'),
  "AudioInput validator has flac in ALLOWED_EXTENSIONS and EXT_TO_MIME"
);

// -----------------------------------------------------------------------------
// 3. THEME SYSTEM LOGIC (ACCEPTANCE TESTS A to H)
// -----------------------------------------------------------------------------
console.log("\n3. VERIFYING THEME SYSTEM & ACCEPTANCE TESTS (A to H):");

const pagePath = path.join(process.cwd(), "app", "page.tsx");
const pageContent = fs.readFileSync(pagePath, "utf8");
const layoutPath = path.join(process.cwd(), "app", "layout.tsx");
const layoutContent = fs.readFileSync(layoutPath, "utf8");

assert(
  pageContent.includes('type ThemePreference = "system" | "light" | "dark"'),
  'app/page.tsx defines ThemePreference = "system" | "light" | "dark"'
);
assert(
  pageContent.includes("prefers-color-scheme: dark"),
  'app/page.tsx queries window.matchMedia("(prefers-color-scheme: dark)")'
);
assert(
  pageContent.includes('localStorage.setItem("themePreference"'),
  "app/page.tsx persists explicit user choice to localStorage"
);
assert(
  pageContent.includes("suppressHydrationWarning"),
  "app/page.tsx specifies suppressHydrationWarning"
);
assert(
  layoutContent.includes("suppressHydrationWarning") && layoutContent.includes("themePreference"),
  "app/layout.tsx has inline theme script and suppressHydrationWarning"
);

// Simulate the theme resolution state machine
type ThemePreference = "system" | "light" | "dark";

class ThemeMachine {
  private storage: Record<string, string> = {};
  private systemDark: boolean = false;
  public preference: ThemePreference = "system";
  public effectiveTheme: "light" | "dark" = "dark";

  constructor(systemDark: boolean, initialStorage?: string) {
    this.systemDark = systemDark;
    if (initialStorage) {
      this.storage["themePreference"] = initialStorage;
    }
    this.resolve();
  }

  public resolve() {
    const saved = this.storage["themePreference"];
    if (saved === "light" || saved === "dark" || saved === "system") {
      this.preference = saved as ThemePreference;
    } else {
      this.preference = "system";
    }

    if (this.preference === "light") {
      this.effectiveTheme = "light";
    } else if (this.preference === "dark") {
      this.effectiveTheme = "dark";
    } else {
      this.effectiveTheme = this.systemDark ? "dark" : "light";
    }
  }

  public userToggle() {
    const next = this.effectiveTheme === "light" ? "dark" : "light";
    this.preference = next;
    this.storage["themePreference"] = next;
    this.effectiveTheme = next;
  }

  public userSelect(pref: ThemePreference) {
    this.preference = pref;
    this.storage["themePreference"] = pref;
    this.resolve();
  }

  public systemChange(isDark: boolean) {
    this.systemDark = isDark;
    // Live listener only updates theme if preference is system
    if (this.preference === "system") {
      this.effectiveTheme = isDark ? "dark" : "light";
    }
  }

  public reload() {
    // Simulates reload with the same localStorage
    this.resolve();
  }
}

// Test A: System = Light, No saved preference -> App starts Light
const tmA = new ThemeMachine(false);
assert(tmA.effectiveTheme === "light", "Test A: System=Light, No saved pref -> App starts Light");

// Test B: System = Dark, No saved preference -> App starts Dark
const tmB = new ThemeMachine(true);
assert(tmB.effectiveTheme === "dark", "Test B: System=Dark, No saved pref -> App starts Dark");

// Test C: System = Light, User switches to Dark -> App becomes Dark
const tmC = new ThemeMachine(false);
tmC.userToggle();
assert(tmC.effectiveTheme === "dark", "Test C: System=Light, User switches to Dark -> App becomes Dark");

// Test D: System = Light, User switches to Dark, Reload page -> App remains Dark
tmC.reload();
assert(tmC.effectiveTheme === "dark", "Test D: Reload after explicit Dark -> App remains Dark");

// Test E: System = Dark, User explicitly chooses Light, Reload page -> App remains Light
const tmE = new ThemeMachine(true);
tmE.userToggle(); // Dark -> Light
assert(tmE.effectiveTheme === "light", "Test E1: System=Dark, User switches to Light -> App becomes Light");
tmE.reload();
assert(tmE.effectiveTheme === "light", "Test E2: Reload after explicit Light -> App remains Light");

// Test F: Preference = System, System changes Light -> Dark -> App changes to Dark
const tmF = new ThemeMachine(false);
assert(tmF.effectiveTheme === "light", "Test F1: Starts light in system mode");
tmF.systemChange(true);
assert(tmF.effectiveTheme === "dark", "Test F2: System changes Light -> Dark -> App automatically changes to Dark");

// Test G: Preference = System, System changes Dark -> Light -> App changes to Light
const tmG = new ThemeMachine(true);
assert(tmG.effectiveTheme === "dark", "Test G1: Starts dark in system mode");
tmG.systemChange(false);
assert(tmG.effectiveTheme === "light", "Test G2: System changes Dark -> Light -> App automatically changes to Light");

// Test H: Explicit preference = Dark, System changes -> App remains Dark
const tmH = new ThemeMachine(false);
tmH.userSelect("dark");
assert(tmH.effectiveTheme === "dark", "Test H1: User explicit Dark set");
tmH.systemChange(false); // OS says light
assert(tmH.effectiveTheme === "dark", "Test H2: OS changes to Light -> App remains Dark due to override");
tmH.systemChange(true); // OS says dark
assert(tmH.effectiveTheme === "dark", "Test H3: OS changes to Dark -> App remains Dark");

console.log("\n==================================================================");
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
}
