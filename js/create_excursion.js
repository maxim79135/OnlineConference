$("form").submit(function () {
    replaceAlert("#alertDanger", "d-block","d-none");
    event.preventDefault();
    if($("#myFile").val() == ''){
        $("#myFile")[0].classList.add("is-invalid");
    } else{

        $("#myFile")[0].classList.remove("is-invalid");
        let formData = new FormData(document.forms.person);
        let title = $("#inputTitle").val();
        let description = $("#inputDescription").val();
        let dateStart = $("#dateStart").val();
        let dateEnd = $("#dateEnd").val();
        let maxNumber = $("#inputMaxNumber").val();
        let Url = $("#inputUrl").val();
        let flag = true;

        if(title.length == 0){
            $("#inputTitle")[0].classList.add("is-invalid");
            flag = false;
        } else{
            $("#inputTitle")[0].classList.remove("is-invalid");
        }
        if(description.length == 0){
            $("#inputDescription")[0].classList.add("is-invalid");
            flag = false;
        } else{
            $("#inputDescription")[0].classList.remove("is-invalid");
        }
        if(dateStart.length == 0){
            $("#dateStart")[0].classList.add("is-invalid");
            flag = false;
        } else{
            $("#dateStart")[0].classList.remove("is-invalid");
        }
        if(dateEnd.length == 0){
            $("#dateEnd")[0].classList.add("is-invalid");
            flag = false;
        } else{
            $("#dateEnd")[0].classList.remove("is-invalid");
        }
        if(maxNumber.length == 0){
            $("#inputMaxNumber")[0].classList.add("is-invalid");
            flag = false;
        } else{
            $("#inputMaxNumber")[0].classList.remove("is-invalid");
        }
        if(Url.length == 0){
            $("#inputUrl")[0].classList.add("is-invalid");
            flag = false;
        } else{
            $("#inputUrl")[0].classList.remove("is-invalid");
        }
        if(flag){
            formData.append("token", $.cookie('token'));
            formData.append("title", title);
            formData.append("description", description);
            formData.append("dateStart", dateStart);
            formData.append("dateEnd", dateEnd);
            formData.append("maxNumber", maxNumber);
            formData.append("Url", Url);
            for(let item of document.getElementById("myFile").files){
                formData.append("files", item);
            }

            var source = $("#template-loader").html();
            var template = Handlebars.compile(source);
            var html = template({});
            $('#loader').append(html);

            $.ajax({
                url: "/ajax/create_excursion",
                method: "POST",
                data: formData,
                processData : false,
                contentType : false,
                dataType: "json",
                success: (r) => {
                    console.log(r)
                    switch (r['status']) {
                        case "ok": {
                            location.href = "/lk";
                            break;
                        }
                        case "wrong type maxNumber": {
                            $("#alertDanger").html("Количество поситителей целое число");
                            replaceAlert("#alertDanger", "d-none","d-block");
                            $('#loader').remove();
                            break;
                        }
                        case "error range files": {
                            $("#alertDanger").html("Количество файлов должно быть от 1 до 5");
                            replaceAlert("#alertDanger", "d-none","d-block");
                            $('#loader').remove();
                            break;
                        }
                        case "error range maxNumber": {
                            $("#alertDanger").html("Количество поситителей от 1 до 100");
                            replaceAlert("#alertDanger", "d-none","d-block");
                            $('#loader').remove();
                            break;
                        }
                        case "error range": {
                            $("#alertDanger").html("Неверная дата. Дата должна быть больше текущей но меньше 2100");
                            replaceAlert("#alertDanger", "d-none","d-block");
                            $('#loader').remove();
                            break;
                        }
                        case "empty fields ": {
                            if(r['title'] == 1) {
                                $("#inputTitle")[0].classList.add("is-invalid");
                            }
                            if(r['description'] == 1){
                                $("#inputDescription")[0].classList.add("is-invalid");
                            }
                            if(r['dateStart'] == 1) {
                                $("#dateStart")[0].classList.add("is-invalid");
                            }
                            if(r['dateEnd'] == 1) {
                                $("#dateEnd")[0].classList.add("is-invalid");
                            }
                            if(r['maxNumber'] == 1){
                                $("#inputMaxNumber")[0].classList.add("is-invalid");
                            }
                            if(r['Url'] == 1) {
                                $("#Url")[0].classList.add("is-invalid");
                            }
                            if(r['files'] == 1) {
                                $("#myFile")[0].classList.add("is-invalid");
                            }
                            $('#loader').remove();
                            break;
                        }
                    }
                }
            });
        }
    }
});


$('#myFile').change(function () {
    if ($(this).val() != '')
        $(this).prev().text('Выбрано файлов: ' + $(this)[0].files.length);
    else
        $(this).prev().text('Выберите файлы');

    let button = $('.submit');
    var number_of_images = $(this)[0].files.length;
    if (number_of_images > 5) {
        $("#myFile")[0].classList.add("is-invalid");
        $(this).val('');
        button.prop('disabled', 'disabled');

    } else {
        $("#myFile")[0].classList.remove("is-invalid");
        button.prop('disabled', false);
    }


});

function replaceAlert(id, tokenOld, tokenNew) {
    $(id)[0].classList.replace(tokenOld, tokenNew);
}