import React from "react";
import { getSelectOptions } from "@/server/seasons/actions/getSelectOptions";
import { IdMapsProvider } from "@/components/data-view/providers";

export default async function DataLayout({ children }: { children: React.ReactNode }) {
    const { idMaps } = await getSelectOptions();
    return <IdMapsProvider idMaps={idMaps}>{children}</IdMapsProvider>;
}
