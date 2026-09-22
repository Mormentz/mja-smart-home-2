import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(request.url);
  let cursor = url.searchParams.get("since")
    ? new Date(url.searchParams.get("since")!)
    : new Date(Date.now() - 5000);

  if (Number.isNaN(cursor.getTime())) {
    cursor = new Date(Date.now() - 5000);
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      controller.enqueue(encoder.encode(`: connected\n\n`));

      const poll = async () => {
        if (closed) return;
        try {
          const messages = await prisma.message.findMany({
            where: {
              createdAt: { gt: cursor },
              OR: [{ senderId: userId }, { recipientId: userId }],
            },
            include: {
              sender: { select: { id: true, name: true, email: true, role: true } },
              recipient: { select: { id: true, name: true, email: true, role: true } },
              property: {
                select: {
                  id: true,
                  title: true,
                  location: true,
                  price: true,
                  currency: true,
                  type: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
            take: 50,
          });

          for (const m of messages) {
            cursor = m.createdAt;
            send("message", m);
          }

          const unread = await prisma.message.count({
            where: { recipientId: userId, readAt: null },
          });
          send("unread", { count: unread });
        } catch {
          // keep stream alive through transient DB blips
        }
      };

      const pollId = setInterval(() => {
        void poll();
      }, 2500);
      const beatId = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, 15000);

      void poll();

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(pollId);
        clearInterval(beatId);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
