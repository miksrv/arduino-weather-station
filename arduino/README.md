# Weather Station

## Table of Contents

- [Overview](#overview)
- [Components](#components)
- [Wiring Diagram](#wiring-diagram)
- [Files](#files)
  - [`main.ino`](#mainino)
  - [`get_sensor_dht22.ino`](#get_sensor_dht22ino)
  - [`get_sensor_wind_direction.ino`](#get_sensor_wind_directionino)
  - [`get_sensor_luxmeter.ino`](#get_sensor_luxmeterino)
  - [`get_sensor_pressure.ino`](#get_sensor_pressureino)
  - [`get_sensor_uvindex.ino`](#get_sensor_uvindexino)
  - [`webclient_send_data.ino`](#webclient_send_dataino)
- [Setup](#setup)
- [Usage](#usage)
  - [Debugging](#debugging)
  - [`i2c_scanner.ino`](#i2c_scannerino)
  - [`test_gyml8511.ino`](#test_gyml8511ino)
  - [`test_interput.ino`](#test_interputino)
  - [`test_pcf8574.ino`](#test_pcf8574ino)
- [Notes](#notes)

## Overview

This project is a weather station built with an Arduino that collects and sends various environmental data, including temperature, humidity, wind speed, wind direction, barometric pressure, UV index, and light levels. The data is sent to a web server for remote monitoring.

Before running and compiling the code, ensure that the required libraries are installed in your Arduino IDE:

1. **Install BMP085_Library.zip and PCF8574_Library.zip**  
   Place the library archives in the `libraries` folder of your Arduino IDE and extract them. Alternatively, you can use the Arduino Library Manager to include these libraries if they are available.

2. **Optionally, use the latest version of the Adafruit BMP085 library**  
   If you prefer to use the updated Adafruit BMP085 library for the pressure sensor, install it via the Arduino Library Manager. Note that using the updated library may require slight modifications to the sketch `get_sensor_pressure.ino` to align with the updated library's API.

This ensures that all dependencies are correctly set up for the successful compilation and functionality of your weather station.

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

## Debugging

- **Serial Monitor**: Enable the debug messages by uncommenting the `#define DEBUG` line in `main.ino`. This will print sensor readings and status messages to the Serial Monitor.

In additional directories you can find auxiliary files for debugging and testing electronic components:

### 1. `i2c_scanner.ino`

**Purpose:**  
This sketch scans the I2C bus for connected devices and prints their addresses to the Serial Monitor. It helps in identifying the addresses of I2C devices connected to the Arduino.

**Usage:**
1. Upload the sketch to your Arduino board.
2. Open the Serial Monitor (set to 9600 baud).
3. The sketch will start scanning and display the addresses of any detected I2C devices.
4. If no devices are found, it will indicate that no I2C devices are connected.

**Code Explanation:**
- `Wire.begin()`: Initializes the I2C bus.
- `Wire.beginTransmission(address)` and `Wire.endTransmission()`: Test each address for an I2C device.
- Addresses from `0x01` to `0x7F` are scanned.

### 2. `test_gyml8511.ino`

**Purpose:**  
This sketch reads data from an MP8511 UV sensor and calculates UV intensity. It prints the sensor's output voltage and UV intensity to the Serial Monitor.

**Usage:**
1. Connect the MP8511 sensor to the Arduino.
2. Upload the sketch to your Arduino board.
3. Open the Serial Monitor (set to 9600 baud).
4. The sketch will display the sensor's output and UV intensity in real-time.

**Code Explanation:**
- `averageAnalogRead(pinToRead)`: Averages multiple analog readings to improve accuracy.
- `mapfloat(x, in_min, in_max, out_min, out_max)`: Maps a float value from one range to another.
- UV intensity is calculated based on the sensor's output voltage.

### 3. `test_interput.ino`

**Purpose:**  
This sketch measures RPM (Revolutions Per Minute) using a Hall effect sensor and an interrupt. It prints the time elapsed and RPM to the Serial Monitor.

**Usage:**
1. Connect a Hall effect sensor to the interrupt pin (pin 2 on the Arduino UNO).
2. Upload the sketch to your Arduino board.
3. Open the Serial Monitor (set to 9600 baud).
4. The sketch will print the time elapsed and RPM values based on the number of sensor pulses.

**Code Explanation:**
- `attachInterrupt(digitalPinToInterrupt(sensorPin), addValue, RISING)`: Attaches an interrupt to count sensor pulses.
- `addValue()`: Increment the pulse count.
- RPM is calculated based on the time elapsed and number of pulses.

### 4. `test_pcf8574.ino`

**Purpose:**  
This sketch reads inputs from a PCF8574 I/O expander and displays the wind direction based on the digital input values.

**Usage:**
1. Connect the PCF8574 I/O expander to the Arduino via I2C.
2. Upload the sketch to your Arduino board.
3. Open the Serial Monitor (set to 9600 baud).
4. The sketch will display the wind direction as detected by the PCF8574 expander.

**Code Explanation:**
- `expander.pinMode(i, INPUT_PULLUP)`: Configures all pins of the PCF8574 as inputs with pull-up resistors.
- `expander.digitalRead(i)`: Reads the state of each pin.
- The wind direction is derived from the digital input values.

## Notes

- Ensure the correct board and port are selected in the Arduino IDE before uploading the sketches.
- Adjust pin numbers and I2C addresses in the sketches as needed for your specific hardware configuration.
