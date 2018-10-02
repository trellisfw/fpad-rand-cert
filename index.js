'use strict'
var _ = require('lodash')
var faker = require('faker');
var certifyingBodies = [
	'SCS Global Services',
	'Primus Ops',
	'AbcAudits',
]
var schemes = [
  'PrimusGFS',
  'Global G.A.P.',
  'SQF',
  'Canada G.A.P.',
]
var products = [
  'Asparagus',
  'Bananas',
  'Beets',
  'Blueberries',
  'Broccoli',
  'Cabbage',
  'Carrots, Baby',
  'Carrots, Whole',
  'Cauliflower',
  'Celery',
  'Cherries',
  'Cucumbers',
  'Grapes, Red',
  'Grapes, White',
  'Grapes, Black',
  'Peppers,Green Bell',
  'Peppers, Red Bell',
  'Peppers, Yellow Bell',
  'Jalepeno Peppers',
  'Lettuce, Iceberg',
  'Lettuce, Romaine',
  'Lettuce, Green Leaf',
  'Lettuce, Red Leaf',
  'Mangos',
  'Radish',
  'Pear, Bartlett',
  'Grapefruit',
  'Cherries, Bing',
  'Onions, Vidallia',
  'Onions, White',
  'Onions, Red',
  'Oranges, Naval',
  'Oranges, Cara Cara',
  'Pineapples',
  'Potatoes, Russet',
  'Potatoes, Red',
  'Potatoes, Yukon Gold',
  'Potatoes, Sweet',
  'Raspberries, Red',
  'Raspberries, Black',
  'Spinach',
  'Strawberries',
  'Tomatoes, Roma',
]
var operationTypes = [
  'harvest',
  'packinghouse',
  'cold storage',
  'growing',
  'handling'
]
var farmNames = [
	'Produce',
	'Farms',
	'Brothers Farms',
	'Family Farms',
	'Farms, LLC',
]

function getLocation(data) {
  var location = data || {};
	return {
		address: location.address || faker.address.streetAddress(),
    city: location.city || faker.address.city(), 
    state: location.state || faker.address.state(),
    country: location.country || "USA",
    description: location.description || "All sites in same area",
  }
}

function getEntry(array) {
	return array[Math.round(Math.random()*(array.length-1))]
}

function getOrganization(data) {
  var organization = data || {};
  organization.contacts = organization.contacts || [{
    name: faker.name.firstName() + ' ' + faker.name.lastName()
  }]
  organization.name = organization.name || organization[0].name.split(' ')[organization[0].name.split(' ').length - 1] + ' ' + randomEntry(farmNames),
  organization.location = getLocation(organization.location),
  organization.organizationid = organization.organizationid || {
    id: Math.round(Math.random() * 1000000000).toString(),
    id_source: "scheme",
    otherids: [{ id_source: 'certifying_body', id: Math.round(Math.random() * 10000000).toString() }]
  }
  return organization
}

function getCertifyingBody(data) {
  var certifyingBody = data || {};
  certifyingBody.name = certifyingBody.name || randomEntry(certifyingBodies);
  certifyingBody.auditor = certifyingBody.auditor || {name: faker.name.firstName() +' '+ faker.name.lastName()};
  return certifyingBody
}

