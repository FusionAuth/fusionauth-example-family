const express = require('express');
const router = express.Router();
const {FusionAuthClient} = require('@fusionauth/typescript-client');
const clientId = '78bd26e9-51de-4af8-baf4-914ea5825355';
const clientSecret = '3kkT8wOgidiafpmR-rYp0FyZsocWTGVYBVm_tXeZ_CI';
const client = new FusionAuthClient('SNjNZj8jz4A_5BeL07pF901nwlLxRQ3CK6shpuIFQkg', 'http://localhost:9011');
const consentId = '8d7d3e6e-1f5a-42bc-9f1a-2a9bbdaabd53';

/* GET home page. */
router.get('/', function (req, res, next) {
  let family = [];
  if (req.session.user && req.session.user.id) {

     // build our family object for display
     client.retrieveFamilies(req.session.user.id)
       .then((response) => {
         if (response.response.families && response.response.families.length >= 1) {
           // adults can only belong to one family
           let children = response.response.families[0].members.filter(elem => elem.role != 'Adult');
           let getUsers = children.map(elem => {
             return client.retrieveUser(elem.userId);
           });
           Promise.all(getUsers).then((users) => {
             users.forEach(user => {
               family.push( { "id" : user.response.user.id, "email" : user.response.user.email } );
             });
           }).then(() => {
             let getUserConsentStatuses = children.map(elem => {
               return client.retrieveUserConsents(elem.userId);
             });
             return Promise.all(getUserConsentStatuses);
           }).then((consentsResponseArray) => {
             // for each child, we'll want to get the status of the consent matching our consentId and put that in the family object, for that child.
             const userIdToStatus = {};
             const userIdToUserConsentId = {};
             consentsResponseArray.forEach((oneRes) => { 
               const matchingConsent =  oneRes.response.userConsents.filter( (userConsent) => userConsent.consent.id == consentId)[0];
               if (matchingConsent) {
                 const userId = matchingConsent.userId;
                 userIdToUserConsentId[userId] = matchingConsent.id;
                 userIdToStatus[userId] = matchingConsent.status;
               }
             }); 
             family = family.map((onePerson) => {
               onePerson["status"] = userIdToStatus[onePerson.id];
               onePerson["userConsentId"] = userIdToUserConsentId[onePerson.id];
               return onePerson;
             });
           //}).then(() => {
             res.render('index', {family: family, user: req.session.user, title: 'Family Example'});
           });
         } else {
           res.render('index', {family: family, user: req.session.user, title: 'Family Example'});
         }
      }).catch((err) => {console.log("in error"); console.error(JSON.stringify(err));});
  } else {
    res.render('index', {family: family, user: req.session.user, title: 'Family Example'});
  }
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
  if (!req.session.user) {
    // force signin
    res.redirect(302, '/');
  }
  client.retrievePendingChildren(req.session.user.email)
      .then((response) => {
        res.render('confirmchildren', {children: response.response.users, title: 'Confirm Your Children'});
      }).catch((err) => {console.log("in error"); console.error(JSON.stringify(err));});
});

/* Confirm child action */
router.post('/confirm-child', function (req, res, next) {
  if (!req.session.user) {
    // force signin
    res.redirect(302, '/');
  }
  childEmail = req.body.child;

  if (!childEmail) {
    console.log("No child email provided!");
    res.redirect(302, '/');
  }

  let childUserId = undefined;
  client.retrieveUserByEmail(childEmail)
      .then((response) => {
        childUserId = response.response.user.id;
        return client.retrieveFamilies(req.session.user.id)
      })
      .then((response) => {
        if (response && response.response && response.response.families && response.response.families.length >= 1) {
          // user is already in family
          return response;
        }
        // if no families, create one for them
        const familyRequest = {"familyMember": {"userId": req.session.user.id, "owner" : true, "role": "Adult" }};
        return client.createFamily(null, familyRequest);
      })
      .then((response) => {
        //only expect one
        const familyId = response.response.families[0].id;
        const familyRequest = {"familyMember": {"userId": childUserId, "role": "Child" }}
        return client.addUserToFamily(familyId, familyRequest);
      })
      .then((response) => {
        // capture consent
        const consentRequest = {"userConsent": {"userId": childUserId, "consentId": consentId, "giverUserId" : req.session.user.id }}
        return client.createUserConsent(null, consentRequest);
      })
      .then((response) => {
        // now pull existing children to be confirmed
        client.retrievePendingChildren(req.session.user.email)
      })
      .then((response) => {
        res.redirect(302, '/confirm-child-list');
      }).catch((err) => {console.log("in error"); console.error(JSON.stringify(err));});
});

/* Change consent */
router.post('/change-consent-status', function (req, res, next) {
  if (!req.session.user) {
    // force signin
    res.redirect(302, '/');
  }
  
  const userConsentId = req.body.userConsentId;
  let desiredStatus = req.body.desiredStatus;
  if (desiredStatus != 'Active') {
    desiredStatus = 'Revoked';
  }

  if (!userConsentId) {
    console.log("No userConsentId provided!");
    res.redirect(302, '/');
  }

  const patchBody = { userConsent : { status : desiredStatus } };
  client.patchUserConsent(userConsentId, patchBody)
      .then((response) => {
        res.redirect(302, '/');
      }).catch((err) => {console.log("in error"); console.error(JSON.stringify(err));});
});

module.exports = router;
