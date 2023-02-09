DYI Arduino Weather Station
===============
[![Build & Test](https://github.com/miksrv/arduino-weather-station/actions/workflows/build.yml/badge.svg)](https://github.com/miksrv/arduino-weather-station/actions/workflows/build.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=miksrv_arduino-weather-station&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=miksrv_arduino-weather-station)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=miksrv_arduino-weather-station&metric=coverage)](https://sonarcloud.io/summary/new_code?id=miksrv_arduino-weather-station)

This project is designed to teach the basic skills and understanding of working with microcontrollers ATmega (Arduino). The project is a working model of an automated weather station, consisting of two the Component: transmitter and receiver. The controller transmits data to a remote web server, and to indicate the current readings uses character.

[ [DEMO](https://meteo.miksoft.pro/) ]

![DIY weather station](./docs/photo-1.jpg)

The weather station is capable of transmitting the following data on the state of the environment: 
- temperature
- humidity
- dewpoint
- illumination
- UV intensity
- wind speed
- wind direction
- atmosphere pressure

![Main interface](./docs/screen1.jpg)

To display data, a web interface was built in ReactJS, which requests data from a remote server. The interface displays not only current indicators, but also archived data, allows you to make a selection for a certain period. 

![Sensors interface](./docs/screen2.jpg)

The statistics page, which reveals the history of weather changes for the selected observation period.

![Statistic interface](./docs/screen3.jpg)

----------------------

### Project structure

This project consists of 4 main sections: 

1. [ **arduino** ] Firmware for Arduino microcontroller (AVR), weather station control unit.
2. [ **models** ] 3D model of weather station for printing.
3. [ **backend** ] Backend server. 
4. [ **frontend** ] Interface for displaying current and statistical data from the weather station. Written in ReactJS + Redux (use Node and NPM). To debug an application on a local server, you must first install the necessary dependencies:
  * `npm install` Installing dependencies.
  * `npm update` Update all dependencies.
  * `npm start` Launches a local webserver for debugging the application.
  * `npm run build` Compiles applications for deployment.

----------------------

### Necessary electronic components 

- Arduino Leonardo ETH \ Nano + NC28J60 Ethernet
- BMP085 \ BMP280
- DHT22
- BH1750
- PCF8574 (port expander)
- ML 8511
- SS41F (digital hall sensor) - 9pcs
- 608ZZ (bearing)
- 3x2 mm neodymium magnet - 2pcs

The project uses self-made developments, such as the airflow meter (angular velocity sensor based), voltmeter, light meter, as well as the switching board for Arduino PRO mini and transistor switches.

----------------------

### Models for 3D printing

![Models for 3D printing](./docs/models.jpg)

- Wind direction
- Sensors holder
- Radiation shield
- DHT22 + BMP085 mount
- Anemometr
