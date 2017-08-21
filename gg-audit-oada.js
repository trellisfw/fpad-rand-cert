'use strict'
let uuid = require('uuid')
let randAudits = require('./generateGGAudit.js')
let exampleAudit = require('./GlobalGAP_FullAudit.js')
let Promise = require('bluebird')
let agent = require('superagent-promise')(require('superagent'), Promise);

var numOrganizations = parseInt(process.argv[2]);
var numAuditors = parseInt(process.argv[3]);
var numProducts = parseInt(process.argv[4]);
var numYears = parseInt(process.argv[5]);
var numOperations = parseInt(process.argv[6]);
var minimizeAudit = process.argv[7];

//Convert and upload data from yield_data_directory to the OADA server
function generateAudits(numOrganizations, numAuditors, numProducts, numYears) {
  let organizations = [] 
  for(var i = 0; i < numAuditors; i++) {
    organizations.push(randAudits.randomOrganization())
  }
  let auditors = []
  for(var i = 0; i < numAuditors; i++) {
    auditors.push(randAudits.randomAuditor())
  }
  let products = randAudits.randomProducts(numProducts)
  let now = new Date().getFullYear()
  console.log(now)
  let years = []
  for (var i = 0; i < numYears; i++ ) {
    years.push(2017-i)
  }
  let operations = randAudits.randomOperationTypes(numOperations)

  let audits = [];
  let iii = 1;

  return Promise.map(organizations, (org) => {
    let orgid = uuid.v4()
    return Promise.map(auditors, (aud) => {
      return Promise.map(products, (prod) => {
        return Promise.map(years, (yr) => {
          return Promise.map(operations, (op) => {
            console.log(iii++)
            let scope = randAudits.randomScope(org, prod, op)
            let audit = randAudits.generateAudit(exampleAudit, org, aud, scope, yr, minimizeAudit)
            return agent('PUT', 'https://api.oada-dev.com/bookmarks/fpad/certifications/id-index')
            .set('Authorization', 'Bearer '+ 'Oe33rwODi6hw8b_HXxFYsZxGJKZn9YwvfURFBWT
            .send({ })  
            .end()
            .then((response) => {
              console.log(response)
              return agent('PUT', 'https://api.oada-dev.com/bookmarks/fpad/certifications/id-index')
              .set('Authorization', 'Bearer '+ 'Oe33rwODi6hw8b_HXxFYsZxGJKZn9YwvfURFBWT
              .send({
                _id: 'resources/'+uuid.v4(),
                _rev: '0-0'
              })  
              .end()
            })           
          }, {concurrency: 1})
        }, {concurrency: 1})
      }, {concurrency: 5})
    }, {concurrency: 5})
  }, {concurrency: 10})
}
