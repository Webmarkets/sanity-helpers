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
  Lodging: '7d45bc01-0e4f-4839-929d-9301d185f68f',
  'RV Parks & Campgrounds': '12b8624d-99dc-46ff-acbc-ce3bafcd21f4',
  'RV Parks': '12b8624d-99dc-46ff-acbc-ce3bafcd21f4',
  'Real Estate': '01ab4d13-481b-46ab-ae1f-2ee769a16473',
  'Transportation Services': '019dcbd7-8e74-4d3d-b9b1-e6cdbaa523eb',
  Restaurants: '2316bc01-ada0-4bea-9922-230139182283',
  'Bars & Catering': '2316bc01-ada0-4bea-9922-230139182283',
  ' Bars & Catering': '2316bc01-ada0-4bea-9922-230139182283',
  'Restaurants, Bars & Catering': '2316bc01-ada0-4bea-9922-230139182283',
  'Religious Services': '7c1edaf9-1af7-43c5-8428-4a265dfe5d8f',
  'Community Services': '2945c6d1-69e7-4112-88b6-66de5e86760d',
  'Photography & Wedding Services': 'c0fa95d4-cabf-4b78-a153-3deb5108210a',
  'Contractors & Construction': '3a438cb7-f2f9-493d-9cb5-733a883f871d',
  'Recreation Services': '1c73b011-1228-4712-9674-5e05ce98e995',
  'Other Services': '8066cdaa-dc72-458f-bd64-c87f0921cd41',
  ' Non-Profit': '8066cdaa-dc72-458f-bd64-c87f0921cd41',
  'Shops & Distributors': '710a1680-1b5b-4d97-ae5e-3527bfffa4db',
  ' Shops & Distributors': '710a1680-1b5b-4d97-ae5e-3527bfffa4db',
  Stores: '710a1680-1b5b-4d97-ae5e-3527bfffa4db',
  ' Campgrounds & Reunion Facilities': '12b8624d-99dc-46ff-acbc-ce3bafcd21f4',
};
let businessMutations = [];
let allTheBusinesses = [];
const supremeParser = new XMLParser();
fs.readFile(__dirname + '/BusinessDirectory.xml', function (err, data) {
  let xmlData = supremeParser.parse(data).WMO_BusinessDirectory;
  const businesses = xmlData.XmlSliserEntityList.XmlSliserEntityItem;

  for (let i = 0; i < businesses.length; i++) {
    let currentBusiness = businesses[i];
    let finalCats = [];
    if (currentBusiness.Groups) {
      const businessCats = currentBusiness.Groups.split(',');
      businessCats.forEach((cat) => {
        const ref = categories[cat] ? categories[cat] : cat;
        finalCats.push({
          _type: 'reference',
          _ref: ref,
          _key: IdGenerator.generateUniqueStringId(),
        });
      });
    }
    currentBusiness.Options = JSON.parse(currentBusiness.Options);
    let business = {
      _type: 'business',
      _id: IdGenerator.generateUniqueStringId(),
      name: currentBusiness.Options.Title,
      slug: {
        _type: 'slug',
        current: currentBusiness.Options.FriendlyUrl,
      },
      logo: currentBusiness.Options.Picture,
      description: currentBusiness.Options.Description,
      address: {
        street: currentBusiness.Options.Street,
        city: currentBusiness.Options.City,
        state: currentBusiness.Options.State,
        zip: currentBusiness.Options.Zip,
      },
      phone: currentBusiness.Options.ContactNumber,
      websiteLink: currentBusiness.Options.WebSite,
      email: currentBusiness.Options.Email,
      goldMember: false,
      openFall: true,
      openSpring: true,
      openWinter: true,
      categories: finalCats,
      facebookLink: currentBusiness.Options.flink,
      twitterLink: currentBusiness.Options.tlink,
      instagramLink: currentBusiness.Options.ilink,
    };
    businessMutations.push({ createIfNotExists: business });
    allTheBusinesses.push(business);
  }
  const reqBody = {
    mutations: businessMutations,
  };
  if (publish) {
    api.post('', reqBody).then((res) => {
      console.log('Successfully published');
    });
  }
  jsonData = JSON.stringify(allTheBusinesses);
  fs.writeFile('out/data.json', jsonData, () => {
    console.log('Dunzzo');
  });
});
