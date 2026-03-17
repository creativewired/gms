import { supabase } from "@/lib/supabaseClient";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Garage Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Your garage info appears on every invoice.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
