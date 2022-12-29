const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

// Contact model
const Contact = require('../models/Contact');

// @route   GET api/contacts
// @desc    Get all contacts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user.id }).sort({ date: -1 });
    res.json(contacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/contacts
// @desc    Add new contact
// @access  Private
router.post(
  '/contacts',
  [
    auth,
    [
      check('firstName', 'First Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('phone', 'Phone is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, middleName, dob, email, phone, occupation, company } = req.body;

    try {
      let contact = await Contact.findOne({ email });

      if (contact) {
        return res.status(400).json({ msg: 'Contact already exists' });
      }

      contact = new Contact({
        firstName,
        lastName,
        middleName,
        dob,
        email,
        phone,
        occupation,
        company,
        user: req.user.id
      });

      await contact.save();

      res.json(contact);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/contacts/:id
// @desc    Update contact
// @access  Private
router.put('/contacts/:id', auth, async (req, res) => {
  const { firstName, lastName, middleName, dob, email, phone, occupation, company } = req.body;

  // Build contact object
  const contactFields = {};
  if (firstName) contactFields.firstName = firstName;
  if (lastName) contactFields.lastName = lastName;
  if (middleName) contactFields.middleName = middleName;
  if (dob) contactFields.dob = dob;
  if (email) contactFields.email = email;
  if (phone) contactFields.phone = phone;
  if (occupation) contactFields.occupation = occupation;
 


if (company) contactFields.company = company;

try {
let contact = await Contact.findById(req.params.id);


if (!contact) return res.status(404).json({ msg: 'Contact not found' });

// Make sure user owns contact
if (contact.user.toString() !== req.user.id) {
  return res.status(401).json({ msg: 'Not authorized' });
}

contact = await Contact.findByIdAndUpdate(req.params.id, { $set: contactFields }, { new: true });

res.json(contact);
} catch (err) {
console.error(err.message);
res.status(500).send('Server Error');
}
});

// @route DELETE api/contacts/:id
// @desc Delete contact
// @access Private
router.delete('/deleteContact/:id', auth, async (req, res) => {
try {
let contact = await Contact.findById(req.params.id);


if (!contact) return res.status(404).json({ msg: 'Contact not found' });

// Make sure user owns contact
if (contact.user.toString() !== req.user.id) {
  return res.status(401).json({ msg: 'Not authorized' });
}

await Contact.findByIdAndRemove(req.params.id);

res.json({ msg: 'Contact removed' });
} catch (err) {
console.error(err.message);
res.status(500).send('Server Error');
}
});

// @route POST api/auth
// @desc Authenticate user & get token
// @access Public
router.post(
'/auth',
[
check('email', 'Please include a valid email').isEmail(),
check('password', 'Password is required').exists()
],
async (req, res) => {
const errors = validationResult(req);
if (!errors.isEmpty()) {
return res.status(400).json({ errors: errors.array() });
}


const { email, password } = req.body;

try {
  let user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
  }

  const payload = {
    user: {
      id: user.id
    }
  };

  jwt.sign(
    payload,
    config.get('jwtSecret'),
    {
      expiresIn: 360000
    },
    (err, token) => {
      if (err) throw err;
      res.json({ token });
    }
  );
} catch (err) {
  console.error(err.message);
  res.status(500).send('Server error');
}
}
);

module.exports = router;