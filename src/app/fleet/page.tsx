import { supabase } from "@/lib/supabaseClient";
import FleetClient from "./FleetClient";

export default async function FleetPage() {
  const { data: fleets } = await supabase
    .from("fleets")
    .select("*, branches(name)")
    .order("company_name");

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*, customers(name), fleets(company_name)")
    .order("plate_number");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("vehicle_id, status, total_amount")
    .order("created_at", { ascending: false });

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // Build per-fleet stats
  const fleetVehicles: Record<number, any[]> = {};  const fleetRevenue: Record<number, number> = {};
  const fleetJobs: Record<number, number> = {};

  (vehicles ?? []).forEach(v => {
    if (v.fleet_id) {
      if (!fleetVehicles[v.fleet_id]) fleetVehicles[v.fleet_id] = [];
      fleetVehicles[v.fleet_id]!.push(v);
    }
  });

  const vehicleToFleet: Record<number, number> = {};
  (vehicles ?? []).forEach(v => {
    if (v.fleet_id) vehicleToFleet[v.id] = v.fleet_id;
  });

  (jobs ?? []).forEach(j => {
    const fid = vehicleToFleet[j.vehicle_id];
    if (fid) {
      fleetRevenue[fid] = (fleetRevenue[fid] ?? 0) + Number(j.total_amount);
      fleetJobs[fid] = (fleetJobs[fid] ?? 0) + 1;
    }
  });

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="page-header">
        <div>
          <p className="section-title">Operations</p>
          <h1 className="page-title">Fleet Management</h1>
        </div>
      </div>
      <FleetClient
        initialFleets={fleets ?? []}
        allVehicles={vehicles ?? []}
        branches={branches ?? []}
        fleetVehicles={fleetVehicles}
        fleetRevenue={fleetRevenue}
        fleetJobs={fleetJobs}
      />
    </div>
  );
}
