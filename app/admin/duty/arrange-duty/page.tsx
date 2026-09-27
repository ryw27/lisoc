import { redirect } from "next/navigation";

// Assign Duty now lives as the first tab of Duty Management; keep old links working.
export default function ArrangeDutyPage() {
    redirect("/admin/duty/duty-management?tab=assign");
}
