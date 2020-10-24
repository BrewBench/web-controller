// BrewBench App Yun
// copyright 2020 Andrew Van Tassel
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClient.h>
#include <Preferences.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "DHT12.h"
#include <Wire.h>
#include "OTAUpdate.h"
#include <avr/wdt.h>
// https://www.brewbench.co/libs/DHTlib-1.2.9.zip
// DHT #include <dht.h>
// DS18B20 #include <OneWire.h>
// DS18B20 #include <DallasTemperature.h>
// DS18B20 #include <Wire.h>
// BMP180 #include <Adafruit_BMP085.h>

const PROGMEM String VERSION = "[VERSION]";
uint32_t FREQUENCY_SECONDS = 900;
uint32_t secondCounter = 0;
boolean settingMode = false;
boolean offlineMode = false;
String ssidList;
String wifi_ssid;
String wifi_password;
String api_key;
String device_name;
String device_id;
String temp_unit = "F";
float temp = 0.00;
float temp_adjust = 0.00;
float ambient = NULL;
float ambient_adjust = 0.00;
float humidity = NULL;
int LED = 10;
DHT12 dht12;
DHTesp dht22;

WebServer webServer(80);

HTTPClient http;

// settings store
Preferences preferences;

// ADC Adafruit_ADS1115 ads(0x48);

#ifndef ARDUINO_BOARD
#define ARDUINO_BOARD "YUN"
#endif

// DHT dht DHT;
// BMP180 Adafruit_BMP085 bmp;

// https://learn.adafruit.com/thermistor/using-a-thermistor
// resistance at 25 degrees C
#define THERMISTORNOMINAL 10000
// temp. for nominal resistance (almost always 25 C)
#define TEMPERATURENOMINAL 25
// how many samples to take and average, more takes longer
// but is more 'smooth'
#define NUMSAMPLES 5
// The beta coefficient of the thermistor (usually 3000-4000)
#define BCOEFFICIENT 3950
// the value of the 'other' resistor
#define SERIESRESISTOR 10000

uint16_t samples[NUMSAMPLES];

void reboot() {
  wdt_disable();
  wdt_enable(WDTO_15MS);
  while (1) {}
}

float Thermistor(float average) {
   // convert the value to resistance
   average = 1023 / average - 1;
   average = SERIESRESISTOR / average;

   float steinhart = average / THERMISTORNOMINAL;     // (R/Ro)
   steinhart = log(steinhart);                  // ln(R/Ro)
   steinhart /= BCOEFFICIENT;                   // 1/B * ln(R/Ro)
   steinhart += 1.0 / (TEMPERATURENOMINAL + 273.15); // + (1/To)
   steinhart = 1.0 / steinhart;                 // Invert
   steinhart -= 273.15;

   return steinhart;
}

void actionsCommand(const String spin, const String type)
{
  uint8_t pin = spin.substring(1).toInt();

  if (type == "DS18B20")
  {
    OneWire oneWire(pin);
    DallasTemperature sensors(&oneWire);
    sensors.begin();
    sensors.requestTemperatures();
    temp = sensors.getTempCByIndex(0);
    if (temp != DEVICE_DISCONNECTED_C && temp_adjust && !isnan(temp_adjust))
      temp = temp + temp_adjust;
  }
  else if (type == "DHT12")
  {
    ambient = dht12.readTemperature();
    humidity = dht12.readHumidity();
    // not connected check
    if (String(humidity) == "0.01")
    {
      ambient = NULL;
      humidity = NULL;
    }
    else if (ambient_adjust && !isnan(ambient_adjust))
    {
      ambient = ambient + ambient_adjust;
    }
  }
  else if (type == "DHT22")
  {
    dht22.setup(pin, DHTesp::DHT22);
    delay(dht22.getMinimumSamplingPeriod());
    ambient = dht22.getTemperature();
    humidity = dht22.getHumidity();
    // not connected check
    if (String(humidity) == "0.01")
    {
      ambient = NULL;
      humidity = NULL;
    }
    else if (ambient_adjust && !isnan(ambient_adjust))
    {
      ambient = ambient + ambient_adjust;
    }
  }  
}

