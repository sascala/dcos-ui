class Task {
	constructor(cpus, gpus, mem, disk, framework_id) {
    this.id = 'broker'
    this.name = 'broker'
    this.framework_id = framework_id;
    this.executor_id = ''
    this.slave_id = ''
    this.resources = {
      cpus: cpus,
      disk: disk,
      mem: mem,
      gpus: gpus
    }
    this.statuses = []
    this.labels = []
	}
}

module.exports = Task