function getScope(data) {
  var scope = data || {}
  scope.notification = scope.notification || (Math.random() >= 0.5) ? 'announced' : 'unannounced';
  scope.description = scope.description || "";
  scope.operations = scope.operations || [{operation_type: randomEntry(operationTypes)}]
  scope.parallel_ownership = scope.parallel_ownership || Math.random() >= 0.5;
  scope.parallel_production = scope.parallel_ownership || Math.random() >= 0.5;
  scope.products_observed = getProductsObserved(scope.products_observed);
  // The set of product_sites these should have the same products_observed as 
  // listed above. 
  scope.product_sites = getProductionSites(scope.product_sites || [getProductionSite({
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
function getProductsObserved(data) {
	var products_observed = data || [];
	products_observed.forEach((product_observed, i) => {
		products_observed[i] = getProductObserved(product_observed)
	})
	if (products_observed.length < 1) products_observed[0] = getProductObserved({})
	return products_observed
}

function getProductObserved(data) {
  var productObserved = data || {};
  productObserved.name = productObserved.name || getProducts(1)[0];
  productObserved.first_area = productObserved.first_area || { value: (Math.round(Math.random()*100)).toString(), units: 'acres' };
  productObserved.further_area = productObserved.further_area || { value: (Math.round(Math.random()*100)).toString(), units: 'acres' };
  productObserved.operations = productObserved.operations || [
    { operation_type: randomEntry(operationTypes) }
  ]
	productObserved.operations.forEach((op, i) => {
		if (productObserved.operations[i].operation_type === 'growing') {
		//TODO: a bit difficult to provide optional control to this. Its up to the user when they specify a 'growing' operationn
			productObserved.operations[i].covering_type = (Math.random() >= 0.5) ? 'covered' : 'uncovered'
		}
  })
  return productObserved;
}

function getProductionSites(data) {
	var sites = [];
	data.forEach((site, i) => {
		sites[i] = getProductionSite(site);
	})
	// This line may not be necessary given the code from getScope guarantees 
	// there is always 1 item, but this function can be called by itself with an 
	// empty array.
	if (sites.length < 1) sites[0] = getProductionSite({})
	return sites
}

function getProductionSite(data) {
	var site = {
    name: data.name || `The Big ${data.products_observed[0].name} Ranch`,
    id: data.id || (Math.round(Math.random()*10000)).toString(),
    products_observed: getProductsObserved(data.products_observed || []),
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

function getProducts(numProducts) {
  var randProducts = []
  while(randProducts.length < numProducts){
    var getProduct = products[Math.floor(Math.random() * products.length)]
    if(randProducts.indexOf(getProduct) > -1) continue;
    randProducts[randProducts.length] = getProduct
  }
  return randProducts
}

function getOperationTypes(numOperations) {
  return operationTypes.slice(0, numOperations)
}

// Past 10 years by default; TODO: set date range
function randomYear() {
	return Math.round(Math.random()*10) + (new Date().getFullYear() - 10);
}

function getConditionsDuringAudit(data, scheme) {
  var conditions_during_audit = data || {};
  // Generate random date, make it in the last 10 years;
  var randDateMs = new Date(Math.round(Math.random() * Date.now())).setFullYear(randomYear())
  var duration = (Math.round(Math.random()*5) + 1);
  var durationTwo = (Math.round(Math.random()*5) + 1);
  if (scheme === 'PrimusGFS') {
    conditions_during_audit['operation_observed_data'] = data['operation_observed_data'] || {
      start: new Date(randDateMs).toJSON(),
      end: new Date(randDateMs+(duration*3600000)).toJSON()
    }
    conditions_during_audit['FSMS_observed_data'] = data['FSMS_observed_data'] || {
      start: new Date(randDateMs+(duration*3600000)).toJSON(),
      end: new Date(randDateMs+(duration*3600000)+(durationTwo*3600000)).toJSON(),
    }
  } else if (scheme === 'Global G.A.P.') {
    conditions_during_audit.operation_observed_date = conditions_during_audit.operation_observed_date || new Date(randDateMs).toJSON()
    conditions_during_audit.duration = conditions_during_audit.duration || { value: (Math.round(Math.random()*5) + 1).toString(), units: 'hours', }
  }
  return conditions_during_audit;
}

function getControlPoints(data, scheme, success) {
  var control_points = data || {};

  // Compute per control point probability of failure to achieve our overall numbers
  var totalCps = control_points.length;
  var successRate = success || 0.90;
  // Each cp has this probability of success to achieve overall probability of
  // target score
  var passCpProb = Math.pow(successRate, (1/totalCps))
  var autoFailCpProb = Math.pow(successRate, totalCps);

  if (scheme === 'PrimusGFS') {
    var yes = `A 'YES' ANSWER TO THIS QUESTION RESULTS IN AN AUTOMATIC FAILURE OF THE AUDIT.`
    var no = `A 'NO' ANSWER TO THIS QUESTION RESULTS IN AN AUTOMATIC FAILURE OF THE AUDIT.`
    Object.keys(control_points).forEach((cp, i) => {
      // Booleans have a chance of AUTO FAILURE. They are also all or nothing as
      // far as points.
      if (control_points[cp].score.units === 'boolean') {
        if (control_points[cp].name.indexOf(yes) >= 0) {
          var fail = Math.random() >= autoFailCpProb;
          control_points[cp].score.value = fail ? '0' : control_points[cp].score.value
          control_points[cp].score.compliance.value = fail ? 'Yes' : 'No';
        } else if (control_points[cp].name.indexOf(no) >= 0) {
          var fail = Math.random() >= autoFailCpProb;
          control_points[cp].score.value = fail ? '0' : control_points[cp].score.value
          control_points[cp].score.compliance.value = fail ? 'No' : 'Yes';
        } else {
          var fail = Math.random() <= passCpProb;
          control_points[cp].score.value = fail ? '0' : control_points[cp].score.value
          control_points[cp].score.compliance.value = fail ? 'No' : 'Yes';
        }
      } else if (control_points[cp].score.units === 'enum-pgfs-compliance') {
        var worth = parseInt(control_points[cp].score.possible.value);
        control_points[cp].score.value = Math.round(Math.random() * worth)
        if (control_points[cp].score.value === worth) {
          control_points[cp].score.compliance.value = 'Total Compliance';
          control_points[cp].score.value = control_points[cp].score.value.toString()
        } else if (control_points.score.value > (worth/2)) {
          control_points[cp].score.compliance.value = 'Minor Deficiency';
        } else {
          control_points[cp].score.compliance.value = 'Major Deficiency';
        }
      }
    })
  } else if (scheme === 'Global G.A.P.') {
    Object.keys(control_points).forEach((cp, i) => {
      if (control_points[cp].globalgap_level === 'major_must') {
        control_points[cp].score.value = (Math.random() <= passCpProb) ? 'yes' : 'no';
      } else {
        control_points[cp].score.value = (Math.random() >= autoFailCpProb) ? 'yes' : 'no';
      }
    })
  }
  return control_points;
}

function computeScore(control_points, scheme) {
  var score = {};

  if (scheme === 'PrimusGFS') {
    var earned = 0;
    var total = 0;

    // Sum up the total points
    Object.keys(control_points).forEach((cp, i) => {
      earned += parseInt(control_points[cp].score.value)
      total += parseInt(control_points[cp].score.possible.value)
    })
    score.preliminary = {
      value: Math.round((earned/total)*100).toString(),
      units: 'percent'
    }
    //Convert to string
    score.preliminary.value = score.preliminary.value.toString();
  } else if (scheme === 'Global G.A.P.') {
    score = {
      globalgap_levels: {
        major_musts: {
          no: { value: 0, units: 'count'},
          yes: { value: 0, units: 'count'},
          n_a: { value: 0, units: 'count'},
          is_compliant: true
        },
        minor_musts: {
          no: { value: 0, units: 'count'},
          yes: { value: 0, units: 'count'},
          n_a: { value: 0, units: 'count'},
          is_compliant: true
        }
      },
      is_compliant: true
    }
    Object.keys(control_points).forEach((cp, i) => {
      score.globalgap_levels[control_points[cp].globalgap_level][control_points[cp].score.value]++;
    })
    // Compute final score
    score.globalgap_levels.major_musts.is_compliant = (score.globalgap_levels.major_musts.no.value < 1);
    score.globalgap_levels.minor_musts.value = score.globalgap_levels.minor_musts.yes.value/(score.globalgap_levels.minor_musts.yes.value + score.globalgap_levels.minor_musts.no.value)
    score.globalgap_levels.minor_musts.is_compliant = (score.globalgap_levels.minor_musts.value >= 0.95);
    score.is_compliant = (score.globalgap_levels.major_musts.is_compliant && score.globalgap_levels.minor_musts.is_compliant);
    // Convert to strings!
    score.globalgap_levels.major_musts.yes.value = score.globalgap_levels.major_musts.yes.value.toString()
    score.globalgap_levels.major_musts.no.value = score.globalgap_levels.major_musts.no.value.toString()
    score.globalgap_levels.major_musts.n_a.value = score.globalgap_levels.major_musts.n_a.value.toString()
    score.globalgap_levels.major_musts.is_compliant = score.globalgap_levels.major_musts.is_compliant.toString();

    score.globalgap_levels.minor_musts.yes.value = score.globalgap_levels.minor_musts.yes.value.toString()
    score.globalgap_levels.minor_musts.no.value = score.globalgap_levels.minor_musts.no.value.toString()
    score.globalgap_levels.minor_musts.n_a.value = score.globalgap_levels.minor_musts.n_a.value.toString()
    score.globalgap_levels.minor_musts.value = score.globalgap_levels.minor_musts.value.toString()
    score.globalgap_levels.minor_musts.is_compliant = score.globalgap_levels.minor_musts.is_compliant.toString();

    score.is_compliant = score.is_compliant.toString();
  }
}

// Generate a random audit
function generateAudit(data, passRate) {
  var auditOut = {} //_.cloneDeep(data.template)

  // First, settle on the scheme of the audit
  auditOut['scheme'] = data['scheme'] || {
    name: randomEntry(schemes),
    version: Math.round(Math.random() * 10).toString()+'.'+
             Math.round(Math.random() * 10).toString()+'.'+
             Math.round(Math.random() * 10).toString()
  }

// Randomize certificationid 
  var certid = Math.round(Math.random() * 10000).toString();
  var certNum = data.certNum || Math.round(Math.random() * 7).toString()
  auditOut.certificationid = data.certificationid || {
    id: `${certid} - Cert: ${certNum}`,
    id_source: 'scheme'
  }

//Get certifying body
  auditOut.certifying_body = getCertifyingBody(data.certifying_body || {});
  
// Modify the organization with random info
  auditOut.organization =  getOrganization(data.organization);

//Modify scope with random info
  auditOut.scope = getScope(data.scope)

//Modify scope with random info
  auditOut.conditions_during_audit = getConditionsDuringAudit(data.conditions_during_audit, auditOut.scheme.name)

  // Randomize control point scores
  auditOut.control_points = getControlPoints(data.control_points, auditOut.scheme.name, passRate)

  // Setup audit score object
  auditOut.score = computeScore(data.control_points, auditOut.scheme.name);

  if (data.minimizeAuditData) {
    auditOut = removeSectionsRecursive(auditOut)
    auditOut = minimizeControlPoints(auditOut)
  }

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
  getProducts,
	getProductionSite,
	getProductionSites,
  getScope,
  getOrganization,
  getOperationTypes,
  getCertifyingBody,
  computeScore,
  getControlPoints,
	randomYear,
}
