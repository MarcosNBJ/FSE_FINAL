import { useState, useEffect } from "react";
import mqtt from "mqtt";
import axios from "axios";
import Sound from "react-sound";

var client;

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [isPlaying, seIsPlaying] = useState(false);
  const [toRegister, setToRegister] = useState([]);
  const baseTopic = "fse2020/170017885";

  useEffect(() => {
    client = mqtt.connect(
      "wss://test.mosquitto.org:8081",
      "fse2020170017885" + Math.random()
    );

    client.on("connect", function () {
      console.log("conectado");
    });

    client.subscribe("fse2020/170017885/#");
    client.on("message", (topic, message) => {
      const messageJSON = JSON.parse(message.toString());
      console.log(topic);
      if (topic.split("/").slice(-2, -1)[0] == "dispositivos") {
        if (!toRegister.includes(messageJSON.id)) {
          setToRegister([...toRegister, messageJSON.id]);
        }
      }
    });

    return () => {
      if (client) {
        client.unsubscribe("hagoromo34");
        client.end(client);
      }
    };
  }, [toRegister]);

  function sendMqttMsg(topic, content) {
    if (client) client.publish(topic, JSON.stringify(content));
    //axios.get("api/hello?device=asd&action=activate");
  }

  const handleRegistration = (event) => {
    event.preventDefault();
    const comodo = event.target.comodo.value;
    const deviceID = event.target.id.value;
    sendMqttMsg(`${baseTopic}/dispositivos/${deviceID}`, {
      command: "register",
      comodo: comodo,
    });
  };

  return (
    <div className="container" style={{ display: "flex" }}>
      <div style={{ paddingRight: "100px" }}>
        <h2>Dispositivos disponíveis para cadastro</h2>

        {toRegister.map((device) => (
          <form onSubmit={handleRegistration}>
            <p style={{ display: "inline-block", fontSize: "20px" }}>
              MAC: {device}
            </p>
            <input type="hidden" name="id" value={device} />
            <button
              className="btn btn-sm btn-success"
              style={{ "margin-left": "10px" }}
            >
              Cadastrar
            </button>
            <input
              name="comodo"
              style={{ width: "300px" }}
              type="text"
              className="form-control"
              placeholder="Comodo do dispositivo"
            />
          </form>
        ))}
      </div>

      <div style={{ paddingRight: "100px" }}>
        <h2>Dashboard</h2>
        <div>
          <h4 style={{ display: "inline-block" }}>Cozinha</h4>
          <p>Temperatura: 25 Humindade: 40</p>
          <p>
            Lampada: <button className="btn btn-sm btn-success">Ligada</button>
          </p>
          <p>
            Sensor:{" "}
            <img
              style={{ width: "20px" }}
              src="https://upload.wikimedia.org/wikipedia/commons/1/13/Disc_Plain_red.svg"
            ></img>
            {/* <img
              style={{ width: "20px" }}
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Disc_Plain_green.svg/460px-Disc_Plain_green.svg.png"
            ></img> */}
          </p>
        </div>
      </div>

      <div>
        <h2>Alarme</h2>
      </div>

      {/* <button
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
      /> */}
    </div>
  );
}
