// init project
const express = require("express");
const app = express();
const Twilio = require("twilio");

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/sms/:secret", function(req, res, next) {
  if (req.params.secret !== process.env.SECRET) {
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

// https://cdn.glitch.com/6f4fae79-2dd2-46da-996b-fd5b029d3171%2Ffish-image.png?v=1565068857990
/* 
client.messages
      .create({
         body: 'Hello there!',
         from: '+15555555555',
         mediaUrl: ['https://demo.twilio.com/owl.png'],
         to: '+12316851234'
       })
      .then(message => console.log(message.sid));*/

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
