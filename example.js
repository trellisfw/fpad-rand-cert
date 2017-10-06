var randCert = require('./gg-audit-randomize');
var templateAudit = require('./GlobalGAP_FullAudit.js');

var aud = randCert.generateAudit({
	template:templateAudit,
	minimizeAudit: false,
	scope: {
		operations: templateAudit.scope.operations,
		products_observed: templateAudit.scope.products_observed,
	},
	year: (parseInt(templateAudit.conditions_during_audit.operation_observed_date.slice(0,4))+1).toString()
})

console.log(aud.scope.operations)
console.log(aud.scope.products_observed)
console.log(aud.organization)
console.log(aud.conditions_during_audit)
