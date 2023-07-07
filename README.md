Arduino Weather Station
===============
[![UI Checks](https://github.com/miksrv/arduino-weather-station/actions/workflows/ui-checks.yml/badge.svg)](https://github.com/miksrv/arduino-weather-station/actions/workflows/ui-checks.yml)
[![FTP Deploy](https://github.com/miksrv/arduino-weather-station/actions/workflows/ui-deploy.yml/badge.svg)](https://github.com/miksrv/arduino-weather-station/actions/workflows/ui-deploy.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=miksrv_arduino-weather-station&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=miksrv_arduino-weather-station)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=miksrv_arduino-weather-station&metric=coverage)](https://sonarcloud.io/summary/new_code?id=miksrv_arduino-weather-station)

![HTML](https://camo.githubusercontent.com/b4c648ad32f8f9f7c328a4dd59b5df0eb2a4e2623095e31d059f026979129491/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f48544d4c2d4533344632362e7376673f6c6f676f3d68746d6c35266c6f676f436f6c6f723d7768697465)
![CSS](https://camo.githubusercontent.com/53132716f8ed401a79d8c0980b9666b6cd8ce8e7faed1beeb328f821b44850bc/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4353532d3135373242362e7376673f6c6f676f3d63737333266c6f676f436f6c6f723d7768697465)
![CSS](https://camo.githubusercontent.com/53132716f8ed401a79d8c0980b9666b6cd8ce8e7faed1beeb328f821b44850bc/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4353532d3135373242362e7376673f6c6f676f3d63737333266c6f676f436f6c6f723d7768697465)
![JS](https://camo.githubusercontent.com/9a794a64d79bb070a8009cf27eb31c989d09d43a65f95362c88ed6c28218319b/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4a6176615363726970742d4637444631452e7376673f6c6f676f3d6a617661736372697074266c6f676f436f6c6f723d626c61636b)
![TS](https://camo.githubusercontent.com/11c819f21e728e3ba177845a8c9099c63424415008d291a66921165456cf1c49/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f547970655363726970742d3030374143432e7376673f6c6f676f3d74797065736372697074266c6f676f436f6c6f723d7768697465)
![React](https://camo.githubusercontent.com/841a3eb02c53b1da682028a5bf3d4032cee4a00b34cdd35f0b1b93e4e24d9316/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f52656163742d3230323332612e7376673f6c6f676f3d7265616374266c6f676f436f6c6f723d253233363144414642)
![PHP](https://camo.githubusercontent.com/08f504258b33496b9eb2ad3145dec07f07e8ed7066f3227a716dd6c75edf76ab/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f5048502d3737374242342e7376673f6c6f676f3d706870266c6f676f436f6c6f723d7768697465)
![SQL](https://camo.githubusercontent.com/4ed1fe3ec872f44fe743932bcf4eb6d18ad8568e8d6d19e16d8d96864f6acd33/68747470733a2f2f637573746f6d2d69636f6e2d6261646765732e64656d6f6c61622e636f6d2f62616467652f53514c2d3032354538432e7376673f6c6f676f3d6461746162617365266c6f676f436f6c6f723d7768697465)
![Arduino](https://camo.githubusercontent.com/0d9127be2d88deb6ca6995597f7df5f6658f3307a0390176fe47aef616dfda60/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d41726475696e6f2d3030393739443f6c6f676f3d41726475696e6f266c6f676f436f6c6f723d7768697465)
![Github Actions](https://camo.githubusercontent.com/ba4516a1d93862d1c12ad7495551804c58b04066194903828fd83606a0fac2a8/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f476974487562253230416374696f6e732d3236373145352e7376673f6c6f676f3d676974687562253230616374696f6e73266c6f676f436f6c6f723d7768697465)

This project is designed to teach the basic skills and understanding of working with microcontrollers ATmega (Arduino). The project is a working model of an automated weather station, consisting of two the Component: transmitter and receiver. The controller transmits data to a remote web server, and to indicate the current readings uses character.

🌐 https://meteo.miksoft.pro

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
