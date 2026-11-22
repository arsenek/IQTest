#!/usr/bin/env node
/**
 * DEPRECATED — do not run.
 *
 * This script used to write child/adult v1 manifests and old PRI SVG media.
 * The rule-based PRI bank from PR #10 replaced those figures; running this
 * file would silently overwrite the new manifests with the obsolete bank.
 *
 * Use instead:
 *   npm run pri:generate   # write PRI items from content/pri specs
 *   npm run pri:check      # verify checked-in PRI media/manifests
 *   npm run pri:sheets     # contact-sheet PNGs for review
 *
 * VCI / WMI / PSI content is maintained by hand in the pack manifests;
 * there is no replacement generator for those indices in this script.
 */
console.error(
  [
    "ERROR: scripts/generate-practice-bank.mjs is deprecated and disabled.",
    "It would overwrite the rule-based PRI item bank with obsolete figures.",
    "Use `npm run pri:generate` / `npm run pri:check` instead.",
  ].join("\n"),
);
process.exit(1);
