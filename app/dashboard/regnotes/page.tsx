import RegNotes from "@/components/registration/family/regnotes";
import fetchCurrentSeasons from "@/server/seasons/data";

export default async function RegNotesPage() {

    const res = await fetchCurrentSeasons();
//    const seasons = { year: res.year, fall: res.fall, spring: res.spring } satisfies threeSeasons;
    
    return (
      <RegNotes notes={res.fall.notes ?? ""} />
    );
}
