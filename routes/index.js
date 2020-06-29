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
        if (req.session.state == "confirm-child-list") {
          res.redirect(302, '/confirm-child-list');
          return
        }
        res.redirect(302, '/');
     
      }).catch((err) => {console.log("in error"); console.error(JSON.stringify(err));});
      
});

/* Confirm child list flow */
router.get('/confirm-child-list', function (req, res, next) {
  /*
if (!req.session.user) {
    // force signin
    req.session.child = req.query.child;
    res.redirect(302, '/');
  }
 */
  client.retrievePendingChildren(req.session.user.email)
      .then((response) => {
        res.render('confirmchildren', {children: response.response.users, title: 'FusionAuth Confirm Children'});
      }).catch((err) => {console.log("in error"); console.error(JSON.stringify(err));});
});

/* Confirm child flow */
router.post('/confirm-child', function (req, res, next) {
  /*
if (!req.session.user) {
    // force signin
    req.session.child = req.query.child;
    res.redirect(302, '/');
  }
 */
  childEmail = req.body.child;

  if (!childEmail) {
    console.log("No child email provided!");
    res.redirect(302, '/');
  }

  console.log("here1");
  let childUserId = undefined;
  client.retrieveUserByEmail(childEmail)
      .then((response) => {
  console.log("here2");
        console.log(response);
        console.log(response.response.user);
        childUserId = response.response.user.id;
        return client.retrieveFamilies(req.session.user.id)
      })
      .then((response) => {
        console.log(response);
        if (response && response.response && response.response.families && response.response.families.length >= 1) {
          // user is already in family
          return response;
        }
  console.log("here4");
        // if no families, create one for them
        const familyRequest = {"familyMember": {"userId": req.session.user.id, "owner" : true, "role": "Adult" }};
        return client.createFamily(null, familyRequest);
      })
      .then((response) => {
  console.log("here5");
        //only expect one
        const familyId = response.response.families[0].id;
        console.log(familyId);
        console.log(childUserId);
        const familyRequest = {"familyMember": {"userId": childUserId, "role": "Child" }}
        console.log("family request when adding child: ");
        console.log(familyRequest);
        return client.addUserToFamily(familyId, familyRequest);
      })
      .then((response) => {
  console.log("here6");
        // now pull existing children to be confirmed
        client.retrievePendingChildren(req.session.user.email)
      })
      .then((response) => {
        console.log("here7");
        res.redirect(302, '/confirm-child-list');
      }).catch((err) => {console.log("in error"); console.error(JSON.stringify(err));});
});

module.exports = router;
