import { NotificationEmpty } from "@/components/notification-empty";
import { NotificationList } from "@/components/notification-list";
import { PageHeading } from "@/components/page-heading";
import {
  getDevicesServer,
  getProfileByIdServer,
  getReadingsServer,
} from "@/lib/api-server";
import { deriveNotifications } from "@/lib/notifications";
import type { FlowerProfile, SensorReading } from "@/lib/types";

export default async function NotificationsPage() {
  const devices = await getDevicesServer();

  const readingsByDevice: Record<string, SensorReading[]> = {};
  const profilesByDevice: Record<string, FlowerProfile | null> = {};

  await Promise.all(
    devices.map(async (d) => {
      const [readings, profile] = await Promise.all([
        getReadingsServer(d.deviceId),
        d.activeProfileId ? getProfileByIdServer(d.activeProfileId) : Promise.resolve(null),
      ]);
      readingsByDevice[d.deviceId] = readings;
      profilesByDevice[d.deviceId] = profile;
    }),
  );

  const notifications = deriveNotifications(devices, readingsByDevice, profilesByDevice);

  return (
    <>
      <PageHeading title="Notifications" subtitle="Alerts and plant updates" />
      <div className="max-w-6xl mx-auto">
        {notifications.length === 0 ? (
          <NotificationEmpty />
        ) : (
          <NotificationList items={notifications} />
        )}
      </div>
    </>
  );
}
