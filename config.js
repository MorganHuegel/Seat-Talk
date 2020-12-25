try {
    require('dotenv').config()
} catch (e) {
    console.log('ERROR READING .env FILE: ', e)
}

module.exports = {
    PORT: process.env.PORT || 8080,
    DB_URL: process.env.DB_URL,
    JWT_SECRET: process.env.JWT_SECRET,
}
