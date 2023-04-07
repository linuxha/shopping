// ==============================================================================
const myHTTP  = 13000;
const myHTTPS = 13443;

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
//app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const path = require('path');

const https = require('https');

// Read the SSL certificate files
const privateKey  = fs.readFileSync('./ssl/key.pem', 'utf8');
const certificate = fs.readFileSync('./ssl/cert.pem', 'utf8');
const ca = fs.readFileSync('./ssl/cert.pem', 'utf8'); // For self-signed certificate, use the same cert.pem

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca,
};

// Create an HTTPS service
const httpsServer = https.createServer(credentials, app);

// Set the HTTPS server to listen on a specific port (e.g., 8443)
httpsServer.listen(myHTTPS, () => {
  console.log(`HTTPS server running on port ${myHTTPS}`);
});

/*
Refused to apply style from 'http://mozart.uucp:13000/styles.css' because its MIME type ('text/html') is not a supported stylesheet MIME type, and strict MIME checking is enabled.
*/

app.use('/styles.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'public', 'styles.css'));
});

const inventory = JSON.parse(fs.readFileSync('inventory.json', 'utf-8'));

app.get('/', (req, res) => {
  res.render('index', { inventory });
});

/*
app.post('/generate-list', (req, res) => {
  const selectedItems = req.body.items;
  const sortedItems = selectedItems.sort((a, b) => {
    return inventory.find(x => x.item === a).aisle - inventory.find(x => x.item === b).aisle;
  });
  res.send({ sortedItems });
});

app.post('/generate-list', express.json(), (req, res) => {
  const selectedItems = req.body.items;
  const itemsWithAisles = selectedItems.map((item) => {
    const inventoryItem = inventory.find((i) => i.item === item);
    return { item, aisle: inventoryItem.aisle };
  });
  itemsWithAisles.sort((a, b) => parseInt(a.aisle) - parseInt(b.aisle));
  const sortedItems = itemsWithAisles.map((item) => item.item);
  res.json({ sortedItems });
});
*/
app.post('/generate-list', (req, res) => {
  const selectedItems = req.body.items;
  const itemsWithAisles = selectedItems.map((item) => {
    const inventoryItem = inventory.find((i) => i.item === item);
    return { item, aisle: inventoryItem.aisle };
  });
  itemsWithAisles.sort((a, b) => parseInt(a.aisle) - parseInt(b.aisle));
  const sortedItems = itemsWithAisles.map((item) => item.item);

  // Save the sorted list to a file
  saveListToFile(sortedItems);

  res.render('list', { sortedItems });
});

/*
app.post('/add-item', (req, res) => {
  const newItem = req.body['new-item'];
  const aisle = "Unknown"; // Set a default aisle for new items
  inventory.push({ item: newItem, aisle: aisle });
  res.redirect('/'); // Redirect back to the item selection page
});
*/

app.post('/add-item', (req, res) => {
  const newItem = req.body['new-item'];
  const aisle   = req.body['aisle'];
  inventory.push({ item: newItem, aisle: aisle });

  // Backup the current inventory
  backupInventory();

  // Update the inventory.json file
  fs.writeFile('./inventory.json', JSON.stringify(inventory, null, 2), (err) => {
    if (err) {
      console.error('Error updating inventory:', err);
      res.status(500).send('Error updating inventory.');
    } else {
      console.log('Inventory updated.');
      res.redirect('/'); // Redirect back to the item selection page
    }
  });
});

app.listen(myHTTP, () => {
  console.log(`Server started on port ${myHTTP}`);
});

// ------------------------------------------------------------------------------

function backupInventory() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `./backups/inventory-backup-${timestamp}.json`;
  fs.copyFile('./inventory.json', backupFile, (err) => {
    if (err) {
      console.error('Error creating backup:', err);
    } else {
      console.log('Backup created:', backupFile);
    }
  });
}

// Format like this:
// * 4/6/2023 Groceries list
//
// - [ ] Pistachios
// ..
// - [ ] Dairy

function saveListToFile(sortedItems) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `./lists/list-${timestamp}.txt`;
    const today = new Date().toDateString();
    
    const fileContent = `* ${today} Groceries List\n\n` +sortedItems.reduce((content, item) => {
        return content + `- [ ] ${item}\n`;
    }, '');

    fs.writeFile(fileName, fileContent, (err) => {
        if (err) {
            console.error('Error writing list to file:', err);
        } else {
            console.log('List saved to file:', fileName);
        }
    });
}

module.exports = app;
