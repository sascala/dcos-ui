let utils = require('../utils.js')

class Node {
	constructor(node) {
		this.node = node
	}

	write() {
		utils.write(`./logmaker/out/node-${this.node.host_ip}.json`, this.node)
	}
}

module.exports = Node
