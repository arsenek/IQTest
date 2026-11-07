import { z } from "zod";
import { INDEX_KEYS, ITEM_TYPES } from "./types";

const indexKeySchema = z.enum(INDEX_KEYS);
const itemTypeSchema = z.enum(ITEM_TYPES);

export const itemSchema = z.object({
  id: z.string().min(1),
  type: itemTypeSchema,
  prompt: z.string().min(1),
  choices: z.array(z.string()).optional(),
  answer: z.union([z.string(), z.number(), z.array(z.string())]),
  timeLimitMs: z.number().int().positive().optional(),
});

export const subtestSchema = z.object({
  id: z.string().min(1),
  indexKey: indexKeySchema,
  title: z.string().min(1),
  items: z.array(itemSchema).min(5),
});

export const contentPackSchema = z
  .object({
    id: z.string().min(1),
    audience: z.enum(["child", "adult"]),
    title: z.string().min(1),
    subtests: z.array(subtestSchema).min(4),
  })
  .superRefine((pack, ctx) => {
    const keys = new Set(pack.subtests.map((s) => s.indexKey));
    for (const key of INDEX_KEYS) {
      if (!keys.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: `pack missing required index ${key}`,
          path: ["subtests"],
        });
      }
    }
  });

const indexStatsSchema = z.object({
  VCI: z.number(),
  PRI: z.number(),
  WMI: z.number(),
  PSI: z.number(),
});

export const normTablesSchema = z.object({
  version: z.string().min(1),
  trial: z.literal(true),
  ageBands: z
    .array(
      z.object({
        minAgeMonths: z.number().int().nonnegative(),
        maxAgeMonths: z.number().int().positive(),
        means: indexStatsSchema,
        sds: indexStatsSchema,
      }),
    )
    .min(1),
});
