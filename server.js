// api/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 5000; // Use dynamic port for Vercel
const SECRET_KEY = "sdkfsufoweiowssfsfsflerwrlkw";

app.use(bodyParser.json());
app.use(cors());

let points = 5000;
const users = [];

const rollDice = () => {
  return Math.floor(Math.random() * 6) + 1;
};

app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);
  users.push({ username, password: hashedPassword });
  res.status(201).send({ message: "User registered successfully" });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ username: user.username }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.status(200).send({ token });
  } else {
    res.status(401).send({ message: "Invalid credentials" });
  }
});

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.post("/api/roll", authenticateJWT, (req, res) => {
  const { betAmount, betType } = req.body;
  const dice1 = rollDice();
  const dice2 = rollDice();
  const diceTotal = dice1 + dice2;
  let resultMessage;
  let newPoints = points;

  if (betType === "7up" && diceTotal > 7) {
    newPoints += betAmount;
    resultMessage = `You won! New points: ${newPoints}`;
  } else if (betType === "7down" && diceTotal < 7) {
    newPoints += betAmount;
    resultMessage = `You won! New points: ${newPoints}`;
  } else if (betType === "7" && diceTotal === 7) {
    newPoints += betAmount * 5;
    resultMessage = `You won! New points: ${newPoints}`;
  } else {
    newPoints -= betAmount;
    resultMessage = `You lost. New points: ${newPoints}`;
  }

  points = newPoints;

  res.json({ diceTotal, newPoints, resultMessage });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
