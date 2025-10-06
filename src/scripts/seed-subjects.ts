import { dbConnect } from "@/lib/db";
import { ExamSubject } from "@/lib/models/ExamSubject";
(async () => {
  await dbConnect();
  const list = [
    { slug: "english", name: "English" },
    { slug: "gk", name: "GK" },
    { slug: "ict", name: "ICT" },
    { slug: "math", name: "Math" },
    { slug: "physics", name: "Physics" },
  ];
  for (const s of list) {
    await ExamSubject.updateOne({ slug: s.slug }, { $set: s }, { upsert: true });
  }
  console.log("Seeded subjects");
  process.exit(0);
})();
