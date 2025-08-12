import { IdMapsProvider } from "@/lib/data-view/providers";
import { getSelectOptions } from "@/lib/registration/semester";
import React from "react";

export default async function DataLayout({ children }: { children: React.ReactNode }) {
    const { idMaps } = await getSelectOptions();
    return (
        <IdMapsProvider idMaps={idMaps}>
            {children}
        </IdMapsProvider>
    )
}