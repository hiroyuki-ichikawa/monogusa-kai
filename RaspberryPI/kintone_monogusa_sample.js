// requestモジュールを取り込む
var request = require('request');

// シリアルポートの通信の設定
var serialPort = require("serialport")

var str = "";
var func = [];
var GPIO = [];
var use_time = [];
var rec_count = 0;
var count = 0;
var SetTime = -1;
var IntervalTime = 0;
var PassTime = 0;

request({
    method: 'GET',
    // 自分のKintoneのURLをurlに記入する
    url: 'https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    headers: {
        // 作成したAPIトークンを設定
        'X-Cybozu-API-Token': 'Your API Token',
        'Content-Type': 'application/json'
    },
    json: {
        // 今回作成したアプリ番号を登録
        app: Your App No.,
        query : ""
    }
}, function(err, response, body ){
  //console.log(JSON.stringify(body));

  // 全件検索の中から必要なものを引っ張り出す
  ret = JSON.parse(JSON.stringify(body));
  
  console.log( ret.records.length );
  rec_count = ret.records.length;

  // Kintone内のデータを読み込む。1つ目のレコードを採用する
  for( ix = 0 ; ix < rec_count; ix++ ){
    func[ ix ] = ret.records[ix].func.value;
    GPIO[ ix ] = ret.records[ix].GPIO.value;
    use_time[ ix ] = ret.records[ix].use_time.value;

    console.log( ret.records[ix].func.value );
    console.log( ret.records[ix].GPIO.value );
    console.log( ret.records[ix].use_time.value );
  }

  ///////////////////////////
  // シリアル通信用の処理

  // onoff ライブラリーの取り込み
  var Gpio = require('onoff').Gpio,led = new Gpio( GPIO[ 0 ], 'out')
  led.writeSync(1)

  // /dev/ttyACM0の部分のポート番号はArduinoとつないでいる
  // RaspberryPIのポートを利用してください
  var sp = new serialPort("/dev/ttyACM0", {
    baudRate: 9600 
  //  parser:serialPort.parsers.readline("\n")
  });

  const Readline = serialPort.parsers.Readline;
  const parser = sp.pipe(new Readline({ delimiter: '\n' }));

  // シリアルよりデータが来た際の処理
  sp.on('data', function(data) {
    str += data;
    // 電圧の返却値を数値に合成
    if( str.match(/\n/)){
      // 得られた文字列の処理
      result = str.replace( '\n' , "" )
      str = "";
      // console.log('data : ' + result); // ログ見たいときはコメントアウト
      // 現在電圧の絶対値を確認
      now = Math.abs(Number(result));
      // 電圧がxx以上であれば利用中、ここについては、対象家電によって調整が必要
      if( now > 0.3 ){
        if( SetTime < 0 ){  // 電圧が閾値を初めて超えた時
          SetTime = new Date();
          console.log(SetTime);
        }else{
          // そうでなければ通過時間をカウントする、現在最終の時間分が積めていない
          PassTime += ( new Date() - IntervalTime );
        }
        IntervalTime = new Date();

        // 指定の秒数を超えた場合の処理
        if( ( PassTime / 1000 ) > use_time[ 0 ] ){
          led.writeSync(0);   // リレーのスイッチを切る
        } 
      }else{
          // 1秒以上電圧が一定以下ならカウンタをリセット
          var currentTime = new Date();
          if( ( ( currentTime - IntervalTime ) / 1000 ) > 1 ){
            SetTime = -1; 
            IntervalTime = 0;
          }
      }
    }
  });
});

// 例外終了時の処理
process.on('SIGINT', function () {
    led.unexport()
    console.log('*** end ***')
})

