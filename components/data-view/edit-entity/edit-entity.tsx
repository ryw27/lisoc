import { FormSections } from "@/lib/data-view/types";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import EntityFormsHeader from '@/components/data-view/entity-forms-header';
import EntityFormsTitle from '@/components/data-view/entity-forms-title';
import EditEntityForm from "./edit-entity-form";
import { Registry } from "@/lib/data-view/registry";

type EditEntityProps = {
    entity: keyof Registry; 
    title: string;
    description: string;
    fields: FormSections[];
    hiddenInputs: Record<string, string | number | boolean>;
}
export default function EditEntity({
    entity,
    title,
    description,
    fields,
    hiddenInputs
}: EditEntityProps) {
    return (
        <div className="container mx-auto flex gap-6 flex-col">
            <EntityFormsHeader
                type="edit"
                gobacklink={`${ADMIN_DATAVIEW_LINK}/${entity}`}
            />
            <EntityFormsTitle
                title={title}
                description={description}
            />
            <EditEntityForm
                entity={entity}
                fields={fields}
                hiddenInputs={hiddenInputs}
            />
        </div>
    );
}