
"use strict"

const assert = require('assert')
const expect = require('chai').expect
const api = require('../.')
const wsAPI = api.BinanceWS

  describe('Binance Websocket', function() {
    // close all sockets connection
    after(function(){
      for (let s in sockets){
        try{
          sockets[s].close()
        }
        catch(e){}
      }
    })

    const { initSocket, sockets, BinanceWS } = wsAPI

    it('Call without param - should throw an exception', function() {
      expect( function(){  initSocket() }).to.throw("path is required and should be a string")
    })

    it('Call without callback - should throw an exception', function() {
      expect( function(){  initSocket("test") }).to.throw("callback is required and should be a function")
    })

    it('Call with path and callback - should be ok', function() {
      const ws = initSocket( [ "GASBTC".toLowerCase(), "@depth" ].join(""), function(){})
      expect(sockets).to.have.property('gasbtc@depth')
      expect(sockets["gasbtc@depth"].url).to.equal("wss://stream.binance.com:9443/ws/gasbtc@depth")
    })

    it('Call multiple same event - sockets length should be 1', function() {
      const ws = initSocket( [ "GASBTC".toLowerCase(), "@depth" ].join(""), function(){})
      const ws2 = initSocket( [ "GASBTC".toLowerCase(), "@depth" ].join(""), function(){})
      expect(sockets).to.have.property('gasbtc@depth')
      expect(sockets["gasbtc@depth"].url).to.equal("wss://stream.binance.com:9443/ws/gasbtc@depth")
      expect(Object.keys(sockets).length).to.equal(1)
    })

  })