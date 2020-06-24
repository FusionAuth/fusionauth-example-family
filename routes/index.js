const express = require('express');
const router = express.Router();
const {FusionAuthClient} = require('@fusionauth/typescript-client');
const clientId = '78bd26e9-51de-4af8-baf4-914ea5825355';
const clientSecret = '3kkT8wOgidiafpmR-rYp0FyZsocWTGVYBVm_tXeZ_CI';
const client = new FusionAuthClient('SNjNZj8jz4A_5BeL07pF901nwlLxRQ3CK6shpuIFQkg', 'http://localhost:9011');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {user: req.session.user, title: 'FusionAuth Example'});
});

/* OAuth return from FusionAuth */
router.get('/oauth-redirect', function (req, res, next) {
  // This code stores the user in a server-side session
  client.exchangeOAuthCodeForAccessToken(req.query.code,
                                         clientId,
                                         clientSecret,
                                         'http://localhost:3000/oauth-redirect')
      .then((response) => {
        req.session.state = req.query.state;
        return client.retrieveUserUsingJWT(response.response.access_token);
      })
      .then((response) => {
        req.session.user = response.response.user;
      })
      .then((response) => {
        if (req.session.state == "confirm-child") {
          res.redirect(302, '/confirm-child');
          return
        }
        res.redirect(302, '/');
     
      }).catch((err) => {console.log("in error"); console.error(JSON.stringify(err));});
      
});

/* Confirm child flow */
router.get('/confirm-child', function (req, res, next) {
  /*
if (!req.session.user) {
    // force signin
    req.session.child= req.query.child;
    res.redirect(302, '/');
  }
 */
  const childEmail = req.query.child;
  if (childEmail === '') {
    childEmail = req.session.child;
  }
  console.log(childEmail);
  console.log(req.session.user.email);
  
  client.retrievePendingChildren(req.session.user.email)
      .then((response) => {
        return client.retrieveFamilies(req.session.user.id);
      })
      .then((response) => {
        // if no families, create one for them
        return client.retrieveFamilies(req.session.user.id);
      })
      .then((response) => {
        console.log("here");
        console.log(response);
        console.log(response.response);
        console.log(response.response.users);
        res.render('confirmchildren', {children: response.response.users, title: 'FusionAuth Confirm Children'});
      }).catch((err) => {console.log("in error"); console.error(JSON.stringify(err));});
});


module.exports = router;
