/*
  models/Item.js — the shape of ONE lost/found report in MongoDB.
  ---------------------------------------------------------------
  A Mongoose "schema" is a rulebook for a document, and a "model"
  is the tool we use to create / read / delete those documents.
  Collection name: Mongoose turns "Item" into "items" automatically.

  Fields:
    name        — short title, e.g. "Blue water bottle"   (required)
    description — details that help identify the item    (required)
    location    — where it was lost / found              (required)
    date        — the day it was lost / found            (required)
    status      — exactly "Lost" or "Found"              (required)
    createdAt / updatedAt — added automatically by Mongoose
*/

const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name:        { type: String, required: [true, 'Item name is required'],   trim: true, maxlength: 80 },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 500 },
    location:    { type: String, required: [true, 'Location is required'],    trim: true, maxlength: 120 },
    date:        { type: Date,   required: [true, 'Date is required'] },
    status:      { type: String, required: true, enum: ['Lost', 'Found'], default: 'Lost' }
  },
  { timestamps: true } // auto-adds createdAt + updatedAt to every document
);

module.exports = mongoose.model('Item', itemSchema);
