import { Suspense } from "react";
import { TopNav } from "@/components/top-nav";
import { DeviceSwitcherPill } from "@/components/device-switcher-pill";
import { getDevicesServer, getProfileByIdServer } from "@/lib/api-server";
import type { FlowerProfile } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const devices = await getDevicesServer();
  const profilesById: Record<string, FlowerProfile | null> = {};
  await Promise.all(
    devices.map(async (d) => {
      profilesById[d.deviceId] = d.activeProfileId
        ? await getProfileByIdServer(d.activeProfileId)
        : null;
    }),
  );

  return (
    <>
      <Suspense fallback={null}>
        <TopNav />
      </Suspense>
      <main className="bg-black min-h-screen p-4 sm:p-6">
        <div className="relative">
          {devices.length > 0 && (
            <div className="absolute right-0 top-0 z-40">
              <Suspense fallback={null}>
                <DeviceSwitcherPill devices={devices} profilesById={profilesById} />
              </Suspense>
            </div>
          )}
          {children}
        </div>
      </main>
    </>
  );
}
