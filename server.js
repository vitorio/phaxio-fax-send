// init project
const express = require("express");
const app = express();
const Twilio = require("twilio");

// http://expressjs.com/en/starter/static-files.html
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(function (req, res, next) {
  console.log(req.method, req.url);
  next();
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  if (process.env.TWILIO_ACCOUNT_SID) {
    response.sendFile(__dirname + "/views/index.html");
  } else {
    response.sendFile(__dirname + "/views/setup.html");
  }
});

app.get("/setup-status", function (req, res) {
  res.json({
    "your-phone": !!process.env.YOUR_PHONE_NUMBER,
    "secret": !!process.env.SECRET,
    "credentials": !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    "twilio-number": !!process.env.TWILIO_PHONE_NUMBER
  });
});

app.post("/sms", function(req, res) {
  if (!req.body.secret) {
    res.redirect('/');
    return;
  }
  
  if (req.body.secret !== process.env.SECRET) {
    res.status(403);
    res.end('incorrect secret!');
    return;
  }
  const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  // Create options to send the message
  const options = {
    to: process.env.YOUR_PHONE_NUMBER,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: `boop!`
  };

  // Send the message!
  client.messages.create(options, function(err, response) {
    if (err) {
      console.error(err);
      res.end('oh no');
    } else {
      console.log('success!');
      res.end('yesss');
    }
  });
});

app.post("/mms", function(req, res) {
  if (!req.body.secret) {
    res.redirect('/');
    return;
  }
  
  if (req.body.secret !== process.env.SECRET) {
    res.status(403);
    res.end('incorrect secret!');
    return;
  }
  const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  // Create options to send the message
  const options = {
    to: process.env.YOUR_PHONE_NUMBER,
    from: process.env.TWILIO_PHONE_NUMBER,
    mediaUrl: ['https://demo.twilio.com/owl.png'],
    body: `hoot!`
  };

  // Send the message!
  client.messages.create(options, function(err, response) {
    if (err) {
      console.error(err);
      res.end('oh no');
    } else {
      console.log('success!');
      res.end('success!');
    }
  });
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
