#ifndef CONFIG_H
#define CONFIG_H

// I2C piny
#define I2C_SDA       21
#define I2C_SCL       22

// I2C adresy senzorů
#define SHT30_ADDR    0x44
#define BH1750_ADDR   0x23
#define LTR390_ADDR   0x53

// Analog pin
#define SOIL_PIN      34

// Kalibrace HD-38
#define SOIL_DRY      4095
#define SOIL_WET      1200

// Timing
#define MEASURE_INTERVAL    600     // Interval měření (sekund)
#define PAIRING_POLL_MS     10000   // Jak často pollovat claim endpoint (ms)

// Captive portal
#define AP_NAME       "SmartPot-Setup"
#define AP_PASSWORD   ""

// Reset tlačítko (BOOT)
#define RESET_BUTTON_PIN    0
#define RESET_HOLD_MS       5000

#endif
