const { knex } = require('../../database/connectToDb')

async function Log(log_message) {
    console.log(`Message in logger: "${log_message}" at ${new Date().toLocaleString()}.`)
    return await knex('logs').insert({ log_message })
}

module.exports = { Log }
