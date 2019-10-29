const express = require("express");
const bodyParser = require("body-parser");
const engines = require("consolidate");
const paypal = require("paypal-rest-sdk");
var mysql = require('mysql');


var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "crypto"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});
// const qs = require("querystring");
// const http = require("https");

const request = require("request");

const url = require('url');

const app = express();

app.engine("ejs", engines.ejs);
app.set("views", "./views");
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

paypal.configure({
    mode: "sandbox", //sandbox or live
    client_id:
        "",
    client_secret:
    ""
});

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/package2", (req, res) => {
    res.render("package2");
});

app.get("/paypal", (req, res) => {
    console.log(req, 'reqqq')
    var create_payment_json = {
        intent: "sale",
        payer: {
            payment_method: "paypal"
        },
        redirect_urls: {
            return_url: "https://paypal-rn.herokuapp.com/success",
            cancel_url: "https://paypal-rn.herokuapp.com/cancel"
        },
        transactions: [
            {
                item_list: {
                    items: [
                        {
                            name: "item",
                            sku: "item",
                            price: req.price,
                            currency: "USD",
                            quantity: 1
                        }
                    ]
                },
                amount: {
                    currency: "USD",
                    total: "1.00"
                },
                description: "This is the payment description."
            }
        ]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            console.log("Create Payment Response");
            console.log(payment);
            res.redirect(payment.links[1].href);
        }
    });
});

app.get("/success", (req, res) => {
    // res.send("Success");
    var PayerID = req.query.PayerID;
    var paymentId = req.query.paymentId;
    var execute_payment_json = {
        payer_id: PayerID,
        transactions: [
            {
                amount: {
                    currency: "USD",
                    total: "1.00"
                }
            }
        ]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (
        error,
        payment
    ) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log("Get Payment Response");
            console.log(JSON.stringify(payment));
            res.render("success");
        }
    });
});

app.get("cancel", (req, res) => {
    res.render("cancel");
});



app.post("/create-plan", (req, res) => {
    console.log(req.body, 'req')
    var billingPlanAttributes = {
        "description": "Create Plan for Regular",
        "merchant_preferences": {
            "auto_bill_amount": "yes",
            "cancel_url": "http://www.cancel.com",
            "initial_fail_amount_action": "continue",
            "max_fail_attempts": "1",
            "return_url": "http://localhost:3000/success",
            "setup_fee": {
                "currency": "USD",
                "value": "25"
            }
        },
        "name": "Testing1-Regular1",
        "payment_definitions": [
            {
                "amount": {
                    "currency": "USD",
                    "value": req.body.value,
                },
                "charge_models": [
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "10.60"
                        },
                        "type": "SHIPPING"
                    },
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "20"
                        },
                        "type": "TAX"
                    }
                ],
                "cycles": "0",
                "frequency": "MONTH",
                "frequency_interval": "1",
                "name": "Regular 1",
                "type": "REGULAR"
            },
            {
                "amount": {
                    "currency": "USD",
                    "value": "20"
                },
                "charge_models": [
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "10.60"
                        },
                        "type": "SHIPPING"
                    },
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "20"
                        },
                        "type": "TAX"
                    }
                ],
                "cycles": "4",
                "frequency": "MONTH",
                "frequency_interval": "1",
                "name": "Trial 1",
                "type": "TRIAL"
            }
        ],
        "type": "INFINITE"
    };

    paypal.billingPlan.create(billingPlanAttributes, function (error, billingPlan) {
        if (error) {
            console.log(error);
            throw error;
        } else {
            console.log("Create Billing Plan Response", billingPlan.id);
            // res.send(billingPlan)
            var amount = parseInt(req.body.value);
            console.log(amount, 'amou');
            // INSERT INTO `trader_paypal`(`trader_id`, `user_id`, `package_name`, `amout`, `plan_id`)  (5, 'basic', "${amount}", "${billingPlan.id}")
            var sql = `INSERT INTO trader_paypal(user_id, package_name, amount, plan_id) VALUES (5, 'basic', ${amount}, "${billingPlan.id}")`;
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("new record inserted", result);

            });
            //    mysqli_query(con, insert)
            // res.render("package2");
            // window.location.url = "/package20"

        }
    });

});



app.get("/get-plan", (req, res) => {

    var user_plans = `SELECT * FROM trader_paypal WHERE user_id = 5`
    // console.log(user_plans, 'user')
    con.query(user_plans, function (err, result) {
        if (err) throw err;
        console.log("new record inserted", result);
        res.send(result)
        // var allId = result.map((id) => {
        //     return id.user_id
        // })
        // console.log(allId, 'all id')
        // paypal.billingPlan.get(billingPlanId, function (error, result) {
        //     if (error) {
        //         console.log(error);
        //         throw error;
        //     } else {
        //         console.log("Get Billing Plan");
        //         res.send(JSON.stringify(billingPlan));

        //     }
        // });
    });


});


app.get("/get-plans", (req, res) => {
    // var data = `SELECT * FROM trader_paypal user_id = 5`
    // con.query(data, function (err, result) {
    //     if (err) throw err;
    //     console.log("new record inserted", result);
    // });
    // console.log()
    var list_billing_plan = {
        'status': 'ACTIVE',
        'page_size': 5,
        'page': 1,
        'total_required': 'yes'
    };

    paypal.billingPlan.list(list_billing_plan, function (error, billingPlan) {
        if (error) {
            throw error;
        } else {
            console.log("List Billing Plans Response");
            res.send(JSON.stringify(billingPlan));
        }
    });



});




