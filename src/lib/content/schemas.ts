import { z } from "zod";
import { INDEX_KEYS, ITEM_TYPES, PACK_POOLS, SCORING_STAGES } from "./types";

const indexKeySchema = z.enum(INDEX_KEYS);
const itemTypeSchema = z.enum(ITEM_TYPES);
const packPoolSchema = z.enum(PACK_POOLS);

const choiceObjectSchema = z.object({
  label: z.string().min(1),
  glyph: z.string().optional(),
  image: z.string().optional(),
});

/** Accept plain strings or { label, glyph?, image? }; normalize to Choice. */
export const choiceSchema = z.union([
  z.string().min(1).transform((label) => ({ label })),
  choiceObjectSchema,
]);

export const itemSchema = z.object({
  id: z.string().min(1),
  type: itemTypeSchema,
  prompt: z.string().min(1),
  image: z.string().optional(),
  choices: z.array(choiceSchema).optional(),
  answer: z.union([z.string(), z.number(), z.array(z.string())]),
  timeLimitMs: z.number().int().positive().optional(),
  encodeMs: z.number().int().positive().optional(),
  maskStem: z.boolean().optional(),
  ordered: z.boolean().optional(),
  license: z.string().min(1).optional(),
  attribution: z.string().min(1).optional(),
  sourceId: z.string().min(1).optional(),
});

export const subtestSchema = z.object({
  id: z.string().min(1),
  indexKey: indexKeySchema,
  title: z.string().min(1),
  ordered: z.boolean().optional(),
  // Production packs use ≥5; short e2e fixtures may use 1+.
  items: z.array(itemSchema).min(1),
});

export const contentPackSchema = z
  .object({
    id: z.string().min(1),
    audience: z.enum(["child", "adult"]),
    title: z.string().min(1),
    pool: packPoolSchema.optional(),
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

const scoringStageSchema = z.enum(SCORING_STAGES);

/**
 * NormVersion file schema.
 * Accepts `stage` and/or legacy `trial`; always outputs normalized
 * `{ stage, trial }` where `trial === (stage === "trial")`.
 */
export const normTablesSchema = z
  .object({
    version: z.string().min(1),
    stage: scoringStageSchema.optional(),
    trial: z.boolean().optional(),
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
  })
  .superRefine((data, ctx) => {
    if (data.stage == null && data.trial == null) {
      ctx.addIssue({
        code: "custom",
        message: "norms must declare stage or trial",
        path: ["stage"],
      });
      return;
    }
    if (data.stage == null && data.trial === false) {
      ctx.addIssue({
        code: "custom",
        message: "trial:false requires an explicit stage",
        path: ["stage"],
      });
      return;
    }
    if (data.stage != null && data.trial != null) {
      const expectedTrial = data.stage === "trial";
      if (data.trial !== expectedTrial) {
        ctx.addIssue({
          code: "custom",
          message: `trial (${data.trial}) inconsistent with stage (${data.stage})`,
          path: ["trial"],
        });
      }
    }
  })
  .transform((data) => {
    const stage: (typeof SCORING_STAGES)[number] =
      data.stage ?? "trial";
    return {
      version: data.version,
      stage,
      trial: stage === "trial",
      ageBands: data.ageBands,
    };
  });
