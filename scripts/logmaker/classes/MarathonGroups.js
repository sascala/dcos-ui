let utils = require('../utils.js')

class MarathonGroups {
	constructor(marathonTasks) {
		this.id = '/'
		this.dependencies = []
		this.version = 'current date'
		this.apps = marathonTasks
		this.groups = []
	}

	write() {
		utils.write('./logmaker/out/marathonGroups.json', this)
	}
}

module.exports = MarathonGroups