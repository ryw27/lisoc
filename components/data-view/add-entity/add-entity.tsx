import { type FormSections } from "@/types/dataview.types";
import { Registry } from "@/server/data-view/registry";
import EntityFormsTitle from "@/components/data-view/entity-forms-title";
import AddEntityForm from "./add-entity-form";

type AddEntityProps = {
    entity: keyof Registry;
    title: string;
    description: string;
    fields: FormSections[];
};
export default function AddEntity({ entity, title, description, fields }: AddEntityProps) {
    return (
        <div className="container mx-auto flex flex-col gap-6">
            <EntityFormsTitle title={title} description={description} />
            <AddEntityForm entity={entity} fields={fields} />
        </div>
    );
}
