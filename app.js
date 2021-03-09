"use strict";

const express = require("express"),
	  app     = express();
const client  = require("./replitdb-client");
const helmet  = require("helmet");
const PORT    = process.env.PORT || 5050;

// client.empty().then(() => console.log("emptied"));

app.set('views', __dirname + '/public/views');
app.set('view engine', 'ejs');

app.use(helmet());
app.use(express.urlencoded({ extended: true }));

let urls;

console.log("Getting urls from db");

client.getAll().then((keyList) => {
	urls = new Map(Object.entries(keyList));
	console.log(urls);
}).catch((err) => {
	console.log("Error getting keys from db\n" + err);
	process.exit(1);
});

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/public/static/index.html");
});

app.get("/:id", (req, res) => {
	if(urls.get(req.params.id) === undefined) {
		res.sendFile(__dirname + "/public/static/404.html");
		return;
	} else {
		res.redirect(urls.get(req.params.id));
		return;
	}
});

app.post("/addUrl", (req, res) => {
	const urlSub = req.body.urlToAdd;
	const urlId  = req.body.urlId;

	console.log(`urlId: ${urlId}`);

	const alreadythere = contains(urlSub);

	if(urls.has(urlId)) {
		res.render("error", {error: "Id already taken"});	
		return;	
	} else if(alreadythere) {
		res.render("error", {error: "Url already taken. ID for " + urlSub + " is " + alreadythere});
		return;
	} else if (urlSub.indexOf('<') > -1 || urlSub.indexOf('>') > -1) {
		res.render("error", {error: "Error: Illegal character(s) < or > is found in url."});
		return;
	} else if(urlId.match(/^[a-zA-Z0-9]*$/) === null) { 
		res.render("error", {error: "Error: Illegal character(s) found in requested id."});
		return;
	}

	const valid = isValidURL(urlSub);

	if(valid) {
		console.log("is valid")
		let shortUrl = "";

		let val = contains(urlSub);
		
		if(val) {
			console.log("Already available");
			shortUrl = val;
		} else {
			console.log("Need to create");
			if (!urlId.replace(/\s/g, '').length) {
				console.log(urlSub + "   empty   " + urlId);
				shortUrl = addAndUpdate(urlSub);
				console.log("Add and update is run")
			} else {
				console.log(urlSub + "   id is given   " + urlId);
				shortUrl = addAndUpdateWithId(urlSub, urlId);
				console.log("Add and update is run")
			}
		}		

		res.render("url", {url: urlSub, shortened: shortUrl})
	} else {
		res.render("error", {error: "Error shortening url"});
	}

});

app.get('/styles/:stylesheet', (req, res) => {
    const file = req.params.stylesheet;
	const options = {};
    res.sendFile(__dirname + "/public/styles/" + file, options, (err) => {
        if(err) {
            res.sendFile(__dirname + "/public/static/404.html");
        }
    });
});

app.get('/fonts/:font', (req, res) => {
    const file = req.params.font;
	const options = {};
    res.sendFile(__dirname + "/public/fonts/" + file, options, (err) => {
        if(err) {
            res.sendFile(__dirname + "/public/static/404.html");
        }
    });
});

app.get("*", (req, res) => {
	res.sendFile(__dirname + "/public/static/404.html");
});

app.listen(PORT, () => {
	console.log("App listening on port " + PORT);
});


/* function isValidURL(string) {
	const res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);

	if (string.slice(0, 6) != "https:") {
		return false;
	}
	
	console.log(string);

	return (res !== null)
}; */

const isValidURL = potentially_valid_url => {
    try {
        new URL(potentially_valid_url);
        return true;
    } catch {
        return false;
    }
}

function addAndUpdate(theUrl) {

	const rand = makeid();
	console.log(rand + "   addAndUpdate  " + theUrl);

	while(!loop(rand)) {
		rand = makeid();
		console.log(rand + "  " + theUrl);
	}

	console.log(rand + "  " + theUrl);

	client.set(rand, theUrl).then(() => {
		urls.set(rand, theUrl);
		//console.clear();
		console.log(urls);
	});

	return rand;

}

function addAndUpdateWithId(theUrl, theId) {

	client.set(theId, theUrl).then(() => {
		urls.set(theId, theUrl);
		//console.clear();
		console.log(urls);
	});

	return theId;

}

function loop(id) {
	for(const i in urls) {
		if(i == id) {
			return false;
		}
	}
	return true;
}

function makeid() {
	let result           = '';
	let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let charactersLength = characters.length;
	for (let i = 0; i < 10; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

function contains(site) {
	for (let [key, value] of urls) {
		if(value == site) {
			return key;
		}
	}
	return "";
}