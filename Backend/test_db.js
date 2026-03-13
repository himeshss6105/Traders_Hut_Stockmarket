import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI);
  fs.writeFileSync('db_status.txt', "SUCCESS");
  process.exit(0);
} catch (e) {
  fs.writeFileSync('db_status.txt', "ERROR: " + e.message);
  process.exit(1);
}
