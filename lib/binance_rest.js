"use strict"


const getSignature = require('./signature')


// binanceRequest is used to get an axios instance with default url and default header
let binanceRequest = require('./request')

/**
 * check the type and the api format / length, throw an error if the key provided is not good
 * @param  {String} key api or secret key to check
 * @return {String} or {null}  return the api or secret key if the format is valid, or null if not provided
 */
const checkKey = function(key) {
  if (key && typeof key === "string" && key.length === 64)
    return key

  else if (key)
    throw new SyntaxError(["Bad key format", key].join(" "))

  else
    return null
}


/**
 * used to check the type of an enum parameter
 * @param  {Array} possible  list of good value
 * @param  {String} value    the value to check
 * @param  {String} key      the param name
 * @return {void}
 */
const checkEnum = function(possible, value, key){
  if (possible.indexOf(value) === -1) // to check an enum format
    throw new SyntaxError(key+" is not valid, possible values are "+possible.join(", "))
  return null
}


/**
 * used to check all params provided to a method
 * @param  {Object} data     parameters provided to the method
 * @param  {Array} required  list of parameters required for the method
 * @return {void}
 */
const checkParams = function(data, required){
  if (!data || typeof data !== "object")
    throw new SyntaxError("data args is required and should be an object")

  if (!required || !Array.isArray(required))
    throw new SyntaxError("required args is required and should be an array")

  // we iterate on the required params array
  required.map((req)=>{
    if (!data[req]) // if the param is not provided in the data object provided to the function
      throw new SyntaxError(req+" parameters is required for this method") // we throw an error
  })

  for (let key in data){
    let value = data[key]

    switch (key){
      case 'symbol':
      case 'newClientOrderId':
      case 'origClientOrderId':
      case 'listenKey':
        if (typeof value !== "string")
          throw new TypeError(key+" should be a string")
        break;

      //check for the enum type
      case 'side':
        checkEnum(["BUY", "SELL"], value, key)
        break;
      case 'type':
        checkEnum(["LIMIT", "MARKET"], value, key)
        break;
      case 'timeInForce':
        checkEnum(["GTC", "IOC"], value, key)
        break;

      case 'quantity':
      case 'price':
      case 'stopPrice':
      case 'icebergQty':
      case 'recvWindow':
      case 'fromId':
        if (typeof value !== "number")
          throw new TypeError(key+" should be a number")
        break;
    }

  }
  return null
}

/**
 * Binance instance
 */
class Binance {

  /**
   * constructor of the binance instance
   * @param  {Object} config object with api and secret key or null
   */
  constructor(config = {}){

    const { api, secret, timeout } = config
    this.api = checkKey(api) // check of the apikey format
    this.secret = checkKey(secret) // check of the secret key format

    // get the axios instance with default base url and header with the api key if provided
    this.request = binanceRequest(config)

  }


  /**
   * check if there is an api key before executing a function, throw an error if not
   * @return {void}
   */
  apiRequired(){
    if (!this.api)
      throw new SyntaxError("API key is required for this method")
  }


  /**
   * check if there is an secret key before executing a function, throw an error if not
   * @return {void}
   */
  signedMethod(){ //function word because we need to bind "this" context
    this.apiRequired()
    if (!this.secret)
      throw new SyntaxError("Secret key is required for this method")
  }

  /**
   * build a query string, normal query or signed query
   * @param  {String} link      url of the endpoint
   * @param  {Object} dataQuery an object with all params
   * @return {Object}           an object with two methods, query for normal query, and signed for signed query
   */
  makeQuery(link, dataQuery = {}) {
    this.signedMethod()

    return (function(url, data, secret, timeout){ // return a closure to have a "different" this in each instance of makeQuery()

      if (!url || typeof url !== "string")
        throw "Url is missing and should be a string"

      if (!data || typeof data !== "object")
        throw "Object type required for data param"

      if (data.timestamp)
        delete data.timestamp

      const query = Object.keys(data).map((key)=> {
        return key+"="+data[key]
      })

      this.signedQuery = ()=>{
        if (timeout)
          query.push("recvWindow="+timeout)

        const now = process.env.NODE_ENV === "test" ? 1508279351690 : Date.now() // for unit testing we set a static timestamp
        const queryTimeStamp = [ query.join('&'), "&timestamp="+now ].join("")
        return [ url, "?", queryTimeStamp, "&signature="+getSignature(queryTimeStamp, secret) ].join("")
      }

      this.query = ()=>{
        return [ url, (query.length ? "?" : ""), query.join('&') ].join("")
      }

      return this
    }).call({}, link, dataQuery, this.secret, this.timeout) // bind an empty object as this
  }


  /**
   * get all symbol price
   * @param  {Object} params  symbol concerned or {void} for all price
   */
  allPrices(params = {}){
    const url = 'v1/ticker/allPrices'

    return new Promise(async (resolve, reject)=>{
      try {
        const { data } = await this.request.get(url)
        if (params && typeof params.symbol === "string")
          resolve( data.filter( (sbl) => sbl.symbol === params.symbol ) ) // if a symbol is provided, filter on the result to resolve on the symbol concerned
        else
          resolve(data)
      }
      catch(e){
        reject(e)
      }
    })

  }


  /**
   * get the depth of a symbol
   * @param  {Object} params data provided to methode
   */
  depth(params = {}){
    checkParams(params, ['symbol']) // data required in the params object

    const url = "v1/depth"

    return new Promise(async (resolve, reject)=>{
      try {
        const { data } = await this.request.get(this.makeQuery(url, params).query())
        resolve(data)
      }
      catch(e){
        reject(e && e.response && e.response.data || e)
      }
    })

  }


