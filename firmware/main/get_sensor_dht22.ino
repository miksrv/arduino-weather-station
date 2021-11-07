void get_sensor_dht22() {
  dht.read();

  if (dht.getState() == DHT_OK) {
    dtostrf(dht.getTemperatureC(), 0, 1, temp);
    dtostrf(dht.getHumidity(), 0, 1, humd);

    #ifdef DEBUG
      Serial.print(" - Temperature: ");
      Serial.print(temp);
      Serial.println(" C");
      Serial.print(" - Humidity: ");
      Serial.print(humd);
      Serial.println(" %");
    #endif
  } else {
    #ifdef DEBUG
      Serial.println(" - [ERROR] DHT22 no data");
    #endif
  }

  delay(500);
}
