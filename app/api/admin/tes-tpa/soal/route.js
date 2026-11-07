import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

function readQuestion(body) {
  const question = typeof body.pertanyaan === "string" ? body.pertanyaan.trim() : "";
  const options = ["a", "b", "c", "d"].map((key) =>
    typeof body[`opsi_${key}`] === "string" ? body[`opsi_${key}`].trim() : ""
  );
  const answer = typeof body.jawaban === "string" ? body.jawaban.toLowerCase() : "";
  if (!question || question.length > 5000 || options.some((option) => !option || option.length > 500)
    || !["a", "b", "c", "d"].includes(answer)) {
    return { error: "Pertanyaan, empat opsi (maksimal 500 karakter), dan jawaban wajib diisi dengan benar." };
  }
  return { question, options, answer };
}

async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    const [questions] = await pool.execute(
      "SELECT id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban FROM soal_tpa ORDER BY id"
    );
    return Response.json({ soal: questions });
  } catch (error) {
    return failure(error, "Soal TPA admin GET");
  }
}

export async function POST(request) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    const body = await readBody(request);
    if (!body) return Response.json({ message: "Data soal tidak valid." }, { status: 400 });
    const result = readQuestion(body);
    if (result.error) return Response.json({ message: result.error }, { status: 400 });
    const [insert] = await pool.execute(
      `INSERT INTO soal_tpa (pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [result.question, ...result.options, result.answer]
    );
    const [rows] = await pool.execute(
      "SELECT id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban FROM soal_tpa WHERE id = ?",
      [insert.insertId]
    );
    return Response.json({ message: "Soal berhasil ditambahkan.", soal: rows[0] }, { status: 201 });
  } catch (error) {
    return failure(error, "Soal TPA admin POST");
  }
}

export async function PATCH(request) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    const body = await readBody(request);
    const id = Number(body?.id);
    if (!body || !Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ message: "ID soal tidak valid." }, { status: 400 });
    }
    const result = readQuestion(body);
    if (result.error) return Response.json({ message: result.error }, { status: 400 });
    const [update] = await pool.execute(
      `UPDATE soal_tpa SET pertanyaan = ?, opsi_a = ?, opsi_b = ?, opsi_c = ?, opsi_d = ?, jawaban = ?
       WHERE id = ?`,
      [result.question, ...result.options, result.answer, id]
    );
    if (!update.affectedRows) {
      const [existing] = await pool.execute("SELECT id FROM soal_tpa WHERE id = ?", [id]);
      if (!existing.length) return Response.json({ message: "Soal tidak ditemukan." }, { status: 404 });
    }
    const [rows] = await pool.execute(
      "SELECT id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban FROM soal_tpa WHERE id = ?",
      [id]
    );
    return Response.json({ message: "Soal berhasil diperbarui.", soal: rows[0] });
  } catch (error) {
    return failure(error, "Soal TPA admin PATCH");
  }
}
