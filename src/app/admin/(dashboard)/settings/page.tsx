import { getSiteSettings } from "@/lib/data";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-muted-foreground">Manage store details</p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
