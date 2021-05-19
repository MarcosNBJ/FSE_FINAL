import { useState, useEffect } from "react";
import mqtt from "mqtt";
import axios from "axios";
import Sound from "react-sound";

var client;

export default function Home() {
  const [isPlaying, seIsPlaying] = useState(false);
  const [toRegister, setToRegister] = useState([]);
  const [devices, setDevices] = useState({});
  const baseTopic = "fse2020/170017885";
  const [alarm, setAlarm] = useState(false);

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
      //console.log(message.toString());
      const messageJSON = JSON.parse(message.toString());
      const deviceID = messageJSON.id;
      if (topic.split("/").slice(-2, -1)[0] == "dispositivos") {
        if (deviceID && !Object.keys(devices).includes(deviceID)) {
          setToRegister([...toRegister, deviceID]);
        }
      } else if (topic.split("/").pop() == "temperatura") {
        setDevices((prevState) => ({
          ...prevState,
          [deviceID]: { ...prevState[deviceID], temp: messageJSON.temperature },
        }));
      } else if (topic.split("/").pop() == "umidade") {
        setDevices((prevState) => ({
          ...prevState,
          [deviceID]: { ...prevState[deviceID], hum: messageJSON.humidity },
        }));
      } else if (topic.split("/").pop() == "estado") {
        setDevices((prevState) => ({
          ...prevState,
          [deviceID]: {
            ...prevState[deviceID],
            sensor: !prevState[deviceID].sensor,
          },
        }));
        seIsPlaying(true);
        axios.get(`api/logger?device=${deviceID}&action=alarm`);
      }
    });

    return () => {
      if (client) {
        client.end(client);
      }
    };
  }, []);

  useEffect(() => {
    if (!alarm && isPlaying) seIsPlaying(false);
  }, [alarm, isPlaying]);

  function sendMqttMsg(topic, content) {
    if (client) client.publish(topic, JSON.stringify(content));
  }

  const handleRegistration = (event) => {
    event.preventDefault();
    const comodo = event.target.comodo.value;
    const deviceID = event.target.id.value;
    const led_name = event.target.led_name.value;
    sendMqttMsg(`${baseTopic}/dispositivos/${deviceID}`, {
      command: "register",
      comodo: comodo,
    });
    axios.get(`api/logger?device=${deviceID}&action=register`);
    setToRegister((toRegister) => toRegister.filter((id) => id !== deviceID));
    setDevices((prevState) => ({
      ...prevState,
      [deviceID]: {
        comodo: comodo,
        temp: 0,
        hum: 0,
        sensor: 0,
        led: 0,
        led_name: led_name,
      },
    }));
  };

  const toggleDevice = (deviceID) => {
    const toggleMessageTopic = `${baseTopic}/dispositivos/${deviceID}`;
    const toggleMessage = { command: "toggle_device" };
    sendMqttMsg(toggleMessageTopic, toggleMessage);
    const currentState = devices[deviceID].led;
    setDevices((prevState) => ({
      ...prevState,
      [deviceID]: { ...prevState[deviceID], led: !currentState },
    }));
    axios.get(`api/logger?device=${deviceID}&action=activate_led`);
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
            <input
              name="led_name"
              style={{ width: "300px" }}
              type="text"
              className="form-control"
              placeholder="Dispositivo controlado"
            />
          </form>
        ))}
      </div>

      <div style={{ paddingRight: "100px" }}>
        <h2>Dashboard</h2>

        {Object.keys(devices).map((device, i) => (
          <div key={device}>
            <h4 style={{ display: "inline-block" }}>
              {devices[device].comodo}
            </h4>
            <p>
              Temperatura: {devices[device].temp} Humindade:
              {devices[device].hum}
            </p>
            <p>
              {devices[device].led_name}
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
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Disc_Plain_green.svg/460px-Disc_Plain_green.svg.png"
                ></img>
              ) : (
                <img
                  style={{ width: "20px" }}
                  src="https://upload.wikimedia.org/wikipedia/commons/1/13/Disc_Plain_red.svg"
                ></img>
              )}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2>Alarme</h2>
        {alarm ? (
          <button
            onClick={() => setAlarm(false)}
            className="btn btn-sm btn-success"
          >
            Armado
          </button>
        ) : (
          <button
            onClick={() => setAlarm(true)}
            className="btn btn-sm btn-danger"
          >
            Desarmado
          </button>
        )}
      </div>

      <Sound
        url="alarm.mp3"
        playStatus={isPlaying ? Sound.status.PLAYING : Sound.status.STOPPED}
        loop={true}
      />
    </div>
  );
}
