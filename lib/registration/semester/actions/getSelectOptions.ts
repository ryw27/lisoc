"use server";
import { db } from "@/lib/db";
import { selectOptions, IdMaps } from "../../types";


export async function getSelectOptions() {
    const teachers = await db.query.teacher.findMany({
        columns: {
            teacherid: true,
            namecn: true,
            namelasten: true,
            namefirsten: true
        }
    });

    // Get registration classes only
    const classes = await db.query.classes.findMany({
        // where: (classes, { eq }) => eq(classes.gradeclassid, classes.classid), // TODO: Uncomment this
        columns: {
            classid: true,
            classno: true,
            classnamecn: true,
            classnameen: true,
            
        }
    })

    const rooms = await db.query.classrooms.findMany({
        columns: {
            roomid: true,
            roomno: true,
        }
    })

    const times = await db.query.classtime.findMany({
        columns: {
            timeid: true,
            period: true,
        }
    })

    const terms = await db.query.suitableterm.findMany({
        columns: {
            termno: true,
            suitableterm: true,
            suitabletermcn: true 
        }
    })
    const options = {
        teachers: teachers,
        classes: classes,
        rooms: rooms,
        times: times,
        terms: terms
    } satisfies selectOptions;


    const idMaps = {
        teacherMap: Object.fromEntries(
            teachers.map(teacher => [teacher.teacherid, teacher])
        ),
        classMap: Object.fromEntries(
            classes.map(cls => [cls.classid, cls])
        ),
        roomMap: Object.fromEntries(
            rooms.map(room => [room.roomid, room])
        ),
        timeMap: Object.fromEntries(
            times.map(time => [time.timeid, time])
        ),
        termMap: Object.fromEntries(
            terms.map(term => [term.termno, term])
        ),
    } satisfies IdMaps;


    return { options, idMaps };
}