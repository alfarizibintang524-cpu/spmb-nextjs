import { readFile } from "node:fs/promises";
import pool from "../lib/db.js";

try {
  const schema = await readFile(new URL("../database/schema.sql", import.meta.url), "utf8");
  for (const statement of schema.split(";").map((part) => part.trim()).filter(Boolean)) {
    await pool.query(statement);
  }
  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'biodata'`
  );
  const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));
  for (const [name, definition] of [
    ["asal_sekolah", "VARCHAR(150) NULL"],
    ["nama_ortu", "VARCHAR(150) NULL"],
  ]) {
    if (!existingColumns.has(name)) {
      await pool.query(`ALTER TABLE biodata ADD COLUMN ${name} ${definition}`);
    }
  }
  console.log("Migrasi database SPMB berhasil.");
} catch (error) {
  console.error("Migrasi database gagal:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
