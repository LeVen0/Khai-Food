import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'fastfood.db');

const SQL = await initSqlJs();
const _db = existsSync(DB_PATH)
  ? new SQL.Database(readFileSync(DB_PATH))
  : new SQL.Database();

function save() {
  writeFileSync(DB_PATH, Buffer.from(_db.export()));
}

function toObj(stmt) {
  const result = stmt.getAsObject();
  // sql.js returns BigInt for INTEGER in some cases; coerce
  for (const k of Object.keys(result)) {
    if (typeof result[k] === 'bigint') result[k] = Number(result[k]);
  }
  return result;
}

class PreparedStatement {
  constructor(sql) { this._sql = sql; }

  run(...args) {
    const params = args.flat().map(v => (v === undefined ? null : v));
    _db.run(this._sql, params);
    const rowid = _db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] ?? null;
    save();
    return { changes: _db.getRowsModified(), lastInsertRowid: Number(rowid) };
  }

  get(...args) {
    const params = args.flat().map(v => (v === undefined ? null : v));
    const stmt = _db.prepare(this._sql);
    stmt.bind(params);
    let result;
    if (stmt.step()) result = toObj(stmt);
    stmt.free();
    return result;
  }

  all(...args) {
    const params = args.flat().map(v => (v === undefined ? null : v));
    const stmt = _db.prepare(this._sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(toObj(stmt));
    stmt.free();
    return rows;
  }
}

const db = {
  prepare: (sql) => new PreparedStatement(sql),
  exec: (sql) => { _db.exec(sql); save(); },
  pragma: () => {},
};

export default db;
