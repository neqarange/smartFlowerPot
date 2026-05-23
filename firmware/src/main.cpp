/*
 * ============================================================
 *  CHYTRÝ KVĚTINÁČ – ESP32 Firmware
 * ============================================================
 *  Senzory: SHT30, BH1750, LTR390, HD-38
 *
 *  Režimy:
 *    1. SETUP    – Captive portal pro WiFi + backend URL
 *    2. PAIRING  – Čeká až uživatel spáruje ve webové appce
 *    3. RUNNING  – Měří a odesílá data
 *
 *  Reset: Podrž BOOT 5 sekund → smaže nastavení
 * ============================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <Wire.h>
#include "config.h"

// ── Globální proměnné ──────────────────────────────────────
Preferences prefs;
WebServer server(80);
DNSServer dnsServer;

String wifiSSID     = "";
String wifiPassword = "";
String backendURL   = "";
String deviceToken  = "";
String pairingCode  = "";

enum State { SETUP, PAIRING, RUNNING };
State currentState = SETUP;

// ── Prototypy ──────────────────────────────────────────────
void loadConfig();
void saveConfig();
void clearConfig();
void generatePairingCode();
bool connectWiFi();
void startCaptivePortal();
void handlePortalRoot();
void handlePortalSave();
void runPairingMode();
void runSensorMode();
void checkResetButton();
void odesli_do_api(String &payload);

bool read_sht30(float *temp, float *hum);
bool read_bh1750(float *lux);
bool read_ltr390(float *uv_index, uint32_t *raw_out);
void ltr390_write_reg(uint8_t reg, uint8_t val);
uint8_t ltr390_read_reg(uint8_t reg);
int read_soil_raw();
float soil_to_percent(int raw);
uint8_t crc8(const uint8_t *data, size_t len);

// ── HTML captive portal ────────────────────────────────────
const char PORTAL_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SmartPot Setup</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,sans-serif;background:#1a1a1a;color:#fff;padding:20px;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .card{background:#2a2a2a;border-radius:16px;padding:28px;max-width:380px;width:100%}
    h1{font-size:22px;margin-bottom:4px}
    .sub{color:#999;font-size:14px;margin-bottom:24px}
    .code{background:#333;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px}
    .code .label{color:#999;font-size:12px;margin-bottom:6px}
    .code .value{font-size:32px;font-weight:bold;letter-spacing:8px;color:#F5A623;font-family:monospace}
    label{display:block;font-size:13px;color:#ccc;margin-bottom:6px;margin-top:16px}
    input{width:100%;padding:12px;border-radius:8px;border:1px solid #444;background:#333;color:#fff;font-size:15px}
    input:focus{outline:none;border-color:#F5A623}
    button{width:100%;padding:14px;border:none;border-radius:8px;background:#F5A623;color:#000;font-size:16px;font-weight:bold;margin-top:24px;cursor:pointer}
    button:hover{background:#e8941a}
    .help{color:#777;font-size:12px;margin-top:16px;text-align:center;line-height:1.5}
  </style>
</head>
<body>
  <div class="card">
    <h1>🌱 SmartPot Setup</h1>
    <p class="sub">Connect your pot to WiFi</p>
    <div class="code">
      <div class="label">PAIRING CODE</div>
      <div class="value">%PAIRING_CODE%</div>
    </div>
    <form action="/save" method="POST">
      <label>WiFi network</label>
      <input name="ssid" placeholder="Your WiFi name" required>
      <label>WiFi password</label>
      <input name="pass" type="password" placeholder="Your WiFi password">
      <label>Backend URL</label>
      <input name="url" placeholder="https://smart-flower-pot-production.up.railway.app" required>
      <button type="submit">Connect</button>
    </form>
    <p class="help">
      Enter this pairing code in the web app<br>
      to link this pot to your account.
    </p>
  </div>
</body>
</html>
)rawliteral";

const char PORTAL_SUCCESS[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SmartPot</title>
  <style>
    body{font-family:-apple-system,sans-serif;background:#1a1a1a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
    .card{background:#2a2a2a;border-radius:16px;padding:28px;max-width:380px;text-align:center}
    h1{color:#4ade80;font-size:22px;margin-bottom:8px}
    p{color:#999;font-size:14px;line-height:1.6}
    .code{color:#F5A623;font-weight:bold;font-size:18px;font-family:monospace;letter-spacing:4px}
  </style>
</head>
<body>
  <div class="card">
    <h1>✓ Connected!</h1>
    <p>Now open the web app and add a device<br>with pairing code:</p>
    <p class="code">%PAIRING_CODE%</p>
    <p>The pot will pair automatically.</p>
  </div>
</body>
</html>
)rawliteral";

// ── Setup ──────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println();
  Serial.println("========================================");
  Serial.println("  CHYTRY KVETINAC");
  Serial.println("========================================");

  pinMode(RESET_BUTTON_PIN, INPUT_PULLUP);
  Wire.begin(I2C_SDA, I2C_SCL);

  // I2C scan
  Serial.println("[I2C] Skenuji...");
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("  0x%02X", addr);
      if (addr == SHT30_ADDR)  Serial.print(" <- SHT30");
      if (addr == BH1750_ADDR) Serial.print(" <- BH1750");
      if (addr == LTR390_ADDR) Serial.print(" <- LTR390");
      Serial.println();
    }
  }

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  // LTR390 init
  ltr390_write_reg(0x00, 0x10);
  delay(100);
  ltr390_write_reg(0x00, 0x00);
  delay(50);
  ltr390_write_reg(0x05, 0x01);
  delay(10);
  ltr390_write_reg(0x04, 0x22);
  delay(10);
  ltr390_write_reg(0x00, 0x0A);
  delay(500);

  loadConfig();
  generatePairingCode();

  Serial.printf("[CONFIG] SSID: %s\n", wifiSSID.c_str());
  Serial.printf("[CONFIG] Backend: %s\n", backendURL.c_str());
  Serial.printf("[CONFIG] Token: %s\n", deviceToken.length() > 0 ? "SET" : "EMPTY");
  Serial.printf("[CONFIG] Pairing code: %s\n", pairingCode.c_str());

  if (wifiSSID.length() == 0) {
    Serial.println("[MODE] SETUP - spoustim captive portal");
    currentState = SETUP;
    startCaptivePortal();
  } else if (deviceToken.length() == 0) {
    Serial.println("[MODE] PAIRING - cekam na sparovani");
    currentState = PAIRING;
    if (!connectWiFi()) {
      Serial.println("[ERROR] WiFi selhalo, vracim se do SETUP");
      clearConfig();
      ESP.restart();
    }
  } else {
    Serial.println("[MODE] RUNNING - merim a odesilam");
    currentState = RUNNING;
    if (!connectWiFi()) {
      Serial.println("[ERROR] WiFi selhalo, restart...");
      delay(5000);
      ESP.restart();
    }
  }

  Serial.println("System bezi!\n");
}

// ── Loop ───────────────────────────────────────────────────
void loop() {
  checkResetButton();

  switch (currentState) {
    case SETUP:
      dnsServer.processNextRequest();
      server.handleClient();
      break;
    case PAIRING:
      runPairingMode();
      break;
    case RUNNING:
      runSensorMode();
      break;
  }
}

// ── NVS ────────────────────────────────────────────────────
void loadConfig() {
  prefs.begin("smartpot", true);
  wifiSSID     = prefs.getString("ssid", "");
  wifiPassword = prefs.getString("pass", "");
  backendURL   = prefs.getString("url", "");
  deviceToken  = prefs.getString("token", "");
  prefs.end();
}

void saveConfig() {
  prefs.begin("smartpot", false);
  prefs.putString("ssid", wifiSSID);
  prefs.putString("pass", wifiPassword);
  prefs.putString("url", backendURL);
  prefs.putString("token", deviceToken);
  prefs.end();
}

void clearConfig() {
  prefs.begin("smartpot", false);
  prefs.clear();
  prefs.end();
  Serial.println("[CONFIG] Vsechna nastaveni smazana!");
}

// ── Pairing code z MAC ─────────────────────────────────────
void generatePairingCode() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char code[7];
  snprintf(code, sizeof(code), "%02X%02X%02X", mac[3], mac[4], mac[5]);
  pairingCode = String(code);
}

// ── WiFi ───────────────────────────────────────────────────
bool connectWiFi() {
  Serial.printf("[WiFi] Pripojuji k: %s", wifiSSID.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

  int pokusy = 0;
  while (WiFi.status() != WL_CONNECTED && pokusy < 30) {
    delay(500);
    Serial.print(".");
    pokusy++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] OK! IP: %s\n", WiFi.localIP().toString().c_str());
    return true;
  }
  Serial.println("\n[WiFi] SELHALO!");
  return false;
}

// ── Captive Portal ─────────────────────────────────────────
void startCaptivePortal() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_NAME, AP_PASSWORD);

  Serial.printf("[AP] Hotspot: %s\n", AP_NAME);
  Serial.printf("[AP] IP: %s\n", WiFi.softAPIP().toString().c_str());
  Serial.printf("[AP] Pairing code: %s\n", pairingCode.c_str());

  dnsServer.start(53, "*", WiFi.softAPIP());

  server.on("/", handlePortalRoot);
  server.on("/save", HTTP_POST, handlePortalSave);
  server.onNotFound(handlePortalRoot);
  server.begin();
}

void handlePortalRoot() {
  String html = String(PORTAL_HTML);
  html.replace("%PAIRING_CODE%", pairingCode);
  server.send(200, "text/html", html);
}

void handlePortalSave() {
  wifiSSID     = server.arg("ssid");
  wifiPassword = server.arg("pass");
  backendURL   = server.arg("url");

  if (backendURL.endsWith("/")) {
    backendURL = backendURL.substring(0, backendURL.length() - 1);
  }

  saveConfig();

  String html = String(PORTAL_SUCCESS);
  html.replace("%PAIRING_CODE%", pairingCode);
  server.send(200, "text/html", html);

  Serial.println("[SETUP] Konfigurace ulozena! Restart za 3s...");
  delay(3000);
  ESP.restart();
}

// ── Pairing mode ───────────────────────────────────────────
void runPairingMode() {
  static unsigned long lastPoll = 0;

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    return;
  }

  if (millis() - lastPoll < PAIRING_POLL_MS) return;
  lastPoll = millis();

  String url = backendURL + "/api/iot/claim/" + pairingCode;
  Serial.printf("[PAIR] Polling: %s\n", url.c_str());

  HTTPClient http;
  http.begin(url);
  http.setTimeout(10000);

  int code = http.GET();

  if (code == 200) {
    String response = http.getString();
    http.end();

    int tokenStart = response.indexOf("\"token\":\"") + 9;
    int tokenEnd = response.indexOf("\"", tokenStart);
    if (tokenStart > 8 && tokenEnd > tokenStart) {
      deviceToken = response.substring(tokenStart, tokenEnd);

      prefs.begin("smartpot", false);
      prefs.putString("token", deviceToken);
      prefs.end();

      Serial.println("[PAIR] SPAROVANO! Token ulozen.");
      currentState = RUNNING;
    }
  } else if (code == 404) {
    http.end();
    Serial.println("[PAIR] Cekam na sparovani...");
  } else {
    Serial.printf("[PAIR] Chyba: %d\n", code);
    http.end();
  }
}

// ── Sensor mode ────────────────────────────────────────────
void runSensorMode() {
  if (WiFi.status() != WL_CONNECTED) {
    if (!connectWiFi()) { delay(10000); return; }
  }

  float teplota = 0, vlhkost_vzd = 0;
  bool sht30_ok = read_sht30(&teplota, &vlhkost_vzd);

  float lux = 0;
  bool bh1750_ok = read_bh1750(&lux);

  float uv_index = 0;
  uint32_t uv_raw = 0;
  bool ltr390_ok = read_ltr390(&uv_index, &uv_raw);

  int soil_raw = read_soil_raw();
  float soil_pct = soil_to_percent(soil_raw);

  Serial.println("------- MERENI -------");
  if (sht30_ok)  Serial.printf("Teplota: %.1f C, Vlhkost vzd: %.1f %%\n", teplota, vlhkost_vzd);
  else           Serial.println("SHT30: CHYBA");
  if (bh1750_ok) Serial.printf("Osvetleni: %.1f lux\n", lux);
  else           Serial.println("BH1750: CHYBA");
  if (ltr390_ok) Serial.printf("UV index: %.2f (raw=%lu)\n", uv_index, uv_raw);
  else           Serial.println("LTR390: CHYBA");
  Serial.printf("Puda: %.1f %% (raw=%d)\n", soil_pct, soil_raw);

  String payload = "{";
  payload += "\"token\":\"" + deviceToken + "\",";
  payload += "\"airTemp\":" + (sht30_ok ? String(teplota, 2) : "null") + ",";
  payload += "\"airMoisture\":" + (sht30_ok ? String(vlhkost_vzd, 2) : "null") + ",";
  payload += "\"light\":" + (bh1750_ok ? String(lux, 2) : "null") + ",";
  payload += "\"uvIndex\":" + (ltr390_ok ? String(uv_index, 2) : "null") + ",";
  payload += "\"soilMoisture\":" + String(soil_pct, 2);
  payload += "}";

  odesli_do_api(payload);

  Serial.printf("Dalsi mereni za %d s...\n\n", MEASURE_INTERVAL);
  delay(MEASURE_INTERVAL * 1000);
}

// ── Odeslání na backend ────────────────────────────────────
void odesli_do_api(String &payload) {
  String url = backendURL + "/api/iot/readings";
  Serial.printf("[API] POST %s\n", url.c_str());

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  int code = http.POST(payload);

  if (code == 200 || code == 201) {
    Serial.println("[API] OK - ulozeno!");
    Serial.println("[API] " + http.getString());
  } else if (code > 0) {
    Serial.printf("[API] Chyba %d: %s\n", code, http.getString().c_str());
  } else {
    Serial.printf("[API] Spojeni selhalo: %s\n", http.errorToString(code).c_str());
  }

  http.end();
}

// ── Reset tlačítko ─────────────────────────────────────────
void checkResetButton() {
  if (digitalRead(RESET_BUTTON_PIN) == LOW) {
    unsigned long start = millis();
    while (digitalRead(RESET_BUTTON_PIN) == LOW) {
      if (millis() - start > RESET_HOLD_MS) {
        Serial.println("[RESET] Mazem nastaveni a restartuji...");
        clearConfig();
        delay(1000);
        ESP.restart();
      }
      delay(50);
    }
  }
}

// ── SHT30 ──────────────────────────────────────────────────
bool read_sht30(float *temp, float *hum) {
  Wire.beginTransmission(SHT30_ADDR);
  Wire.write(0x2C);
  Wire.write(0x06);
  if (Wire.endTransmission() != 0) return false;
  delay(50);
  Wire.requestFrom(SHT30_ADDR, (uint8_t)6);
  if (Wire.available() < 6) return false;
  uint8_t data[6];
  for (int i = 0; i < 6; i++) data[i] = Wire.read();
  if (crc8(data, 2) != data[2] || crc8(data + 3, 2) != data[5]) return false;
  uint16_t raw_t = (data[0] << 8) | data[1];
  uint16_t raw_h = (data[3] << 8) | data[4];
  *temp = -45.0 + 175.0 * ((float)raw_t / 65535.0);
  *hum  = 100.0 * ((float)raw_h / 65535.0);
  return true;
}

// ── BH1750 ─────────────────────────────────────────────────
bool read_bh1750(float *lux) {
  Wire.beginTransmission(BH1750_ADDR);
  Wire.write(0x01);
  Wire.endTransmission();
  delay(10);
  Wire.beginTransmission(BH1750_ADDR);
  Wire.write(0x10);
  if (Wire.endTransmission() != 0) return false;
  delay(180);
  Wire.requestFrom(BH1750_ADDR, (uint8_t)2);
  if (Wire.available() < 2) return false;
  uint8_t h = Wire.read();
  uint8_t l = Wire.read();
  *lux = ((h << 8) | l) / 1.2;
  return true;
}

// ── LTR390 ─────────────────────────────────────────────────
bool read_ltr390(float *uv_index, uint32_t *raw_out) {
  ltr390_write_reg(0x00, 0x0A);
  delay(200);
  uint8_t status = ltr390_read_reg(0x07);
  if (!(status & 0x08)) { delay(300); status = ltr390_read_reg(0x07); }
  if (!(status & 0x08)) return false;
  uint8_t uv_l = ltr390_read_reg(0x10);
  uint8_t uv_m = ltr390_read_reg(0x11);
  uint8_t uv_h = ltr390_read_reg(0x12);
  *raw_out = ((uint32_t)(uv_h & 0x0F) << 16) | ((uint32_t)uv_m << 8) | (uint32_t)uv_l;
  *uv_index = (float)(*raw_out) / 2300.0;
  return true;
}

void ltr390_write_reg(uint8_t reg, uint8_t val) {
  Wire.beginTransmission(LTR390_ADDR);
  Wire.write(reg);
  Wire.write(val);
  Wire.endTransmission();
}

uint8_t ltr390_read_reg(uint8_t reg) {
  Wire.beginTransmission(LTR390_ADDR);
  Wire.write(reg);
  Wire.endTransmission();
  delay(5);
  Wire.requestFrom(LTR390_ADDR, (uint8_t)1);
  return Wire.available() ? Wire.read() : 0;
}

// ── HD-38 ──────────────────────────────────────────────────
int read_soil_raw() {
  long suma = 0;
  for (int i = 0; i < 10; i++) {
    suma += analogRead(SOIL_PIN);
    delay(10);
  }
  return suma / 10;
}

float soil_to_percent(int raw) {
  if (raw > SOIL_DRY) raw = SOIL_DRY;
  if (raw < SOIL_WET) raw = SOIL_WET;
  return (float)(SOIL_DRY - raw) / (float)(SOIL_DRY - SOIL_WET) * 100.0;
}

// ── CRC-8 ──────────────────────────────────────────────────
uint8_t crc8(const uint8_t *data, size_t len) {
  uint8_t crc = 0xFF;
  for (size_t i = 0; i < len; i++) {
    crc ^= data[i];
    for (int b = 0; b < 8; b++) {
      crc = (crc & 0x80) ? (crc << 1) ^ 0x31 : (crc << 1);
    }
  }
  return crc;
}
