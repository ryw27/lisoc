import Link from "next/link";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { Registry } from "@/server/data-view/registry";
import EntityFormsHeader from "../entity-forms-header";

export type displaySection = {
    label: string;
    value: string;
};

export type displaySectionGroup = {
    section: string;
    display: displaySection[];
};

interface EntityIdProps {
    entity: keyof Registry;
    title: string;
    displayFields: displaySectionGroup[];
    id: string;
}

export default async function EntityId({ title, entity, displayFields, id }: EntityIdProps) {
    return (
        <div className="h-screen space-y-4 p-6">
            <EntityFormsHeader
                type="view"
                gobacklink={`${ADMIN_DATAVIEW_LINK}/${entity}`}
                // editlink={`${ADMIN_DATAVIEW_LINK}/${entity}/${id}/edit`}
            />

            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="flex justify-between">
                    <h1 className="text-3xl font-bold tracking-tight break-words text-slate-900">
                        {title}
                    </h1>
                    <Link
                        href={`${ADMIN_DATAVIEW_LINK}/${entity}/${id}/edit`}
                        className="text-md rounded-md bg-blue-600 px-4 py-2 font-bold text-white"
                    >
                        Edit
                    </Link>
                </div>

                <div className="mt-6 grid grid-cols-2">
                    {displayFields.map((sectionGroup: displaySectionGroup, idx) => {
                        // Remove right border from left section, left border from right section
                        // Remove border radius on adjacent sides for seamless blend
                        const isLeft = idx % 2 === 0;
                        // const isRight = idx % 2 === 1;
                        const sectionClass = [
                            "bg-white p-5 shadow-sm transition hover:shadow-md border border-slate-200",
                            "grid-rows-1",
                            isLeft
                                ? "rounded-l-2xl rounded-r-none border-r-0"
                                : "rounded-r-2xl rounded-l-none border-l-0",
                        ].join(" ");
                        return (
                            <section key={sectionGroup.section} className={sectionClass}>
                                <div className="mb-4 flex items-center gap-2">
                                    <h2 className="text-xl font-semibold text-blue-700">
                                        {sectionGroup.section}
                                    </h2>
                                </div>
                                <dl className="grid grid-cols-1 gap-y-3">
                                    {sectionGroup.display.map((section, i) => (
                                        <div
                                            key={`${String(section.label)}-${i}`}
                                            className="grid grid-cols-2 items-start gap-3"
                                        >
                                            <dt className="text-md px-4 text-right font-medium tracking-wide text-slate-500 uppercase">
                                                {section.label}
                                            </dt>
                                            <dd className="text-md px-4 break-words text-slate-900">
                                                {section.value ?? "—"}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
