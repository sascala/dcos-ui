let utils = require('../utils.js')

class Nodes {
	constructor(nodes) {
		this.nodes = nodes
	}

	write() {
		utils.write('./logmaker/out/nodes.json', this)
	}
}

module.exports = Nodes