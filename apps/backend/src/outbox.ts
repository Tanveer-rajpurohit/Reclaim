import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { config } from "./config.ts";
import { prisma, query, transaction, type DB } from "./db.ts";

export async function notify(
  db: DB,
  recipient: string,
  kind: string,
  title: string,
  detail: string,
  href: string,
  transition: string,
  email = true,
) {
  const dedupe = `${transition}:${recipient}:${kind}`;
  await db.notification.createMany({
    data: [
      {
        id: randomUUID(),
        recipient_id: recipient,
        kind,
        title,
        detail,
        href,
        dedupe_key: dedupe,
      },
    ],
    skipDuplicates: true,
  });
  if (
    email &&
    (await db.user.count({
      where: { id: recipient, verified_at: { not: null } },
    }))
  )
    await db.outbox.createMany({
      data: [
        {
          id: randomUUID(),
          recipient_id: recipient,
          template: "handover",
          payload: { title, detail, href },
          dedupe_key: dedupe,
        },
      ],
      skipDuplicates: true,
    });
}
interface Job {
  id: string;
  recipient_id: string;
  template: string;
  payload: Record<string, string>;
  attempts: number;
}
export function renderMail(job: Pick<Job, "template" | "payload">) {
  const origin = config().appUrl;
  if (job.template === "verify")
    return {
      subject: "Verify your Reclaim email",
      text: `Verify your email to start using Reclaim:\n${origin}/verify-email#token=${job.payload.token}\n\nThis link expires in 24 hours. If you did not register, ignore this email.`,
    };
  if (job.template === "reset")
    return {
      subject: "Reset your Reclaim password",
      text: `Choose a new password:\n${origin}/reset-password#token=${job.payload.token}\n\nThis link expires in one hour. If you did not request it, ignore this email.`,
    };
  return {
    subject: job.payload.title || "Your Reclaim handover",
    text: `${job.payload.title}\n\n${job.payload.detail}\n\nOpen your handover after signing in:\n${origin}${job.payload.href}`,
  };
}
export async function deliverMail(job: Job, to: string) {
  const cfg = config();
  const message = renderMail(job);
  if (cfg.mail === "file") {
    const directory = join(cfg.localDir, "mail");
    await mkdir(directory, { recursive: true });
    // Stable filename makes development delivery retries idempotent.
    await writeFile(
      join(directory, `${job.id}.json`),
      JSON.stringify({ to, ...message }, null, 2),
    );
    return `file:${job.id}`;
  }
  const client = new SESv2Client({ region: cfg.region });
  const result = await client.send(
    new SendEmailCommand({
      FromEmailAddress: cfg.from,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: message.subject, Charset: "UTF-8" },
          Body: { Text: { Data: message.text, Charset: "UTF-8" } },
        },
      },
    }),
  );
  return result.MessageId || "ses:accepted";
}
export async function processOutbox(limit = 20, sender = deliverMail) {
  let processed = 0;
  for (let i = 0; i < limit; i++) {
    const job: Job | undefined = await transaction(async (db) => {
      const found = await query<Job>(
        db,
        `SELECT * FROM outbox WHERE (status='pending' AND available_at<=now())
        OR (status='sending' AND lease_until<now()) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`,
      );
      if (!found.rowCount) return undefined;
      const row = found.rows[0]!;
      await db.outbox.update({
        where: { id: row.id },
        data: {
          status: "sending",
          attempts: { increment: 1 },
          lease_until: new Date(Date.now() + 300000),
        },
      });
      return { ...row, attempts: row.attempts + 1 };
    });
    if (!job) break;
    try {
      const result = await prisma().user.findUnique({
        where: { id: job.recipient_id },
        select: { email: true, verified_at: true },
      });
      const recipient = result;
      if (!recipient || (job.template === "handover" && !recipient.verified_at))
        throw new Error("Recipient is not eligible for email.");
      const messageId = await sender(job, recipient.email);
      await prisma().outbox.updateMany({
        where: { id: job.id, attempts: job.attempts },
        data: {
          status: "sent",
          sent_at: new Date(),
          provider_message_id: messageId,
          lease_until: null,
          ...(["verify", "reset"].includes(job.template)
            ? { payload: {} }
            : {}),
        },
      });
    } catch (error) {
      const permanent =
        job.attempts >= 5 ||
        (error instanceof Error &&
          /MessageRejected|MailFromDomainNotVerified|BadRequest|not eligible/.test(
            error.name + error.message,
          ));
      await prisma().outbox.updateMany({
        where: { id: job.id, attempts: job.attempts },
        data: {
          status: permanent ? "failed" : "pending",
          available_at: new Date(
            Date.now() + Math.min(3600, 30 * 2 ** job.attempts) * 1000,
          ),
          lease_until: null,
          last_error: error instanceof Error ? error.name : "DeliveryError",
        },
      });
    }
    processed++;
  }
  return processed;
}
