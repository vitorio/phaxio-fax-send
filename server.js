// based on https://glitch.com/~xoxo-fax-send

// init project
const express = require("express");
const app = express();
const Phaxio = require('phaxio-official');
const fileUpload = require("express-fileupload");
const crypto = require('crypto');

// setup form and post handling
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// serve static files
app.use(express.static("public"));
// log requests
app.use(function (req, res, next) {
  console.log(req.method, req.url);
  next();
});
// use container temp dir to avoid memory limits
app.use(fileUpload({
  useTempFiles : true,
  tempFileDir : '/tmp/faxfiles',
  safeFileNames : true,
  preserveExtension : true
}));

app.get("/", function(req, res) {
  // show the setup page if the env isn't configured
  if (process.env.PHAXIOKEY &&
      process.env.PHAXIOSECRET &&
      process.env.SECRET) {
    res.sendFile(__dirname + "/views/index.html");
  } else {
    res.redirect('/setup');
  }
});

// code for the setup flow
app.get("/setup", function(req, res) {
  res.sendFile(__dirname + "/views/setup.html");
});

app.get("/setup-status", function (req, res) {
  res.json({
    "secret": !!process.env.SECRET,
    "credentials": !!(process.env.PHAXIOKEY && process.env.PHAXIOSECRET)
  });
});

app.post("/send-fax", function(req, res) {
  if (!req.body.secret || req.body.secret !== process.env.SECRET) {
    return res.status(403).send('Incorrect password.');
  }
  
  if (!req.files || !req.files.fax) {
    return res.status(400).send('No file was uploaded.');
  }
  
  if (!req.body.to) {
    return res.status(400).send('No destination phone number was provided.');
  }
  
  /* ???
  if (req.files.fax.mimetype != "application/pdf") {
    return res.status(415).send('Uploaded file doesn\'t look like a PDF.')
  }
  */
  
  const phaxio = new Phaxio(process.env.PHAXIOKEY, process.env.PHAXIOSECRET);
  
  // Send a single fax 
  phaxio.faxes.create({
    to: req.body.to,
    file: req.files.fax.tempFilePath
  })
  .then((fax) => {
    // The `create` method returns a fax object with methods attached to it for doing things
    // like cancelling, resending, getting info, etc.

    // Wait 5 seconds to let the fax send, then get the status of the fax by getting its info from the API.
    return setTimeout(() => {
      res.redirect('/fax-status?id=' + fax.id);
    }, 5000)
  })
  .then(status => console.log('Fax status response:\n', JSON.stringify(status, null, 2)))
  .catch((err) => { throw err; });
});

app.get("/fax-status", function(req, res) {
  if (!req.query || !req.query.id) {
    return res.status(400).send('Missing fax ID.');
  }
  
  const phaxio = new Phaxio(process.env.PHAXIOKEY, process.env.PHAXIOSECRET);
  
  // check status
  phaxio.faxes.getInfo(req.query.id)
  .then(response => {
      var price = '$0.00';
      if (response.data.cost) price = '$' + (response.data.cost);
      res.end(response.data.num_pages + ' page(s) submitted ' + response.data.created_at + ' is/are ' + response.data.status + ' costing ' + price + ' (refresh for updates)');
      if (response.data.status == 'failure') console.error(response);
  })
  .catch((err) => { throw err; });
  });

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

