const moment = require('moment');



let getUsers = function (client){
    return new Promise((resolve, reject) => {
        client.query('SELECT * FROM users', (err, res) => {
            resolve(res);
        });
    });
};


let getExcursion = function (client, dateStart, dateEnd, count, typeSort){
    return new Promise((resolve, reject) => {
        let str = "select ex.id, title, description, date_start, date_end, g.id as guide_id, g.first_name, g.last_name, g.middle_name, " +
            "(select p.path from paths p where p.id = ep.path_id limit 1), " +
            "(select ex.number_of_seats-count(*) from records r where  r.excursion_id = ex.id) as count " +
            "from excursions ex " +
            "inner join guid_excursion ge on ex.id = ge.excursion_id " +
            "inner  join guides g on ge.guide_id = g.id " +
            "inner join excursion_path ep on ex.id = ep.excursion_id "
            + "WHERE " + "date_start >= '" + dateStart + "' and date_end <= '" + dateEnd + "' "
            + "ORDER BY date_start " + typeSort + " limit "+ 5 +" offset " + count;

        client.query(str, (err, res) => {
            console.log(res)
            if(res.rows.length !== 0)
                for(let i = 0; i < res.rows.length; i++){
                    res.rows[i].date_start = moment(res.rows[i].date_start).format('DD.MM.YYYY');
                    res.rows[i].date_end = moment(res.rows[i].date_end).format('DD.MM.YYYY');
                }

            resolve(res);
        });

    });
};


let addUsers = function(client, lastName, firstName, middleName, mail, excursionId) {
    return new Promise( ((resolve, reject) => {
        let str = "select add_user('" +
            lastName + "', '" +
            firstName +"', '" +
            middleName + "', '" +
            mail + "', " +
            excursionId + ");";
        client.query(str, (err, res) => {
            console.log(err);
            resolve(res);
        });
    }))
};

let getExcursionOne = function(client, excursionId){
    return new Promise((resolve, reject) => {
        let str ="select ex.id, title, description, date_start, date_end, script_map, number_of_seats, g.id as guide_id, g.last_name, g.first_name, g.middle_name, p.path,\n" +
            "(select count(*) from excursions ex inner join records r on ex.id = r.excursion_id where ex.id = " + excursionId +")\n" +
            "FROM excursions ex\n" +
            "inner join guid_excursion ge on ex.id = ge.excursion_id\n" +
            "inner join guides g on ge.guide_id = g.id\n" +
            "inner join excursion_path ep on ex.id = ep.excursion_id\n" +
            "inner join paths p on ep.path_id = p.id\n" +
            "WHERE ex.id = " + excursionId;
        client.query(str, (err, res) => {
            if(err) console.log(err);
            console.log(res);
            resolve(res);
        });
    })
};

function addGuide(client, lastName, firstName, email, hash, token){
    console.log("addGuide")
    let promise = new Promise((resolve, reject) => {
        let str = "select id from guides where mail = '" + email + "'";
        client.query(str, (err, res) => {
            if(err) console.log(err);

            console.log(res.rows.length)
            if(res.rows.length != 0)
                resolve(-1);

            let str = "insert into guides (last_name, first_name, mail, hash, token) " +
                "VALUES ('" + lastName + "', '" + firstName + "', '" + email + "', '" + hash + "', '" + token + "') returning id";
            client.query(str, (err, res) => {
                if(err) console.log(err);
                console.log(res)
                if(res)
                    resolve(res.rows[0].id);
                else
                    resolve(-1);
            })
        });

    })
    console.log(promise)
    return promise
}


function getInfo(client, token){
    return new Promise((resolve, reject) => {
        let str = "select g.id, g.last_name, g.first_name, g.middle_name, g.mail, g.token from guides g where token = '"
            + token + "'";
        //console.error(str);
        client.query(str, (err, res) => {
            if(err) console.log(err);
            console.error(res);
            resolve(res.rows);
        })
    })
}


function getExcursionForGuide(client, guideId, count, offset){
    return new Promise((resolve, reject) => {
        let str;
        if(!isNaN(guideId))
            str = "select e.id, e.title, e.description, e.date_start, e.date_end, e.script_map, (select e.number_of_seats-count(*) from records r where  r.excursion_id = e.id) as count " +
                "from guid_excursion ge " +
                "inner join excursions e on ge.excursion_id = e.id " +
                "where ge.guide_id = " + guideId + " offset " + offset + " limit " + count;
        else
            str = "select e.id, e.title, e.description, e.date_start, e.date_end, e.script_map, (select e.number_of_seats-count(*) from records r where  r.excursion_id = e.id) as count " +
                "from guid_excursion ge " +
                "inner join excursions e on ge.excursion_id = e.id " +
                "inner join guides g on ge.guide_id = g.id " +
                "where g.token = '" + guideId + "' offset " + offset + " limit " + count;


        client.query(str, (err, res) => {
            if(err) console.log(err);

            if(res.rowCount != 0){
                let start = res.rows[0].id, end = 1;
                for(let item of res.rows){
                    if(item.id < start)
                        start = item.id;
                    if(item.id > end)
                        end = item.id;
                }
                    let str = "select last_name, first_name, middle_name, mail, r.excursion_id from records r " +
                        "inner join users u on r.user_id = u.id " +
                        "where r.excursion_id = " + res.rows[0].id + " and r.excursion_id between " + start + " and " + end +" limit " + count;
                    client.query(str, (err, response)  => {
                        let excursion = [];
                        for(let exc of res.rows){
                            let exc_user = [];

                            for(let user of response.rows){
                                if(exc.id == user.excursion_id){
                                    exc_user.push({
                                        lastName: user.last_name,
                                        firstName: user.first_name,
                                        middleName: user.middle_name,
                                        mail: user.mail,
                                    })
                                }
                            }

                            excursion.push({
                                id: exc.id,
                                title: exc.title,
                                description: exc.description,
                                dateStart: moment(exc.date_start).format('DD.MM.YYYY, h:mm'),
                                dateEnd: moment(exc.date_end).format('DD.MM.YYYY, h:mm'),
                                count: exc.count,
                                Url: exc.script_map,
                                users: exc_user
                            })
                        }
                        resolve(excursion);
                    });
            }else{
                resolve(res.rows);
            }
        })
    })
}


