import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { type FormSections } from "@/types/dataview.types";
import { Registry } from "@/server/data-view/registry";
import EntityFormsHeader from "@/components/data-view/entity-forms-header";
import EntityFormsTitle from "@/components/data-view/entity-forms-title";
import EditEntityForm from "./edit-entity-form";

type EditEntityProps = {
    entity: keyof Registry;
    title: string;
    description: string;
    fields: FormSections[];
    hiddenInputs: Record<string, string | number | boolean>;
};
export default function EditEntity({
    entity,
    title,
    description,
    fields,
    hiddenInputs,
}: EditEntityProps) {
    return (
        <div className="container mx-auto flex flex-col gap-6">
            <EntityFormsHeader type="edit" gobacklink={`${ADMIN_DATAVIEW_LINK}/${entity}`} />
            <EntityFormsTitle title={title} description={description} />
            <EditEntityForm entity={entity} fields={fields} hiddenInputs={hiddenInputs} />
        </div>
    );
}
