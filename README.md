# binanceapi
A rest and websocket api for binance exchange.  
See https://www.binance.com/restapipub.html for more informations about paramaters required.  
  
Actually you can :  
  - Getting latest price of a symbol

  - Getting depth of a symbol or maintain a depth cache locally

  - Placing a LIMIT order

  - Placing a MARKET order

  - Checking an order’s status

  - Cancelling an order

  - Getting list of open orders

  - Getting list of current position

More features soon


# Installation
    npm install -s binanceapi

# Sample
```js
        const api = require('binanceapi') 
        const { Binance } = api // rest api
        const { BinanceWS } = api // websocket api
        
        const conf = {
          api: "apiKey here",
          secret: "secretKey here"
        }
        
        const client = new Binance(conf)
        
        client.account()
           .then( (data)=> console.log(data) )
           .catch( (err)=> console.log(err) )
        
        client.depth({symbol: "GASBTC"})
           .then( (data)=> console.log(data) )
           .catch( (err)=> console.log(err) ) 
        
        const clientWS = new BinanceWS()
        
        clientWS.onDepth("GASBTC", (data)=> console.log(data)
 ```
  ## Available rest method
  ```js
    client.allPrices() // get price of all money
    
    
    params = {
      symbol: "GASBTC" // required
    }
    client.depth(params) // depth of a money
    
    
    params = {
      symbol: "GASBTC", // required
      side: "BUY OR SELL", // required
      type: "LIMIT OR MARKET", // required
      timeInForce: "GTC OR IOC", // required
      quantity: 4, // required
      price: 2 // required
    }
    client.newOrder() // create a new order
    
    
    params = {
      symbol: "GASBTC" // required
    }
    client.openOrders(params) // Get all open orders on a symbol
    
    
    params = {
      symbol: "GASBTC" // required
    }
    client.allOrders(params) // Get all open and closed orders on a symbol
    
    
    params = {
      symbol: "GASBTC" // required
    }
    client.statusOrder(params) // Get all account orders; active, canceled, or filled
    
    
    params = {
      symbol: "GASBTC", // required
      newClientOrderId: "a string" // optional
    }
    client.cancelOrder(params) // Cancel an active order
    
    
    client.account() // Get current account information
    
    
    params = {
      symbol: "GASBTC", // required
    }
    client.myTrades(params) // Get trades for a specific account and symbol
    
    
    client.userDataStream() // Start a new user data stream, get a listen key
    
    
    params = {
      listenKey: "listenKey", // required
    }
    client.pingUserDataStream(params) // PING a user data stream to prevent a time out
    
    
    
    params = {
      listenKey: "listenKey", // required
    }
    client.deleteUserDataStream(params) // Close out a user data stream
    
  ```
  
  
  ## Available WebSocket method
  
  
  ```js
  
  clientWS.onDepth("GASBTC", callback) // get depth of a symbol
  
  clientWS.onKline("GASBTC", "1m", callback) // kline endpoint, see kline section for more details
  
  // Get compressed, aggregate trades.
  // Trades that fill at the time, from the same order,
  //with the same price will have the quantity aggregated
  clientWS.onAggTrade("GASBTC", callback) 
  
  binanceRestInstance = new Binance({api: "apiKey", secret: "secretKey"})
  clientWS.onUserData(binanceRestInstance, callback) // get all account event
  
  ```
  
  ## Expected values
  
  Symbol type:  
   SPOT  
   
  Order status:  
   NEW  
   PARTIALLY_FILLED  
   FILLED  
   CANCELED  
   PENDING_CANCEL  
   REJECTED  
   EXPIRED  
  
  Order types:  
    LIMIT  
    MARKET  
  
  Order side:  
    BUY  
    SELL  
   
  Time in force:  
    GTC  
    IOC  
  
  Kline intervals:  

    m -> minutes; h -> hours; d -> days; w -> weeks; M -> months  

    1m  
    3m  
    5m  
    15m  
    30m  
    1h  
    2h  
    4h  
    6h  
    8h  
    12h  
    1d  
    3d  
    1w  
    1M  
  
  
  
  
  
  
