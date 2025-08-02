import RegisterButton from "./LEGACY_register-button"
import { type threeSeasons } from "@/lib/registration/types"
import { getSelectOptions } from "@/lib/registration/semester";
import { familyRegister } from "@/lib/registration";
import { InferSelectModel } from "drizzle-orm";
import { arrangement, seasons } from "@/lib/db/schema";
import { toESTString } from "@/lib/utils";


type InfoBoxClassProps = {
    arrInfo:  InferSelectModel<typeof arrangement>  
    seasonInfo: InferSelectModel<typeof seasons>  
    yearClass: boolean
}
export default async function InfoBoxClass({ arrInfo, seasonInfo, yearClass }: InfoBoxClassProps) {
    // TODO: More efficient here?
    const { idMaps } = await getSelectOptions();

    const calculatePrice = () => {
        if (yearClass) {
            return Number(arrInfo.tuitionW || "0") + Number(arrInfo.bookfeeW + "0") + Number(arrInfo.specialfeeW || "0");
        } else {
            return Number(arrInfo.tuitionH || "0") + Number(arrInfo.bookfeeH + "0") + Number(arrInfo.specialfeeH || "0");
        }
    }

    const checkRegOpen = () => {
        const now = new Date(toESTString(new Date()));
        console.log(seasonInfo.closeregdate)
        console.log(seasonInfo.earlyregdate);
        if (now >= new Date(seasonInfo.closeregdate) || now <= new Date(seasonInfo.earlyregdate)) {
            return false;
        }
        return true;
    }

    return (
        <div className="flex flex-col border-b border-gray-300 gap-2 p-2">
            <div className="flex justify-between">
                <p className="font-bold text-md">{idMaps.classMap[arrInfo.classid].classnamecn}</p>
                <p className="font-bold text-md">{calculatePrice()}</p>
            </div>
            <div className="flex justify-between">
                <p className="text-sm font-md">{checkRegOpen() ? "Open for Registration" : "Registration Closed"}</p>
            </div>
        </div>
    )
}