#!/usr/bin/env node

const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser/src/fxp");
const { IdGenerator } = require("./id-generator");
const { DOMParser } = require("xmldom");
const blockTools = require("@sanity/block-tools");
const Schema = require("@sanity/schema");

// Start with compiling a schema we can work against
const defaultSchema = Schema.default.compile({
  name: "myBlog",
  types: [
    {
      type: "object",
      name: "blogPost",
      fields: [
        {
          title: "Title",
          type: "string",
          name: "title",
        },
        {
          title: "Body",
          name: "body",
          type: "array",
          of: [{ type: "block" }],
        },
      ],
    },
  ],
});

// The compiled schema type for the content type that holds the block array
const blockContentType = defaultSchema.get("blogPost").fields.find((field) => field.name === "body").type;
const categories = {
  "Food Allergy": "1ce33a4c-0eed-46e0-b362-62a5f15b4366",
  "Healthy Skins": "drafts.0f6afb52-df81-4409-86b7-77b9447ac7ce",
  "Allergy Testing": "drafts.28a3cb2c-227d-40a6-b129-b82a3cf895e6",
  Allergy: "drafts.61c406d4-29a9-480d-8777-2c8f441d2ad2",
  Vaccines: "drafts.6865fb8d-d0a4-4ab0-9e75-8045f226f831",
  "Allergy Treatment": "drafts.6d7843f9-aed2-47f4-8ed7-425d932621e1",
  "Seasonal Allergies": "drafts.8529261b-d5d8-4760-985a-ae05e1109a86",
  Gluten: "drafts.92d60a04-3961-4422-9890-d5f9acdca824",
  "Immune System Disorder": "drafts.b1729a21-8587-4a6c-8c7b-5a9c5c8e069f",
  Headache: "drafts.dc0b4d3f-4d4a-4f6c-9617-e93fec9736f7",
  Asthma: "drafts.dfa462db-21a8-46e1-b40a-5376d6604c62",
  "Allergy Group News": "drafts.ffc2a451-195c-4967-b644-bcdadfc9931e",
};

const supremeParser = new XMLParser();
var fs = require("fs"),
  xml2js = require("xml2js");
var parser = new xml2js.Parser();
fs.readFile(__dirname + "/ArticleListEntity.xml", function (err, data) {
  let xmlData = supremeParser.parse(data).DNNGo_xBlog;
  let currentBlog = xmlData.ArticleList.ArticleItem[6];
  console.log(blockTools.htmlToBlocks(currentBlog.ContentText, blockContentType, { DOMParser }));
  const blogCats = currentBlog.Categories.split(";/");
  let finalCats = [];
  blogCats.forEach((cat) => {
    finalCats.push({
      _type: "reference",
      _ref: categories[cat],
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
    body: {},
    seo: {
      title: currentBlog.SearchTitle,
      slug: {
        _type: "slug",
        current: currentBlog.Source.split("/")[3],
      },
      description: currentBlog.SearchDescription,
    },
  };
  console.log(blog);
});
console.log("Hello!");