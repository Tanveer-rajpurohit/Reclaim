import { config } from "../../config/env.ts";

const theme = {
  blue: "#185b8c",
  ink: "#272b2d",
  muted: "#646d72",
  line: "#e5e8e9",
  surface: "#ffffff",
  background: "#f8fafb",
  soft: "#eef4f8",
};
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );

export function renderMail(
  job: { template: string; payload: Record<string, string> },
  recipient = "",
) {
  const origin = config().appUrl;
  let subject: string;
  let heading: string;
  let detail: string;
  let href: string;
  let action: string;
  let note: string;
  let code = "";
  if (job.template === "verify") {
    subject = "Verify your Reclaim email";
    heading = "Your verification code";
    code = job.payload.code || "";
    detail =
      "Enter this six-digit code to add a verified email to your Reclaim profile.";
    href = `${origin}/verify-email?email=${encodeURIComponent(recipient)}&next=/dashboard/profile`;
    action = "Verify email";
    note =
      "This code expires in 10 minutes. Do not share it. If you did not request it, you can ignore this email.";
  } else if (job.template === "reset") {
    subject = "Reset your Reclaim password";
    heading = "Choose a new password";
    detail =
      "We received a request to reset your Reclaim password. Use the button below to choose a new one.";
    href = `${origin}/reset-password#token=${encodeURIComponent(job.payload.token || "")}`;
    action = "Reset password";
    note =
      "This link expires in one hour. If you did not request it, you can ignore this email. Your password will stay the same.";
  } else {
    subject = job.payload.title || "Your Reclaim handover";
    heading = subject;
    detail = job.payload.detail || "Open Reclaim to view your handover update.";
    const path = job.payload.href || "/dashboard/deals";
    href = `${origin}${/^\/dashboard(?:\/|$)/.test(path) && !path.includes("\\") ? path : "/dashboard/deals"}`;
    action = "View handover";
    note =
      "Sign in to view your handover and arrange collection with the other participant.";
  }
  const text = `${heading}${code ? `\n\nYour Reclaim verification code is ${code}.` : ""}\n\n${detail}\n\n${action}: ${href}\n\n${note}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(subject)}</title></head><body style="margin:0;background:${theme.background};color:${theme.ink};font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escape(heading)}${code ? ". Your code expires in 10 minutes." : ""}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px"><tr><td style="padding:0 0 24px;color:${theme.blue};font-size:26px;letter-spacing:-1px">reclaim</td></tr><tr><td style="background:${theme.surface};border:1px solid ${theme.line};border-radius:16px;padding:32px"><h1 style="margin:0 0 16px;font-size:26px;font-weight:500;line-height:1.3">${escape(heading)}</h1><p style="margin:0;color:${theme.muted};font-size:15px;line-height:1.7">${escape(detail)}</p>${code ? `<div style="margin:24px 0;background:${theme.soft};border-radius:10px;padding:24px 12px;text-align:center;color:${theme.blue};font-family:monospace;font-size:34px;letter-spacing:6px">${escape(code)}</div>` : ""}<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px"><tr><td style="background:${theme.blue};border-radius:8px"><a href="${escape(href)}" style="display:inline-block;padding:14px 24px;color:${theme.surface};font-size:14px;text-decoration:none;font-weight:600">${escape(action)}</a></td></tr></table><p style="margin:24px 0 0;padding-top:24px;border-top:1px solid ${theme.line};color:${theme.muted};font-size:12px;line-height:1.7">${escape(note)}</p></td></tr><tr><td style="padding:20px 0;color:${theme.muted};font-size:12px;line-height:1.6">Reclaim · A next use for event leftovers.<br>One account to offer and collect materials.</td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}
