import { DatabaseSync } from 'node:sqlite';

/** A tiny document store on SQLite: one row per record, kept in insertion order. */
export class Store {
  private db: DatabaseSync;

  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS docs (
         seq INTEGER PRIMARY KEY AUTOINCREMENT,
         kind TEXT NOT NULL,
         id TEXT NOT NULL,
         json TEXT NOT NULL,
         UNIQUE (kind, id)
       )`,
    );
  }

  put<T extends { id: string }>(kind: string, doc: T): T {
    this.db
      .prepare(
        `INSERT INTO docs (kind, id, json) VALUES (?, ?, ?)
         ON CONFLICT (kind, id) DO UPDATE SET json = excluded.json`,
      )
      .run(kind, doc.id, JSON.stringify(doc));
    return doc;
  }

  get<T>(kind: string, id: string): T | undefined {
    const row = this.db.prepare('SELECT json FROM docs WHERE kind = ? AND id = ?').get(kind, id) as
      | { json: string }
      | undefined;
    return row ? (JSON.parse(row.json) as T) : undefined;
  }

  list<T>(kind: string): T[] {
    const rows = this.db.prepare('SELECT json FROM docs WHERE kind = ? ORDER BY seq').all(kind) as {
      json: string;
    }[];
    return rows.map((r) => JSON.parse(r.json) as T);
  }

  clear(): void {
    this.db.exec('DELETE FROM docs');
  }
}
