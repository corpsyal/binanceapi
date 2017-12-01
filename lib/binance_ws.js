"use strict"

const WebSocket = require('ws')

const baseURL = "wss://stream.binance.com:9443/ws/" // base url used for websocket

const sockets = {} // Object to keep socket reference to prevent multiple declaration

const Binance = require('./binance_rest')
/**
 * start new socket and save reference, return the reference or create new if needed
 * @param  {String}   path     path of websocket
 * @param  {Function} callback function to execute with received data
 * @return {Websocket}         a websocket instance
 */
let initSocket = function(path, callback){
  if (!path || typeof path !== "string")
    throw "path is required and should be a string"

  if (!callback || typeof callback !== "function")
    throw "callback is required and should be a function"

  if (sockets[path]) // if an reference exist
    return sockets[path] // return it
  else {
    const ws = new WebSocket([ baseURL, path ].join("")) // create websocket instance
    ws.on('message', callback) // bind callback with received data
    sockets[path] = ws // save the reference
    return ws
  }
}

/**
 * Binance Websocket instance
 */
class BinanceWS {

  /**
   * get depth of a symbol
   * @param  {String}   symbol   symbol concerned
   * @param  {Function} callback function used with received data
   */
  onDepth(symbol, callback){
    initSocket( [ symbol.toLowerCase(), "@depth" ].join(""), callback)
  }

  /**
   * get ticker of a symbol, with different interval
   * @param  {String}   symbol   symbol concerned
   * @param  {String}   interval interval needed
   * @param  {Function} callback function used with received data
   */
  onKline(symbol, interval, callback){
    initSocket( [ symbol.toLowerCase(), "@kline_", interval ].join(""), callback)
  }


  /**
   * get all trade info of a symbol
   * @param  {String}   symbol   symbol concerned
   * @param  {Function} callback function used with received data
   */
  onAggTrade(symbol, callback){
    initSocket( [ symbol.toLowerCase(), "@aggTrade" ].join(""), callback)
  }

  /**
   * get all info about the user, trade, update account info (balance etc..),  order
   * @param  {Binance}   binanceRestInstance a Binance rest instance
   * @param  {Function}  callback            function used with received data
   */
  onUserData(binanceRestInstance, callback){
    if(!(binanceRestInstance instanceof Binance))
      throw new SyntaxError("First param must be a binance rest instance")

    if (!binanceRestInstance.api)
      throw new SyntaxError("An api key is required")

    return (async ()=>{
      try{
        const data = await binanceRestInstance.userDataStream() // get an listen key
        if (data && data.listenKey){
          setInterval(()=>{
            binanceRestInstance.pingUserDataStream(data).then((resp)=>console.log(resp)) // ping every 60 seconde to prevent timeout
          }, 60000)
          initSocket(data.listenKey, callback)
        }
      }
      catch(e){
        console.log(e)
        throw e
      }
    })()
  }

}

if (process.env.NODE_ENV === "test"){ // for unit testing
  exports.initSocket = initSocket
  exports.sockets = sockets
  exports.BinanceWS = BinanceWS
}
else{
  module.exports = BinanceWS
}
