/// <reference types="vite/client" />
import { scryptSync } from "node:crypto";
import { convexTest } from "convex-test";
import { describe, expect, it, vi, afterEach } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import { normalizeEmail, normalizePhone } from "./lib/waitingValidation";
import type { Id } from "./_generated/dataModel";
import * as seed from "./seed";
import * as imageMigration from "./imageMigration";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
const token = "admin_" + "a".repeat(64);
const input = () => ({ email: " Cat.Parent@Example.com ", followUpConsent: true as const,
  noticeVersion: "2026-10-02" as const, honeypot: "", startedAt: Date.now() - 5000 });
async function authenticated() {
  const t = convexTest(schema, modules);
  await t.run(async ctx => {
    await ctx.db.insert("adminSessions", { sessionId: token, isValid: true, authVersion: 2, expiresAt: Date.now() + 60_000 });
  });
  return t;
}

afterEach(() => { vi.unstubAllEnvs(); });

describe("waiting list", () => {
  it("accepts email-only and phone-only contacts and records follow-up permission", async () => {
    const t = convexTest(schema, modules);
    expect(await t.mutation(api.waitingList.submit, input())).toEqual({ accepted: true });
    expect(await t.mutation(api.waitingList.submit, { ...input(), email: undefined, phone: "0894 474 966" })).toEqual({ accepted: true });
    const records = await t.run(ctx => ctx.db.query("waitingListSubmissions").collect());
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ email: "cat.parent@example.com", followUpConsent: true, noticeVersion: "2026-10-02", status: "new" });
    expect(records[1].normalizedPhone).toBe("+359894474966");
    expect(records[0].consentedAt).toBeGreaterThan(0);
  });

  it("rejects invalid contacts, false consent, bots, excessive values and bad context", async () => {
    const t = convexTest(schema, modules);
    for (const overrides of [{ email: "bad" }, { email: undefined, phone: "123" }, { email: undefined },
      { honeypot: "spam" }, { startedAt: Date.now() + 100_000 }, { preferences: "x".repeat(1001) },
      { context: { url: "https://attacker.example/" } }]) {
      await expect(t.mutation(api.waitingList.submit, { ...input(), ...overrides })).rejects.toThrow();
    }
    // Runtime validator must reject consent bypass even when called outside the form.
    await expect(t.mutation(api.waitingList.submit, { ...input(), followUpConsent: false as unknown as true })).rejects.toThrow();
    expect(await t.run(ctx => ctx.db.query("waitingListSubmissions").collect())).toHaveLength(0);
  });

  it("deduplicates normalized email and phone without overwriting existing details", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.waitingList.submit, { ...input(), name: "Original", preferences: "Ragdoll", phone: "0894 474 966" });
    await Promise.all([
      t.mutation(api.waitingList.submit, { ...input(), email: "CAT.PARENT@example.com", name: "Overwrite" }),
      t.mutation(api.waitingList.submit, { ...input(), email: "different@example.com", phone: "+359894474966" }),
    ]);
    const records = await t.run(ctx => ctx.db.query("waitingListSubmissions").collect());
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ name: "Original", preferences: "Ragdoll" });
  });

  it("rejects expired, legacy and forged admin sessions", async () => {
    const t = convexTest(schema, modules);
    await t.run(async ctx => {
      await ctx.db.insert("adminSessions", { sessionId: token, isValid: true, expiresAt: Date.now() + 60_000 });
      await ctx.db.insert("adminSessions", { sessionId: "admin_" + "b".repeat(64), authVersion: 2, isValid: true, expiresAt: Date.now() - 1 });
    });
    for (const sessionId of ["forged", token, "admin_" + "b".repeat(64)]) {
      await expect(t.query(api.waitingList.list, { sessionId, paginationOpts: { cursor: null, numItems: 20 } })).rejects.toThrow("Unauthorized");
    }
  });

  it("supports filtered cursor pagination, status, notes and deletion behind authentication", async () => {
    const t = await authenticated();
    for (let i = 0; i < 3; i++) await t.mutation(api.waitingList.submit, { ...input(), email: `cat${i}@example.com` });
    const first = await t.query(api.waitingList.list, { sessionId: token, paginationOpts: { cursor: null, numItems: 2 } });
    expect(first.page).toHaveLength(2);
    expect(first.isDone).toBe(false);
    const second = await t.query(api.waitingList.list, { sessionId: token, paginationOpts: { cursor: first.continueCursor, numItems: 2 } });
    expect(second.page).toHaveLength(1);
    const id = first.page[0]._id;
    await expect(t.mutation(api.waitingList.update, { sessionId: "forged", id, status: "contacted" })).rejects.toThrow("Unauthorized");
    await t.mutation(api.waitingList.update, { sessionId: token, id, status: "contacted", notes: "  Called once  " });
    const filtered = await t.query(api.waitingList.list, { sessionId: token, status: "contacted", paginationOpts: { cursor: null, numItems: 20 } });
    expect(filtered.page).toHaveLength(1);
    expect(filtered.page[0].notes).toBe("Called once");
    await expect(t.mutation(api.waitingList.remove, { sessionId: "forged", id })).rejects.toThrow("Unauthorized");
    await t.mutation(api.waitingList.remove, { sessionId: token, id });
    expect(await t.run(ctx => ctx.db.get(id))).toBeNull();
  });

  it("enforces the shared backend spam budget", async () => {
    const t = convexTest(schema, modules);
    await t.run(ctx => ctx.db.insert("submissionLimits", { key: "waiting-list-hour", count: 100, windowEndsAt: Date.now() + 60_000 }));
    await expect(t.mutation(api.waitingList.submit, input())).rejects.toThrow("RATE_LIMITED");
    expect(await t.run(ctx => ctx.db.query("waitingListSubmissions").collect())).toHaveLength(0);
  });

  it("throttles equivalent contacts using digests instead of raw emails or phones", async () => {
    const t = convexTest(schema, modules);
    for (let attempt = 0; attempt < 3; attempt++) await t.mutation(api.waitingList.submit, input());
    await expect(t.mutation(api.waitingList.submit, { ...input(), email: "CAT.PARENT@EXAMPLE.COM" })).rejects.toThrow("RATE_LIMITED");
    const budgets = await t.run(ctx => ctx.db.query("submissionLimits").collect());
    expect(budgets.some(b => b.key.startsWith("waiting-contact:"))).toBe(true);
    expect(budgets.every(b => !b.key.includes("@"))).toBe(true);
    expect(await t.run(ctx => ctx.db.query("waitingListSubmissions").collect())).toHaveLength(1);
  });

  it("validates displayed cat context and preserves a server-confirmed name", async () => {
    const t = convexTest(schema, modules);
    const catId = await t.run(ctx => ctx.db.insert("cats", { name: "Real Cat", subtitle: "", image: "/cat.jpg", description: "", age: "", color: "", status: "", gallery: [], gender: "female", birthDate: "2026-01-01", isDisplayed: true }));
    await t.mutation(api.waitingList.submit, { ...input(), context: { catId, label: "Spoofed", url: `/cat/${catId}` } });
    const records = await t.run(ctx => ctx.db.query("waitingListSubmissions").collect());
    expect(records[0].context).toEqual({ catId, label: "Real Cat", url: `/cat/${catId}` });
  });
});

