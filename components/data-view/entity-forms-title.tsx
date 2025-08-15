type EntityFormsTitleProps = {
    title: string;
    description: string;
}
export default function EntityFormsTitle({ 
    title, 
    description 
}: EntityFormsTitleProps) {
    return (
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-2">
            <h1 className="text-3xl font-bold">
                {title}
            </h1>
            <p className="text-gray-700 text-md">
                {description}
            </p>
        </div>
    )
}