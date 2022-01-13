#!/usr/bin/env node

const { XMLParser } = require("fast-xml-parser/src/fxp");
const { IdGenerator } = require("./id-generator");
const axios = require("axios");
const Schema = require("@sanity/schema");
const fs = require("fs");
let publish = false;
const args = process.argv.slice(2);
args.forEach((val) => {
  if (val === "--publish") {
    publish = true;
    console.log("Publishing to Sanity");
  }
});
const config = JSON.parse(fs.readFileSync("./env.json"));

const api = axios.create({
  baseURL: "https://1054cqfs.api.sanity.io/v1/data/mutate/production",
  timeout: 10000,
  headers: {
    "User-Agent": "blog-client",
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  },
});

let jsonData = "";

const categories = {
  "Food Allergy": "1ce33a4c-0eed-46e0-b362-62a5f15b4366",
  "Healthy Skins": "0f6afb52-df81-4409-86b7-77b9447ac7ce",
  "Allergy Testing": "28a3cb2c-227d-40a6-b129-b82a3cf895e6",
  Allergy: "61c406d4-29a9-480d-8777-2c8f441d2ad2",
  Vaccines: "6865fb8d-d0a4-4ab0-9e75-8045f226f831",
  "Allergy Treatment": "6d7843f9-aed2-47f4-8ed7-425d932621e1",
  "Seasonal Allergies": "8529261b-d5d8-4760-985a-ae05e1109a86",
  Gluten: "92d60a04-3961-4422-9890-d5f9acdca824",
  "Immune System Disorder": "b1729a21-8587-4a6c-8c7b-5a9c5c8e069f",
  Headache: "dc0b4d3f-4d4a-4f6c-9617-e93fec9736f7",
  Asthma: "dfa462db-21a8-46e1-b40a-5376d6604c62",
  "Allergy Group News": "ffc2a451-195c-4967-b644-bcdadfc9931e",
};
let blogMutations = [];
let blogs = [];
const supremeParser = new XMLParser();
fs.readFile(__dirname + "/ArticleListEntity.xml", function (err, data) {
  let xmlData = supremeParser.parse(data).DNNGo_xBlog;
  for (let i = 0; i < xmlData.ArticleList.ArticleItem.length; i++) {
    let currentBlog = xmlData.ArticleList.ArticleItem[i];
    const blogCats = currentBlog.Categories.split(";/");
    let finalCats = [];
    blogCats.forEach((cat) => {
      finalCats.push({
        _type: "reference",
        _ref: categories[cat],
        _key: IdGenerator.generateUniqueStringId(),
      });
    });
    let blog = {
      _type: "post",
      _id: IdGenerator.generateUniqueStringId(),
      title: currentBlog.Title,
      author: {
        _type: "reference",
        _ref: "c6e67581-dfa8-40f7-89ee-55351244b4bf",
      },
      mainImage: {},
      categories: finalCats,
      publishedAt: currentBlog.PublishTime,
      // body: {},
      seo: {
        title: currentBlog.SearchTitle,
        slug: {
          _type: "slug",
          current: currentBlog.Source.split("/")[3],
        },
        description: currentBlog.SearchDescription,
      },
    };
    blogs.push(blog);
    blogMutations.push({ createIfNotExists: blog });
  }
  const reqBody = {
    mutations: blogMutations,
  };
  if (publish) {
    api.post("", reqBody).then((res) => {
      console.log("Successfully published");
    });
  }
  jsonData = JSON.stringify(blogs);
  fs.writeFile("out/data.json", jsonData, () => {
    console.log("data.json created");
    console.log("Dunzzo");
  });
});
