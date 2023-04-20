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
const address = 'TNG2SSSTyTksybJEDhjnkGwAt7w4x1p8U4';//收银地址
const apiKey = 'defbb8c5-b5e9-4a2d-a011-fd0cd45175f1';//用于提高tron网络的可访问频率 可不填
//++++++++配置++++++++++++
const TronWeb = require('tronweb')
const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider("https://api.trongrid.io");
const solidityNode = new HttpProvider("https://api.trongrid.io");
const eventServer = new HttpProvider("https://api.trongrid.io");
const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);
tronWeb.setHeader({ "TRON-PRO-API-KEY": apiKey });
const bodyParser = require('body-parser')
const express = require('express')
const mysql = require('mysql');
const request = require('request');
const schedule = require('node-schedule');
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
    //url 支付成功后跳转链接 255位varchar 可不填
    if (!req.body.order_sn || !req.body.amount) {
        res.json({ code: 1, message: '参数丢失' })
    } else {
        var amount = req.body.amount;
        const order_sn = getOrderSn();
        //初始金额随机优惠
        var amount_after = (parseFloat(amount) - unit * (Math.floor(Math.random() * 100) + 1)).toFixed(unit.toString().length - 2);
        //查询所有待支付的订单
        client.query('SELECT amount FROM `order` WHERE status = 1',
            function selectCb(err, r1) {
                if (err) { res.json({ code: 1, message: '服务异常' }); return }
                if (r1.length > 0) {
                    //如果金额冲突了减unit
                    amount_after = checkAmount(amount_after, r1)
                }
                const time = Math.floor(Date.now() / 1000)
                client.query("INSERT INTO `order` (`order_sn`, `out_order_sn`, `amount`, `url`, `create_time`, `update_time`) VALUES (?,?,?,?,?,?)", [
                    order_sn, req.body.order_sn, amount_after, req.body.url ?? '', time, time
                ], function (err, r2) {
                    if (err) { res.json({ code: 1, message: '服务异常' }); return }
                    res.json({ code: 0, message: '下单成功', data: { amount: amount_after, discount: (parseFloat(amount) - amount_after).toFixed(unit.toString().length - 2), order_sn: order_sn } })
                })
            })
    }
})
app.post('/balance', (req, res) => {
    //查询address地址的trc和usdt余额 不传address则查询收银地址的余额
    var addressQ = req.body.address ?? address
    request({url: 'https://api.trongrid.io/v1/accounts/' + addressQ, headers: { "TRON_PRO_API_KEY": apiKey }
    }, (err, rep, body) => {
        if (err) { res.json({ code: 1, message: '请求失败' }); return false; }
        if (body && body.success) {
            res.json({ code: 0, message: '查询成功', data: { trx: tronWeb.fromSun(body.data[0].balance), usdt: tronWeb.fromSun(body.data[0].trc20[0]['TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t']) } })
        } else { res.json({ code: 1, message: '请求失败' }) }
    })
})
app.listen(port, () => { console.log(`服务运行于 ${port} 端口`) })
//定时任务 每10秒查一次数据库 将待支付状态的订单收款地址查询最近交易 金额是否匹配 匹配则更新数据库
schedule.scheduleJob('1', '0/10 * * * * ?', () => {
    try {
        client.query('SELECT amount,id,create_time FROM `order` WHERE status = 1 ORDER BY create_time DESC',
        function selectCb(err, r1) {
            console.log(r1)
            if(!err&&r1.length>0){
                let orderDone=checkOrder(r1,r1[0]['create_time'])
                if(orderDone.length>0){
                    const time = Math.floor(Date.now() / 1000)
                    client.query('UPDATE `order` SET status = 2,update_time = ? WHERE id in (?)',[time,orderDone.toString()],
                    function selectCb(err, r2) {
                        if (!err) {console.log((new Date()).toLocaleString() + ' 更新了' + r2.affectedRows + '行已完成订单:'+orderDone.toString())}
                    })
                }
            }
        })
    } catch (e) { }
})

//定时任务 每2分钟更新一次数据库 将过期的订单状态更新(虽然前端是15分钟订单过期 但是后台可以设置两倍的超时时间 以防止客户在最后期限付款 而链上数据同步可能慢)
schedule.scheduleJob(2, '0 0/2 * * * ? ', () => {
    try {
        const time = Math.floor(Date.now() / 1000)
        client.query('UPDATE `order` SET status = 3,update_time = ? WHERE status = 1 AND create_time < ?', [
            time, Math.floor(Date.now() / 1000) - exptime * 2
        ], function selectCb(err, r1) { if (!err) { console.log((new Date()).toLocaleString() + ' 更新了' + r1.affectedRows + '行过期订单'); } })
    } catch (e) { }
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
function checkOrder(results,time){
    //查询收银地址最近的trc20链usdt交易
    request({url: 'https://api.trongrid.io/v1/accounts/' + address+'/transactions/trc20?contract_address=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t&only_to=true&only_confirmed=true&limit=200&min_timestamp='+time+'000', headers: { "TRON_PRO_API_KEY": apiKey }
    }, (err, rep, body) => {
        if(err){return []}
        if (body) {
            try {
                var data=JSON.parse(body).data
                var orderList={};
                for (let i = 0; i < results.length; i++) {
                    orderList[tronWeb.toSun(parseFloat(results['amount']))]=results['id']
                }
                var orderDone=[];
                for (let i = 0; i < data.length; i++) {
                    if(orderList[data[i].value]){
                        //交易存在 说明已完成
                        orderDone.push(orderList[data[i].value])
                    }
                }
                return orderDone
            } catch (e) {return []}
        } else {
            console.log(err)
            return []
        }
    })
}