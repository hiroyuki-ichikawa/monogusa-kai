int       led = 13;       // Arduinoで波形を見たいときに、リレーのプラス側をここに接続する
const int analogIn = A0;
int       mVperAmp = 185; // 100V20A Module用
int       RawValue = 0;
int       ACSoffset = 2500; 
double    Voltage = 0;
double    Amps = 0;

void setup() {
  // シリアル通信速度の設定
  Serial.begin( 9600 );
  // 13pinを出力モードに設定
  pinMode( led, OUTPUT );
}


void loop() {
  // リレーテスト用に13pinは常にHighとする
  digitalWrite( led, HIGH );

  // センサーから電圧を得る
  RawValue = analogRead( analogIn );
  Voltage = ( RawValue / 1024.0 ) * 5000;         // 電圧を得る
  Amps = ( ( Voltage - ACSoffset ) / mVperAmp );  // 

  Serial.println( Amps );                         // 改行付きでシリアルに出力する

  // ウエイトを入れる
  delay( 10 );
}
