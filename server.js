const express = require('express');
const app = express();
app.set('view engine', 'ejs');
const admin = require('firebase-admin');
const serviceAccount = require('./key.json');
const axios = require('axios');
const passwordHash= require('password-hash');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/signup', function (req, res) {
  res.render('signup');
});
app.get('/login', function (req, res) {
  res.render('login');
});
app.post("/signupSubmit", async (req, res) => {
    db.collection("users")
        .where("email", "==", req.body.email)
        .get()
        .then((docs) => {
            if (docs.size > 0) {
                res.send("The email already exists");
            } else {
                const hashedPassword = passwordHash.generate(req.body.password);
                db.collection("users")
                    .add({
                        email: req.body.email,
                        password: hashedPassword,
                    })
                    .then(() => {
                        res.render("login");
                    })
                    .catch(() => {
                        res.send("An error occurred while signing up");
                    });
            }
        });
});

app.post("/loginSubmit", function (req, res) {
    db.collection("users")
        .where("email", "==", req.body.email)
        .get()
        .then((docs) => {
            let verified = false;
            docs.forEach((doc) => {
                verified = passwordHash.verify(req.body.password, doc.data().password); // Compare hashed passwords
            });
            if (verified) {
                res.redirect("/weather");
            } else {
                res.send("Login failed");
            }
        })
        .catch(() => {
            res.send("An error occurred while logging in");
        });
});


app.get('/weather', async function (req, res) {
    try {
      const apiKey = '71afd29f2cd840919b4101249232907';
      const city = req.query.city || 'New York';
  
      const weatherResponse = await axios.get(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`);
      const weatherData = weatherResponse.data;
  
      res.render('weather', { weather: weatherData, city });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      res.status(500).send('Error fetching weather data');
    }
  });
  
app.listen(3000, () => {
  console.log('Server is running on port 5000');
});