# Weather Station

## Overview

This project is a weather station built with an Arduino that collects and sends various environmental data, including temperature, humidity, wind speed, wind direction, barometric pressure, UV index, and light levels. The data is sent to a web server for remote monitoring.

## Components

- **BMP085**: Barometric pressure sensor
- **BH1750**: Light sensor
- **DHT22**: Temperature and humidity sensor
- **PCF8574**: I2C expander for wind direction
- **GUML8511**: UV sensor
- **Anemometer**: Measures wind speed
- **Wind Vane**: Measures wind direction

## Wiring Diagram

Sensors are connected to the Arduino as follows:

| Sensor         | Arduino       |
|----------------|---------------|
| BMP085         | I2C (SCL, SDA)|
| BH1750         | I2C (SCL, SDA)|
| Wind Vane      | I2C (SCL, SDA)|
| Anemometer     | Digital PIN 3 |
| DHT22          | Digital PIN 4 |
| UV Sensor      | Analog PIN A0 (UV OUT), Analog PIN A1 (UV REF) |

## Files

### `main.ino`

The main file that initializes the sensors, manages the main loop, and sends data to the web server. It includes:

- Initialization of sensors and network settings
- Main loop to periodically read sensor data and send it to the server

### `get_sensor_dht22.ino`

Contains functions to read data from the DHT22 temperature and humidity sensor. It includes:

- `get_sensor_dht22()`: Reads temperature and humidity values
- Data conversion and debugging output

### `get_sensor_wind_direction.ino`

Handles reading the wind direction using an I2C expander. It includes:

- `get_sensor_wind_direction()`: Reads wind direction from the wind vane
- Data processing and debugging output

### `get_sensor_luxmeter.ino`

Reads light levels from the BH1750 light sensor. It includes:

- `get_sensor_luxmeter()`: Reads and processes light level data
- Data conversion and debugging output

### `get_sensor_pressure.ino`

Manages data collection from the BMP085 barometric pressure sensor. It includes:

- `get_sensor_pressure()`: Reads and processes atmospheric pressure
- Data conversion and debugging output

### `get_sensor_uvindex.ino`

Handles UV index readings from the GUML8511 UV sensor. It includes:

- `get_sensor_uvindex()`: Reads and calculates UV index
- Data conversion and debugging output

### `webclient_send_data.ino`

Handles sending collected sensor data to the web server. It includes:

- `webclient_send_data()`: Formats and sends data to the specified API endpoint
- Network connection and data transmission

## Setup

1. **Hardware Connections**: Follow the wiring diagram to connect sensors to the Arduino.
2. **Libraries**: Ensure you have the following libraries installed:
   - `Wire.h`
   - `BMP085.h`
   - `TroykaDHT.h`
   - `BH1750.h`
   - `PCF8574.h`
   - `SPI.h`
   - `Ethernet.h`
3. **API Configuration**: Update `API_SERVER`, `API_METHOD`, and `API_SECRET` in `main.ino` with your API server address and credentials.
4. **Upload Code**: Upload all `.ino` files to your Arduino. The Arduino IDE will automatically handle file organization.

## Usage

The weather station will periodically collect data from all sensors and send it to the specified web server. The data is sent every 60 seconds, as defined by `SEND_DATA_INTERVAL` in `main.ino`.

### Debugging

- **Serial Monitor**: Enable the debug messages by uncommenting the `#define DEBUG` line in `main.ino`. This will print sensor readings and status messages to the Serial Monitor.