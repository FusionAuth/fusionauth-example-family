# FusionAuth Family API example

This project is an example Node.js application that illustrates how to leverage the FusionAuth family API.
This application will use an OAuth Authorization Code workflow and the PKCE extension to log users in. PKCE stands for Proof Key for Code Exchange, and is often pronounced “pixie”.

## To run

This assumes you already have a running FusionAuth instance, user and application running locally. If you don't, please see the [5-Minute Setup Guide](https://fusionauth.io/docs/v1/tech/5-minute-setup-guide) to do so.

* update your FusionAuth application to allow a redirect of `http://localhost:3000/oauth-redirect`
* Create a parent user and a child user that is associated with the parent email. See the family guide for more information.
* Create a consent in the FusionAuth admin screen. "Settings" -> "Consents". 
* `npm install`
* update `routes/index.js` with your API key
* update `routes/index.js`, `views/index.pug` and `confirmchildren.pug` with the client id of your FusionAuth application.
* update `routes/index.js` with your client secret and consent id.
* `npm start`

Go to http://localhost:3000/ and login with the previously created parent user. You should now see a list of any children you must approve. Approve them and you can see them on the home page. You'll then be able to grant or revoke the consent for that child.

## TODO

Handle registration as well as login of the parent.
