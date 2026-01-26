import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10000;

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:9001";

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get("company_ids");
  const driverId = req.nextUrl.searchParams.get("driver_id");
  const deliveryId = req.nextUrl.searchParams.get("delivery_id");

  let serverUrl = BACKEND_URL + "/store/deliveries/subscribe";

  // Build query parameters
  const params = new URLSearchParams();
  if (companyId) params.append("company_id", companyId);
  if (driverId) params.append("driver_id", driverId);
  if (deliveryId) params.append("delivery_id", deliveryId);
  
  if (params.toString()) {
    serverUrl += `?${params.toString()}`;
  }

  // Create a transform stream for the response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const initialMessage = {
        message: companyId ? `Subscribing to restaurant ${companyId}` :
                 driverId ? `Subscribing to driver ${driverId}` :
                 deliveryId ? `Subscribing to delivery ${deliveryId}` :
                 "Subscribing to all deliveries"
      };
      
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`));

      try {
        // Use fetch API with streaming instead of EventSource
        const response = await fetch(serverUrl, {
          method: "GET",
          headers: {
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
            "Accept": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok || !response.body) {
          throw new Error(`Failed to connect to backend: ${response.status}`);
        }

        // Create a reader for the backend response stream
        const reader = response.body.getReader();
        
        // Process the stream
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            controller.enqueue(encoder.encode("event: close\ndata: Connection closed\n\n"));
            break;
          }
          
          // Forward the backend SSE data to the client
          const chunk = new TextDecoder().decode(value);
          controller.enqueue(encoder.encode(chunk));
        }
        
        reader.releaseLock();
        controller.close();
        
      } catch (error) {
        console.error("SSE Connection Error:", error);
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: error.message || "Connection failed" })}\n\n`));
        controller.close();
      }
    },
    
    cancel() {
      // Handle stream cancellation
      console.log("SSE connection cancelled by client");
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering for nginx
    },
  });
}