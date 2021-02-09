const jwt = require('jsonwebtoken')

export default (req, res) => {
    const { name } = JSON.parse(req.body)
    if (!name) {
        return res.status(400).json({ error: 'Missing field "name" in request body.' })
    }

    var authToken = jwt.sign({ name }, process.env.JWT_SECRET, { expiresIn: 60 * 60 * 24 * 365 })
    return res.status(200).json({ authToken })
}
