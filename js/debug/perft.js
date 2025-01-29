//Functions for assessing Helium's performance
class PerformanceTester {
	constructor() {
		this.taggedTimes = new Map();
	}

	tagTime(tag) {
		this.taggedTimes.set(tag, window.performance.now());
	}

	elapsed(tag, remove) { //In milliseconds
		if (!this.taggedTimes.has(tag)) {
			console.error(`You have not tagged any time with tag \"${tag}\".`);
			return -1;
		}
		let taggedTime = this.taggedTimes.get(tag);
		if ((remove === undefined) || remove) {
			this.taggedTimes.delete(tag);
		}
		return window.performance.now() - taggedTime;
	}
}

let globalPerformanceTester = new PerformanceTester();