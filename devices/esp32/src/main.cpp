#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <time.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* MQTT_HOST = "192.168.1.100"; // replace with your MQTT broker IP address
const int MQTT_PORT = 1883;

const char* DEVICE_ID = "esp32-001";

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

void connectWiFi();
void connectMQTT();
String getTimestamp();

void setup() {
    Serial.begin(115200);

    connectWiFi();

    configTime(
        0,
        0,
        "pool.ntp.org",
        "time.nist.gov"
    );

    mqttClient.setServer(
        MQTT_HOST,
        MQTT_PORT
    );
}

void loop() {
    if (!mqttClient.connected()) {
        connectMQTT();
    }

    mqttClient.loop();

    float temperature =
        20.0 + (random(0, 150) / 10.0);

    float humidity =
        40.0 + (random(0, 500) / 10.0);

    String topic =
        String("iotflow/devices/") +
        DEVICE_ID +
        "/telemetry";

    String payload = "{";
    payload += "\"deviceId\":\"" +
               String(DEVICE_ID) + "\",";
    payload += "\"timestamp\":\"" +
               getTimestamp() + "\",";
    payload += "\"temperature\":" +
               String(temperature, 2) + ",";
    payload += "\"humidity\":" +
               String(humidity, 2);
    payload += "}";

    Serial.println("Publishing:");
    Serial.println(payload);

    mqttClient.publish(
        topic.c_str(),
        payload.c_str()
    );

    delay(5000);
}

void connectWiFi() {
    WiFi.begin(
        WIFI_SSID,
        WIFI_PASSWORD
    );

    Serial.print("Connecting to WiFi");

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println();
    Serial.println("WiFi connected");

    Serial.println(
        WiFi.localIP()
    );
}

void connectMQTT() {
    while (!mqttClient.connected()) {
        Serial.print(
            "Connecting to MQTT..."
        );

        String clientId =
            "iotflow-" +
            String(DEVICE_ID);

        if (
            mqttClient.connect(
                clientId.c_str()
            )
        ) {
            Serial.println(
                "connected"
            );
        } else {
            Serial.print(
                "failed, rc="
            );

            Serial.println(
                mqttClient.state()
            );

            delay(5000);
        }
    }
}

String getTimestamp() {
    struct tm timeinfo;

    if (
        !getLocalTime(
            &timeinfo,
            1000
        )
    ) {
        return "2026-01-01T00:00:00.000Z";
    }

    char buffer[30];

    strftime(
        buffer,
        sizeof(buffer),
        "%Y-%m-%dT%H:%M:%SZ",
        &timeinfo
    );

    return String(buffer);
}