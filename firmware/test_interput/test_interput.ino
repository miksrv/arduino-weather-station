int sensorPin = 2; // interupt pin on UNO, adjust according to board.
unsigned long value = 0;
int hall_thresh = 5;    //Set number of hall trips for RPM reading

unsigned long startTime = 0;
void setup() {
  Serial.begin(9600);
  
  pinMode(sensorPin, INPUT);

  Serial.println("MP8511 example");

  attachInterrupt(digitalPinToInterrupt(sensorPin), addValue, RISING);
}
void loop() {
  if (value >= hall_thresh) { // Math copied from StackOverflow question. 
    unsigned long endTime = micros();
    unsigned long time_passed = ((endTime - startTime) / 1000000.0);
    Serial.print("Time Passed: ");
    Serial.print(time_passed);
    Serial.println("s");
    float rpm_val = (value / time_passed) * 60.0;
    Serial.print(value);
    Serial.println(" RPM");
    value = 0;
    startTime = micros();
  }
}
void addValue() {
  value++;
}
