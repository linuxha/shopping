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
const path       = require('path');
const https      = require('https');
const { exec }   = require('child_process');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const privateKeyPath  = path.join(__dirname, './ssl/key.pem');
const certificatePath = path.join(__dirname, './ssl/cert.pem');

const hasSSLCredentials = fs.existsSync(privateKeyPath) && fs.existsSync(certificatePath);

let httpsServer;

if (hasSSLCredentials) {
    const privateKey  = fs.readFileSync(privateKeyPath, 'utf8');
    const certificate = fs.readFileSync(certificatePath, 'utf8');
    const ca          = fs.readFileSync(certificatePath, 'utf8');

    const credentials = {
        key:  privateKey,
        cert: certificate,
        ca:   ca,
    };

    httpsServer = https.createServer(credentials, app);

    httpsServer.listen(myHTTPS, () => {
        console.log(`HTTPS server running on port ${myHTTPS}`);
    });
}

app.use('/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'public', 'styles.css'));
});

app.use('/favicon.ico', (req, res) => {
    res.setHeader('Content-Type', 'image/x-icon');
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

const inventory = JSON.parse(fs.readFileSync(path.join(__dirname, 'inventory.json'), 'utf-8'));

app.get('/', (req, res) => {
    res.render('index', { inventory });
});

app.post('/generate-list', (req, res) => {
    const selectedItems = req.body.items;
    console.log(JSON.stringify(selectedItems));

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
    const aisle = req.body['aisle'];
    inventory.push({ item: newItem, aisle: aisle });

    backupInventory();

    fs.writeFile(path.join(__dirname, './inventory.json'), JSON.stringify(inventory, null, 2), (err) => {
        if (err) {
            console.error('Error updating inventory:', err);
            res.status(500).send('Error updating inventory.');
        } else {
            console.log('Inventory updated.');
            res.redirect('/');
        }
    });
});

const httpServer = app.listen(myHTTP, () => {
    console.log(`Server started on port ${myHTTP}`);
});

function backupInventory() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, `./backups/inventory-backup-${timestamp}.json`);
    fs.copyFile(path.join(__dirname, './inventory.json'), backupFile, (err) => {
        if (err) {
            console.error('Error creating backup:', err);
        } else {
            console.log('Backup created:', backupFile);
        }
    });
}

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
            exec(`cav.sh ${fileName}> /tmp/cav.sh.log 2>&1`, (err, stdout, stderr) => {
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

app.delete('/item/:itemName', (req, res) => {
    const itemName = req.params.itemName;

    const itemIndex = inventory.findIndex((i) => i.item === itemName);
    if (itemIndex === -1) {
        res.status(404).send('Item not found.');
        return;
    }

    inventory.splice(itemIndex, 1);

    // Backup the current inventory
    backupInventory();

    // Update the inventory.json file
    fs.writeFile('./inventory.json', JSON.stringify(inventory, null, 2), (err) => {
        if (err) {
            console.error('Error updating inventory:', err);
            res.status(500).send('Error updating inventory.');
        } else {
            console.log('Item deleted from inventory.');
            res.sendStatus(200); // Send success status
        }
    });
});

module.exports = { app, httpServer, httpsServer }; // Export the servers
