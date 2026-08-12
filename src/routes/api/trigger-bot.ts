import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const payloadSchema = z.object({
  phone_number: z
    .string()
    .trim()
    .regex(/^\+?\d{10,15}$/, "phone_number must be 10-15 digits"),
});

export const Route = createFileRoute("/api/trigger-bot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
            { status: 400 },
          );
        }

        const phone_number = parsed.data.phone_number;

        // Ensure the registration row exists with status 'pending'
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const table = (supabaseAdmin as any).from("users");
        const { error: dbError } = await table.upsert(
          { phone_number, status: "pending" },
          { onConflict: "phone_number", ignoreDuplicates: true },
        );


        if (dbError) {
          return Response.json({ error: dbError.message }, { status: 500 });
        }

        // Forward to the external Playwright bot when configured
        const webhookUrl = process.env["BOT_WEBHOOK_URL"];
        if (!webhookUrl) {
          return Response.json({
            ok: true,
            queued: false,
            message: "Phone saved. Bot webhook URL not configured yet.",
          });
        }

        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(process.env["BOT_WEBHOOK_SECRET"]
                ? { "x-webhook-secret": process.env["BOT_WEBHOOK_SECRET"]! }
                : {}),
            },
            body: JSON.stringify({ phone_number }),
          });
          if (!res.ok) {
            return Response.json(
              { ok: true, queued: false, message: `Bot responded ${res.status}` },
              { status: 202 },
            );
          }
        } catch {
          return Response.json(
            { ok: true, queued: false, message: "Bot unreachable" },
            { status: 202 },
          );
        }

        return Response.json({ ok: true, queued: true });
      },
    },
  },
});
