
$("form").submit( () =>  {
    event.preventDefault()
});


function signIn() {

    replaceAlert("#alertDanger", "d-block","d-none");

    let email = $("#inputEmail").val();
    let password = $("#inputPassword").val();
    let flag = true;


    if(email.length == 0 || email.indexOf("@") == -1){
        $("#inputEmail")[0].classList.add("is-invalid");
        flag = false;
    } else{
        $("#inputEmail")[0].classList.remove("is-invalid");
    }

    if(password.length == 0){
        $("#inputPassword")[0].classList.add("is-invalid");
        flag = false;
    } else{
        $("#inputPassword")[0].classList.remove("is-invalid");
    }

    if(flag) {

        let data = JSON.stringify({
            email: email,
            password: password,
        });


        $.ajax({
            url: "/ajax/get_data_sigin",
            dataType: "json",
            method: "POST",
            data: data,
            success: (r) => {
                console.log(r);
                switch (r['status']) {
                    case 'ok':
                        document.cookie = `token=${r.token}`;
                        document.location.href = `/lk`;
                        break;
                    case 'wrong data':
                        $("#replaceAlert").html("Неверный логин или пароль");
                        replaceAlert("#alertDanger", "d-none","d-block");
                        break;

                    case "empty fields":{
                        if(r['mail'] == 1) {
                            $("#inputEmail")[0].classList.add("is-invalid");
                        }
                        if(r['password'] == 1){
                            $("#inputPassword")[0].classList.add("is-invalid");
                        }

                    }
                }
            },
        });
    }
}

function replaceAlert(id, tokenOld, tokenNew) {
    $(id)[0].classList.replace(tokenOld, tokenNew);
}