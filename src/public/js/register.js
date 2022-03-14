$(window).on('load',function(){
    $("#show-passwpord").click(function(){
        if($(this).is(':checked')){
            $('#password').attr('type','text');
        }else{
            $('#password').attr('type','password');
        }
    })
    validator('.form-register',{
        formGroup: '.form-group',
        formMessage: '.form-message',
        onSubmit: function(formValues){
            $.post('/register',formValues, function(data){
                if(data!="" && data!=null){
                    if(data.status==1){
                        setCookie('accessToken',data.accessToken,40);
                        setCookie('refreshToken',data.refreshToken);
                        Toast.fire({
                            icon: 'success',
                            title: 'Đăng ký thành công đang đăng nhập',
                            background: 'rgba(35, 147, 67, 0.9)',
                            color: '#ffffff',
                            timer: 2000,
                            didClose: () => {
                                location.href = '/room';
                            }
                        })
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

