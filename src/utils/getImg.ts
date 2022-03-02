import fs from 'fs';
import request from 'request';
import { proxy, website } from '../test.js';

export function getImg(img: { src: string; index: number; title: string }) {
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
						`D:\\koreanFake\\${website}\\${img.title} ${img.index}.${type}`,
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
