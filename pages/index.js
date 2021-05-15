import { useState, useEffect } from "react";
import mqtt from "mqtt";
var client;

export default function Home() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    client = mqtt.connect(
      "wss://test.mosquitto.org:8081",
      "fse2020170017885" + Math.random()
    );

    client.on("connect", function () {
      console.log("conectado");
    });

    client.subscribe("hagoromo34");
    client.on("message", (topic, message) => {
      setMessages([...messages, message.toString()]);
    });
    return () => {
      if (client) {
        client.unsubscribe("hagoromo34");
        client.end(client);
      }
    };
  }, [messages]);

  function sendMqttMsg(content) {
    if (client) client.publish("hagoromo34", JSON.stringify(content));
  }

  return (
    <div className={"container"}>
      <button title={"Ligar"} onClick={() => sendMqttMsg({ foo: "bar" })} />

      {messages.map((message) => (
        <p>{message}</p>
      ))}
    </div>
  );
}
