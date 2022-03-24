import cheerio from 'cheerio';
import fs from 'fs';
import _ from 'lodash';
import { Circuit } from './stream/Circuit.js';
import { Request } from './stream/request.js';
import { Stream } from './stream/stream.js';
import { getImg } from './utils/getImg.js';
const proxyIP = '127.0.0.1';
const proxyPort = '10809';
export const proxy = 'http://' + proxyIP + ':' + proxyPort;
let headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36 Edg/98.0.1108.62'
};
export let website = 'rule34';
let domain = 'https://www.112w.cc/';
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
let mode = 'missing';
let catalog = mode === 'new'
    ? JSON.parse(fs.readFileSync(String.raw `D:\webDemo\desktop-reader\catalog.json`, 'utf-8'))
    : [];
let missing = mode === 'new'
    ? []
    : JSON.parse(fs.readFileSync(String.raw `D:\webDemo\desktop-reader\missing.json`, 'utf-8'));
let total = catalog.length;
let recentCatalog = _.map(catalog, (e) => e.title).slice(-1000);
let newPacks = [];
let getNewPacks = new Circuit((body) => {
    let $ = cheerio.load(body);
    let images = $('a[title^="后页"]');
    let result = [];
    images.each((i, ele) => {
        let url = $(ele).attr('href');
        if (!url)
            return;
        result.push(domain + url);
    });
    return result;
}, (body) => {
    let $ = cheerio.load(body);
    let links = $('#dlNews a');
    let titles = $('#dlNews a img');
    let result = [];
    links.each((i, ele) => {
        let title = $(titles[i]).attr('alt');
        if (!title)
            return;
        if (title.endsWith('.')) {
            title = title.substring(0, title.length - 1);
        }
        title = title.replace(/[\\/:*?"<>|]/g, '_');
        if (mode !== 'new') {
            if (!_.includes(missing, title)) {
                return;
            }
        }
        else {
            if (_.includes(recentCatalog, title)) {
                return;
            }
            newPacks.push({ title, stared: false, index: total++ });
        }
        console.log(title);
        try {
            fs.mkdirSync(String.raw `D:\img\show_img\图片` + '\\' + title);
        }
        catch (e) { }
        let href = $(ele).attr('href');
        if (!href)
            return;
        result.push({
            url: domain + href,
            title: title,
            current: domain + href
        });
    });
    return result;
}, { max: 63 });
Request.options = { proxy, headers };
getNewPacks.collect('https://www.112w.cc/c49.aspx');
const pages = new Stream((body, data) => {
    let $ = cheerio.load(body);
    let res = $('div.pager a')
        .slice(0, -1)
        .map((i, ele) => {
        let url = $(ele).attr('href');
        if (!url)
            return;
        return {
            url: domain + url,
            title: data.title,
            page: i + 2
        };
    })
        .toArray();
    //console.log(data.title + ' has ' + res.length + ' pages');
    return [{ url: data.current, page: 1, title: data.title }, ...res];
}, { delay: 1500 }, { title: '', url: '', current: '' });
let titles = new Set();
const imgs = new Stream((body, data) => {
    if (data.page === 1) {
        console.log(data.title + ' has got');
    }
    let index = (data.page - 1) * 4 + 1;
    let $ = cheerio.load(body);
    let images = $('#content img');
    let result = [];
    images.each((i, ele) => {
        let src = $(ele).attr('src');
        if (!src)
            return;
        src = domain + src;
        result.push({ src, index: index++, title: data.title });
    });
    return result;
}, { delay: 800 }, { title: '', url: '', page: 0 });
getNewPacks.name = 'getNewPacks';
pages.name = 'pages';
imgs.name = 'img';
getNewPacks
    .next(pages)
    .next(imgs)
    .output((img) => {
    getImg(img);
}, { delay: 200 })
    .close(() => {
    console.log('end');
    if (mode === 'new') {
        fs.writeFileSync(String.raw `D:\webDemo\desktop-reader\catalog.json`, JSON.stringify([...catalog, ...newPacks]));
    }
});
