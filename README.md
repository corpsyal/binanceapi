# binanceapi
A rest and websocket api for binance exchange.
 See https://www.binance.com/restapipub.html for more informations about paramaters required.


# Installation
    npm install -s binanceapi

# Rest api
```js
        const api = require('binanceapi') 
        const { Binance } = api
        
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
    
    
    
