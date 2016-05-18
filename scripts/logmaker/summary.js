/*
Generate randomized JSON file in the structure of:
	_fixtures/1-service-with-executor-task/summary.json
For use in MesosSummaryActions.js
*/

let Framework = require('./classes/Framework.js')
let Slave = require('./classes/Slave.js')
let Summary = require('./classes/Summary.js')
let Task = require('./classes/Task.js')
let MarathonTask = require('./classes/MarathonTask.js')
let MarathonGroups = require('./classes/MarathonGroups.js')
let MesosState = require('./classes/MesosState.js')
let utils = require('./utils.js')



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
let numFramework = utils.getRandomInteger(1, names.length)
for (let i = 0; i < numFramework; i++) {
	let index = utils.getRandomInteger(0, names.length - 1)
	frameworks.push(new Framework(tag, frameworks.length, names[index]))
	names.splice(index, 1)
}


/************** MAKE SLAVES **************/

let slaves = []
let numSlaves = utils.getRandomInteger(2, 100)
for (let i = 0; i < numSlaves; i++) {
	slaves.push(new Slave(tag, slaves.length))
}



/************* SCHEDULE ALL TASKS ON THE SLAVES *************/

let tasks = []
for (let f of frameworks) {
	tasks = tasks.concat(f.getTasks())
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
			let slave = emptySlave
			break;
		}
	}

	slave.scheduleTask(task)

	for (let f of frameworks) {
		if (f.id === task.frameworkId && !f.slave_ids.includes(slave.id)) {
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




