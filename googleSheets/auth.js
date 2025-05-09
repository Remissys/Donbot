const fs = require('fs').promises
const path = require('path')
const process = require('process')
const { authenticate } = require('@google-cloud/local-auth')
const { google } = require('googleapis')

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
const CREDENTIALS_PATH = path.join(process.cwd(), 'google-api-credentials.json')
const TOKEN_PATH = path.join(process.cwd(), 'token.json')

async function loadSavedCredentials() {
    try {
        const content = await fs.readFile(TOKEN_PATH)
        const credentials = JSON.parse(content)

        return google.auth.fromJSON(credentials)
    } catch(err) {
        return null
    }
}

async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH)
    const keys = JSON.parse(content)
    const key = keys.installed || keys.web
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token
    })

    await fs.writeFile(TOKEN_PATH, payload)
}

async function authorize() {
    let client = await loadSavedCredentials()

    // Returns if client token is already saved and authorized
    if (client) return client

    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
        isAsync: true
    })

    if (client.credentials) await saveCredentials(client)

    return client
}

module.exports = authorize