void runActions()
{
  // ACTIONS
  actionsCommand(F("D33"), F("DS18B20"));
  actionsCommand(F("D26"), F("DHT12"));
}

void createSensor(){

  if(device_id == "notset"){
    if (http.begin(F("https://sensor.brewbench.co/sensors_from_device")))
    {
      http.addHeader("X-API-KEY", String(api_key));
      // http.addHeader("X-API-KEY", String(sha1(api_key+WiFi.macAddress())));
      http.addHeader("User-Agent", "BrewBench-Stick/" + VERSION);
      http.addHeader("Content-Type", "application/json");
      String data = "{\"device_name\":\"" + String(device_name) + "\"";
      data += ",\"uid\":\"" + String(api_key) + "\"";            
      data += ",\"type\":\"temp\"";
      data += ",\"model\":\"BrewBench Stick\"";
      data += ",\"version\":\""+String(VERSION)+"\"";
      data += ",\"temp\":\""+String(temp)+"\"";
      data += ",\"temp_unit\":\"C\"";
      data += ",\"temp_adjust\":\""+String(temp_adjust)+"\"";
      data += ",\"ambient\":\""+String(ambient)+"\"";
      data += ",\"ambient_unit\":\"C\"";
      data += ",\"ambient_adjust\":\""+String(ambient_adjust)+"\"";
      data += ",\"frequency\":"+String(FREQUENCY_SECONDS);      
      data += ",\"device_ip\":\"" + WiFi.localIP().toString() + "\"";
      data += ",\"rssi\": "+String(WiFi.RSSI());
      data += ",\"mac\":\"" + String(WiFi.macAddress())+"\"";
      data += "}";
 
      int responseCode = http.POST(data);
      if(responseCode == 200){
        String body = http.getString();
        if(body.length() > 0 && body.indexOf("{") == -1)
          device_id = urlDecode(body);        
      }      

      http.end();
      preferences.begin("brewbench", false);
      preferences.putString("DEVICE_ID", urlDecode(device_id));
      preferences.end();    
    }
  }
}

void postData()
{
  if (api_key.length() > 0 && device_name.length() > 0)
  {
    if(device_id.length() == 0 || device_id == "notset"){
      createSensor();
      delay(10);
    }
    
    String data = "{\"device_name\":\"" + String(device_name) + "\"";
    data += ",\"uid\":\"" + String(api_key) + "\"";
    data += ",\"sensorsId\":\"" + String(device_id) + "\"";
    // always send temp
    if (temp != DEVICE_DISCONNECTED_C && !isnan(temp))
      data += ",\"temp\":" + String(temp);
    else
      data += ",\"temp\": \"\"";
    data += ",\"temp_unit\":\"C\"";

    // ambient
    if (ambient && !isnan(ambient) && ambient != NULL)
    {
      data += ",\"ambient\":" + String(ambient);
      data += ",\"ambient_unit\":\"C\"";
    }
    // humidity
    if (humidity && !isnan(humidity) && humidity != NULL)
      data += ",\"humidity\":" + String(humidity);
    
    data += ",\"device_ip\":\"" + WiFi.localIP().toString() + "\"";
    data += ",\"rssi\":" + String(WiFi.RSSI());
    data += "}";

    if (http.begin(F("https://sensor.brewbench.co/readings")))
    {
      http.addHeader("X-API-KEY", String(api_key));
      http.addHeader("User-Agent", "BrewBench-Stick/" + VERSION);
      http.addHeader("Content-Type", "application/json");
      int responseCode = http.POST(data);
      http.end();

      if (responseCode == 200)
      {
      
      }
      else if (responseCode == 429)
      {
      
      }
      else if (responseCode == -1)
      {
        reboot();
      }
      else
      {
      
      }
    }
  }
}

void getTemps()
{
  runActions();
}

