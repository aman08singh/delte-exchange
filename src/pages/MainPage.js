import React, { useEffect, useState } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import { apiCall } from "../utils/apiCall";

export default function MainPage() {
  const [data, setData] = useState([]);
  const [markPrice, setMarkPrice] = useState([]);
  const [pagination, setPagination] = useState({
    low: 0,
    high: 10,
    page: 0,
  });

  async function socketMessage(client) {
    client.onmessage = (message) => {
      const res = JSON.parse(message.data);
      if (res.type === "v2/ticker") {
        console.log("Data is ", res.symbol);
        setMarkPrice((prevState) => [
          ...prevState,
          { markPrice: res.mark_price, symbol: res.symbol },
        ]);
      } else {
        console.log("Non ticker event");
        return;
      }
    };
  }

  async function getProducts() {
    await apiCall("get", "https://api.delta.exchange/v2/products")
      .then((res) => {
        setData(res.data.result);
        return res;
      })
      .then((res) => {
        startSocket(res.data.result);
      })
      .catch((err) => console.log("APi error ", err));
  }

  useEffect(async () => {
    await getProducts();
  }, []);

  async function startSocket(data) {
    const webSocketUrl = "wss://production-esocket.delta.exchange";
    const client = new W3CWebSocket(webSocketUrl);
    const symbols = [];
    data.map((item, index) => {
      symbols.push(item.symbol);
    });
    client.onopen = () => {
      console.log("Websocket connected");
      client.send(
        JSON.stringify({
          type: "subscribe",
          payload: {
            channels: [
              {
                name: "v2/ticker",
                symbols: symbols,
              },
            ],
          },
        })
      );
    };
    socketMessage(client);
  }

  function showMarkPrice(markPrice, symbol) {
    const price = markPrice.find((item) => item.symbol === symbol);
    return price ? price.markPrice : "Loading...";
  }

  return (
    <div className="container">
      <table className="table">
        <thead className="sticky-top bg-info">
          <tr>
            <th>Sr. </th>
            <th>Symbol</th>
            <th>Description</th>
            <th>Underlying Assets</th>
            <th>Mark Price</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.symbol}</td>
                <td>{item.description}</td>
                <td>{item.underlying_asset.symbol}</td>
                {markPrice.length > 0 ? (
                  <td>{showMarkPrice(markPrice, item.symbol)}</td>
                ) : (
                  <div>Loading...</div>
                )}
              </tr>
            ))
          ) : (
            <tr>Loading...</tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
