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
app.use('/fax-files', express.static('/tmp/faxfiles'))

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
  
  /*
  if (req.files.fax.mimetype != "application/pdf") {
    return res.status(415).send('Uploaded file doesn\'t look like a PDF.')
  }
  */
  
  const phaxio = new Phaxio(process.env.PHAXIOKEY, process.env.PHAXIOSECRET);
  
  // Create options to send the message
  const options = {
    to: req.body.to,
    //content_url: 'https://' + req.hostname + req.files.fax.tempFilePath.replace('/tmp/faxfiles', '/fax-files')
    file: req.files.fax.tempFilePath
  };

  // Send the message!
  phaxio.faxes.create(options)
  .then(faxObject => {
    console.log(options.file);
    res.redirect('/fax-status?id=' + faxObject.id);
  })
  .catch((err) => {
    console.error(err);
    res.end('oh no, there was a fax sending error! Check the app logs for more information.');
  });
});

app.get("/fax-status", function(req, res) {
  if (!req.query || !req.query.id) {
    return res.status(400).send('Missing fax ID.');
  }
  
  const phaxio = new Phaxio(process.env.PHAXIOKEY, process.env.PHAXIOSECRET);
  
  // check status
  phaxio.faxes.getInfo(req.query.id)
  .then(response => {
    var price = '0¢';
    if (response.data.cost) price = (response.data.cost) + '¢';
    res.type('text/plain; charset=utf-8');
    res.end(response.data.num_pages + ' page(s) submitted ' + response.data.created_at + ' is/are ' + response.data.status + ' costing ' + price + ' (refresh for updates)');
    if (response.status == 'failure') console.error(response);
  })
  .catch((err) => {
    console.error(err);
    res.end('oh no, there was a fax status error! Check the app logs for more information.');
  });
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