void startWebServer()
{
  preferences.begin("brewbench", false);
  api_key = preferences.getString("API_KEY");
  device_name = preferences.getString("DEVICE_NAME");
  device_id = preferences.getString("DEVICE_ID");
  temp_unit = preferences.getString("TEMP_UNIT");
  temp_adjust = preferences.getFloat("TEMP_ADJ") ? preferences.getFloat("TEMP_ADJ") : 0.00;
  ambient_adjust = preferences.getFloat("AMB_ADJ") ? preferences.getFloat("AMB_ADJ") : 0.00;

  if (preferences.getUInt("FREQ_SEC") >= 900)
    FREQUENCY_SECONDS = preferences.getUInt("FREQ_SEC");
  else
    FREQUENCY_SECONDS = 900;
  
  preferences.end();
  webServer.begin();

  webServer.on("/info", []() {
    String data = "{";
    data += "\"model\": \"BrewBench Stick\"";
    data += ",\"type\":\"temp\"";
    data += ",\"version\": \""+String(VERSION)+"\"";
    data += ",\"temp\": \""+String(temp)+"\"";
    data += ",\"temp_unit\":\"C\"";
    data += ",\"temp_adjust\": \""+String(temp_adjust)+"\"";
    data += ",\"ambient\": \""+String(ambient)+"\"";
    data += ",\"ambient_unit\":\"C\"";
    data += ",\"ambient_adjust\": \""+String(ambient_adjust)+"\"";
    data += ",\"humidity\": \""+String(humidity)+"\"";
    data += ",\"frequency\": "+String(FREQUENCY_SECONDS)+"";
    data += ",\"device_id\":\"" + String(device_id) + "\"";
    data += ",\"device_name\": \""+String(device_name)+"\"";
    data += ",\"device_ip\": \""+ WiFi.localIP().toString()+"\"";
    data += ",\"rssi\": "+String(WiFi.RSSI());
    data += ",\"mac\":\"" + String(WiFi.macAddress())+"\"";
    data += "}";
    webServer.send(200, "application/json", data);
  });
    
  if (settingMode)
  {
      webServer.on("/settings", []() {
      String s = "<h1 class='ui header'>Wi-Fi Settings</h1>";
      s += "<p>Please select your Wi-Fi SSID and enter the Wi-Fi password.</p>";
      s += "<form method='get' action='setap' class='ui form' style='max-width: 400px;'>";
      s += "<h4 class='ui dividing header'>Wi-Fi Settings</h4>";
      s += "<div class='field'>";
      s += "<label>SSID</label>";
      if (ssidList != "")
      {
        s += "<select name='ssid' class='ui dropdown'>";
        s += ssidList;
        s += "</select>";
      }
      else
      {
        s += "<input name='ssid' type='text'>";
      }
      s += "</div>";
      s += "<div class='field'><label>Password </label><input name='pass' length=64 type='text'></div>";
      s += "<h4 class='ui dividing header'>BrewBench Settings</h4>";
      s += "<i>(These can be updated/entered later)</i><br/>";
      s += "<a href='https://brewbench.co' target='_blank'>https://brewbench.co</a><br/><br/>";
      s += "<div class='field'><label>API Key</label><input name='api_key' length=255 type='text'></div>";
      if(device_id.length() > 0 && device_id != "notset")
        s += "<div class='field'><label>Device Name</label><input name='device_name' length=255 type='text'></div>";
      else
        s += "<div class='field'><label class='ui red label'>Device Name</label><input name='device_name' length=255 type='text'></div>";      
      s += "<div class='field'><label>Frequency Update</label><div class='ui right labeled input'>";
      s += "<input name='freq' min='15' type='number' length=255 value='" + String(FREQUENCY_SECONDS / 60) + "'> <div class='ui basic label'>Minutes</div></div></div>";
      s += "<div class='field'><label>Temp Adjustment</label><div class='ui right labeled input'><input name='temp_adjust' step='any' type='number' value='" + String(temp_adjust) + "'><div class='ui basic label'>&deg;C</div></div> <i>1 &deg;F = 0.555 &deg;C</i></div>";
      s += "<div class='field'><label>Ambient Adjustment</label><div class='ui right labeled input'><input name='ambient_adjust' step='any' type='number' value='" + String(ambient_adjust) + "'><div class='ui basic label'>&deg;C</div></div> <i>1 &deg;F = 0.555 &deg;C</i></div>";
      s += "<div class='field'><label>Display Temp Unit</label><select name='temp_unit' class='ui dropdown'>";
      if (temp_unit == "F")
        s += "<option selected>F</option>";
      else
        s += "<option>F</option>";
      if (temp_unit == "C")
        s += "<option selected>C</option>";
      else
        s += "<option>C</option>";
      s += "</select></div><br/>";
      s += "<input type='submit' value='Save Settings' class='ui primary button'>";
      s += "</form><br/>";
      webServer.send(200, "text/html", makePage("Wi-Fi Settings", s));
    });

    webServer.on("/setap", []() {
      String ssid = urlDecode(webServer.arg("ssid"));
      String pass = urlDecode(webServer.arg("pass"));
      
      preferences.begin("brewbench", false);

      // Store wifi config
      Serial.println("Writing Password to nvr...");
      preferences.putString("WIFI_SSID", ssid);
      preferences.putString("WIFI_PASSWD", pass);

      // Store api key
      api_key = urlDecode(webServer.arg("api_key"));
      
      preferences.putString("API_KEY", urlDecode(webServer.arg("api_key")));

      // Store name
      Serial.println("Writing Name to nvr...");
      preferences.putString("DEVICE_NAME", urlDecode(webServer.arg("device_name")));
      if(webServer.arg("device_id").length() > 0)
        preferences.putString("DEVICE_ID", urlDecode(webServer.arg("device_id")));
        
      if (urlDecode(webServer.arg("temp_unit")) == "C" || urlDecode(webServer.arg("temp_unit")) == "F")
        preferences.putString("TEMP_UNIT", urlDecode(webServer.arg("temp_unit")));
      else
        preferences.putString("TEMP_UNIT", temp_unit);

      if (urlDecode(webServer.arg("freq")).toInt() >= 15)
        preferences.putUInt("FREQ_SEC", (urlDecode(webServer.arg("freq")).toInt() * 60));
      else
        preferences.putUInt("FREQ_SEC", 900);

      preferences.putFloat("TEMP_ADJ", urlDecode(webServer.arg("temp_adj")).toFloat());
      preferences.putFloat("AMB_ADJ", urlDecode(webServer.arg("amb_adj")).toFloat());

      preferences.end();

      Serial.println("Write nvr done!");

      String s = "<div class='ui positive message'><div class='header'>Wi-Fi Connect.</div>";
      s += "<p>Device is rebooting and will connect to the <label class='ui label'>" + String(ssid) + "</label> Wi-Fi network.</p>";
      s += "<p>Look at the device for the web service IP address then connect to that in your browser.</p>";
      s += "</div>";

      webServer.send(200, "text/html", makePage("Wi-Fi Settings", s));

      delay(3000);
      WiFi.disconnect(true, true);
      ESP.restart();
    });
    webServer.onNotFound([]() {
      String s = "<h1 class='ui header'>BrewBench AP mode</h1>";
      s += "<p><a href='settings' class='ui button'>Configure Wi-Fi Settings</a></p>";
      s += "<p><a href='reset' class='ui button'>Reset All Settings</a></p>";
      webServer.send(200, "text/html", makePage("AP mode", s));
    });
  }
  else
  {
    webServer.on("/post", []() {
      secondCounter = 0;
      postData();
      String s = "<div class='ui positive message'><div class='header'>BrewBench Data has been Posted</div>";
      s += "<p><a href='/'>return to main settings page.</a></p></div>";
      webServer.send(200, "text/html", makePage("Post Data", s));
    });

    webServer.on("/firmware", []() {
      if (hasUpdate(VERSION))
      {
        String s = "<div class='ui warning message'><div class='header'>BrewBench is being updated...</div>";
        s += "<p>Wait for BrewBench Stick to reboot then <a href='/'>return to main settings page.</a></p></div>";
        webServer.send(200, "text/html", makePage("Firmware Update", s));
        settingMode = true;
        execOTA();
      }
      else
      {
        String s = "<div class='ui info message'><div class='header'>You have the latest firmware...</div>";
        s += "<p><a href='/'>Return to main settings page.</a></p></div>";
        webServer.send(200, "text/html", makePage("Firmware Update", s));
      }
    });

    webServer.on("/", []() {
      String s = "<h1 class='ui header'>BrewBench Stick</h1>";
      if(device_id.length() == 0)
        s += "<div class='ui warning message'>Connect this device with the BrewBench Monitor App.</div>";      
      s += "<form method='get' action='edit' class='ui form' style='max-width: 400px;'>";
      s += "<h4 class='ui dividing header'>Settings</h4>";
      s += "<p><a href='/reset' class='ui button' onclick=\"return confirm('Are you sure you want to reset WiFi and all settings?');\">Reset All Settings</a></p>";
      s += "<h4 class='ui dividing header'>Firmware Settings</h4>";
      s += "<div class='two fields'>";
      s += "<div class='field'><label>Update</label> <a href='/firmware' class='ui button'>Firmware Update</a></div>";
      s += "<div class='field'><label>Version</label> " + VERSION + "</div>";
      s += "</div><h4 class='ui dividing header'>BrewBench Settings</h4>";
      s += "<div class='ui info message'>Set alerts in the app</div>";
      s += "<div class='three fields'>";
      if (api_key.length() > 0)
        s += "<div class='field'><label>API Key</label> Ok <span style='font-size: 18px; color:#21ba45;'>&check;</span></div>";
      else
        s += "<div class='field'><label>API Key</label> Missing <span style='font-size: 18px; color:#db2828;'>&times;</span></div>";
      s += "<div class='field'><label>Frequency</label> " + String(FREQUENCY_SECONDS / 60) + " Minutes</div>";
      s += "<div class='field'><label>Next Post</label> " + String(FREQUENCY_SECONDS - secondCounter) + " Seconds</div></div>";
      s += "<div class='three fields'>";
      s += "<div class='field'><label>Display Temp Unit</label> &deg;" + String(temp_unit) + "</div>";
      s += "<div class='field'><label>Temp Adjustment</label> " + String(temp_adjust) + " &deg;C</div>";
      s += "<div class='field'><label>Ambient Adjustment</label> " + String(ambient_adjust) + " &deg;C</div>";
      s += "</div><div class='ui fluid card'><div class='content center aligned'><div class='header'>";
      if (device_name.length() > 0)
        s += device_name + " <span style='font-size: 18px; color:#21ba45;'>&check;</span>";
      else
        s += "Missing Name <span style='font-size: 18px; color:#db2828;'>&times;</span>";
      
      s += "</div></div><div class='content center aligned'><div class='ui tiny three statistics'>";

      if (temp == DEVICE_DISCONNECTED_C || isnan(temp))
        s += "<div class='blue statistic'><div class='value'>N/A</div><div class='label'>Temp</div></div>";
      else if (temp && temp != NULL && temp_unit == "F")
        s += "<div class='blue statistic'><div class='value'>" + String((temp * 9 / 5) + 32) + "&deg;F</div><div class='label'>Temp</div></div>";
      else if (temp && temp != NULL)
        s += "<div class='blue statistic'><div class='value'>" + String(temp) + "&deg;C</div><div class='label'>Temp</div></div>";
      else
        s += "<div class='blue statistic'><div class='value'>N/A</div><div class='label'>Temp</div></div>";

      if (ambient && ambient != NULL && temp_unit == "F")
        s += "<div class='purple statistic'><div class='value'>" + String((ambient * 9 / 5) + 32) + "&deg;F</div><div class='label'>Ambient</div></div>";
      else if (ambient && ambient != NULL)
        s += "<div class='purple statistic'><div class='value'>" + String(ambient) + "&deg;C</div><div class='label'>Ambient</div></div>";
      else
        s += "<div class='purple statistic'><div class='value'>N/A</div><div class='label'>Ambient</div></div>";

      if (humidity && humidity != NULL)
        s += "<div class='orange statistic'><div class='value'>" + String(humidity) + "%</div><div class='label'>Humidity</div></div>";
      else
        s += "<div class='orange statistic'><div class='value'>N/A</div><div class='label'>Humidity</div></div>";
        
      s += "</div></div></div>";
      s += "<div class='field center aligned'><a class='ui button' href='/post'>Post Data</a> <input type='submit' value='Edit Settings' class='ui primary button'></div>";
      s += "</form>";
      webServer.send(200, "text/html", makePage("BrewBench Stick", s));
    });
    
    webServer.on("/edit", []() {
      String s = "<h1 class='ui header'>BrewBnech Settings</h1>";
      s += "<div class='ui info message'>Connect this device with the BrewBench Monitor App. ";
      s += "<a href='https://brewbench.co/app' target='_blank'>https://brewbench.co/app</a></div>";
      s += "<form method='get' action='update_settings' class='ui form' style='max-width: 400px;'>";
      s += "<div class='field'><label>API Key</label><input name='api_key' length=255 type='text' value='" + api_key + "'></div>";
      if(device_id.length() > 0 && device_id != "notset")
        s += "<div class='field'><label>Device Name</label><input name='device_name' length=255 type='text' value='" + device_name + "'></div>";
      else
        s += "<div class='field'><label class='ui red label'>Device Name</label><input name='device_name' length=255 type='text' value='" + device_name + "'></div>";
      s += "<div class='field'><label>Frequency Update</label><div class='ui right labeled input'>";
      s += "<input name='freq' min='15' type='number' length=255 value='" + String(FREQUENCY_SECONDS / 60) + "'> <div class='ui basic label'>Minutes</div></div></div>";
      s += "<div class='field'><label>Temp Adjustment</label><div class='ui right labeled input'><input name='temp_adjust' step='any' type='number' value='" + String(temp_adjust) + "'><div class='ui basic label'>&deg;C</div></div> <i>1 &deg;F = 0.555 &deg;C</i></div>";
      s += "<div class='field'><label>Ambient Adjustment</label><div class='ui right labeled input'><input name='ambient_adjust' step='any' type='number' value='" + String(ambient_adjust) + "'><div class='ui basic label'>&deg;C</div></div> <i>1 &deg;F = 0.555 &deg;C</i></div>";
      s += "<div class='field'><label>Display Temp Unit</label><select name='temp_unit' class='ui dropdown'>";
      if (temp_unit == "F")
        s += "<option selected>F</option>";
      else
        s += "<option>F</option>";
      if (temp_unit == "C")
        s += "<option selected>C</option>";
      else
        s += "<option>C</option>";
      s += "</select></div>";
      s += "<div class='field center aligned'><a href='/' class='ui button'>Cancel</a> <input type='submit' value='Save Settings' class='ui primary button'></div>";
      s += "</form>";
      webServer.send(200, "text/html", makePage("Edit Settings", s));
    });
    webServer.on("/update_settings", []() {
      preferences.begin("brewbench", false);

      // Store api key
      Serial.println("Writing API Key to nvr...");
      preferences.putString("API_KEY", urlDecode(webServer.arg("api_key")));

      // Store name
      Serial.println("Writing Name to nvr...");
      preferences.putString("DEVICE_NAME", urlDecode(webServer.arg("device_name")));
      if(webServer.arg("device_id").length() > 0)
        preferences.putString("DEVICE_ID", urlDecode(webServer.arg("device_id")));
        
      if (urlDecode(webServer.arg("temp_unit")) == "C" || urlDecode(webServer.arg("temp_unit")) == "F")
        preferences.putString("TEMP_UNIT", urlDecode(webServer.arg("temp_unit")));
      else
        preferences.putString("TEMP_UNIT", temp_unit);

      if (urlDecode(webServer.arg("freq")).toInt() >= 15)
        preferences.putUInt("FREQ_SEC", (urlDecode(webServer.arg("freq")).toInt() * 60));
      else
        preferences.putUInt("FREQ_SEC", 900);

      preferences.putFloat("TEMP_ADJ", urlDecode(webServer.arg("temp_adjust")).toFloat());
      preferences.putFloat("AMB_ADJ", urlDecode(webServer.arg("ambient_adjust")).toFloat());

      preferences.end();

      Serial.println("Write nvr done!");
      String s = "<div class='ui positive message'><div class='header'>Settings Updated</div>";
      s += "<p>Device is rebooting...Wait 10 seconds then <a href='/'>return to main settings page.</a></p></div>";
      webServer.send(200, "text/html", makePage("Settings", s));
      delay(3000);
      reboot();
    });
  }
  webServer.begin();
}

