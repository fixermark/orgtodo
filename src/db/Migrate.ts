import { connection, fulltextToEntry, initTasksTable, replaceEntries, TASK_COLUMN_NAMES } from './Db';
import * as sqlite from 'sqlite';


/** Check the database is up to date and if it is not, migrate it. */
export async function checkAndMigrate() {
  const db = await connection();

  console.log("Confirming tasks table schema is correct...");

  const columns = await db.all('PRAGMA table_info(tasks)');

  const column_names = columns.map((col: any) => col.name);
  console.log("Columns:");
  console.log(column_names);

  let table_sound = true;
  for (const expected_name of TASK_COLUMN_NAMES) {
    if (!column_names.includes(expected_name)) {
      console.warn(`Tasks table missing column ${expected_name}; will rebuild...`);
      await migrate(db);
      console.log("Rebuilt tasks table.");
      return;
    }
  }

  console.log("Tasks table correct.");
}

/** Pull data from tasks table, drop and rebuild table, and port data into new tasks table. */
async function migrate(db: sqlite.Database) {
  const entryText = await db.all("SELECT fulltext FROM tasks");

  const entries = entryText.map((singleEntryText) => fulltextToEntry(singleEntryText.fulltext));

  await db.run("DROP TABLE tasks");

  await initTasksTable(db);

  await replaceEntries(entries);
}
