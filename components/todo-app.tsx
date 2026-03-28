"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
};

function sortTodos(items: Todo[]) {
  return [...items].sort((left, right) => {
    if (left.completed !== right.completed) {
      return Number(left.completed) - Number(right.completed);
    }

    return right.id - left.id;
  });
}

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadTodos() {
      try {
        const response = await fetch("/api/todos", { cache: "no-store" });
        const data = (await response.json()) as { todos: Todo[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load todos");
        }

        setTodos(sortTodos(data.todos));
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load todos",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadTodos();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = title.trim();

    if (!nextTitle) {
      setError("TODOを入力してください。");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: nextTitle }),
        });
        const data = (await response.json()) as { todo?: Todo; error?: string };

        if (!response.ok || !data.todo) {
          throw new Error(data.error ?? "Failed to create todo");
        }

        const createdTodo = data.todo;
        setTodos((current) => sortTodos([createdTodo, ...current]));
        setTitle("");
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to create todo",
        );
      }
    });
  }

  function handleToggle(todo: Todo) {
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/todos/${todo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !todo.completed }),
        });
        const data = (await response.json()) as { todo?: Todo; error?: string };

        if (!response.ok || !data.todo) {
          throw new Error(data.error ?? "Failed to update todo");
        }

        const updatedTodo = data.todo;
        setTodos((current) =>
          sortTodos(
            current.map((item) => (item.id === todo.id ? updatedTodo : item)),
          ),
        );
      } catch (updateError) {
        setError(
          updateError instanceof Error
            ? updateError.message
            : "Failed to update todo",
        );
      }
    });
  }

  function handleDelete(id: number) {
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to delete todo");
        }

        setTodos((current) => current.filter((todo) => todo.id !== id));
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete todo",
        );
      }
    });
  }

  const remainingCount = todos.filter((todo) => !todo.completed).length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7,transparent_35%),linear-gradient(135deg,#f97316_0%,#fb7185_45%,#0f172a_100%)] px-4 py-10 text-slate-900">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-[32px] border border-white/30 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">
              SQLite Todo
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              ローカルDBで管理するシンプルなTODO。
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Next.js の API から SQLite に保存し、リロードしても状態が残ります。
            </p>
          </div>
          <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white shadow-lg">
            <p className="text-sm uppercase tracking-[0.25em] text-orange-300">
              Remaining
            </p>
            <p className="mt-2 text-3xl font-semibold">{remainingCount}</p>
          </div>
        </div>

        <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleSubmit}>
          <input
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            placeholder="例: SQLiteの初期化処理を作る"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={isPending}
          />
          <button
            type="submit"
            className="rounded-2xl bg-orange-500 px-6 py-4 text-base font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
            disabled={isPending}
          >
            {isPending ? "保存中..." : "追加"}
          </button>
        </form>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4">
          {isLoading ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
              読み込み中...
            </div>
          ) : todos.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
              TODO はまだありません。最初の1件を追加してください。
            </div>
          ) : (
            todos.map((todo) => (
              <article
                key={todo.id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm transition md:flex-row md:items-center md:justify-between"
              >
                <label className="flex flex-1 cursor-pointer items-start gap-4">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggle(todo)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                    disabled={isPending}
                  />
                  <div className="space-y-1">
                    <p
                      className={`text-lg font-medium ${
                        todo.completed
                          ? "text-slate-400 line-through"
                          : "text-slate-900"
                      }`}
                    >
                      {todo.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(todo.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                </label>
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => handleDelete(todo.id)}
                  disabled={isPending}
                >
                  削除
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
