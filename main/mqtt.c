#include <stdio.h>
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include "esp_system.h"
#include "esp_event.h"
#include "esp_netif.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "freertos/queue.h"

#include "lwip/sockets.h"
#include "lwip/dns.h"
#include "lwip/netdb.h"

#include "esp_log.h"
#include "mqtt_client.h"
#include "gpio.h"

#include "mqtt.h"
#include "dht11.h"

#include "cJSON.h"

#define TAG "MQTT"

#define MATRICULA "170017885"

extern xSemaphoreHandle conexaoMQTTSemaphore;
esp_mqtt_client_handle_t client;


char comodo[25];

void handle_received_message(char *message){

    cJSON *messageJSON = cJSON_Parse(message);
    char *command = cJSON_GetObjectItem(messageJSON, "command")->valuestring;
    if(strcmp(command, "toggle_device") == 0){
        toggle_device();
    }
    else if(strcmp(command, "register") == 0){
        strcpy(comodo, cJSON_GetObjectItem(messageJSON, "comodo")->valuestring);
    }
}

static esp_err_t mqtt_event_handler_cb(esp_mqtt_event_handle_t event)
{
    esp_mqtt_client_handle_t client = event->client;
    
    switch (event->event_id) {
        case MQTT_EVENT_CONNECTED:
            ESP_LOGI(TAG, "MQTT_EVENT_CONNECTED");
            xSemaphoreGive(conexaoMQTTSemaphore);
            break;
        case MQTT_EVENT_DISCONNECTED:
            ESP_LOGI(TAG, "MQTT_EVENT_DISCONNECTED");
            break;

        case MQTT_EVENT_SUBSCRIBED:
            ESP_LOGI(TAG, "MQTT_EVENT_SUBSCRIBED, msg_id=%d", event->msg_id);
            break;
        case MQTT_EVENT_UNSUBSCRIBED:
            ESP_LOGI(TAG, "MQTT_EVENT_UNSUBSCRIBED, msg_id=%d", event->msg_id);
            break;
        case MQTT_EVENT_PUBLISHED:
            ESP_LOGI(TAG, "MQTT_EVENT_PUBLISHED, msg_id=%d", event->msg_id);
            break;
        case MQTT_EVENT_DATA:
            ESP_LOGI(TAG, "MQTT_EVENT_DATA");
            handle_received_message(event->data);
            break;
        case MQTT_EVENT_ERROR:
            ESP_LOGI(TAG, "MQTT_EVENT_ERROR");
            break;
        default:
            ESP_LOGI(TAG, "Other event id:%d", event->event_id);
            break;
    }
    return ESP_OK;
}

static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data) {
    ESP_LOGD(TAG, "Event dispatched from event loop base=%s, event_id=%d", base, event_id);
    mqtt_event_handler_cb(event_data);
}

void mqtt_start()
{
    esp_mqtt_client_config_t mqtt_config = {
        .uri = "mqtt://test.mosquitto.org",
    };
    client = esp_mqtt_client_init(&mqtt_config);
    esp_mqtt_client_register_event(client, ESP_EVENT_ANY_ID, mqtt_event_handler, client);
    esp_mqtt_client_start(client);
}

void mqtt_envia_mensagem(char * topico, char * mensagem)
{
    int message_id = esp_mqtt_client_publish(client, topico, mensagem, 0, 1, 0);
    ESP_LOGI(TAG, "Mesnagem enviada, ID: %d", message_id);

}

char *get_my_id(){
	uint8_t baseMac[6] = {0};
	esp_efuse_mac_get_default (baseMac);
    char *baseMacChr = calloc(18, sizeof(char));
	sprintf(baseMacChr, "%02X:%02X:%02X:%02X:%02X:%02X", baseMac[0], baseMac[1], baseMac[2], baseMac[3], baseMac[4], baseMac[5]);
	return baseMacChr;
}

void register_device(){
    
    char *myID = get_my_id();

    cJSON *registerMessageJSON = cJSON_CreateObject();
    cJSON_AddStringToObject(registerMessageJSON, "id", myID);
    cJSON_AddStringToObject(registerMessageJSON, "mode", "default");

    char *registerMessage = cJSON_Print(registerMessageJSON);
    
    char mqtt_topic[50];
    sprintf(mqtt_topic, "fse2020/%s/dispositivos/%s", MATRICULA, myID);

    mqtt_envia_mensagem(mqtt_topic, registerMessage);
    esp_mqtt_client_subscribe(client, mqtt_topic, 0);
}

void mqtt_publish_dht11(void *params)
{
    if (xSemaphoreTake(conexaoMQTTSemaphore, portMAX_DELAY))
    {    

        while (1)
        {
            struct dht11_reading dht11 = DHT11_read();
            if (strlen(comodo) != 0 && dht11.status == 0)
            {

                char *myID = get_my_id();

                cJSON *temperatureJSON = cJSON_CreateObject();
                cJSON_AddStringToObject(temperatureJSON, "id", myID);
                cJSON_AddNumberToObject(temperatureJSON, "temperature", dht11.temperature);
                char *temperatureMessage = cJSON_Print(temperatureJSON);
                
                char temperatureTopic[60];
                sprintf(temperatureTopic, "fse2020/%s/%s/temperatura", MATRICULA, comodo);

                mqtt_envia_mensagem(temperatureTopic, temperatureMessage);


                cJSON *humidityJSON = cJSON_CreateObject();
                cJSON_AddStringToObject(humidityJSON, "id", myID);
                cJSON_AddNumberToObject(humidityJSON, "humidity", dht11.humidity);
                char *humidityMessage = cJSON_Print(humidityJSON);
                
                char humidityTopic[60];
                sprintf(humidityTopic, "fse2020/%s/%s/umidade", MATRICULA, comodo);

                mqtt_envia_mensagem(humidityTopic, humidityMessage);
                
            }

            vTaskDelay(2000 / portTICK_PERIOD_MS);
        }
    }

}

void toggleSensorState(){
     if (strlen(comodo) != 0)
    {    
        char *myID = get_my_id();
        cJSON *sensorMessageJSON = cJSON_CreateObject();
        cJSON_AddStringToObject(sensorMessageJSON, "id", myID);
        cJSON_AddStringToObject(sensorMessageJSON, "event", "toggle_sensor");

        char *sensorMessage = cJSON_Print(sensorMessageJSON);
        
        char eventTopic[60];
        sprintf(eventTopic, "fse2020/%s/%s/estado", MATRICULA, comodo);

        mqtt_envia_mensagem(eventTopic, sensorMessage);
    }
}