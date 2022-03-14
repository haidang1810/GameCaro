$(window).on('load',function(){
    validator('.form-login',{
        formGroup: '.form-group',
        formMessage: '.form-message',
        onSubmit: function(formValues){
            $.post("/",formValues, function(data){
                if(data!="" && data!=null){
                    if(data.status==1){
                        if(data.cookie!="")
                        setCookie('rememberToken',data.cookie,3*60*60);
                        setCookie('accessToken',data.accessToken,40);
                        setCookie('refreshToken',data.refreshToken);
                        location.href = "/room";
                    }else{
                        Toast.fire({
                            icon: 'error',
                            title: data.msg,
                            background: 'rgba(220, 52, 73, 0.9)',
                            color: '#ffffff',
                            timer: 2500
                        })
                    }
                }
            })
        }
    });
})