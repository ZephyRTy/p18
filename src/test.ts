import cheerio from 'cheerio';
import fs from 'fs';
import request from 'request';
import { Stream } from './utils/stream.js';
const proxyIP = '127.0.0.1';
const proxyPort = '10809';
const proxy = 'http://' + proxyIP + ':' + proxyPort;
let index = 829;
let headers = {
	'User-Agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36 Edg/98.0.1108.62'
};
let website = 'motherless';
if (!fs.existsSync(`D:\\koreanFake\\${website}`)) {
	fs.mkdirSync(`D:\\koreanFake\\${website}`);
}
let domain = 'https://motherless.com';
function sleep(time: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	});
}
let tag = 'Im_Yoon-ah';
let stream = new Stream(
	(body: any) => {
		let $ = cheerio.load(body);
		let images = $('a.img-container');
		let result: { url: string }[] = [];
		images.each((i, ele) => {
			let url = $(ele).attr('href');
			if (!url) return;
			result.push({ url });
		});
		return result;
	},
	{ delay: 400 }
);
let links = [];
for (let i = 1; i <= 14; i++) {
	links.push(`https://motherless.com/u/georgeleelee?page=${i}&t=a`);
}
stream.get(links, { proxy, headers });
// stream.output(async (img) => {
// 	await sleep(100).then(() => {
// 		getImg(img);
// 	});
// });
stream
	.next(
		(body: any) => {
			let $ = cheerio.load(body);
			let images = $('#motherless-media-image');
			let result: { src: string; index: number }[] = [];
			images.each((i, ele) => {
				let src = $(ele).attr('src');
				if (!src) return;
				result.push({ src, index: index++ });
			});
			return result;
		},
		{ delay: 500 }
	)
	.setNetOptions({ proxy, headers })
	.output(async (img) => {
		await sleep(100).then(() => {
			getImg(img);
		});
	});

function getImg(img: { src: string; index: number }) {
	let type = 'jpg';
	if (img.src.includes('gif')) {
		type = 'gif';
	}
	try {
		request({ url: img.src, proxy: proxy })
			.on('error', (err) => {
				console.error(err);
				console.log(img.src);
			})
			.pipe(
				fs
					.createWriteStream(
						`D:\\koreanFake\\${website}\\${img.index}.${type}`,
						{
							autoClose: true
						}
					)
					.on('error', (err) => {
						console.error(err);
						console.log(img.src);
					})
					.on('finish', () => {
						console.log(img.index + ' done');
					})
					.on('close', (err: any) => {
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
type Check<T> = T extends string | number ? T : never;
