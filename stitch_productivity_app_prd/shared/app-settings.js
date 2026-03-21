const STORAGE_KEYS = {
  theme: "app.theme",
  fontScale: "app.fontScale",
  accent: "app.accent",
};

const DEFAULTS = {
  theme: "light",
  fontScale: 14,
  accent: "#5f5e5e",
};

function safeGet(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors in private/restricted contexts.
  }
}

function ensureAccentStyleTag() {
  let styleTag = document.getElementById("appAccentOverrides");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "appAccentOverrides";
    document.head.appendChild(styleTag);
  }
  return styleTag;
}

function applyTheme(themeValue) {
  const root = document.documentElement;
  const theme = themeValue === "dark" ? "dark" : "light";
  root.classList.toggle("dark", theme === "dark");
  safeSet(STORAGE_KEYS.theme, theme);
}

function applyFontScale(sizeValue) {
  const size = Number(sizeValue);
  const px = Number.isFinite(size) ? Math.min(24, Math.max(12, size)) : DEFAULTS.fontScale;
  document.documentElement.style.fontSize = `${px}px`;
  safeSet(STORAGE_KEYS.fontScale, String(px));
}

function applyAccentColor(hex) {
  const normalized = /^#[0-9a-f]{6}$/i.test(String(hex)) ? String(hex) : DEFAULTS.accent;
  const styleTag = ensureAccentStyleTag();
  styleTag.textContent = `
    :root { --app-primary: ${normalized}; }
    .text-primary { color: var(--app-primary) !important; }
    .bg-primary { background-color: var(--app-primary) !important; }
    .border-primary { border-color: var(--app-primary) !important; }
    .accent-primary { accent-color: var(--app-primary) !important; }
    .hover\\:text-primary:hover { color: var(--app-primary) !important; }
    .hover\\:bg-primary:hover { background-color: var(--app-primary) !important; }
    .focus\\:ring-primary:focus { --tw-ring-color: var(--app-primary) !important; }
  `;
  safeSet(STORAGE_KEYS.accent, normalized);
}

function readSavedTheme() {
  const value = safeGet(STORAGE_KEYS.theme, DEFAULTS.theme);
  return value === "dark" ? "dark" : "light";
}

function readSavedFontScale() {
  const value = Number(safeGet(STORAGE_KEYS.fontScale, String(DEFAULTS.fontScale)));
  return Number.isFinite(value) ? value : DEFAULTS.fontScale;
}

function readSavedAccent() {
  const value = safeGet(STORAGE_KEYS.accent, DEFAULTS.accent);
  return /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : DEFAULTS.accent;
}

function wireSettingsScreenControls() {
  const themeButtons = Array.from(document.querySelectorAll("button")).filter((button) => {
    const icon = button.querySelector(".material-symbols-outlined");
    return icon && ["light_mode", "dark_mode", "brightness_auto"].includes(icon.textContent.trim());
  });

  const lightButton = themeButtons.find((button) =>
    button.querySelector(".material-symbols-outlined")?.textContent.trim() === "light_mode"
  );
  const darkButton = themeButtons.find((button) =>
    button.querySelector(".material-symbols-outlined")?.textContent.trim() === "dark_mode"
  );
  const systemButton = themeButtons.find((button) =>
    button.querySelector(".material-symbols-outlined")?.textContent.trim() === "brightness_auto"
  );

  const rangeInput = document.querySelector('input[type="range"]');
  const rangeValueLabel = rangeInput
    ? rangeInput.closest("div")?.querySelector("span.text-xs.font-mono.text-primary")
    : null;

  const hexInput = Array.from(document.querySelectorAll('input[type="text"]')).find((input) =>
    /^#[0-9a-f]{6}$/i.test(input.value.trim())
  );
  const swatchCandidates = hexInput
    ? Array.from(hexInput.closest("div")?.parentElement?.querySelectorAll("div.w-10.h-10.rounded-full") || [])
    : [];

  function refreshThemeButtonStyles(activeTheme) {
    [lightButton, darkButton, systemButton].forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }
      button.classList.remove("border-2", "border-primary", "opacity-40");
      button.classList.add("opacity-40");
    });

    if (activeTheme === "light" && lightButton) {
      lightButton.classList.remove("opacity-40");
      lightButton.classList.add("border-2", "border-primary");
    }
    if (activeTheme === "dark" && darkButton) {
      darkButton.classList.remove("opacity-40");
      darkButton.classList.add("border-2", "border-primary");
    }
  }

  function activateTheme(theme) {
    if (theme === "system") {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
      safeSet(STORAGE_KEYS.theme, "system");
      refreshThemeButtonStyles(prefersDark ? "dark" : "light");
      return;
    }
    applyTheme(theme);
    refreshThemeButtonStyles(theme);
  }

  if (lightButton) {
    lightButton.addEventListener("click", () => activateTheme("light"));
  }
  if (darkButton) {
    darkButton.addEventListener("click", () => activateTheme("dark"));
  }
  if (systemButton) {
    systemButton.addEventListener("click", () => activateTheme("system"));
  }

  if (rangeInput instanceof HTMLInputElement) {
    const savedScale = readSavedFontScale();
    rangeInput.value = String(savedScale);
    if (rangeValueLabel instanceof HTMLElement) {
      rangeValueLabel.textContent = `${savedScale}px`;
    }
    rangeInput.addEventListener("input", () => {
      const nextSize = Number(rangeInput.value);
      applyFontScale(nextSize);
      if (rangeValueLabel instanceof HTMLElement) {
        rangeValueLabel.textContent = `${nextSize}px`;
      }
    });
  }

  if (hexInput instanceof HTMLInputElement) {
    hexInput.value = readSavedAccent();
    hexInput.addEventListener("change", () => {
      applyAccentColor(hexInput.value.trim());
      hexInput.value = readSavedAccent();
    });
  }

  swatchCandidates.forEach((swatch) => {
    if (!(swatch instanceof HTMLElement)) {
      return;
    }
    const color = window.getComputedStyle(swatch).backgroundColor;
    swatch.addEventListener("click", () => {
      const hex = rgbToHex(color);
      applyAccentColor(hex);
      if (hexInput instanceof HTMLInputElement) {
        hexInput.value = hex;
      }
    });
  });
}

function rgbToHex(rgbColor) {
  const match = String(rgbColor).match(/\d+/g);
  if (!match || match.length < 3) {
    return DEFAULTS.accent;
  }
  const [r, g, b] = match.slice(0, 3).map((num) => Number(num));
  const toHex = (num) => num.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function applySavedGlobalSettings() {
  const savedTheme = safeGet(STORAGE_KEYS.theme, DEFAULTS.theme);
  if (savedTheme === "system") {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  } else {
    applyTheme(readSavedTheme());
  }

  applyFontScale(readSavedFontScale());
  applyAccentColor(readSavedAccent());
}

function init() {
  applySavedGlobalSettings();
  wireSettingsScreenControls();
}

init();
