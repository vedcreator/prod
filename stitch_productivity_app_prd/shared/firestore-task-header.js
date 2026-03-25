import { db } from "./firebase-init.js";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const tasksRef = collection(db, "tasks");
const tasksQuery = query(tasksRef, orderBy("createdAt", "asc"));

function updateTaskHeaderText(completed, total) {
  const text = `${completed}/${total} Tasks`;
  const nodes = Array.from(document.querySelectorAll("*")).filter((el) => {
    if (!(el instanceof HTMLElement)) {
      return false;
    }
    const t = el.textContent || "";
    return /\d+\s*\/\s*\d+\s*Tasks/.test(t);
  });

  nodes.forEach((node) => {
    node.textContent = text;
  });
}

function updateHeaderIfPresent() {
  updateTaskHeaderText(0, 0);
  onSnapshot(tasksQuery, (snapshot) => {
    const tasks = snapshot.docs.map((d) => d.data());
    const completed = tasks.filter((t) => Boolean(t.completed)).length;
    const total = tasks.length;
    updateTaskHeaderText(completed, total);
  });
}

updateHeaderIfPresent();

