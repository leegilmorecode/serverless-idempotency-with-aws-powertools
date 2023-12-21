const convict = require('convict');

export const config = convict({
  tableName: {
    doc: 'The database table where we store appointments',
    format: String,
    default: 'tableName',
    env: 'TABLE_NAME',
  },
  idempotencytTableName: {
    doc: 'The database table used for idempotency',
    format: String,
    default: 'idempotencyTable',
  },
}).validate({ allowed: 'strict' });
