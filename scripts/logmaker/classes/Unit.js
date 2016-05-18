let utils = require('../utils.js')

let address = null

class Unit {
  constructor(ip) {
    address = ip
    this.id = 'dcos-cluster-id.service'
    this.name = 'Admin Router Reloader'
    this.health = 0
    this.description = 'Reload admin router to get new DNS'
  }

  write() {
    utils.write(`./logmaker/out/unit-${address}.json`, this)
  }
}

module.exports = Unit
