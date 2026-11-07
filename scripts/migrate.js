// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("node:fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const envValues = new Map();

for (const filename of [".env", ".env.local"]) {
  const filePath = path.join(projectRoot, filename);
  if (!fs.existsSync(filePath)) continue;

  const contents = fs.readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      const quote = value[0];
      value = value.slice(1, -1);
      if (quote === '"') {
        value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      }
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }

    envValues.set(match[1], value);
  }
}

for (const [key, value] of envValues) {
  if (process.env[key] === undefined) process.env[key] = value;
}

function splitSqlStatements(sql) {
  const statements = [];
  let statement = "";
  let quote = null;

  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index];
    const next = sql[index + 1];

    if (quote) {
      statement += character;
      if (character === "\\" && quote !== "`" && next !== undefined) {
        statement += next;
        index += 1;
      } else if (character === quote) {
        if (next === quote) {
          statement += next;
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (
      character === "-" &&
      next === "-" &&
      (index === 0 || /\s/.test(sql[index - 1])) &&
      (sql[index + 2] === undefined || /\s/.test(sql[index + 2]))
    ) {
      while (index < sql.length && sql[index] !== "\n") index += 1;
      statement += "\n";
      continue;
    }
    if (character === "#") {
      while (index < sql.length && sql[index] !== "\n") index += 1;
      statement += "\n";
      continue;
    }
    if (character === "/" && next === "*") {
      index += 2;
      while (index < sql.length && !(sql[index] === "*" && sql[index + 1] === "/")) index += 1;
      index += 1;
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      quote = character;
      statement += character;
      continue;
    }
    if (character === ";") {
      if (statement.trim()) statements.push(statement.trim());
      statement = "";
      continue;
    }

    statement += character;
  }

  if (statement.trim()) statements.push(statement.trim());
  if (quote) throw new Error("Ada string atau identifier SQL yang tidak ditutup.");
  return statements;
}

async function main() {
  if (process.env.DB_NAME !== "spmb") {
    throw new Error("DB_NAME harus bernilai spmb; migrasi dihentikan untuk mencegah perubahan database lain.");
  }
  if (!process.env.DB_USER) {
    throw new Error("DB_USER tidak tersedia di environment atau file .env/.env.local.");
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pool = require("../lib/db.js");
  const migrations = [
    "001_metode_pembayaran.sql",
    "002_status_pembayaran_admin.sql",
    "003_seed_metode_pembayaran.sql",
    "004_tahap_biaya_dan_jurusan.sql",
    "005_metode_tunai_dan_jurusan_spmb.sql",
  ];

  try {
    const [rows] = await pool.execute("SELECT DATABASE() AS database_name");
    if (rows[0]?.database_name !== "spmb") {
      throw new Error("Koneksi database tidak menuju spmb; migrasi dihentikan.");
    }

    for (const [index, filename] of migrations.entries()) {
      const filePath = path.join(projectRoot, "migrations", filename);
      const sql = fs.readFileSync(filePath, "utf8");
      const statements = splitSqlStatements(sql);
      console.log(`[${index + 1}/${migrations.length}] Menjalankan ${filename} (${statements.length} perintah)...`);

      for (const statement of statements) {
        await pool.query(statement);
      }

      console.log(`[${index + 1}/${migrations.length}] ${filename}: berhasil.`);
    }

    const [methodTables] = await pool.execute(
      `SELECT COUNT(*) AS table_count
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = 'spmb' AND TABLE_NAME = 'metode_pembayaran'`
    );
    if (Number(methodTables[0].table_count) !== 1) {
      throw new Error("Verifikasi gagal: tabel metode_pembayaran tidak ditemukan.");
    }

    const [methodRows] = await pool.execute("SELECT COUNT(*) AS row_count FROM metode_pembayaran");
    if (Number(methodRows[0].row_count) === 0) {
      throw new Error("Verifikasi gagal: metode_pembayaran belum berisi data.");
    }
    const [methodTypeRows] = await pool.execute(
      "SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'spmb' AND TABLE_NAME = 'metode_pembayaran' AND COLUMN_NAME = 'tipe'"
    );
    if (!methodTypeRows[0] || (
      methodTypeRows[0].COLUMN_TYPE.toLowerCase().startsWith("enum(") &&
      !methodTypeRows[0].COLUMN_TYPE.includes("'tunai'")
    )) {
      throw new Error("Verifikasi gagal: kolom metode_pembayaran.tipe belum menerima nilai tunai.");
    }
    const [cashRows] = await pool.execute(
      "SELECT COUNT(*) AS row_count FROM metode_pembayaran WHERE tipe = 'tunai'"
    );
    if (Number(cashRows[0].row_count) === 0) {
      throw new Error("Verifikasi gagal: metode Tunai belum tersedia.");
    }

    const [paymentColumns] = await pool.execute(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = 'spmb' AND TABLE_NAME = 'pembayaran'
         AND COLUMN_NAME IN ('metode_id')`
    );
    const actualColumns = new Set(paymentColumns.map((column) => column.COLUMN_NAME));
    const requiredColumns = ["metode_id"];
    const missingColumns = requiredColumns.filter((column) => !actualColumns.has(column));
    if (missingColumns.length > 0) {
      throw new Error(`Verifikasi gagal: kolom pembayaran tidak ditemukan (${missingColumns.join(", ")}).`);
    }

    const [statusRows] = await pool.execute(
      `SELECT COLUMN_TYPE
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = 'spmb' AND TABLE_NAME = 'pembayaran' AND COLUMN_NAME = 'status'`
    );
    const statusType = statusRows[0]?.COLUMN_TYPE || "";
    const requiredStatuses = ["menunggu", "menunggu_verifikasi", "diterima", "ditolak"];
    const missingStatuses = requiredStatuses.filter((status) => !statusType.includes(`'${status}'`));
    if (missingStatuses.length > 0) {
      throw new Error(`Verifikasi gagal: nilai status belum lengkap (${missingStatuses.join(", ")}).`);
    }

    const [stageTables] = await pool.execute(
      `SELECT TABLE_NAME
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = 'spmb'
         AND TABLE_NAME IN ('jurusan', 'komponen_biaya', 'tenggat_pembayaran')`
    );
    const availableStageTables = new Set(stageTables.map((table) => table.TABLE_NAME));
    const missingStageTables = ["jurusan", "komponen_biaya", "tenggat_pembayaran"]
      .filter((table) => !availableStageTables.has(table));
    if (missingStageTables.length > 0) {
      throw new Error(`Verifikasi gagal: tabel tidak ditemukan (${missingStageTables.join(", ")}).`);
    }

    const [stageColumns] = await pool.execute(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = 'spmb' AND TABLE_NAME = 'pembayaran'
         AND COLUMN_NAME IN ('tahap', 'nominal')`
    );
    const availableStageColumns = new Set(stageColumns.map((column) => column.COLUMN_NAME));
    const missingStageColumns = ["tahap", "nominal"].filter((column) => !availableStageColumns.has(column));
    if (missingStageColumns.length > 0) {
      throw new Error(`Verifikasi gagal: kolom pembayaran tidak ditemukan (${missingStageColumns.join(", ")}).`);
    }

    const [majorRows] = await pool.execute("SELECT COUNT(*) AS row_count FROM jurusan");
    const [feeRows] = await pool.execute("SELECT COUNT(*) AS row_count FROM komponen_biaya");
    if (Number(majorRows[0].row_count) === 0 || Number(feeRows[0].row_count) === 0) {
      throw new Error("Verifikasi gagal: seed jurusan atau komponen biaya belum tersedia.");
    }

    console.log(
      `Verifikasi berhasil: metode_pembayaran berisi ${methodRows[0].row_count} data termasuk tunai; ` +
      `pembayaran memiliki ${[...requiredColumns, "tahap", "nominal"].join(", ")}; ` +
      `jurusan berisi ${majorRows[0].row_count} data; komponen_biaya berisi ${feeRows[0].row_count} data.`
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migrasi database gagal:", error.message);
  process.exitCode = 1;
});
