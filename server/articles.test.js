import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import sql from 'mssql';

// --- MOCK DATABASE ---
let mockQueryCallCount = 0;
let mockLastQuery = null;
let mockLastInputs = {};

// Mock for tagged template queries (POST, PUT, DELETE)
sql.query = async (strings, ...values) => {
  mockQueryCallCount++;
  mockLastQuery = { strings, values };
  return { recordset: [] };
};

// Mock for dynamic string queries (GET)
sql.Request = class {
  constructor() {
    this.inputs = {};
  }
  input(name, type, value) {
    this.inputs[name] = value;
    mockLastInputs = this.inputs;
    return this;
  }
  async query(queryStr) {
    mockQueryCallCount++;
    mockLastQuery = queryStr;
    // Return dummy data
    return {
      recordset: [
        {
          Id: 1,
          Title: 'Test Article',
          Content: 'Test Content',
          Excerpt: 'Test Excerpt',
          Image: 'img.jpg',
          Date: '13 iunie 2026',
          Author: 'editorUser',
          Journalist1Id: null,
          Journalist2Id: null,
          Journalist1Username: null,
          Journalist2Username: null,
          Status: 'finished'
        }
      ]
    };
  }
};

// Import app after mocking (app initializes routes and uses sql)
const { default: app } = await import('./index.js');

test('Articles API CRUD Operations', async (t) => {
  const request = supertest(app);

  await t.test('GET /api/articles - fetch without role', async () => {
    mockQueryCallCount = 0;
    const res = await request.get('/api/articles');
    
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].title, 'Test Article');
    
    // Verify query applied correct filter
    assert.ok(mockLastQuery.includes("Status = 'finished'"));
  });

  await t.test('GET /api/articles - fetch as editor', async () => {
    const res = await request.get('/api/articles?role=editor&username=editorUser');
    
    assert.strictEqual(res.status, 200);
    assert.strictEqual(mockLastInputs.username, 'editorUser');
    assert.ok(mockLastQuery.includes("a.Author = @username"));
  });

  await t.test('POST /api/articles - create article success', async () => {
    const res = await request.post('/api/articles').send({
      title: 'New Title',
      author: 'editorUser'
    });
    
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.message, 'Articol creat cu succes.');
    assert.strictEqual(mockLastQuery.values[0], 'New Title');
    assert.strictEqual(mockLastQuery.values[5], 'editorUser');
  });

  await t.test('POST /api/articles - fails validation', async () => {
    const res = await request.post('/api/articles').send({
      title: 'Missing author'
    });
    
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Titlul și autorul sunt obligatorii.');
  });

  await t.test('PUT /api/articles/:id - update article success', async () => {
    const res = await request.put('/api/articles/1').send({
      title: 'Updated Title',
      content: 'Updated Content',
      image: 'http://example.com/img.jpg',
      status: 'pending',
      journalist1Id: 2
    });
    
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'Articol actualizat cu succes.');
    assert.strictEqual(mockLastQuery.values[0], 'Updated Title'); // title
    assert.strictEqual(mockLastQuery.values[1], 'Updated Content'); // content
    assert.strictEqual(mockLastQuery.values[2], 'http://example.com/img.jpg'); // image
    assert.strictEqual(mockLastQuery.values[3], 2); // journalist1Id
    assert.strictEqual(mockLastQuery.values[5], 'pending'); // status
  });

  await t.test('PUT /api/articles/:id - fails validation', async () => {
    const res = await request.put('/api/articles/1').send({
      title: 'No status'
    });
    
    assert.strictEqual(res.status, 400);
  });

  await t.test('DELETE /api/articles/:id - delete article success', async () => {
    const res = await request.delete('/api/articles/1');
    
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'Articol șters cu succes.');
    assert.strictEqual(mockLastQuery.values[0], '1'); // id matches
  });
  
  // Close the process as the DB connection pool might hang it
  setTimeout(() => process.exit(0), 100);
});
