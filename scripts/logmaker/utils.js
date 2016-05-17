let fs = require('fs')

module.exports = {
	getRandomInteger: function(l, h) { // (inclusive)
		return Math.floor(Math.random() * (h - l + 1)) + l
	},
	getIp4Address: function() {
		return '10.0.' + this.getRandomInteger(0, 9) + '.' + this.getRandomInteger(0,255)
	},
	getChar: function() {
		const possible = "abcdefghijklmnopqrstuvwxyz0123456789"
		return possible.charAt(this.getRandomInteger(0, possible.length))
	},
	getTag: function() {
		return  new Array(8).fill('').map(() => this.getChar()).join('') + '-' + 
				new Array(4).fill('').map(() => this.getChar()).join('') + '-' +
				new Array(4).fill('').map(() => this.getChar()).join('') + '-' +
				new Array(4).fill('').map(() => this.getChar()).join('') + '-' +
				new Array(12).fill('').map(() => this.getChar()).join('') + '-'
	},
	write: function(name, object) {
		fs.writeFile(name, JSON.stringify(object, null, 2), function(err) {
			if (err) return console.log(err)
			console.log('saved')
		})
	}
}