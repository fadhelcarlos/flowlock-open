const path = require("path");
const m = require(path.join(process.cwd(),"packages","checks-core","dist","index.js"));
console.log("coreChecks length:", Array.isArray(m.coreChecks)? m.coreChecks.length : m.coreChecks);
console.log("ids:", (m.coreChecks||[]).map(c=>c.id));
