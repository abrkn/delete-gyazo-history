const request = require('request');
const async = require('async');

const [accessToken] = process.argv.slice(2);
const BASE_URL = 'https://api.gyazo.com/api';
const MAX_PER_PAGE = 100;
const BATCH_DELAY = 5e3;

if (!accessToken) {
	console.error(`Usage: ${process.argv.join(' ')} <Gyazo Access Token>`);
	process.exit(1);
}

const nextBatch = () => {
	request(`${BASE_URL}/images`, {
		json: true,
		qs: {
			access_token: accessToken,
			per_page: MAX_PER_PAGE,
		},
	}, (error, res, body) => {
		if (error) { throw error; }
		if (res.status < 200 || res.status > 299) {
			throw new Error(`HTTP ${res.status}: ${body}`);
		}

		const imageIds = body.map(x => x.image_id);

		if (!imageIds.length) {
			console.error('Done');
			process.exit();
		}

		console.error(`Deleting ${imageIds.length} images...`);

		async.eachSeries(imageIds, (imageId, next) => {
			request.del(`${BASE_URL}/images/${imageId}`, {
				qs: {
					access_token: accessToken,
				},
			}, next);
		}, error => {
			if (error) { throw error; }
			setTimeout(nextBatch, BATCH_DELAY);
		});
	});
};

nextBatch();
