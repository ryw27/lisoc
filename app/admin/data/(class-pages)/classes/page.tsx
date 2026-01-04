import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { type SearchParams } from "@/types/dataview.types";
import { pageRows } from "@/server/data-view/actions/pageRows";
import { parseParams } from "@/server/data-view/actions/parseParams";
import { ClassObject } from "@/server/data-view/entity-configs/(classes)/classes";
import DataDashboard from "@/components/data-view/data-table/data-dashboard";
import HorizontalNav from "@/components/horizontal-nav";

export default async function ClassesPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    // Parse all parameters using the utility function
    const { page, pageSize, sortBy, sortOrder, match, query } = await parseParams(searchParams);
    // Fetch only the data needed for the current page
    const response = await pageRows("classes", {
        page,
        pageSize,
        match,
        sortBy,
        sortOrder,
        query,
    });
    if (!response.ok) {
        return <div>Error: {response.message}</div>;
    }

    const { rows, totalCount } = response;

    const navTabs = [
        { label: "Classes", href: `${ADMIN_DATAVIEW_LINK}/classes` },
        { label: "Classrooms", href: `${ADMIN_DATAVIEW_LINK}/classrooms` },
    ];

    return (
        <div className="flex flex-col gap-4">
            <HorizontalNav tabs={navTabs} />
            <DataDashboard
                data={rows as ClassObject[]}
                totalCount={totalCount as number}
                entity="classes"
            />
        </div>
    );
}

// "use client";

// import React from 'react';
// import {
//   Search,
//   Filter,
//   Download,
//   Plus,
//   ChevronLeft,
//   ChevronRight,
//   Monitor,
//   Users,
//   Info
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// // --- Mock Data ---
// const CLASSROOMS = [
//   { id: "101", name: "Main Hall", type: "Lecture Room", capacity: 80, status: "Active", notes: "Projector, Audio System" },
//   { id: "1103", name: "Seminar A", type: "Classroom", capacity: 33, status: "Active", notes: "16 Tables" },
//   { id: "1105", name: "Seminar B", type: "Classroom", capacity: 32, status: "Maintenance", notes: "AC repair in progress" },
//   { id: "1107", name: "Lab 01", type: "Science Lab", capacity: 40, status: "Active", notes: "Gas connections, Sinks" },
//   { id: "1109", name: "Art Studio", type: "Specialized", capacity: 60, status: "Active", notes: "Long tables, natural light" },
//   { id: "1113", name: "Music Room", type: "Specialized", capacity: 56, status: "Active", notes: "Soundproofed" },
// ];

// export default function ClassroomRegistry() {
//   return (
//     <div className="min-h-screen w-full bg-background text-foreground font-serif p-10 selection:bg-primary selection:text-primary-foreground">
//       <div className="max-w-7xl mx-auto">

//         {/* 1. Header & Breadcrumbs */}
//         <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-8 font-sans">
//           <span>Campus Data</span>
//           <span className="text-border">/</span>
//           <span className="text-foreground">Classroom Registry</span>
//         </nav>

//         <header className="flex justify-between items-end mb-12">
//           <div>
//             <h1 className="text-4xl font-medium tracking-tight text-foreground">Classroom Inventory</h1>
//             <p className="text-sm font-sans text-muted-foreground mt-2">Formal record of all physical learning spaces and capacities.</p>
//           </div>

//           <div className="flex gap-3 font-sans">
//              <button className="h-10 px-6 border border-border rounded shadow-sm hover:bg-muted transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2">
//                 <Download size={14} /> Export Folio
//              </button>
//              <button className="h-10 px-6 bg-foreground text-background rounded shadow-md hover:opacity-90 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2">
//                 <Plus size={14} /> Register Room
//              </button>
//           </div>
//         </header>

//         {/* 2. Utility / Search Bar */}
//         <div className="flex justify-between items-center mb-6 py-4 border-y border-border font-sans">
//           <div className="flex items-center gap-8">
//             <div className="relative">
//               <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground" />
//               <input
//                 type="text"
//                 placeholder="Search by Room ID or Name..."
//                 className="bg-transparent pl-7 pr-4 py-2 text-sm focus:outline-none w-64 border-b border-transparent focus:border-primary transition-colors"
//               />
//             </div>
//             <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-2">
//               <Filter size={14} /> Filter by Status
//             </button>
//           </div>
//           <div className="text-[11px] font-bold text-muted-foreground italic">
//             Displaying {CLASSROOMS.length} Registered Rooms
//           </div>
//         </div>

//         {/* 3. The Ledger View */}
//         <div className="w-full overflow-x-auto">
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="border-b-2 border-foreground/10 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground font-sans">
//                 <th className="py-4 px-2">ID</th>
//                 <th className="py-4 px-4">Room / Designation</th>
//                 <th className="py-4 px-4 text-center">Capacity</th>
//                 <th className="py-4 px-4">Type</th>
//                 <th className="py-4 px-4">Registry Notes</th>
//                 <th className="py-4 px-4 text-right">Action</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-border font-sans">
//               {CLASSROOMS.map((room) => (
//                 <tr key={room.id} className="group hover:bg-muted/30 transition-colors">
//                   <td className="py-5 px-2 text-xs font-mono font-bold text-muted-foreground">
//                     #{room.id}
//                   </td>
//                   <td className="py-5 px-4">
//                     <div className="text-[15px] font-bold text-foreground font-serif group-hover:text-primary transition-colors">
//                         {room.name}
//                     </div>
//                     {room.status === "Maintenance" && (
//                         <span className="text-[9px] font-black uppercase tracking-widest text-destructive bg-destructive/5 px-1.5 py-0.5 rounded border border-destructive/10">
//                             Service Required
//                         </span>
//                     )}
//                   </td>
//                   <td className="py-5 px-4 text-center">
//                     <span className="text-sm font-bold flex items-center justify-center gap-1.5 tabular-nums">
//                         <Users size={12} className="text-muted-foreground" /> {room.capacity}
//                     </span>
//                   </td>
//                   <td className="py-5 px-4 text-xs font-medium text-muted-foreground italic">
//                     {room.type}
//                   </td>
//                   <td className="py-5 px-4 max-w-xs text-xs leading-relaxed text-muted-foreground/80">
//                     {room.notes}
//                   </td>
//                   <td className="py-5 px-4 text-right">
//                     <button className="text-[10px] font-black uppercase tracking-widest border-b border-transparent hover:border-primary hover:text-primary transition-all pb-0.5">
//                         View Folio
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* 4. Registry Pagination */}
//         <footer className="mt-12 flex justify-between items-center py-6 border-t border-border font-sans">
//             <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
//                 Page 01 of 04
//             </div>
//             <div className="flex gap-6">
//                 <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-30">
//                     <ChevronLeft size={14} /> Previous
//                 </button>
//                 <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground hover:text-primary">
//                     Next <ChevronRight size={14} />
//                 </button>
//             </div>
//         </footer>

//         <div className="text-center text-muted-foreground/20 text-[9px] font-normal uppercase tracking-[0.3em] mt-10 pb-10">
//             Administrative Archive • Room Registry Log
//         </div>
//       </div>
//     </div>
//   );
// }
