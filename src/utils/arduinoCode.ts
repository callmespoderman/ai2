export function getESP32ArduinoCode(resolutionWidth = 160, resolutionHeight = 128, port = 81): string {
  return `/*
 * ESP32 AI Vision Stream Receiver
 * ----------------------------------------------------
 * Receives RGB565 raw frame buffer stream over WebSocket (Port ${port})
 * Displays on ST7735 or ILI9341 160x128 SPI TFT display using TFT_eSPI
 * 
 * Required Arduino Libraries:
 *  - WebSockets by Markus Sattler (v2.4.0+)
 *  - TFT_eSPI by Bodmer
 *  - WiFi (Built-in ESP32)
 */

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <TFT_eSPI.h>
#include <SPI.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

#define SCREEN_WIDTH  ${resolutionWidth}
#define SCREEN_HEIGHT ${resolutionHeight}
#define FRAME_BUFFER_SIZE (SCREEN_WIDTH * SCREEN_HEIGHT * 2)

TFT_eSPI tft = TFT_eSPI();
WebSocketsServer webSocket = WebSocketsServer(${port});

// Double frame buffer in PSRAM or internal DMA SRAM
uint8_t frameBuffer[FRAME_BUFFER_SIZE];
size_t bufferIndex = 0;
bool receivingFrame = false;

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\\n", num);
      tft.fillScreen(TFT_BLACK);
      tft.setCursor(10, 50);
      tft.setTextColor(TFT_RED);
      tft.println("Stream Disconnected");
      break;

    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[%u] Connected from %d.%d.%d.%d\\n", num, ip[0], ip[1], ip[2], ip[3]);
      tft.fillScreen(TFT_NAVY);
      tft.setCursor(10, 50);
      tft.setTextColor(TFT_GREEN);
      tft.println("Client Connected!");
      bufferIndex = 0;
      break;
    }

    case WStype_TEXT:
      // START signal resets the frame buffer pointer
      if (length >= 5 && memcmp(payload, "START", 5) == 0) {
        bufferIndex = 0;
        receivingFrame = true;
      }
      break;

    case WStype_BIN:
      if (!receivingFrame) return;

      if (bufferIndex + length <= FRAME_BUFFER_SIZE) {
        memcpy(&frameBuffer[bufferIndex], payload, length);
        bufferIndex += length;

        // When full frame is assembled, push directly to TFT display
        if (bufferIndex >= FRAME_BUFFER_SIZE) {
          tft.startWrite();
          tft.setAddrWindow(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
          // Push 16-bit RGB565 pixel buffer
          tft.pushPixels((uint16_t*)frameBuffer, SCREEN_WIDTH * SCREEN_HEIGHT);
          tft.endWrite();

          bufferIndex = 0;
          receivingFrame = false;
        }
      } else {
        // Buffer overflow protection
        bufferIndex = 0;
        receivingFrame = false;
      }
      break;

    case WStype_ERROR:
      Serial.println("[WS] Error occurred");
      break;

    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);

  // Initialize TFT
  tft.init();
  tft.setRotation(1); // Landscape
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE);
  tft.setTextSize(1);
  tft.setCursor(10, 20);
  tft.println("Connecting WiFi...");

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }

  Serial.println("\\nWiFi Connected!");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());

  tft.fillScreen(TFT_BLACK);
  tft.setCursor(10, 20);
  tft.setTextColor(TFT_GREEN);
  tft.println("AI Stream Ready");
  tft.setCursor(10, 40);
  tft.setTextColor(TFT_YELLOW);
  tft.print("IP: ");
  tft.println(WiFi.localIP());
  tft.setCursor(10, 60);
  tft.print("Port: ");
  tft.println(${port});

  // Start WebSocket Server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
}
`;
}
