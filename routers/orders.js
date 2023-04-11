const express = require('express');
const { Order } = require('../models/order');

const router = express.Router();

router.get(`/`, async (req, res) => {
  const orderList = await Order.find();

  if (!orderList) res.status(500).json({ success: false });

  res.send(orderList);
});

router.post(`/`, (req, res) => {
  const order = new Order({});

  product
    .save()
    .then((createdOrder) => {
      res.status(201).json(createdOrder);
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        succes: false
      });
    });
});

module.exports = router;
