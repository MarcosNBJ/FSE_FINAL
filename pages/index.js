import { useState, useEffect } from "react";
import mqtt from "mqtt";
import axios from "axios";
import Sound from "react-sound";

var client;

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [isPlaying, seIsPlaying] = useState(false);

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
    axios.get("api/hello?device=asd&action=activate");
  }

  return (
    <div className={"container"}>
      <button
        title={"Ligar"}
        onClick={() => sendMqttMsg({ device: "foo", action: "bar" })}
      >
        Enviar
      </button>
      <button onClick={() => seIsPlaying(!isPlaying)}> Alarm </button>

      {messages.map((message) => (
        <p>{message}</p>
      ))}

      <Sound
        url="alarm.mp3"
        playStatus={isPlaying ? Sound.status.PLAYING : Sound.status.STOPPED}
        loop="true"
      />
    </div>
  );
}
