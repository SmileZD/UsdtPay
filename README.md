# UsdtPay
开源的trc20链上usdt简易收银，有支付回调

语言：Nodejs
框架：Express

其他语言可以通过http协议调用它

使用条件：

1、获取ApiKey：https://www.trongrid.io
不获取也可以，有访问限制；

2、克隆项目
```
git clone https://github.com/SmileZD/UsdtPay.git
```
2、安装nodejs和pm2
```
#安装nodejs16
wget https://cdn.npmmirror.com/binaries/node/latest-v16.x/node-v16.16.0-linux-x64.tar.xz
tar -xvf node-v16.16.0-linux-x64.tar.xz
cp -r ./node-v16.16.0-linux-x64 /usr/local/
rm -rf ./node-v16.16.0-linux-x64
rm -rf ./node-v16.16.0-linux-x64.tar.xz
ln -s /usr/local/node-v16.16.0-linux-x64/bin/npm /usr/local/bin
ln -s /usr/local/node-v16.16.0-linux-x64/bin/node /usr/local/bin
#安装pm2
npm i pm2 -g
ln -s /usr/local/node-v16.16.0-linux-x64/lib/node_modules/pm2/bin/pm2-runtime /usr/local/bin
ln -s /usr/local/node-v16.16.0-linux-x64/lib/node_modules/pm2/bin/pm2 /usr/local/bin
ln -s /usr/local/node-v16.16.0-linux-x64/lib/node_modules/pm2/bin/pm2-dev /usr/local/bin
ln -s /usr/local/node-v16.16.0-linux-x64/lib/node_modules/pm2/bin/pm2-docker /usr/local/bin
```
3、导入数据库
```
wait
```
4、修改配置(配置在app.js开头)
```
cd UsdtPay
vim app.js
```
5、启动项目进行调试
```
node app
```
5、正式上线
```
pm2 start app.js --name usdtpay
```

API文档：

/createorder

  POST 
  入参：
  order_sn| amount|/
  ------- |----------|----------
  外部订单号| 下单金额|/
  string| string|/
  50位以内varchar| 最多两位小数|/
  必填| 必填|/

返参：
  成功| 失败
  ------- |----------
  { code: 0, message: '下单成功',data:{} }| { code: 1, message: '失败原因' }
data:{ amount: 实际下单金额 , discount: 优惠金额 , order_sn: 内部订单号 }

/upay?order=xxxxxxxxx

GET
  入参：
  order|/
  ------- |----------
  内部订单号| /
  string| /
  由createorder接口返回|/
  必填| /
  
 返参：usdt收银HTML页面
