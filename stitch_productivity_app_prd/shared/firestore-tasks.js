import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBg8991DcFWsmFxH2X-S71_yTPeLbQlnsY",
  authDomain: "prod-4fce7.firebaseapp.com",
  projectId: "prod-4fce7",
  storageBucket: "prod-4fce7.firebasestorage.app",
  messagingSenderId: "722342652369",
  appId: "1:722342652369:web:a272464337946230e918f0",
  measurementId: "G-FC4G9SXQZK",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const tasksRef = collection(db, "tasks");
const tasksQuery = query(tasksRef, orderBy("createdAt", "asc"));

function subscribeToTasks(onData) {
  return onSnapshot(tasksQuery, (snapshot) => {
    const tasks = snapshot.docs.map((taskDoc) => ({
      id: taskDoc.id,
      ...taskDoc.data(),
    }));
    onData(tasks);
  });
}

function toPercent(completed, total) {
  if (!total) {
    return 0;
  }
  return Math.round((completed / total) * 100);
}

function wireMainDashboard() {
  const progressText = document.getElementById("taskProgressText");
  const completionText = document.getElementById("dailyCompletionCounter");
  const completionBar = document.getElementById("dailyCompletionBar");
  const addTaskForm = document.getElementById("addTaskForm");
  const addTaskInput = document.getElementById("addTaskInput");
  const openModalButton = document.getElementById("openNewEntryModal");
  const closeModalButton = document.getElementById("closeNewEntryModal");
  const modalOverlay = document.getElementById("newEntryModalOverlay");
  const modalPanel = document.getElementById("newEntryModalPanel");
  const trackConsistencyToggle = document.getElementById("trackConsistencyToggle");
  const trackConsistencyThumb = document.getElementById("trackConsistencyThumb");
  const selectIconButton = document.getElementById("selectIconButton");
  const selectedTaskIcon = document.getElementById("selectedTaskIcon");
  const listRoot = document.getElementById("dashboardTaskList");
  const emptyState = document.getElementById("dashboardTaskEmptyState");
  const filtersRoot = document.getElementById("dashboardTaskFilters");
  let activeFilter = "all";
  let allTasks = [];
  let editingTaskId = null;
  let editingDraft = "";
  let draggedTaskId = null;
  let trackConsistencyEnabled = true;
  const modalIcons = ["category", "fitness_center", "menu_book", "bolt", "check_circle"];
  let selectedIconIndex = 0;

  function openNewEntryModal() {
    if (!modalOverlay) {
      return;
    }
    modalOverlay.classList.remove("hidden");
    modalOverlay.classList.add("flex");
    if (addTaskInput instanceof HTMLInputElement) {
      addTaskInput.focus();
    }
  }

  function closeNewEntryModal() {
    if (!modalOverlay) {
      return;
    }
    modalOverlay.classList.add("hidden");
    modalOverlay.classList.remove("flex");
  }

  function renderTrackConsistencyToggle() {
    if (!(trackConsistencyToggle instanceof HTMLElement) || !(trackConsistencyThumb instanceof HTMLElement)) {
      return;
    }

    trackConsistencyToggle.setAttribute(
      "aria-pressed",
      trackConsistencyEnabled ? "true" : "false"
    );

    if (trackConsistencyEnabled) {
      trackConsistencyToggle.classList.add("bg-primary-container");
      trackConsistencyToggle.classList.remove("bg-surface-container-high");
      trackConsistencyThumb.classList.add("right-1");
      trackConsistencyThumb.classList.remove("left-1");
      trackConsistencyThumb.classList.add("bg-primary");
      trackConsistencyThumb.classList.remove("bg-outline");
    } else {
      trackConsistencyToggle.classList.remove("bg-primary-container");
      trackConsistencyToggle.classList.add("bg-surface-container-high");
      trackConsistencyThumb.classList.remove("right-1");
      trackConsistencyThumb.classList.add("left-1");
      trackConsistencyThumb.classList.remove("bg-primary");
      trackConsistencyThumb.classList.add("bg-outline");
    }
  }

  function renderSelectedIcon() {
    if (!(selectedTaskIcon instanceof HTMLElement)) {
      return;
    }
    selectedTaskIcon.textContent = modalIcons[selectedIconIndex];
  }

  if (openModalButton) {
    openModalButton.addEventListener("click", openNewEntryModal);
  }
  if (closeModalButton) {
    closeModalButton.addEventListener("click", closeNewEntryModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (event) => {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }
      if (modalPanel && modalPanel.contains(event.target)) {
        return;
      }
      closeNewEntryModal();
    });
  }
  if (trackConsistencyToggle) {
    trackConsistencyToggle.addEventListener("click", () => {
      trackConsistencyEnabled = !trackConsistencyEnabled;
      renderTrackConsistencyToggle();
    });
    renderTrackConsistencyToggle();
  }
  if (selectIconButton) {
    selectIconButton.addEventListener("click", () => {
      selectedIconIndex = (selectedIconIndex + 1) % modalIcons.length;
      renderSelectedIcon();
    });
    renderSelectedIcon();
  }

  if (addTaskForm && addTaskInput) {
    addTaskForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const title = addTaskInput.value.trim();
      if (!title) {
        return;
      }

      await addDoc(tasksRef, {
        title,
        icon: modalIcons[selectedIconIndex],
        completed: false,
        trackConsistency: trackConsistencyEnabled,
        order: Date.now(),
        createdAt: serverTimestamp(),
      });

      addTaskInput.value = "";
      closeNewEntryModal();
    });
  }

  function sortedTasks(tasks) {
    return [...tasks].sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return 0;
    });
  }

  function safeHtml(input) {
    return String(input || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function filteredTasks(tasks) {
    if (activeFilter === "active") {
      return tasks.filter((task) => !task.completed);
    }
    if (activeFilter === "completed") {
      return tasks.filter((task) => task.completed);
    }
    return tasks;
  }

  function updateFilterStyles() {
    if (!filtersRoot) {
      return;
    }
    const buttons = filtersRoot.querySelectorAll("[data-filter]");
    buttons.forEach((button) => {
      const filter = button.getAttribute("data-filter");
      const selected = filter === activeFilter;
      button.classList.toggle("bg-surface-container-low", selected);
      button.classList.toggle("text-on-surface", selected);
      button.classList.toggle("text-on-surface-variant", !selected);
    });
  }

  async function persistOrder(orderedTaskIds) {
    const updates = orderedTaskIds.map((taskId, index) =>
      updateDoc(doc(db, "tasks", taskId), { order: index })
    );
    await Promise.all(updates);
  }

  async function moveTaskBy(taskId, delta) {
    const ordered = sortedTasks(allTasks).map((task) => task.id);
    const fromIndex = ordered.indexOf(taskId);
    if (fromIndex < 0) {
      return;
    }
    const toIndex = fromIndex + delta;
    if (toIndex < 0 || toIndex >= ordered.length) {
      return;
    }
    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);
    await persistOrder(ordered);
  }

  function render() {
    const tasks = sortedTasks(allTasks);
    const shown = filteredTasks(tasks);

    const completedCount = tasks.filter((task) => task.completed).length;
    const totalCount = tasks.length;
    const percent = toPercent(completedCount, totalCount);

    if (progressText) {
      progressText.textContent = `${completedCount}/${totalCount} Tasks`;
    }
    if (completionText) {
      completionText.textContent = `${percent}%`;
    }
    if (completionBar) {
      completionBar.style.width = `${percent}%`;
    }
    if (emptyState) {
      emptyState.classList.toggle("hidden", shown.length > 0);
    }

    updateFilterStyles();

    if (!listRoot) {
      return;
    }

    listRoot.innerHTML = shown
      .map((task) => {
        const safeTitle = safeHtml(task.title || "Untitled task");
        const isEditing = editingTaskId === task.id;
        const checkboxPart = `
          <input data-task-toggle data-task-id="${task.id}" type="checkbox" class="w-4 h-4 rounded border-outline text-primary focus:ring-primary/20" ${task.completed ? "checked" : ""} />
        `;
        const titlePart = isEditing
          ? `<input data-task-inline-input data-task-id="${task.id}" type="text" value="${safeHtml(editingDraft)}" class="text-sm w-full bg-transparent border-0 border-b border-primary/40 focus:ring-0 px-0 py-0.5 text-on-surface" />`
          : `<span class="text-sm truncate ${task.completed ? "line-through text-on-surface-variant" : "text-on-surface"}">${safeTitle}</span>`;
        const actionsPart = isEditing
          ? `
            <button data-task-action="save-edit" data-task-id="${task.id}" type="button" class="text-xs uppercase tracking-widest px-2 py-1 rounded border border-primary/40 text-primary hover:bg-primary/10">
              Save
            </button>
            <button data-task-action="cancel-edit" data-task-id="${task.id}" type="button" class="text-xs uppercase tracking-widest px-2 py-1 rounded border border-outline-variant/40 text-on-surface-variant hover:text-on-surface">
              Cancel
            </button>
          `
          : `
            <button data-task-action="edit" data-task-id="${task.id}" data-task-title="${safeTitle}" type="button" class="text-xs uppercase tracking-widest px-2 py-1 rounded border border-outline-variant/40 text-on-surface-variant hover:text-on-surface">
              Edit
            </button>
            <button data-task-action="delete" data-task-id="${task.id}" type="button" class="text-xs uppercase tracking-widest px-2 py-1 rounded border border-error/30 text-error hover:bg-error/10">
              Delete
            </button>
            <button data-task-action="move-up" data-task-id="${task.id}" type="button" class="text-xs uppercase tracking-widest px-2 py-1 rounded border border-outline-variant/40 text-on-surface-variant hover:text-on-surface" aria-label="Move task up">
              Up
            </button>
            <button data-task-action="move-down" data-task-id="${task.id}" type="button" class="text-xs uppercase tracking-widest px-2 py-1 rounded border border-outline-variant/40 text-on-surface-variant hover:text-on-surface" aria-label="Move task down">
              Down
            </button>
          `;

        const draggable = activeFilter === "all" && !isEditing ? "true" : "false";
        return `
          <li class="flex items-center justify-between gap-4 bg-surface-container-low rounded-lg px-4 py-3 ${draggable === "true" ? "cursor-move" : ""}" data-task-row data-task-id="${task.id}" draggable="${draggable}">
            <button data-task-handle data-task-id="${task.id}" type="button" class="material-symbols-outlined text-on-surface-variant text-base leading-none cursor-move focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-sm shrink-0" aria-label="Drag to reorder. Use Arrow Up or Arrow Down to reorder with keyboard">drag_indicator</button>
            <label class="flex items-center gap-3 min-w-0 flex-1">
              ${checkboxPart}
              ${titlePart}
            </label>
            <div class="flex items-center gap-2 shrink-0">
              ${actionsPart}
            </div>
          </li>
        `;
      })
      .join("");

    const inlineInput = listRoot.querySelector(
      `[data-task-inline-input][data-task-id="${editingTaskId}"]`
    );
    if (inlineInput instanceof HTMLInputElement) {
      inlineInput.focus();
      inlineInput.setSelectionRange(inlineInput.value.length, inlineInput.value.length);
    }
  }

  if (listRoot) {
    listRoot.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const actionButton = target.closest("[data-task-action]");
      if (!actionButton) {
        return;
      }

      const taskId = actionButton.getAttribute("data-task-id");
      const action = actionButton.getAttribute("data-task-action");
      if (!taskId || !action) {
        return;
      }

      if (action === "delete") {
        await deleteDoc(doc(db, "tasks", taskId));
      }

      if (action === "edit") {
        editingTaskId = taskId;
        editingDraft = actionButton.getAttribute("data-task-title") || "";
        render();
      }

      if (action === "cancel-edit") {
        editingTaskId = null;
        editingDraft = "";
        render();
      }

      if (action === "save-edit") {
        const cleaned = editingDraft.trim();
        if (!cleaned) {
          return;
        }
        await updateDoc(doc(db, "tasks", taskId), { title: cleaned });
        editingTaskId = null;
        editingDraft = "";
      }

      if (action === "move-up") {
        await moveTaskBy(taskId, -1);
      }

      if (action === "move-down") {
        await moveTaskBy(taskId, 1);
      }
    });

    listRoot.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }
      if (!target.matches("[data-task-inline-input]")) {
        return;
      }
      editingDraft = target.value;
    });

    listRoot.addEventListener("change", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }
      if (!target.matches("[data-task-toggle]")) {
        return;
      }

      const taskId = target.getAttribute("data-task-id");
      if (!taskId) {
        return;
      }

      await updateDoc(doc(db, "tasks", taskId), {
        completed: target.checked,
      });
    });

    listRoot.addEventListener("keydown", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.matches("[data-task-inline-input]")) {
        const input = target;
        if (!(input instanceof HTMLInputElement)) {
          return;
        }

        if (event.key === "Enter" && editingTaskId) {
          event.preventDefault();
          const cleaned = input.value.trim();
          if (!cleaned) {
            return;
          }
          await updateDoc(doc(db, "tasks", editingTaskId), { title: cleaned });
          editingTaskId = null;
          editingDraft = "";
        }

        if (event.key === "Escape") {
          event.preventDefault();
          editingTaskId = null;
          editingDraft = "";
          render();
        }
        return;
      }

      if (target.matches("[data-task-handle]")) {
        const taskId = target.getAttribute("data-task-id");
        if (!taskId) {
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          await moveTaskBy(taskId, -1);
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          await moveTaskBy(taskId, 1);
        }
      }
    });

    listRoot.addEventListener("dragstart", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const row = target.closest("[data-task-row]");
      if (!(row instanceof HTMLElement)) {
        return;
      }
      if (activeFilter !== "all") {
        event.preventDefault();
        return;
      }
      draggedTaskId = row.getAttribute("data-task-id");
    });

    listRoot.addEventListener("dragover", (event) => {
      if (activeFilter !== "all") {
        return;
      }
      event.preventDefault();
    });

    listRoot.addEventListener("drop", async (event) => {
      if (activeFilter !== "all") {
        return;
      }
      event.preventDefault();
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const row = target.closest("[data-task-row]");
      const dropTaskId =
        row instanceof HTMLElement ? row.getAttribute("data-task-id") : null;
      if (!draggedTaskId || !dropTaskId || draggedTaskId === dropTaskId) {
        draggedTaskId = null;
        return;
      }

      const ordered = sortedTasks(allTasks).map((task) => task.id);
      const fromIndex = ordered.indexOf(draggedTaskId);
      const toIndex = ordered.indexOf(dropTaskId);
      if (fromIndex < 0 || toIndex < 0) {
        draggedTaskId = null;
        return;
      }

      const [moved] = ordered.splice(fromIndex, 1);
      ordered.splice(toIndex, 0, moved);
      draggedTaskId = null;
      await persistOrder(ordered);
    });
  }

  if (filtersRoot) {
    filtersRoot.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const filterBtn = target.closest("[data-filter]");
      if (!filterBtn) {
        return;
      }
      const nextFilter = filterBtn.getAttribute("data-filter");
      if (!nextFilter) {
        return;
      }
      activeFilter = nextFilter;
      render();
    });
  }

  subscribeToTasks((tasks) => {
    allTasks = tasks;
    render();
  });
}

