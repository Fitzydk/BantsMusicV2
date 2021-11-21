const app = require('express')();
const PORT = process.env.PORT || 3000;

app.get("/", function(req, res) {
  res.send("Hello World");
});

app.listen(PORT, function() {
  console.log(`Listening on Port ${PORT}`);
});