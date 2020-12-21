let token;
let count;
let id;

$(document).ready(function () {

    token = $.cookie('token');
    count = parseInt($('#secretInput')[0].innerText);
    id = parseInt($('#secretInputId')[0].innerText);
    isCount();

});

$("form").submit(() => {
    event.preventDefault()
});

function isCount() {
    if (count >= 5) {
        $("#blockFile")[0].classList.add("d-none");
    } else {
        $('#feedback')[0].innerText = `Выберете от 1 до ${5 - count} файлов`;
    }
}

$('#myFile').change(function () {
    if ($(this).val() !== '')
        $(this).prev().text('Выбрано файлов: ' + $(this)[0].files.length);
    else
        $(this).prev().text('Выберите файлы');

    let button = $('.submit');
    var number_of_images = $(this)[0].files.length;
    if (number_of_images > 5 - count) {
        $("#myFile")[0].classList.add("is-invalid");
        $(this).val('');
        button.prop('disabled', 'disabled');

    } else {
        $("#myFile")[0].classList.remove("is-invalid");
        button.prop('disabled', false);
    }
});


function openModal(id, path) {
    $('#myModal').empty();

    $.ajax({
        url: "/ajax/get_modal",
        dataType: "json", // Для использования JSON формата получаемых данных
        method: "POST", // Что бы воспользоваться POST методом, меняем данную строку на POST
        data: JSON.stringify({token: token}),
        success: (r) => {
            if (r['status'] === 'ok') {
                var template = Handlebars.compile(r.data);
                var html = template({id: id, path: path});
                $('#myModal').append(html);
                $("#exampleModalCenter").modal('show');

            }
        }
    });
}

function deleteImage(id) {

    $.ajax({
        url: "/ajax/delete_image",
        dataType: "json", // Для использования JSON формата получаемых данных
        method: "POST", // Что бы воспользоваться POST методом, меняем данную строку на POST
        data: JSON.stringify({token: token, id: id}),
        success: (r) => {
            console.log(r);
            if (r['status'] === 'ok') {
                $('#image' + id).remove();
                $("#exampleModalCenter").modal('hide');

                $("#blockFile")[0].classList.remove("d-none");
                $("#blockFile")[0].classList.add("d-block");
                count -= 1;
                isCount();
            }
        }
    });
}


function editExcursion() {
    replaceAlert("#alertDanger", "d-block", "d-none");
    event.preventDefault();

    $("#myFile")[0].classList.remove("is-invalid");
    let formData = new FormData(document.forms.person);
    let title = $("#inputTitle").val();
    let description = $("#inputDescription").val();
    let dateStart = $("#dateStart").val();
    let dateEnd = $("#dateEnd").val();
    let maxNumber = $("#inputNumberOfSeats").val();
    let Гкд = $("#inputUrl").val();
    let flag = true;

    if (title.length === 0) {
        $("#inputTitle")[0].classList.add("is-invalid");
        flag = false;
    } else {
        $("#inputTitle")[0].classList.remove("is-invalid");
    }
    if (description.length === 0) {
        $("#inputDescription")[0].classList.add("is-invalid");
        flag = false;
    } else {
        $("#inputDescription")[0].classList.remove("is-invalid");
    }
    if (dateStart.length === 0) {
        $("#dateStart")[0].classList.add("is-invalid");
        flag = false;
    } else {
        $("#dateStart")[0].classList.remove("is-invalid");
    }
    if (dateEnd.length === 0) {
        $("#dateEnd")[0].classList.add("is-invalid");
        flag = false;
    } else {
        $("#dateEnd")[0].classList.remove("is-invalid");
    }
    if (maxNumber.length === 0) {
        $("#inputNumberOfSeats")[0].classList.add("is-invalid");
        flag = false;
    } else {
        $("#inputNumberOfSeats")[0].classList.remove("is-invalid");
    }
    if (Url.length === 0) {
        $("#inputUrl")[0].classList.add("is-invalid");
        flag = false;
    } else {
        $("#inputUrl")[0].classList.remove("is-invalid");
    }
    if (flag) {
        formData.append("token", $.cookie('token'));
        formData.append("id", $('#secretInputId')[0].innerText);
        formData.append("title", title);
        formData.append("description", description);
        formData.append("dateStart", dateStart);
        formData.append("dateEnd", dateEnd);
        formData.append("maxNumber", maxNumber);
        formData.append("Url", Url);
        for (let item of document.getElementById("myFile").files) {
            formData.append("files", item);
        }

        var source = $("#template-loader").html();
        var template = Handlebars.compile(source);
        var html = template({});
        $('#loader').append(html);

        $.ajax({
            url: "/ajax/edit_excursion",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            dataType: "json",
            success: (r) => {
                switch (r['status']) {
                    case "ok": {
                        location.href = "/lk";
                        break;
                    }
                    case "wrong type maxNumber": {
                        $("#alertDanger").html("Количество поситителей целое число");
                        replaceAlert("#alertDanger", "d-none", "d-block");
                        $('#loader').remove();
                        break;
                    }
                    case "error range files": {
                        $("#alertDanger").html("Количество файлов должно быть от 1 до 5");
                        replaceAlert("#alertDanger", "d-none", "d-block");
                        $('#loader').remove();
                        break;
                    }
                    case "error range maxNumber": {
                        $("#alertDanger").html("Количество поситителей от 1 до 100");
                        replaceAlert("#alertDanger", "d-none", "d-block");
                        $('#loader').remove();
                        break;
                    }
                    case "error range": {
                        $("#alertDanger").html("Неверная дата. Дата должна быть больше текущей но меньше 2100");
                        replaceAlert("#alertDanger", "d-none", "d-block");
                        $('#loader').remove();
                        break;
                    }
                    case "error dates": {
                        $("#alertDanger").html("Дата окончания конференции не должна быть меньше даты начала");
                        replaceAlert("#alertDanger", "d-none", "d-block");
                        $('#loader').remove();
                        break;
                    }
                    case "empty fields ": {
                        if (r['title'] === 1) {
                            $("#inputTitle")[0].classList.add("is-invalid");
                        }
                        if (r['description'] === 1) {
                            $("#inputDescription")[0].classList.add("is-invalid");
                        }
                        if (r['dateStart'] === 1) {
                            $("#dateStart")[0].classList.add("is-invalid");
                        }
                        if (r['dateEnd'] === 1) {
                            $("#dateEnd")[0].classList.add("is-invalid");
                        }
                        if (r['maxNumber'] === 1) {
                            $("#inputMaxNumber")[0].classList.add("is-invalid");
                        }
                        if (r['Url'] === 1) {
                            $("#inputUrl")[0].classList.add("is-invalid");
                        }
                        if (r['files'] === 1) {
                            $("#myFile")[0].classList.add("is-invalid");
                        }
                        $('#loader').remove();
                        break;
                    }
                }
            }
        });
    }

};

function replaceAlert(id, tokenOld, tokenNew) {
    $(id)[0].classList.replace(tokenOld, tokenNew);
}