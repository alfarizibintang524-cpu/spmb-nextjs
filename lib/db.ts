import type { FieldPacket, Pool, QueryResult, RowDataPacket } from "mysql2/promise";
import pool from "./db.js";

type TypedPool = Omit<Pool, "execute"> & {
  execute<T extends QueryResult = RowDataPacket[]>(
    sql: string,
    values?: unknown[]
  ): Promise<[T, FieldPacket[]]>;
};

const typedPool = pool as TypedPool;
export default typedPool;
