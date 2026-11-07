/** Whole years of age at `at` (default now). */
export function yearsOld(birthDate: Date, at: Date = new Date()): number {
  let years = at.getFullYear() - birthDate.getFullYear();
  const monthDiff = at.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && at.getDate() < birthDate.getDate())
  ) {
    years -= 1;
  }
  return years;
}

/** CHILD if age < 16, else ADULT. */
export function profileKindFromBirthDate(
  birthDate: Date,
): "CHILD" | "ADULT" {
  return yearsOld(birthDate) < 16 ? "CHILD" : "ADULT";
}
