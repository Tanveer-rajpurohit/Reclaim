import PublicProfile from "@/components/people/PublicProfile";
import type { PublicProfilePageProps } from "@/types/people/type";
export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { id } = await params;
  return <PublicProfile id={id} />;
}
