'use strict'
let _ = require('lodash')
let faker = require('faker')

function randomOrganization() {
  let name = faker.name.firstName()+' '+faker.name.lastName()
  let randOrg = {
    name: name+' Produce',
    contacts: [
      { name: name }
    ],
    location: {
      address: faker.address.streetAddress(),
      city: faker.address.city(), 
      state: faker.address.state(),
      postal_code: faker.address.zipCode(),
      country: "USA",
    },
    phone: Math.floor(Math.random() * 1000000000).toString(),
    organizationid: {
      id: 'PA-PGFS-' + Math.round(Math.random()*1000).toString()+'-'+Math.round(Math.random()*1000).toString(),
      id_source: "certifying_body",
    }
  }
  return randOrg
}

function randomAuditor() {
  return {
    name: faker.name.firstName() +' '+ faker.name.lastName(),
  }
}

function randomScope(organization, product, operation) {
  return {
    description: "Harvest crew audit of GFS activities, personnel, sanitation, crop area, "
                +"tools, etc. were observed and applicable documents.They were observed approx.10 "
                +"people in the activity.",
    operation_type: {
      type: operation,
      operator: { // the harvest crew
        contacts: [
          { name: organization.contacts[0].name }
        ],
        name: organization.contacts[0].name+" Produce - Linked to Greenhouse "+organization.name,
      },
      // Open question: does shipper belong inside the harvest crew,  or as it's own thing at same level as "crew"
      shipper: { name: organization.contacts[0].name+"'s Happy"+product },
      location: {
        address: faker.address.streetAddress(),
        city: faker.address.city(), 
        state: faker.address.state(),
        postal_code: faker.address.zipCode(),
        country: "USA",
      }
    },
    products_observed : [
      { name: product },
    ],
    similar_products_not_observed: [
      { name: "" },
    ],
    products_applied_for_but_not_observed: [ ], // empty array, or just leave the key off if none
  }
}

function randomProducts(numProducts) {
  let products = [
    'Carrots',
    'Strawberries',
    'Blueberries',
    'Pineapples',
    'Romaine Lettuce',
    'Green Bell Peppers',
    'Tomatoes',
    'Raspberries',
    'Beets',
    'Jalepeno Peppers',
    'Cucumbers',
    'Cherries',
    'Bananas',
    'Cabbage',
    'Broccoli',
    'Celery',
    'Spinach',
  ]
    
  var randProducts = []
  while(randProducts.length < numProducts){
    var randomProduct = products[Math.ceil(Math.random()*products.length-1)]
    if(randProducts.indexOf(randomProduct) > -1) continue;
    randProducts[randProducts.length] = randomProduct
  }
  return randProducts
}


function generateAudit(exampleAudit, organization, auditor, scope, year, minimizeSectionData) {
  let auditOut = _.cloneDeep(exampleAudit)

// Randomize certificationid 
  let certid = Math.round(Math.random() * 10000).toString()
  let certNum = Math.round(Math.random() * 7).toString()
  auditOut.certificationid = certid + ' - Cert: '+certNum

//Modify auditor name
  auditOut.certifying_body.auditor = auditor
  
// Modify the organization with random info
  auditOut.organization = organization

//Modify scope with random info
  auditOut.scope = scope

//Modify scope with random info
  let randDateMs = new Date(Math.round(Math.random() * Date.now())).setFullYear(year)
  auditOut.conditions_during_audit.FSMS_observed_date = {
    start: new Date(randDateMs).toJSON(),
    end: new Date(randDateMs + 1000*60*60).toJSON() //finished in one hour
  }
  auditOut.conditions_during_audit.operation_observed_date = {
    start: new Date(randDateMs + 1000*60*60).toJSON(), //started after they finished FSMS
    end: new Date(randDateMs + 4*1000*60*60).toJSON() // finished 4 hours later
  }

  if (minimizeSectionData) {
    auditOut = removeSectionRecursive(auditOut)
  }

  // Randomize control point scores
  Object.keys(auditOut.control_points).forEach((cp, i) => {

    if (auditOut.control_points[cp].score.units.indexOf('points')) {
      auditOut.control_points[cp].score.value = Math.round(Math.random() * praseInt(auditOut.control_points[cp].score.possible.value)).toString()
    }
    // TODO: fix the 'compliance' key to match the score, e.g., 2/3 points is "Minor Deficiency"
  })
  return auditOut
}

function removeSectionRecursive(data) {
  if (data.control_pointids) {
    delete data.control_pointids
  }
  if (data.sections) {
    data.sections.map((sec) => {
      return removeSectionRecursive(sec)
    })
  }
  return data
}

module.exports = {
  generateAudit,
  randomProducts,
  randomScope,
  randomOrganization,
  randomAuditor,
}
