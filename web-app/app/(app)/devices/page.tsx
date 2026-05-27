import { PageHeading } from "@/components/page-heading";
import { DeviceList } from "@/components/devices/device-list";
import { AddDeviceForm } from "@/components/devices/add-device-form";
import { getDevicesServer, getProfilesServer } from "@/lib/api-server";

export default async function DevicesPage() {
  const [devices, profiles] = await Promise.all([getDevicesServer(), getProfilesServer()]);

  return (
    <>
      <PageHeading title="Devices" subtitle="Manage your Smart Flower Pot devices." />
      <div className="max-w-xl flex flex-col gap-6">
        <AddDeviceForm />
        <div>
          <h2 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">Your devices</h2>
          <DeviceList devices={devices} profiles={profiles} />
        </div>
      </div>
    </>
  );
}
