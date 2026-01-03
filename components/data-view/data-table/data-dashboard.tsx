import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataTable from "../data-table/data-table";

// import { useDataEntityContext } from "@/lib/data-view/providers";

export default function DataDashboard<RowType>({
    data,
    totalCount,
    entity,
}: {
    data: RowType[];
    totalCount: number;
    entity: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {/* <h1 className="text-3xl font-bold">View {tableName}</h1>
                    <AddEntityButton tablename={tableName} /> */}
                    <div className="flex flex-col gap-2 px-4 py-2">
                        <p className="text-3xl font-bold">View all {entity}</p>
                        <span className="text-sm font-normal text-gray-500">
                            There are currently {totalCount} {entity}.
                        </span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <DataTable data={data} totalCount={totalCount} />
                </div>
            </CardContent>
        </Card>
    );
}
