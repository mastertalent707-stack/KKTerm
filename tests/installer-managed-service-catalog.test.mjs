import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalog = JSON.parse(
  await readFile(new URL("../installer/catalog.v1.json", import.meta.url), "utf8"),
);
const byId = new Map(catalog.recipes.map((recipe) => [recipe.id, recipe]));

test("NSSM is a Utilities tool for managed Windows service helpers", () => {
  const nssm = byId.get("nssm");

  assert.ok(nssm, "NSSM should be present in the installer catalog");
  assert.equal(nssm.category, "tools");
  assert.deepEqual(nssm.provider, { kind: "winget", id: "NSSM.NSSM" });
});

test("managed server apps depend on NSSM for service registration", () => {
  for (const id of ["n8n", "ollama"]) {
    const recipe = byId.get(id);
    assert.ok(recipe, `${id} should be present in the installer catalog`);
    assert.ok(
      recipe.needs?.includes("nssm"),
      `${id} should install NSSM before exposing service registration`,
    );
  }
});
