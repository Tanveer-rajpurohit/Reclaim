import nodemailer from "nodemailer";

export function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD?.replace(/\s/g, "");
  const from = process.env.SMTP_FROM_EMAIL;
  if (!host || !user || !pass || !from || ![465, 587].includes(port))
    throw new Error(
      "SMTP requires SMTP_HOST, SMTP_PORT (465 or 587), SMTP_USERNAME, SMTP_PASSWORD and SMTP_FROM_EMAIL.",
    );
  return {
    from,
    options: {
      host,
      port,
      secure: port === 465,
      requireTLS: true,
      auth: { user, pass },
      tls: { minVersion: "TLSv1.2" as const },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      disableFileAccess: true,
      disableUrlAccess: true,
    },
  };
}
export async function sendSmtp(
  to: string,
  message: { subject: string; text: string; html?: string },
) {
  const cfg = smtpConfig();
  const transport = nodemailer.createTransport(cfg.options);
  try {
    const result = await transport.sendMail({ from: cfg.from, to, ...message });
    if (!result.accepted.length)
      throw new Error("SMTP did not accept the recipient.");
    return result.messageId;
  } catch (cause) {
    const error = new Error(
      "SMTP delivery failed. Check the mail configuration and app password.",
    );
    if (
      cause &&
      typeof cause === "object" &&
      "code" in cause &&
      typeof cause.code === "string" &&
      /^[A-Z]{3,20}$/.test(cause.code)
    )
      error.name = `SMTP${cause.code}`;
    throw error;
  } finally {
    transport.close();
  }
}
