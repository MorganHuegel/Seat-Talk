export default (req, res) => {
    console.log('Request: ', req.params)
    return res.status(200).json({ foo: 'bar' })
}
