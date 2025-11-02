const { google } = require('googleapis');

let sheets = null;
let spreadsheetId = null;

function initializeGoogleSheets() {
    try {
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
            return false;
        }

        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        
        const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        sheets = google.sheets({ version: 'v4', auth });
        spreadsheetId = process.env.SPREADSHEET_ID;

        if (!spreadsheetId) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Google Sheets initialization failed:', error.message);
        return false;
    }
}

async function syncToGoogleSheets(entry, username) {
    if (!sheets || !spreadsheetId) {
        return null;
    }

    try {
        const timestamp = new Date(entry.created_at).toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta'
        });

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: 'Sheet1!A:I',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[
                    timestamp,
                    entry.nama,
                    entry.no_resi,
                    parseFloat(entry.berat_resi),
                    parseFloat(entry.berat_aktual),
                    parseFloat(entry.selisih),
                    entry.foto_url_1 || '',
                    entry.foto_url_2 || '',
                    username
                ]]
            }
        });

        let rowNumber = null;
        if (response.data?.updates?.updatedRange) {
            const match = response.data.updates.updatedRange.match(/\d+/);
            rowNumber = match ? parseInt(match[0]) : null;
        }

        return rowNumber;
    } catch (error) {
        console.error('⚠️ Google Sheets sync failed:', error.message);
        throw error;
    }
}

function isConfigured() {
    return sheets !== null && spreadsheetId !== null;
}

module.exports = {
    initializeGoogleSheets,
    syncToGoogleSheets,
    isConfigured
};