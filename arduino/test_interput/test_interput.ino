int sensorPin = 2;      // Interrupt pin on UNO (adjust according to your board)
unsigned long value = 0;  // Counter for the number of hall trips
int hall_thresh = 5;     // Set number of hall trips to trigger RPM reading

unsigned long startTime = 0;  // Start time for RPM calculation

void setup() {
  Serial.begin(9600);        // Initialize serial communication at 9600 baud rate
  
  pinMode(sensorPin, INPUT); // Set sensorPin as input

  Serial.println("MP8511 example");

  // Attach an interrupt to sensorPin; call addValue function on RISING edge
  attachInterrupt(digitalPinToInterrupt(sensorPin), addValue, RISING);
}

void loop() {
  if (value >= hall_thresh) { // Check if the number of hall trips meets the threshold
    unsigned long endTime = micros();  // Get the current time in microseconds
    unsigned long time_passed = ((endTime - startTime) / 1000000.0); // Calculate time passed in seconds
    Serial.print("Time Passed: ");
    Serial.print(time_passed);
    Serial.println("s");

    // Calculate RPM: (Number of trips / Time passed in seconds) * 60
    float rpm_val = (value / time_passed) * 60.0;
    Serial.print(rpm_val);
    Serial.println(" RPM");

    value = 0;               // Reset the trip counter
    startTime = micros();    // Reset the start time for the next measurement
  }
}

// Interrupt service routine to increment the trip counter
void addValue() {
  value++;
}