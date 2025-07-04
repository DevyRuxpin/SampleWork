/** Middleware for validating book data using JSONSchema */

const jsonschema = require("jsonschema");
const { bookSchema, bookUpdateSchema } = require("../schemas/bookSchema");
const ExpressError = require("../expressError");

/** Middleware to validate book data for creation */
function validateBook(req, res, next) {
  try {
    const validation = jsonschema.validate(req.body, bookSchema);
    if (!validation.valid) {
      const errorList = validation.errors.map(e => e.stack);
      const err = new ExpressError(errorList, 400);
      return next(err);
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to validate book data for updates */
function validateBookUpdate(req, res, next) {
  try {
    const validation = jsonschema.validate(req.body, bookUpdateSchema);
    if (!validation.valid) {
      const errorList = validation.errors.map(e => e.stack);
      const err = new ExpressError(errorList, 400);
      return next(err);
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { validateBook, validateBookUpdate }; 