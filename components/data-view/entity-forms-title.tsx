type EntityFormsTitleProps = {
    title: string;
    description: string;
};
export default function EntityFormsTitle({ title, description }: EntityFormsTitleProps) {
    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-md text-gray-700">{description}</p>
        </div>
    );
}
