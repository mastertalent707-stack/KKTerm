// Durable global Task Library storage (docs/ITOPS.md). A Task defines what to
// execute; Sites and Hosts remain launch-time targets.

use rusqlite::{Connection as SqliteConnection, OptionalExtension, params};

use super::types::{BatchTask, ItopsTask};

#[derive(Debug)]
pub enum TaskStorageError {
    Validation(String),
    NotFound,
    Sqlite(rusqlite::Error),
}

impl std::fmt::Display for TaskStorageError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Validation(reason) => write!(f, "{reason}"),
            Self::NotFound => write!(f, "task not found"),
            Self::Sqlite(error) => write!(f, "{error}"),
        }
    }
}

impl From<rusqlite::Error> for TaskStorageError {
    fn from(value: rusqlite::Error) -> Self {
        Self::Sqlite(value)
    }
}

type Result<T> = std::result::Result<T, TaskStorageError>;
type TaskRow = (String, String, String, i64, String);

fn validate_name(name: &str) -> Result<String> {
    let name = name.trim();
    if name.is_empty() {
        return Err(TaskStorageError::Validation(
            "task name must not be empty".to_string(),
        ));
    }
    Ok(name.to_string())
}

fn task_to_json(task: &BatchTask) -> Result<String> {
    serde_json::to_string(task).map_err(|error| TaskStorageError::Validation(error.to_string()))
}

fn row_to_task(row: TaskRow) -> Result<ItopsTask> {
    let (id, name, description, sort_order, task_json) = row;
    let task = serde_json::from_str(&task_json)
        .map_err(|error| TaskStorageError::Validation(error.to_string()))?;
    Ok(ItopsTask {
        id,
        name,
        description,
        sort_order,
        task,
    })
}

fn read_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<TaskRow> {
    Ok((
        row.get(0)?,
        row.get(1)?,
        row.get(2)?,
        row.get(3)?,
        row.get(4)?,
    ))
}

const SELECT_COLUMNS: &str = "id, name, description, sort_order, task_json";

pub fn list_tasks(conn: &SqliteConnection) -> Result<Vec<ItopsTask>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {SELECT_COLUMNS} FROM itops_tasks ORDER BY sort_order"
    ))?;
    let rows = stmt
        .query_map([], read_row)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    rows.into_iter().map(row_to_task).collect()
}

pub fn get_task(conn: &SqliteConnection, id: &str) -> Result<Option<ItopsTask>> {
    let row = conn
        .query_row(
            &format!("SELECT {SELECT_COLUMNS} FROM itops_tasks WHERE id = ?"),
            params![id],
            read_row,
        )
        .optional()?;
    row.map(row_to_task).transpose()
}

pub fn create_task(
    conn: &SqliteConnection,
    id: &str,
    name: &str,
    description: &str,
    task: &BatchTask,
) -> Result<ItopsTask> {
    let name = validate_name(name)?;
    let description = description.trim().to_string();
    let sort_order = conn.query_row(
        "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM itops_tasks",
        [],
        |row| row.get(0),
    )?;
    let task_json = task_to_json(task)?;
    conn.execute(
        "INSERT INTO itops_tasks (id, name, description, sort_order, task_json)
         VALUES (?, ?, ?, ?, ?)",
        params![id, name, description, sort_order, task_json],
    )?;
    Ok(ItopsTask {
        id: id.to_string(),
        name,
        description,
        sort_order,
        task: task.clone(),
    })
}

pub fn update_task(
    conn: &SqliteConnection,
    id: &str,
    name: &str,
    description: &str,
    task: &BatchTask,
) -> Result<ItopsTask> {
    let existing = get_task(conn, id)?.ok_or(TaskStorageError::NotFound)?;
    let name = validate_name(name)?;
    let description = description.trim().to_string();
    let task_json = task_to_json(task)?;
    conn.execute(
        "UPDATE itops_tasks
         SET name = ?, description = ?, task_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?",
        params![name, description, task_json, id],
    )?;
    Ok(ItopsTask {
        id: id.to_string(),
        name,
        description,
        sort_order: existing.sort_order,
        task: task.clone(),
    })
}

pub fn remove_task(conn: &SqliteConnection, id: &str) -> Result<()> {
    let affected = conn.execute("DELETE FROM itops_tasks WHERE id = ?", params![id])?;
    if affected == 0 {
        return Err(TaskStorageError::NotFound);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn open_test_db() -> SqliteConnection {
        let conn = SqliteConnection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE itops_tasks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                sort_order INTEGER NOT NULL,
                task_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );",
        )
        .unwrap();
        conn
    }

    #[test]
    fn creates_updates_and_removes_a_task() {
        let conn = open_test_db();
        let script = BatchTask::Script {
            body: "uptime".into(),
            shell: None,
        };
        let created =
            create_task(&conn, "task-1", " Check uptime ", " Basic health ", &script).unwrap();
        assert_eq!(created.name, "Check uptime");
        assert_eq!(list_tasks(&conn).unwrap().len(), 1);

        let updated = update_task(&conn, "task-1", "Check load", "", &script).unwrap();
        assert_eq!(updated.name, "Check load");
        remove_task(&conn, "task-1").unwrap();
        assert!(list_tasks(&conn).unwrap().is_empty());
    }
}
