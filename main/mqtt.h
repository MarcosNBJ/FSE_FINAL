#ifndef MQTT_H
#define MQTT_H

void mqtt_start();

void mqtt_envia_mensagem(char * topico, char * mensagem);
void register_device();
void mqtt_publish_dht11(void *params);
void toggleSensorState();
#endif