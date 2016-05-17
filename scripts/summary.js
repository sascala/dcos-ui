/*
generating json file based on: 1-service-with-executor-task/summary.json
*/

let fs = require('fs')

const CPU = 8
const MEM = 16000
const GPU = 4
const DISK = 256000

const SUBNET = '10.0'


const idTag = makeIdTag()
let frameworks = makeFrameworks(idTag)
let slaves = makeSlaves(idTag, frameworks)

let out = {
	hostname: getIp4Address(),
	cluser: 'andrew-viz',
	slaves: slaves,
	frameworks: frameworks
}

fs.writeFile('./summary.json', JSON.stringify(out, null, 2), function(err) {
	if (err) return console.log(err)
	console.log('saved')
})


function makeEmptySlave(idTag, slaveNumber) {
	let id = idTag + 'S' + slaveNumber

	let hostname = getIp4Address()

	let pid = 'slave(1)@' + hostname + ':5051'

	let registered_time = Date.now()

	let resources = {
		cpus: CPU,
		disk: DISK,
		gpu: GPU,
		mem: MEM,
		ports: "[1025-2180, 2182-3887, 3889-5049, 5052-8079, 8082-8180, 8182-32000]"
	}

	let used_resources = {
		cpus: 0,
		gpus: 0,
		disk: 0,
		mem: 0
	}

	let offered_resources = {
		cpus: 0,
		gpus: 0,
		disk: 0,
		mem: 0
	}

	return {
		id: id,
		pid: pid,
		hostname: hostname,
		registered_time: registered_time,
		resources: resources,
		used_resources: used_resources,
		offered_resources: offered_resources,
		reserved_resources: [],
		unreserved_resources: [],
		active: true,
		version: '0.27.0',
		TASK_STAGING: 0,
  		TASK_STARTING: 0,
  		TASK_RUNNING: 0,
  		TASK_FINISHED: 0,
  		TASK_KILLED: 0,
  		TASK_FAILED: 0,
  		TASK_LOST: 0,
  		TASK_ERROR: 0,
  		framework_ids: []
	}
}

/*
make a random amount of slaves.  use all the resources the frameworks require.
@param: idTag, used cluster-wide
@param: frameworks, array
*/
function makeSlaves(idTag, frameworks) {
	// make all slaves have the same HW specs
	// sequentially fill agents until no more space in an agent
	// increment the TASK_STARTED, etc, etc for an agent as tasks are added to it
	// the framework ids field references all frameworks with tasks on it
	// and same with the slave ids for the frameworks

	// make some empty slaves
	let slaves = []
	let numSlaves = getRandomInteger(2, 100)
	for (let i = 0; i < numSlaves; i++) {
		slaves.push(makeEmptySlave(idTag, i))
	}

	// make a nice clean array of tasks to schedule
	let frameworksClone = Object.assign({}, frameworks)
	let tasks = []
	for (let f of frameworks) {
		// extract all tasks from framework
		let numTasks = f.TASK_RUNNING
		for (let i = 0; i < numTasks; i++) {
			tasks.push({
				cpu: f.used_resources.cpus / numTasks,
				gpu: f.used_resources.gpus / numTasks,
				mem: f.used_resources.mem / numTasks,
				disk: f.used_resources.disk / numTasks,
				framework_id: f.id
			})
		}
	}

	// roundrobin schedule on slaves
	let slaveIndex = 0
	while (tasks.length > 0) {
		// find slave with enough space
		let slave = slaves[slaveIndex]
		let start = slaveIndex
		while ( tasks[0].cpu > (slave.resources.cpus - slave.used_resources.cpus) ||
				tasks[0].gpu > (slave.resources.gpus - slave.used_resources.gpus) ||
				tasks[0].mem > (slave.resources.mem - slave.used_resources.mem) ||
				tasks[0].disk > (slave.resources.disk - slave.used_resources.disk)) {

			slaveIndex += 1
			if (slaveIndex >= slaves.length) { // circular
				slaveIndex = 0
			} 
			if (slaveIndex === start) { // looked at every slave, no space for this tasks, create another slave and schedule on it
				let emptySlave = makeEmptySlave(idTag, slaves.length)
				slaves.push(emptySlave)
				let slave = emptySlave
			}
			slave = slaves[slaveIndex]
		}

		// schedule on the slave
		slave.used_resources.cpus += tasks[0].cpu
		slave.used_resources.gpus += tasks[0].gpu
		slave.used_resources.mem += tasks[0].mem
		slave.used_resources.disk += tasks[0].disk
		slave.TASK_RUNNING += 1
		if (! slave.framework_ids.includes(tasks[0].framework_id)) {
			slave.framework_ids.push(tasks[0].framework_id)
		}

		// update label on framework
		for (let f of frameworks) {
			if (f.id === tasks[0].framework_id) {
				// add slave to its list if doesn't exist
				if (! f.slave_ids.includes(slave.id)) {
					f.slave_ids.push(slave.id)
				}
			}
		}

		// splice tasks
		tasks.splice(0, 1)
	}

	return slaves
}

