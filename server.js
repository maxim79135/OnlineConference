const http = require('http');
const fs = require('fs');
const db = require('./js/database');
const qs = require("querystring");
const hlb = require('handlebars');
const moment = require('moment');
const cp = require('crypto');
const formidable = require('formidable');

const host = 'localhost';
const port = 3500;

const soil = "mystring";
const pg = require('pg');

const config = {
    host: 'balarama.db.elephantsql.com',
    user: 'inamgfpj',
    password: 'jPgd4rlFVfTCfDkJIIJlQGfwpg4SCqRn',
    database: 'inamgfpj',
    port: 5432,
    ssl: true
};

const client = new pg.Client(config);

client
    .connect()
    .then(() => console.log('connected'))
    .catch(err => console.error('connection error', err.stack))

let fileRules = /(png|jpg|gif|svg|html|js|css|ico)$/i;

function notFound(res) {
    res.statusCode = 404;
    returnFile(__dirname + '/not_found.html', res);
}


function sendFile(filename, res) {
    fs.readFile(filename, (err, data) => {
        if (err) {
            console.error(err);
            notFound(res);
        } else {
            res.setHeader('Cache-Control', 'public,max-age=9000');
            res.write(data);
            res.end();
        }
    });
}


const server = http.createServer(
    (req, res) => {
        if (req.method === 'GET') {

            if (fileRules.test(req.url)) {
                sendFile(__dirname + req.url, res);

            } else {
                console.log(req.url);
                let [path, get] = req.url.split('?');
                let params = qs.parse(get);
                console.log(path, get);

                switch (path) {
                    case "/index": {
                        sendFile(__dirname + '/index.html', res);
                        break;
                    }
                    case "/": {
                        sendFile(__dirname + '/index.html', res);
                        break;
                    }
                    case "/register": {
                        sendFile(__dirname + '/register.html', res);
                        break;
                    }
                    case "/signin": {
                        sendFile(__dirname + '/signin.html', res);
                        break;
                    }
                    case "/excursion": {
                        if ('id' in params) {
                            let id = Number(params['id']);

                            if (!isNaN(id)) {
                                fs.readFile(__dirname + '/excursion.html', (err, data) => {
                                    if (err) {
                                        console.error(err);
                                        notFound(res);
                                        return;
                                    }
                                    db.getExcursionOne(client, id).then(value => {

                                        if (value.rows.length === 0) {
                                            notFound(res);
                                        } else {
                                            let paths = [];
                                            let indexs = [];
                                            for (let i = 0; i < value.rows.length; i++) {
                                                paths.push({
                                                    guideId: value.rows[0].guide_id,
                                                    id: value.rows[0].id,
                                                    path: value.rows[i].path,
                                                    active: i === 0
                                                });
                                                indexs.push({index: i, active: i === 0});
                                            }

                                            let excursion = {
                                                id: value.rows[0].id,
                                                title: value.rows[0].title,
                                                description: value.rows[0].description,
                                                dateStart: moment(value.rows[0].date_start).format('DD.MM.YYYY, h:mm'),
                                                dateEnd: moment(value.rows[0].date_end).format('DD.MM.YYYY, h:mm'),
                                                scriptMap: value.rows[0].script_map,
                                                guideId: value.rows[0].guide_id,
                                                lastName: value.rows[0].last_name,
                                                firstName: value.rows[0].first_name,
                                                middleName: value.rows[0].middle_name,
                                                paths: paths,
                                                indexs: indexs,
                                                count: value.rows[0].number_of_seats - value.rows[0].count,
                                            };

                                            let template = hlb.compile(data.toString());

                                            let result = template(excursion);
                                            res.setHeader('Cache-Control', 'public,max-age=9000');
                                            res.end(result);
                                        }
                                    });
                                });
                            } else {
                                notFound(res);
                                return;
                            }
                        } else {
                            notFound(res);
                            return;
                        }

                        break;
                    }

                    case "/lk": {
                        let cookie = new Map();
                        let cookieMass = req.headers.cookie.split('; ');
                        for (let item of cookieMass) {
                            let [name, value] = item.split('=');
                            cookie.set(name, value);
                        }

                        if (!cookie.get('token')) {
                            sendFile(__dirname + '/signin.html', res);
                            break;
                        }


                        fs.readFile(__dirname + '/lk.html', (err, data) => {

                            if (err) {
                                notFound(res);
                                return;
                            }

                            db.getInfo(client, cookie.get('token')).then(value => {

                                if (value.length === 0) {
                                    sendFile(__dirname + '/signin.html', res);
                                } else {
                                    res.end(data.toString());
                                }
                            });

                        });
                        break;
                    }
                    case "/create_excursion": {
                        let cookie = new Map();
                        let cookieMass = req.headers.cookie.split('; ');
                        for (let item of cookieMass) {
                            let [name, value] = item.split('=');
                            cookie.set(name, value);
                        }

                        if (!cookie.get('token')) {
                            sendFile(__dirname + '/signin.html', res);
                            break;
                        }

                        db.getInfo(client, cookie.get('token')).then(value => {

                            if (value.length !== 0) {
                                sendFile(__dirname + '/create_excursion.html', res);
                            } else {
                                sendFile(__dirname + '/signin.html', res);
                            }

                        });

                        break;
                    }

                    case "/edit_excursion": {
                        if ('id' in params) {
                            let id = Number(params['id']);
                            if (!isNaN(id)) {
                                let cookie = new Map();
                                let cookieMass = req.headers.cookie.split('; ');
                                for (let item of cookieMass) {
                                    let [name, value] = item.split('=');
                                    cookie.set(name, value);
                                }

                                if (!cookie.get('token')) {
                                    sendFile(__dirname + '/signin.html', res);
                                    break;
                                }

                                db.getInfo(client, cookie.get('token')).then(value => {

                                    if (value.length !== 0) {
                                        //Юзер есть отправить на редактирование.
                                        fs.readFile(__dirname + '/edit_excursion.html', (err, data) => {
                                            if (err) {
                                                notFound(res);
                                                return;
                                            } else {
                                                //Вернуть страницу с заполненными данными пользователю
                                                db.getExcursionForEdit(client, id).then(value1 => {
                                                    if (value1.length !== 0) {
                                                        let dataDb = value1.rows[0];

                                                        db.getPaths(client, dataDb.id).then(value2 => {
                                                            if (value1.length !== 0) {
                                                                let paths = [];
                                                                for (let item of value2.rows) {
                                                                    paths.push({
                                                                        id: item.id,
                                                                        path: item.path,
                                                                        idExcursion: dataDb.id,
                                                                        idGuide: value[0].id
                                                                    })
                                                                }
                                                                let excursion = {
                                                                    id: dataDb.id,
                                                                    title: dataDb.title,
                                                                    description: dataDb.description,
                                                                    dateStart: moment(dataDb.date_start).format("YYYY-MM-DDThh:mm"),
                                                                    dateEnd: moment(dataDb.date_end).format("YYYY-MM-DDThh:mm"),
                                                                    scriptMap: dataDb.script_map,
                                                                    pathImages: dataDb.path_images,
                                                                    numberOfSeats: dataDb.number_of_seats,
                                                                    paths: paths,
                                                                    countPaths: paths.length
                                                                };

                                                                let template = hlb.compile(data.toString());
                                                                let result = template(excursion);
                                                                res.setHeader('Cache-Control', 'public,max-age=9000');
                                                                res.end(result);

                                                            }
                                                        });

                                                    }
                                                })
                                            }

                                        });
                                    } else {
                                        notFound(res);
                                    }

                                });
                            } else {
                                notFound(res);
                                return;
                            }
                        } else {
                            notFound(res);
                            return;
                        }

                        break;
                    }

                    default:
                        notFound(res);
                        break;
                }
            }
        }

        if (req.method === 'POST') {
            switch (req.url) {

                case '/ajax/test': {
                    let body = [];

                    req.on('data', function (chunk) {
                        body.push(chunk);

                    });

                    req.on('end', function () {
                        let data = JSON.parse(body);
                        let start, end;

                        if (data.today === "") {
                            start = new Date();
                            data.today = moment(start).format("YYYY-MM-DD");
                        } else {
                            start = new Date(data.today);
                        }

                        if (data.lastDay === "") {
                            end = new Date();
                            end.setMonth(end.getMonth() + 3)
                            data.lastDay = moment(end).format("YYYY-MM-DD 23:00");
                        } else {
                            end = new Date(data.lastDay);
                        }

                        if (start.getFullYear() < 2000 || start.getFullYear() > 2100 || end.getFullYear() > 2100 || end.getFullYear() < 2000) {
                            res.statusCode = 200;
                            res.end(global.JSON.stringify({status: "invalid range"}));
                        } else {
                            if (data.typeSort === "") {
                                data.typeSort = "asc"
                            }

                            let endData =   moment(data).format("YYYY-MM-DD 23:00");
                            console.log(data.today, data.lastDay, data.countElement)
                            db.GetExcursion(client, data.today, data.lastDay, data.countElement, data.typeSort).then(data => {
                                res.statusCode = 200;
                                res.setHeader('Cache-Control', 'public,max-age=9000');
                                res.end(global.JSON.stringify({
                                    status: "ok",
                                    data: data.rows,
                                    count: data.rows.length
                                }));
                            });
                        }
                    });

                    break;
                }

                case '/ajax/get_data_user': {
                    let body = [];

                    req.on('data', function (chunk) {
                        body.push(chunk);

                    });

                    req.on('end', function () {
                        let data = JSON.parse(body);
                        if (data.lastName.length === 0 || data.firstName.length === 0 || data.mail.length === 0) {
                            res.statusCode = 200;
                            res.end(global.JSON.stringify({status: "empty fields"}));
                        } else {
                            let regexp = /[^а-яА-Яa-zA-Z]/;
                            if (regexp.test(data.lastName) || regexp.test(data.firstName) || (regexp.test(data.middleName) && data.middleName.length !== 0) || data.mail.indexOf("@") === -1) {
                                res.statusCode = 200;
                                res.end(global.JSON.stringify({status: "bad param"}));
                            } else {
                                db.addUsers(client, data.lastName, data.firstName, data.middleName, data.mail, data.excursionId).then(data => {
                                    let s;
                                    if (data.rows[0].add_user !== -1) {
                                        s = {status: "ok"}
                                    } else {
                                        s = {status: "full"}
                                    }
                                    res.statusCode = 200;
                                    res.end(global.JSON.stringify(s));
                                });
                            }
                        }

                    });

                    break;
                }

                case '/ajax/get_data_register': {
                    let body = [];
                    req.on('data', function (chunk) {
                        body.push(chunk);

                    });

                    req.on('end', function () {
                        let data = JSON.parse(body);
                        let mes;
                        if (data.lastName.length === 0 || data.firstName.length === 0
                            || data.email.length === 0 || data.email.indexOf("@") === -1
                            || data.password.length === 0 || data.confirmPassword.length === 0) {
                            let code = 0, code1 = 0, code2 = 0, code3 = 0, code4 = 0;
                            if (data.lastName.length === 0)
                                code = 1;
                            if (data.firstName.length === 0)
                                code1 = 1;
                            if (data.email.length === 0 || data.email.indexOf("@") === -1)
                                code2 = 1;
                            if (data.password.length === 0)
                                code3 = 1;
                            if (data.confirmPassword.length === 0)
                                code4 = 1;
                            mes = {
                                status: 'empty fields', lastName: code, firstName: code1,
                                email: code2, password: code3, confirmPassword: code4
                            };
                            res.statusCode = 200;
                            res.end(global.JSON.stringify(mes));
                        } else {
                            let regexp = /[^а-яА-Яa-zA-Z]/;
                            if (regexp.test(data.lastName) || regexp.test(data.firstName)) {
                                res.statusCode = 200;
                                res.end(global.JSON.stringify({status: "bad param"}));
                            } else {
                                if (data.password === data.confirmPassword) {
                                    let hash = cp.createHash("sha512")
                                        .update(`${data.password}${soil}`)
                                        .digest("hex");

                                    let token = cp.createHash("md5")
                                        .update(`${data.email}${hash}`)
                                        .digest("hex");

                                    db.addGuide(client, data.lastName, data.firstName, data.email, hash, token).then(value => {

                                        console.log(value)
                                        if (value !== -1) {

                                            fs.readFile(__dirname + '/lk.html', (err, data) => {
                                                if (err) {
                                                    console.error(err);
                                                    notFound(res);
                                                } else {
                                                    mes = {
                                                        status: 'ok',
                                                        html: data.toString(),
                                                        token: token,
                                                        id: value
                                                    };
                                                    res.end(global.JSON.stringify(mes));

                                                }

                                            });
                                        } else {
                                            mes = {status: "mail is busy"};
                                            res.statusCode = 200;
                                            res.end(global.JSON.stringify(mes));
                                        }

                                    })

                                } else {
                                    mes = {status: "different passwords"};
                                    res.statusCode = 200;
                                    res.end(global.JSON.stringify(mes));
                                }
                            }

                        }
                    });

                    //console.log(res)
                    break;
                }

                case '/ajax/get_data_sigin': {
                    let body = [];
                    let mes;

                    req.on('data', function (chunk) {
                        body.push(chunk);

                    });

                    req.on('end', function () {
                        let data = JSON.parse(body);
                        if (data.email.length === 0 || data.email.indexOf("@") === -1 || data.password.length === 0) {
                            let code = 0;
                            let code1 = 0;
                            if (data.email.length === 0 || data.email.indexOf("@") == -1)
                                code = 1;
                            if (data.password.length == 0)
                                code1 = 1;
                            mes = {status: 'empty fields', mail: code, password: code1};
                            res.end(global.JSON.stringify(mes));
                        } else {

                            let hash = cp.createHash("sha512")
                                .update(`${data.password}${soil}`)
                                .digest("hex");

                            let token = cp.createHash("md5")
                                .update(`${data.email}${hash}`)
                                .digest("hex");

                            db.getInfo(client, token).then(value => {

                                if (value.length != 0) {

                                    fs.readFile(__dirname + '/lk.html', (err, data) => {
                                        if (err) {
                                            console.error(err);
                                            notFound(res);
                                        } else {
                                            mes = {status: 'ok', html: data.toString(), token: token};
                                            res.end(global.JSON.stringify(mes));

                                        }

                                    });
                                } else {
                                    mes = {status: "wrong data"};
                                    res.statusCode = 200;
                                    res.end(global.JSON.stringify(mes));
                                }

                            })
                        }
                    });

                    break;
                }

                case '/ajax/get_personal_data': {
                    let body = [];

                    req.on('data', function (chunk) {
                        body.push(chunk);

                    });

                    req.on('end', function () {
                        let data = JSON.parse(body);

                        let mes;

                        db.getInfo(client, data.token).then(value => {

                            mes = {status: "ok", guide: value[0]};
                            res.statusCode = 200;
                            res.end(global.JSON.stringify(mes));
                        })

                    });

                    break;
                }
                case '/ajax/get_excursion': {
                    let body = [];

                    req.on('data', function (chunk) {
                        body.push(chunk);

                    });

                    req.on('end', function () {
                        let data = JSON.parse(body);

                        let mes;

                        db.getExcursionForGuide(client, data.token, 100, 0).then(value => {

                            mes = {status: "ok", excursions: value};
                            res.statusCode = 200;
                            res.end(global.JSON.stringify(mes));
                        })

                    });

                    break;
                }

                case '/ajax/edit_personal_data': {
                    let body = [];

                    req.on('data', function (chunk) {
                        body.push(chunk);

                    });

                    req.on('end', function () {
                        let data = JSON.parse(body);
                        let mes;
                        //Заполненность полей
                        //Кириллица
                        if (data.lastName.length == 0 || data.firstName.length == 0
                            || data.email.length == 0 || data.email.indexOf("@") == -1) {
                            let code = 0, code1 = 0, code2 = 0, code3 = 0, code4 = 0;
                            if (data.lastName.length == 0)
                                code = 1;
                            if (data.firstName.length == 0)
                                code1 = 1;
                            if (data.email.length == 0 || data.email.indexOf("@") == -1)
                                code2 = 1;
                            mes = {
                                status: 'empty fields', lastName: code, firstName: code1,
                                email: code2, password: code3, confirmPassword: code4
                            };
                            res.statusCode = 200;
                            res.end(global.JSON.stringify(mes));

                        } else {
                            let regexp = /[^а-яА-Яa-zA-Z]/;
                            if (regexp.test(data.lastName) || regexp.test(data.firstName) || (regexp.test(data.middleName) && data.middleName.length != 0)) {
                                res.statusCode = 200;
                                res.end(global.JSON.stringify({status: "bad param"}));
                            } else {
                                if (data.password == data.confirmPassword) {

                                    let token;
                                    let hash;
                                    if (data.password.length != 0) {
                                        hash = cp.createHash("sha512")
                                            .update(`${data.password}${soil}`)
                                            .digest("hex");

                                        token = cp.createHash("md5")
                                            .update(`${data.email}${hash}`)
                                            .digest("hex");
                                    }

                                    db.getMail(client, data.email).then(value => {
                                        if (value.rowCount == 0 || (value.length != 0 && value.rows[0].token == data.token)) {
                                            db.updateGuide(client, data.lastName, data.firstName, data.middleName, data.email, hash, token, data.token).then(value => {
                                                if (value == undefined) {
                                                    mes = {status: "error"};
                                                    res.statusCode = 200;
                                                    res.end(global.JSON.stringify(mes));
                                                } else {
                                                    mes = {
                                                        status: "ok",
                                                        guide: {
                                                            first_name: data.firstName,
                                                            last_name: data.lastName,
                                                            middle_name: data.middleName,
                                                            mail: data.email,
                                                        },
                                                        token: token == undefined ? data.token : token
                                                    };
                                                    res.statusCode = 200;
                                                    res.end(global.JSON.stringify(mes));
                                                }


                                            })
                                        } else {
                                            mes = {status: "mail is busy"};
                                            res.statusCode = 200;
                                            res.end(global.JSON.stringify(mes));
                                        }
                                    });


                                } else {
                                    mes = {status: "different passwords"};
                                    res.statusCode = 200;
                                    res.end(global.JSON.stringify(mes));
                                }
                            }
                        }
                    });

                    break;
                }

                case '/ajax/delete_excursion': {
                    let body = [];

                    req.on('data', function (chunk) {
                        body.push(chunk);

                    });

                    req.on('end', function () {
                        let data = JSON.parse(body);
                        let mes;

                        if (data.excursionId) {
                            db.deleteExcursion(client, data.excursionId).then(value => {
                                if (value == undefined) {
                                    mes = {status: "error"};
                                    res.statusCode = 200;
                                    res.end(global.JSON.stringify(mes));
                                } else {
                                    mes = {
                                        status: "ok",
                                    };
                                    res.statusCode = 200;
                                    res.end(global.JSON.stringify(mes));
                                }

                            })

                        } else {
                            mes = {status: "error"};
                            res.statusCode = 200;
                            res.end(global.JSON.stringify(mes));
                        }

                    });

                    break;
                }


                case '/ajax/create_excursion': {

                    var form = new formidable.IncomingForm({keepExtensions: true, multiples: true});
                    files = [];
                    fields = [];
                    let mes;
                    form.uploadDir = __dirname + '/temp/';
                    form.on('field', function (field, value) {
                        fields.push(value);
                    }).on('file', function (field, file) {
                        files.push(file);
                    }).on('end', function () {
                        if (fields[1].length == 0 || fields[2].length == 0
                            || fields[3].length == 0 || fields[4].length == 0 || fields[5].length == 0 || fields[6].length == 0|| files.length == 0) {
                            let code = 0, code1 = 0, code2 = 0, code3 = 0, code4 = 0, code5 = 0, code6 = 0;
                            if (fields[1].length == 0)
                                code = 1;
                            if (fields[2].length == 0)
                                code1 = 1;
                            if (fields[3].length == 0)
                                code2 = 1;
                            if (fields[4].length == 0)
                                code3 = 1;
                            if (fields[5].length == 0)
                                code4 = 1;
                            if (fields[6].length == 0)
                                code5 = 1;
                            if (files.length == 0)
                                code6 = 1;
                            mes = {
                                status: 'empty fields', title: code, description: code1,
                                dateStart: code2, dateEnd: code3, maxNumber: code4, yaMap: code5, files: code6
                            };
                            res.statusCode = 200;
                            res.end(global.JSON.stringify(mes));
                        } else {
                            let dateStart = new Date(fields[3]);
                            let dateEnd = new Date(fields[4]);
                            let now = new Date();
                            if (dateStart < now || dateStart.getFullYear() > 2100) {
                                mes = {
                                    status: 'error range',
                                };
                                res.statusCode = 200;
                                res.end(global.JSON.stringify(mes));
                            } else
                            if (dateEnd < now || dateEnd.getFullYear() > 2100) {
                                mes = {
                                    status: 'error range',
                                };
                                res.statusCode = 200;
                                res.end(global.JSON.stringify(mes));
                            } else {
                                if (!isNaN(fields[5])) {
                                    if (fields[5] < 1 || fields[5] > 100) {
                                        mes = {
                                            status: 'error range maxNumber',
                                        };
                                        res.statusCode = 200;
                                        res.end(global.JSON.stringify(mes));
                                    } else {
                                        if (files.length < 1 || files.length > 5) {
                                            mes = {
                                                status: 'error range files',
                                            };
                                            res.statusCode = 200;
                                            res.end(global.JSON.stringify(mes));
                                        } else {


                                            if (fields[6].startsWith("<iframe src=") && fields[6].endsWith("></iframe>") && fields[6].includes("width=") && fields[6].includes("height=")) {
                                                let str = fields[6].toLowerCase();
                                                let widthIndexStart = str.indexOf('width="') + 'width="'.length;
                                                let widthIndexEnd = widthIndexStart;
                                                for (widthIndexEnd; widthIndexEnd < str.length; widthIndexEnd++) {
                                                    if (str[widthIndexEnd] == '"')
                                                        break;
                                                }
                                                //let widthIndexEnd = str.substr(widthIndexStart+'width="'.length, 4);
                                                let heightIndexStart = str.indexOf('height="') + 'height="'.length;
                                                let heightIndexEnd = heightIndexStart;
                                                for (heightIndexEnd; heightIndexEnd < str.length; heightIndexEnd++) {
                                                    if (str[heightIndexEnd] == '"')
                                                        break;
                                                }

                                                let newMap = str.substring(0, widthIndexStart) + "100%" + str.substring(widthIndexEnd, heightIndexStart) + "500" + str.substring(heightIndexEnd, str.length);

                                                //Добавить экскурсию и пути файлов
                                                db.getInfo(client, fields[0]).then(value => {
                                                    if (value.length == 0) {
                                                        sendFile(__dirname + '/signin.html', res);
                                                        return;
                                                    } else {
                                                        let path = `/excursion/${value[0].id}/`;
                                                        db.addExcursion(client, fields[1], fields[2], fields[3], fields[4], fields[5], newMap, path, value[0].id).then(value1 => {
                                                            if (value1 != -1) {
                                                                if (!fs.existsSync(`${__dirname}/excursion/${value[0].id}`)) {
                                                                    fs.mkdirSync(`${__dirname}/excursion/${value[0].id}`)
                                                                }
                                                                if (!fs.existsSync(`${__dirname}/excursion/${value[0].id}/${value1}`)) {
                                                                    fs.mkdirSync(`${__dirname}/excursion/${value[0].id}/${value1}`)
                                                                }
                                                                let paths = [];
                                                                let pathsPsql = `'{`;
                                                                for (let item of files) {
                                                                    console.log(item);
                                                                    let path = item.path.slice(item.path.lastIndexOf("\\") + 1);
                                                                    paths.push(path);
                                                                    pathsPsql += `"${path}",`;
                                                                    fs. copyFileSync(`${__dirname}/temp/${path}`, `${__dirname}/excursion/${value[0].id}/${value1}/${path}`);
                                                                    fs.unlinkSync(`${__dirname}/temp/${path}`);
                                                                }
                                                                pathsPsql = pathsPsql.slice(0, pathsPsql.length - 1);
                                                                pathsPsql += `}'`;
                                                                console.error(pathsPsql);
                                                                db.addPaths(client, pathsPsql, paths.length, value1).then(value2 => {
                                                                    if (value2 != -1) {
                                                                        console.error(value2);
                                                                        let mes = {status: "ok"};
                                                                        res.statusCode = 200;
                                                                        res.end(global.JSON.stringify(mes));
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                });
                                            } else {
                                                let mes = {status: "error format map"};
                                                res.statusCode = 200;
                                                res.end(global.JSON.stringify(mes));
                                            }

                                        }
                                    }
                                } else {
                                    mes = {
                                        status: 'wrong type maxNumber',
                                    };
                                    res.statusCode = 200;
                                    res.end(global.JSON.stringify(mes));
                                }

                            }

                        }

                    });

                    form.parse(req);

                    break;
                }

                case "/ajax/get_modal": {


                    let cookie = new Map();
                    let cookieMass = req.headers.cookie.split('; ');
                    for (let item of cookieMass) {
                        let [name, value] = item.split('=');
                        cookie.set(name, value);
                    }

                    if (!cookie.get('token')) {
                        sendFile(__dirname + '/signin.html', res);
                        break;
                    }
                    db.getInfo(client, cookie.get('token')).then(value => {

                        if (value.length != 0) {
                            fs.readFile(__dirname + '/template_edit_excursion.html', (err, data) => {
                                if (err) {
                                    notFound(res);
                                    return;
                                } else {
                                    let mes = {status: "ok", data: data.toString()}
                                    res.statusCode = 200;
                                    res.end(global.JSON.stringify(mes));
                                }

                            });
                        } else {
                            sendFile(__dirname + '/signin.html', res);
                            return;
                        }

                    });
                    break;
                }

                case "/ajax/delete_image": {
                    let body = [];

                    req.on('data', function (chunk) {
                        body.push(chunk);

                    });

                    req.on('end', function () {
                        let data = JSON.parse(body);

                        db.getInfo(client, data.token).then(value => {

                            if (value.length == 0) {
                                sendFile(__dirname + '/signin.html', res);
                            } else {
                                db.deletePath(client, data.id).then(value => {
                                    if (value != undefined) {
                                        let mes = {status: "ok"};
                                        res.statusCode = 200;
                                        res.end(global.JSON.stringify(mes));
                                    }
                                });
                            }
                        });


                    });


                    break;
                }

                case "/ajax/edit_excursion": {

                    var form = new formidable.IncomingForm({keepExtensions: true, multiples: true});
                    files = [];
                    fields = [];
                    form.uploadDir = __dirname + '/temp/';
                    form.on('field', function (field, value) {
                        fields.push(value);
                    }).on('file', function (field, file) {
                        files.push(file);
                    }).on('end', function () {
                        console.log(fields, files);

                        db.getPathsCount(client, fields[1]).then(result => {
                            //Валидация
                            if (fields[2].length == 0 || fields[3].length == 0
                                || fields[4].length == 0 || fields[5].length == 0 || fields[6].length == 0 || fields[7].length == 0 || files.length + result.rows[0].count == 0) {
                                let code = 0, code1 = 0, code2 = 0, code3 = 0, code4 = 0, code5 = 0, code6 = 0;
                                if (fields[2].length == 0)
                                    code = 1;
                                if (fields[3].length == 0)
                                    code1 = 1;
                                if (fields[4].length == 0)
                                    code2 = 1;
                                if (fields[5].length == 0)
                                    code3 = 1;
                                if (fields[6].length == 0)
                                    code4 = 1;
                                if (fields[7].length == 0)
                                    code5 = 1;
                                if (files.length == 0)
                                    code6 = 1;
                                mes = {
                                    status: 'empty fields', title: code, description: code1,
                                    dateStart: code2, dateEnd: code3, maxNumber: code4, yaMap: code5, files: code6
                                };
                                res.statusCode = 200;
                                res.end(global.JSON.stringify(mes));

                            } else {
                                let dateStart = new Date(fields[4]);
                                let dateEnd = new Date(fields[5]);
                                let now = new Date();
                                if (dateStart < now || dateStart.getFullYear() > 2100) {
                                    mes = {
                                        status: 'error range',
                                    };
                                    res.statusCode = 200;
                                    res.end(global.JSON.stringify(mes));
                                }
                                else if (dateEnd < now || dateEnd.getFullYear() > 2100) {
                                    mes = {
                                        status: 'error range',
                                    };
                                    res.statusCode = 200;
                                    res.end(global.JSON.stringify(mes));
                                } else {
                                    if (!isNaN(fields[6])) {
                                        if (fields[6] < 1 || fields[6] > 100) {
                                            mes = {
                                                status: 'error range maxNumber',
                                            };
                                            res.statusCode = 200;
                                            res.end(global.JSON.stringify(mes));
                                        } else {
                                            if (files.length + parseInt(result.rows[0].count) < 1 || files.length + parseInt(result.rows[0].count) > 5) {
                                                mes = {
                                                    status: 'error range files',
                                                };
                                                res.statusCode = 200;
                                                res.end(global.JSON.stringify(mes));
                                            } else {
                                                let map = fields[7];
                                                if (map.startsWith("<iframe src=") && map.endsWith("</iframe>") && map.includes("width=") && map.includes("height=")) {
                                                    let str = fields[7].toLowerCase();
                                                    let widthIndexStart = str.indexOf('width="') + 'width="'.length;
                                                    let widthIndexEnd = widthIndexStart;
                                                    for (widthIndexEnd; widthIndexEnd < str.length; widthIndexEnd++) {
                                                        if (str[widthIndexEnd] == '"')
                                                            break;
                                                    }
                                                    //let widthIndexEnd = str.substr(widthIndexStart+'width="'.length, 4);
                                                    let heightIndexStart = str.indexOf('height="') + 'height="'.length;
                                                    let heightIndexEnd = heightIndexStart;
                                                    for (heightIndexEnd; heightIndexEnd < str.length; heightIndexEnd++) {
                                                        if (str[heightIndexEnd] == '"')
                                                            break;
                                                    }

                                                    let newMap = str.substring(0, widthIndexStart) + "100%" + str.substring(widthIndexEnd, heightIndexStart) + "500" + str.substring(heightIndexEnd, str.length);
                                                    //Добавить экскурсию и пути файлов и добавить
                                                    db.getInfo(client, fields[0]).then(value => {
                                                        if (value.length == 0) {
                                                            sendFile(__dirname + '/signin.html', res);
                                                            return;
                                                        } else {

                                                            db.updateConference(client, fields[1], fields[2], fields[3], fields[4], fields[5], fields[6], newMap).then(value1 => {
                                                                if (value1 != undefined && files.length != 0) {
                                                                    if (!fs.existsSync(`${__dirname}/excursion/${value[0].id}`)) {
                                                                        fs.mkdirSync(`${__dirname}/excursion/${value[0].id}`)
                                                                    }
                                                                    if (!fs.existsSync(`${__dirname}/excursion/${value[0].id}/${fields[1]}`)) {
                                                                        fs.mkdirSync(`${__dirname}/excursion/${value[0].id}/${fields[1]}`)
                                                                    }
                                                                    let paths = [];
                                                                    let pathsPsql = `'{`;
                                                                    for (let item of files) {
                                                                        console.log(item);
                                                                        let path = item.path.slice(item.path.lastIndexOf("\\") + 1);
                                                                        paths.push(path);
                                                                        pathsPsql += `"${path}",`;
                                                                        fs.copyFileSync(`${__dirname}/temp/${path}`, `${__dirname}/excursion/${value[0].id}/${fields[1]}/${path}`);
                                                                        fs.unlinkSync(`${__dirname}/temp/${path}`);
                                                                    }
                                                                    pathsPsql = pathsPsql.slice(0, pathsPsql.length - 1);
                                                                    pathsPsql += `}'`;

                                                                    db.addPaths(client, pathsPsql, paths.length, fields[1]).then(value2 => {
                                                                        if (value2 != -1) {
                                                                            let mes = {status: "ok"};
                                                                            res.statusCode = 200;
                                                                            res.end(global.JSON.stringify(mes));
                                                                        }
                                                                    })
                                                                } else {
                                                                    if(value1 != undefined ) {
                                                                        let mes = {status: "ok"};
                                                                        res.statusCode = 200;
                                                                        res.end(global.JSON.stringify(mes));
                                                                    }
                                                                }
                                                            })
                                                        }
                                                    });
                                                } else {
                                                    let mes = {status: "error format map"};
                                                    res.statusCode = 200;
                                                    res.end(global.JSON.stringify(mes));
                                                }

                                            }
                                        }
                                    } else {
                                        mes = {
                                            status: 'wrong type maxNumber',
                                        };
                                        res.statusCode = 200;
                                        res.end(global.JSON.stringify(mes));
                                    }

                                }

                            }
                        });


                    });

                    form.parse(req);


                    break;
                }

                default:
                    notFound(res);
                    break;
            }
        }
    }
    )
;


function returnFile(path, res) {
    fs.readFile(path, (err, resul) => {
        if (err) {
            res.statusCode = 404;
            returnFile(__dirname + '/not_found.html', res);
        } else {

            res.write(resul);
            res.end();
        }
    });
}


server.listen(port, host, () => {
    console.log('Start server')
});