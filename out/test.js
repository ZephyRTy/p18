import cheerio from 'cheerio';
import fs from 'fs';
import { Circuit } from './object/Circuit.js';
import { getImg } from './utils/getImg.js';
const proxyIP = '127.0.0.1';
const proxyPort = '10809';
export const proxy = 'http://' + proxyIP + ':' + proxyPort;
let index = 355;
let headers = {
	'User-Agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36 Edg/98.0.1108.62'
};
export let website = 'kfapfakes';
if (!fs.existsSync(`D:\\koreanFake\\${website}`)) {
	fs.mkdirSync(`D:\\koreanFake\\${website}`);
}
let domain = 'https://motherless.com';
function sleep(time) {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	});
}
// export let tag = 'IU_(singer)';
// if (!fs.existsSync(`D:\\koreanFake\\${website}\\${tag}`)) {
// 	fs.mkdirSync(`D:\\koreanFake\\${website}\\${tag}`);
// }
let links = [];
for (let i = 1; i <= 1; i++) {
	links.push(`http://kfapfakes.com/page/${i}/`);
}
// let stream = new Stream(
// 	(body: any) => {
// 		let $ = cheerio.load(body);
// 		let images = $('div.thumb a[href^="http"]');
// 		let result: { src: string; index: number }[] = [];
// 		images.each((i, ele) => {
// 			let src = $(ele).attr('href');
// 			if (!src) return;
// 			result.push({ src, index: index++ });
// 		});
// 		return result;
// 	},
// 	{ delay: 400 }
// );
// stream.get(links, { proxy, headers });
// stream.output(async (img) => {
// 	await sleep(100).then(() => {
// 		getImg(img);
// 	});
// });
let circle = new Circuit(
	(body) => {
		let $ = cheerio.load(body);
		let images = $('.nextpostslink');
		let result = [];
		images.each((i, ele) => {
			let url = $(ele).attr('href');
			if (!url) return;
			result.push(url);
		});
		return result;
	},
	(body) => {
		let $ = cheerio.load(body);
		let images = $('div.saxon-post-image img');
		let result = [];
		images.each((i, ele) => {
			let src =
				$(ele).attr('src').split('-').slice(0, -1).join('-') + '.jpg';
			if (!src) return;
			result.push({
				src,
				title: $(ele).attr('alt')?.split(' ').slice(0, -2).join(' '),
				index: index++
			});
		});
		return result;
	}
);
circle.setNetOptions({ proxy, headers }).get('http://kfapfakes.com/page/60');
circle.output(async (url) => {
	await sleep(200).then(() => {
		getImg(url);
	});
});
