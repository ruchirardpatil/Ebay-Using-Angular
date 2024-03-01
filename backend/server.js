const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT || 3000;
const axios = require('axios');
const cors = require('cors');
const OAuthToken = require('./ebay_oauth_token');
const mongoose = require('mongoose');

app.use(cors());
app.use(express.json());

module.exports = OAuthToken;
 
const CLIENT_ID = 'RuchiraP-CSCI571A-PRD-7b45afebc-728da885';
const CLIENT_SECRET = 'PRD-b45afebc6efc-cc0f-4a56-917d-66f4'; 
const oauth = new OAuthToken(CLIENT_ID, CLIENT_SECRET);


// mongoose.connect('mongodb+srv://ruchirapatil2000:12345@cluster0.kh4d9gl.mongodb.net/?retryWrites=true&w=majority', { 
//     useNewUrlParser: true, 
//     useUnifiedTopology: true 
// }).then(() => console.log('Connected to MongoDB Atlas'))
// .catch(err => console.error('Could not connect to MongoDB Atlas', err));

mongoose.connect('mongodb+srv://ruchirapatil2000:12345@cluster0.kh4d9gl.mongodb.net/?retryWrites=true&w=majority', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}).then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('Could not connect to MongoDB Atlas', err));

const ItemSchema = new mongoose.Schema({
    itemId: String,
    itemImage: String,
    itemTitle: String,
    itemPrice: String,
    itemShipping: String,
    shippingCost: String,
    shippingLocation: String,
    HandlingTime: String,
    ExpiditedShipping: String,
    OneDayShippingAvailable: String,
    ReturnsAccepted: String,
    sellerName: String,
    feedbackScore: String,
    popularity: String,
    FeedbackRatingStar: String,
    topRated: String,
    StoreName: String,
    BuyProductAt: String
});

const Item = mongoose.model('Item', ItemSchema);


app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

app.get('/wishlist', async (req, res) => {
    const items = await Item.find();
    res.json(items);
});

app.get('/wishlist/ids', async (req, res) => {
    try {
        const items = await Item.find({}, { itemId: 1, _id: 0 });
        const itemIds = items.map(item => item.itemId);
        res.json(itemIds);
    } catch (error) {
        res.status(500).send(error.message);
    }
});
app.post('/wishlist', async (req, res) => {
    const newItem = new Item({
        itemId: req.body.itemId[0],
        itemImage: req.body.itemImage[0],
        itemTitle: req.body.itemTitle,
        itemPrice: req.body.itemPrice,
        itemShipping: req.body.itemShipping,
        shippingCost: req.body.shippingCost,
        shippingLocation: req.body.shippingLocation,
        HandlingTime: req.body.HandlingTime,
        ExpiditedShipping: req.body.ExpiditedShipping,
        OneDayShippingAvailable: req.body.OneDayShippingAvailable,
        ReturnsAccepted: req.body.ReturnsAccepted,
        sellerName: req.body.sellerName,
        feedbackScore: req.body.feedbackScore,
        popularity: req.body.popularity,
        FeedbackRatingStar: req.body.FeedbackRatingStar,
        topRated: req.body.topRated,
        StoreName: req.body.StoreName,
        BuyProductAt: req.body.BuyProductAt

    });
    await newItem.save();
    res.json(newItem);
});

// Delete an item
app.delete('/wishlist/:itemId', async (req, res) => {
    const { itemId } = req.params; 
    await Item.findOneAndDelete({ itemId: itemId }); 
    res.json({ message: 'Item deleted successfully' });
});

app.get('/getautocomplete', function(req, res){
  console.log(req.query);
  let {Keyword} = req.query;
  let url = `http://api.geonames.org/postalCodeSearchJSON?postalcode_startsWith=${Keyword}&maxRows=5&username=ruchira93&country=US`;

  axios.get(url, {
      headers: {
          
          }
          }).then((response) => {
              return res.json(response.data);
          }).catch((error) => {
              return res.json(error);
          })
} )

