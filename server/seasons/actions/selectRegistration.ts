"use server";

import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";

export async function selectRegistrationClass(): Promise<InferSelectModel<typeof classes>[]> {

    let result : InferSelectModel<typeof classes>[]  =[]

    try 
    {
        const allclasses: InferSelectModel<typeof classes>[] = await db.query.classes.findMany({
            where: (c, { and, or , eq }) => and(eq(c.status, "Active"),or(eq(c.typeid ,1), eq(c.typeid,2))),
            orderBy :(c,{asc}) =>asc(c.gradeclassid)
        })

        for(const cls of allclasses)
        {
            const description = cls.description? cls.description.toLowerCase() : "" 

            if(description.includes("registration") && description.includes("only"))
            {
                result.push(cls);
            }    
        }
        return result;
    }
    catch
    {
        console.log("error")
    }
    
    return result 


} 
