const app = require('express')();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Server is up.'));

module.exports = () => {
  app.listen(PORT, function() {
    console.log(`Listening on Port ${PORT}`);
  });
}