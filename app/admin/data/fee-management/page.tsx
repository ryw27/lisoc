import { db } from "@/lib/db";
import EditAmountCell from "./EditAmount"; // Client component for interaction

//import EditableStatusCell from './EditableStatusCell'; // Client component for interaction

export default async function FeeListPage() {
    const fees = await db.query.feelist.findMany({
        orderBy: (feelist, { asc }) => asc(feelist.feeid),
    });

    return (
        <div className="p-4">
            <h1 className="mb-4 text-2xl font-bold">Fee List (费用管理)</h1>
            <table className="min-w-full border-collapse">
                <thead>
                    <tr>
                        <th className="border p-2">feeid</th>
                        <th className="border p-2">feename</th>
                        <th className="border p-2">feenamen</th>
                        <th className="border p-2">feeamount</th>
                        <th className="border p-2">notes</th>
                    </tr>
                </thead>
                <tbody>
                    {fees.map((fee) => (
                        <tr key={fee.feeid}>
                            <td className="border p-2">{fee.feeid}</td>
                            <td className="border p-2">{fee.feename}</td>
                            <td className="border p-2">{fee.feenameen}</td>
                            <td className="border p-2">
                                <EditAmountCell
                                    id={fee.feeid}
                                    initialAmount={Number(fee.feeamount)}
                                />
                            </td>
                            <td className="border p-2">{fee.notes}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