function updateGuide(client, lastName, firstName, middleName, mail, hash, token, oldToken){
    return new Promise((resolve, reject) => {
        let middleName1 = ", middle_name = '" + middleName + "',";
        let hash1 = hash != undefined ? ", hash = '" + hash + "'," : '';
        let token1 = token != undefined ? ", token = '" + token + "'" : '';

        let str = "update guides " +
            "SET first_name = '" + firstName + "', last_name = '"
            + lastName + "'"
            + middleName1
            + "mail='" + mail + "'"
            + hash1
            + token1
            + " WHERE token = '" + oldToken + "'";

        console.log(str)
        client.query(str, (err, res) =>{
            if(err) console.log(err);
            resolve(res);
        });
    })
}


function deleteExcursion(client, excursionId){
    return new Promise((resolve, reject) => {
        let str = "select delete_excursion(" + excursionId + ")";
        client.query(str, (err, res) =>{
            if(err) console.log(err);
            resolve(res)
        })
    })
}


function addExcursion(client, title, description, dateStart, dateEnd, count, scriptMap, path, guideId){
    return new Promise((resolve, reject) => {
        let str = "select add_excursion('" + title +"'::text, '" + description + "'::text, '" 
            + dateStart + "'::date, '" + dateEnd + "'::date, '" + scriptMap + "'::text, " +count + ", '" + path + "'::text, " + guideId + ")";
        client.query(str, (err, res) =>{
            if(err) console.log(err);

            resolve(res.rows[0].add_excursion)

        })
    })
}


function addPaths(client, paths, n, exId){
    return new Promise((resolve, reject) => {
        let str = "select add_paths(" + paths + ", " + n + ", " + exId + ");";
        client.query(str, (err, res) => {
            if(err) console.log(err);

            resolve(res.rows[0].add_paths)
        })
    })
}


function getExcursionForEdit(client, id){
    return new Promise((resolve, reject) => {
        let str = "select e.id, e.title, e.description, e.date_start, e.date_end, e.path_images, e.script_map, e.number_of_seats\n" +
            "from excursions e\n" +
            "where e.id = " + id;
        client.query(str, (err, res) => {
            if(err) console.log(err);

            resolve(res);
        })

    })
}


function getPaths(client, exId){
    return new Promise((resolve, reject) => {
        let str = "select p.id, p.path from paths p " +
            "inner join excursion_path ep on p.id = ep.path_id " +
            "where ep.excursion_id = " + exId;
        client.query(str, (err, res) => {
            if(err) console.log(err);

            resolve(res);
        })
    })
}


function deletePath(client, id){
    return new Promise((resolve, reject) => {
        let str = "select delete_path(" + id + ")";
        client.query(str, (err, res) => {
            if(err) console.log(err);

            resolve(res);
        })
    })
}


function updateConference(client, id, title, description, dateStart, dateEnd, numberOfSeats, scriptMap){
    return new Promise((resolve, reject) => {
        let str = "update excursions " +
            "set title = '"+ title +"'," +
            "description = '"+ description +"'," +
            "date_start = '"+ dateStart +"'," +
            "date_end = '"+ dateEnd +"'," +
            "number_of_seats = "+ numberOfSeats +"," +
            "script_map = '"+ scriptMap +"'" +
            "where id = " + id;
        client.query(str, (err, res) => {
            if(err) console.log(err);

            resolve(res);
        })
    })
}

function getMail(client, mail){
    return new Promise((resolve, reject) => {
        let str = "select token, hash from guides where mail = '" + mail + "'";
        client.query(str, (err, res) => {
            if(err) console.log(err);

            resolve(res);
        })
    })
}


function getPathsCount(client, exId){
    return new Promise((resolve, reject) => {
        let str = "select count(id) from excursion_path where excursion_id = " + exId + "";
        client.query(str, (err, res) => {
            if(err) console.log(err);

            resolve(res);
        })
    })
}


module.exports.getPathsCount = getPathsCount;
module.exports.getMail = getMail;
module.exports.updateConference = updateConference;
module.exports.deletePath = deletePath;
module.exports.getPaths = getPaths;
module.exports.getExcursionForEdit = getExcursionForEdit;
module.exports.addPaths = addPaths;
module.exports.addExcursion = addExcursion;
module.exports.deleteExcursion = deleteExcursion;
module.exports.updateGuide = updateGuide;
module.exports.addGuide = addGuide;
module.exports.getUsers = getUsers;
module.exports.GetExcursion = getExcursion;
module.exports.addUsers = addUsers;
module.exports.getExcursionOne = getExcursionOne;
module.exports.getInfo = getInfo;
module.exports.getExcursionOne = getExcursionOne;
module.exports.getExcursionForGuide = getExcursionForGuide;