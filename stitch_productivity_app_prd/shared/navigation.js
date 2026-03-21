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

function wireGlobalNavigation() {
  bindByText(["Main Dashboard", "Tasks", "Focus"], "main_dashboard");
  bindByText(["Plan Tomorrow", "Plan"], "plan_tomorrow");
  bindByText(["Notes"], "notes_workspace");
  bindByText(["Daily Journal", "Journal"], "daily_journal");
  bindByText(["Settings"], "settings_menu");

  // Route category/task tiles into detail view.
  bindByText(["Exercise"], "tile_detail_view");

  // Hamburger open + overlay close.
  bindByIcon("menu", "hamburger_menu_overlay");
  if (window.location.pathname.includes("/hamburger_menu_overlay/")) {
    bindByIcon("close", "main_dashboard");
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
