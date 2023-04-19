//++++++++配置++++++++++++
const port = 3001;//服务运行端口
//订单配置
const exptime = 15 * 60;//订单失效时间 默认15分钟
const unit = 0.0001;//金额最小单位 建议不改
//数据库配置
const mysqlUsername = 'root';
const mysqlPassword = '123456';
const mysqlDatabase = 'usdt';
const mysqlHost = '127.0.0.1';
const mysqlPort = 3306;
//usdt配置
const address = 'TNG2SSSTyTksybJEDhjnkGwAt7w4x1p8U4';//默认收银地址 余额归集地址
const apiKey = 'defbb8c5-b5e9-4a2d-a011-fd0cd45175f1';//用于提高tron网络的可访问频率 可不填
//++++++++配置++++++++++++
const TronWeb = require('tronweb')
const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider("https://api.trongrid.io");
const solidityNode = new HttpProvider("https://api.trongrid.io");
const eventServer = new HttpProvider("https://api.trongrid.io");
const tronWeb = new TronWeb(fullNode,solidityNode,eventServer);
tronWeb.setHeader({"TRON-PRO-API-KEY": apiKey});
const bodyParser = require('body-parser')
const express = require('express')
const mysql = require('mysql');
const request = require('request');
const schedule = require('node-schedule')
const app = express()
var client = mysql.createConnection({
    user: mysqlUsername,
    password: mysqlPassword,
    database: mysqlDatabase,
    host: mysqlHost,
    port: mysqlPort
});
client.connect()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.post('/createorder', (req, res) => {
    //amount 下单金额 最多两位小数 
    //order_sn 订单号 50位varchar
    if (!req.body.order_sn || !req.body.amount) {
        res.json({ code: 1, message: '参数丢失' })
    } else {
        var amount = req.body.amount;
        const order_sn = getOrderSn();
        //查询空闲的收款地址 如果有直接生成订单 如果没有避开重复金额
        client.query('SELECT address,id FROM `address` WHERE status = 1',
            function selectCb(err, r1) {
                if (err) { res.json({ code: 1, message: '服务异常' }); return }
                if (r1.length > 0) {
                    //有空闲的收款地址
                    //更新地址状态为已使用
                    client.query('UPDATE `address` SET status = 2 WHERE status = 1 AND id = ?', [orderAddress = r1[0]['id']], function (err, r2) {
                        if (err || r2.affectedRows == 0) { res.json({ code: 1, message: '服务异常' }); return }
                        //插入订单数据
                        const orderAddress = r1[0]['address'];
                        const amount_after = parseFloat(amount)
                        const time = Math.floor(Date.now() / 1000)
                        client.query("INSERT INTO `usdt`.`order` (`order_sn`, `out_order_sn`, `address`, `amount`, `amount_remain`, `pay_time`, `create_time`, `update_time`) VALUES (?, ?, ?, ?, 0.00, 0, ?, ?)", [
                            order_sn, req.body.order_sn, orderAddress, amount_after, time, time
                        ], function (err, r3) {
                            if (err) { res.json({ code: 1, message: '服务异常' }); return }
                            res.json({ code: 0, message: '下单成功', data: { amount: amount_after, discount: (parseFloat(amount) - amount_after).toFixed(unit.toString().length - 2), order_sn: order_sn } })
                        })
                    });
                } else {
                    //无空闲的收款地址 取默认地址
                    const orderAddress = address
                    //初始金额随机优惠
                    var amount_after = (parseFloat(amount) - unit * (Math.floor(Math.random() * 100) + 1)).toFixed(unit.toString().length - 2);
                    //查询所有待支付和部分支付的订单
                    client.query('SELECT amount FROM `order` WHERE status = 1 OR status = 2',
                        function selectCb(err, r4) {
                            if (err) { res.json({ code: 1, message: '服务异常' }); return }
                            if (r4.length > 0) {
                                //如果金额冲突了减unit
                                amount_after = checkAmount(amount_after, r4)
                            }
                            const time = Math.floor(Date.now() / 1000)
                            client.query("INSERT INTO `usdt`.`order` (`order_sn`, `out_order_sn`, `address`, `amount`, `amount_remain`, `pay_time`, `create_time`, `update_time`) VALUES (?, ?, ?, ?, 0.00, 0, ?, ?)", [
                                order_sn, req.body.order_sn, orderAddress, amount_after, time, time
                            ], function (err, r5) {
                                if (err) { res.json({ code: 1, message: '服务异常' }); return }
                                res.json({ code: 0, message: '下单成功', data: { amount: amount_after, discount: (parseFloat(amount) - amount_after).toFixed(unit.toString().length - 2), order_sn: order_sn } })
                            })
                        })
                }
            }
        )
    }
})
app.post('/balance', (req, res) => {
    //查询address地址的trc和usdt余额
    if (!req.body.address) {
        res.json({ code: 1, message: '参数丢失' })
    } else {
        request({url: 'https://api.trongrid.io/v1/accounts/'+req.query.address,headers: {"TRON_PRO_API_KEY": apiKey}
        },(err,rep,body) => {if(err){res.json({ code: 1, message: '请求失败' });return false;}
            if(body){if(body.success){
                res.json({ code: 0, message: '查询成功',data:{trx:tronWeb.fromSun(body.data[0].balance),usdt:tronWeb.fromSun(body.data[0].trc20[0]['TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'])} })
            }else{
                res.json({ code: 1, message: '请求失败' })
            }}else{res.json({ code: 1, message: '请求失败' })}
        })
    }
})
app.listen(port, () => { console.log(`服务运行于 ${port} 端口`) })
//定时任务 每5秒查一次数据库 将待支付状态的订单收款地址查询最近交易 金额是否匹配 匹配则更新数据库
schedule.scheduleJob(1, '0/5 * * * * ?', () => {
    try {
    
    } catch(e) {}
})

//定时任务 每5秒查一次数据库 将过期的订单状态更新
schedule.scheduleJob(2, '0/5 * * * * ?', () => {
    try {
    
    } catch(e) {}
})

function checkAmount(amount, results) {
    if (checkAmountLoop(amount, results)) {
        return amount;
    } else {
        amount = (amount - unit).toFixed(unit.toString().length - 2)
        return checkAmount(amount, results)
    }
}
function checkAmountLoop(amount, results) {
    for (var i = 0; i < results.length; i++) {
        if (amount == results[i]['amount']) {
            return false
        }
    }
    return true
}
function getOrderSn() {
    const now = new Date()
    const year = now.getFullYear();
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let hour = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    String(month).length < 2 ? (month = Number("0" + month)) : month;
    String(day).length < 2 ? (day = Number("0" + day)) : day;
    String(hour).length < 2 ? (hour = Number("0" + hour)) : hour;
    String(minutes).length < 2 ? (minutes = Number("0" + minutes)) : minutes;
    String(seconds).length < 2 ? (seconds = Number("0" + seconds)) : seconds;
    const yyyyMMddHHmmss = `${year}${month}${day}${hour}${minutes}${seconds}`;
    return yyyyMMddHHmmss + Math.floor((Math.random() + 1) * 100000).toString();
}