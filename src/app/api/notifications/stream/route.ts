import { NextRequest } from "next/server";
import { Notification } from "@/lib/interface/notification";

const connections = new Map<string, ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response("Missing userId parameter", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      connections.set(userId, controller);
      controller.enqueue(
        `data: ${JSON.stringify({
          type: "connected",
          message: "SSE connection established",
          timestamp: new Date().toISOString(),
        })}\n\n`
      );

      console.log(`SSE connection established for user: ${userId}`);
    },
    cancel() {
      connections.delete(userId);
      console.log(`SSE connection closed for user: ${userId}`);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

export function broadcastNotification(
  userId: string,
  notification: Notification
) {
  const controller = connections.get(userId);
  if (controller) {
    try {
      controller.enqueue(
        `data: ${JSON.stringify({
          type: "notification",
          data: notification,
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
      console.log(`Notification broadcasted to user: ${userId}`);
      return true;
    } catch (error) {
      console.error(`Failed to broadcast to user ${userId}:`, error);
      connections.delete(userId);
      return false;
    }
  }
  return false;
}

export function broadcastToAll(notification: Notification) {
  let successCount = 0;
  connections.forEach((controller, userId) => {
    try {
      controller.enqueue(
        `data: ${JSON.stringify({
          type: "broadcast",
          data: notification,
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
      successCount++;
    } catch (error) {
      console.error(`Failed to broadcast to user ${userId}:`, error);
      connections.delete(userId);
    }
  });
  console.log(`Broadcasted to ${successCount} connected users`);
  return successCount;
}
