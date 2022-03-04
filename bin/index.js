#!/usr/bin/env node

const { XMLParser } = require('fast-xml-parser/src/fxp');
const { IdGenerator } = require('./id-generator');
const axios = require('axios');
const Schema = require('@sanity/schema');
const fs = require('fs');
let publish = false;
const args = process.argv.slice(2);
args.forEach((val) => {
  if (val === '--publish') {
    publish = true;
    console.log('Publishing to Sanity');
  }
});
const config = JSON.parse(fs.readFileSync('./env.json'));

const api = axios.create({
  baseURL: 'https://bjktnsyb.api.sanity.io/v1/data/mutate/production',
  timeout: 10000,
  headers: {
    'User-Agent': 'blog-client',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
  },
});

let jsonData = '';

const categories = {
  'Alpine Lakes Report': '06340a0c-445b-4dc6-a285-4ab3468ef461',
  'River Rafting': 'd5cbe36c-1b37-4210-be39-fd4986d3de46',
  'Private Events': '4089abd9-98cb-4829-942b-6344e9a1d7fd',
  'Fall Activities': 'c89d86ed-4be8-4148-b868-807a2ee4c7b3',
  'Spring Activities': 'c4cec847-7849-4487-832c-c553df8bf6ff',
  'Summer Activities': 'dc096e0c-743e-4dac-beb6-ba31309e18c7',
  'Downtown Businesses': '33bb439c-551c-4162-87e2-35581d0e7328',
  'Stanley Chamber Blog': null,
  'Ski Report': '4cfa75e0-65ac-49c7-b989-109fcde8a067',
  'Fishing Report': 'bd7816ce-5bd3-4265-9b78-5f3c64dde84f',
  'Winter Activities': '2bfa4570-211c-444c-bfe5-90cd7aa231c1',
};
let blogMutations = [];
let blogs = [];
const supremeParser = new XMLParser();
fs.readFile(__dirname + '/ArticleListEntity.xml', function (err, data) {
  let xmlData = supremeParser.parse(data).DNNGo_xBlog;
  for (let i = 0; i < xmlData.ArticleList.ArticleItem.length; i++) {
    let currentBlog = xmlData.ArticleList.ArticleItem[i];
    const blogCats = currentBlog.Categories.split(';/');
    let finalCats = [];
    blogCats.forEach((cat) => {
      if (categories[cat]) {
        finalCats.push({
          _type: 'reference',
          _ref: categories[cat],
          _key: IdGenerator.generateUniqueStringId(),
        });
      }
    });
    let blog = {
      _type: 'post',
      _id: IdGenerator.generateUniqueStringId(),
      title: currentBlog.Title,
      author: {
        _type: 'reference',
        _ref: '80d4ad62-c0b7-4a8d-8873-a84c89aa1eea',
      },
      categories: finalCats,
      publishedAt: new Date(currentBlog.PublishTime),
      featuredImage: currentBlog.AdditionalPicture,
      seo: {
        title: currentBlog.SearchTitle != '' ? currentBlog.SearchTitle : currentBlog.Title,
        slug: {
          _type: 'slug',
          current: currentBlog.Source.split('/')[3],
        },
        description: currentBlog.SearchDescription != '' ? currentBlog.SearchDescription : currentBlog.Summary,
        noIndex: false,
      },
    };
    if (currentBlog.Status === 1) {
      blogs.push(blog);
      blogMutations.push({ createIfNotExists: blog });
    }
  }
  const reqBody = {
    mutations: blogMutations,
  };
  if (publish) {
    api.post('', reqBody).then((res) => {
      console.log('Successfully published');
    });
  }
  jsonData = JSON.stringify(blogs);
  fs.writeFile('out/data.json', jsonData, () => {
    console.log('data.json created');
    console.log('Dunzzo');
  });
});
