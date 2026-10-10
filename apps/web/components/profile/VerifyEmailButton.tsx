"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Controls";
import Toast from "@/components/ui/Toast";

export default function VerifyEmailButton({ email }: { email: string }) {
  const auth = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <div className="mt-4">
      <p className="text-xs leading-5 text-muted">
        Optional. Verify to receive handover emails and show buyers and sellers
        that this email belongs to you.
      </p>
      <Button
        variant="secondary"
        className="mt-3"
        disabled={auth.isPending}
        onClick={async () => {
          setError("");
          try {
            await auth.mutateAsync({ action: "resend", email });
            router.push(
              `/verify-email?email=${encodeURIComponent(email)}&sent=1&next=/dashboard/profile`,
            );
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Could not send a code. Please try again.",
            );
          }
        }}
      >
        {auth.isPending ? "Sending code…" : "Verify email"}
      </Button>
      <Toast message={error} tone="error" onDismiss={() => setError("")} />
    </div>
  );
}
