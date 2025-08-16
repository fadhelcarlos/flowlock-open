import fs from "fs";

const f = "uxspec.json";
const j = JSON.parse(fs.readFileSync(f, "utf8"));

j.roles = Array.isArray(j.roles) && j.roles.length ? j.roles : ["admin","viewer"];

// ensure screens array exists
j.screens = Array.isArray(j.screens) ? j.screens : [];

// add roles + uiStates to every screen
for (const s of j.screens) {
  if (!Array.isArray(s.roles) || s.roles.length === 0) s.roles = ["admin","viewer"];
  if (!Array.isArray(s.uiStates) || s.uiStates.length === 0) s.uiStates = ["empty","loading","error"];
}

// mark user.id as derived
const ents = Array.isArray(j.entities) ? j.entities : [];
const user = ents.find(e => e.id === "user");
if (user) {
  const idf = user.fields?.find(x => x.id === "id");
  if (idf) { idf.derived = true; idf.provenance = "system.uuid"; }
}

// mark product fields as external
const product = ents.find(e => e.id === "product");
if (product) {
  for (const k of ["id","name","description","price"]) {
    const fld = product.fields?.find(x => x.id === k);
    if (fld) { fld.external = true; fld.source = "catalog_api"; }
  }
}

fs.writeFileSync(f, JSON.stringify(j, null, 2));
console.log("patched uxspec.json: roles/uiStates + user.id derived + product externals");
