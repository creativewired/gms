import { supabase } from "@/lib/supabaseClient";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .single();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="section-title">Configuration</p>
        <h1 className="page-title">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Your garage info appears on every invoice and document.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}