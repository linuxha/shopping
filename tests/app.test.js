const request = require('supertest');
const { app, httpServer, httpsServer } = require('../app');

describe('Grocery List Application', () => {
    it('should serve the index page on GET /', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('Grocery List');
    });

    // Generate a list and check it
    // the items in the list must already be in the inventory.json
    it('should generate and render a grocery list on POST /generate-list', async () => {
        const res = await request(app)
              .post('/generate-list')
              .send({ items: ['Apples', 'Bananas', 'Carrots'] }); // match exactly what's in inventory
        expect(res.statusCode).toEqual(200);

        expect(res.text).toContain('Grocery List');
        expect(res.text).toContain('Apples');
        expect(res.text).toContain('Bananas');
        expect(res.text).toContain('Carrots');
    });

    // Check that it serves up an ico
    it('should serve the favicon.ico', async () => {
        const res = await request(app).get('/favicon.ico');
        expect(res.statusCode).toEqual(200);
    });

    // DO NOT add an existing item or this will fail
    it('should add a new item to the inventory on POST /add-item', async () => {
        const res = await request(app)
              .post('/add-item')
              .send({ 'new-item': 'x1234567890', aisle: '5' });
        expect(res.statusCode).toEqual(302); // Expecting a redirection
        const res2 = await request(app).get('/');
        expect(res2.text).toContain('x1234567890');
    });

    // Cleanup (and test)
    it('should delete a new item from the inventory on DELETE /item/:x1234567890 - success', async () => {
        const itemToDelete = 'x1234567890';
        const response = await request(app).delete(`/item/${itemToDelete}`);

        expect(response.status).toBe(200);

        // Make another request to the home page to check if the item has been removed
        const homePageResponse = await request(app).get('/');
        expect(homePageResponse.statusCode).toBe(200);
        expect(homePageResponse.text).not.toContain(itemToDelete);
    });

    // Check for non-existant item
    it('should return 404 on DELETE /item/:NonExistentItem - failure (item not found)', async () => {
        const nonExistentItem = 'NonExistentItem';
        const response = await request(app).delete(`/item/${nonExistentItem}`);

        expect(response.status).toBe(404);
    });
});

// Add the following at the end of your app.test.js file
afterAll(() => {
  httpServer.close();
  if (httpsServer) {
    httpsServer.close();
  }
});

// If you are using Mocha, replace afterAll with after:
/*
after(() => {
  httpServer.close();
  if (httpsServer) {
    httpsServer.close();
  }
});
*/

/*
const request = require('supertest');
const { app, httpServer, httpsServer } = require('../app');

describe('Grocery List Application', () => {
    test('should render the home page on GET /', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('Grocery List');
    });

    test('POST /add-item', async () => {
        const newItem = 'Test item';
        const newAisle = '99';
        const response = await request(app)
              .post('/add-item')
              .send({ 'new-item': newItem, aisle: newAisle });

        expect(response.statusCode).toBe(302); // Expect a redirect
        expect(response.headers.location).toBe('/'); // Expect a redirect to the home page

        // Make another request to the home page to check if the item has been added
        const homePageResponse = await request(app).get('/');
        expect(homePageResponse.statusCode).toBe(200);
        expect(homePageResponse.text).toContain(newItem);
        expect(homePageResponse.text).toContain(newAisle);
    });

    test('POST /generate-list', async () => {
        const response = await request(app)
              .post('/generate-list')
              .send({ items: ['Apple', 'Orange'] }); // Update item names to match inventory.json

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            sortedItems: ['Apple', 'Orange'],
        });
    });
});
// Add the following at the end of your app.test.js file
afterAll(() => {
    httpServer.close();
    if (httpsServer) {
        httpsServer.close();
    }
});
*/

