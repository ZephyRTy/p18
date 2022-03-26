import cheerio from 'cheerio';
import fs from 'fs';
import request from 'request';
import { Circuit } from './stream/Circuit';
let domain = 'https://idolfap.com';
let tag = 'yoona';
let index = 1;
let pageCount = 1;
let getNewPacks = new Circuit(
	(body: unknown) => {
		let $ = cheerio.load(body as any);
		let images = $('.page-item.active + li a');
		let result: string[] = [];
		images.each((i: any, ele: any) => {
			let url = $(ele).attr('href');
			if (!url) return;
			result.push(domain + url);
		});
		return result;
	},
	(body: unknown) => {
		let $ = cheerio.load(body as any);
		let imgs = $('.lazy');
		let result: { src: string; index: number }[] = [];
		imgs.each((i: any, ele: any) => {
			let src = $(ele).attr('data-src')?.replace(/thumb/, 'src');
			if (!src) return;
			result.push({ src: domain + src, index: index++ });
		});
		console.log(`${pageCount++}/${result.length}`);
		return result;
	},
	{ max: 155 }
);
const getImg = (img: { src: string; index: number }) => {
	request({ url: img.src })
		.on('error', (err) => {
			console.error(err);
			console.log(img);
		})
		.pipe(
			fs
				.createWriteStream(
					String.raw`D:\koreanFake\idolFap` +
						`\\${tag}\\${img.index}.jpg`,
					{
						autoClose: true
					}
				)
				.on('error', (err) => {
					console.error(err);
					console.log(img.src);
				})
				.on('close', (err: any) => {
					if (err) {
						console.log('写入失败', err);
					}
				})
		);
};
getNewPacks.collect(`${domain}/idols/${tag}/`);
getNewPacks.output(getImg, { delay: 200 });
