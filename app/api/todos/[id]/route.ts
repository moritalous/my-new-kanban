import { deleteTodo, updateTodo } from "@/lib/db";

export const dynamic = "force-dynamic";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ error: "Invalid todo id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      completed?: boolean;
    };
    const todo = updateTodo(id, body);

    if (!todo) {
      return Response.json({ error: "Todo not found" }, { status: 404 });
    }

    return Response.json({ todo });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update todo";

    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ error: "Invalid todo id" }, { status: 400 });
  }

  const deleted = deleteTodo(id);

  if (!deleted) {
    return Response.json({ error: "Todo not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
