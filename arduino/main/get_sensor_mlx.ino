// Get MLX90614 sensor data

void get_sensor_mlx() {

  dtostrf(MLX.readAmbientTempC(), 4, 1, mlxA);
  dtostrf(MLX.readObjectTempC(), 4, 1, mlxO);

  #ifdef DEBUG
    Serial.print("  [Ok] MLX Ambient: ");
    Serial.print(mlxA);
    Serial.println(" C");
    Serial.print("  [Ok] MLX Object: ");
    Serial.print(mlxO);
    Serial.println(" C");
  #endif

  delay(1000);
}
