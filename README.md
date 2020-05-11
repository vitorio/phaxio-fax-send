# Phaxio fax send

This is a basic system that uses Phaxio's Fax API to send faxes. To set it up for yourself or your own friend group, you'll need an account from Phaxio, which is out of scope of this document.

Once you have a funded Phaxio account, you'll need two codes from the Phaxio console.

Click "Show" to get started!

# Your Project

On the front-end,
* `views/index.html` is the app's UI
* `public/client.js` has the JavaScript to set up International Telephone Input, the phone number validator and formatter
* `public/style.css` has the page styling
* `views/setup.html` and `public/setup.js` are for the setup helper flow.

On the back-end,
* `server.js` is run when the project starts
* `package.json` contains the app's dependencies
* `.env` contains variables custom to the app we don't want other users to see

# Security/Privacy

Uploaded faxes are stored in Glitch's `/tmp` storage, which is deleted soon after the application spins down.  Uploaded faxes are given temporary, generated filenames.

The uploaded faxes are submitted directly to Phaxio and cannot be requested externally.  Phaxio is set to not store sent faxes, although metadata about the send is kept indefinitely.

# Alternatives

Most online fax tools with free trials either don't allow you to send faxes, or limit your total number of pages.  Most want monthly subscriptions rather than offer pay-as-you-go.

# More Info

* [Glitch Twilio fax send](https://glitch.com/~xoxo-fax-send)
* [International Telephone Input library](https://intl-tel-input.com)
* [Emoji Favicon generator](https://favicon.io/emoji-favicons/)

Made with [Glitch](https://glitch.com) and [Phaxio](https://www.phaxio.com) by [Vitorio](http://vitor.io).
