$("#show-passwpord").click(function(){
    if($(this).is(':checked')){
        $('#password').attr('type','text');
        $('#cPassword').attr('type','text');
    }else{
        $('#password').attr('type','password');
        $('#cPassword').attr('type','password');
    }
})
$(".btn-verify").click(function(){
    let email = $("#email").val();
    $.post("/forgot/verify",{email},function(data){
        if(data!="" && data!=null){
            if(data.status==1){
                Toast.fire({
                    icon: 'success',
                    title: data.msg,
                    background: 'rgba(35, 147, 67, 0.9)',
                    color: '#ffffff',
                    timer: 1800,
                })
            }else{
                Toast.fire({
                    icon: 'error',
                    title: data.msg,
                    background: 'rgba(220, 52, 73, 0.9)',
                    color: '#ffffff',
                    timer: 1800
                })
            }
        }
    });
})
validator('.form-verify',{
    formGroup: '.form-group',
    formMessage: '.form-message-error',
    onSubmit: function(formValues){
        $.post('/forgot/change',formValues, function(data){
            if(data!="" && data!=null){
                if(data.status==1){
                    Toast.fire({
                        icon: 'success',
                        title: data.msg,
                        background: 'rgba(35, 147, 67, 0.9)',
                        color: '#ffffff',
                        timer: 1800,
                    })
                }else{
                    Toast.fire({
                        icon: 'error',
                        title: data.msg,
                        background: 'rgba(220, 52, 73, 0.9)',
                        color: '#ffffff',
                        timer: 1800
                    })
                }
            }
        })            
    }
});