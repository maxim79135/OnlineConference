let token;

$(document).ready(function () {

    token = $.cookie('token');
    openExcursion();
});


$("form").submit(() => {
    event.preventDefault()
});

function exitAccount() {
    $.removeCookie('token');
    document.location.href = `/`;
}


function openExcursion() {

    $.ajax({
        url: "/ajax/get_excursion",
        dataType: "json", // Для использования JSON формата получаемых данных
        method: "POST", // Что бы воспользоваться POST методом, меняем данную строку на POST
        data: JSON.stringify({token: token}),
        success: (r) => {
            console.log(r);
            if (r['status'] === 'ok') {

                var source = $("#template-excursion").html();
                var template = Handlebars.compile(source);
                var html = template(r);
                $('#mainContent').replaceWith(html);

                $("#aExcursion")[0].classList.add("active");
                $("#aPersonalData")[0].classList.remove("active");
            }
        }
    });
}

function openPersonalData() {
    $.ajax({
        url: "/ajax/get_personal_data",
        dataType: "json",
        method: "POST",
        data: JSON.stringify({token: token}),
        success: (r) => {
            console.log(r);
            if (r['status'] === 'ok') {

                var source = $("#template-personal-data").html();
                var template = Handlebars.compile(source);
                var html = template(r);
                $('#mainContent').replaceWith(html);
                $("#aExcursion")[0].classList.remove("active");
                $("#aPersonalData")[0].classList.add("active");
                $("#inputPhone").mask("+7 (999) 999-99-99");
            }
        }
    });
}


function savePersonalData() {

    let regexp = /[^а-яА-Яa-zA-Z]/;
    let lastName = $("#inputLastName").val();
    let firstName = $("#inputFirstName").val();
    let middleName = $("#inputMiddleName").val();
    let email = $("#inputEmail").val();
    let password = $("#inputPassword").val();
    let confirmPassword = $("#inputConfirmPassword").val();
    let flag = true;
    removeAlert("#alertPersonalData", "d-block");
    addAlert("#alertPersonalData", "d-none");
    removeAlert("#alertDanger", "d-block");
    addAlert("#alertDanger", "d-none");

    if(regexp.test(lastName) || regexp.test(firstName) || (regexp.test(middleName) && middleName.length != 0)){
        $("#alertDanger").html("Фамилия, имя, отчество должны быть кириллицей или латиницей");
        addAlert("#alertDanger", "d-block");
        flag = false;
    } else{
        if (lastName.length == 0) {
            $("#inputLastName")[0].classList.add("is-invalid");
            flag = false;
        } else {
            $("#inputLastName")[0].classList.remove("is-invalid");
        }

        if (firstName.length == 0) {
            $("#inputFirstName")[0].classList.add("is-invalid");
            flag = false;
        } else {
            $("#inputFirstName")[0].classList.remove("is-invalid");
        }

        if (email.length == 0 || email.indexOf("@") == -1) {
            $("#inputEmail")[0].classList.add("is-invalid");
            flag = false;
        } else {
            $("#inputEmail")[0].classList.remove("is-invalid");
        }

        if (password != confirmPassword) {
            $("#inputConfirmPassword")[0].classList.add("is-invalid");
            flag = false;
        } else {
            $("#inputConfirmPassword")[0].classList.remove("is-invalid");
        }

        if (flag) {

            let data = JSON.stringify({
                lastName: lastName,
                firstName: firstName,
                middleName: middleName,
                email: email,
                password: password,
                confirmPassword: confirmPassword,
                token: token
            });


            $.ajax({
                url: "/ajax/edit_personal_data",
                dataType: "json",
                method: "POST",
                data: data,
                success: (r) => {
                    console.log(r);
                    switch (r['status']) {
                        case 'ok': {
                            $.removeCookie('token');
                            $.cookie('token', r.token);
                            var source = $("#template-personal-data").html();
                            var template = Handlebars.compile(source);
                            var html = template(r);
                            $('#mainContent').replaceWith(html);
                            addAlert("#alertPersonalData", "d-block");
                            break;
                        }
                        case 'mail is busy': {
                            $("#alertDanger").html("Почта уже занята");
                            removeAlert("#alertDanger", "d-none");
                            addAlert("#alertDanger", "d-block");
                            break;
                        }
                        case 'different passwords': {
                            $("#alertDanger").html("Повторный пароль не совпадает с основным");
                            removeAlert("#alertDanger", "d-none");
                            addAlert("#alertDanger", "d-block");
                            break;
                        }
                        case "empty fields":{
                            if(r['firstName'] == 1) {
                                $("#inputFirstName")[0].classList.add("is-invalid");
                            }
                            if(r['lastName'] == 1){
                                $("#inputLastName")[0].classList.add("is-invalid");
                            }
                            if(r['email'] == 1) {
                                $("#inputEmail")[0].classList.add("is-invalid");
                            }
                            break;
                        }

                        case "bad param":{
                            $("#alertDanger").html("Фамилия, имя должны быть кириллицей или латиницей");
                            addAlert("#alertDanger", "d-block");
                            break;
                        }
                    }
                },
            });
        }
    }

}

function openModal(id) {
    $('#myModal').empty();
    var source = $("#template-modal").html();
    var template = Handlebars.compile(source);
    var html = template({id: id, title: $('#buttonTitle' + id).val()});
    $('#myModal').append(html);
    $("#exampleModalCenter").modal('show');
}


function deleteExcursion(id) {
    let data = JSON.stringify({
        excursionId: id
    });


    console.log(data);

    $.ajax({
        url: "/ajax/delete_excursion",
        dataType: "json",
        method: "POST",
        data: data,
        success: (r) => {
            console.log(r);
            if (r['status'] === 'ok') {
                $('#' + id).remove();
                $("#exampleModalCenter").modal('hide');
            }
        }
    });
}

function addAlert(id, display) {
    $(id)[0].classList.add(display);
}

function removeAlert(id, display) {
    $(id)[0].classList.remove(display);
}