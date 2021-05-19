import { useState, useEffect } from "react";
import mqtt from "mqtt";
import axios from "axios";
import Sound from "react-sound";

var client;

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [isPlaying, seIsPlaying] = useState(false);
  const [toRegister, setToRegister] = useState([]);
  const [devices, setDevices] = useState({});
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
      const deviceID = messageJSON.id;
      if (topic.split("/").slice(-2, -1)[0] == "dispositivos") {
        if (deviceID && !Object.keys(devices).includes(deviceID)) {
          setToRegister([...toRegister, deviceID]);
        }
      } else if (topic.split("/").pop() == "temperatura") {
        setDevices({
          ...devices,
          [deviceID]: { ...devices.deviceID, temp: messageJSON.temperature },
        });
      } else if (topic.split("/").pop() == "umidade") {
        setDevices({
          ...devices,
          [deviceID]: { ...devices.deviceID, hum: messageJSON.humidity },
        });
      }
    });

    return () => {
      if (client) {
        client.unsubscribe("hagoromo34");
        client.end(client);
      }
    };
  }, [toRegister, devices]);

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
    setToRegister((toRegister) => toRegister.filter((id) => id !== deviceID));
    setDevices({
      ...devices,
      [deviceID]: { comodo: comodo, temp: 0, hum: 0, sensor: 0, led: 0 },
    });
  };

  const toggleDevice = (deviceID) => {
    const toggleMessageTopic = `${baseTopic}/dispositivos/${deviceID}`;
    const toggleMessage = { command: "toggle_device" };
    sendMqttMsg(toggleMessageTopic, toggleMessage);
  };

  return (
    <div className="container" style={{ display: "flex" }}>
      <div style={{ paddingRight: "100px" }}>
        <h2>Dispositivos disponíveis para cadastro</h2>

        {toRegister.map((device) => (
          <form key={device} onSubmit={handleRegistration}>
            <p style={{ display: "inline-block", fontSize: "20px" }}>
              MAC: {device}
            </p>
            <input type="hidden" name="id" value={device} />
            <button
              className="btn btn-sm btn-success"
              style={{ marginLeft: "10px" }}
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

        {Object.keys(devices).map((device, i) => (
          <div>
            <h4 style={{ display: "inline-block" }}>
              {devices[device].comodo}
            </h4>
            <p>
              Temperatura: {devices[device].temp} Humindade:
              {devices[device].hum}
            </p>
            <p>
              Lampada:
              {devices[device].led ? (
                <button
                  onClick={() => toggleDevice(device)}
                  className="btn btn-sm btn-success"
                >
                  Ligada
                </button>
              ) : (
                <button
                  onClick={() => toggleDevice(device)}
                  className="btn btn-sm btn-danger"
                >
                  Desligada
                </button>
              )}
            </p>
            <p>
              Sensor:
              {devices[device].sensor ? (
                <img
                  style={{ width: "20px" }}
                  src="https://upload.wikimedia.org/wikipedia/commons/1/13/Disc_Plain_red.svg"
                ></img>
              ) : (
                <img
                  style={{ width: "20px" }}
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Disc_Plain_green.svg/460px-Disc_Plain_green.svg.png"
                ></img>
              )}
            </p>
          </div>
        ))}
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
