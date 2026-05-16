import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminuser, family, users } from "@/lib/db/schema";

async function upsertAdmin(email: string, name: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const existing = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
    });

    let userId: string;
    if (existing) {
        await db
            .update(users)
            .set({
                password: passwordHash,
                emailVerified: now,
                roles: ["ADMINUSER"],
                name,
                updateon: now,
            })
            .where(eq(users.id, existing.id));
        userId = existing.id;
        console.log(`[admin] updated existing user ${email} (${userId})`);
    } else {
        const [row] = await db
            .insert(users)
            .values({
                email,
                name,
                password: passwordHash,
                emailVerified: now,
                roles: ["ADMINUSER"],
                createon: now,
                updateon: now,
            })
            .returning({ id: users.id });
        userId = row.id;
        console.log(`[admin] inserted user ${email} (${userId})`);
    }

    const adminRow = await db.query.adminuser.findFirst({
        where: (a, { eq }) => eq(a.userid, userId),
    });

    if (adminRow) {
        await db
            .update(adminuser)
            .set({
                ischangepwdnext: false,
                status: "Active",
            })
            .where(eq(adminuser.adminid, adminRow.adminid));
        console.log(`[admin] updated adminuser row ${adminRow.adminid}`);
    } else {
        await db.insert(adminuser).values({
            userid: userId,
            namecn: "管理员",
            firstname: "Admin",
            lastname: "User",
            address1: "n/a",
            status: "Active",
            ischangepwdnext: false,
            createby: "seed",
            updateby: "seed",
        });
        console.log(`[admin] inserted adminuser row for user ${userId}`);
    }
}

async function upsertFamily(email: string, name: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const existing = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
    });

    let userId: string;
    if (existing) {
        await db
            .update(users)
            .set({
                password: passwordHash,
                emailVerified: now,
                roles: ["FAMILY"],
                name,
                address: "123 Test St",
                city: "Stony Brook",
                state: "NY",
                zip: "11790",
                phone: "555-0100",
                updateon: now,
            })
            .where(eq(users.id, existing.id));
        userId = existing.id;
        console.log(`[family] updated existing user ${email} (${userId})`);
    } else {
        const [row] = await db
            .insert(users)
            .values({
                email,
                name,
                password: passwordHash,
                emailVerified: now,
                roles: ["FAMILY"],
                address: "123 Test St",
                city: "Stony Brook",
                state: "NY",
                zip: "11790",
                phone: "555-0100",
                createon: now,
                updateon: now,
            })
            .returning({ id: users.id });
        userId = row.id;
        console.log(`[family] inserted user ${email} (${userId})`);
    }

    const familyRow = await db.query.family.findFirst({
        where: (f, { eq }) => eq(f.userid, userId),
    });

    if (familyRow) {
        console.log(`[family] family row already exists (familyid=${familyRow.familyid})`);
    } else {
        const [inserted] = await db
            .insert(family)
            .values({
                userid: userId,
                fatherfirsten: "Test",
                fatherlasten: "Parent",
                fathernamecn: "测试家长",
                motherfirsten: "Test",
                motherlasten: "Parent",
                mothernamecn: "测试家长",
                contact: "555-0100",
                address1: "123 Test St",
                officephone: "",
                cellphone: "555-0100",
                email2: "",
                status: true,
                remark: "Seeded test family",
            })
            .returning({ familyid: family.familyid });
        console.log(`[family] inserted family row (familyid=${inserted.familyid})`);
    }
}

async function main() {
    await upsertAdmin("admin@lisoc.org", "admin", "123456");
    await upsertFamily("user@lisoc.org", "user", "123456");
    console.log("\nSeed complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
