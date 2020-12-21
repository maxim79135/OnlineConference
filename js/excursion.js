

function openModal(id){
    var source   = $("#template-modal").html();
    var template = Handlebars.compile(source);
    var html  = template({id: id});
    $('#myModal').append(html);
    $("#exampleModalCenter").modal('show');
    $("#inputPhone").mask("+7 (999) 999-99-99");
}


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