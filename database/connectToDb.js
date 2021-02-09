const knex = require('knex')({
    client: 'pg',
    connection: process.env.DB_URL,
    acquireConnectionTimeout: 10000,
})
module.exports = { knex }
