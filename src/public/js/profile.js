$("#btn-change-pass").click(function(){
    $("#profile__password").removeClass("hide");
    $("#input-password").removeAttr("disabled");
    $("#input-password").val("");
})
validator('.form-profile',{
    formGroup: '.form-group',
    formMessage: '.form-message-error',
    onSubmit: function(formValues){
        if(formValues.cPassword != formValues.nPassword){
            Toast.fire({
                icon: 'error',
                title: 'Nhập lại mật khẩu không chính xác !',
                background: 'rgba(220, 52, 73, 0.9)',
                color: '#ffffff',
                timer: 1300
            })
            return;
        }
        if(formValues.cPassword!="" && formValues.nPassword!="" && (formValues.nPassword.length < 4 || formValues.nPassword.length>20)){
            Toast.fire({
                icon: 'error',
                title: 'Mật khẩu phải từ 4 tới 20 ký tự !',
                background: 'rgba(220, 52, 73, 0.9)',
                color: '#ffffff',
                timer: 1300
            })
            return;
        }
        console.log(formValues);
        $.post('/profile',formValues, function(data){
            if(data.status==1){
                Toast.fire({
                    icon: 'success',
                    title: data.msg,
                    background: 'rgba(35, 147, 67, 0.9)',
                    color: '#ffffff',
                    timer: 1500,
                    didClose: () => {
                        setCookie("rememberToken","",-(3*60*61));
                        setCookie('accessToken',"",-41);
                        setCookie('refreshToken',"",-100);
                        location.href = "/";
                    }
                })
            }else{
                Toast.fire({
                    icon: 'error',
                    title: data.msg,
                    background: 'rgba(220, 52, 73, 0.9)',
                    color: '#ffffff',
                    timer: 1300
                })
            }
        })
    }
});