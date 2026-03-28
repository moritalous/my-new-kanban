import { createTodo, listTodos } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ todos: listTodos() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { title?: string };
    const todo = createTodo(body.title ?? "");
    return Response.json({ todo }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create todo";

    return Response.json({ error: message }, { status: 400 });
  }
}