function wirePlanTomorrow() {
  const addTaskInput = document.getElementById("planAddTaskInput");
  if (!addTaskInput) {
    return;
  }

  addTaskInput.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    const title = addTaskInput.value.trim();
    if (!title) {
      return;
    }

    await addDoc(tasksRef, {
      title,
      completed: false,
      order: Date.now(),
      createdAt: serverTimestamp(),
    });

    addTaskInput.value = "";
  });
}

function wireTileDetailView() {
  const progressText = document.getElementById("taskProgressText");
  const checkboxes = Array.from(
    document.querySelectorAll("[data-task-checkbox]")
  );
  const titleNodes = Array.from(document.querySelectorAll("[data-task-title]"));
  const detailSlots = [];

  for (let index = 0; index < Math.max(checkboxes.length, titleNodes.length); index += 1) {
    detailSlots.push({
      checkbox: checkboxes[index] || null,
      title: titleNodes[index] || null,
      taskId: null,
    });
  }

  detailSlots.forEach((slot) => {
    if (!slot.checkbox) {
      return;
    }
    slot.checkbox.addEventListener("change", async () => {
      if (!slot.taskId) {
        return;
      }
      await updateDoc(doc(db, "tasks", slot.taskId), {
        completed: slot.checkbox.checked,
      });
    });
  });

  subscribeToTasks((tasks) => {
    const completedCount = tasks.filter((task) => task.completed).length;
    const totalCount = tasks.length;

    if (progressText) {
      progressText.textContent = `${completedCount}/${totalCount} Tasks`;
    }

    detailSlots.forEach((slot, index) => {
      const task = tasks[index];
      if (!task) {
        slot.taskId = null;
        if (slot.checkbox) {
          slot.checkbox.checked = false;
          slot.checkbox.disabled = true;
        }
        if (slot.title) {
          slot.title.textContent = "No task yet";
        }
        return;
      }

      slot.taskId = task.id;
      if (slot.checkbox) {
        slot.checkbox.disabled = false;
        slot.checkbox.checked = Boolean(task.completed);
      }
      if (slot.title) {
        slot.title.textContent = task.title || "Untitled task";
      }
    });
  });
}

function init() {
  if (document.getElementById("addTaskForm")) {
    wireMainDashboard();
  }
  if (document.getElementById("planAddTaskInput")) {
    wirePlanTomorrow();
  }
  if (document.querySelector("[data-task-checkbox]")) {
    wireTileDetailView();
  }
}

init();