void reset(){
  settingMode = true;
        
  // reset the wifi config
  preferences.begin("wifi-config", false);
  preferences.remove("WIFI_SSID");
  preferences.remove("WIFI_PASSWD");
  preferences.end();  
  preferences.begin("brewbench", false);
  preferences.remove("WIFI_SSID");
  preferences.remove("WIFI_PASSWD");
  preferences.remove("API_KEY");
  preferences.remove("DEVICE_NAME");
  preferences.remove("DEVICE_ID");
  preferences.remove("TEMP_UNIT");
  preferences.remove("TEMP_ADJ");
  preferences.remove("AMB_ADJ");
  preferences.end();
  WiFi.disconnect(true, true);
  ESP.restart();
}

void setupMode()
{
  startWebServer();
}

String makePage(String title, String contents)
{
  String s = "<!DOCTYPE html><html><head>";
  s += "<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/fomantic-ui/2.8.4/semantic.min.css\" crossorigin=\"anonymous\" />";
  s += "<meta name=\"viewport\" content=\"width=device-width,user-scalable=0\">";
  if (title == "BrewBench Stick")
    s += "<meta http-equiv='refresh' content='60'>";
  s += "<title>" + title;
  if (device_name.length() > 0)
  {
    s += " | " + device_name;
  }
  s += "</title></head><body style='padding: 10px;'>";
  s += contents;
  s += "<div class='ui message'>Version: " + VERSION + " &copy; 2020 <a href='https://www.brewbench.co' target='_blank'>BrewBench</a></div>";
  s += "</body></html>";
  return s;
}

