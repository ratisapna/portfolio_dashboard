const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('portfolio backend running');
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log('server listening on port ' + PORT);
});