app.get('/getebaydata', function(req, res) {
  console.log(req.query);
  let {
      keyword,
      category,
      condition, 
      shipping,
      distance,
      zipCode
  } = req.query;

  const base_url = "https://svcs.ebay.com/services/search/FindingService/v1";
  let params = {
      "OPERATION-NAME": "findItemsAdvanced",
      "SERVICE-VERSION": "1.0.0",
      "SECURITY-APPNAME": "RuchiraP-CSCI571A-PRD-7b45afebc-728da885",
      "RESPONSE-DATA-FORMAT": "JSON",
      "REST-PAYLOAD": "",
      "paginationInput.entriesPerPage": "50",
      "keywords": keyword,
      "buyerPostalCode": zipCode,
  };

  if (category && category !== "all") {
      if(category === "art") {
          category = "550";
      }
      else if(category === "baby") {
          category = "2984";
      }
      else if(category === "books") {
          category = "267";
      }
      else if(category === "clothing") {
          category = "11450";
      }
      else if(category === "computer") {
          category = "58058";
      }
      else if(category === "health") {
          category = "26395";
      }
      else if(category === "music") {
          category = "11233";
      }
      else if(category === "video") {
          category = "1249";
      }
      params["categoryId"] = category;
  }

  params["itemFilter(0).name"] = "MaxDistance";
  params["itemFilter(0).value"] = distance | 10;

  let filter_index = 1;

  if (shipping && shipping.includes("FreeShipping")) {
      params[`itemFilter(${filter_index}).name`] = "FreeShippingOnly";
      params[`itemFilter(${filter_index}).value`] = "true";
      filter_index++;
  }

  if (shipping && shipping.includes("LocalPickup")) {
      params[`itemFilter(${filter_index}).name`] = "LocalPickupOnly";
      params[`itemFilter(${filter_index}).value`] = "true";
      filter_index++;
  }

  params[`itemFilter(${filter_index}).name`] = "HideDuplicateItems";
  params[`itemFilter(${filter_index}).value`] = "true";
  filter_index++;

  if (condition && condition.length > 0) {
    let idx = 0;
    params[`itemFilter(${filter_index}).name`] = "Condition";
    if (condition.includes("New")) {
      params[`itemFilter(${filter_index}).value(${idx})`] = "New";
      idx++;
    }
    if (condition.includes("Used")) {
      params[`itemFilter(${filter_index}).value(${idx})`] = "Used";
      idx++;
    }
    if (condition.includes("Unspecified")) {
      params[`itemFilter(${filter_index}).value(${idx})`] = "Unspecified";
      idx++;
    }
    filter_index++;
}

  params["outputSelector(0)"] = "SellerInfo";
  params["outputSelector(1)"] = "StoreInfo";

  axios.get(base_url, { params })
      .then(response => res.json(response.data))
      .catch(error => res.json(error));
});


app.get('/singledata', async function(req, res) {
  console.log(req.query);
  let {itemId} = req.query;
  const token = await oauth.getApplicationToken();
  console.log(token)
  let url = `https://open.api.ebay.com/shopping?callname=GetSingleItem&responseencoding=JSON&appid=RuchiraP-CSCI571A-PRD-7b45afebc-728da885&siteid=0&version=967&ItemID=${itemId}&IncludeSelector=Description,Details,ItemSpecifics`;
  console.log(url);
  axios.get(url, {
      headers: {
          "X-EBAY-API-IAF-TOKEN": token
          }
          }).then((response) => {
              return res.json(response.data);
          }).catch((error) => {
              return res.json(error);
          })
});

app.get('/getphotos', async function(req, res) {

    let {keyword} = req.query;
    let url = `https://www.googleapis.com/customsearch/v1?cx=17dfbc07b828f431c&imgSize=huge&num=8&searchType=image&q=${keyword}&imgSize=huge&key=AIzaSyCbudBd6wcIYZGc-Xuvq5tauIWIT6Uf8Cc`
    console.log(url);
    axios.get(url, {
        headers: {}
    }).then((response) => {
                return res.json(response.data);
      }).catch((error) => {
                return res.json(error);
      })

});

app.get('/similardata', async function(req, res) {
  console.log(req.query);
  let {itemId} = req.query;
  let url = `https://svcs.ebay.com/MerchandisingService?OPERATION-NAME=getSimilarItems&SERVICE-NAME=MerchandisingService&SERVICE-VERSION=1.1.0&CONSUMER-ID=RuchiraP-CSCI571A-PRD-7b45afebc-728da885&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&itemId=${itemId}&maxResults=20`
  console.log(url);

  axios.get(url, {
      headers: {}
  }).then((response) => {
              return res.json(response.data);
    }).catch((error) => {
              return res.json(error);
    })
});


app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});