const argv = require("minimist")(process.argv.slice(2));
const axios = require("axios");
const execa = require("execa");
const fs = require("fs-extra");

(async () => {

	console.log(argv);

	if(typeof argv.artist !== "string" || typeof argv.album !== "string") {
		console.log("Usage --artist [artist] --album [album]");
		return;
	}

	const { data: { album } } = await axios.get("https://ws.audioscrobbler.com/2.0/", {
		params: {
			method: "album.getinfo",
			api_key: "251fd1afd5d90f474d8e4955180ab08d",
			artist: argv.artist,
			album: argv.album,
			format: "json"
		}
	});

	console.log(album);

	for(let track of album.tracks.track) {
		const meta = {
			ARTIST: album.artist,
			ALBUM: album.name,
			TITLE: track.name,
			TRACKNUMBER: track["@attr"].rank
		};

		if(meta.TRACKNUMBER.length < 2) {
			meta.TRACKNUMBER = "0" + meta.TRACKNUMBER;
		}

		const args = [];

		for(let field in meta) {
			args.push("--set-tag", `${field}=${meta[field]}`);
		}

		const filename = argv._.shift();

		await execa("metaflac", [ filename, ...args ]);
		await fs.rename(filename, `${meta.TRACKNUMBER} - ${meta.TITLE}.flac`);
	}

})().catch(err => console.log(err));
