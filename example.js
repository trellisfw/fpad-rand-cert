var randCert = require('./gg-audit-randomize');
var templateAudit = require('./GlobalGAP_FullAudit.js');

var aud = randCert.generateAudit({
	template:templateAudit,
	minimizeAudit: false,
	organization: templateAudit.organization,
	scope: {
		operations: templateAudit.scope.operations,
		products_observed: templateAudit.scope.products_observed,
	},
})

console.log(aud.scope.operations)
console.log(aud.scope.products_observed)
console.log(aud.organization)
