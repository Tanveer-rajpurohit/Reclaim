import type { Metadata } from "next";
import AuthScreen from "../../components/AuthScreen";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Reclaim to offer event leftovers and find materials for your next project.",
};

export default function LoginPage() {
  return <AuthScreen mode="login" />;
}
