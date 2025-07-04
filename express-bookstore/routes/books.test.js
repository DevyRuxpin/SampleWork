/** Integration tests for books routes */

process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testBook;

beforeEach(async function() {
  // Clean up database
  await db.query("DELETE FROM books");
  
  // Create a test book
  const result = await db.query(`
    INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`,
    [
      "0691161518",
      "http://a.co/eobPtX2",
      "Matthew Lane",
      "english",
      264,
      "Princeton University Press",
      "Power-Up: Unlocking the Hidden Mathematics in Video Games",
      2017
    ]
  );
  
  testBook = result.rows[0];
});

afterEach(async function() {
  // Clean up database
  await db.query("DELETE FROM books");
});

afterAll(async function() {
  await db.end();
});

/** GET /books */
describe("GET /books", function() {
  test("Gets a list of books", async function() {
    const response = await request(app)
      .get("/books")
      .send();
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      books: [testBook]
    });
  });
});

/** GET /books/[isbn] */
describe("GET /books/:isbn", function() {
  test("Gets a single book", async function() {
    const response = await request(app)
      .get(`/books/${testBook.isbn}`)
      .send();
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      book: testBook
    });
  });

  test("Responds with 404 if can't find book in question", async function() {
    const response = await request(app)
      .get(`/books/999`)
      .send();
    
    expect(response.statusCode).toBe(404);
  });
});

/** POST /books */
describe("POST /books", function() {
  test("Creates a new book", async function() {
    const newBook = {
      isbn: "1234567890",
      amazon_url: "http://a.co/test123",
      author: "Test Author",
      language: "english",
      pages: 300,
      publisher: "Test Publisher",
      title: "Test Book",
      year: 2023
    };
    
    const response = await request(app)
      .post("/books")
      .send(newBook);
    
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      book: newBook
    });
  });

  test("Responds with 400 if data is invalid - missing required fields", async function() {
    const invalidBook = {
      isbn: "1234567890",
      author: "Test Author"
      // Missing required fields
    };
    
    const response = await request(app)
      .post("/books")
      .send(invalidBook);
    
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  test("Responds with 400 if data is invalid - invalid types", async function() {
    const invalidBook = {
      isbn: "1234567890",
      amazon_url: "not-a-url",
      author: "Test Author",
      language: "english",
      pages: "not-a-number",
      publisher: "Test Publisher",
      title: "Test Book",
      year: "not-a-year"
    };
    
    const response = await request(app)
      .post("/books")
      .send(invalidBook);
    
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  test("Responds with 400 if data is invalid - invalid year range", async function() {
    const invalidBook = {
      isbn: "1234567890",
      amazon_url: "http://a.co/test123",
      author: "Test Author",
      language: "english",
      pages: 300,
      publisher: "Test Publisher",
      title: "Test Book",
      year: 1800 // Too old
    };
    
    const response = await request(app)
      .post("/books")
      .send(invalidBook);
    
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  test("Responds with 400 if data is invalid - empty strings", async function() {
    const invalidBook = {
      isbn: "",
      amazon_url: "http://a.co/test123",
      author: "",
      language: "english",
      pages: 300,
      publisher: "Test Publisher",
      title: "",
      year: 2023
    };
    
    const response = await request(app)
      .post("/books")
      .send(invalidBook);
    
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});

/** PUT /books/[isbn] */
describe("PUT /books/:isbn", function() {
  test("Updates a book", async function() {
    const updateData = {
      amazon_url: "http://a.co/updated",
      author: "Updated Author",
      language: "spanish",
      pages: 400,
      publisher: "Updated Publisher",
      title: "Updated Title",
      year: 2024
    };
    
    const response = await request(app)
      .put(`/books/${testBook.isbn}`)
      .send(updateData);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      book: {
        isbn: testBook.isbn,
        ...updateData
      }
    });
  });

  test("Responds with 404 if can't find book in question", async function() {
    const updateData = {
      amazon_url: "http://a.co/updated",
      author: "Updated Author",
      language: "english",
      pages: 400,
      publisher: "Updated Publisher",
      title: "Updated Title",
      year: 2024
    };
    
    const response = await request(app)
      .put(`/books/999`)
      .send(updateData);
    
    expect(response.statusCode).toBe(404);
  });

  test("Responds with 400 if data is invalid", async function() {
    const invalidData = {
      amazon_url: "not-a-url",
      author: "Updated Author",
      language: "english",
      pages: "not-a-number",
      publisher: "Updated Publisher",
      title: "Updated Title",
      year: 2024
    };
    
    const response = await request(app)
      .put(`/books/${testBook.isbn}`)
      .send(invalidData);
    
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});

/** DELETE /books/[isbn] */
describe("DELETE /books/:isbn", function() {
  test("Deletes a book", async function() {
    const response = await request(app)
      .delete(`/books/${testBook.isbn}`)
      .send();
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      message: "Book deleted"
    });
  });

  test("Responds with 404 if can't find book in question", async function() {
    const response = await request(app)
      .delete(`/books/999`)
      .send();
    
    expect(response.statusCode).toBe(404);
  });
}); 