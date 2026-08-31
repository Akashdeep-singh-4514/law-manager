import { db } from "../index";
import { genders } from "../schema";

const defaultGenders = [
    { name: "Male", code: "male" },
    { name: "Female", code: "female" },
    { name: "Other", code: "other" },
];

export async function genderSeeder() {
    await db
        .insert(genders)
        .values(defaultGenders)
        .onConflictDoNothing({
            target: genders.code,
        });
}