# FusionAuth Family API example

This project is an example Node.js application that illustrates how to leverage the FusionAuth family API.

## To run

This assumes you already have a running FusionAuth instance, user and application running locally. If you don't, please see the [5-Minute Setup Guide](https://fusionauth.io/docs/v1/tech/5-minute-setup-guide) to do so.

* update your FusionAuth application to allow a redirect of `http://localhost:3000/oauth-redirect`
* Create a parent user and a child user that is associated with the parent email. See the family guide for more information.
* Create a consent in the FusionAuth admin screen. "Settings" -> "Consents". 
* `npm install`
* update `routes/index.js` and `views/index.pug` with the client id of your FusionAuth application.
* update `routes/index.js` with your client secret and consent id.
* `npm start`

Go to http://localhost:3000/ and login with the previously created parent user TODO. You should now see a list of any children you must approved. Approve them and you can see them on the home page.

## TODO

Handle registration as well as login of the parent.
