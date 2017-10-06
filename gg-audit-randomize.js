'use strict'
let lodash = require('lodash')
let faker = require('faker')
let certifyingBodies = [
	'SCS Global Services',
	'Primus Ops',
	'AbcAudits',
]
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
let farmNames = [
	'Produce',
	'Farms',
	'Brothers Farms',
	'Family Farms',
	'Bountiful Harvest',
	'Farms, LLC',
]

function randomLocation(data) {
	return {
		address: data.address || faker.address.streetAddress(),
    city: data.city || faker.address.city(), 
    state: data.state || faker.address.state(),
    country: data.country || "USA",
    description: data.description || "(All sites in same area), Pesticide storage",
  }
}

function randomOrganization(data) {
  let name = data.name || faker.name.firstName()+' '+faker.name.lastName()
	// TODO: currently making up a last name. 
	if (name.split(' ').length === 1) name = name+' '+faker.name.lastName();
  return {
    name: name.split(' ')[1]+' '+farmNames[Math.round(Math.random()*farmNames.length-1)],
    contacts: [
      { name: name }
    ],
    location: randomLocation(data.location || {}),
		//TODO: didn't have time.  let this be optional
		organizationid: data.organizationid || {
      id: Math.round(Math.random()*1000000000).toString(),
      id_source: "scheme",
      otherids: [
        { id_source: 'certifying_body', id: Math.round(Math.random()*10000000).toString() },
      ],
    }
  }
}

function randomCertifyingBody(data) {
	return {
		name: data.name || certifyingBodies[Math.round(Math.random()*certifyingBodies.length-1)],
		auditor: randomAuditor(data.auditor || {})
	}
}

function randomAuditor(data) {
  return {
    name: data.name || faker.name.firstName() +' '+ faker.name.lastName(),
  }
}

function randomScope(data) {
  let scope = {
    notification: data.notification || (Math.random() >= 0.5) ? 'announced' : 'unannounced',
    description: data.description || "",
    operations: data.operations || [
      { operation_type: randomOperation() } ,
    ],
    parallel_ownership: data.parallel_ownership || Math.random() >= 0.5,
    parallel_production: data.parallel_ownership || Math.random() >= 0.5,
  }
  scope.products_observed = randomProductsObserved(data.products_observed || []),
	// This one is a bit tricky because it should have the same products_observed as listed above. 
  scope.product_sites = randomProductionSites(data.product_sites || [randomProductionSite({ 
		products_observed: scope.products_observed, 
		area: { 
			// TODO: might crash if further_area is undefined
			value: (parseInt(scope.products_observed[0].first_area) + parseInt(scope.products_observed[0].further_area)).toString(),
			units: scope.products_observed[0].first_area.units
		}
	})])
  return scope
}

// Since the audit expects a plural array of products, this lets an array of 
// "half-finished" products get passed in and each finished, randomly
function randomProductsObserved(data) {
	let products_observed = []
	data.forEach((product_observed, i) => {
		products_observed[i] = randomProductObserved(product_observed)
	})
	if (products_observed.length < 1) products_observed[0] = randomProductObserved({})
	return products_observed
}

function randomProductObserved(data) {
  let productObserved = {
    name: data.name || randomProducts(1)[0],
    first_area: data.first_area || { value: (Math.round(Math.random()*100)).toString(), units: 'acres' },
    further_area: data.further_area || { value: (Math.round(Math.random()*100)).toString(), units: 'acres' },
    operations: data.operations || [
      { operation_type: randomOperation() }
    ],
  }
	productObserved.operations.forEach((op, i) => {
		if (productObserved.operations[i].operation_type === 'growing') {
		//TODO: a bit difficult to provide optional control to this. Its up to the user when they specify a 'growing' operationn
			productObserved.operations[i].covering_type = (Math.random() >= 0.5) ? 'covered' : 'uncovered'
		}
  })
  return productObserved;
}

/* Unfinished because unnecessary as long as theres only one key
function randomOperations() {
  let ops = []
	data.forEach((operation, i) => {
		ops[i] = randomOperation
	})
}
*/

function randomOperation() {
	return operationTypes[Math.round(Math.random()*operationTypes.length-1)]
}

function randomProductionSites(data) {
	let sites = [];
	data.forEach((site, i) => {
		sites[i] = randomProductionSite(site);
	})
	// This line may not be necessary given the code from randomScope guarantees 
	// there is always 1 item, but this function can be called by itself with an 
	// empty array.
	if (sites.length < 1) sites[0] = randomProductionSite({})
	return sites
}

function randomProductionSite(data) {
	let site = {
    name: data.name || `The Big ${data.products_observed[0].name} Ranch`,
    id: data.id || (Math.round(Math.random()*10000)).toString(),
    products_observed: randomProductsObserved(data.products_observed || []),
  }
	// The products_observed key in production sites two new keys: location and organic
	site.products_observed.forEach((prod, i) => {
		site.products_observed[i].organic = site.products_observed[i].organic || (Math.random() >= 0.5);
		site.products_observed[i].location = site.products_observed[i].location ||  {
			description: 'down the road and hang a left',
			city: '',
		}
	})
	return site;
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

// Past 10 years by default; TODO: set date range
function randomYear() {
	return Math.round(Math.random()*10) + (new Date().getFullYear() - 10);
}


// Generate a random audit
function generateAudit(data) {
	//TODO: the whole idea of a "template" is unnecessary
	if (!data.template) return new Error('\"template\" field required with example audit')
  let auditOut = lodash.cloneDeep(data.template)

// Randomize certificationid 
  let certid = data.certid || Math.round(Math.random() * 10000).toString()
  let certNum = data.certNum || Math.round(Math.random() * 7).toString()
  auditOut.certificationid = data.certificationid || certid + ' - Cert: '+certNum

//Modify auditor name
  auditOut.certifying_body = randomCertifyingBody(data.certifying_body || {});
  
// Modify the organization with random info
  auditOut.organization =  this.randomOrganization(data.organization || {});

//Modify scope with random info
  auditOut.scope = this.randomScope(data.scope || {})

//Modify scope with random info
  let randDateMs = new Date(Math.round(Math.random() * Date.now())).setFullYear(data.year || randomYear())
  auditOut.conditions_during_audit = { 
    operation_observed_date: data.operation_observed_date || new Date(randDateMs).toJSON(),
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


  if (data.minimizeAuditData) {
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
	randomProductionSite,
	randomProductionSites,
  randomScope,
  randomOrganization,
  randomAuditor,
	randomOperation,
  randomOperationTypes,
	randomYear,
}
