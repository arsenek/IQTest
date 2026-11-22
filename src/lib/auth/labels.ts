/** User-facing Chinese label for ProfileKind — never show bare CHILD/ADULT. */
export function profileKindLabel(kind: "CHILD" | "ADULT"): "儿童" | "成人" {
  return kind === "CHILD" ? "儿童" : "成人";
}