  /**
   * add new order
   * @param  {Object} params data provided to methode
   */
  newOrder(params = {}){
    this.signedMethod() // secret and api key required for this method

    checkParams(params, ["symbol", "side", "type", "timeInForce", "quantity", "price"]) // data required in the params object

    const url = "v3/order"

    return new Promise(async (resolve, reject)=>{
      try {
        const { data } = await this.request.post(this.makeQuery(url, params).signedQuery())
        resolve(data)
      }
      catch(e){
        reject(e && e.response && e.response.data || e)
      }
    })

  }


  /**
   * list of opened order for symbol provided
   * @param {Object} params data provided to methode
   */
  openOrders(params = {}){
    this.signedMethod() // secret and api key required for this method

    checkParams(params, ["symbol"]) // data required in the params object

    const url = "v3/openOrders"

    return new Promise(async (resolve, reject)=>{
      try {
        const { data } = await this.request.get(this.makeQuery(url, params).signedQuery())
        resolve(data)
      }
      catch(e){
        reject(e && e.response && e.response.data || e)
      }
    })
  }


  /**
   * list of all orders open or closed, for the provided symbol
   * @param {Object} params data provided to methode
   */
  allOrders(params = {}){
    this.signedMethod() // secret and api key required for this method

    checkParams(params, ["symbol"]) // data required in the params object

    const url = "v3/allOrders"

    return new Promise(async (resolve, reject)=>{
      try {
        const { data } = await this.request.get(this.makeQuery(url, params).signedQuery())
        resolve(data)
      }
      catch(e){
        reject(e && e.response && e.response.data || e)
      }
    })
  }


  /**
   * get status order
   * @param {Object} params data provided to methode
   */
  statusOrder(params = {}){
    this.signedMethod() // secret and api key required for this method

    checkParams(params, ["symbol"]) // data required in the params object

    const url = "v3/order"

    return new Promise(async (resolve, reject)=>{
      try {
        const { data } = await this.request.get(this.makeQuery(url, params).signedQuery())
        resolve(data)
      }
      catch(e){
        reject(e && e.response && e.response.data || e)
      }
    })

  }


  /**
   * cancel an order
   * @param {Object} params data provided to methode
   */
  cancelOrder(params = {}){
    this.signedMethod() // secret and api key required for this method

    checkParams(params, ["symbol"]) // data required in the params object

    const url = "v3/order"

    return new Promise(async (resolve, reject)=>{
      try {
        const { data } = await this.request.delete(this.makeQuery(url, params).signedQuery())
        resolve(data)
      }
      catch(e){
        reject(e && e.response && e.response.data || e)
      }
    })

  }


  /**
   * get accound info
   * @param {Object} params data provided to methode
   */
  account(params = {}){
    this.signedMethod() // secret and api key required for this method

    const url = "v3/account"

    return new Promise(async (resolve, reject)=>{
      try {
        const { data } = await this.request.get(this.makeQuery(url, params).signedQuery())
        resolve(data)
      }
      catch(e){
        reject(e && e.response && e.response.data || e)
      }
    })
  }


  /**
   * get list of all trades
   * @param {Object} params data provided to methode
   */
  myTrades(params = {}){
    this.signedMethod() // secret and api key required for this method

    checkParams(params, ["symbol"]) // data required in the params object

    const url = "v3/myTrades"

    return new Promise(async (resolve, reject)=>{
      try {
        const { data } = await this.request.get(this.makeQuery(url, params).signedQuery())
        resolve(data)
      }
      catch(e){
        reject(e && e.response && e.response.data || e)
      }
    })

  }


  /**
   * get a listen key
   * @param {Object} params data provided to methode
   */
  userDataStream(){
    this.apiRequired() // api key required for this method

    const url = "v1/userDataStream"

    return new Promise(async (resolve, reject)=>{
      try {
        const { data } = await this.request.post(this.makeQuery(url, {}).query())
        resolve(data)
      }
      catch(e){
        reject(e && e.response && e.response.data || e)
      }
    })
  }


  /**
   * ping a listen key to prevent a timeout
   * @param {Object} params data provided to methode
   */
  pingUserDataStream(params = {}){
    this.apiRequired() // api key required for this method

    checkParams(params, ["listenKey"]) // data required in the params object

    const url = "v1/userDataStream"

    return new Promise(async (resolve, reject)=>{
      try {
        const { data } = await this.request.put(this.makeQuery(url, params).query())
        resolve(data)
      }
      catch(e){
        reject(e && e.response && e.response.data || e)
      }
    })
  }


  /**
   * delete a listen key
   * @param {Object} params data provided to methode
   */
  deleteUserDataStream(params = {}){
    this.apiRequired() // api key required for this method

    checkParams(params, ["listenKey"]) // data required in the params object

    const url = "v1/userDataStream"

    return new Promise(async (resolve, reject)=>{
      try {
        const { data } = await this.request.delete(this.makeQuery(url, params).query())
        resolve(data)
      }
      catch(e){
        reject(e && e.response && e.response.data || e)
      }
    })
  }


}

if (process.env.NODE_ENV === "test"){ // for unit testing
  exports.checkKey = checkKey
  exports.checkEnum = checkEnum
  exports.checkParams = checkParams
  exports.Binance = Binance
}
else{
  module.exports = Binance
}


