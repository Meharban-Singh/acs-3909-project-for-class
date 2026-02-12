const loginForm = document.getElementById('loginForm')

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const username = document.getElementById('username').value.trim()

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( { username: username } )
    })

    const data = await response.json()

    console.log(data)
})