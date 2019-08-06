// server.js
// where your node app starts

// init project
const express = require("express");
const app = express();
const Twilio = require("twilio");

const cfg = {
  port: process.env.PORT || 3000,
  secret: process.env.APP_SECRET || "keyboard cat",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER
};

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/boop", function(req, res, next) {
  const client = new Twilio(cfg.twilioAccountSid, cfg.twilioAuthToken);

  // Create options to send the message
  const options = {
    to: cfg.myPhoneNumber,
    from: cfg.twilioPhoneNumber,
    body: `boop!`
  };

  // Send the message!
  client.messages.create(options, function(err, response) {
    if (err) {
      // Just log it for now
      console.error(err);
      res.end('oh no');
    } else {
      console.log('success!');
      res.end('yesss');
    }
  });
});


// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
