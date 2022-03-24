import fs from 'fs';
import request from 'request';
import { proxy } from '../test.js';

export function getImg(img: { src: string; index: number; title: string }) {
	try {
		request({ url: img.src, proxy: proxy })
			.on('error', (err) => {
				console.error(err);
				console.log(img.title);
			})
			.pipe(
				fs
					.createWriteStream(
						String.raw`D:\img\show_img\图片` +
							`\\${img.title}\\${img.index}.jpg`,
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
	} catch (error) {
		console.error(error);
		console.log(img + ' download Error');
	}
}
