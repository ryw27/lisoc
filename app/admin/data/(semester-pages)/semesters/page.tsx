import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";

export default async function SemestersPage() {
    const semesters = await db
        .select()
        .from(seasons)
        .where(eq(seasons.status, "Active"))
        .limit(1)
        .execute();

    return (
        <div>
            <h1>Semesters</h1>
            <pre>{JSON.stringify(semesters, null, 2)}</pre>
        </div>
    );
}
