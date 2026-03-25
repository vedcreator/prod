const ROUTES = {
  main_dashboard: "../main_dashboard/code.html",
  plan_tomorrow: "../plan_tomorrow/code.html",
  notes_workspace: "../notes_workspace/code.html",
  daily_journal: "../daily_journal/code.html",
  settings_menu: "../settings_menu/code.html",
  tile_detail_view: "../tile_detail_view/code.html",
  hamburger_menu_overlay: "../hamburger_menu_overlay/code.html",
};

function normalize(text) {
  return String(text || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function navigateTo(routeKey) {
  const route = ROUTES[routeKey];
  if (!route) {
    return;
  }
  window.location.href = route;
}

function applyHrefUpdates() {
  const labelToRoute = new Map([
    ["main dashboard", "main_dashboard"],
    ["dashboard", "main_dashboard"],
    ["tasks", "main_dashboard"],
    ["focus", "main_dashboard"],
    ["plan tomorrow", "plan_tomorrow"],
    ["plan", "plan_tomorrow"],
    ["notes", "notes_workspace"],
    ["daily journal", "daily_journal"],
    ["journal", "daily_journal"],
    ["settings", "settings_menu"],
    ["workspace", "main_dashboard"],
  ]);

  document.querySelectorAll('a[href="#"]').forEach((anchor) => {
    if (!(anchor instanceof HTMLAnchorElement)) {
      return;
    }
    const text = normalize(anchor.textContent);

    // Icon text may be included in anchor.textContent (e.g. "event_upcoming").
    // Use substring matching against our known labels.
    let matchedRouteKey = null;
    for (const [label, routeKey] of labelToRoute.entries()) {
      if (text.includes(label)) {
        matchedRouteKey = routeKey;
        break;
      }
    }

    if (!matchedRouteKey) {
      return;
    }
    const route = ROUTES[matchedRouteKey];
    if (route) {
      anchor.setAttribute("href", route);
    }
  });
}

function nearestClickable(element) {
  return (
    element.closest("a,button,[role='button'],[class*='cursor-pointer']") ||
    element
  );
}

function bindRouteFromNode(node, routeKey) {
  if (!(node instanceof HTMLElement)) {
    return;
  }
  const clickable = nearestClickable(node);
  if (!(clickable instanceof HTMLElement)) {
    return;
  }

  clickable.style.cursor = "pointer";
  clickable.addEventListener("click", (event) => {
    event.preventDefault();
    navigateTo(routeKey);
  });
}

function bindByText(labels, routeKey) {
  const targets = new Set(labels.map(normalize));
  const nodes = document.querySelectorAll("a,button,div,span");
  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    const text = normalize(node.textContent);
    if (!targets.has(text)) {
      return;
    }
    bindRouteFromNode(node, routeKey);
  });
}

function bindByIcon(iconName, routeKey) {
  const nodes = document.querySelectorAll(
    `.material-symbols-outlined[data-icon="${iconName}"], .material-symbols-outlined`
  );
  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    if (normalize(node.textContent) !== normalize(iconName)) {
      return;
    }
    if (node.closest("#newEntryModalOverlay, [id*='ModalOverlay'], [data-modal-overlay]")) {
      return;
    }
    if (node.closest("#closeNewEntryModal, [id*='closeNewEntryModal']")) {
      return;
    }
    bindRouteFromNode(node, routeKey);
  });
}

function wireCategoryTiles() {
  // Bind cards by their visible heading text (e.g. "Exercise" -> tile_detail_view).
  document.querySelectorAll("h1,h2,h3").forEach((heading) => {
    if (!(heading instanceof HTMLElement)) {
      return;
    }
    const headingText = normalize(heading.textContent);
    if (headingText !== "exercise") {
      return;
    }

    const card = heading.closest("div");
    if (card) {
      bindRouteFromNode(card, "tile_detail_view");
    }
  });
}

function updateLiveDates() {
  const now = new Date();
  const shortDate = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const longDate = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  const replaceMap = [
    { re: /^oct\s+\d{1,2}$/i, value: shortDate },
    { re: /^october\s+\d{1,2}$/i, value: longDate },
  ];

  document.querySelectorAll("*").forEach((el) => {
    if (!(el instanceof HTMLElement)) {
      return;
    }
    const t = String(el.textContent || "").trim();
    if (!t) {
      return;
    }
    const rule = replaceMap.find((r) => r.re.test(t));
    if (!rule) {
      return;
    }
    el.textContent = rule.value;
  });
}

function wireGlobalNavigation() {
  applyHrefUpdates();
  updateLiveDates();

  bindByText(["Main Dashboard", "Tasks", "Focus"], "main_dashboard");
  bindByText(["Plan Tomorrow", "Plan"], "plan_tomorrow");
  bindByText(["Notes"], "notes_workspace");
  bindByText(["Daily Journal", "Journal"], "daily_journal");
  bindByText(["Settings"], "settings_menu");

  wireCategoryTiles();

  // Hamburger open + overlay close.
  const href = String(window.location.href || "");
  const isHamburgerOverlay = href.includes("hamburger_menu_overlay");

  if (isHamburgerOverlay) {
    bindByIcon("close", "main_dashboard");
  } else {
    bindByIcon("menu", "hamburger_menu_overlay");
  }
}

function closeOverlay(overlay) {
  if (!(overlay instanceof HTMLElement)) {
    return;
  }
  overlay.classList.add("hidden");
  overlay.classList.remove("flex");
}

function wireModalLogic() {
  const overlaySelectors = [
    "#newEntryModalOverlay",
    "[data-modal-overlay]",
    "[id*='ModalOverlay']",
  ];

  const overlays = Array.from(
    new Set(
      overlaySelectors.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector))
      )
    )
  );

  overlays.forEach((overlay) => {
    if (!(overlay instanceof HTMLElement)) {
      return;
    }

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeOverlay(overlay);
      }
    });

    const closeButtons = overlay.querySelectorAll(
      "button[id*='close'], button[data-close-modal], .material-symbols-outlined"
    );
    closeButtons.forEach((btn) => {
      if (!(btn instanceof HTMLElement)) {
        return;
      }
      const isCloseIcon = normalize(btn.textContent) === "close";
      const isCloseButton =
        (btn instanceof HTMLButtonElement &&
          normalize(btn.id).includes("close")) ||
        btn.hasAttribute("data-close-modal");
      if (!isCloseIcon && !isCloseButton) {
        return;
      }

      btn.addEventListener("click", () => closeOverlay(overlay));
    });

    const cancelButtons = overlay.querySelectorAll("button");
    cancelButtons.forEach((btn) => {
      if (!(btn instanceof HTMLButtonElement)) {
        return;
      }
      const label = normalize(btn.textContent);
      if (label === "cancel" || label === "discard") {
        btn.addEventListener("click", () => closeOverlay(overlay));
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    overlays.forEach((overlay) => {
      if (!(overlay instanceof HTMLElement)) {
        return;
      }
      if (!overlay.classList.contains("hidden")) {
        closeOverlay(overlay);
      }
    });
  });
}

function init() {
  wireGlobalNavigation();
  wireModalLogic();
}

init();
