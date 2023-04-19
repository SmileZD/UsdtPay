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
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for address
-- ----------------------------
DROP TABLE IF EXISTS `address`;
CREATE TABLE `address`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `address` char(34) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '收款地址',
  `path` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '地址路劲',
  `key` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '地址私钥',
  `balance` decimal(10, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '累计入账金额',
  `status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态 1空闲 2被占用',
  `update_time` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '收款地址表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for order
-- ----------------------------
DROP TABLE IF EXISTS `order`;
CREATE TABLE `order`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_sn` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '订单号',
  `out_order_sn` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '外部订单号',
  `address` char(34) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '收款地址',
  `amount` decimal(10, 4) UNSIGNED NOT NULL DEFAULT 0.0000 COMMENT '总金额',
  `amount_remain` decimal(10, 4) UNSIGNED NOT NULL DEFAULT 0.0000 COMMENT '剩余应付金额',
  `status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态 1待支付 2部分支付 3支付完成 4已过期',
  `pay_time` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '支付时间',
  `create_time` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '下单时间',
  `update_time` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `order_sn`(`order_sn`) USING BTREE COMMENT '订单号唯一',
  UNIQUE INDEX `out_order_sn`(`out_order_sn`) USING BTREE COMMENT '外部订单号唯一'
) ENGINE = InnoDB AUTO_INCREMENT = 50 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '订单表' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
```
4、修改配置(配置在js开头)
```
cd UsdtPay
vim web.js
vim private.js
```
5、启动项目进行调试
```
node web
node private
```
5、正式上线
```
pm2 start web.js --name usdtpayweb
pm2 start private.js --name usdtpay
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
