/*
Generate fixture data.

Make random number of frameworks, with varying number of tasks each.
A random number of slaves will be created.
The tasks are gaurenteed to fit on the slaves because more are created if not enough space.

User input:
- # frameworks
- degree of varience of framework size
- variance of task size
*/

let Framework = require('./classes/Framework.js')
let Slave = require('./classes/Slave.js')
let Summary = require('./classes/Summary.js')
let Task = require('./classes/Task.js')
let MarathonTask = require('./classes/MarathonTask.js')
let MarathonGroups = require('./classes/MarathonGroups.js')
let MesosState = require('./classes/MesosState.js')
let Units = require('./classes/Units.js')
let Unit = require('./classes/Unit.js')
let Nodes = require('./classes/Nodes.js')
let Node = require('./classes/Node.js')
let utils = require('./utils.js')


/************** CLI ARGS *****************/
let numberSlaves = process.argv[2]
let numberFrameworks = Math.min(process.argv[3], 10) // must be less than 10



/*********** MAKE FRAMEWORKS **************/

const tag = utils.getTag()
let frameworks = []

frameworks.push(new Framework(tag, 0, 'marathon', {
	cpus: 4,
	gpus: 0,
	mem: 4000,
	disk: 32000,
	tasks: 30
}))

const names = ['arangodb', 'cassandra', 'chronos', 'jenkins', 'kafka', 'spark', 'elasticsearch', 'calico', 'hdfs', 'mysql']
for (let i = 0; i < numberFrameworks; i++) {
	let index = utils.getRandomInteger(0, names.length - 1)
	frameworks.push(new Framework(tag, frameworks.length, names[index]))
	names.splice(index, 1)
}


/************** MAKE SLAVES **************/

let slaves = []
for (let i = 0; i < numberSlaves; i++) {
	slaves.push(new Slave(tag, slaves.length))
}



/************* SCHEDULE ALL TASKS ON THE SLAVES *************/

let tasks = []
for (let f of frameworks) {
	tasks = tasks.concat(f.tasks)
}


let slaveIndex = 0
while (tasks.length > 0) {
	let task = tasks.pop()

	// find slave with enough space
	let slave = slaves[slaveIndex]
	let start = slaveIndex
	while (!slave.hasSpaceForTask(task)) {
		// circular iteration
		slaveIndex += 1
		if (slaveIndex >= slaves.length) {
			slaveIndex = 0
		}
		slave = slaves[slaveIndex]

		// no slaves have space for task, make a new slave and schedule task on it
		if (slaveIndex === start) {
			let emptySlave = new Slave(tag, slaves.length)
			slaves.push(emptySlave)
			slave = emptySlave
			break;
		}
	}

	slave.scheduleTask(task)

	for (let f of frameworks) {
		if (f.id === task.framework_id && !f.slave_ids.includes(slave.id)) {
			f.slave_ids.push(slave.id)
		}
	}

	slaveIndex += 1
	if (slaveIndex >= slaves.length) {
		slaveIndex = 0
	}
}


/*************** SUMMARY JSON *******************/

let summary = new Summary(slaves, frameworks)
summary.write()

/*************** MARATHON GROUPS JSON *************/

let marathonTasks = []
for (let f of frameworks) {
	if (f.name === 'marathon') continue
	marathonTasks.push(f.getMarathonTask())
}

let marathonGroups = new MarathonGroups(marathonTasks)
marathonGroups.write()

/**************** MESOS STATE JSON ****************/

let mesosState = new MesosState(tag, slaves, frameworks)
mesosState.write()

/**************** NODE HEALTH ****************/

// /nodes (master and all slaves)

let n = []
let master = {
	host_ip: mesosState.hostname,
	health: 0,
	role: 'master'
}
n.push(master)
for (let ip of slaves.map((s) => s.hostname)) { // slaves
	n.push({
		host_ip: ip,
		health: 0,
		role: 'agent'
	})
}

let nodes = new Nodes(n)
nodes.write()


// nodes/<ip-of-node> (for now pick master)

let node = new Node(master)
node.write()


// nodes/<ip-of-node>/units (also pick master)

let units = new Units(mesosState.hostname)
units.write()


// node/<ip-of-node>/units/<unit-id> (also pick master first unit)

let unit = new Unit(mesosState.hostname)
unit.write()



