class Task {
	constructor(cpus, gpus, mem, disk, frameworkId) {
		this.cpus = cpus
		this.gpus = gpus
		this.mem = mem
		this.disk = disk
		this.frameworkId = frameworkId
	}
}

module.exports = Task