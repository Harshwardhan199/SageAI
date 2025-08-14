const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors()); 
app.use(express.json()); 

app.post("/api/auth/signup", (req, res) => {
  const { username, email, password } = req.body;

  console.log("Received signup data:", { username, email, password });

  res.json({
    message: "Signup successful (dummy response)",
    data: { username, email },
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
