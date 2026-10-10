import test, { mock } from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import nodemailer from "nodemailer";
import { deliverMail } from "../src/modules/mail/service.ts";
import { smtpConfig } from "../src/modules/mail/smtp.ts";
import { config } from "../src/config/env.ts";

test("SMTP provider uses STARTTLS and delivers through the existing outbox sender", async () => {
  const previous = { ...process.env };
  let closed = false;
  const transport = mock.method(nodemailer, "createTransport", (options) => {
    assert.equal(options.host, "smtp.gmail.com");
    assert.equal(options.port, 587);
    assert.equal(options.secure, false);
    assert.equal(options.requireTLS, true);
    assert.equal(options.tls.minVersion, "TLSv1.2");
    assert.equal(options.auth.pass, "testpassword");
    return {
      async sendMail(message) {
        assert.equal(message.to, "buyer@example.com");
        assert.equal(message.from, "test@example.com");
        assert.match(message.text, /verify-email#token=test-token/);
        return { accepted: [message.to], messageId: "test-mail-id" };
      },
      close() { closed = true; },
    };
  });
  try {
    Object.assign(process.env, {
      NODE_ENV: "test", DATABASE_URL: "postgresql://localhost/test", STORAGE_PROVIDER: "local", MAIL_PROVIDER: "nodemailer", APP_URL: "http://localhost:3001",
      SMTP_HOST: "smtp.gmail.com", SMTP_PORT: "587", SMTP_USERNAME: "test@example.com", SMTP_PASSWORD: "test pass word", SMTP_FROM_EMAIL: "test@example.com",
    });
    assert.equal(config().mail, "smtp");
    assert.equal(await deliverMail({ id: "test", template: "verify", payload: { token: "test-token" }, recipient_id: "test", attempts: 1 }, "buyer@example.com"), "test-mail-id");
    assert.equal(closed, true);
    process.env.SMTP_PORT = "25";
    assert.throws(smtpConfig, /465 or 587/);
    process.env.SMTP_PORT = "587";
    delete process.env.SMTP_PASSWORD;
    assert.throws(smtpConfig, /SMTP_PASSWORD/);
  } finally {
    transport.mock.restore();
    for (const key of Object.keys(process.env))
      if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
  }
});
