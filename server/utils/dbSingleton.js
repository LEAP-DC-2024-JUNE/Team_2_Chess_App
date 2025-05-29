let _pool = null;

export function setDatabasePool(poolInstance) {
  _pool = poolInstance;
}

export function getDatabasePool() {
  if (!_pool) {
    throw new Error(
      "Database pool has not been initialized! Call setDatabasePool() in server.js first."
    );
  }
  return _pool;
}
