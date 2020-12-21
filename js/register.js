
$("form").submit( () =>  {
    event.preventDefault()
});

function sendDataForServer() {
    removeAlert("#alertDanger", "d-block");
    addAlert("#alertDanger", "d-none");
    let regexp = /[^а-яА-Яa-zA-Z]/;
    let lastName = $("#inputLastName").val();
    let firstName = $("#inputFirstName").val();
    let email = $("#inputEmail").val();
    let password = $("#inputPassword").val();
    let confirmPassword = $("#inputConfirmPassword").val();
    let flag = true;

    if(regexp.test(lastName) || regexp.test(firstName)){
        $("#alertDanger").html("Фамилия, имя должны быть кириллицей или латиницей");
        addAlert("#alertDanger", "d-block");
    } else{

        if(lastName.length === 0) {
            $("#inputLastName")[0].classList.add("is-invalid");
            flag = false;
        }
        else {
            $("#inputLastName")[0].classList.remove("is-invalid");
        }

        if(firstName.length === 0 ){
            $("#inputFirstName")[0].classList.add("is-invalid");
            flag = false;
        } else {
            $("#inputFirstName")[0].classList.remove("is-invalid");
        }

        if(email.length === 0 || email.indexOf("@") === -1){
            $("#inputEmail")[0].classList.add("is-invalid");
            flag = false;
        } else{
            $("#inputEmail")[0].classList.remove("is-invalid");
        }

        if(password.length === 0){
            $("#inputPassword")[0].classList.add("is-invalid");
            flag = false;
        } else{
            $("#inputPassword")[0].classList.remove("is-invalid");
        }

        if(confirmPassword.length === 0 || password !== confirmPassword){
            $("#inputConfirmPassword")[0].classList.add("is-invalid");
            flag = false;
        } else {
            $("#inputConfirmPassword")[0].classList.remove("is-invalid");
        }

        if(flag) {

            let data = JSON.stringify({
                lastName: lastName,
                firstName: firstName,
                email: email,
                password: password,
                confirmPassword: confirmPassword
            });

            $.ajax({
                url: "/ajax/get_data_register",
                dataType: "json",
                method: "POST",
                data: data,
                success: (r) => {
                    console.log(r['status']);
                    switch (r['status']) {
                        case 'ok':
                            document.cookie = `token=${r.token}`;
                            document.location.href = `/lk`;
                            break;
                        case 'mail is busy':
                            $("#alertDanger").html("Почта уже занята");
                            addAlert("#alertDanger", "d-block");
                            break;
                        case 'different passwords':
                            $("#alertDanger").html("Повторный пароль не совпадает с основным");
                            addAlert("#alertDanger", "d-block");
                            break;
                        case "empty fields":{
                            if(r['firstName'] === 1) {
                                $("#inputFirstName")[0].classList.add("is-invalid");
                            }
                            if(r['lastName'] === 1){
                                $("#inputLastName")[0].classList.add("is-invalid");
                            }
                            if(r['email'] === 1) {
                                $("#inputEmail")[0].classList.add("is-invalid");
                            }
                            if(r['password'] === 1){
                                $("#inputPassword")[0].classList.add("is-invalid");
                            }
                            if(r['confirmPassword'] === 1){
                                $("#inputConfirmPassword")[0].classList.add("is-invalid");
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

function addAlert(id, display) {
    $(id)[0].classList.add(display);
}

function removeAlert(id, display) {
    $(id)[0].classList.remove(display);
}