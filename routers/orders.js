const express = require('express');
const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item');

const router = express.Router();

router.get(`/`, async (req, res) => {
  const orderList = await Order.find().populate('user', 'name').sort({ dateOrdered: -1 });

  if (!orderList) res.status(500).json({ success: false });

  res.send(orderList);
});

router.get('/:id', async (req, res) => {
  const orderList = await Order.findById(req.params.id)
    .populate('user', 'name')
    .populate({ path: 'orderItems', populate: { path: 'product', populate: 'category' } });

  if (!orderList) res.status(500).json({ success: false });

  res.send(orderList);
});

router.post(`/`, async (req, res) => {
  const orderItemsIds = Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        product: orderItem.product
      });

      newOrderItem = await newOrderItem.save();

      return newOrderItem._id;
    })
  );

  const orderItemsIdsResolved = await orderItemsIds;

  const totalPrices = await Promise.all(
    orderItemsIdsResolved.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
      const totalPrice = orderItem.product.price * orderItem.quantity;
      return totalPrice;
    })
  );

  let order = new Order({
    orderItems: orderItemsIdsResolved,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrices.reduce((a, b) => a + b, 0),
    user: req.body.user
  });

  order = await order.save();

  if (!order) {
    return res.status(400).json({ message: 'Order cannot be created!' });
  }

  res.status(200).send(order);
});

router.put('/:id', async (req, res) => {
  const order = await Order.findOneAndUpdate(
    req.params.id,
    {
      status: req.body.status
    },
    { new: true }
  );

  if (!order) {
    return res.status(400).json({ message: 'Order cannot edited.' });
  }

  return res.send(order);
});

router.delete('/:id', async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id, { new: true });

  if (!order) {
    return res.status(400).json({ message: 'Order cannot deleted.' });
  }

  await order.orderItems.map(async (orderItem) => {
    await OrderItem.findByIdAndRemove(orderItem);
  });

  return res.send({ message: 'Order deleted' });
});

router.get('/get/totalsales', async (req, res) => {
  let totalSales = await Order.aggregate([
    { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
  ]);

  if (!totalSales) {
    return res.status(400).send({ message: 'The order sales cannot be generated' });
  }

  return res.send({ totalSales: totalSales.pop().totalSales });
});

router.get('/get/count', async (req, res) => {
  const orderCount = await Order.countDocuments();

  if (!orderCount) {
    return res.status(500).json({ success: false });
  }

  return res.status(200).json({ orderCount: orderCount });
});

router.get(`/get/userorders/:userid`, async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.userid })
    .populate('user', 'name')
    .populate({ path: 'orderItems', populate: { path: 'product', populate: 'category' } })
    .sort({ dateOrdered: -1 });

  if (!userOrderList) res.status(500).json({ success: false });

  res.send(userOrderList);
});

module.exports = router;