function makeFrameworks(idTag) {
	const names = ['arangodb', 'cassandra', 'chronos', 'jenkins', 'kafka', 'spark', 'elasticsearch', 'calico', 'hdfs', 'mysql']

	let numFramework = getRandomInteger(2, names.length)

	let frameworks = []
	for (let i = 0; i < numFramework; i++) {
		let id = idTag + '0000'.substring((i + '').length) + i

		let name = ''
		if (i === 0) {
			name = 'marathon'
		} else {
			let index = getRandomInteger(0, names.length)
			names.splice(index, 1)
			name = names[index]
		}

		let hostname = getIp4Address()
		let pid =   'scheduler-' + 
					new Array(8).fill('').map(() => getChar()).join('') + '-' +
					new Array(4).fill('').map(() => getChar()).join('') + '-' +
					new Array(4).fill('').map(() => getChar()).join('') + '-' +
					new Array(4).fill('').map(() => getChar()).join('') + '-' +
					new Array(12).fill('').map(() => getChar()).join('') + '@' +
					hostname + ':' + getRandomInteger(100, 90000)

		let cpus = getRandomInteger(0, 20)
		let mem = getRandomInteger(0, 20000)
		let gpus = getRandomInteger(0, 4)
		let disk = getRandomInteger(0, 256000)
		let used_resources = {
			cpus: cpus,
			mem: mem,
			gpus: gpus,
			disk: disk
		}

		let offered_resources = {
			cpus: 0,
			mem: 0,
			gpus: 0,
			disk: 0
		}

		let webui_url = 'http://' + hostname + ':8080'

		frameworks.push({
			id: id,
			name: name,
			pid: pid,
			used_resources: used_resources,
			offered_resources: offered_resources,
			capabilities: [],
			hostname: hostname,
			webui_url: webui_url,
			active: true,
			TASK_STAGING: 0,
      		TASK_STARTING: 0,
      		TASK_RUNNING: getRandomInteger(1, 50),
      		TASK_FINISHED: 0,
      		TASK_KILLED: 0,
      		TASK_FAILED: 0,
      		TASK_LOST: 0,
      		TASK_ERROR: 0,
      		slave_ids: []
		})
	}

	return frameworks
}

function getChar() {
	const possible = "abcdefghijklmnopqrstuvwxyz0123456789"
	return possible.charAt(getRandomInteger(0, possible.length))
} 

function makeIdTag() {
	return  new Array(8).fill('').map(() => getChar()).join('') + '-' + 
			new Array(4).fill('').map(() => getChar()).join('') + '-' +
			new Array(4).fill('').map(() => getChar()).join('') + '-' +
			new Array(4).fill('').map(() => getChar()).join('') + '-' +
			new Array(12).fill('').map(() => getChar()).join('') + '-'
}

/*
Helpers
*/

function getRandomInteger(l, h) {
	return Math.floor(Math.random() * (h - l)) + l
} 

function getIp4Address() {
	return SUBNET + '.' + getRandomInteger(0, 9) + '.' + getRandomInteger(0,255)
}
