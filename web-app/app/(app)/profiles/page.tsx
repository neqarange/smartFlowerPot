import Link from "next/link";
import { Plus, Sprout } from "lucide-react";
import { ProfileCard } from "@/components/profiles/profile-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getProfilesServer } from "@/lib/api-server";

type Tab = "mine" | "community";

function resolveTab(raw: string | undefined): Tab {
  return raw === "community" ? "community" : "mine";
}

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabRaw } = await searchParams;
  const tab = resolveTab(tabRaw);

  const profiles = await getProfilesServer();
  const mine = profiles.filter((p) => p.isOwner);
  const community = profiles.filter((p) => !p.isOwner);
  const visible = tab === "mine" ? mine : community;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Flower profiles</h1>
        <p className="text-sm text-white/60 mt-0.5">
          Define ideal conditions for each species you care for.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <TabLink href="/profiles?tab=mine" active={tab === "mine"}>
            My profiles
            <span className={cn("ml-1 text-xs", tab === "mine" ? "text-white/70" : "text-white/40")}>
              {mine.length}
            </span>
          </TabLink>
          <TabLink href="/profiles?tab=community" active={tab === "community"}>
            Community
            <span
              className={cn("ml-1 text-xs", tab === "community" ? "text-white/70" : "text-white/40")}
            >
              {community.length}
            </span>
          </TabLink>
        </div>
        <Button
          asChild
          className="bg-[#F5A623] hover:bg-[#e8941a] text-black font-bold rounded-xl shadow-[0_8px_24px_-12px_rgba(245,166,35,0.7)]"
        >
          <Link href="/profiles/new">
            <Plus className="size-4" />
            New profile
          </Link>
        </Button>
      </div>

      {visible.length === 0 ? (
        <div
          key={`empty-${tab}`}
          className="animate-in fade-in slide-in-from-bottom-2 duration-[400ms] ease-out"
        >
          <EmptyState tab={tab} />
        </div>
      ) : (
        <div
          key={`grid-${tab}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {visible.map((p, i) => (
            <div
              key={p._id}
              className="animate-in fade-in slide-in-from-bottom-3 duration-[400ms] ease-out"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
            >
              <ProfileCard profile={p} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center px-4 py-1.5 rounded-xl text-sm font-bold border-2 transition-colors whitespace-nowrap",
        active
          ? "bg-black text-white border-white"
          : "bg-black text-white/70 border-black hover:border-white/40 hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  if (tab === "mine") {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 gap-3 text-white/60 rounded-2xl border-2 border-dashed border-white/15">
        <div className="size-12 rounded-full bg-[#F5A623]/15 text-[#F5A623] flex items-center justify-center">
          <Sprout className="size-5" />
        </div>
        <p className="text-base text-white/80">No profiles yet.</p>
        <p className="text-sm text-white/50 max-w-sm">
          Create a profile to capture the ideal temperature, humidity, and light for a species — then
          attach it to a device on the Devices page.
        </p>
        <Button
          asChild
          className="bg-[#F5A623] hover:bg-[#e8941a] text-black font-bold rounded-xl mt-2"
        >
          <Link href="/profiles/new">
            <Plus className="size-4" />
            Create your first profile
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 gap-2 text-white/50 rounded-2xl border-2 border-dashed border-white/15">
      <p className="text-base text-white/70">No community profiles yet.</p>
      <p className="text-sm text-white/50 max-w-sm">
        Public profiles shared by other users will appear here. Mark one of your profiles as public to
        contribute.
      </p>
    </div>
  );
}
