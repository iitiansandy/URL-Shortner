const urlModel = require("../model/urlModel")
const validUrl = require('valid-url')
const shortId = require('shortId')
const {isValid,isValidBody,isValidUrl}= require("../validation/validation")

const redis = require("redis");

const { promisify } = require("util");

/*________________________________________Connect to redis____________________________________________*/

const redisClient = redis.createClient(
  13221,
  "redis-13221.c264.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("ATVcrAv33hlBmxIRFLORxy7p2GWijTiO", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});


//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


/*________________________________________Creating URL____________________________________________*/

const createUrl = async function (req, res) {

  try {
    const body = req.body
    const { longUrl } = body

    if (!isValidBody(body)) return res.status(400).send({ status: false, message: "Body Should not be empty" })
    if (!("longUrl" in body)) return res.status(400).send({ status: false, message: "LongUrl Is required" })
    
    if (!isValid(longUrl)) return res.status(400).send({ status: false, message: "LongUrl Should not be empty" })
    if (!isValidUrl(longUrl)) return res.status(400).send({ status: false, message: `"${longUrl}" is not a Valid url` })

    let cacheData = await GET_ASYNC(`${longUrl}`)
    if (cacheData) {
      cacheData = JSON.parse(cacheData)
      if (cacheData) return res.status(200).send({ status: true, message: "Already created. Getting this data from the cache", data: cacheData })
    } else {
      let url = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })
      if (url) return res.status(200).send({ status: true, message: "already created. getting this data from the database", data: url })

      shortId.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_=');
      let smallId = shortId.generate(longUrl)
      body.urlCode = smallId
      body.shortUrl = "https://localhost:3000/" + smallId
      let data = await urlModel.create(body)
      let selecteddata = { longUrl: data.longUrl, shortUrl: data.shortUrl, urlCode: data.urlCode }
      await SET_ASYNC(`${longUrl}`, JSON.stringify(selecteddata), 'ex', 60 * 1)
      res.status(201).send({ status: true, message: "Done", data: selecteddata })
    }
  
    } catch (error) {
      return res.status(500).send({ status: false,message: error.message });
    }
  };


/*________________________________________Get Data Using Short URL____________________________________________*/

    const getUrl = async function (req, res) {
        try {

          let urlCode = req.params.urlCode.trim()

          if(!shortid.isValid(urlCode)) return res.status(400).send({status:false,message:"Pls Enter valid urlCode Format"})
          let cachedData = await GET_ASYNC(`${urlCode}`)
          if(cachedData) {
            cachedUrlData = JSON.parse(cachedData);
            return res.status(302).redirect(cachedUrlData.longUrl)
         }
         else {
              let url = await urlModel.findOne({ urlCode })
             if (!url) {
                  return res.status(404).send({ status: false, message: 'No such shortUrl found' })
              }
              await SET_ASYNC(`${urlCode}`, JSON.stringify(url))
              return res.status(302).redirect(url.longUrl)
              }

        }
        catch (error) {
          return res.status(500).send({ status: false, message: error.message });
        }
      };
      
module.exports.createUrl=createUrl
module.exports.getUrl=getUrl