void webclient_send_data() {
  memset(webclient_data, 0, sizeof(webclient_data));

  strcpy(webclient_data, "id=");
  strcat(webclient_data, API_SECRET);

  strcat(webclient_data, "&p=");
  strcat(webclient_data, mmHg);
    
  strcat(webclient_data, "&t=");
  strcat(webclient_data, temp);

  strcat(webclient_data, "&h=");
  strcat(webclient_data, humd);
    
//  strcat(webclient_data, "&ma="); // MLX Ambient
//  strcat(webclient_data, mlxA);
  
//  strcat(webclient_data, "&mo="); // MLX Object
//  strcat(webclient_data, mlxO);
    
  strcat(webclient_data, "&uv=");
  strcat(webclient_data, uvindex);

  strcat(webclient_data, "&lux=");
  strcat(webclient_data, lux);

  strcat(webclient_data, "&wd=");
  strcat(webclient_data, wind_dir);

  strcat(webclient_data, "&ws=");
  strcat(webclient_data, wind_speed);

  // strcat(webclient_data,'\0');

  #ifdef DEBUG
    Serial.print(" [Content-Length: ");
    Serial.print(len(webclient_data));
    Serial.print("] ");
    Serial.println(webclient_data);
  #endif

  if (LAN.connect(API_SERVER, 80)) {
    LAN.print("POST ");
    LAN.print(API_METHOD);
    LAN.println(" HTTP/1.1");
    LAN.print("Host: ");
    LAN.println(API_SERVER);
    LAN.println("Content-Type: application/x-www-form-urlencoded");
    LAN.println("Connection: close");
    LAN.print("Content-Length: ");
    LAN.println(len(webclient_data));
    LAN.println();
    LAN.println(webclient_data);
    LAN.println();
    delay(2000);
    LAN.stop();
    
    #ifdef DEBUG
      Serial.println(" [Webclient] Data send success");
      Serial.println();
    #endif
  } else {
    #ifdef DEBUG
      Serial.println(" [Webclient] Data send error");
      Serial.println();
    #endif
  }

  delay(500);
}

/** The method determines the length of the string **/
int len(char *buf) {
  int i=0; 
  do {
    i++;
  } while (buf[i]!='\0');
  return i;
}
