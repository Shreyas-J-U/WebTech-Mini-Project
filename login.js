const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/passport-auth')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));

// Passport Local Strategy for Login
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log('Incorrect username');
      return done(null, false, { message: 'Incorrect username' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      console.log('User authenticated successfully');
      return done(null, user);  // Login success
    } else {
      console.log('Incorrect password');
      return done(null, false, { message: 'Incorrect password' });
    }
  } catch (err) {
    console.log('Error in authentication:', err);
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);  // Debug log
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('Deserialized user:', user);  // Debug log
    done(null, user);
  } catch (err) {
    console.log('Error in deserialization:', err);
    done(err);
  }
});

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Login </h1>
    <form action="/login" method="POST">
      <div>
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" required>
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required>
      </div>
      <button type="submit">Login</button>
    </form>
    <br>
    <a href="/register">Register</a>
  `);
});

// Registration Page
app.get('/register', (req, res) => {
  res.send(`
    <h1>Register</h1>
    <form action="/register" method="POST">
      <div>
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" required>
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required>
      </div>
      <div>
        <label for="confirmPassword">Confirm Password:</label>
        <input type="password" id="confirmPassword" name="confirmPassword" required>
      </div>
      <button type="submit">Register</button>
    </form>
  `);
});

// Handle Registration
app.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.send('Passwords do not match');
  }

  // Check if username already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.send('Username already exists');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = new User({ username, password: hashedPassword });

  try {
    await newUser.save();
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error saving user');
  }
});

// Handle Login
app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login-failure', successRedirect: '/login-success' })
);

app.get('/login-success', (req, res) => res.send('You successfully logged in!'));
app.get('/login-failure', (req, res) => res.send('Failed to log in'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
