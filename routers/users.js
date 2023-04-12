const express = require('express');
const { User } = require('../models/user');
const bycrypt = require('bcryptjs');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
router.get(`/`, async (req, res) => {
  const userList = await User.find().select('-passwordHash');

  if (!userList) res.status(500).json({ success: false });

  res.send(userList);
});

router.get(`/:id`, async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash');

  if (!user) res.status(404).json({ success: false });

  res.send(user);
});

router.post(`/register`, async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bycrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    city: req.body.city,
    coutry: req.body.coutry
  });

  user = await user.save();

  if (!user) {
    return res.status(404).send('The category cannot by created!');
  }

  res.send(user);
});

router.put('/:id', async (req, res) => {
  mongoose.isValidObjectId(req.params.id);
  const userExist = await User.findById(req.params.id);
  let newPassword;
  if (req.body.password) {
    newPassword = bycrypt.hashSync(req.body.password, 10);
  } else {
    newPassword = userExist.passwordHash;
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      email: req.body.email,
      passwordHash: newPassword,
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      city: req.body.city,
      coutry: req.body.coutry
    },
    { new: true }
  );

  if (!user) {
    return res.status(404).send({ message: 'Product canot updated.' });
  }

  return res.status(200).send(user);
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const secret = process.env.SECRET;
  if (!user) {
    return res.status(400).send({ message: 'The user not found!' });
  }

  if (user && bycrypt.compareSync(req.body.password, user.passwordHash)) {
    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin
      },
      secret,
      {
        expiresIn: '1d'
      }
    );
    return res.status(200).send({ user: user.email, token: token });
  }
  return res.status(400).send({ message: 'Password is wrong.' });
});

router.get('/get/count', async (req, res) => {
  const userCount = await User.countDocuments();

  if (!userCount) {
    return res.status(500).json({ success: false });
  }

  return res.status(200).json({ userCount: userCount });
});

router.delete('/:id', (req, res) => {
  User.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (user) {
        return res.status(200).json({ success: true, message: 'User is deleted.' });
      } else {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

module.exports = router;