app.get("/abc", (req, res) => {



    var isoDate = new Date();
    isoDate.setSeconds(isoDate.getSeconds() + 4);
    isoDate.toISOString().slice(0, 19) + 'Z';

    var billingPlanAttributes = {
        "description": "Create Plan for Regular",
        "merchant_preferences": {
            "auto_bill_amount": "yes",
            "cancel_url": "http://www.cancel.com",
            "initial_fail_amount_action": "continue",
            "max_fail_attempts": "1",
            "return_url": "http://www.success.com",
            "setup_fee": {
                "currency": "USD",
                "value": "25"
            }
        },
        "name": "Testing1-Regular1",
        "payment_definitions": [
            {
                "amount": {
                    "currency": "USD",
                    "value": "100"
                },
                "charge_models": [
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "10.60"
                        },
                        "type": "SHIPPING"
                    },
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "20"
                        },
                        "type": "TAX"
                    }
                ],
                "cycles": "0",
                "frequency": "MONTH",
                "frequency_interval": "1",
                "name": "Regular 1",
                "type": "REGULAR"
            },
            {
                "amount": {
                    "currency": "USD",
                    "value": "20"
                },
                "charge_models": [
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "10.60"
                        },
                        "type": "SHIPPING"
                    },
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "20"
                        },
                        "type": "TAX"
                    }
                ],
                "cycles": "4",
                "frequency": "MONTH",
                "frequency_interval": "1",
                "name": "Trial 1",
                "type": "TRIAL"
            }
        ],
        "type": "INFINITE"
    };

    var billingPlanUpdateAttributes = [
        {
            "op": "replace",
            "path": "/",
            "value": {
                "state": "ACTIVE"
            }
        }
    ];

    var billingAgreementAttributes = {
        "name": "Fast Speed Agreement",
        "description": "Agreement for Fast Speed Plan",
        "start_date": isoDate,
        "plan": {
            "id": "P-3VS43194KX216543UVM7HUXI"
        },
        "payer": {
            "payment_method": "paypal"
        },
        "shipping_address": {
            "line1": "StayBr111idge Suites",
            "line2": "Cro12ok Street",
            "city": "San Jose",
            "state": "CA",
            "postal_code": "95112",
            "country_code": "US"
        }
    };

    // Create the billing plan
    paypal.billingPlan.create(billingPlanAttributes, function (error, billingPlan) {
        if (error) {
            console.log(error);
            throw error;
        } else {
            console.log("Create Billing Plan Response");
            console.log(billingPlan);

            // Activate the plan by changing status to Active
            paypal.billingPlan.update(billingPlan.id, billingPlanUpdateAttributes, function (error, response) {
                if (error) {
                    console.log(error);
                    throw error;
                } else {
                    console.log("Billing Plan state changed to " + billingPlan.state);
                    billingAgreementAttributes.plan.id = billingPlan.id;

                    // Use activated billing plan to create agreement
                    paypal.billingAgreement.create(billingAgreementAttributes, function (error, billingAgreement) {
                        if (error) {
                            console.log(error);
                            throw error;
                        } else {
                            console.log("Create Billing Agreement Response");
                            //console.log(billingAgreement);
                            for (var index = 0; index < billingAgreement.links.length; index++) {
                                if (billingAgreement.links[index].rel === 'approval_url') {
                                    var approval_url = billingAgreement.links[index].href;
                                    console.log("For approving subscription via Paypal, first redirect user to");
                                    console.log(approval_url);

                                    console.log("Payment token is");
                                    console.log(url.parse(approval_url, true).query.token);
                                    // See billing_agreements/execute.js to see example for executing agreement 
                                    // after you have payment token
                                }
                            }
                        }
                    });
                }
            });
        }
    });

})





// app.get("/create-token", (req, res) => {

//     var options = { method: 'POST',
//       url: 'https://api.sandbox.paypal.com/v1/oauth2/token',
//       headers: 
//        { 'cache-control': 'no-cache',
//          Connection: 'keep-alive',
//          'Content-Length': '29',
//          'Accept-Encoding': 'gzip, deflate',
//          Host: 'api.sandbox.paypal.com',
//          'Postman-Token': 'a97c4627-defa-42a7-b1af-e88280856023,ce0ee4b3-0898-4f58-a957-c6cb1d9964b9',
//          'Cache-Control': 'no-cache',
//          Accept: '*/*',
//          'User-Agent': 'PostmanRuntime/7.17.1',
//          Authorization: 'Basic QVlJa2dyakJVanZwaGxmUElvc09UbW5pa2ZidmVnMzVxd2FTRFB6bnp1eTBtN3BDdVZvVFlseUhIRkpGY0ZWcXlpbjZMb2tuUWVsZUJEbmg6RUp2WFRnT2lUTFM4elAwRkZ3QzhRQnZDTEwybjk5TlllNUExdk9iUmpUb25ZTVFkTXE0YTVtNmNIUl9aOWlWYV9LWV9xX1lybVctTEJGNkM=',
//          'Content-Type': 'application/x-www-form-urlencoded' },
//       form: { grant_type: 'client_credentials' } };

//     request(options, function (error, response, body) {
//       if (error) throw new Error(error);

//       // console.log(body);
//       res.send(body);
//     });

// });





app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running");
});
