const request = require('supertest');
const app = require('../app');

describe('GET /', () => {
  it('should respond with status 200', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });

  it('should display the correct title', async () => {
    const response = await request(app).get('/');
    expect(response.text).toContain('<title>Grocery List Generator</title>');
  });
});

/*
describe('POST /generate-list', () => {
  it('should respond with status 200', async () => {
    const response = await request(app)
      .post('/generate-list')
      .send('items=Colgate%20Total%20toothpaste&items=toothbrush&items=listerine');
    expect(response.statusCode).toBe(200);
  });

  it('should display the sorted grocery list', async () => {
    const response = await request(app)
      .post('/generate-list')
      .send('items=Colgate%20Total%20toothpaste&items=toothbrush&items=listerine');
    expect(response.text).toContain('<title>Grocery List</title>');
    expect(response.text).toContain('- [ ] Colgate Total toothpaste');
    expect(response.text).toContain('- [ ] toothbrush');
    expect(response.text).toContain('- [ ] listerine');
  });
});
*/

describe('POST /generate-list', () => {
  it('should respond with status 200', async () => {
    const response = await request(app)
      .post('/generate-list')
      .send('items=Colgate%20Total%20toothpaste&items=toothbrush&items=listerine');
    expect(response.statusCode).toBe(200);
  });

  it('should display the sorted grocery list', async () => {
    const response = await request(app)
      .post('/generate-list')
      .send('items=Colgate%20Total%20toothpaste&items=toothbrush&items=listerine');
    expect(response.text).toContain('<title>Grocery List</title>');
    expect(response.text).toContain('- [ ] Colgate Total toothpaste');
    expect(response.text).toContain('- [ ] toothbrush');
    expect(response.text).toContain('- [ ] listerine');
  });

  it('should sort items by aisle', async () => {
    const response = await request(app)
      .post('/generate-list')
      .send('items=listerine&items=4%E2%80%9D%20J%26J%20Bandaid%20gauze%20pads&items=Colgate%20Total%20toothpaste');
    const toothpasteIndex = response.text.indexOf('Colgate Total toothpaste');
    const listerineIndex = response.text.indexOf('listerine');
    const bandaidIndex = response.text.indexOf('4” J&J Bandaid gauze pads');
    expect(toothpasteIndex).toBeLessThan(listerineIndex);
    expect(listerineIndex).toBeLessThan(bandaidIndex);
  });
});
