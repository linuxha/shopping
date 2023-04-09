# Org-mode Shopping list generator

This was one of my experiments with using ChatGPT 4. To experiment with ChatGPT4 I needed to provide requirments and some kind of goal. I had been thinking about creating a simple grocery list that I can send to my cell phone and use while shopping. On my phone I have an app called org-mode which is related to the [Emacs Org-mode](https://orgmode.org/) which I use heavily for my note taking. Org-Mode is an Emacs mode that is text based so anything can read the files. Emacs interprets the org-mode markdown and can provide images links, folding, formatting, spreadsheets, programming and a lot more. I found I can take a simmple org-mode list text file and send it with cadaver via WebDAV to my server so the file is easily accessible on my phone via the org-mode app. Then while shopping I can check off the items as I find them.

## Intent

As a user I wanted to generate a grocery list from an inventory list of items and aisle. I wanted it as a web interface with foldable (show/hide) aisles listing the aisles. I wanted the ability to add items/aisles to the inventory and when I click generate a new page with the list of the items, sorted by aisle would be generated in a simple Emacs org-mode text list with check boxes. On my phone I have a simple org-mode app that allows me to sync via webdav files. If I mv the list to the appropriate webdav server using cav.sh I can then sync with my phone the generated list.

## User supplied files

- inventory.json
```
[
  { "item": "Apples", "aisle": 1 },
  { "item": "Carrots", "aisle": 1 },
  { "item": "Bananas", "aisle": 1 },
  { "item": "blah", "aisle": 4001 }
]
```
Add items as needed, The first 3 items, Apples, Carrot, and Bananas is required for one of the test cases to pass. You can change the aisle for each if you want.

- ssl/cert.pem
- ssl/key.pem

The files needed for HTTPS support.

### HTTPS support

If the files `ssl/cert.pem` and `ssl/key.pem` are present then the server will startup listening on the assigned HTTPS port. If any of those files are missing the HTTPS setup will be skipped.

## Running the code

To use the default ports of 13000 (http) and 13443 (https) run this:
```
node app.js &
```
Or to run on a different port, 4321 (http) and 4764 (https) for example, use this:
```
node app.js 4321 &
```

Note that the HTTPS port is coded to be 443 higher than the http port.


## To test the code:

```
npm test
```

I may add more test cases in the future.

## Dependencies

The dependencies are in the package.json but here's the list

- "body-parser": "^1.20.2",
- "ejs": "^3.1.9",
- "express": "^4.18.2",
- "https": "^1.0.0",
- "mocha": "^10.2.0"

For development:

- "jest": "^29.5.0",
- "supertest": "^6.3.3"

## Directory structure

| File | Purpose |
| ---- | ------- |
| app.js | |
| backups/ | |
| cav.sh | |
| inventory.json | |
| LICENSE | |
| lists/ | |
| package.json | |
| package-lock.json | |
| public/ | |
| public/favicon.ico | |
| public/script.js | |
| public/styles.css | |
| Readme.md | |
| ssl/ | |
| ssl/key.pem | |
| ssl/cert.pem | |
| tests/ | |
| tests/app.test.js | |
| views/ | |
| views/index.ejs | |
| views/list.ejs | |

