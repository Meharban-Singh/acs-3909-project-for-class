const express =  require('express')
const path = require('path')

const app = express()
const PORT = 3002

const users = {}
// Structure: { username: { notes: [ { id, content, createdAt } ] } }

app.use(express.json())
app.use(express.static('public'))

app.post('/api/login', (req, res) => {
    const username = req.body.username
    let isNewUser = false

    console.log(username)

    if(!users[username]) {
        users[username] = { notes: [] }
        isNewUser = true
        console.log(`New user created ${username}`)
    }

    res.json({
        success: true,
        username,
        message: isNewUser ? 'New user created' : 'Welcome back'
    })
})


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`) })