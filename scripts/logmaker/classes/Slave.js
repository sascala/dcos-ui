var utils = require('../utils.js')

class Slave {
	constructor(tag, number, options = {cpus: 8, gpus: 2, mem: 16000, disk: 256000}) {
		this.id = tag + 'S' + number
		this.hostname = utils.getIp4Address()
		this.pid = 'slave(1)@' + this.hostname + ':5051'
		this.registered_time = Date.now()
		this.resources = {
			cpus: options.cpus,
			gpus: options.gpus,
			mem: options.mem,
			disk: options.disk,
			ports: "[1025-2180, 2182-3887, 3889-5049, 5052-8079, 8082-8180, 8182-32000]"
		}
		this.used_resources = {
			cpus: 0,
			gpus: 0,
			disk: 0,
			mem: 0
		}
		this.offered_resources = {
			cpus: 0,
			gpus: 0,
			disk: 0,
			mem: 0
		}
		this.reserved_resources = []
		this.unreserved_resources = []
		this.attributes = {
			public_ip: 'true'
		}
		this.active = true
		this.version = '0.27.0'
		this.TASK_STAGING = 0,
		this.TASK_STARTING = 0,
		this.TASK_RUNNING = 0,
		this.TASK_FINISHED = 0,
		this.TASK_KILLED = 0,
		this.TASK_FAILED = 0,
		this.TASK_LOST = 0,
		this.TASK_ERROR = 0,
		this.framework_ids = []
	}

	hasSpaceForTask(task) {
		return  task.resources.cpus <= (this.resources.cpus - this.used_resources.cpus) &&
				task.resources.gpus <= (this.resources.gpus - this.used_resources.gpus) &&
				task.resources.mem <= (this.resources.mem - this.used_resources.mem)   &&
				task.resources.disk <= (this.resources.disk - this.used_resources.disk)
	}

	scheduleTask(task) {
		this.used_resources.cpus += task.resources.cpus
		this.used_resources.gpus += task.resources.gpus
		this.used_resources.mem += task.resources.mem
		this.used_resources.disk += task.resources.disk
		this.TASK_RUNNING += 1

		// update the slave id on the task
		task.slave_id = this.id

		if (!this.framework_ids.includes(task.framework_id)) {
			this.framework_ids.push(task.framework_id)
		}
	}
}

module.exports = Slave
