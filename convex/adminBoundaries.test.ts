/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import { makeFunctionReference, type WithoutSystemFields } from "convex/server";
import type { Value } from "convex/values";
import type { Doc, TableNames } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
type JsonValidator = {
  type: string; tableName?: string; value?: Value | JsonValidator[] | Record<string, { optional: boolean; fieldType: JsonValidator }>;
};
type Registered = { isPublic?: boolean; isMutation?: boolean; isQuery?: boolean; exportArgs?: () => string };

it("rejects forged credentials at every registered administrative read and mutation", async () => {
  const t = convexTest(schema, modules);
  const ids: Record<string, Value> = {};
  function sample(validator: JsonValidator): Value {
    switch (validator.type) {
      case "string": return "forged";
      case "number": case "float64": case "int64": return 1;
      case "boolean": return true;
      case "null": return null;
      case "literal": return validator.value as Value;
      case "id": return ids[validator.tableName!]!;
      case "array": return [];
      case "union": return sample((validator.value as JsonValidator[])[0]);
      case "object": {
        const result: Record<string, Value> = {};
        for (const [name, field] of Object.entries(validator.value as Record<string, { optional: boolean; fieldType: JsonValidator }>)) {
          if (!field.optional) result[name] = sample(field.fieldType);
        }
        return result;
      }
      default: return {};
    }
  }
  // Valid IDs ensure failures come from authentication, rather than argument parsing.
  await t.run(async ctx => {
    ids._storage = await ctx.storage.store(new Blob(["test-only image"]));
    const catValidator = (schema.tables.cats.validator as unknown as { json: JsonValidator }).json;
    ids.cats = await ctx.db.insert("cats", sample(catValidator) as WithoutSystemFields<Doc<"cats">>);
    for (const [table, definition] of Object.entries(schema.tables)) {
      if (table === "cats") continue;
      ids[table] = await ctx.db.insert(table as TableNames,
        sample((definition.validator as unknown as { json: JsonValidator }).json) as WithoutSystemFields<Doc<TableNames>>);
    }
  });
  let checked = 0;
  for (const [path, loader] of Object.entries(modules)) {
    if (path.includes("/_generated/") || path.includes("/lib/")) continue;
    const exports = await loader() as Record<string, unknown>;
    for (const [name, unknownFunction] of Object.entries(exports)) {
      const fn = unknownFunction as Registered;
      if (!fn?.isPublic || !fn.exportArgs || (!fn.isQuery && !fn.isMutation)) continue;
      const validator = JSON.parse(fn.exportArgs()) as JsonValidator;
      if (validator.type !== "object") continue;
      const fields = validator.value as Record<string, { optional: boolean; fieldType: JsonValidator }>;
      // Public optional-session detail APIs and explicitly public forms are covered separately.
      if (!fields.sessionId || fields.sessionId.optional || path === "./auth.ts" && name === "logout" || path === "./analytics.ts" && name === "trackPageVisit") continue;
      const args = sample(validator) as Record<string, Value>;
      const functionPath = path.replace(/^\.\//, "").replace(/\.ts$/, "") + ":" + name;
      if (fn.isMutation) {
        await expect(t.mutation(makeFunctionReference<"mutation", Record<string, Value>, Value>(functionPath), args), functionPath).rejects.toThrow("Unauthorized");
      } else {
        await expect(t.query(makeFunctionReference<"query", Record<string, Value>, Value>(functionPath), args), functionPath).rejects.toThrow("Unauthorized");
      }
      checked++;
    }
  }
  expect(checked).toBeGreaterThanOrEqual(85);
});
