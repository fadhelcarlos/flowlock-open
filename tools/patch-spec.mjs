import fs from "fs";
const f = "uxspec.json";
const j = JSON.parse(fs.readFileSync(f, "utf8"));

if (!Array.isArray(j.roles) || j.roles.length === 0) {
  j.roles = ["admin","viewer"];
}
if (!j.jtbd) {
  j.jtbd = {
    admin: ["Create user","Review users","Review products"],
    viewer: ["Browse products","See product detail"]
  };
}
(j.screens || []).forEach(s => {
  if (!Array.isArray(s.roles) || s.roles.length === 0) s.roles = ["admin","viewer"];
  if (!Array.isArray(s.uiStates) || s.uiStates.length === 0) s.uiStates = ["empty","loading","error"];
});
fs.writeFileSync(f, JSON.stringify(j, null, 2));
console.log("Patched uxspec.json with roles/uiStates and top-level roles/jtbd");