String urlDecode(String input)
{
  String s = input;
  s.replace("%20", " ");
  s.replace("+", " ");
  s.replace("%21", "!");
  s.replace("%22", "\"");
  s.replace("%23", "#");
  s.replace("%24", "$");
  s.replace("%25", "%");
  s.replace("%26", "&");
  s.replace("%27", "\'");
  s.replace("%28", "(");
  s.replace("%29", ")");
  s.replace("%30", "*");
  s.replace("%31", "+");
  s.replace("%2C", ",");
  s.replace("%2E", ".");
  s.replace("%2F", "/");
  s.replace("%2C", ",");
  s.replace("%3A", ":");
  s.replace("%3A", ";");
  s.replace("%3C", "<");
  s.replace("%3D", "=");
  s.replace("%3E", ">");
  s.replace("%3F", "?");
  s.replace("%40", "@");
  s.replace("%5B", "[");
  s.replace("%5C", "\\");
  s.replace("%5D", "]");
  s.replace("%5E", "^");
  s.replace("%5F", "-");
  s.replace("%60", "`");
  return s;
}

void getHostname(){
  Process p;
  p.runShellCommand("uname -n");
  while(p.running());
  if(p.available() > 0) {
   HOSTNAME = p.readString();
  }
  HOSTNAME.trim();
  if(!HOSTNAME || HOSTNAME == "")
    HOSTNAME = "missing";
}

void setup()
{

  pinMode(LED, OUTPUT);
  digitalWrite(LED, HIGH);

  Wire.begin(0, 26);
  getHostname();
  
  startWebServer();
  setupMode();
}

void updateCheckPowerOff(){
    // check for firmware update
    if (hasUpdate(VERSION))
    {
      settingMode = true;
      execOTA();
    }
}

void loop()
{
  secondCounter += 1;

  webServer.handleClient();

  if (!offlineMode && !settingMode)
  {
    if (secondCounter == FREQUENCY_SECONDS)
    {
      secondCounter = 0;
      getTemps();
      postData();
      updateCheckPowerOff();
    }
  } else if(!offlineMode && settingMode){
    preferences.begin("brewbench", false);
    api_key = preferences.getString("API_KEY");
    device_id = preferences.getString("DEVICE_ID");
    preferences.end();
    // let's reboot incase we got offline
    if(secondCounter == FREQUENCY_SECONDS && api_key.length() > 0 && device_id.length() > 0){
      reboot();
    }
  }

  if (offlineMode && secondCounter % 10 == 0)
  {
    getTemps();
  }

  delay(1000);
}
