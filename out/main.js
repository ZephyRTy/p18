import cheerio from 'cheerio';
import fs from 'fs';
import request from 'request';
import { Stream } from './utils/stream.js';
function sleep(time) {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	});
}
const proxyIP = '127.0.0.1';
const proxyPort = '10809';
const proxy = 'http://' + proxyIP + ':' + proxyPort;
let tag = 'yoona';
let index = 1;
let headers = {
	'User-Agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36 Edg/98.0.1108.62'
};
let stream = new Stream(
	(body) => {
		let $ = cheerio.load(body);
		let images = $('.saxon-post-image img');
		let result = [];
		images.each((i, ele) => {
			let img = $(ele).attr('src');
			if (!img) return;
			let tag = $(ele).attr('alt').split(' ').slice(0, -2).join(' ');
			result.push({ src: img, index: index++, tag: tag });
			if (!fs.existsSync(`D:\\koreanFake\\kfapfakes\\${tag}`)) {
				fs.mkdirSync(`D:\\koreanFake\\kfapfakes\\${tag}`);
			}
		});
		return result;
	},
	{ delay: 500 }
);
let links = [];
for (let i = 1; i <= 2; i++) {
	links.push(`http://kfapfakes.com/page/${i}`);
}
stream.get(links, { proxy, headers });
stream.output(async (img) => {
	await sleep(100).then(() => {
		getImg(img);
	});
});
function getImg(img) {
	try {
		request({ url: img.src, proxy: proxy })
			.on('error', (err) => {
				console.error(err);
				console.log(img.src);
				console.log(img);
			})
			.pipe(
				fs
					.createWriteStream(
						`D:\\koreanFake\\kfapfakes\\${img.tag}\\${img.index}.jpg`,
						{
							autoClose: true
						}
					)
					.on('error', (err) => {
						console.error(err);
						console.log(img.src);
					})
					.on('finish', () => {
						console.log(img.tag + ' ' + img.index + ' done');
					})
					.on('close', (err) => {
						if (err) {
							console.log('写入失败', err);
						}
					})
			);
	} catch (error) {
		console.error(error);
		console.log(img + ' download Error');
	}
}
