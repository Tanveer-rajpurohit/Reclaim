import type { Metadata } from "next";
import AuthScreen from "../../components/AuthScreen";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Join Reclaim to offer leftover materials, request a batch and arrange your next handover.",
};

export default function RegisterPage() {
  return <AuthScreen mode="register" />;
}
