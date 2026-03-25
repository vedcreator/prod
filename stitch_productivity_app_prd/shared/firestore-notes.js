import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import { db } from "./firebase-init.js";

function getLocalUid() {
  const key = "app.uid";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const generated = "local-user";
  window.localStorage.setItem(key, generated);
  return generated;
}

function safeHtml(input) {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  if (!value?.toDate) {
    return "Just now";
  }
  return value.toDate().toLocaleString();
}

function wireNotesWorkspace() {
  const input = document.getElementById("noteInput");
  const button = document.getElementById("addNoteButton");
  const list = document.getElementById("notesList");
  const empty = document.getElementById("notesEmptyState");

  if (!input || !button || !list) {
    return;
  }

  const uid = getLocalUid();
  const notesRef = collection(db, "users", uid, "notes");
  const notesQuery = query(notesRef, orderBy("createdAt", "desc"));

  async function createNote() {
    const content = input.value.trim();
    if (!content) {
      return;
    }

    await addDoc(notesRef, {
      body: content,
      createdAt: serverTimestamp(),
    });
    input.value = "";
  }

  button.addEventListener("click", createNote);
  input.addEventListener("keydown", async (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      await createNote();
    }
  });

  list.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const deleteButton = target.closest("[data-note-delete]");
    if (!deleteButton) {
      return;
    }
    const noteId = deleteButton.getAttribute("data-note-id");
    if (!noteId) {
      return;
    }
    await deleteDoc(doc(db, "users", uid, "notes", noteId));
  });

  onSnapshot(notesQuery, (snapshot) => {
    const notes = snapshot.docs.map((noteDoc) => ({
      id: noteDoc.id,
      ...noteDoc.data(),
    }));

    if (empty) {
      empty.classList.toggle("hidden", notes.length > 0);
    }

    list.innerHTML = notes
      .map(
        (note) => `
        <article class="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/20">
          <div class="flex items-start justify-between gap-4 mb-3">
            <span class="text-xs text-on-surface-variant">${safeHtml(formatDate(note.createdAt))}</span>
            <button type="button" data-note-delete data-note-id="${note.id}" class="text-xs uppercase tracking-widest px-2 py-1 rounded border border-error/30 text-error hover:bg-error/10">
              Delete
            </button>
          </div>
          <p class="text-on-surface leading-relaxed whitespace-pre-wrap">${safeHtml(
            typeof note.body === "string" ? note.body : note.content
          )}</p>
        </article>
      `
      )
      .join("");
  });
}

wireNotesWorkspace();
