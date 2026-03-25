import { db } from "./firebase-init.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

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

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function initJournal() {
  const textarea = document.getElementById("journalTextarea");
  const saveBtn = document.getElementById("saveJournalButton");
  if (!textarea || !saveBtn) {
    return;
  }

  const uid = getLocalUid();
  const todayKey = getTodayKey();
  const entryRef = doc(db, "users", uid, "journal", todayKey);

  async function load() {
    const snap = await getDoc(entryRef);
    if (!snap.exists()) {
      return;
    }
    const data = snap.data() || {};
    if (typeof data.body === "string") {
      textarea.value = data.body;
    }
  }

  async function save() {
    const body = textarea.value || "";
    const previousLabel = saveBtn.textContent;
    try {
      await setDoc(
        entryRef,
        {
          body,
          date: todayKey,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      saveBtn.textContent = "Saved";
      setTimeout(() => {
        saveBtn.textContent = previousLabel;
      }, 1200);
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert("Failed to save journal entry.");
      saveBtn.textContent = previousLabel;
    }
  }

  load();
  saveBtn.addEventListener("click", save);
}

initJournal();

