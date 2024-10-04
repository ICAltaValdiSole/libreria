// Client ID and API key from the Developer Console
const CLIENT_ID = '1010871423571-tc41gvqep2p5ump9i8sdq046vgr09kst.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCBAMHlMKwdPs8hlvRnxxNOWwdXxqnKC3k';
const SPREADSHEET_ID = '1bHmR_g_8Rp54M1lLnZd3nD78EqRTIKNSzl1mE2-hRzQ';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];

const EMAILS_AUTORIZZATE = ['tecnico@icaltavaldisole.it', 'email2@icaltavaldisole.it'];

document.addEventListener('DOMContentLoaded', function() {
    gapi.load('client', initGapiClient);
});

function initGapiClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: handleCredentialResponse
        });
        google.accounts.id.renderButton(
            document.getElementById('signInDiv'), // Assicurati che questo sia il contenitore corretto
            { theme: 'outline', size: 'large' }
        );
        google.accounts.id.prompt();
    }).catch(function(error) {
        console.error('Error initializing GAPI client:', error);
    });
}

function handleCredentialResponse(response) {
    const tokenBlob = new Blob([response.credential], {type: 'application/jwt'});
    const reader = new FileReader();
    reader.onload = function() {
        try {
            const jwt = JSON.parse(atob(this.result.split('.')[1]));
            const userEmail = jwt.email;
            if (EMAILS_AUTORIZZATE.includes(userEmail)) {
                document.getElementById('loginModal').style.display = 'none';
                document.getElementById('libraryContainer').style.display = 'block';
                loadBooks();
            } else {
                alert('Accesso negato: questa email non è autorizzata.');
            }
        } catch (e) {
            console.error('Error parsing JWT', e);
        }
    };
    reader.readAsText(tokenBlob);
}

function loadBooks() {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'libreriaprincipale!A:D',
    }).then(function(response) {
        const range = response.result;
        if (range.values.length > 0) {
            updateBooksTable(range.values);
        } else {
            console.log('No data found.');
        }
    }, function(response) {
        console.error('Error: ' + response.result.error.message);
    });
}

function updateBooksTable(books) {
    const tableBody = document.getElementById('booksTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    books.forEach((book, index) => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = book[0];
        row.insertCell(1).textContent = book[1];
        row.insertCell(2).textContent = book[2];
        const actionsCell = row.insertCell(3);
        const button = document.createElement('button');
        button.textContent = book[2] === 'Disponibile' ? 'Prestito' : 'Consegna';
        button.onclick = () => showActionModal(book[2] === 'Disponibile' ? 'prestito' : 'consegna', index);
        actionsCell.appendChild(button);
    });
}

function showActionModal(type, index) {
    const modal = document.getElementById('actionModal');
    modal.style.display = 'flex';
    document.getElementById('modalTitle').textContent = type === 'prestito' ? 'Prestito Libro' : 'Consegna Libro';
    document.getElementById('confirmAction').onclick = () => confirmAction(type, index);
}

function confirmAction(type, index) {
    const nome = document.getElementById('nome').value;
    const cognome = document.getElementById('cognome').value;
    const email = document.getElementById('emailScolastica').value;
    const data = document.getElementById('data').value;
    console.log('Action confirmed:', type, nome, cognome, email, data);
    document.getElementById('actionModal').style.display = 'none';
    // Aggiorna il backend o il foglio di calcolo di Google come necessario
}
