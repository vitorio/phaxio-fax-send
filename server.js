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

// Twilio.webhook() doesn't seem to properly validate fax GET requests, so doing them by hand
app.use('/fax-files', function(req, res, next) {
  var url = 'https://' + req.hostname + req.originalUrl;
  var sig = crypto.createHmac('sha1', process.env.TWILIO_AUTH_TOKEN).update(Buffer.from(url, 'utf-8')).digest('base64');
  
  if (req.header('X-Twilio-Signature') !== sig) {
    console.error(url + ' requested without Twilio sig');
    return res.status(403).send('File requested without Twilio signature.');
  }

  next();
});
app.use('/fax-files', express.static('/tmp/faxfiles'))

app.get("/", function(req, res) {
  // show the setup page if the env isn't configured
  if (process.env.PHAXIOKEY &&
      process.env.PHAXIOSECRET &&
      process.env.PHAXIOTOKEN &&
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
    "credentials": !!(process.env.PHAXIOKEY && process.env.PHAXIOSECRET && process.env.PHAXIOTOKEN)
  });
});

app.post("/send-fax", function(req, res) {
  if (!req.body.secret || req.body.secret !== process.env.SECRET) {
    return res.status(403).send('Incorrect password.');
  }
  
  if (!req.files || !req.files.fax) {
    return res.status(400).send('No PDF was uploaded.');
  }
  
  if (!req.body.to) {
    return res.status(400).send('No destination phone number was provided.');
  }
  
  if (req.body.quality !== "standard" && req.body.quality !== "fine" && req.body.quality !== "superfine") {
    return res.status(400).send('Invalid quality.');
  }  

  if (req.files.fax.mimetype != "application/pdf") {
    return res.status(415).send('Uploaded file doesn\'t look like a PDF.')
  }
  
  const phaxio = new Phaxio(process.env.PHAXIOKEY, process.env.PHAXIOSECRET);
  
  // Create options to send the message
  const options = {
    to: req.body.to,
    from: process.env.TWILIO_PHONE_NUMBER,
    mediaUrl: 'https://' + req.hostname + req.files.fax.tempFilePath.replace('/tmp/faxfiles', '/fax-files'),
    quality: req.body.quality,
    storeMedia: false
  };

  // Send the message!
  client.fax.faxes.create(options, function(err, response) {
    if (err) {
      console.error(err);
      res.end('oh no, there was a fax sending error! Check the app logs for more information.');
    } else {
      console.log(options.mediaUrl);
      res.redirect('/fax-status?id=' + response.sid);
    }
  });
});

app.get("/fax-status", function(req, res) {
  if (!req.query || !req.query.id) {
    return res.status(400).send('Missing fax ID.');
  }
  
  const phaxio = new Phaxio(process.env.PHAXIOKEY, process.env.PHAXIOSECRET);
  
  // check status
  client.fax.faxes(req.query.id).fetch(function(err, response) {
    if (err) {
      console.error(err);
      res.end('oh no, there was a fax status error! Check the app logs for more information.');
    } else {
      var price = '$0.00';
      if (response.price) price = '$' + (response.price * -1.0);
      res.end(response.numPages + ' page(s) submitted ' + response.dateCreated + ' is/are ' + response.status + ' in ' + response.quality + ' quality costing ' + price + ' (refresh for updates)');
      if (response.status == 'failed') console.error(response);
    }
  });
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

