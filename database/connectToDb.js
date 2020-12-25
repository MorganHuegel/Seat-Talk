const { DB_URL } = require('../config')
const knex = require('knex')({
    client: 'pg',
    connection: DB_URL,
    acquireConnectionTimeout: 10000,
})
module.exports = { knex }
