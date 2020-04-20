// init project
const express = require("express");

const multer  = require('multer')
const tmpDir = '/tmp/image-resize'
const upload = multer({ dest: tmpDir })

const mimetype = {
  'image/png'  : 'png',
  'image/jpeg' : 'jpg',
}

const app = express();
const Twilio = require("twilio");

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

app.get("/", function(req, res) {
  // show the setup page if the env isn't configured
  if (process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_PHONE_NUMBER &&
      process.env.YOUR_PHONE_NUMBER &&
      process.env.TWILIO_AUTH_TOKEN &&
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
    "your-phone": !!process.env.YOUR_PHONE_NUMBER,
    "secret": !!process.env.SECRET,
    "credentials": !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    "twilio-phone": !!process.env.TWILIO_PHONE_NUMBER
  });
});

app.post("/", upload.single('image'), (req, res, next) => {
  // check to see if we support this filetype
  if ( !(req.file.mimetype in mimetype) ) {
    return res.sendStatus(400)
  }

  const ext = mimetype[req.file.mimetype]
  const filename = req.file.path
  const outfile = req.file.path + '.' + ext

  // check width and height
  const width  = req.body.width|0
  const height = req.body.height|0
  
  // if we have both a width and height, then resize independent of original dimensions
  // else use one 
  if ( width && height ) {
    
  }
  else if ( width ) {
    if ( width < 1 || width > 1280 ) {
      return res.status(403).send('Width must be between 1 and 1280.')
    }
    
  }
  else if ( height ) {
    if ( height < 1 || height > 1280 ) {
      return res.status(403).send('Height must be between 1 and 1280.')
    }
    
  }
  else {
     // nothing, so return an error 
    return res.status(403).send('Provide one of width or height or both.')
  }

  // console.log('file:', req.file)

  sharp(req.file.path)
    .rotate()
    .resize(width || null, height || null)
    .toFile(outfile)
    .then(() => {
      res.sendFile(outfile, (err) => {
        setTimeout(() => {
          fs.unlink(filename, (err) => console.log)
        }, 5 * 1000)
        if (err) return next(err)
        console.log('Sent:', outfile)
        setTimeout(() => {
          fs.unlink(outfile, (err) => console.log)
        }, 5 * 1000)
      })
    })
    .catch(err => {
      setTimeout(() => {
        fs.unlink(filename, (err) => console.log)
      }, 5 * 1000)
      next(err) 
     })
  ;
})

app.post("/mms", function(req, res) {
   if (!req.body.secret || req.body.secret !== process.env.SECRET) {
    res.status(403);
    res.end('incorrect secret!');
    return;
  }

  const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  // Create options to send the message
  const options = {
    to: process.env.YOUR_PHONE_NUMBER,
    from: process.env.TWILIO_PHONE_NUMBER,
    mediaUrl: [req.body.media || 'https://demo.twilio.com/owl.png'],
    body: req.body.message || 'hoot!'
  };

  // Send the message!
  client.messages.create(options, function(err, response) {
    if (err) {
      console.error(err);
      res.end('oh no, there was an error! Check the app logs for more information.');
    } else {
      console.log('success!');
      res.end('successfully sent your message! check your device');
    }
  });
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
