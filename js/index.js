let loading = false;
let countElement = 0;
let typeSort = $("#selectSort").val();
let nowStr;
let dateStr;
let hasElements = true;


function getDateString(date) {
    let day = ("0" + date.getDate()).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    return date.getFullYear() + "-" + (month) + "-" + (day)
}

$(document).ready(function () {

    let now = new Date();
    nowStr = getDateString(now);
    $("#Today").val(nowStr);

    let date = new Date();
    date.setMonth(now.getMonth() + 5);
    dateStr = getDateString(date);
    $("#LastDay").val(dateStr);


    let auth = false;
    if($.cookie('token'))
        auth = true;

    var source   = $("#template-header").html();
    var template = Handlebars.compile(source);
    var html  = template({auth: auth});
    console.log(date)
    $('#aSigIn').append(html);

    load_items(nowStr, dateStr, typeSort);
});


function load_items(startDay, endDay, typeSort) {
    if (!loading) {
        loading = true;
        hasElements = true;
        let data = JSON.stringify({
            today: startDay,
            lastDay: endDay,
            typeSort: typeSort,
            countElement: countElement
        }
        );
        console.log(data)
        $.ajax({
            url: "/ajax/test",
            dataType: "json",
            method: "POST",
            data: data,
            success: (r) => {
                console.log(r)
                switch (r['status']) {
                    case "ok": {
                        countElement += r.count;
                        if(r.count < 5)
                        {
                            hasElements = false;
                        }
                        var source   = $("#template-card").html();
                        var template = Handlebars.compile(source);
                        var html  = template(r);
                        $('#contentCard').append(html);
                        $("#alertFilter")[0].classList.remove("d-block");
                        $("#alertFilter")[0].classList.add("d-none");
                        loading = false;
                        break;
                    }
                    case "invalid range":{
                        $("#alertFilter")[0].classList.remove("d-block");
                        $("#alertFilter")[0].classList.add("d-block");
                        break;
                    }
                }
            }
        });

    }
}


$("form").submit( () =>  {
    event.preventDefault()
});


function openModal(id){
    var source   = $("#template-modal").html();
    var template = Handlebars.compile(source);
    var html  = template({id: id});
    $('#myModal').append(html);
    $("#exampleModalCenter").modal('show');
    $("#inputPhone").mask("+7 (999) 999-99-99");
}

function acceptFilter(){
    console.log('click')
    countElement = 0;
    $('#contentCard').empty();
    nowStr = $("#Today").val();
    if(nowStr == ""){
        let now = new Date();
        nowStr = getDateString(now);
        $("#Today").val(nowStr);
    }
    dateStr = $("#LastDay").val();

    if(dateStr == ""){
        let date = new Date();
        date.setMonth(date.getMonth() + 3);
        dateStr = getDateString(date);
        $("#LastDay").val(dateStr);
    }

    load_items(nowStr, dateStr, typeSort)
}

$("#selectSort").change(() =>{
    countElement = 0;
    $('#contentCard').empty();
    typeSort = $("#selectSort").val();
    load_items(nowStr, dateStr, typeSort);
});

function sendDateForExcursion(id) {

    let regexp = /[^а-яА-Яa-zA-Z]/;
    addAlert('#alertSuccess', 'd-none');
    addAlert('#alertDanger', 'd-none');
    addAlert('#alertDangerParam', 'd-none');

    removeAlert('#alertDangerParam', 'd-block');
    removeAlert('#alertDanger', 'd-block');
    removeAlert('#alertSuccess', 'd-block');
    let lastName = $("#inputLastName").val();
    let firstName = $("#inputFirstName").val();
    let middleName = $("#inputMiddleName").val();
    let mail = $("#inputEmail").val();
    let excursionId = id;

    $("#inputLastName")[0].classList.remove("is-invalid");
    $("#inputFirstName")[0].classList.remove("is-invalid");
    $("#inputEmail")[0].classList.remove("is-invalid");



    if(lastName.length != 0 && firstName.length != 0 && mail.length != 0 && mail.indexOf("@") != -1){
        let flag = true;
        if(regexp.test(lastName)) {
            addAlert('#alertDangerParam', 'd-block');
            flag = false
        } if(regexp.test(firstName)){
            addAlert('#alertDangerParam', 'd-block');
            flag = false
        } if(regexp.test(middleName) && middleName.length != 0){
            addAlert('#alertDangerParam', 'd-block');
            flag = false
        }
        if(flag) {
            let data = JSON.stringify({
                lastName: lastName,
                firstName: firstName,
                middleName: middleName,
                mail: mail,
                excursionId: excursionId
            });

            $.ajax({
                url: "/ajax/get_data_user",
                dataType: "json",
                method: "POST",
                data: data,
                success: (r) => {
                    switch (r['status']) {
                        case "ok":{
                            addAlert('#alertSuccess', 'd-block');
                            break;
                        }
                        case "full": {
                            addAlert('#alertDanger', 'd-block');
                            break;
                        }
                        case "empty fields":{
                            $("#inputLastName")[0].classList.add("is-invalid");
                            $("#inputFirstName")[0].classList.add("is-invalid");
                            $("#inputEmail")[0].classList.add("is-invalid");
                            break;
                        }

                        case "bad param":{
                            addAlert('#alertDangerParam', 'd-none');
                            break;
                        }
                    }
                }
            });
        }
    }
    else {
        if(lastName.length == 0) {
            $("#inputLastName")[0].classList.add("is-invalid")
        }

        if(firstName.length == 0 ){
            $("#inputFirstName")[0].classList.add("is-invalid")
        }

        if(mail.length == 0 || mail.indexOf("@") == -1) {
            $("#inputEmail")[0].classList.add("is-invalid");
        }
        // $("#alertDanger").val("Заполнены не все поля! Заполните имя, фамилию и номер");
    }




};

function clearModal() {
    $("#inputLastName").val("");
    $("#inputFirstName").val("");
    $("#inputMiddleName").val("");
    $("#inputEmail").val("");

    $("#inputLastName")[0].classList.remove("is-invalid");
    $("#inputFirstName")[0].classList.remove("is-invalid");
    $("#inputEmail")[0].classList.remove("is-invalid");

    addAlert('#alertSuccess', 'd-none');
    addAlert('#alertDanger', 'd-none');
    addAlert('#alertDangerParam', 'd-none');
}

function addAlert(id, display) {
    $(id)[0].classList.add(display);
}

function removeAlert(id, display) {
    $(id)[0].classList.remove(display);
}

$(window).scroll(() => {
    if (hasElements && (parseInt($(window).scrollTop()) + parseInt($(window).height()) > parseInt($(document).height()) - 100)) {
        load_items(nowStr, dateStr, typeSort);
    }
});