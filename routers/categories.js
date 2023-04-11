const express = require('express');
const { Category } = require('../models/category');

const router = express.Router();

// http://localhost:3000/api/v1/products
router.get(`/`, async (req, res) => {
  const categoryList = await Category.find();

  if (!categoryList) res.status(500).json({ success: false });

  res.send(categoryList);
});

router.post(`/`, (req, res) => {
  const category = new Category({});

  product
    .save()
    .then((createdCategory) => {
      res.status(201).json(createdCategory);
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        succes: false
      });
    });
});

module.exports = router;
