//++++++++配置++++++++++++
const port = 3000;//服务运行端口
//订单配置
const exptime = 15 * 60;//订单失效时间 默认15分钟
const unit = 0.0001;//金额最小单位 建议不改
//数据库配置
const mysqlUsername = 'root';
const mysqlPassword = '123456';
const mysqlDatabase = 'usdt';
const mysqlHost = '127.0.0.1';
const mysqlPort = 3306;
//++++++++配置++++++++++++
const bodyParser = require('body-parser')
const express = require('express')
const mysql = require('mysql');
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
app.use(express.static('public'))
app.get('/upay', (req, res) => {
    if (!req.query.order) {
        res.send('缺少订单号');
    } else {
        //查询订单号分配的收款地址、金额、订单过期时间
        client.query('SELECT * FROM `order` WHERE (status = 1 OR status = 2) AND order_sn = ?', [req.query.order],
            function selectCb(err, r1) {
                if (err) { res.json({ code: 1, message: '服务异常' }); return }
                if (r1.length < 1) { res.send('无订单记录'); return }
                const amount = r1[0]['amount'];
                const time = (r1[0]['create_time'] + exptime)*1000;
                const address = r1[0]['address'];
                res.send(`
        <!doctype html>
        <html>
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no" />
                <meta name="renderer" content="webkit">
                <meta name="HandheldFriendly" content="True"/>
                <meta name="MobileOptimized" content="320"/>
                <meta name="format-detection" content="telephone=no"/>
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black" />
                <link rel="shortcut icon" href="usdttrc20.svg" />
                <title>USDT收银台</title>
                <style type="text/css">
                    button,hr,input{overflow:visible}audio,canvas,progress,video{display:inline-block}progress,sub,sup{vertical-align:baseline}.content,body,sub,sup{position:relative}.container,.content .action,.content .address,.header,ul.downcount{text-align:center}html{line-height:1.15;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}article,aside,details,figcaption,figure,footer,header,main,menu,nav,section{display:block}h1{font-size:2em;margin:.67em 0}figure{margin:1em 40px}hr{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;height:0}code,kbd,pre,samp{font-family:monospace,monospace;font-size:1em}a{background-color:transparent;-webkit-text-decoration-skip:objects}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}.content .address a,.footer p a,a.btn{text-decoration:none}b,strong{font-weight:bolder}dfn{font-style:italic}mark{background-color:#ff0;color:#000}.container,body{background:#fafbfc}small{font-size:80%}sub,sup{font-size:75%;line-height:0}sub{bottom:-.25em}sup{top:-.5em}audio:not([controls]){display:none;height:0}img{border-style:none}svg:not(:root){overflow:hidden}button,input,optgroup,select,textarea{font-family:sans-serif;font-size:100%;line-height:1.15;margin:0}button,select{text-transform:none}[type=reset],[type=submit],button,html [type=button]{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:ButtonText dotted 1px}fieldset{padding:.35em .75em .625em}legend{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}textarea{overflow:auto}[type=checkbox],[type=radio]{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-cancel-button,[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}[hidden],template{display:none}body,html{font-size:14px;min-height:100vh}body{margin:0;padding:0;direction:ltr;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:none;-ms-touch-action:manipulation;touch-action:manipulation;-webkit-font-feature-settings:"liga" 0;-moz-font-feature-settings:"liga" 0;font-feature-settings:"liga" 0;height:100%;overflow-y:scroll;line-height:normal;caret-color:#c73947;font-family:SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}.container{overflow:hidden;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;min-height:100vh}.header{margin:30px 0 10px;width:360px;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:0 20px}.header .icon{margin-bottom:15px}.header .icon .logo{width:60px;height:60px;overflow:hidden;border-radius:50%;border:5px solid #f8f9fa;background:#fff;-webkit-box-shadow:0 0 5px rgba(0,0,0,.2);box-shadow:0 0 5px rgba(0,0,0,.2)}.header h1{font-size:24px;color:#444;margin-bottom:25px;font-weight:700}.header .warning,.header label{font-size:16px;line-height:1.6em}.header label{color:#777}.header .warning{color:red}.content{margin:10px auto 20px;border-radius:10px;width:340px;background:#fff;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.content .section{padding:0px 10px 5px}.content .title .amount{font-size:24px;font-weight:700;color:#444;margin-bottom:10px;line-height:1.5em}.content .title .amount span{font-size:18px;color:#888}.content .title .amount-value{font-size:18px;color:#444;font-weight:400;margin-bottom:15px}.content .qrcode{width:220px;height:220px;border-radius:5px;overflow:hidden;border:1px solid #f2f2f2}.content .address{font-size:12px;color:#444;margin-bottom:30px;border-radius:5px;white-space:normal;word-break:break-all;line-height:1.5em}.content .address a{display:inline-block;padding:8px 15px;color:#222;font-size:14px;border:1px solid #f2f2f2;margin:25px 0;border-radius:5px;background:#fff}.content .action{margin:20px 0 5px}a.btn{background:#28B463;display:block;padding:12px 0;font-size:16px;color:#fff;width:200px;margin:0 auto;font-weight:400;border-radius:20px;-webkit-transition:all .3s;-o-transition:all .3s;transition:all .3s}a.btn:active,a.btn:focus,a.btn:hover{background:#23a75b}.parse-content{padding:0;margin:0;height:0;border:none;outline:0;overflow:hidden}.footer{margin-bottom:15px}.footer p{color:#888}.footer p a{color:#888!important;padding-bottom:1px;border-bottom:1px solid #888}ul.downcount{list-style:none;margin:10px 0 15px;padding:0;display:block}ul.downcount li{display:inline-block}ul.downcount li span{font-size:24px;font-weight:300;line-height:24px;color:#444}ul.downcount li.seperator{font-size:24px;line-height:24px;vertical-align:top}ul.downcount li p{color:#a7abb1;font-size:14px}@media screen and (max-width:600px){.header{width:300px}.container{height:100%;padding:50px 0 20px}.content{width:320px;width:-webkit-calc(100vw - 40px);width:calc(100vw - 40px)}.content .title .amount{font-size:24px}}
                </style>
            </head>
            <body>
        <div class="container">
            <div class="content">
                <div class="section">
                    <div class="title">
                        <img src="/usdttrc20.svg"  title="Tether USDT (TRC20)" width="66" height="63">
                        <h1 class="amount parse-action" id="payment_r" data-ref="#parse-amount" style="font-size: 40px; margin-top: -10px;margin-bottom: 0px;" data-msg="金额已复制">`+ amount + `</h1>
                        <h2 class="amount parse-action" id="payment_b" style="font-size: 24px;margin-top: -10px;margin-bottom: 0px;" data-msg="金额已复制"></h2>
                        <h1 style="margin-top: -15px;"><span style="font-size: 18px;color: #888;">USDT.TRC20</span></h1>
                    </div>
                    <div class="address parse-action" data-ref="#parse-address" data-msg="地址已复制">`+ address + `</div>
                    <div class="main"><img class="qrcode" src="/`+ address + `.png" alt="qrcode"></div>
                    <div class="timer">
                        <ul class="downcount">
                            <li><span class="hours">00</span><p class="hours_ref">时</p></li>
                            <li class="seperator">:</li>
                            <li><span class="minutes">00</span><p class="minutes_ref">分</p></li>
                            <li class="seperator">:</li>
                            <li><span class="seconds">00</span><p class="seconds_ref">秒</p></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="footer">
            <p>收银台服务&nbsp;&nbsp;</p>
            </div>
            <input type="text" class="parse-content" id="parse-amount" value="`+ amount + `" />
            <input type="text" class="parse-content" id="parse-address" value="`+ address + `" />
        </div>
            <script>
                var address = "`+ address + `";
                var date = new Date(`+ time + `);
                Y = date.getFullYear() + '/';
                M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '/';
                D = date.getDate() + ' ';
                h = date.getHours() + ':';
                m = date.getMinutes() + ':';
                s = date.getSeconds(); 
                var timeout = Y+M+D+h+m+s;
                var done=false;
            </script>
            <script src="/jq.js"></script>
            <script type="text/javascript">
        !function(a) {
            a.fn.downCount = function(b, c) {
                function d(a) {
                    var b = new Date(e.date), d = g(), i = b - d;
                    if (i < 0)
                        return clearInterval(h),void (c && "function" == typeof c && c());
                    var j = 1e3, k = 60 * j, l = 60 * k, m = 24 * l, n = Math.floor(i / m), o = Math.floor(i % m / l), p = Math.floor(i % l / k), q = Math.floor(i % k / j);
                    n = String(n).length >= 2 ? n : "0" + n,
                    o = String(o).length >= 2 ? o : "0" + o,
                    p = String(p).length >= 2 ? p : "0" + p,
                    q = String(q).length >= 2 ? q : "0" + q,
                    f.find(".days").text(n),
                    f.find(".hours").text(o),
                    f.find(".minutes").text(p),
                    f.find(".seconds").text(q)
                }
                var e = a.extend({date: null,offset: null}, b);
                e.date || a.error("."),Date.parse(e.date) || a.error(".");
                var f = this, g = function() {var a = new Date;return a}, h = setInterval(d, 1e3);
                return this.reset = function() {clearInterval(h),f.find(".days").text("00"),f.find(".hours").text("00"),f.find(".minutes").text("00"),f.find(".seconds").text("00")},this}}(jQuery),
        function() {
            "use strict";
            var a = function() {
                var a = window.location.origin, b = 10000 , c = { transactionQuery: a + "/paystatus"}, d = null, e = null;
                return {api: c,transactionQueryInterval: b,transactionQuery: d,downCounter: e}
            }() , b = function() {
                var b = function() {
                    window.onload = function() {
                        var a = 0;
                        document.addEventListener("touchstart", function(a) {a.touches.length > 1 && a.preventDefault()}),
                        document.addEventListener("touchend", function(b) {var c = (new Date).getTime();c - a <= 300 && b.preventDefault(),a = c}, !1),
                        document.addEventListener("gesturestart", function(a) {a.preventDefault()})
                    }
                }, c = function() {
                    if (timeout) {
                        var b = function() {
                            timeout ? $.ajax({type: "get",url: a.api.transactionQuery,data: {order: `+req.query.order+`},
                                success: function(b) {
                                    if(b.code == 200){
                                        done=true;
                                        $("#payment_b").text("");
                                        $("#payment_r").text("已付");
                                        $(".main").html('<h1 style="color: #18a37a;">付款成功</h1>');
                                        clearInterval(a.transactionQuery);
                                        if(b.content!=''){window.setTimeout(function(){window.location.replace(b.content)} ,5000);}
                                    }
                                    if(b.code == 401){done=true;$("#payment_b").text("已付"+b.balance);$("#payment_r").text("剩余"+b.remaining);}
                                },
                                error:function(jqXHR, textStatus, errorThrown){}
                            }) : clearInterval(a.transactionQuery)
                        };
                        a.transactionQuery = setInterval(function() {
                            b()
                        }, a.transactionQueryInterval)
                    }
                }, d = function() {
                    if (timeout)
                        try {
                            a.downCounter = $(".downcount").downCount({
                                date: timeout,
                                offset: 8
                            }, function() {
                                if(!done){
                                    window.location.replace(window.location.origin+"/timeout.html");
                                }
                            })
                        } catch (b) {}
                }, e = function() {
                    var a = function(a, b) {
                        b = isNaN(b) ? 3e3 : b;
                        var c = document.createElement("div");
                        c.innerHTML = a,
                        c.style.cssText = "font-size: 16px; width:160px; max-width: 160px; background:#000; opacity:0.9; height:40px; color:#fff; line-height:40px; text-align:center; btransaction-radius:8px; position:fixed; bottom:50px; left:50%; margin-left: -80px; z-index:9; font-weight:bold;",
                        document.body.appendChild(c),
                        setTimeout(function() {
                            var a = .5;
                            c.style.webkitTransition = "-webkit-transform " + a + "s ease-in, opacity " + a + "s ease-in",
                            c.style.opacity = "0",
                            setTimeout(function() {
                                document.body.removeChild(c)
                            }, 500 * a)
                        }, b)
                    };
                    $(".parse-action").on("click", function() {
                        var b = $(this).attr("data-ref")
                          , c = $(this).attr("data-msg");
                        b && ($(b).select(),
                        document.execCommand("Copy"),
                        a(c, 2e3))
                    })
                };
                return {init: function() {b(),d(),c(),e()}}
            }();
            b.init()
            $.ajax({
                type: "get",
                url: a.api.transactionQuery,
                data: {
                    order: `+req.query.order+`
                },
                success: function(b) {
                    if(b.code == 200){
                        done=true;
                        $("#payment_b").text("");
                        $("#payment_r").text("已付");
                        $(".main").html('<h1 style="color: #18a37a;">付款成功</h1>');
                        clearInterval(a.transactionQuery);
                        if(b.content!=''){
                            window.setTimeout(function(){window.location.replace(b.content)} ,5000);
                        }
                    }
                    if(b.code == 401){
                        done=true;
                        $("#payment_b").text("已付"+b.balance);
                        $("#payment_r").text("剩余"+b.remaining);
                    }
                },
                error:function(jqXHR, textStatus, errorThrown){
                }
            })
        }();
            </script>
            </body>
        </html>
        `)
            })
    }
})
app.get('/paystatus', (req, res) => {
    if (!req.query.order) {
        res.json({code:1})
    } else {
        client.query('SELECT status,amount,amount_remain,url FROM `order` WHERE order_sn = ?',[req.query.order],
        function selectCb(err, r1) {
            if (err) { res.json({ code: 1, message: '服务异常' }); return }
            if (r1.length > 0) {
                if(r1[0]['status']==2){
                    res.json({
                        code:401,
                        balance:(r1[0]['amount']-r1[0]['amount_remain']).toFixed(unit.toString().length - 2),
                        remaining:r1[0]['amount_remain']}
                        )
                }else if(r1[0]['status']==3){
                    res.json({code:200,
                        content:r1[0]['url']})
                }else{
                    res.json({code:1})
                }
            }else{
                res.json({code:1})
            }
        })
    }
})
app.listen(port, () => { console.log(`服务运行于 ${port} 端口`) })