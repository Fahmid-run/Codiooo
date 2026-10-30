import { db } from "./index";

async function main() {
  try {
    const users = await db.orm.public.User.all();
    console.log("Registered users:", users);
  } finally {
    await db.close();
  }
}

main().catch(console.error);
