-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Хост: 10.0.0.231:3319
-- Время создания: Фев 15 2022 г., 03:39
-- Версия сервера: 10.3.30-MariaDB-log
-- Версия PHP: 7.4.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `mik_weather`
--

-- --------------------------------------------------------

--
-- Структура таблицы `weather_current`
--

CREATE TABLE `weather_current` (
  `item_id` varchar(13) NOT NULL COMMENT 'Unique ID',
  `item_utc_date` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'DateTime in UTC',
  `conditions` smallint(3) DEFAULT NULL,
  `temperature` float DEFAULT NULL,
  `feels_like` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `pressure` float DEFAULT NULL,
  `clouds` smallint(3) DEFAULT NULL,
  `wind_speed` float DEFAULT NULL,
  `wind_deg` float DEFAULT NULL,
  `wind_gust` float DEFAULT NULL,
  `precipitation` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Current weather from station and OpenWeather';

-- --------------------------------------------------------

--
-- Структура таблицы `weather_forecast`
--

CREATE TABLE `weather_forecast` (
  `item_id` varchar(20) NOT NULL COMMENT 'Unique ID',
  `item_utc_date` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'DateTime in UTC',
  `conditions` smallint(3) NOT NULL,
  `temperature` float NOT NULL,
  `feels_like` float NOT NULL,
  `humidity` float NOT NULL,
  `pressure` float NOT NULL,
  `clouds` smallint(3) NOT NULL,
  `wind_speed` float NOT NULL,
  `wind_deg` float NOT NULL,
  `wind_gust` float NOT NULL,
  `precipitation` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `weather_hourly`
--

CREATE TABLE `weather_hourly` (
  `item_id` varchar(13) NOT NULL COMMENT 'Unique ID',
  `item_utc_date` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'DateTime in UTC',
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `pressure` float DEFAULT NULL,
  `illumination` smallint(5) DEFAULT NULL,
  `uvindex` float DEFAULT NULL,
  `wind_speed` float DEFAULT NULL,
  `wind_deg` smallint(3) DEFAULT NULL,
  `wind_gust` float DEFAULT NULL,
  `clouds` smallint(3) DEFAULT NULL,
  `precipitation` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `weather_sensors`
--

CREATE TABLE `weather_sensors` (
  `item_id` varchar(13) NOT NULL COMMENT 'Unique ID',
  `item_utc_date` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'DateTime in UTC',
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `pressure` float DEFAULT NULL,
  `illumination` smallint(5) DEFAULT NULL,
  `uvindex` float DEFAULT NULL,
  `wind_speed` float DEFAULT NULL,
  `wind_deg` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Current weather from station and OpenWeather';

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `weather_current`
--
ALTER TABLE `weather_current`
  ADD PRIMARY KEY (`item_id`),
  ADD UNIQUE KEY `item_id` (`item_id`),
  ADD KEY `item_utc_date` (`item_utc_date`);

--
-- Индексы таблицы `weather_forecast`
--
ALTER TABLE `weather_forecast`
  ADD PRIMARY KEY (`item_id`),
  ADD UNIQUE KEY `item_id` (`item_id`),
  ADD KEY `item_utc_data` (`item_utc_date`);

--
-- Индексы таблицы `weather_hourly`
--
ALTER TABLE `weather_hourly`
  ADD PRIMARY KEY (`item_id`),
  ADD UNIQUE KEY `item_id` (`item_id`),
  ADD KEY `item_utc_date` (`item_utc_date`);

--
-- Индексы таблицы `weather_sensors`
--
ALTER TABLE `weather_sensors`
  ADD PRIMARY KEY (`item_id`),
  ADD UNIQUE KEY `item_id` (`item_id`),
  ADD KEY `item_utc_date` (`item_utc_date`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
