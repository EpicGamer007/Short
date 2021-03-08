const fetch = require("node-fetch");

class Client {

	constructor(key) {
		if (key) {
			this.key = key;
		} else {
			this.key = process.env.REPLIT_DB_URL;
		}
	}

	async get(key) {
		const val = await fetch(`${this.key}/${encodeURIComponent(key)}`);
		return val.text();
	}

	async set(keyT, value) {
		
		const key = encodeURIComponent(keyT);
		const strValue = encodeURIComponent(value);

		await fetch(this.key, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: key + "=" + strValue,
		});

	}

	async delete(key) {
		await fetch(this.key + "/" + encodeURIComponent(key), { method: "DELETE" });
	}

	async list(prefix = "") {
		return await fetch(
		`${this.key}?encode=true&prefix=${encodeURIComponent(prefix)}`
		).then((r) => r.text()).then((t) => {
			if (t.length === 0) {
				return [];
			}
			return t.split("\n").map(decodeURIComponent);
		});
	}

	async empty() {
		const promises = [];
		for (const key of await this.list()) {
			promises.push(this.delete(key));
		}

		await Promise.all(promises);
	}

	async getAll() {
		let output = {};
		for (const key of await this.list()) {
			let value = await this.get(key);
			output[key] = value;
		}
		return output;
	}

	async setAll(obj) {
		for (const key in obj) {
			await this.set(key, obj[key]);
		}
	}

	async deleteMultiple(...args) {
		const promises = [];

		for (const arg of args) {
			promises.push(this.delete(arg));
		}

		await Promise.all(promises);

		return this;
	}
}

module.exports = new Client();