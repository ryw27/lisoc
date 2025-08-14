import { FormSections } from "@/lib/data-view/types";
import EntityFormsTitle from '@/components/data-view/entity-forms-title';
import AddEntityForm from "./add-entity-form";
import { Registry } from "@/lib/data-view/registry";

type AddEntityProps = {
    entity: keyof Registry; 
    title: string;
    description: string;
    fields: FormSections[];
}
export default function AddEntity({
    entity,
    title,
    description,
    fields
}: AddEntityProps) {
    return (
        <div className="container mx-auto flex gap-6 flex-col">
            <EntityFormsTitle
                title={title}
                description={description}
            />
            <AddEntityForm
                entity={entity}
                fields={fields}
            />
        </div>
    );
}