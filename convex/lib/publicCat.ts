import type { Doc } from "../_generated/dataModel";

// Explicit public fields: working notes remain available only to authenticated administrators.
export function publicCat(cat: Doc<"cats">) {
  const { _id, _creationTime, name, subtitle, image, description, age, color, status, gallery,
    gender, birthDate, registrationNumber, isDisplayed, freeText, category, breed } = cat;
  return { _id, _creationTime, name, subtitle, image, description, age, color, status, gallery,
    gender, birthDate, registrationNumber, isDisplayed, freeText, category, breed };
}
