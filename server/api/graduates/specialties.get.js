import { Graduate } from "../../models/graduate.js";

export default defineEventHandler(async () => {
  const grads = await Graduate.findAll({
    attributes: ["students"],
  });

  const set = new Set();

  for (const g of grads) {
    const list = Array.isArray(g.students) ? g.students : [];
    for (const st of list) {
      if (st && typeof st.specialty === "string") {
        const val = st.specialty.trim();
        if (val) set.add(val);
      }
    }
  }

  return Array.from(set).sort((a, b) =>
    a.localeCompare(b, "uk", { sensitivity: "base" })
  );
});
