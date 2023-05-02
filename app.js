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
//
// https://stackoverflow.com/questions/63325281/how-to-automatically-reload-updated-ssl-certificates-in-node-js-application

const myHTTP  = process.argv[2] ? parseInt(process.argv[2]) : 13000;
const myHTTPS = myHTTP + 443;

const express    = require('express');
const bodyParser = require('body-parser');
const fs         = require('fs');
const path       = require('path');
const https      = require('https');
const { exec }   = require('child_process');

const app        = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// path to linked SSL cert files
const privateKeyPath  = path.join(__dirname, './ssl/key.pem');
const certificatePath = path.join(__dirname, './ssl/cert.pem');

// If the files exist we hasSSLCredentials
const hasSSLCredentials = fs.existsSync(privateKeyPath) && fs.existsSync(certificatePath);

let httpsServer;

// if we hasSSLCredentials then go and get them
// make sure we watch them for updates too
// And we should listen on ${myHTTPS} port
if (hasSSLCredentials) {
    const privateKey  = fs.readFileSync(privateKeyPath,  'utf8');
    const certificate = fs.readFileSync(certificatePath, 'utf8');
    const ca          = fs.readFileSync(certificatePath, 'utf8');

    //const 
    credentials = {
        key:  privateKey,
        cert: certificate,
        ca:   ca,
    };

    httpsServer = https.createServer(credentials, app);

    httpsServer.listen(myHTTPS, () => {
        console.log(`HTTPS server running on port ${myHTTPS}`);
    });

    watchCertFile('./ssl/key.pem');     // These watch the file for changes and then points to the new file
    watchCertFile('./ssl/cert.pem');    // 
}

// Listen on the non-HTTPS too
const httpServer = app.listen(myHTTP, () => {
    console.log(`Server started on port ${myHTTP}`);
});

app.use('/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'public', 'styles.css'));
});

app.use('/bootstrap.min.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'public', 'bootstrap.min.css'));
});

app.use('/bootstrap.min.css.map', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'public', 'bootstrap.min.css.map'));
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
    let selectedItems = req.body.items;

    if (!Array.isArray(selectedItems)) {
        selectedItems = [selectedItems];
    }

    // console.log(JSON.stringify(selectedItems));

    const itemsWithAisles = selectedItems.map((item) => {
        const inventoryItem = inventory.find((i) => i.item === item);
        try {
            return { item, aisle: inventoryItem.aisle };
        } catch(e) {
            return { item, aisle: null }; // seems okay
        }
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

    // Sort the inventory by aisle
    inventory.sort((a, b) => parseInt(a.aisle) - parseInt(b.aisle));

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

//
function updateCerts() {
    ts = new Date().toISOString().
        replace(/T/, ' ').      // replace T with a space
        replace(/\..+/, '')     // delete the dot and everything after;

    try {
        const privateKey  = fs.readFileSync('./ssl/key.pem', 'utf8');
        const certificate = fs.readFileSync('./ssl/cert.pem', 'utf8');
        const ca          = fs.readFileSync('./ssl/cert.pem', 'utf8'); // For self-signed certificate, use the same cert.pem

        //const
        newCredentials = {
            key: privateKey,
            cert: certificate,
            ca: ca,
        };

        credentials.key  = newCredentials.key;
        credentials.cert = newCredentials.cert;
        credentials.ca   = newCredentials.ca;

        httpsServer.setSecureContext(credentials)

        console.log(`${ts} - SSL certificates updated`);
    } catch (error) {
        console.error(`${ts} - Error updating SSL certificates: `, error);
    }
}


// Example from stackoverflow
function watchFile(path, callback) {
    // Check if it's a link
    fs.lstat(path, function(err, stats) {
        if(err) {
            // Handle errors
            return callback(err);
        } else if(stats.isSymbolicLink()) {
            // Read symlink
            fs.readlink(path, function(err, realPath) {
                // Handle errors
                if(err) return callback(err);
                // Watch the real file
                fs.watch(realPath, callback);
            });
        } else {
            // It's not a symlink, just watch it
            fs.watch(path, callback);
        }
    });
}

// ChatGPT solution
function watchCertFile(certFile) {
    fs.realpath(certFile, (err, resolvedPath) => {
        if (err) {
            console.error(`Error resolving path for ${certFile}:`, err);
            return;
        }

        ts = new Date().toISOString().
            replace(/T/, ' ').      // replace T with a space
            replace(/\..+/, '')     // delete the dot and everything after;
        console.log(`${ts} - Watching ${certFile} -> ${resolvedPath}`);

        fs.watch(resolvedPath, (eventType) => {
            if (eventType === 'change') {
                ts = new Date().toISOString().
                    replace(/T/, ' ').      // replace T with a space
                    replace(/\..+/, '')     // delete the dot and everything after;
                console.log(`${ts} - ${certFile} -> ${resolvedPath} changed. Updating SSL certificates...`);
                updateCerts();
            }
        });
    });
}

module.exports = { app, httpServer, httpsServer }; // Export the servers
