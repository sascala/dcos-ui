let utils = require('../utils.js')

class Summary {
	constructor(slaves, frameworks) {
		this.hostname = utils.getIp4Address()
		this.cluser = 'andrew-viz'
		this.slaves = slaves
		this.frameworks = frameworks
	}

	write() {
		utils.write('./logmaker/out/summary.json', this)
	}
}

module.exports = Summary
