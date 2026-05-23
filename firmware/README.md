# Smart Flower Pot – ESP32 Firmware

## Jak to funguje pro uživatele

Uživatel nemusí sahat do kódu. Stačí 3 kroky:

### 1. Zapni ESP32
Po prvním spuštění (nebo po resetu) ESP32 vytvoří vlastní WiFi síť.

### 2. Připoj se z telefonu
- WiFi síť: **SmartFlowerPot**
- Heslo: **kvetinac123**
- Automaticky se otevře konfigurační stránka

### 3. Vyplň formulář
- Název WiFi sítě
- Heslo k WiFi
- URL backendu (např. `http://192.168.0.76:3001/api/iot/readings`)
- Device token (zkopíruj z webové aplikace)

ESP32 se restartuje, připojí k WiFi a začne měřit.

## Reset nastavení

Drž tlačítko **BOOT** na ESP32 po dobu **5 sekund**. Nastavení se smaže a znovu se spustí konfigurační portál.

## Senzory

| Senzor | Měří | Připojení | Adresa/Pin |
|--------|------|-----------|------------|
| SHT30 | Teplota + vlhkost vzduchu | I2C | 0x44 |
| BH1750 | Osvětlení (lux) | I2C | 0x23 |
| LTR390 | UV index | I2C | 0x53 |
| HD-38 | Půdní vlhkost | Analog | GPIO 34 |

## Zapojení

| Pin ESP32 | Připojení |
|-----------|-----------|
| GPIO 21 (SDA) | I2C SDA (SHT30, BH1750, LTR390) |
| GPIO 22 (SCL) | I2C SCL (SHT30, BH1750, LTR390) |
| GPIO 34 | HD-38 analog výstup |
| 3.3V | Napájení senzorů |
| GND | Společná zem |

## Upload firmware

```bash
pio run --target upload
pio device monitor
```
