// ==============================================================================
// This node.js is written by GhatGPT4. I fed it my requirements and tweaked it
// long the way.
//
// As a user I wanted to generate a grocery list from an invetory list of itema
// and aisle. I wanted it as a web interface with foldable (show/hide) aisles
// listing the aisles. I wanted the ability to add items/aisles to the inventory
// and when I click generate a new page with the list of the items, sorted by
// aisle would be generated in a simple Emacs org-mode text list with check
// boxes. On my phone I have a simple org-mode app that allows me to sync via
// webdav files. If I mv the list to the appropriate webdav server using cav.sh
// I can then sync with my phone the generated list

const myHTTP  = process.argv[2] ? parseInt(process.argv[2]) : 13000;
//const myHTTP  = 13000;
//const myHTTPS = process.argv[3] ? parseInt(process.argv[3]) : 13443;
//const myHTTPS = 13443;
const myHTTPS = myHTTP + 443;

const express    = require('express');
const bodyParser = require('body-parser');
const fs         = require('fs');
const app        = express();

const { exec } = require('child_process');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const path  = require('path');
const https = require('https');

// Read the SSL certificate files
// Note: These files need to be provided by the user
// Read the SSL certificate files
const privateKeyPath  = './ssl/key.pem';
const certificatePath = './ssl/cert.pem';
// Mine are not self signed but I left this alone
const caPath          = './ssl/cert.pem'; // For self-signed certificate, use the same cert.pem

if (fs.existsSync(privateKeyPath) && fs.existsSync(certificatePath) && fs.existsSync(caPath)) {
    const privateKey  = fs.readFileSync(privateKeyPath, 'utf8');
    const certificate = fs.readFileSync(certificatePath, 'utf8');
    const ca          = fs.readFileSync(caPath, 'utf8');

    const credentials = {
        key:  privateKey,
        cert: certificate,
        ca:   ca,
    };

    // Create an HTTPS service
    const httpsServer = https.createServer(credentials, app);

    // Set the HTTPS server to listen on a specific port (e.g., 8443)
    httpsServer.listen(myHTTPS, () => {
        console.log(`HTTPS server running on port ${myHTTPS}`);
    });
} else {
    console.log('SSL certificate files not found. Skipping HTTPS server.');
}
/*
const privateKey  = fs.readFileSync('./ssl/key.pem', 'utf8');
const certificate = fs.readFileSync('./ssl/cert.pem', 'utf8');

const ca = fs.readFileSync('./ssl/cert.pem', 'utf8'); // For self-signed certificate, use the same cert.pem

const credentials = {
    key:  privateKey,
    cert: certificate,
    ca:   ca,
};

// Create an HTTPS service
const httpsServer = https.createServer(credentials, app);

// Set the HTTPS server to listen on a specific port (e.g., 8443)
httpsServer.listen(myHTTPS, () => {
    console.log(`HTTPS server running on port ${myHTTPS}`);
});
*/
// ==============================================================================

/*
@FIXED: Refused to apply style from 'http://mozart.uucp:13000/styles.css' because its MIME type ('text/html') is not a supported stylesheet MIME type, and strict MIME checking is enabled.
*/

app.use('/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'public', 'styles.css'));
});

app.use('/favicon.ico', express.static('public/favicon.ico'));

const inventory = JSON.parse(fs.readFileSync('inventory.json', 'utf-8'));

app.get('/', (req, res) => {
    res.render('index', { inventory });
});

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
    //const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName  = `./lists/list.txt`;
    const today     = new Date().toDateString();
    
    const fileContent = `* ${today} Groceries List\n\n` + sortedItems.reduce((content, item) => {
        return content + `- [ ] ${item}\n`;
    }, '');

    fs.writeFile(fileName, fileContent, (err) => {
        if (err) {
            console.error('Error writing list to file:', err);
        } else {
            console.log('List saved to file:', fileName);

            // Execute the external script with the new file as an argument
            //exec(`./cav.sh ${fileName}`, (err, stdout, stderr) => {
            exec(`cav.sh ${fileName}`, (err, stdout, stderr) => {
                if (err) {
                    console.error('Error executing cav.sh:', err);
                    return;
                }
                if (stdout) console.log('cav.sh stdout:', stdout);
                if (stderr) console.log('cav.sh stderr:', stderr);
            });
        }
    });
}

module.exports = app;
