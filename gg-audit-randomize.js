'use strict'
let _ = require('lodash')
let faker = require('faker')
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
let operationTypes = [
  'harvest',
  'packinghouse',
  'cold storage',
  'growing',
  'handling'
]

function randomOrganization() {
  let name = faker.name.firstName()+' '+faker.name.lastName()
  let randOrg = {
    name: name.split(' ')[1]+' Produce',
    contacts: [
      { name: name }
    ],
    location: {
      address: faker.address.streetAddress(),
      city: faker.address.city(), 
      state: faker.address.state(),
      country: "USA",
      description: "(All sites in same area), Pesticide storage",
    },
    organizationid: {
      id: Math.round(Math.random()*1000000000).toString(),
      id_source: "scheme",
      otherids: [
        { id_source: 'certifying_body', id: Math.round(Math.random()*10000000).toString() },
      ],
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
  let scope = {
    notification: (Math.random() >= 0.5) ? 'announced' : 'unannounced',
    description: "",
    operations: [
      { operation_type: operation } ,
    ],
    parallel_ownership: Math.random() >= 0.5,
    parallel_production: Math.random() >= 0.5,
  }
  scope.products_observed = [randomProductObserved(operation, product)],
  scope.product_sites = [randomProductionSite(product, (parseInt(scope.products_observed.first_area) + parseInt(scope.products_observed.further_area)).toString())]
}

function randomProductObserved(operation_type, product) {
  let productObserved = {
    name: product,
    first_area: { value: (Math.round(Math.random()*100)).toString(), units: 'acres' },
    further_area: { value: (Math.round(Math.random()*100)).toString(), units: 'acres' },
    operations: [
      { operation_type: operation_type}
    ],
  }
  if (productObserved.operations[0].operation_type === 'growing') {
    productObserved.operations[0].covering_type = (Math.random() >= 0.5) ? 'covered' : 'uncovered'
  }
  return productObserved;
}

function randomProductionSite(product, area) {
  return {
    name: `The Big  ${product} Ranch`,
    id: (Math.round(Math.random()*10000)).toString(),
    products_observed: [ {
      name: product,
      organic: (Math.random() >= 0.5),
      area: { value: area, units: 'acres' }, 
      location: {
        description: 'down the road and hang a left',
        city: '',
      }
    }],
  }
}

function randomProducts(numProducts) {
  var randProducts = []
  while(randProducts.length < numProducts){
    var randomProduct = products[Math.floor(Math.random() * products.length)]
    if(randProducts.indexOf(randomProduct) > -1) continue;
    randProducts[randProducts.length] = randomProduct
  }
  return randProducts
}

function randomOperationTypes(numOperations) {
  return operationTypes.slice(0, numOperations)
}

function generateAudit(exampleAudit, organization, auditor, scope, year, minimizeAuditData) {
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
  auditOut.conditions_during_audit = { 
    operation_observed_date: new Date(randDateMs).toJSON(),
    duration: { value: (Math.round(Math.random()*5) + 1).toString(), units: 'hours', },
  }

  // Setup audit score object
  auditOut.score = {
    globalgap_levels: {
      major_musts: {
        yes: { value: 0, units: 'count' },
        no: { value: 0, units: 'count' },
        n_a: { value: 0, units: 'count' },
        is_compliant: true,
      },
      minor_musts: {
        yes: { value: 0, units: 'count' },
        no: { value: 0, units: 'count' },
        n_a: { value: 0, units: 'count' },
        is_compliant: true,
        value: 0, 
        units: '%',
      },
    },
    is_compliant: true,
  }

  //TODO: Make the score actually computable
  // Randomize control point scores
  Object.keys(auditOut.control_points).forEach((cp, i) => {
    if (auditOut.control_points[cp].globalgap_level === 'major_must') {
      if (auditOut.control_points[cp].score.value === 'n_a') {
        auditOut.score.globalgap_levels.major_musts.n_a.value++;
      } else {
        auditOut.control_points[cp].score.value = (Math.random() >= 0.002) ? 'yes' : 'no';
        (auditOut.control_points[cp].score.value === 'yes') ? 
        auditOut.score.globalgap_levels.major_musts.yes.value++ :
        auditOut.score.globalgap_levels.major_musts.no.value++;
      }
    } else {
      if (auditOut.control_points[cp].score.value === 'n_a') {
        auditOut.score.globalgap_levels.minor_musts.n_a.value++;
      } else {
        auditOut.control_points[cp].score.value = (Math.random() >= 0.04) ? 'yes' : 'no';
        (auditOut.control_points[cp].score.value === 'yes') ? 
        auditOut.score.globalgap_levels.minor_musts.yes.value++ :
        auditOut.score.globalgap_levels.minor_musts.no.value++;
      }
    }
  })


  if (minimizeAuditData) {
    auditOut = removeSectionsRecursive(auditOut)
    auditOut = minimizeControlPoints(auditOut)
  }


  // Compute final score
  auditOut.score.globalgap_levels.major_musts.is_compliant = (auditOut.score.globalgap_levels.major_musts.no.value < 1);
  auditOut.score.globalgap_levels.minor_musts.value = auditOut.score.globalgap_levels.minor_musts.yes.value/(auditOut.score.globalgap_levels.minor_musts.yes.value + auditOut.score.globalgap_levels.minor_musts.no.value)
  auditOut.score.globalgap_levels.minor_musts.is_compliant = auditOut.score.globalgap_levels.minor_musts.value >= 0.95; 
  auditOut.score.is_compliant = auditOut.score.globalgap_levels.major_musts.is_compliant && auditOut.score.globalgap_levels.minor_musts.is_compliant

  // Convert to strings!
  auditOut.score.globalgap_levels.major_musts.yes.value = auditOut.score.globalgap_levels.major_musts.yes.value.toString()
  auditOut.score.globalgap_levels.major_musts.no.value = auditOut.score.globalgap_levels.major_musts.no.value.toString()
  auditOut.score.globalgap_levels.major_musts.n_a.value = auditOut.score.globalgap_levels.major_musts.n_a.value.toString()
  auditOut.score.globalgap_levels.major_musts.is_compliant = auditOut.score.globalgap_levels.major_musts.is_compliant.toString();

  auditOut.score.globalgap_levels.minor_musts.yes.value = auditOut.score.globalgap_levels.minor_musts.yes.value.toString()
  auditOut.score.globalgap_levels.minor_musts.no.value = auditOut.score.globalgap_levels.minor_musts.no.value.toString()
  auditOut.score.globalgap_levels.minor_musts.n_a.value = auditOut.score.globalgap_levels.minor_musts.n_a.value.toString()
  auditOut.score.globalgap_levels.minor_musts.value = auditOut.score.globalgap_levels.minor_musts.value.toString()
  auditOut.score.globalgap_levels.minor_musts.is_compliant = auditOut.score.globalgap_levels.minor_musts.is_compliant.toString();

  auditOut.score.is_compliant = auditOut.score.is_compliant.toString();
  return auditOut
}

function removeSectionsRecursive(data) {
  if (data.sections) {
    data.sections = data.sections.map((section) => {
      return removeSectionsRecursive(section)
    })
  } else if (data.control_pointids) {
    delete data.control_pointids
  }
  if (data.name) delete data.name
  return data
}

function minimizeControlPoints(audit) {
  Object.keys(audit.control_points).forEach((cp) => {
    if (audit.control_points[cp].name) delete audit.control_points[cp].name
    if (audit.control_points[cp].question_name) delete audit.control_points[cp].question_name
    if (audit.control_points[cp].criteria) delete audit.control_points[cp].criteria
  })
  return audit
}

module.exports = {
  generateAudit,
  randomProducts,
  randomScope,
  randomOrganization,
  randomAuditor,
  randomOperationTypes,
}