describe("existing admin and public boundaries", () => {
  it("protects existing contact records, content changes, file uploads and admin session listings", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.contact.getAllContacts, { sessionId: "forged" })).rejects.toThrow("Unauthorized");
    await expect(t.query(api.cats.getAllCats, { sessionId: "forged" })).rejects.toThrow("Unauthorized");
    await expect(t.query(api.auth.getActiveSessions, { sessionId: "forged" })).rejects.toThrow("Unauthorized");
    await expect(t.mutation(api.files.generateUploadUrl, { sessionId: "forged" })).rejects.toThrow("Unauthorized");
    await expect(t.mutation(api.siteSettings.upsertSetting, { sessionId: "forged", key: "social", value: "bad", type: "social_media" })).rejects.toThrow("Unauthorized");
  });

  it("keeps reset, seed and image migrations internal", () => {
    for (const fn of [seed.clearDatabase, seed.reseedDatabase, seed.seedDatabase, imageMigration.runFullImageMigration]) {
      expect("isInternal" in fn && fn.isInternal).toBe(true);
      expect("isPublic" in fn).toBe(false);
    }
  });

  it("allows published content, excludes hidden cats, and exposes narrow parent fields", async () => {
    const t = convexTest(schema, modules);
    let hidden: Id<"cats">, visible: Id<"cats">;
    await t.run(async ctx => {
      const cat = { name: "Parent", subtitle: "", image: "/cat.jpg", description: "", age: "", color: "", status: "", gallery: [], gender: "female" as const, birthDate: "2025-01-01", isDisplayed: false, freeText: "Private working copy" };
      hidden = await ctx.db.insert("cats", cat);
      visible = await ctx.db.insert("cats", { ...cat, name: "Kitten", isDisplayed: true });
      await ctx.db.insert("pedigreeConnections", { parentId: hidden, childId: visible, type: "mother" });
    });
    expect(await t.query(api.cats.getDisplayedCats)).toHaveLength(1);
    expect(await t.query(api.cats.getCatById, { id: hidden! })).toBeNull();
    const parents = await t.query(api.pedigree.getPublicParents, { catId: visible! });
    expect(parents.mother?.name).toBe("Parent");
    expect(parents.mother).not.toHaveProperty("freeText");
    expect((await t.query(api.pedigree.getPublicParents, { catId: hidden! })).mother).toBeNull();
  });

  it("preserves authenticated cat editing while stripping private notes from public reads", async () => {
    const t = await authenticated();
    const id = await t.mutation(api.cats.createCat, { sessionId: token, name: "Real Kitten", subtitle: "", image: "/cat.jpg", description: "Public story", age: "", color: "", status: "Available", gallery: [], gender: "female", birthDate: "2026-01-01", isDisplayed: true, breed: "ragdoll", category: "kitten", internalNotes: "Private breeder note" });
    await t.mutation(api.cats.updateCat, { sessionId: token, id, internalNotes: "Updated private note" });
    expect((await t.query(api.cats.getAllCats, { sessionId: token }))[0].internalNotes).toBe("Updated private note");
    const publicLists = [await t.query(api.cats.getDisplayedCats),
      await t.query(api.cats.getDisplayedCatsByCategory, {category:"all"}),
      await t.query(api.cats.getDisplayedCatsByCategory, {category:"kitten"}),
      await t.query(api.cats.getDisplayedCatsByGenderAndAge, {section:"kitten"}),
      await t.query(api.cats.getDisplayedCatsByBreedGenderAndAge, {section:"kitten",breed:"ragdoll"})];
    for (const list of publicLists) { expect(list).toHaveLength(1); expect(list[0]).not.toHaveProperty("internalNotes"); }
    expect(await t.query(api.cats.getCatById, { id })).not.toHaveProperty("internalNotes");
    const tree = await t.query(api.pedigree.generateFamilyTree, {rootCatId:id});
    expect(tree.nodes[0]).not.toHaveProperty("internalNotes");
  });

  it("uses the configured password hash to create and invalidate cryptographic sessions", async () => {
    const password = "isolated-test-password";
    const salt = "f".repeat(32);
    vi.stubEnv("ADMIN_PASSWORD_HASH", `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`);
    const t = convexTest(schema, modules);
    await expect(t.action(api.adminLogin.login, { password: "wrong-test-password" })).rejects.toThrow("Invalid login");
    const first = await t.action(api.adminLogin.login, { password });
    expect(first.sessionId).toMatch(/^admin_[a-f0-9]{64}$/);
    expect((await t.query(api.auth.validateSession, {sessionId:first.sessionId})).isValid).toBe(true);
    const second = await t.action(api.adminLogin.login, { password });
    expect(second.sessionId).not.toBe(first.sessionId);
    expect((await t.query(api.auth.validateSession, {sessionId:first.sessionId})).isValid).toBe(false);
    expect((await t.query(api.auth.validateSession, {sessionId:second.sessionId})).isValid).toBe(true);
  });

  it("returns active session metadata without bearer tokens and revokes logout", async () => {
    const t = await authenticated();
    const sessions = await t.query(api.auth.getActiveSessions, { sessionId: token });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).not.toHaveProperty("sessionId");
    await t.mutation(api.auth.logout, { sessionId: token });
    expect(await t.query(api.auth.validateSession, { sessionId: token })).toEqual({ isValid: false });
  });

  it("fails closed when the server-only admin password is not configured", async () => {
    vi.stubEnv("ADMIN_PASSWORD_HASH", "");
    const t = convexTest(schema, modules);
    await expect(t.action(api.adminLogin.login, { password: "test-only" })).rejects.toThrow("not configured");
  });
});

it("normalizes equivalent contacts", () => {
  expect(normalizeEmail("  CAT@EXAMPLE.COM  ")).toBe("cat@example.com");
  expect(normalizePhone("00359 894 474 966")).toBe(normalizePhone("0894 474 966"));
});
