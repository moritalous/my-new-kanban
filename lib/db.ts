import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "todos.db");

type TodoRow = {
  id: number;
  title: string;
  completed: number;
  created_at: string;
};

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
};

declare global {
  var todoDb: Database.Database | undefined;
}

function initializeSchema(db: Database.Database) {
  let attempts = 0;

  while (attempts < 5) {
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS todos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      return;
    } catch (error) {
      attempts += 1;

      if (!(error instanceof Database.SqliteError) || error.code !== "SQLITE_BUSY" || attempts >= 5) {
        throw error;
      }
    }
  }
}

function getDb() {
  fs.mkdirSync(dataDir, { recursive: true });

  const db = globalThis.todoDb ?? new Database(dbPath);
  globalThis.todoDb = db;

  db.pragma("busy_timeout = 5000");
  initializeSchema(db);

  return db;
}

function mapTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
  };
}

export function listTodos(): Todo[] {
  const rows = getDb()
    .prepare(
      "SELECT id, title, completed, created_at FROM todos ORDER BY completed ASC, id DESC",
    )
    .all() as TodoRow[];

  return rows.map(mapTodo);
}

export function createTodo(title: string): Todo {
  const db = getDb();
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error("Title is required");
  }

  const result = db
    .prepare("INSERT INTO todos (title) VALUES (?)")
    .run(trimmedTitle);

  const row = db
    .prepare("SELECT id, title, completed, created_at FROM todos WHERE id = ?")
    .get(result.lastInsertRowid) as TodoRow | undefined;

  if (!row) {
    throw new Error("Failed to create todo");
  }

  return mapTodo(row);
}

export function updateTodo(
  id: number,
  updates: { title?: string; completed?: boolean },
): Todo | null {
  const db = getDb();
  const existing = db
    .prepare("SELECT id, title, completed, created_at FROM todos WHERE id = ?")
    .get(id) as TodoRow | undefined;

  if (!existing) {
    return null;
  }

  const nextTitle =
    typeof updates.title === "string" && updates.title.trim()
      ? updates.title.trim()
      : existing.title;
  const nextCompleted =
    typeof updates.completed === "boolean"
      ? Number(updates.completed)
      : existing.completed;

  db.prepare("UPDATE todos SET title = ?, completed = ? WHERE id = ?").run(
    nextTitle,
    nextCompleted,
    id,
  );

  return mapTodo({
    ...existing,
    title: nextTitle,
    completed: nextCompleted,
  });
}

export function deleteTodo(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM todos WHERE id = ?").run(id);
  return result.changes > 0;
}
