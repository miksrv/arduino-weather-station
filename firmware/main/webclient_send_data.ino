void webclient_send_data() {
  // Clear the buffer before adding new data
  memset(webclient_data, 0, sizeof(webclient_data));

  // Add API secret key to the data string
  strcpy(webclient_data, "id=");
  strcat(webclient_data, API_SECRET);

  // Append pressure value (mmHg)
  strcat(webclient_data, "&p=");
  strcat(webclient_data, mmHg);
    
  // Append temperature value
  strcat(webclient_data, "&t=");
  strcat(webclient_data, temp);

  // Append humidity value
  strcat(webclient_data, "&h=");
  strcat(webclient_data, humd);

  // Append UV index value
  strcat(webclient_data, "&uv=");
  strcat(webclient_data, uvindex);

  // Append light intensity value (lux)
  strcat(webclient_data, "&i=");
  strcat(webclient_data, lux);

  // Append wind direction value
  strcat(webclient_data, "&wd=");
  strcat(webclient_data, wind_dir);

  // Append wind speed value
  strcat(webclient_data, "&ws=");
  strcat(webclient_data, wind_speed);

  // Debug: Output the data length and the data string
  #ifdef DEBUG
    Serial.print(" [Content-Length: ");
    Serial.print(len(webclient_data));
    Serial.print("] ");
    Serial.println(webclient_data);
  #endif

  // Attempt to connect to the API server
  if (LAN.connect(API_SERVER, 80)) {
    // Send HTTP POST request
    LAN.print("POST ");
    LAN.print(API_METHOD);
    LAN.println(" HTTP/1.1");
    
    // Send the host information
    LAN.print("Host: ");
    LAN.println(API_SERVER);
    
    // Set the content type and connection parameters
    LAN.println("Content-Type: application/x-www-form-urlencoded");
    LAN.println("Connection: close");
    
    // Send the content length
    LAN.print("Content-Length: ");
    LAN.println(len(webclient_data));
    
    // Send the actual data
    LAN.println();
    LAN.println(webclient_data);
    LAN.println();
    
    // Wait and stop the connection
    delay(2000);
    LAN.stop();
    
    // Debug: Print success message
    #ifdef DEBUG
      Serial.println(" [Webclient] Data send success");
      Serial.println();
    #endif
  } else {
    // Debug: Print error message if connection fails
    #ifdef DEBUG
      Serial.println(" [Webclient] Data send error");
      Serial.println();
    #endif
  }

  // Small delay before the next send attempt
  delay(500);
}

/** 
 * Method to calculate the length of the string buffer
 * @param buf - pointer to the buffer
 * @return length of the string
 **/
int len(char *buf) {
  int i = 0; 
  // Loop through the string until the null terminator is found
  do {
    i++;
  } while (buf[i] != '\0');
  return i;
}