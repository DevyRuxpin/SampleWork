/** JSON schema for book validation */

const bookSchema = {
  type: "object",
  required: ["isbn", "amazon_url", "author", "language", "pages", "publisher", "title", "year"],
  properties: {
    isbn: {
      type: "string",
      minLength: 1
    },
    amazon_url: {
      type: "string",
      format: "uri"
    },
    author: {
      type: "string",
      minLength: 1
    },
    language: {
      type: "string",
      minLength: 1
    },
    pages: {
      type: "integer",
      minimum: 1
    },
    publisher: {
      type: "string",
      minLength: 1
    },
    title: {
      type: "string",
      minLength: 1
    },
    year: {
      type: "integer",
      minimum: 1900,
      maximum: new Date().getFullYear()
    }
  }
};

const bookUpdateSchema = {
  type: "object",
  required: ["amazon_url", "author", "language", "pages", "publisher", "title", "year"],
  properties: {
    amazon_url: {
      type: "string",
      format: "uri"
    },
    author: {
      type: "string",
      minLength: 1
    },
    language: {
      type: "string",
      minLength: 1
    },
    pages: {
      type: "integer",
      minimum: 1
    },
    publisher: {
      type: "string",
      minLength: 1
    },
    title: {
      type: "string",
      minLength: 1
    },
    year: {
      type: "integer",
      minimum: 1900,
      maximum: new Date().getFullYear()
    }
  }
};

module.exports = { bookSchema, bookUpdateSchema }; 