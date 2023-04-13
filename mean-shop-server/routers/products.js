const express = require('express');
const { Product } = require('../models/product');
const { Category } = require('../models/category');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error('Invalid image type.');
    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, 'public/uploads');
  },
  filename: function (req, file, cb) {
    const filename = file.originalname.split(' ').join('-');
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${filename}-${Date.now()}.${extension}`);
  }
});
const upload = multer({ storage: storage });

// http://localhost:3000/api/v1/products
router.get(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(',') };
  }

  const productList = await Product.find(filter).populate('category');

  if (!productList) res.status(500).json({ success: false });

  res.send(productList);
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send({ message: 'Invalid product id' });
  }
  const product = await Product.findById(req.params.id).populate('category');

  if (!product) {
    res.status(404).json({ message: 'Product not found.' });
  }
  return res.status(200).json(product);
});

router.get('/get/featured/:count', async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const productList = await Product.find({ isFeatured: true }).limit(+count);

  if (!productList) {
    return res.status(500).json({ success: false });
  }

  return res.status(200).json(productList);
});

router.post(`/`, upload.single('image'), async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send({ message: 'Invalid Category!' });
  const file = req.file;
  if (!file) return res.status(400).send({ message: 'No image in request.' });

  const filename = req.file.filename;
  const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
  let product = new Product({
    name: req.body.name.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${filename}`,
    images: req.body.images,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    isFeatured: req.body.isFeatured
  });

  product = await product.save();
  if (!product) {
    return res.status(400).send({ message: 'Product canot be created. ' });
  }

  return res.status(200).send(product);
});

router.put('/:id', upload.single('image'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send('Invalid Product Id');
  }

  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send({ message: 'Invalid Category!' });

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(400).send({ message: 'Invalid product' });

  const file = req.file;
  let imagePath;
  if (file) {
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/upload`;
    imagePath = `${basePath}${fileName}`;
  } else {
    imagePath = product.image;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: imagePath,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      isFeatured: req.body.isFeatured
    },
    { new: true }
  );

  if (!updatedProduct) {
    return res.status(404).send({ message: 'Product canot updated.' });
  }

  return res.status(200).send(updatedProduct);
});

router.put('/gallery-images/:id', upload.array('images', 10), async (req, res) => {
  mongoose.isValidObjectId(req.params.id);
  let imagePaths = [];
  const files = req.files;
  const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
  if (files) {
    files.map((file) => {
      imagePaths.push(`${basePath}${file.filename}`);
    });
  }
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      images: imagePaths
    },
    { new: true }
  );

  if (!product) {
    return res.status(500).send('The product cannot be updated!');
  }
  res.send(product);
});

router.delete('/:id', (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then((category) => {
      if (category) {
        return res.status(200).json({ success: true, message: 'Produt is deleted.' });
      } else {
        return res.status(404).json({ success: false, message: 'Produt not found.' });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get('/get/count', async (req, res) => {
  const productCount = await Product.countDocuments();

  if (!productCount) {
    return res.status(500).json({ success: false });
  }

  return res.status(200).json({ productCount: productCount });
});

module.exports = router;
