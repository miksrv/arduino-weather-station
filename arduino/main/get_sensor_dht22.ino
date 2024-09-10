// Function to read and process data from the DHT22 sensor
void get_sensor_dht22() {
  // Read data from the DHT22 sensor
  dht.read();

  // Check if the sensor data is valid
  if (dht.getState() == DHT_OK) {
    // Convert the temperature in Celsius and humidity to strings for further use
    dtostrf(dht.getTemperatureC(), 0, 1, temp);
    dtostrf(dht.getHumidity(), 0, 1, humd);

    // Debugging block: Print the temperature and humidity to the Serial Monitor if DEBUG is enabled
    #ifdef DEBUG
      Serial.print(" - Temperature: ");
      Serial.print(temp);  // Output the temperature in Celsius
      Serial.println(" C");
      Serial.print(" - Humidity: ");
      Serial.print(humd);  // Output the humidity percentage
      Serial.println(" %");
    #endif
  } else {
    // Debugging block: Print an error message to the Serial Monitor if DEBUG is enabled
    #ifdef DEBUG
      Serial.println(" - [ERROR] DHT22 no data");
    #endif
  }

  // Wait for 500 milliseconds before the next sensor reading
  delay(500);
}